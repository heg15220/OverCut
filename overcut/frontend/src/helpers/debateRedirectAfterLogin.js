import { getServiceToken } from "../backend/appFetch";

export function redirectToDebateIfRequested() {
  // En HashRouter (OverCut), el query suele venir en el hash:
  // http://localhost:3000/overcut/#/users/login?nextDebate=%2Fdebate%2Frooms%2F12
  const hash = window.location.hash || "";
  const hashQuery = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(hashQuery || window.location.search);

  const nextDebate = params.get("nextDebate");
  if (!nextDebate) return false;

  const token = getServiceToken();

  // ✅ BASE DEL FRONTEND DE DEBATE (SIN # al final)
  // Ej DEV: http://localhost:3001
  // Ej PROD: https://tudominio.com/overcutdebate
  const base =
    (process.env.REACT_APP_DEBATE_FRONTEND_URL || "http://localhost:3001").replace(/\/+$/, "");

  const debatePath = decodeURIComponent(nextDebate || "/debate"); // "/debate/rooms/12"

  // ✅ HashRouter de Debate: ruta va tras #
  // ✅ Token va en search (antes del #) para que window.location.search lo vea
  const url = token
    ? `${base}/?st=${encodeURIComponent(token)}#${debatePath}`
    : `${base}/#${debatePath}`;

  window.location.href = url;
  return true;
}
