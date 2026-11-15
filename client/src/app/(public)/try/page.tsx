import TryForm from "@/features/docs/components/TryForm";

export const metadata = {
  title: "Try without an account · BCH Blaze",
  description: "Ask the AI and pay with Bitcoin Cash. No account needed.",
};

export default function TryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Try it without an account</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        Ask a question and pay about 3 cents in Bitcoin Cash. No sign-up needed.
      </p>
      <TryForm />
    </div>
  );
}