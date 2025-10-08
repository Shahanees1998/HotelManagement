"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/hooks/useAuth";
import { ReactNode } from "react";
import { ToastProvider } from "@/store/toast.context";
import ClientOnly from "@/components/ClientOnly";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ClientOnly>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ClientOnly>
      </AuthProvider>
    </SessionProvider>
  );
} 
