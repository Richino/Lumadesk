"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register" | "forgot" | "reset";

const schemas = {
  login: z.object({ email: z.string().email("Enter a valid email address."), password: z.string().min(1, "Enter your password."), remember: z.boolean() }),
  register: z.object({ firstName: z.string().trim().min(1, "Enter your first name."), lastName: z.string().trim().min(1, "Enter your last name."), email: z.string().email("Enter a valid email address."), password: z.string().min(12, "Use at least 12 characters."), confirmPassword: z.string(), terms: z.literal(true, { error: "Please accept the terms to continue." }) }).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." }),
  forgot: z.object({ email: z.string().email("Enter a valid email address.") }),
  reset: z.object({ password: z.string().min(12, "Use at least 12 characters."), confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." }),
};

type FormValues = Record<string, string | boolean>;

export function AuthForm({ mode, next = "/", initialNotice }: { mode: Mode; next?: string; initialNotice?: string }) {
  const schema = schemas[mode] as z.ZodType<FormValues>;
  const form = useForm<FormValues>({ resolver: zodResolver(schema as never), defaultValues: { remember: true } });
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const isPasswordMode = mode === "login" || mode === "register" || mode === "reset";

  const submit = async (values: FormValues) => {
    setNotice(null);
    setIsSubmitting(true);
    const origin = window.location.origin;
    let error: { message: string } | null = null;

    if (mode === "login") {
      ({ error } = await supabase.auth.signInWithPassword({ email: String(values.email), password: String(values.password) }));
      if (!error) window.location.assign(next);
    }
    if (mode === "register") {
      ({ error } = await supabase.auth.signUp({
        email: String(values.email),
        password: String(values.password),
        options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/verify-email")}`, data: { first_name: values.firstName, last_name: values.lastName } },
      }));
      if (!error) setNotice("Check your email to verify your account before signing in.");
    }
    if (mode === "forgot") {
      ({ error } = await supabase.auth.resetPasswordForEmail(String(values.email), { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}` }));
      if (!error) setNotice("If an account exists for this address, a reset link is on its way.");
    }
    if (mode === "reset") {
      ({ error } = await supabase.auth.updateUser({ password: String(values.password) }));
      if (!error) {
        setNotice("Your password has been updated. Redirecting you to sign in…");
        window.setTimeout(() => window.location.assign("/login"), 900);
      }
    }
    if (error) setNotice(error.message);
    setIsSubmitting(false);
  };

  const google = async () => {
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setNotice(error.message);
  };

  const title = { login: "Welcome back.", register: "Make room for better work.", forgot: "Reset your password.", reset: "Choose a new password." }[mode];
  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="eyebrow">LUMADESK ACCOUNT</p>
      <h1 id="auth-title">{title}</h1>
      <p className="auth-intro">{mode === "login" ? "Your saved details, preferences, and orders are waiting." : "A considered account experience, built around your desk."}</p>
      <form className="auth-form" onSubmit={form.handleSubmit(submit)} noValidate>
        {mode === "register" && <div className="auth-grid"><Field form={form} name="firstName" label="First name" /><Field form={form} name="lastName" label="Last name" /></div>}
        {mode !== "reset" && <Field form={form} name="email" label="Email" type="email" autoComplete="email" />}
        {isPasswordMode && <Field form={form} name="password" label={mode === "reset" ? "New password" : "Password"} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} hint={mode !== "login" ? "At least 12 characters." : undefined} />}
        {(mode === "register" || mode === "reset") && <Field form={form} name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" />}
        {mode === "login" && <div className="auth-inline"><label className="auth-check"><input type="checkbox" {...form.register("remember")} /> Keep me signed in</label><Link href="/forgot-password">Forgot password?</Link></div>}
        {mode === "register" && <label className="auth-check"><input type="checkbox" {...form.register("terms")} /> I agree to the terms and privacy policy.</label>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</button>
      </form>
      {(mode === "login" || mode === "register") && <><div className="auth-divider"><span>OR</span></div><button className="auth-google" type="button" onClick={google}>Continue with Google</button></>}
      <p className="auth-footer">{mode === "login" ? <>New to LumaDesk? <Link href="/register">Create an account</Link></> : mode === "register" ? <>Already have an account? <Link href="/login">Sign in</Link></> : <Link href="/login">Back to sign in</Link>}</p>
      <Link className="auth-shopping" href="/">Continue shopping</Link>
    </section>
  );
}

function Field({ form, name, label, type = "text", autoComplete, hint }: { form: ReturnType<typeof useForm<FormValues>>; name: string; label: string; type?: string; autoComplete?: string; hint?: string }) {
  const error = form.formState.errors[name]?.message;
  return <label className="auth-field"><span>{label}</span><input type={type} autoComplete={autoComplete} aria-invalid={Boolean(error)} {...form.register(name)} />{hint && !error && <small>{hint}</small>}{error && <small className="auth-error">{String(error)}</small>}</label>;
}
