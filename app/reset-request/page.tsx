"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import AuthForm from "@/components/AuthForm";

export default function ResetRequestPage() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
          <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
            Reset password
          </h1>
          <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
            {sent ? (
              <p className="text-center text-fg-soft">
                If an account exists for that email, we just sent a reset link. Check your
                inbox.
              </p>
            ) : (
              <AuthForm
                mode="reset-request"
                endpoint="/auth/reset-request"
                submitLabel="Send reset link"
                onSuccess={() => setSent(true)}
              />
            )}
          </div>
          <div className="mt-6 text-center text-sm text-fg-soft">
            <Link href="/login" className="hover:text-fg">
              Back to sign in
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
