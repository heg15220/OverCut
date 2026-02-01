import { useEffect } from "react";
import { setServiceToken } from "../../../backend/appFetch";

export default function useBootstrapTokenFromQuery() {
  useEffect(() => {
    // Caso bueno: http://localhost:3001/?st=XXX#/debate
    let st = new URLSearchParams(window.location.search).get("st");

    // Fallback: por si alguien lo metió en el hash
    if (!st) {
      const hash = window.location.hash || "";
      const q = hash.includes("?") ? hash.split("?")[1] : "";
      st = new URLSearchParams(q).get("st");
    }

    if (!st) return;

    setServiceToken(st);

    // Limpieza (sin recargar)
    // Quita st de la search:
    const params = new URLSearchParams(window.location.search);
    if (params.has("st")) {
      params.delete("st");
      const cleanUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);
}
