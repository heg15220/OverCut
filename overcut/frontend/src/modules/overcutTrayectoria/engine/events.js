/**
 * The things that happen to a driver that are not a race result.
 *
 * Every event is a choice with a cost on both sides, and - this is the part that
 * makes it a career rather than a series of pop-ups - most of them leave a flag
 * behind. Flags are read later: by the market when it decides who calls you, by
 * the press when it decides what to write, by your own team when it decides
 * whether to keep you after a bad year.
 *
 * Walking out on a team in 1972 should still be costing you seats in 1975. That
 * is what `flags` are for.
 */

import { clamp, substream } from "./rng.js";

/**
 * Effects an option can have. All optional.
 *
 *   attributes  deltas applied to the driver's six skills.
 *   trust       with the current team, 0..100. Low trust gets you replaced.
 *   reputation  a lasting nudge to standing in the paddock.
 *   money       in the same millions the salaries use.
 *   flags       set on the career, read for years afterwards.
 *   clearFlags  removed - a way to make amends for something.
 */
const EVENTS = [
  {
    id: "team-order",
    category: "garage",
    weight: 3,
    when: ({ stats, contract }) => stats && contract && stats.position <= 6,
    es: {
      title: "Órdenes de equipo",
      body: "El muro te pide que dejes pasar a tu compañero en la última carrera. Vas por delante y lo sabes.",
    },
    en: {
      title: "Team orders",
      body: "The pit wall asks you to let your team-mate through in the last race. You are ahead and you know it.",
    },
    options: [
      {
        id: "obey",
        es: "Obedecer sin rechistar",
        en: "Obey without a word",
        effects: { trust: 12, reputation: -3, flags: ["companyMan"] },
      },
      {
        id: "ignore",
        es: "Ignorar la radio",
        en: "Ignore the radio",
        effects: { trust: -18, reputation: 5, flags: ["defiant"] },
      },
      {
        id: "negotiate",
        es: "Aceptar, pero pedir algo a cambio",
        en: "Accept, but ask for something back",
        effects: { trust: 4, attributes: { technical: 1 }, flags: ["dealMaker"] },
      },
    ],
  },
  {
    id: "rival-clash",
    category: "rivalry",
    weight: 3,
    when: ({ stats }) => Boolean(stats),
    es: {
      title: "El toque",
      body: "Un adelantamiento acaba con los dos fuera. La prensa quiere una declaración y él ya ha dado la suya.",
    },
    en: {
      title: "Contact",
      body: "An overtake puts you both out. The press wants a line and he has already given his.",
    },
    options: [
      {
        id: "blame",
        es: "Echarle la culpa en público",
        en: "Blame him publicly",
        effects: { reputation: 2, flags: ["feud"], attributes: { consistency: -1 } },
      },
      {
        id: "own",
        es: "Asumir tu parte",
        en: "Take your share",
        effects: { trust: 8, reputation: 3, attributes: { racecraft: 1.5 } },
      },
      {
        id: "silence",
        es: "No decir nada",
        en: "Say nothing",
        effects: { trust: 3 },
      },
    ],
  },
  {
    id: "injury",
    category: "personal",
    weight: 2,
    when: ({ career }) => !career.flags.includes("injured"),
    es: {
      title: "La caída",
      body: "Te rompes la muñeca entrenando en invierno. Los médicos hablan de tres meses; la pretemporada empieza en seis semanas.",
    },
    en: {
      title: "The fall",
      body: "You break a wrist training over the winter. The doctors say three months; testing starts in six weeks.",
    },
    options: [
      {
        id: "rush",
        es: "Volver a tiempo como sea",
        en: "Come back in time whatever it takes",
        effects: { attributes: { pace: -2, consistency: -2.5 }, trust: 10, flags: ["injured"] },
      },
      {
        id: "rest",
        es: "Recuperarte del todo",
        en: "Recover properly",
        effects: { attributes: { consistency: 1.5 }, trust: -8, flags: ["injured"] },
      },
    ],
  },
  {
    id: "sponsor",
    category: "market",
    weight: 3,
    when: ({ career }) => career.history.length >= 1,
    es: {
      title: "El patrocinador",
      body: "Una marca quiere tu cara en todas partes. Pagan bien y quieren cuarenta días de agenda al año.",
    },
    en: {
      title: "The sponsor",
      body: "A brand wants your face everywhere. They pay well and they want forty days of your year.",
    },
    options: [
      {
        id: "sign",
        es: "Firmar",
        en: "Sign",
        effects: { money: 4.5, attributes: { pace: -0.8 }, reputation: 6, flags: ["commercial"] },
      },
      {
        id: "decline",
        es: "Rechazar y centrarte",
        en: "Decline and focus",
        effects: { attributes: { pace: 1.2, consistency: 1 } },
      },
    ],
  },
  {
    id: "engineer",
    category: "garage",
    weight: 3,
    when: ({ contract }) => Boolean(contract),
    es: {
      title: "Tu ingeniero se va",
      body: "El ingeniero con el que llevas trabajando desde el primer día tiene una oferta de otro equipo.",
    },
    en: {
      title: "Your engineer leaves",
      body: "The engineer you have worked with since day one has an offer from another team.",
    },
    options: [
      {
        id: "fight",
        es: "Presionar al equipo para retenerlo",
        en: "Push the team to keep him",
        effects: { trust: -6, attributes: { technical: 2.5 }, flags: ["demanding"] },
      },
      {
        id: "letgo",
        es: "Dejarlo marchar",
        en: "Let him go",
        effects: { attributes: { technical: -2 }, trust: 5 },
      },
    ],
  },
  {
    id: "secret-talks",
    category: "market",
    weight: 2,
    when: ({ contract }) => Boolean(contract) && contract.yearsRemaining > 1,
    es: {
      title: "Reunión discreta",
      body: "Un jefe de equipo rival te cita en un hotel de aeropuerto. Todavía te queda contrato.",
    },
    en: {
      title: "A quiet meeting",
      body: "A rival team principal wants to see you in an airport hotel. You are still under contract.",
    },
    options: [
      {
        id: "go",
        es: "Ir",
        en: "Go",
        effects: { flags: ["shopping"], reputation: 4, trust: -12 },
      },
      {
        id: "refuse",
        es: "Declinar la invitación",
        en: "Decline the invitation",
        effects: { trust: 14, flags: ["loyal"] },
      },
    ],
  },
  {
    id: "bad-car",
    category: "garage",
    weight: 3,
    when: ({ stats }) => stats && stats.carRank > stats.teamCount * 0.6,
    es: {
      title: "El coche no llega",
      body: "Llevas medio año pidiendo la evolución que nunca aparece. Un micrófono te pilla saliendo del box.",
    },
    en: {
      title: "The car is not coming",
      body: "You have spent half a year asking for an upgrade that never arrives. A microphone catches you leaving the garage.",
    },
    options: [
      {
        id: "vent",
        es: "Decir la verdad delante de la cámara",
        en: "Say the truth on camera",
        effects: { trust: -16, reputation: 7, flags: ["outspoken"] },
      },
      {
        id: "diplomatic",
        es: "Defender al equipo en público",
        en: "Defend the team in public",
        effects: { trust: 15, reputation: -2, flags: ["companyMan"] },
      },
      {
        id: "work",
        es: "Callarte y meterte en la fábrica",
        en: "Say nothing and live in the factory",
        effects: { attributes: { technical: 3 }, trust: 8 },
      },
    ],
  },
  {
    id: "young-teammate",
    category: "garage",
    weight: 3,
    when: ({ career }) => career.driver.age >= 30,
    es: {
      title: "El chico nuevo",
      body: "Tu nuevo compañero tiene 21 años, va rapidísimo desde el primer test y el equipo lo ha notado.",
    },
    en: {
      title: "The new kid",
      body: "Your new team-mate is 21, quick from the first test, and the team has noticed.",
    },
    options: [
      {
        id: "mentor",
        es: "Tomarlo bajo tu ala",
        en: "Take him under your wing",
        effects: { trust: 12, reputation: 3, flags: ["mentor"] },
      },
      {
        id: "crush",
        es: "Cerrarle todas las puertas",
        en: "Shut every door on him",
        effects: { attributes: { pace: 1.5, consistency: -1 }, trust: -8, flags: ["ruthless"] },
      },
    ],
  },
  {
    id: "safety-stand",
    category: "personal",
    weight: 2,
    when: ({ career }) => career.year < 1995,
    es: {
      title: "El circuito no es seguro",
      body: "Los pilotos hablan de no correr. Alguien tiene que dar la cara y todos miran hacia el mismo sitio.",
    },
    en: {
      title: "The circuit is not safe",
      body: "The drivers are talking about not racing. Somebody has to speak, and everyone is looking the same way.",
    },
    options: [
      {
        id: "lead",
        es: "Ponerte al frente",
        en: "Lead it",
        effects: { reputation: 10, trust: -10, flags: ["unionLeader"] },
      },
      {
        id: "sign",
        es: "Firmar pero no hablar",
        en: "Sign but stay quiet",
        effects: { reputation: 2 },
      },
      {
        id: "race",
        es: "Correr igualmente",
        en: "Race anyway",
        effects: { trust: 10, reputation: -6, flags: ["companyMan"] },
      },
    ],
  },
  {
    id: "family",
    category: "personal",
    weight: 2,
    when: ({ career }) => career.driver.age >= 27,
    es: {
      title: "En casa",
      body: "Nace tu primer hijo en mitad de la temporada europea.",
    },
    en: {
      title: "At home",
      body: "Your first child is born in the middle of the European season.",
    },
    options: [
      {
        id: "balance",
        es: "Reorganizar la vida",
        en: "Rearrange your life",
        effects: { attributes: { consistency: 2, pace: -0.5 }, flags: ["settled"] },
      },
      {
        id: "allin",
        es: "Seguir igual",
        en: "Carry on as before",
        effects: { attributes: { pace: 1 }, reputation: -2 },
      },
    ],
  },
  {
    id: "test-role",
    category: "market",
    weight: 2,
    when: ({ stats }) => stats && stats.points === 0,
    es: {
      title: "La llamada incómoda",
      body: "Te ofrecen quedarte como piloto probador un año. Es una salida digna y también una puerta que se cierra.",
    },
    en: {
      title: "The awkward call",
      body: "They offer you a year as test driver. It is a dignified exit and it is also a door closing.",
    },
    options: [
      {
        id: "accept",
        es: "Aceptar y trabajar desde dentro",
        en: "Accept and work from the inside",
        effects: { attributes: { technical: 4 }, reputation: -8, flags: ["testDriver"] },
      },
      {
        id: "refuse",
        es: "Rechazarlo y buscar volante",
        en: "Refuse and go find a seat",
        effects: { reputation: 3, flags: ["stubborn"] },
      },
    ],
  },
  {
    id: "title-pressure",
    category: "rivalry",
    weight: 3,
    when: ({ stats }) => stats && stats.position <= 2 && !stats.champion,
    es: {
      title: "Tan cerca",
      body: "Has perdido el título en la última carrera. El equipo quiere pasar página y tú no puedes.",
    },
    en: {
      title: "So close",
      body: "You lost the title in the final race. The team wants to move on and you cannot.",
    },
    options: [
      {
        id: "obsess",
        es: "Encerrarte a trabajar todo el invierno",
        en: "Lock yourself away all winter",
        effects: { attributes: { pace: 2.2, consistency: 1.5 }, flags: ["obsessed"] },
      },
      {
        id: "reset",
        es: "Desconectar por completo",
        en: "Switch off completely",
        effects: { attributes: { consistency: 2.5, racecraft: 1 } },
      },
    ],
  },
  {
    id: "champion-demands",
    category: "garage",
    weight: 3,
    when: ({ stats }) => stats && stats.champion,
    es: {
      title: "Campeón",
      body: "Con el número 1 en el morro, todo el mundo espera que pidas más. Tu jefe también.",
    },
    en: {
      title: "Champion",
      body: "With the number 1 on the nose, everyone expects you to ask for more. So does your boss.",
    },
    options: [
      {
        id: "demand",
        es: "Exigir estatus de primer piloto para siempre",
        en: "Demand number one status for good",
        effects: { trust: -6, reputation: 8, flags: ["numberOne"] },
      },
      {
        id: "humble",
        es: "Repartir el mérito con el equipo",
        en: "Give the credit to the team",
        effects: { trust: 18, reputation: 5, flags: ["beloved"] },
      },
    ],
  },
];

const localeOf = (entry, locale) => (locale === "en" ? entry.en : entry.es);

/**
 * Draw the events for one winter.
 *
 * At most two, never the same one twice in a career, and always ones whose
 * preconditions the career actually meets - so the game never asks a backmarker
 * how it feels to be champion.
 */
export const drawEvents = ({ career, stats, contract, seed, count = 1 }) => {
  const stream = substream(seed, "events", career.year);
  const pool = EVENTS.filter(
    (event) => !career.seenEvents.includes(event.id) && (!event.when || event.when({ career, stats, contract })),
  );

  const drawn = [];
  for (let index = 0; index < count && pool.length > 0; index += 1) {
    const picked = stream.pickWeighted(pool, (event) => event.weight);
    if (!picked) break;
    drawn.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return drawn;
};

export const presentEvent = (event, locale) => ({
  id: event.id,
  category: event.category,
  title: localeOf(event, locale).title,
  body: localeOf(event, locale).body,
  options: event.options.map((option) => ({
    id: option.id,
    label: locale === "en" ? option.en : option.es,
  })),
});

/** Every event there is. The screens read the category off these. */
export const allEvents = () => EVENTS;

export const findEvent = (eventId) => EVENTS.find((event) => event.id === eventId) || null;

/**
 * Apply a choice. Returns the pieces the career reducer folds in, rather than a
 * mutated career, so the whole loop stays a pure reduction.
 */
export const applyChoice = ({ event, optionId, attributes, contract, flags }) => {
  const option = event.options.find((entry) => entry.id === optionId) || event.options[0];
  const effects = option.effects || {};

  const nextAttributes = { ...attributes };
  Object.entries(effects.attributes || {}).forEach(([key, delta]) => {
    nextAttributes[key] = clamp((nextAttributes[key] ?? 50) + delta, 30, 99);
  });

  const nextFlags = [...flags];
  (effects.flags || []).forEach((flag) => {
    if (!nextFlags.includes(flag)) nextFlags.push(flag);
  });
  (effects.clearFlags || []).forEach((flag) => {
    const index = nextFlags.indexOf(flag);
    if (index >= 0) nextFlags.splice(index, 1);
  });

  return {
    attributes: nextAttributes,
    flags: nextFlags,
    trustDelta: effects.trust ?? 0,
    reputationDelta: effects.reputation ?? 0,
    money: effects.money ?? 0,
    contract: contract && effects.trust ? { ...contract, trust: clamp(contract.trust + effects.trust, 0, 100) } : contract,
  };
};

/**
 * How a flag colours the market years later. Positive opens doors, negative
 * closes them, and the effect is applied on top of reputation rather than
 * replacing it.
 */
export const marketFlagModifier = (flags = []) => {
  const table = {
    loyal: 4,
    beloved: 6,
    mentor: 3,
    dealMaker: 2,
    unionLeader: -2,
    outspoken: -5,
    shopping: -6,
    defiant: -4,
    demanding: -3,
    ruthless: -2,
    commercial: 3,
    numberOne: -4,
    testDriver: -8,
    stubborn: -3,
    injured: -2,
  };
  return flags.reduce((sum, flag) => sum + (table[flag] ?? 0), 0);
};

export { EVENTS };
