import Link from "next/link";
import AuthInput from "@/components/account/input";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 pt-32 pb-16">
      <h1 className="text-2xl font-bold">Sign up</h1>

      <form className="flex flex-col gap-4">
        <AuthInput label="Email or phone" name="identifier" />
        <AuthInput label="Username" name="username" />
        <AuthInput label="Password" name="password" type="password" />
        <AuthInput label="Code" name="code" />

        <button
          type="submit"
          className="mx-auto mt-2 w-48 rounded-full bg-[#2b140e] py-3 text-lg font-semibold text-white"
        >
          Sign up
        </button>
      </form>

      <p className="text-center text-sm">
        You have an account?{" "}
        <Link href="/signin" className="font-bold">Sign in</Link>
      </p>
    </main>
  );
}