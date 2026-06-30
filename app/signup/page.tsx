"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
          <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
            Create your account
          </h1>
          <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
            {sent ? (
              <div className="text-center">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-glow">
                  Almost there
                </div>
                <p className="font-display text-2xl">Check your inbox.</p>
                <p className="mt-3 text-sm text-fg-soft">
                  We sent you a confirmation link. Click it to activate your account.
                </p>
              </div>
            ) : (
              <AuthForm
                mode="signup"
                endpoint="/auth/signup"
                submitLabel="Create account"
                onSuccess={(data) => {
                  if (data?.needsConfirmation) setSent(true);
                }}
              />
            )}
          </div>
          <div className="mt-6 text-center text-sm text-fg-soft">
            Already have an account?{" "}
            <Link href="/login" className="text-fg hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
