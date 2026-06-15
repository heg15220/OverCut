import { helmetBackground } from "./careerModeEngine";

// Colours are taken from the vetted HELMET_COLORS palette so they survive the
// luminance guard inside normalizeColor (same validation the solid helmet uses).
describe("helmetBackground", () => {
  it("returns a flat colour for the solid style", () => {
    expect(helmetBackground("solid", "#123b66", "#1f568b")).toBe("#123b66");
  });

  it("builds a diagonal gradient from both colours", () => {
    expect(helmetBackground("gradient", "#123b66", "#1f568b")).toBe(
      "linear-gradient(135deg, #123b66, #1f568b)"
    );
  });

  it("builds diagonal stripes for the lines style", () => {
    expect(helmetBackground("lines", "#123b66", "#1f568b")).toBe(
      "repeating-linear-gradient(45deg, #123b66 0 6px, #1f568b 6px 12px)"
    );
  });

  it("falls back to a valid colour when the primary is invalid", () => {
    expect(helmetBackground("solid", "not-a-color")).toBe("#0a2d52");
  });

  it("falls back to a valid secondary colour for multi-colour styles", () => {
    expect(helmetBackground("gradient", "#123b66", "bogus")).toBe(
      "linear-gradient(135deg, #123b66, #0a2d52)"
    );
  });

  it("treats an unknown style as solid", () => {
    expect(helmetBackground("sparkles", "#123b66", "#1f568b")).toBe("#123b66");
  });
});
