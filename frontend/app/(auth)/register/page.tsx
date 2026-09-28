"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import api from "../../../lib/api";
import { saveToken } from "../../../lib/auth";

type TokenResponse = {
  access_token: string;
  token_type: string;
};

type ErrorResponse = {
  detail?: string;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.detail ?? "Unable to create your account. Please try again.";
  }
  return "Unable to create your account. Please try again.";
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/auth/register", { name, email, password });
      const response = await api.post<TokenResponse>("/api/auth/login", { email, password });
      saveToken(response.data.access_token);
      window.location.assign("/dashboard");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-800/80 p-8 shadow-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-indigo-400">Start reviewing</p>
        <h1 className="text-3xl font-semibold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-gray-400">Bring clarity to every codebase.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm text-gray-300">
            Name
            <input className="mt-2 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2.5 text-white outline-none transition focus:border-indigo-500" onChange={(event) => setName(event.target.value)} required type="text" value={name} />
          </label>
          <label className="block text-sm text-gray-300">
            Email
            <input className="mt-2 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2.5 text-white outline-none transition focus:border-indigo-500" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className="block text-sm text-gray-300">
            Password
            <input className="mt-2 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2.5 text-white outline-none transition focus:border-indigo-500" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="w-full rounded-md bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Already registered? <Link className="text-indigo-400 hover:text-indigo-300" href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
