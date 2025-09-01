// Carga y descarga scripts de terceros de forma segura.
// No cargarás nada hasta que tengas consentimiento explícito.

const injected = new Map(); // key -> { el, cleanup? }

export function loadScriptOnce(key, src, attrs = {}) {
  if (injected.has(key)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
  injected.set(key, { el: s });
}

export function insertRawScriptOnce(key, code) {
  if (injected.has(key)) return;
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.text = code;
  document.head.appendChild(s);
  injected.set(key, { el: s });
}

export function unload(key) {
  const item = injected.get(key);
  if (!item) return;
  try {
    item.el.remove();
    if (typeof item.cleanup === "function") item.cleanup();
  } catch (_) {}
  injected.delete(key);
}

export function unloadAllByPrefix(prefix) {
  Array.from(injected.keys())
    .filter(k => k.startsWith(prefix))
    .forEach(unload);
}
