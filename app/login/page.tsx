"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  const router = useRouter();
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
          <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
            Welcome back
          </h1>
          <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
            <AuthForm
              mode="login"
              endpoint="/auth/login"
              submitLabel="Sign in"
              onSuccess={() => router.push("/")}
            />
          </div>
          <div className="mt-6 flex items-center justify-between text-sm text-fg-soft">
            <Link href="/reset-request" className="hover:text-fg">
              Forgot password?
            </Link>
            <Link href="/signup" className="hover:text-fg">
              Create an account →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
