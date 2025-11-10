"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useI18n } from "@/i18n/TranslationProvider";
import { translationService } from "@/lib/translationService";

interface AutoTranslatorProps {
  rootSelector?: string;
  enabledLocales?: string[];
}

function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const text = node.textContent ?? "";
      if (!text.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.parentElement?.tagName === "SCRIPT" || node.parentElement?.tagName === "STYLE") {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

const MAX_BATCH_SIZE = 200;
const ATTRIBUTE_NAMES = ["placeholder", "title", "aria-label"];

export function AutoTranslator({ rootSelector = "#__next", enabledLocales }: AutoTranslatorProps) {
  const { locale } = useI18n();
  const textOriginalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const attributeOriginalsRef = useRef<WeakMap<Element, Map<string, string>>>(new WeakMap());
  const observerRef = useRef<MutationObserver | null>(null);

  const shouldTranslate = useMemo(() => {
    if (!enabledLocales || enabledLocales.length === 0) {
      return locale !== "en";
    }
    return enabledLocales.includes(locale);
  }, [enabledLocales, locale]);

  const applyTranslation = useCallback(async () => {
    const root = document.querySelector(rootSelector);
    if (!root) {
      return;
    }

    const textNodes = collectTextNodes(root);
    const attributeSelector = ATTRIBUTE_NAMES.length ? ATTRIBUTE_NAMES.map(attr => `[${attr}]`).join(",") : "";
    const attributeElements = attributeSelector ? Array.from(root.querySelectorAll(attributeSelector)) : [];
    if (!textNodes.length && !attributeElements.length) {
      return;
    }

    if (locale === "en") {
      textNodes.forEach(node => {
        const original = textOriginalsRef.current.get(node);
        if (typeof original === "string") {
          node.textContent = original;
        }
      });
      attributeElements.forEach(element => {
        const storedAttributes = attributeOriginalsRef.current.get(element);
        if (storedAttributes) {
          storedAttributes.forEach((value, attr) => {
            element.setAttribute(attr, value);
          });
        }
      });
      return;
    }

    const originalTexts: string[] = [];
    const nodeMeta: Array<{ node: Text; trimmed: string; prefix: string; suffix: string }> = [];
    const attributeMeta: Array<{ element: Element; attr: string; trimmed: string }> = [];

    textNodes.forEach(node => {
      const existingOriginal = textOriginalsRef.current.get(node);
      const text = existingOriginal ?? node.textContent ?? "";

      if (!existingOriginal) {
        textOriginalsRef.current.set(node, text);
      }

      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const prefixMatch = text.match(/^\s*/);
      const suffixMatch = text.match(/\s*$/);

      nodeMeta.push({
        node,
        trimmed,
        prefix: prefixMatch ? prefixMatch[0] : "",
        suffix: suffixMatch ? suffixMatch[0] : "",
      });

      if (!originalTexts.includes(trimmed)) {
        originalTexts.push(trimmed);
      }
    });

    attributeElements.forEach(element => {
      ATTRIBUTE_NAMES.forEach(attr => {
        const current = element.getAttribute(attr);
        if (!current) {
          return;
        }

        let storedAttributes = attributeOriginalsRef.current.get(element);
        if (!storedAttributes) {
          storedAttributes = new Map<string, string>();
          attributeOriginalsRef.current.set(element, storedAttributes);
        }

        const originalValue = storedAttributes.get(attr) ?? current;
        if (!storedAttributes.has(attr)) {
          storedAttributes.set(attr, originalValue);
        }

        const trimmed = originalValue.trim();
        if (!trimmed) {
          return;
        }

        attributeMeta.push({
          element,
          attr,
          trimmed,
        });

        if (!originalTexts.includes(trimmed)) {
          originalTexts.push(trimmed);
        }
      });
    });

    if (!originalTexts.length) {
      return;
    }

    const batches: string[][] = [];
    for (let i = 0; i < originalTexts.length; i += MAX_BATCH_SIZE) {
      batches.push(originalTexts.slice(i, i + MAX_BATCH_SIZE));
    }

    const translationMap = new Map<string, string>();

    for (const batch of batches) {
      const translated = await translationService.translateBatch(batch, locale);
      translated.forEach((value, index) => {
        translationMap.set(batch[index], value);
      });
    }

    nodeMeta.forEach(({ node, trimmed, prefix, suffix }) => {
      const translated = translationMap.get(trimmed);
      if (translated) {
        node.textContent = `${prefix}${translated}${suffix}`;
      }
    });

    attributeMeta.forEach(({ element, attr, trimmed }) => {
      const translated = translationMap.get(trimmed);
      if (translated) {
        element.setAttribute(attr, translated);
      }
    });
  }, [locale, rootSelector]);

  useEffect(() => {
    if (!shouldTranslate) {
      applyTranslation();
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await applyTranslation();
    };

    run();

    const target = document.querySelector(rootSelector);
    if (!target) {
      return () => {
        cancelled = true;
      };
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const observer = new MutationObserver(() => {
      run();
    });

    observer.observe(target, { childList: true, subtree: true, characterData: true });
    observerRef.current = observer;

    return () => {
      cancelled = true;
      observer.disconnect();
      observerRef.current = null;
    };
  }, [applyTranslation, rootSelector, shouldTranslate]);

  useEffect(() => {
    if (locale === "en" && observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, [locale]);

  return null;
}

