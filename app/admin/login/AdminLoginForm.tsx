"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { resolveAdminMfaStep } from "@/lib/auth/adminMfa";
import { getCurrentAdminAccess } from "@/lib/auth/getCurrentAdminAccess";
import { supabase } from "@/lib/supabase/client";

type LoginStep = "checking" | "credentials" | "enroll" | "challenge";

type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "요청을 처리하지 못했습니다.";
}

export default function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(
    null,
  );
  const [enrollment, setEnrollment] =
    useState<TotpEnrollment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function checkExistingSession() {
      try {
        const access = await getCurrentAdminAccess();

        if (isCancelled) return;
        if (!access.user) {
          setStep("credentials");
          return;
        }

        if (!access.hasAdminRole) {
          router.replace("/");
          return;
        }

        const { data: factors, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        if (isCancelled) return;

        const factorId = factors.totp[0]?.id ?? null;
        const nextStep = resolveAdminMfaStep({
          hasAdminRole: access.hasAdminRole,
          currentLevel: access.currentLevel,
          verifiedTotpFactorId: factorId,
        });

        if (nextStep === "authorized") {
          router.replace("/admin");
          return;
        }

        if (nextStep === "challenge") {
          setVerifiedFactorId(factorId);
          setStep("challenge");
          return;
        }

        setStep("enroll");
      } catch (error) {
        console.error("Failed to check the admin MFA session", error);
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error));
          setStep("credentials");
        }
      }
    }

    void checkExistingSession();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  async function routeSignedInAdmin() {
    const access = await getCurrentAdminAccess();
    if (!access.user || !access.hasAdminRole) {
      await supabase.auth.signOut();
      throw new Error("관리자 권한이 없는 계정입니다.");
    }

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;

    const factorId = factors.totp[0]?.id ?? null;
    const nextStep = resolveAdminMfaStep({
      hasAdminRole: access.hasAdminRole,
      currentLevel: access.currentLevel,
      verifiedTotpFactorId: factorId,
    });

    if (nextStep === "authorized") {
      router.replace("/admin");
      return;
    }

    setTotpCode("");
    setErrorMessage(null);

    if (nextStep === "challenge" && factorId) {
      setVerifiedFactorId(factorId);
      setStep("challenge");
      return;
    }

    setStep("enroll");
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.session) {
        throw new Error("로그인은 처리됐지만 세션이 생성되지 않았습니다.");
      }

      await routeSignedInAdmin();
    } catch (error) {
      console.error("Admin password login failed", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartEnrollment() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const access = await getCurrentAdminAccess();
      if (!access.user || !access.hasAdminRole) {
        throw new Error("관리자 권한이 없는 계정입니다.");
      }

      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      if (factors.totp[0]) {
        setVerifiedFactorId(factors.totp[0].id);
        setStep("challenge");
        return;
      }

      const unfinishedTotpFactors = factors.all.filter(
        (factor) =>
          factor.factor_type === "totp" && factor.status === "unverified",
      );

      for (const factor of unfinishedTotpFactors) {
        const { error: unenrollError } =
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (unenrollError) throw unenrollError;
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Festibom Admin",
      });
      if (error) throw error;

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setTotpCode("");
    } catch (error) {
      console.error("Admin TOTP enrollment failed", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyTotp(factorId: string) {
    const code = totpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      throw new Error("인증 앱의 6자리 코드를 입력해 주세요.");
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) throw verifyError;

    const access = await getCurrentAdminAccess();
    if (!access.isAdmin || access.currentLevel !== "aal2") {
      throw new Error("2단계 인증 세션을 확인하지 못했습니다.");
    }

    router.replace("/admin");
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const factorId = enrollment?.factorId ?? verifiedFactorId;
      if (!factorId) throw new Error("인증 수단을 찾지 못했습니다.");
      await verifyTotp(factorId);
    } catch (error) {
      console.error("Admin TOTP verification failed", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setEnrollment(null);
    setVerifiedFactorId(null);
    setTotpCode("");
    setStep("credentials");
  }

  if (step === "checking") {
    return <p className="text-sm text-ink-muted">접근 권한 확인 중...</p>;
  }

  if (step === "credentials") {
    return (
      <form onSubmit={handlePasswordLogin} className="mt-8 space-y-5">
        <FieldLabel label="이메일" htmlFor="email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
            className="mt-2 w-full rounded-xl border border-line-strong px-4 py-3 outline-none focus:border-slate-900"
          />
        </FieldLabel>
        <FieldLabel label="비밀번호" htmlFor="password">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-line-strong px-4 py-3 outline-none focus:border-slate-900"
          />
        </FieldLabel>
        <ErrorMessage message={errorMessage} />
        <SubmitButton isSubmitting={isSubmitting} label="로그인" />
      </form>
    );
  }

  if (step === "enroll" && !enrollment) {
    return (
      <div className="mt-8 space-y-5">
        <p className="text-sm leading-6 text-ink-secondary">
          관리자 계정을 보호하려면 인증 앱 등록이 필요합니다. 등록 후에는
          새 브라우저 로그인이나 세션 만료 시에만 코드를 입력합니다.
        </p>
        <ErrorMessage message={errorMessage} />
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleStartEnrollment()}
          className="w-full rounded-xl bg-surface-dark px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? "준비 중..." : "인증 앱 등록 시작"}
        </button>
        <SecondaryButton onClick={() => void handleSignOut()} label="로그아웃" />
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="mt-8 space-y-5">
      {enrollment ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-ink-secondary">
            Google Authenticator, Microsoft Authenticator 등의 인증 앱으로 QR
            코드를 스캔하세요.
          </p>
          <div className="flex justify-center rounded-2xl bg-white p-4">
            {/* Supabase Auth returns a trusted, session-bound SVG data URI. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enrollment.qrCode} alt="관리자 TOTP 등록 QR 코드" className="size-52" />
          </div>
          <details className="rounded-xl border border-line px-4 py-3 text-sm text-ink-secondary">
            <summary className="cursor-pointer font-semibold">수동 등록 키 보기</summary>
            <code className="mt-3 block break-all">{enrollment.secret}</code>
          </details>
        </div>
      ) : (
        <p className="text-sm leading-6 text-ink-secondary">
          인증 앱에 표시된 6자리 코드를 입력하세요.
        </p>
      )}
      <FieldLabel label="인증 코드" htmlFor="totp-code">
        <input
          id="totp-code"
          type="text"
          value={totpCode}
          onChange={(event) =>
            setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          className="mt-2 w-full rounded-xl border border-line-strong px-4 py-3 text-center text-2xl tracking-[0.35em] outline-none focus:border-slate-900"
        />
      </FieldLabel>
      <ErrorMessage message={errorMessage} />
      <SubmitButton isSubmitting={isSubmitting} label="인증 완료" />
      <SecondaryButton onClick={() => void handleSignOut()} label="로그아웃" />
    </form>
  );
}

function FieldLabel({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-secondary">
      {label}
      {children}
    </label>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <p className="text-sm font-medium text-red-600">{message}</p>
  ) : null;
}

function SubmitButton({
  isSubmitting,
  label,
}: {
  isSubmitting: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full rounded-xl bg-surface-dark px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      {isSubmitting ? "처리 중..." : label}
    </button>
  );
}

function SecondaryButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-line-strong px-5 py-3 font-semibold text-ink-secondary"
    >
      {label}
    </button>
  );
}
