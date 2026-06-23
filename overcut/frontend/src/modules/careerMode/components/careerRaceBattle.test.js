import { formatOrdinal, getCornersForRace, renderBattleEvent } from "./careerRaceEventCatalog";

const lcg = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

describe("formatOrdinal", () => {
  test("formats Spanish ordinals with the masculine degree sign", () => {
    expect(formatOrdinal(1, "es")).toBe("1º");
    expect(formatOrdinal(8, "es")).toBe("8º");
    expect(formatOrdinal(22, "es")).toBe("22º");
  });

  test("formats English ordinals with the right suffix", () => {
    expect(formatOrdinal(1, "en")).toBe("1st");
    expect(formatOrdinal(2, "en")).toBe("2nd");
    expect(formatOrdinal(3, "en")).toBe("3rd");
    expect(formatOrdinal(4, "en")).toBe("4th");
    expect(formatOrdinal(8, "en")).toBe("8th");
    expect(formatOrdinal(11, "en")).toBe("11th");
    expect(formatOrdinal(12, "en")).toBe("12th");
    expect(formatOrdinal(13, "en")).toBe("13th");
    expect(formatOrdinal(21, "en")).toBe("21st");
    expect(formatOrdinal(22, "en")).toBe("22nd");
    expect(formatOrdinal(23, "en")).toBe("23rd");
  });
});

describe("getCornersForRace matches the right circuit", () => {
  test("the Spanish GP is not mistaken for Spa-Francorchamps", () => {
    const corners = getCornersForRace("Spanish Grand Prix").map((corner) => corner.es);
    expect(corners).not.toContain("Eau Rouge");
    expect(corners).toContain("la curva 5"); // a Barcelona corner
  });

  test("the Belgian GP still maps to Spa corners", () => {
    const corners = getCornersForRace("Belgian Grand Prix").map((corner) => corner.es);
    expect(corners).toContain("Eau Rouge");
  });
});

describe("renderBattleEvent", () => {
  const baseArgs = (overrides = {}) => ({
    attacker: "Driver X",
    defender: "Driver Y",
    ordinal: 8,
    outcome: "inside",
    raceName: "British Grand Prix",
    rng: lcg(7),
    state: { year: 2023, condition: "seco" },
    ...overrides,
  });

  test("names both drivers and announces the ordinal on a successful overtake", () => {
    const { text, textEn } = renderBattleEvent(baseArgs({ outcome: "inside" }));
    expect(text).toMatch(/Driver X/);
    expect(text).toMatch(/Driver Y/);
    expect(text).toMatch(/8º/);
    expect(textEn).toMatch(/8th/);
  });

  test("a defended battle does not claim a new position", () => {
    const { text, textEn } = renderBattleEvent(baseArgs({ outcome: "defense" }));
    expect(text).not.toMatch(/\d+º/);
    expect(textEn).not.toMatch(/\d+(st|nd|rd|th)/);
  });

  test("a contact battle names both drivers without claiming a pass", () => {
    const { text, textEn } = renderBattleEvent(baseArgs({ outcome: "contact" }));
    expect(text).toMatch(/Driver X/);
    expect(text).toMatch(/Driver Y/);
    expect(text).not.toMatch(/\d+Âº/);
    expect(textEn).not.toMatch(/\d+(st|nd|rd|th)/);
  });

  test("never uses DRS wording before the DRS era", () => {
    const offenders = [];
    for (let i = 0; i < 300; i += 1) {
      const { text, textEn } = renderBattleEvent(baseArgs({ outcome: "drs", rng: lcg(i), state: { year: 2002, condition: "seco" } }));
      if (/DRS/i.test(`${text} ${textEn}`)) offenders.push(text);
    }
    expect(offenders).toEqual([]);
  });
});
