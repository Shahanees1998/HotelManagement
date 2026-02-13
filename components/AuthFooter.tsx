"use client";

import { useI18n } from "@/i18n/TranslationProvider";
import Image from "next/image";

const AuthFooter = () => {
  const { t } = useI18n();

  return (
    <footer
      style={{
        backgroundColor: "#1e3a5f",
        color: "#ffffff",
        padding: "3rem 2rem 1.5rem",
        marginTop: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <Image src="/images/logo.png" alt="C-Review" width={90} height={85} />
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#cbd5e1",
          fontSize: "0.875rem",
        }}
      >
        {t("authFooter.copyright")}
      </div>
      <img
        src="/images/footer.svg"
        alt={t("authFooter.brand.footerImageAlt")}
        style={{ width: "100%", position: "absolute", bottom: 0, left: 0 }}
      />
    </footer>
  );
};

export default AuthFooter;
