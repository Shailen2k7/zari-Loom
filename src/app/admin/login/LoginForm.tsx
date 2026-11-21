"use client";
import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-rose/10 px-3 py-2 text-sm font-medium text-rose">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
