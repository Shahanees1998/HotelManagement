"use client";

import { type CSSProperties, useMemo } from "react";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { useI18n, type Locale } from "@/i18n/TranslationProvider";

interface LanguageSelectorProps {
  className?: string;
  placeholder?: string;
  style?: CSSProperties;
}

interface LanguageOption {
  label: string;
  value: Locale;
  flagSrc: string;
  flagAlt: string;
}

const FLAG_MAP: Record<Locale, { src: string }> = {
  en: { src: "/images/flags/en.svg" },
  ar: { src: "/images/flags/ar.svg" },
  zh: { src: "/images/flags/zh.svg" },
  fr: { src: "/images/flags/fr.svg" },
  de: { src: "/images/flags/de.svg" },
  es: { src: "/images/flags/es.svg" },
  it: { src: "/images/flags/it.svg" },
  pt: { src: "/images/flags/pt.svg" },
  ru: { src: "/images/flags/ru.svg" },
  pl: { src: "/images/flags/pl.svg" },
  nl: { src: "/images/flags/nl.svg" },
  uk: { src: "/images/flags/uk.svg" },
  el: { src: "/images/flags/el.svg" },
  ro: { src: "/images/flags/ro.svg" },
};

export function LanguageSelector({ className, placeholder, style }: LanguageSelectorProps) {
  const { locale, setLocale, availableLocales, t } = useI18n();

  const options = useMemo<LanguageOption[]>(
    () =>
      availableLocales.map(code => ({
        label: t(`languages.${code}`),
        value: code,
        flagSrc: (FLAG_MAP[code] ?? FLAG_MAP.en).src,
        flagAlt: `${t(`languages.${code}`)} flag`,
      })),
    [availableLocales, t]
  );

  const itemTemplate = (option: LanguageOption) => (
    <div className="flex align-items-center justify-content-between w-full">
      <span>{option.label}</span>
      <img
        src={option.flagSrc}
        alt={option.flagAlt}
        width={18}
        height={12}
        className="ml-2"
        style={{ objectFit: "cover" }}
      />
    </div>
  );

  const valueTemplate = (option: LanguageOption | null, props: { placeholder?: string }) => {
    if (!option) {
      return <span>{props.placeholder ?? placeholder ?? t("common.selectLanguage")}</span>;
    }

    return (
      <div className="flex align-items-center">
        <span className="mr-2">{option.label}</span>
        <img
          src={option.flagSrc}
          alt={option.flagAlt}
          width={18}
          height={12}
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  };

  const handleChange = (event: DropdownChangeEvent) => {
    if (event.value) {
      setLocale(event.value);
    }
  };

  return (
    <Dropdown
      value={locale}
      options={options}
      onChange={handleChange}
      className={className}
      style={{
        width: "140px",
        ...(style ?? {}),
      }}
      aria-label="Select language"
      placeholder={placeholder ?? t("common.selectLanguage")}
      itemTemplate={itemTemplate}
      valueTemplate={valueTemplate}
      panelClassName="language-selector-panel"
    />
  );
}

