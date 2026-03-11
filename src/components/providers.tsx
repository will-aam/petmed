"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
}
