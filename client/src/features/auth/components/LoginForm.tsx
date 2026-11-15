// "use client";

// import { useActionState, useEffect } from "react";

// import { handleLogin } from "../core/auth.actions";
// import { showErrorAlert } from "../swal/swal_register";
// import { AuthCard, FormField, SubmitButton } from "./AuthCard";
// import { ForgotPasswordModal } from "./ForgotPasswordModal";
// import DemoLoginButtons from "./Demologinbuttons";

// const FIELDS = [
//   { name: "email", label: "Email", type: "email", placeholder: "user@example.com", autoComplete: "email" },
//   { name: "password", label: "Password", type: "password", placeholder: "••••••••", autoComplete: "current-password" },
// ] as const;

// export default function LoginForm() {
//   const [state, formAction, isPending] = useActionState(handleLogin, null);

//   useEffect(() => {
//     if (state && !state.success) showErrorAlert(state.message);
//   }, [state]);

//   return (
//     <AuthCard
//       eyebrow="Welcome back"
//       title="Login to your account"
//       subtitle="Pay per request with BCH. No subscription."
//       footerText="Don't have an account?"
//       footerLabel="Register"
//       footerHref="/register"
//     >
//         <DemoLoginButtons />

//       <form action={formAction} noValidate className="space-y-4">
//         {FIELDS.map((field) => (
//           <FormField key={field.name} {...field} />
//         ))}
//         <SubmitButton pending={isPending} label="Login" pendingLabel="Logging in…" />
//       </form>
//       <div className="flex justify-end">
//   <ForgotPasswordModal />
// </div>
//     </AuthCard>
//   );
// }





"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { handleLogin } from "../core/auth.actions";
import { showErrorAlert } from "../swal/swal_register";
import { AuthCard, FormField, SubmitButton } from "./AuthCard";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import DemoLoginButtons from "./Demologinbuttons";
import LoginMascot, { lookFromText, type MascotState } from "./LoginMascot";

const FIELDS = [
  { name: "email", label: "Email", type: "email", placeholder: "user@example.com", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••", autoComplete: "current-password" },
] as const;

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(handleLogin, null);

  const [focus, setFocus] = useState<"email" | "password" | null>(null);
  const [email, setEmail] = useState("");
  const [mood, setMood] = useState<"error" | "success" | null>(null);
  const pressing = useRef(false);

  useEffect(() => {
    if (!state) return;

    if (!state.success) {
      showErrorAlert(state.message);
      setMood("error");
      const t = setTimeout(() => setMood(null), 2200);
      return () => clearTimeout(t);
    }

    setMood("success");
  }, [state]);

  const mascotState: MascotState = isPending
    ? "loading"
    : (mood ?? (focus === "password" ? "password" : focus === "email" ? "email" : "idle"));

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Login to your account"
      subtitle="Pay per request with BCH. No subscription."
      footerText="Don't have an account?"
      footerLabel="Register"
      footerHref="/register"
    >
      <LoginMascot state={mascotState} look={lookFromText(email)} className="mb-3" />

      <DemoLoginButtons />

      <form
        action={formAction}
        noValidate
        className="space-y-4"
        onFocus={(e) => {
          const el = e.target as unknown as HTMLInputElement;
          if (el.name === "email" || el.name === "password") {
            setFocus(el.name);
            setMood(null);
          } else if (el.tagName === "BUTTON" && (el as unknown as HTMLButtonElement).type === "submit") {
            setFocus(null);
          }
        }}
        onBlur={(e) => {
          if (pressing.current) return; // clicking the eye icon must not open the panda's eyes
          const next = e.relatedTarget as Node | null;
          if (!next || !e.currentTarget.contains(next)) setFocus(null);
        }}
        onPointerDownCapture={(e) => {
          pressing.current = !!(e.target as HTMLElement).closest("button");
        }}
        onPointerUpCapture={() => {
          pressing.current = false;
        }}
        onInput={(e) => {
          const el = e.target as unknown as HTMLInputElement;
          if (el.name === "email") setEmail(el.value);
        }}
      >
        {FIELDS.map((field) => (
          <FormField key={field.name} {...field} />
        ))}
        <SubmitButton pending={isPending} label="Login" pendingLabel="Logging in…" />
      </form>

      <div className="flex justify-end">
        <ForgotPasswordModal />
      </div>
    </AuthCard>
  );
}