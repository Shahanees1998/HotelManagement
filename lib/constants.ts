/**
 * Auth logo with cache-busting query.
 * Bump NEXT_PUBLIC_LOGO_VERSION in your deployment env (e.g. Digital Ocean)
 * when you change the logo image so browsers and CDNs fetch the new file.
 */
export const AUTH_LOGO_SRC =
  `/images/logo-blue.png?v=${process.env.NEXT_PUBLIC_LOGO_VERSION ?? "1"}`;
