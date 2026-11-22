/**
 * Saving a career.
 *
 * Three ways, the same three the GameLock manager offers:
 *
 *   autosave   in this browser, after every change.
 *   code       a short code from the server (the same endpoint the deep career
 *              mode uses), to carry the career to another device.
 *   long code  the whole career, compressed into text, for when there is no
 *              server - paste it anywhere and it comes back.
 *
 * A career is plain JSON with no functions and no history in it (the f1db data
 * is reloaded, not saved), so a save is the career object and nothing else.
 */

import { config } from "../../../config/constants";
import { MANAGER_GAME, MANAGER_VERSION } from "./career";

const LOCAL_KEY = "overcutManagerSave.v1";
const CLOUD_KEY = "overcutManagerCloudCode";

export const validateCareer = (career) => {
  if (!career || career.game !== MANAGER_GAME) throw new Error("invalid_save");
  if (typeof career.v !== "number" || career.v > MANAGER_VERSION) throw new Error("incompatible_save");
  if (!career.world?.teams || !career.season || !career.teamId) throw new Error("invalid_save");
  career.flags = career.flags || { stops: [] };
  return career;
};

const storage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const summarize = (career) => {
  const team = career.world.teams[career.teamId];
  return {
    manager: career.managerName,
    teamName: team?.name,
    color: team?.color,
    color2: team?.color2,
    short: team?.short,
    custom: Boolean(team?.custom),
    year: career.year,
    round: career.round,
    races: career.world.races.length,
    startYear: career.startYear,
    savedAt: new Date().toISOString(),
  };
};

export const saveLocal = (career) => {
  const store = storage();
  if (!store || !career) return false;
  try {
    store.setItem(LOCAL_KEY, JSON.stringify({ summary: summarize(career), career }));
    return true;
  } catch {
    return false;
  }
};

export const loadLocalSummary = () => {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.summary || null;
  } catch {
    return null;
  }
};

export const loadLocal = () => {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(LOCAL_KEY);
    return raw ? validateCareer(JSON.parse(raw).career) : null;
  } catch {
    return null;
  }
};

export const deleteLocal = () => {
  const store = storage();
  try {
    store?.removeItem(LOCAL_KEY);
  } catch {
    // Nothing to do: a blocked storage has nothing in it either.
  }
};

// ----------------------------------------------------------- long code

const toBase64 = (bytes) => {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64 = (text) => {
  const clean = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = clean + "===".slice((clean.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const streamBytes = async (bytes, transform) => {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const canCompress = () => typeof CompressionStream !== "undefined" && typeof Blob !== "undefined" && typeof Response !== "undefined";

export const exportLongCode = async (career) => {
  const json = new TextEncoder().encode(JSON.stringify(career));
  if (canCompress()) {
    try {
      return `OCM1.${toBase64(await streamBytes(json, new CompressionStream("gzip")))}`;
    } catch {
      // Fall through to the uncompressed code.
    }
  }
  return `OCM0.${toBase64(json)}`;
};

export const importLongCode = async (code) => {
  const text = String(code || "").trim().replace(/\s+/g, "");
  const [prefix, body] = text.split(".");
  if (!body || !["OCM0", "OCM1"].includes(prefix)) throw new Error("invalid_code");
  let bytes = fromBase64(body);
  if (prefix === "OCM1") {
    if (typeof DecompressionStream === "undefined") throw new Error("unsupported");
    bytes = await streamBytes(bytes, new DecompressionStream("gzip"));
  }
  return validateCareer(JSON.parse(new TextDecoder().decode(bytes)));
};

export const looksLikeLongCode = (text) => /^OCM[01]\./.test(String(text || "").trim());

// ---------------------------------------------------------- short code

export const normaliseCloudCode = (code = "") => String(code).trim().toUpperCase().replace(/[\s-]/g, "");
export const formatCloudCode = (code = "") => normaliseCloudCode(code).replace(/(.{4})(?=.)/g, "$1-");
export const looksLikeCloudCode = (text) => /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/.test(normaliseCloudCode(text));

export const rememberedCloudCode = () => {
  try {
    return storage()?.getItem(CLOUD_KEY) || "";
  } catch {
    return "";
  }
};

export const saveToCloud = async (career) => {
  const code = career.cloudCode || rememberedCloudCode() || "";
  const send = async (withCode) => {
    const response = await fetch(`${config.BASE_PATH}/careerMode/saves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: withCode, state: career }),
    });
    if (!response.ok) {
      const error = new Error(`save_failed_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  };
  let result;
  try {
    result = await send(normaliseCloudCode(code) || null);
  } catch (error) {
    // A code from another career (or one the server forgot) gets a new one.
    if (error.status === 404 || error.status === 400) result = await send(null);
    else throw error;
  }
  const saved = normaliseCloudCode(result.code);
  career.cloudCode = saved;
  try {
    storage()?.setItem(CLOUD_KEY, saved);
  } catch {
    // The code is still shown on screen.
  }
  return formatCloudCode(saved);
};

export const loadFromCloud = async (code) => {
  const response = await fetch(`${config.BASE_PATH}/careerMode/saves/${encodeURIComponent(normaliseCloudCode(code))}`);
  if (!response.ok) {
    const error = new Error(`load_failed_${response.status}`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  const career = validateCareer(payload.state);
  career.cloudCode = normaliseCloudCode(payload.code || code);
  return career;
};

export const importCareer = async (text) => {
  if (looksLikeLongCode(text)) return importLongCode(text);
  if (looksLikeCloudCode(text)) return loadFromCloud(text);
  throw new Error("invalid_code");
};

/** The career as a file, for people who like to keep their own copy. */
export const downloadCareer = (career) => {
  const blob = new Blob([JSON.stringify(career)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const team = career.world.teams[career.teamId];
  link.href = url;
  link.download = `overcut-manager-${(team?.short || "team").toLowerCase()}-${career.year}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const importFile = async (file) => validateCareer(JSON.parse(await file.text()));
