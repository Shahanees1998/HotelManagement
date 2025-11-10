"use client";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useI18n } from "@/i18n/TranslationProvider";

const quickLinks = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/features", key: "features" },
  { href: "/contact", key: "contact" },
] as const;

const resourcesLinks = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/feedbacks", key: "feedbacks" },
  { href: "/hotel-profile", key: "hotelProfile" },
  { href: "/support", key: "support" },
  { href: "/owner-profile", key: "ownerProfile" },
] as const;

const legalLinks = [
  { href: "/privacy-policy", key: "privacyPolicy" },
  { href: "/company-policy", key: "companyPolicy" },
  { href: "/terms", key: "terms" },
] as const;

const socialLinks = [
  { icon: "pi pi-facebook", href: "https://facebook.com", key: "facebook" },
  { icon: "pi pi-instagram", href: "https://instagram.com", key: "instagram" },
  { icon: "pi pi-linkedin", href: "https://linkedin.com", key: "linkedin" },
] as const;

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2.5rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#ffffff",
            }}
          >
            {t("authFooter.brand.title")}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: "1.6",
              color: "#cbd5e1",
              marginBottom: 0,
            }}
          >
            {t("authFooter.brand.description")}
          </p>
        </div>

        <div>
          <h4
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#ffffff",
            }}
          >
            {t("authFooter.quickLinks.title")}
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {quickLinks.map(link => (
              <li key={link.key} style={{ marginBottom: "0.75rem" }}>
                <a
                  href={link.href}
                  style={{
                    color: "#cbd5e1",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={e => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  {t(`authFooter.quickLinks.items.${link.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#ffffff",
            }}
          >
            {t("authFooter.resources.title")}
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {resourcesLinks.map(link => (
              <li key={link.key} style={{ marginBottom: "0.75rem" }}>
                <a
                  href={link.href}
                  style={{
                    color: "#cbd5e1",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={e => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  {t(`authFooter.resources.items.${link.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#ffffff",
            }}
          >
            {t("authFooter.legal.title")}
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              marginBottom: "1.5rem",
            }}
          >
            {legalLinks.map(link => (
              <li key={link.key} style={{ marginBottom: "0.75rem" }}>
                <a
                  href={link.href}
                  style={{
                    color: "#cbd5e1",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={e => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  {t(`authFooter.legal.items.${link.key}`)}
                </a>
              </li>
            ))}
          </ul>

          <div>
            <h4
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#ffffff",
              }}
            >
              {t("authFooter.connect.title")}
            </h4>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <InputText
                placeholder={t("authFooter.connect.emailPlaceholder")}
                style={{
                  flex: 1,
                  fontSize: "0.875rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
              />
              <Button
                icon="pi pi-arrow-right"
                aria-label={t("authFooter.connect.submitLabel")}
                style={{
                  padding: "0.625rem 1rem",
                  backgroundColor: "#ffffff",
                  color: "#1e3a5f",
                  border: "none",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
              }}
            >
              {socialLinks.map(link => (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(`authFooter.connect.social.${link.key}`)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1e3a5f",
                    textDecoration: "none",
                    transition: "transform 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <i className={link.icon} style={{ fontSize: "1.125rem" }}></i>
                </a>
              ))}
            </div>
          </div>
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
