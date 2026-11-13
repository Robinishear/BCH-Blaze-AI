"use client";

import { useRef, useState } from "react";

// TODO: replace these demo values with the real credentials.
const DEMO_ACCOUNTS = {
  admin: { label: "Admin", email: "vgairoggbin@gmail.com", password: "123456789" },
  user: { label: "User", email: "vai@gmail.com", password: "123456789" },
} as const;

type Role = keyof typeof DEMO_ACCOUNTS;

// Sets an input value the way typing would, so React picks it up.
function setValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export default function DemoLoginButtons() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Role | null>(null);

  function fill(role: Role) {
    const root = ref.current;
    if (!root) return;

    const form = root.closest("form") ?? root.parentElement?.querySelector("form");
    const email = form?.querySelector<HTMLInputElement>('input[name="email"], input[type="email"]');
    const password = form?.querySelector<HTMLInputElement>('input[name="password"]');
    if (!form || !email || !password) return;

    setActive(role);
    setValue(email, DEMO_ACCOUNTS[role].email);
    setValue(password, DEMO_ACCOUNTS[role].password);

    setTimeout(() => form.requestSubmit(), 50);
  }

  return (
    <div ref={ref} className="mb-6 grid grid-cols-2 gap-3">
      {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => fill(role)}
          className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
            active === role
              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-white/5 text-gray-300 hover:border-emerald-500/40 hover:text-white"
          }`}
        >
          {DEMO_ACCOUNTS[role].label}
        </button>
      ))}
    </div>
  );
}