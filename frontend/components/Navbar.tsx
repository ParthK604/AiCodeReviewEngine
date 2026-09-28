"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isAuthenticated, removeToken } from "../lib/auth";

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  function handleLogout(): void {
    removeToken();
    setAuthenticated(false);
    window.location.assign("/login");
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="text-lg font-semibold tracking-tight text-white" href="/">
          CodeReview AI
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {authenticated ? (
            <>
              <Link className="text-gray-300 transition hover:text-white" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-gray-300 transition hover:text-white" href="/settings">
                Settings
              </Link>
              <button
                className="text-gray-400 transition hover:text-white"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="text-gray-300 transition hover:text-white" href="/login">
                Login
              </Link>
              <Link className="rounded-md bg-indigo-600 px-3 py-2 font-medium text-white transition hover:bg-indigo-500" href="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
