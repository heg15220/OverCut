// frontend/src/i18n/translations.js
import es from "./messages/messages_es";
import en from "./messages/messages_en";

export const getLang = () => {
  try {
    const lang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return lang.startsWith("es") ? "es" : "en";
  } catch {
    return "en";
  }
};

// mini template: "Hello {name}"
const interpolate = (str, vars) => {
  if (!vars) return str;
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
};

export const t = (key, vars) => {
  const lang = getLang();
  const dict = lang === "es" ? es : en;

  const value = dict[key] ?? en[key] ?? key; // fallback a EN, luego key
  return interpolate(value, vars);
};
