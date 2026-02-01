import { getServiceToken } from "../backend/appFetch";

export function buildDebateUrl() {
  const base =
    (process.env.REACT_APP_DEBATE_FRONTEND_URL || "http://localhost:3001").replace(/\/+$/, "");

  const token = getServiceToken();

  // DEV: distinto origin => necesitas ?st
  if (token) return `${base}/?st=${encodeURIComponent(token)}#/debate`;

  return `${base}/#/debate`;
}
