"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return <Toaster position="top-right" toastOptions={{ style: { background: "#1f2937", color: "#f9fafb" } }} />;
}
