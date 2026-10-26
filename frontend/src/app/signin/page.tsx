import Link from "next/link";
import AuthInput from "@/components/account/input";

export default function SignInPage() {
return (
  <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 pt-32 pb-16">
    <h1 className="text-2xl font-bold">Sign in</h1>

    <form className="flex flex-col gap-6">
      <AuthInput label="Email or phone" name="identifier" />
      <AuthInput label="Password" name="password" type="password" />

      <button
        type="submit"
        className="mx-auto w-48 rounded-full bg-[#2b140e] py-3 text-lg font-semibold text-white"
      >
        Sign in
      </button>
    </form>

    <p className="text-center text-sm">
      Don’t have an account?{" "}
      <Link href="/signup" className="font-bold">
        Sign up
      </Link>
    </p>
  </main>
);
}