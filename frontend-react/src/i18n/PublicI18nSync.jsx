import { useEffect } from "react";
import { publicTextPatterns, publicTextTranslations } from "./translations";
import { useLanguage } from "./LanguageContext";

window.__i18n_textOriginals = window.__i18n_textOriginals || new WeakMap();
window.__i18n_attrOriginals = window.__i18n_attrOriginals || new WeakMap();
window.__i18n_translatedText = window.__i18n_translatedText || new WeakMap();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.__i18n_textOriginals = new WeakMap();
    window.__i18n_attrOriginals = new WeakMap();
    window.__i18n_translatedText = new WeakMap();
  });
}

const textOriginals = window.__i18n_textOriginals;
const attrOriginals = window.__i18n_attrOriginals;
const translatedText = window.__i18n_translatedText;

const SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "pre",
  "code",
  "textarea",
  "[contenteditable='true']",
  "[data-i18n-skip]",
  ".admin-layout",
  ".admin-page",
  ".admin-sidebar",
].join(",");

const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "alt", "data-text"];

const splitOuterWhitespace = (value) => {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  return {
    leading,
    core: value.slice(leading.length, value.length - trailing.length),
    trailing,
  };
};

const hasVietnameseSignal = (value) =>
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(value) ||
  /\b(Trang|Sản|Đăng|Giỏ|Tìm|Thanh|Mật|Đơn|Phí|Vui|Không|Đang|Chọn|Xóa|Thêm|Đánh|Giao|Hàng|Bộ|Lọc|Màu|Kích)\b/i.test(value);

const translateCore = (core) => {
  if (!core) return core;

  const exact = publicTextTranslations[core];
  if (exact) return exact;

  for (const [pattern, replacement] of publicTextPatterns) {
    if (pattern.test(core)) {
      return core.replace(pattern, replacement);
    }
  }

  return core;
};

const translateValue = (value) => {
  const { leading, core, trailing } = splitOuterWhitespace(value);
  const translated = translateCore(core);
  return `${leading}${translated}${trailing}`;
};

const shouldSkipElement = (element) => {
  if (!element) return false;
  if (element.closest(SKIP_SELECTOR)) return true;
  return false;
};

const syncTextNode = (node, language) => {
  const parentElement = node.parentElement;
  if (!parentElement || shouldSkipElement(parentElement)) return;

  const current = node.nodeValue || "";
  if (!current.trim()) return;

  if (language === "vi") {
    const original = textOriginals.get(node);
    if (original && current !== original) node.nodeValue = original;
    textOriginals.delete(node);
    translatedText.delete(node);
    return;
  }

  const previousOriginal = textOriginals.get(node);
  const previousTranslation = translatedText.get(node);
  if (!previousOriginal || (current !== previousTranslation && current !== previousOriginal && hasVietnameseSignal(current))) {
    textOriginals.set(node, current);
  }

  const original = textOriginals.get(node) || current;
  const translated = translateValue(original);

  if (translated !== current) {
    node.nodeValue = translated;
    translatedText.set(node, translated);
  }
};

const getAttrStore = (element) => {
  let store = attrOriginals.get(element);
  if (!store) {
    store = {};
    attrOriginals.set(element, store);
  }
  return store;
};

const syncAttributes = (element, language) => {
  if (!element || shouldSkipElement(element)) return;

  const store = getAttrStore(element);

  TRANSLATABLE_ATTRS.forEach((attr) => {
    if (!element.hasAttribute(attr)) return;

    const current = element.getAttribute(attr) || "";
    if (!current.trim()) return;

    if (language === "vi") {
      if (store[attr] && current !== store[attr]) {
        element.setAttribute(attr, store[attr]);
      }
      delete store[attr];
      return;
    }

    const currentTranslation = store[`${attr}Translation`];
    if (!store[attr] || (current !== currentTranslation && current !== store[attr] && hasVietnameseSignal(current))) {
      store[attr] = current;
    }

    const translated = translateValue(store[attr] || current);
    if (translated !== current) {
      element.setAttribute(attr, translated);
      store[`${attr}Translation`] = translated;
    }
  });
};

const walk = (root, language) => {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    syncTextNode(root, language);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) {
    syncAttributes(root, language);
    if (shouldSkipElement(root)) return;
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE && shouldSkipElement(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      syncTextNode(node, language);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      syncAttributes(node, language);
    }
    node = walker.nextNode();
  }
};

export default function PublicI18nSync({ disabled = false }) {
  const { language } = useLanguage();

  useEffect(() => {
    if (disabled) return undefined;
    let rafId;

    const apply = () => walk(document.body, language);
    apply();

    const observer = new MutationObserver((mutations) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        mutations.forEach((mutation) => {
          if (mutation.type === "characterData") {
            walk(mutation.target, language);
            return;
          }

          if (mutation.type === "attributes") {
            walk(mutation.target, language);
            return;
          }

          mutation.addedNodes.forEach((node) => walk(node, language));
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRS,
    });

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [disabled, language]);

  return null;
}
