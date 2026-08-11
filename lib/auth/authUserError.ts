type AuthUserLookupError = {
  code?: string;
  message?: string;
} | null;

type RecoverDeletedAuthUserInput = {
  error: AuthUserLookupError;
  currentPath: string;
  clearLocalSession: () => Promise<void>;
  redirectHome: () => void;
};

export function isDeletedAuthUserError(
  error: AuthUserLookupError,
): boolean {
  return (
    error?.code === "user_not_found" ||
    error?.message === "User from sub claim in JWT does not exist"
  );
}

export async function recoverDeletedAuthUser({
  error,
  currentPath,
  clearLocalSession,
  redirectHome,
}: RecoverDeletedAuthUserInput): Promise<boolean> {
  if (!isDeletedAuthUserError(error)) return false;

  await clearLocalSession();
  if (currentPath !== "/") redirectHome();

  return true;
}
