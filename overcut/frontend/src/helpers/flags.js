export const flagEmojiFromCountryCode = (code) => {
  if (!code) return "🏳️";
  const cc = String(code).trim().toUpperCase();
  if (cc.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  return String.fromCodePoint(
    A + (cc.charCodeAt(0) - base),
    A + (cc.charCodeAt(1) - base)
  );
};
