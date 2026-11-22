/**
 * Save and carry the career (RNF-06): it is already saved in this browser; to
 * move it, the short code from the server, the long code that needs no server,
 * or the file. Styles: ./styles/inbox.css (.mn-sv).
 */

import React, { useEffect, useState } from "react";
import { downloadCareer, exportLongCode, saveLocal, saveToCloud } from "../engine/save";
import { useManager } from "./context";
import { Badge, Sheet } from "./atoms";
import { IconDownload } from "./icons";
import { IconCopy } from "./icons";
import { t } from "./texts";
import "./styles/inbox.css";

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
  const [local, setLocal] = useState(true);

  useEffect(() => {
    if (!open || !career) return undefined;
    let active = true;
    setLocal(saveLocal(career));
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
      <div className="mn-sv">
        <p className="mn-sv__status">
          <Badge tone={local ? "pos" : "neg"} dot>
            {local ? t("Guardada en este navegador", "Saved in this browser") : t("No se pudo guardar en este navegador", "Could not save in this browser")}
          </Badge>
          <span>{t("Para seguirla en otro dispositivo, llévate uno de estos códigos.", "To carry on on another device, take one of these codes.")}</span>
        </p>

        <section className="mn-sv__block">
          <header>
            <h3>{t("Código corto", "Short code")}</h3>
            <small>{t("Se guarda en el servidor de OverCut", "Stored on the OverCut server")}</small>
          </header>
          {cloud.state === "saving" && <p className="mn-sv__wait">{t("Guardando en el servidor", "Saving to the server")}</p>}
          {cloud.state === "failed" && (
            <p className="mn-sv__error" role="alert">
              {t("Sin conexión con el servidor. Usa el código largo o el archivo.", "No connection to the server. Use the long code or the file.")}
            </p>
          )}
          {cloud.state === "saved" && (
            <div className="mn-sv__code">
              <strong>{cloud.code}</strong>
              <button type="button" className="mn-btn mn-btn--sm" onClick={() => onCopy("short", cloud.code)}>
                <IconCopy size={16} />
                {copied === "short" ? t("Copiado", "Copied") : t("Copiar", "Copy")}
              </button>
            </div>
          )}
        </section>

        <section className="mn-sv__block">
          <header>
            <h3>{t("Código largo", "Long code")}</h3>
            <small>{t("Contiene toda la partida; no necesita servidor", "Holds the whole career; needs no server")}</small>
          </header>
          <textarea readOnly rows={3} value={long || ""} placeholder={t("Preparando el código", "Preparing the code")} onFocus={(event) => event.target.select()} aria-label={t("Código largo", "Long code")} />
          <div className="mn-sv__actions">
            <button type="button" className="mn-btn mn-btn--sm" disabled={!long} onClick={() => onCopy("long", long)}>
              <IconCopy size={16} />
              {copied === "long" ? t("Copiado", "Copied") : t("Copiar", "Copy")}
            </button>
            <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => downloadCareer(career)}>
              <IconDownload size={16} />
              {t("Descargar archivo", "Download file")}
            </button>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
