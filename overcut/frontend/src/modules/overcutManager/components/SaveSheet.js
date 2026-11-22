/**
 * Save and carry the career: the short code from the server, the long code that
 * needs no server, and the file.
 */

import React, { useEffect, useState } from "react";
import { LuCopy, LuDownload } from "react-icons/lu";
import { downloadCareer, exportLongCode, saveLocal, saveToCloud } from "../engine/save";
import { useManager } from "./context";
import { Sheet } from "./atoms";
import { t } from "./texts";

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function SaveSheet({ open, onClose }) {
  const { career, persist } = useManager();
  const [cloud, setCloud] = useState({ state: "idle" });
  const [long, setLong] = useState("");
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!open || !career) return undefined;
    let active = true;
    saveLocal(career);
    setCloud({ state: "saving" });
    setLong("");
    setCopied(null);
    saveToCloud(career)
      .then((code) => active && setCloud({ state: "saved", code }))
      .catch(() => active && setCloud({ state: "failed" }));
    exportLongCode(career).then((code) => active && setLong(code));
    persist();
    return () => {
      active = false;
    };
  }, [open, career, persist]);

  const onCopy = async (kind, text) => {
    if (await copy(text)) setCopied(kind);
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("Guardar y exportar", "Save and export")}>
      <div className="mn-save">
        <p>{t("La partida se guarda sola en este navegador. Para seguirla en otro dispositivo usa el código.", "The career saves itself in this browser. To carry on on another device use the code.")}</p>
        <section>
          <h4>{t("Código corto", "Short code")}</h4>
          {cloud.state === "saving" && <p className="mn-muted">{t("Guardando en el servidor…", "Saving to the server…")}</p>}
          {cloud.state === "failed" && <p className="mn-error">{t("Sin conexión con el servidor. Usa el código largo o el archivo.", "No connection to the server. Use the long code or the file.")}</p>}
          {cloud.state === "saved" && (
            <div className="mn-code">
              <strong>{cloud.code}</strong>
              <button type="button" className="mn-btn mn-btn--sm" onClick={() => onCopy("short", cloud.code)}>
                <LuCopy aria-hidden="true" />
                {copied === "short" ? t("Copiado", "Copied") : t("Copiar", "Copy")}
              </button>
            </div>
          )}
        </section>
        <section>
          <h4>{t("Código largo", "Long code")}</h4>
          <textarea readOnly rows={3} value={long || "…"} onFocus={(event) => event.target.select()} aria-label={t("Código largo", "Long code")} />
          <div className="mn-save__actions">
            <button type="button" className="mn-btn mn-btn--sm" disabled={!long} onClick={() => onCopy("long", long)}>
              <LuCopy aria-hidden="true" />
              {copied === "long" ? t("Copiado", "Copied") : t("Copiar", "Copy")}
            </button>
            <button type="button" className="mn-btn mn-btn--sm" onClick={() => downloadCareer(career)}>
              <LuDownload aria-hidden="true" />
              {t("Descargar archivo", "Download file")}
            </button>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
