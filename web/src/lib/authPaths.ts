const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/sign-up",
  "/reset-password",
]);

const PUBLIC_PREFIX_PATHS = ["/join/"];

export const isPublicPath = (pathname: string): boolean => {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix));
};
