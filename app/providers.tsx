"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/hooks/useAuth";
import { ReactNode } from "react";
import { ToastProvider } from "@/store/toast.context";
import ClientOnly from "@/components/ClientOnly";
import { TranslationProvider } from "@/i18n/TranslationProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ClientOnly>
          <TranslationProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </TranslationProvider>
        </ClientOnly>
      </AuthProvider>
    </SessionProvider>
  );
} 
