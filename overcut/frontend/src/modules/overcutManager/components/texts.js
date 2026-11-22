/**
 * Every sentence the manager shows.
 *
 * The engine returns kinds and numbers; this file is the only place that turns
 * them into words, in Spanish or English, decided once from the browser the way
 * the rest of OverCut does it.
 */

import { localizeRaceName } from "../../overcutTrayectoria/engine/circuits";
import { formatMoney } from "../engine/economy";

const detectLocale = () => {
  if (typeof navigator === "undefined") return "es";
  const lang = (navigator.language || navigator.userLanguage || "es").toLowerCase();
  return lang.startsWith("es") ? "es" : "en";
};

export const locale = detectLocale();
export const t = (es, en) => (locale === "es" ? es : en);

export const money = (value) => formatMoney(value, locale);
export const raceName = (name) => localizeRaceName(name, locale);

const MONTHS = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export const shortDate = (iso) => {
  if (!iso) return "";
  const [, month, day] = iso.split("-").map(Number);
  return locale === "es" ? `${day} ${MONTHS.es[month - 1]}` : `${MONTHS.en[month - 1]} ${day}`;
};

export const ordinal = (n) => (n ? (locale === "es" ? `${n}.º` : `P${n}`) : "—");

export const lapTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest.toFixed(3).padStart(6, "0")}`;
};

export const gapText = (row) => {
  if (!row) return "";
  if (row.status && row.status !== "finished" && row.status !== "running") return STATUS[row.status] ? STATUS[row.status]() : t("Abandono", "DNF");
  if (row.lapsDown > 0) return `+${row.lapsDown} ${row.lapsDown === 1 ? t("vuelta", "lap") : t("vueltas", "laps")}`;
  if (row.gap === null || row.gap === undefined || row.gap <= 0.001) return "";
  return `+${row.gap.toFixed(1)}s`;
};

export const STATUS = {
  mechanical: () => t("Avería", "Mechanical"),
  accident: () => t("Accidente", "Accident"),
  collision: () => t("Colisión", "Collision"),
  retired: () => t("Abandono", "DNF"),
  fuel: () => t("Sin gasolina", "Out of fuel"),
};

export const MIX = {
  lean: () => t("Pobre", "Lean"),
  standard: () => t("Estándar", "Standard"),
  rich: () => t("Rica", "Rich"),
};

export const ERS = {
  harvest: () => t("Recargar", "Harvest"),
  balanced: () => t("Neutro", "Neutral"),
  deploy: () => t("Desplegar", "Deploy"),
};

/** A corner by number and, where it has one, its name: "curva 1 (Tarzan)". */
export const cornerLabel = (number, track) => {
  if (!number) return "";
  const named = track?.corners?.find((corner) => corner.number === number)?.name;
  // Generic sketch names ("Curva 4") say nothing the number does not.
  const name = named && !/^(curva|turn)\s*\d/i.test(named) ? named : null;
  return name ? t(`curva ${number} (${name})`, `turn ${number} (${name})`) : t(`curva ${number}`, `turn ${number}`);
};

export const AREA = {
  aero: () => t("Aerodinámica", "Aerodynamics"),
  power: () => t("Motor", "Power unit"),
  chassis: () => t("Chasis", "Chassis"),
  reliability: () => t("Fiabilidad", "Reliability"),
};

export const AREA_HINT = {
  aero: () => t("Carga aerodinámica: manda en Mónaco, Hungría o Barcelona.", "Downforce: rules Monaco, Hungary and Barcelona."),
  power: () => t("Velocidad punta: manda en Monza, Spa o Bakú.", "Top speed: rules Monza, Spa and Baku."),
  chassis: () => t("Agarre mecánico, pianos y trato del neumático.", "Mechanical grip, kerbs and tyre treatment."),
  reliability: () => t("Cuántas veces ves la bandera a cuadros.", "How often you see the chequered flag."),
};

export const SIZE = {
  small: () => t("Mejora menor", "Small update"),
  medium: () => t("Paquete", "Package"),
  major: () => t("Gran evolución", "Major upgrade"),
};

export const ROLE = {
  first: () => t("Piloto n.º 1", "Number one"),
  equal: () => t("Igualdad", "Equal status"),
  second: () => t("Piloto n.º 2", "Number two"),
};

export const STAFF = {
  technical: () => t("Director técnico", "Technical director"),
  engineering: () => t("Jefe de ingeniería y estrategia", "Head of engineering & strategy"),
  operations: () => t("Jefe de mecánicos", "Chief mechanic"),
  commercial: () => t("Director comercial", "Commercial director"),
};

export const STAFF_HINT = {
  technical: () => t("Cuánto rinde cada proyecto de I+D y cuántos fallan.", "How much every R&D project yields and how many fail."),
  engineering: () => t("Puesta a punto en los libres y lectura de carrera de los rivales.", "Setup in practice and race reading."),
  operations: () => t("Paradas en boxes, errores en el pit-lane y fiabilidad.", "Pit stops, pit-lane errors and reliability."),
  commercial: () => t("Ingresos de patrocinio.", "Sponsorship income."),
};

export const COMPOUND = {
  dry: () => t("Seco", "Dry"),
  soft: () => t("Blando", "Soft"),
  medium: () => t("Medio", "Medium"),
  hard: () => t("Duro", "Hard"),
  inter: () => t("Intermedio", "Intermediate"),
  wet: () => t("Lluvia", "Wet"),
};

export const COMPOUND_LETTER = { dry: "S", soft: "B", medium: "M", hard: "D", inter: "I", wet: "LL" };
if (locale === "en") Object.assign(COMPOUND_LETTER, { soft: "S", hard: "H", wet: "W", dry: "D" });

export const MODE = {
  save: () => t("Conservar", "Conserve"),
  normal: () => t("Normal", "Standard"),
  push: () => t("Atacar", "Push"),
};

export const WEATHER = {
  dry: () => t("Seco", "Dry"),
  mixed: () => t("Cambiante", "Changeable"),
  wet: () => t("Lluvia", "Wet"),
};

export const PROGRAM = {
  setup: () => t("Puesta a punto", "Setup work"),
  longrun: () => t("Tandas largas", "Long runs"),
  quali: () => t("Simulación de clasificación", "Qualifying runs"),
};

export const PROGRAM_HINT = {
  setup: () => t("El coche sale más equilibrado: más rápido todo el fin de semana.", "A better-balanced car: quicker all weekend."),
  longrun: () => t("Aprendes a cuidar los neumáticos: degradan menos el domingo.", "Learn to look after the tyres: less wear on Sunday."),
  quali: () => t("Una vuelta más rápida el sábado.", "A quicker lap on Saturday."),
};

export const QUALI_STYLE = {
  safe: () => t("Sin riesgos", "Safe"),
  normal: () => t("Normal", "Normal"),
  push: () => t("Al límite", "On the limit"),
};

export const BACKER = {
  garagiste: { name: () => t("Garajista", "Garagiste"), copy: () => t("Poco dinero, coche lento y libertad total. La forma más dura.", "Little money, a slow car and total freedom. The hard way.") },
  corporate: { name: () => t("Grupo inversor", "Investment group"), copy: () => t("Presupuesto de media parrilla y un primer coche discreto.", "A midfield budget and a modest first car.") },
  manufacturer: { name: () => t("Fabricante", "Manufacturer"), copy: () => t("Una gran marca detrás: dinero, fábrica y expectativas.", "A big brand behind you: money, a factory and expectations.") },
};

export const TIER = [() => t("Flojo", "Weak"), () => t("Medio", "Average"), () => t("Bueno", "Good"), () => t("Referencia", "Benchmark")];

// ------------------------------------------------------------------ inbox

const teamName = (career, id) => career.world.teams[id]?.name || id;
const driverName = (career, id) => career.world.drivers[id]?.name || id;

export const inboxTitle = (career, item) => {
  switch (item.kind) {
    case "welcome":
      return item.owner ? t(`Bienvenido a ${teamName(career, item.teamId)}`, `Welcome to ${teamName(career, item.teamId)}`) : t(`Nuevo jefe de equipo de ${teamName(career, item.teamId)}`, `New team principal of ${teamName(career, item.teamId)}`);
    case "objectives":
      return career.owner ? t("Lo que esperan los inversores", "What the investors expect") : t("Los objetivos de la directiva", "The board's objectives");
    case "regulations":
      return t(`Cambio de reglamento en ${item.year}`, `New regulations for ${item.year}`);
    case "rd-done":
      return t(`${AREA[item.area]()}: ${item.target === "next" ? "trabajo para el año que viene listo" : "nueva pieza en el coche"}`, `${AREA[item.area]()}: ${item.target === "next" ? "next year's work delivered" : "new part on the car"}`);
    case "rd-failed":
      return t(`${AREA[item.area]()}: el proyecto no funcionó`, `${AREA[item.area]()}: the project did not work`);
    case "market-open":
      return t(`Se abre el mercado de pilotos para ${item.year}`, `The driver market opens for ${item.year}`);
    case "expiring":
      return t("Contratos que terminan este año", "Contracts ending this year");
    case "board-warning":
      return t("Aviso de la directiva", "A warning from the board");
    case "investors-warning":
      return t("Los inversores están preocupados", "The investors are worried");
    case "sacked":
      return t("Destituido", "Sacked");
    case "investors-out":
      return t("Los inversores retiran su dinero", "The investors pull out");
    case "bankrupt":
      return t("Quiebra", "Bankrupt");
    case "job-offers":
      return t("Ofertas de trabajo", "Job offers");
    case "new-season":
      return t(`Temporada ${item.year}`, `${item.year} season`);
    case "event":
      return eventText(career, item.event).title;
    default:
      return item.kind;
  }
};

export const inboxBody = (career, item) => {
  switch (item.kind) {
    case "welcome":
      return item.owner
        ? t("El equipo existe porque tú lo has creado. Los inversores han puesto el dinero; tú pones todo lo demás: coche, pilotos, personal y resultados.", "The team exists because you created it. The investors put up the money; you bring everything else: car, drivers, staff and results.")
        : t("La directiva te ha dado las llaves. Desde el muro de boxes decides la estrategia; desde la fábrica, el coche; en el mercado, quién lo conduce.", "The board has handed you the keys. From the pit wall you call the strategy; at the factory, the car; on the market, who drives it.");
    case "objectives":
      return t("Los tienes en la Oficina. La confianza sube y baja carrera a carrera según el resultado y la clasificación.", "They are in the Office. Confidence moves race by race with the results and the table.");
    case "regulations":
      return t("El año que viene el reglamento cambia mucho: lo que lleves de ventaja apenas se conserva, y el trabajo en el coche nuevo rinde más que nunca.", "Next year the rules change hard: little of any advantage carries over, and work on the new car pays more than ever.");
    case "rd-done":
      return t(`Ganancia: ${item.gain > 0 ? "+" : ""}${item.gain.toFixed(1)} puntos.`, `Gain: ${item.gain > 0 ? "+" : ""}${item.gain.toFixed(1)} points.`);
    case "rd-failed":
      return t(`El resultado: ${item.gain > 0 ? "+" : ""}${item.gain.toFixed(1)} puntos. A veces el túnel de viento miente.`, `The outcome: ${item.gain > 0 ? "+" : ""}${item.gain.toFixed(1)} points. Sometimes the wind tunnel lies.`);
    case "market-open":
      return t("Ya puedes negociar con pilotos para la próxima temporada: libres, promesas y los que acaban contrato.", "You can now negotiate with drivers for next season: free agents, prospects and those out of contract.");
    case "expiring":
      return t(`Termina su contrato: ${(item.drivers || []).map((id) => driverName(career, id)).join(", ")}. Renueva en Pilotos o busca sustituto en el Mercado.`, `Out of contract: ${(item.drivers || []).map((id) => driverName(career, id)).join(", ")}. Renew in Drivers or find a replacement on the Market.`);
    case "board-warning":
      return t(`La confianza ha caído al ${item.confidence}%. Si sigue bajando, te destituirán.`, `Confidence has fallen to ${item.confidence}%. If it keeps falling you will be sacked.`);
    case "investors-warning":
      return t(`La confianza de los inversores está en el ${item.confidence}%. Si se hunde, retirarán su dinero.`, `Investor confidence is at ${item.confidence}%. If it collapses they will pull their money.`);
    case "sacked":
      return t("La directiva ha decidido prescindir de ti. Mira si alguien te ofrece trabajo.", "The board has let you go. See whether anyone offers you a job.");
    case "investors-out":
      return t("Sin confianza no hay dinero. El proyecto termina aquí.", "No confidence, no money. The project ends here.");
    case "bankrupt":
      return t("Las deudas superan lo que nadie está dispuesto a cubrir. El equipo cierra.", "The debts are beyond what anyone will cover. The team closes.");
    case "job-offers":
      return t(`Equipos interesados: ${(item.offers || []).map((id) => teamName(career, id)).join(", ")}. Puedes decidir al terminar la temporada.`, `Interested teams: ${(item.offers || []).map((id) => teamName(career, id)).join(", ")}. You can decide at the end of the season.`);
    case "new-season":
      return t("Coches nuevos, pilotos nuevos, mismos objetivos: hacerlo mejor que el año pasado.", "New cars, new drivers, same objective: do better than last year.");
    case "event":
      return eventText(career, item.event).body;
    default:
      return "";
  }
};

// ----------------------------------------------------------------- events

export const eventText = (career, event) => {
  const p = event.params || {};
  const d = (id) => driverName(career, id);
  switch (event.template) {
    case "sponsor-offer":
      return {
        title: t("Un patrocinador quiere estar en el coche", "A sponsor wants to be on the car"),
        body: t(`Ofrece ${money(p.amount)} por Gran Premio hasta final de temporada.`, `They offer ${money(p.amount)} per Grand Prix until the end of the season.`),
        options: { accept: t("Aceptar", "Accept"), negotiate: t("Pedir un 30% más", "Ask for 30% more"), decline: t("Rechazar", "Decline") },
      };
    case "driver-role":
      return {
        title: t(`${d(p.driverId)} pide el mismo trato`, `${d(p.driverId)} wants equal treatment`),
        body: t(`Ha sumado más puntos que ${d(p.otherId)} en las últimas carreras y no quiere seguir siendo el número dos.`, `He has outscored ${d(p.otherId)} lately and does not want to stay number two.`),
        options: { equal: t("Igualdad desde ya", "Equal status now"), promise: t("Prometer revisarlo", "Promise to review it"), keep: t("Todo sigue igual", "Nothing changes") },
      };
    case "poach-staff":
      return {
        title: t("Quieren llevarse a tu director técnico", "They want your technical director"),
        body: t(`${teamName(career, p.teamId)} le ha hecho una oferta. Igualarla cuesta ${money(p.raise)} más al año.`, `${teamName(career, p.teamId)} has made him an offer. Matching it costs ${money(p.raise)} more a year.`),
        options: { counter: t("Igualar la oferta", "Match the offer"), release: t("Dejarle marchar", "Let him go") },
      };
    case "rule-clarification":
      return {
        title: t("La FIA cuestiona una pieza", "The FIA questions a part"),
        body: t(`Una aclaración técnica afecta a tu ${AREA[p.area]().toLowerCase()}. Recurrir cuesta ${money(p.cost)} y puede salir mal.`, `A technical clarification hits your ${AREA[p.area]().toLowerCase()}. An appeal costs ${money(p.cost)} and may fail.`),
        options: { comply: t("Acatar y modificar", "Comply and modify"), appeal: t("Recurrir", "Appeal") },
      };
    case "press-criticism":
      return {
        title: t(`${d(p.driverId)} critica el coche en público`, `${d(p.driverId)} criticises the car in public`),
        body: t("La prensa ya tiene titular. ¿Le respaldas o le multas?", "The press has its headline. Do you back him or fine him?"),
        options: { back: t("Respaldarle", "Back him"), fine: t("Multarle", "Fine him") },
      };
    case "supplier-price":
      return {
        title: t("Un proveedor sube el precio", "A supplier raises the price"),
        body: t(`Piden ${money(p.cost)} más por las piezas de esta temporada. Sin ellas, la fiabilidad se resiente.`, `They want ${money(p.cost)} more for this season's parts. Without them reliability suffers.`),
        options: { pay: t("Pagar", "Pay"), refuse: t("Negarse", "Refuse") },
      };
    case "facility-upgrade":
      return {
        title: t("Ampliar la fábrica", "Expand the factory"),
        body: t(`Un nuevo túnel de viento y simulador por ${money(p.cost)}: más proyectos a la vez y mejores resultados.`, `A new wind tunnel and simulator for ${money(p.cost)}: more projects at once and better results.`),
        options: { invest: t("Invertir", "Invest"), later: t("Más adelante", "Later") },
      };
    case "junior-test":
      return {
        title: t(`Test para ${d(p.driverId)}`, `A test for ${d(p.driverId)}`),
        body: t(`Una joven promesa pide un día en tu coche. Cuesta ${money(p.cost)} y sabrás hasta dónde puede llegar.`, `A prospect asks for a day in your car. It costs ${money(p.cost)} and shows how far he can go.`),
        options: { test: t("Darle el test", "Give him the test"), skip: t("No", "No") },
      };
    case "fan-day":
      return {
        title: t("Jornada con los aficionados", "Fan day"),
        body: t(`Un evento en la fábrica dejaría ${money(p.income)} y afición, a costa de cansar a los pilotos.`, `A factory event would bring ${money(p.income)} and fans, at the cost of tired drivers.`),
        options: { host: t("Organizarla", "Host it"), skip: t("No este año", "Not this year") },
      };
    case "reliability-scare":
      return {
        title: t("La avería tiene explicación", "The failure has an explanation"),
        body: t(`Los ingenieros proponen reconstruir el conjunto afectado por ${money(p.cost)}.`, `The engineers propose rebuilding the affected assembly for ${money(p.cost)}.`),
        options: { rebuild: t("Reconstruir", "Rebuild"), ignore: t("Seguir así", "Carry on") },
      };
    case "poach-driver":
      return {
        title: t(`${teamName(career, p.teamId)} quiere a ${d(p.driverId)}`, `${teamName(career, p.teamId)} want ${d(p.driverId)}`),
        body: t(`Pagarían ${money(p.fee)} para llevárselo al final de temporada.`, `They would pay ${money(p.fee)} to take him at the end of the season.`),
        options: { sell: t("Vender", "Sell"), refuse: t("No está en venta", "Not for sale") },
      };
    case "investor":
      return {
        title: t("Un inversor ofrece capital", "An investor offers capital"),
        body: t(`Aportaría ${money(p.amount)}, pero exige subir el objetivo del campeonato una posición.`, `He would put in ${money(p.amount)}, but demands a championship target one place higher.`),
        options: { accept: t("Aceptar", "Accept"), decline: t("Rechazar", "Decline") },
      };
    case "driver-unhappy":
      return {
        title: t(`${d(p.driverId)} no está contento`, `${d(p.driverId)} is unhappy`),
        body: t("Su moral está por los suelos y empieza a notarse en pista.", "His morale is on the floor and it is starting to show on track."),
        options: { talk: t("Hablar con él", "Talk to him"), release: t("Dejarle salir a final de año", "Let him leave at season end") },
      };
    default:
      return { title: event.template, body: "", options: {} };
  }
};

export const eventOutcome = (event) => {
  const outcome = event.resolved?.outcome;
  const map = {
    signed: t("Acuerdo firmado.", "Deal signed."),
    walked: t("Se ha ido a otro equipo.", "They went elsewhere."),
    declined: t("Rechazado.", "Declined."),
    equal: t("Ahora ambos tienen el mismo trato.", "Both now have equal status."),
    promise: t("Lo revisarás a final de temporada. No lo olvidará.", "You will review it at season end. He will not forget."),
    keep: t("No le ha gustado.", "He did not like it."),
    stays: t("Se queda.", "He stays."),
    left: t("Se ha ido. Su adjunto toma el mando de forma interina.", "He has left. His deputy takes over as interim."),
    complied: t("Pieza modificada. Algo de rendimiento perdido.", "Part modified. Some performance lost."),
    won: t("Recurso ganado: la pieza sigue en el coche.", "Appeal won: the part stays."),
    lost: t("Recurso perdido: más rendimiento perdido.", "Appeal lost: even more performance gone."),
    backed: t("El piloto lo agradece. La directiva, no tanto.", "The driver appreciates it. The board, less so."),
    fined: t("Mensaje recibido.", "Message received."),
    paid: t("Pagado.", "Paid."),
    refused: t("Rechazado.", "Refused."),
    built: t("Obras en marcha: la fábrica crece.", "Work under way: the factory grows."),
    later: t("Quizá más adelante.", "Maybe later."),
    tested: t("Test completado: ya conoces su techo.", "Test done: you now know his ceiling."),
    skipped: t("Otra vez será.", "Another time."),
    hosted: t("Un éxito de público.", "A crowd-pleaser."),
    rebuilt: t("Conjunto reconstruido.", "Assembly rebuilt."),
    ignored: t("Crucemos los dedos.", "Fingers crossed."),
    sold: t("Traspaso cerrado para final de temporada.", "Transfer agreed for season end."),
    accepted: t("Capital recibido.", "Capital received."),
    calmed: t("Se ha calmado.", "He has calmed down."),
    unmoved: t("No ha servido de mucho.", "It did not help much."),
    leaving: t("Se irá cuando acabe el año.", "He leaves when the year ends."),
  };
  return map[outcome] || "";
};

// ------------------------------------------------------------------- news

export const newsText = (career, item) => {
  switch (item.kind) {
    case "new-team":
      return t(`${teamName(career, item.teamId)} se presenta en la parrilla con ${item.manager} al frente`, `${teamName(career, item.teamId)} joins the grid with ${item.manager} in charge`);
    case "new-principal":
      return t(`${item.manager}, nuevo jefe de equipo de ${teamName(career, item.teamId)}`, `${item.manager} named team principal of ${teamName(career, item.teamId)}`);
    case "race":
      return t(`${driverName(career, item.driverId)} gana el ${raceName(item.race)}`, `${driverName(career, item.driverId)} wins the ${raceName(item.race)}`);
    case "champion":
      return t(`${driverName(career, item.driverId)} campeón; ${teamName(career, item.teamId)} gana el de constructores`, `${driverName(career, item.driverId)} champion; ${teamName(career, item.teamId)} take the constructors' title`);
    case "sacked":
      return t(`${teamName(career, item.teamId)} destituye a ${item.manager}`, `${teamName(career, item.teamId)} sack ${item.manager}`);
    case "history":
      return t(`Arranca ${item.year}: la parrilla real de aquel año, salvo lo que tú has cambiado`, `${item.year} begins: that year's real grid, except what you changed`);
    default:
      return "";
  }
};

// ----------------------------------------------------------- objectives

export const objectiveText = (career, objective) => {
  switch (objective.type) {
    case "constructors":
      return t(`Terminar ${ordinal(objective.target)} o mejor en constructores`, `Finish P${objective.target} or better in the constructors'`);
    case "wins":
      return objective.target === 1 ? t("Ganar al menos una carrera", "Win at least one race") : t(`Ganar ${objective.target} carreras`, `Win ${objective.target} races`);
    case "podium":
      return t("Subir al podio", "Score a podium");
    case "points":
      return t("Puntuar", "Score points");
    case "rival":
      return objective.ahead
        ? t(`Terminar por delante de ${teamName(career, objective.teamId)}`, `Finish ahead of ${teamName(career, objective.teamId)}`)
        : t(`Seguir por delante de ${teamName(career, objective.teamId)}`, `Stay ahead of ${teamName(career, objective.teamId)}`);
    case "budget":
      return t("Acabar el año sin números rojos", "End the year in the black");
    default:
      return objective.type;
  }
};

export const OBJECTIVE_STATE = {
  pending: () => t("Por empezar", "Not started"),
  "on-track": () => t("En camino", "On track"),
  close: () => t("Cerca", "Close"),
  "off-track": () => t("En peligro", "At risk"),
  done: () => t("Cumplido", "Done"),
  failed: () => t("Fallado", "Failed"),
};

// ------------------------------------------------------------- live race

export const radioText = (career, message, names) => {
  const who = names[message.carId] || "";
  switch (message.kind) {
    case "box-wet":
      return t(`${who}: «Está lloviendo de verdad. Box, box: ${COMPOUND[message.compound]()}».`, `${who}: "It's properly wet. Box, box: ${COMPOUND[message.compound]()}."`);
    case "box-dry":
      return t(`${who}: «La pista se está secando, los de lluvia se están deshaciendo».`, `${who}: "Track's drying, these wets are falling apart."`);
    case "cliff":
      return t(`${who}: «No me quedan neumáticos».`, `${who}: "I've got no tyres left."`);
    case "sc-window":
      return t(`Ingeniero: «Coche de seguridad. Si paramos ahora, la parada sale casi gratis».`, `Engineer: "Safety car. If we stop now it's almost a free stop."`);
    case "box-plan":
      return t(`Ingeniero a ${who}: «Box la próxima vuelta, ${COMPOUND[message.compound]()}».`, `Engineer to ${who}: "Box next lap, ${COMPOUND[message.compound]()}."`);
    case "hot":
      return t(`${who}: «Los neumáticos están sobrecalentados, se me va la parte trasera».`, `${who}: "Tyres are overheating, the rear is going."`);
    case "fuel":
      return t(`Ingeniero a ${who}: «Vamos justos de gasolina: modo pobre o no llegamos».`, `Engineer to ${who}: "We're marginal on fuel: lean mix or we won't make it."`);
    case "battery":
      return t(`Ingeniero a ${who}: «Batería vacía, deja de desplegar y recarga».`, `Engineer to ${who}: "Battery's empty, stop deploying and harvest."`);
    case "issue":
      return t(`${who}: «Algo no va bien, pierdo potencia». Ingeniero: «Lo vemos, ${message.loss.toFixed(1)}s por vuelta».`, `${who}: "Something's wrong, I'm losing power." Engineer: "We see it, ${message.loss.toFixed(1)}s a lap."`);
    case "drs":
      return t(`Ingeniero a ${who}: «Estás en DRS. Ataca».`, `Engineer to ${who}: "You're in DRS range. Go for it."`);
    default:
      return "";
  }
};

export const commentary = (event, names, track) => {
  const a = names[event.carId] || "";
  const b = names[event.otherId] || "";
  const where = event.corner ? cornerLabel(event.corner, track) : "";
  const at = where ? t(` en la ${where}`, ` at ${where}`) : "";
  switch (event.type) {
    case "pass":
      return t(`${a} adelanta a ${b}${at}${event.drs ? " con DRS" : ""}`, `${a} passes ${b}${at}${event.drs ? " with DRS" : ""}`);
    case "mistake":
      return event.kind === "spin"
        ? t(`¡Trompo de ${a}${at}! Pierde ${event.loss.toFixed(1)}s`, `${a} spins${at}! ${event.loss.toFixed(1)}s lost`)
        : event.kind === "wide"
          ? t(`${a} se sale de pista${at}`, `${a} runs wide${at}`)
          : t(`${a} bloquea ruedas${at}`, `${a} locks up${at}`);
    case "issue":
      return t(`${a} tiene problemas: pierde ${event.loss.toFixed(1)}s por vuelta`, `${a} has a problem: ${event.loss.toFixed(1)}s a lap down`);
    case "lead":
      return t(`${a} toma el liderato`, `${a} takes the lead`);
    case "pit":
      return t(
        `Parada de ${a}: ${COMPOUND[event.compound]()} · ${event.stationary.toFixed(1)}s${event.slow ? " (lenta)" : ""}${event.stacked ? " · parada doble" : ""}`,
        `${a} pits: ${COMPOUND[event.compound]()} · ${event.stationary.toFixed(1)}s${event.slow ? " (slow)" : ""}${event.stacked ? " · double stack" : ""}`,
      );
    case "dnf":
      return t(`${a} abandona${at}: ${STATUS[event.reason] ? STATUS[event.reason]().toLowerCase() : ""}`, `${a} is out${at}: ${STATUS[event.reason] ? STATUS[event.reason]().toLowerCase() : ""}`);
    case "sc":
      return t("¡Coche de seguridad en pista!", "Safety car deployed!");
    case "vsc":
      return t("Coche de seguridad virtual", "Virtual safety car");
    case "sc-in":
      return t("El coche de seguridad se retira: ¡se reanuda la carrera!", "Safety car in: racing resumes!");
    case "rain":
      return t("Empieza a llover", "Rain is falling");
    case "drying":
      return t("La pista se seca", "The track is drying");
    case "fastest":
      return t(`Vuelta rápida de ${a}`, `Fastest lap for ${a}`);
    case "contact":
      return t(`Toque entre ${a} y ${b}${at}: ${a} daña el coche`, `Contact between ${a} and ${b}${at}: ${a} has damage`);
    case "swap":
      return t(`Órdenes de equipo: ${b} deja pasar a ${a}`, `Team orders: ${b} lets ${a} through`);
    case "flag":
      return t(`¡Bandera a cuadros! Gana ${a}`, `Chequered flag! ${a} wins`);
    case "call":
      return event.call === "undercut"
        ? t(`Estrategia: ${a} entra antes para intentar el undercut`, `Strategy: ${a} stops early to try the undercut`)
        : event.call === "cover"
          ? t(`Estrategia: ${a} para para cubrir al coche de detrás`, `Strategy: ${a} stops to cover the car behind`)
          : event.call === "overcut"
            ? t(`Estrategia: ${a} alarga el stint para buscar el overcut`, `Strategy: ${a} stays out to try the overcut`)
            : t(`Estrategia: ${a} para a por la vuelta rápida`, `Strategy: ${a} pits for a fastest-lap attempt`);
    default:
      return "";
  }
};
