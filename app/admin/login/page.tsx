import AdminLoginForm from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-surface-subtle px-4 pt-20">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-sm">
        <p className="text-sm font-semibold text-ink-secondary">관리자</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">로그인</h1>
        <AdminLoginForm />
      </div>
    </main>
  );
}
