"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { firebaseEnabled, getGoogleIdToken } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/api";

const hasGoogle = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const LoginPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      router.push(mode === "register" ? "/verify-email" : "/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      const token = await getGoogleIdToken();
      await loginWithGoogle(token);
      router.push("/");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user")
        setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const input = "ring-2 ring-gray-200 rounded-md p-4 w-full";

  return (
    <div className="min-h-[calc(100vh-80px)] py-10 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold">
          {mode === "login"
            ? "Log in to Cartiva"
            : "Create your Cartiva account"}
        </h1>

        {mode === "register" && (
          <input
            className={input}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={input}
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {mode === "login" && (
          <Link
            href="/forgot-password"
            className="text-sm underline -mt-3 w-max"
          >
            Forgot password?
          </Link>
        )}

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          disabled={busy}
          className="bg-lama text-white p-2 rounded-md disabled:bg-pink-200 disabled:cursor-not-allowed"
        >
          {busy ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>

        {firebaseEnabled && (
          <>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px bg-gray-200 flex-1" /> OR{" "}
              <div className="h-px bg-gray-200 flex-1" />
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="ring-1 ring-gray-300 rounded-md p-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Continue with Google
            </button>
          </>
        )}

        <div
          className="text-sm underline cursor-pointer"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "Don't have an account? Register"
            : "Already have an account? Log in"}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
