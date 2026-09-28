"use client";

import { type ReactNode, useEffect, useState } from "react";

import { isAuthenticated } from "../lib/auth";

type AuthWrapperProps = {
  children: ReactNode;
};

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    isAuthenticated();
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }
  return children;
}
