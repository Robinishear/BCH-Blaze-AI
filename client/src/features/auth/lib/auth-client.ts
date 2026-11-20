// import { createAuthClient } from "better-auth/react";

// const BACKEND_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_BASE_URL as string).origin;

// export const authClient = createAuthClient({ baseURL: BACKEND_ORIGIN });
// export const socialLogin = (provider: "google" | "github") =>
//   authClient.signIn.social({
//     provider,
// //     callbackURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/social/success`,

//     callbackURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/social/success`,
//     errorCallbackURL: `${window.location.origin}/login`,
//   });import { createAuthClient } from "better-auth/react";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient(); 

export const socialLogin = (provider: "google" | "github") =>
  authClient.signIn.social({
    provider,
    callbackURL: `${window.location.origin}/api/v1/auth/social/success`,
    errorCallbackURL: `${window.location.origin}/login`,
  });