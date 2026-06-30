"use client";

import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import AuthForm from "@/components/AuthForm";

export default function ResetPage() {
  const router = useRouter();
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-md px-6 pb-20 pt-12 md:pt-20">
          <h1 className="mb-8 text-center font-display text-4xl md:text-5xl">
            Set a new password
          </h1>
          <div className="rounded-3xl border border-border bg-surface/40 p-6 md:p-8">
            <AuthForm
              mode="reset"
              endpoint="/auth/reset-confirm"
              submitLabel="Save new password"
              onSuccess={() => router.push("/?reset=ok")}
            />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
