import { NextResponse } from "next/server";

import {
  ACCOUNT_DELETION_CONFIRMATION,
  isRecentAccountSignIn,
  parseAccountDeletionRequest,
  parseBearerAccessToken,
} from "@/lib/auth/accountDeletion";
import {
  createSupabaseAdminClient,
  SupabaseAdminConfigurationError,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ErrorBody = { error: string; code: string };

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json<ErrorBody>({ error, code }, { status });
}

function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function DELETE(request: Request) {
  if (!hasValidOrigin(request)) {
    return errorResponse("허용되지 않은 요청입니다.", "INVALID_ORIGIN", 403);
  }

  const accessToken = parseBearerAccessToken(
    request.headers.get("authorization"),
  );
  if (!accessToken) {
    return errorResponse("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", "INVALID_BODY", 400);
  }

  const deletionRequest = parseAccountDeletionRequest(requestBody);
  if (deletionRequest?.confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
    return errorResponse(
      "확인 문구를 정확히 입력해주세요.",
      "INVALID_CONFIRMATION",
      400,
    );
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return errorResponse("로그인이 만료되었습니다.", "AUTH_REQUIRED", 401);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return errorResponse(
        "회원 정보를 확인하지 못했습니다.",
        "PROFILE_CHECK_FAILED",
        503,
      );
    }
    if (profile?.role !== "user") {
      return errorResponse(
        "일반 회원 계정만 이 경로에서 탈퇴할 수 있습니다.",
        "ACCOUNT_TYPE_DENIED",
        403,
      );
    }
    if (!isRecentAccountSignIn(user.last_sign_in_at)) {
      return errorResponse(
        "안전을 위해 Google 로그인을 다시 진행해주세요.",
        "REAUTH_REQUIRED",
        403,
      );
    }

    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
      accessToken,
      "global",
    );
    if (signOutError) {
      return errorResponse(
        "로그인 세션을 안전하게 종료하지 못했습니다.",
        "SESSION_REVOCATION_FAILED",
        503,
      );
    }

    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return errorResponse(
        "계정 삭제를 완료하지 못했습니다. 연결된 저장 파일 또는 계정 상태를 확인하기 위해 고객지원으로 문의해주세요.",
        "ACCOUNT_DELETION_FAILED",
        503,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SupabaseAdminConfigurationError) {
      return errorResponse(
        `Vercel Production 환경변수에서 ${error.missingVariables.join(
          ", ",
        )} 항목을 찾지 못했습니다.`,
        "SERVER_CONFIGURATION_REQUIRED",
        503,
      );
    }

    console.error(
      "Account deletion failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return errorResponse(
      "회원탈퇴 처리 중 오류가 발생했습니다.",
      "ACCOUNT_DELETION_FAILED",
      500,
    );
  }
}
