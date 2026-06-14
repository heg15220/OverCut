import { chooseEraTerm, isEraFeatureAllowed, raceKnowledgeStats } from "./careerRaceEraKnowledge";

const DEFAULT_CORNERS = [
  { es: "la curva 1", en: "Turn 1", type: "braking" },
  { es: "la horquilla", en: "the hairpin", type: "slow" },
  { es: "la chicane final", en: "the final chicane", type: "kerb" },
  { es: "la recta principal", en: "the main straight", type: "straight" },
  { es: "la entrada a boxes", en: "pit entry", type: "pit" },
  { es: "la ultima curva", en: "the final corner", type: "traction" },
];

const CIRCUIT_CORNERS = [
  {
    match: ["monaco"],
    corners: [
      { es: "Sainte Devote", en: "Sainte Devote", type: "braking" },
      { es: "Massenet", en: "Massenet", type: "flow" },
      { es: "la horquilla del Grand Hotel", en: "the Grand Hotel hairpin", type: "slow" },
      { es: "Portier", en: "Portier", type: "traction" },
      { es: "la salida del tunel", en: "the tunnel exit", type: "braking" },
      { es: "la Nouvelle Chicane", en: "the Nouvelle Chicane", type: "kerb" },
      { es: "Tabac", en: "Tabac", type: "flow" },
      { es: "Rascasse", en: "Rascasse", type: "slow" },
    ],
  },
  {
    match: ["belgian", "francorchamps"],
    corners: [
      { es: "La Source", en: "La Source", type: "slow" },
      { es: "Eau Rouge", en: "Eau Rouge", type: "commitment" },
      { es: "Raidillon", en: "Raidillon", type: "commitment" },
      { es: "Les Combes", en: "Les Combes", type: "braking" },
      { es: "Pouhon", en: "Pouhon", type: "flow" },
      { es: "Blanchimont", en: "Blanchimont", type: "commitment" },
      { es: "la parada de Bus Stop", en: "the Bus Stop chicane", type: "kerb" },
    ],
  },
  {
    match: ["italian", "monza"],
    corners: [
      { es: "la Rettifilo", en: "the Rettifilo", type: "braking" },
      { es: "la Variante della Roggia", en: "the Variante della Roggia", type: "kerb" },
      { es: "la primera de Lesmo", en: "the first Lesmo", type: "flow" },
      { es: "la segunda de Lesmo", en: "the second Lesmo", type: "traction" },
      { es: "Ascari", en: "Ascari", type: "commitment" },
      { es: "Parabolica", en: "Parabolica", type: "traction" },
    ],
  },
  {
    match: ["british", "silverstone"],
    corners: [
      { es: "Village", en: "Village", type: "braking" },
      { es: "Brooklands", en: "Brooklands", type: "braking" },
      { es: "Luffield", en: "Luffield", type: "traction" },
      { es: "Copse", en: "Copse", type: "commitment" },
      { es: "Maggotts", en: "Maggotts", type: "flow" },
      { es: "Becketts", en: "Becketts", type: "flow" },
      { es: "Stowe", en: "Stowe", type: "braking" },
      { es: "Club", en: "Club", type: "traction" },
    ],
  },
  {
    match: ["spanish", "barcelona"],
    corners: [
      { es: "la curva 1", en: "Turn 1", type: "braking" },
      { es: "la curva 3", en: "Turn 3", type: "flow" },
      { es: "la curva 5", en: "Turn 5", type: "slow" },
      { es: "la curva 9", en: "Turn 9", type: "commitment" },
      { es: "la curva 10", en: "Turn 10", type: "braking" },
      { es: "la ultima curva", en: "the final corner", type: "traction" },
    ],
  },
  {
    match: ["hungarian", "hungaroring"],
    corners: [
      { es: "la curva 1", en: "Turn 1", type: "braking" },
      { es: "la curva 2", en: "Turn 2", type: "traction" },
      { es: "la chicane", en: "the chicane", type: "kerb" },
      { es: "la curva 11", en: "Turn 11", type: "flow" },
      { es: "la curva 14", en: "Turn 14", type: "traction" },
    ],
  },
  {
    match: ["brazil", "sao paulo", "interlagos"],
    corners: [
      { es: "Senna S", en: "the Senna S", type: "braking" },
      { es: "Curva do Sol", en: "Curva do Sol", type: "traction" },
      { es: "Descida do Lago", en: "Descida do Lago", type: "braking" },
      { es: "Pinheirinho", en: "Pinheirinho", type: "slow" },
      { es: "Juncao", en: "Juncao", type: "traction" },
    ],
  },
  {
    match: ["canadian", "montreal"],
    corners: [
      { es: "la curva 1", en: "Turn 1", type: "braking" },
      { es: "la horquilla", en: "the hairpin", type: "slow" },
      { es: "el Muro de los Campeones", en: "the Wall of Champions", type: "kerb" },
      { es: "la chicane final", en: "the final chicane", type: "kerb" },
    ],
  },
  {
    match: ["singapore"],
    corners: [
      { es: "Sheares", en: "Sheares", type: "braking" },
      { es: "la curva 7", en: "Turn 7", type: "braking" },
      { es: "Anderson Bridge", en: "Anderson Bridge", type: "tight" },
      { es: "la curva 14", en: "Turn 14", type: "slow" },
      { es: "la ultima secuencia", en: "the final sequence", type: "traction" },
    ],
  },
  {
    match: ["australian", "melbourne"],
    corners: [
      { es: "la curva 1", en: "Turn 1", type: "braking" },
      { es: "la curva 3", en: "Turn 3", type: "braking" },
      { es: "la curva 9", en: "Turn 9", type: "flow" },
      { es: "la curva 11", en: "Turn 11", type: "commitment" },
      { es: "la curva 13", en: "Turn 13", type: "braking" },
    ],
  },
];

const MOVE_STYLES = [
  { es: "por dentro", en: "down the inside" },
  { es: "por fuera", en: "around the outside" },
  { es: "con un cambio de trayectoria", en: "with a switchback" },
  { es: "apurando la frenada", en: "by braking late" },
  { es: "con DRS al final de la recta", en: "with DRS at the end of the straight", needs: "drs" },
  { es: "traccionando antes que su rival", en: "by getting earlier traction" },
  { es: "metiéndose en el hueco minimo", en: "by squeezing into the smallest gap" },
  { es: "cruzando el coche en la salida", en: "by crossing over on exit" },
  { es: "manteniendo dos curvas en paralelo", en: "after staying side by side for two corners" },
  { es: "en una maniobra a dos bandas", en: "with a two-car move" },
  { es: "leyendo mejor el trafico", en: "by reading traffic better" },
  { es: "aprovechando neumaticos mas vivos", en: "on fresher tyres" },
];

const MOVE_RESULTS = [
  { es: "completa el adelantamiento sin bloquear", en: "completes the pass without locking up" },
  { es: "sale delante por medio coche", en: "comes out ahead by half a car length" },
  { es: "fuerza al rival a levantar", en: "forces the rival to lift" },
  { es: "gana la posicion y estabiliza temperatura de neumaticos", en: "takes the place and keeps the tyres in the window" },
  { es: "se queda con la cuerda para la siguiente curva", en: "keeps the apex for the next corner" },
  { es: "roza el piano pero mantiene el coche bajo control", en: "rides the kerb but keeps the car under control" },
  { es: "convierte la defensa en ataque y gana una plaza", en: "turns defence into attack and gains a place" },
  { es: "supera a dos coches que peleaban entre ellos", en: "passes two cars that were fighting each other" },
  { es: "no culmina la maniobra, pero deja tocado al rival para la siguiente recta", en: "cannot finish it, but weakens the rival for the next straight" },
  { es: "levanta al limite para evitar contacto y conserva el impulso", en: "backs out just enough to avoid contact and keeps momentum" },
];

const INCIDENT_CAUSES = [
  { es: "bloqueo delantero", en: "front lock-up" },
  { es: "latigazo de sobreviraje", en: "snap oversteer" },
  { es: "toque rueda con rueda", en: "wheel-to-wheel contact" },
  { es: "freno sobrecalentado", en: "overheated brakes" },
  { es: "piano demasiado agresivo", en: "too much kerb" },
  { es: "aquaplaning", en: "aquaplaning", needs: "wet" },
  { es: "pieza de fibra de carbono en pista", en: "carbon fibre debris on track" },
  { es: "salida lenta de un doblado", en: "a slow lapped car on exit" },
  { es: "perdida de potencia", en: "loss of power" },
  { es: "neumatico frio tras la parada", en: "cold tyres after the stop" },
  { es: "pinchazo lento", en: "a slow puncture" },
  { es: "embrague castigado en la resalida", en: "a stressed clutch at the restart", needs: "restart" },
];

const INCIDENT_OUTCOMES = [
  { es: "hay bandera amarilla local", en: "local yellow flags are shown" },
  { es: "direccion de carrera activa VSC", en: "race control deploys the VSC", needs: "vsc" },
  { es: "sale el safety car", en: "the safety car is deployed", needs: "safetyCar" },
  { es: "la pista queda llena de restos y se investiga el incidente", en: "debris is scattered and the incident is investigated" },
  { es: "el coche llega lento a boxes", en: "the car limps back to the pits" },
  { es: "los comisarios preparan doble amarilla", en: "marshals prepare double yellows" },
  { es: "se abre una ventana estrategica inesperada", en: "an unexpected strategy window opens", needs: "advancedStrategy" },
  { es: "varios pilotos aprovechan para parar", en: "several drivers dive into the pits", needs: "pitStrategy" },
  { es: "la direccion considera bandera roja", en: "race control considers a red flag", needs: "redFlag" },
  { es: "el peloton se compacta de golpe", en: "the field suddenly bunches up" },
];

const STRATEGY_EVENTS = [
  {
    es: "{driver} intenta el undercut sobre {rival}; la vuelta de salida sera decisiva con goma fria.",
    en: "{driver} tries the undercut on {rival}; the out-lap on cold tyres will decide it.",
    needs: "advancedStrategy",
  },
  {
    es: "{driver} alarga el stint buscando overcut: necesita aire limpio y no castigar el eje trasero.",
    en: "{driver} extends the stint for an overcut: clean air and rear-tyre control are essential.",
    needs: "advancedStrategy",
  },
  {
    es: "{team} prepara doble parada; un segundo lento puede costar dos posiciones.",
    en: "{team} prepares a double stack; one slow second could cost two places.",
    needs: "pitStrategy",
  },
  {
    es: "{driver} cambia a intermedios antes que el grupo y apuesta por lluvia estable.",
    en: "{driver} switches to intermediates before the pack and bets on sustained rain.",
    needs: "wet",
  },
  {
    es: "{driver} se queda en pista con slicks mientras el radar promete solo tres vueltas de lluvia.",
    en: "{driver} stays out on slicks while the radar suggests only three laps of rain.",
    needs: "wet",
  },
  {
    es: "{team} ajusta el aleron delantero en la parada para recuperar estabilidad en entrada de curva.",
    en: "{team} tweaks the front wing at the stop to recover entry stability.",
  },
  {
    es: "{driver} recibe orden de levantar y rodar en delta positivo durante el VSC.",
    en: "{driver} is told to lift and keep a positive delta under VSC.",
    needs: "vsc",
  },
  {
    es: "{driver} protege bateria para atacar tras la resalida.",
    en: "{driver} saves battery to attack after the restart.",
    needs: ["restart", "ers"],
  },
];

const LEADER_EVENTS = [
  {
    es: "{leader} lidera, pero {chaser} esta a menos de un segundo y abre DRS en cada recta.",
    en: "{leader} leads, but {chaser} is within one second and opens DRS on every straight.",
    needs: "drs",
  },
  {
    es: "{leader} marca vuelta rapida y rompe el tren de DRS.",
    en: "{leader} sets fastest lap pace and breaks the DRS train.",
    needs: "drs",
  },
  {
    es: "{leader} informa de vibraciones; {chaser} empieza a oler sangre.",
    en: "{leader} reports vibrations; {chaser} starts to sense an opening.",
  },
  {
    es: "La cabeza se agrupa: {leader}, {chaser} y {third} ruedan separados por menos de tres segundos.",
    en: "The lead group compresses: {leader}, {chaser} and {third} are covered by less than three seconds.",
  },
  {
    es: "{leader} gestiona goma delantera y acepta perder dos decimas por vuelta.",
    en: "{leader} manages the front tyres and accepts losing two tenths per lap.",
  },
  {
    es: "{chaser} se acerca a {leader} despues de encontrar aire limpio tras la parada.",
    en: "{chaser} closes on {leader} after finding clean air after the stop.",
  },
];

const WEATHER_EVENTS = [
  {
    es: "El radar avisa lluvia cerca de {corner}; el muro prepara intermedios por si la nube llega antes de lo previsto.",
    en: "The radar shows rain near {corner}; the pit wall prepares intermediates in case the cloud arrives early.",
    needs: "rainThreat",
  },
  {
    es: "Empiezan gotas en {corner}; los muros dudan entre slicks e intermedios.",
    en: "Rain drops appear at {corner}; pit walls hesitate between slicks and intermediates.",
    needs: "wet",
  },
  {
    es: "La trazada seca vuelve en {corner}, pero fuera de linea aun no hay agarre.",
    en: "The dry line returns at {corner}, but there is still no grip off-line.",
    needs: "dryReturn",
  },
  {
    es: "La pista empieza a secarse en {corner}; quien cambie demasiado pronto puede destruir los slicks.",
    en: "The track starts drying at {corner}; switching too early could destroy the slicks.",
    needs: "dryReturn",
  },
  {
    es: "El viento cambia en el sector rapido y varios coches corrigen con volante abierto.",
    en: "Wind changes in the fast sector and several cars correct with open steering.",
  },
  {
    es: "La temperatura de pista cae y el neumatico medio tarda dos vueltas mas en encender.",
    en: "Track temperature drops and the medium tyre needs two extra laps to switch on.",
  },
  {
    es: "Direccion muestra bandera amarilla y roja por baja adherencia en {corner}.",
    en: "Race control shows the yellow-and-red flag for low grip at {corner}.",
    needs: "wet",
  },
];

const RACE_RHYTHM_EVENTS = [
  {
    es: "Carrera en ritmo verde: el grupo se estira y cada piloto protege su ventana de neumaticos.",
    en: "Green-flag rhythm: the field stretches out and every driver protects their tyre window.",
  },
  {
    es: "Sin neutralizaciones, la carrera entra en fase de gestion pura: aire limpio, temperatura y paciencia.",
    en: "With no neutralisation, the race moves into pure management: clean air, temperature and patience.",
  },
  {
    es: "El peloton se ordena por ritmo real; adelantar exige preparar la maniobra varias curvas antes.",
    en: "The field settles by real pace; overtaking needs to be prepared several corners in advance.",
  },
  {
    es: "Los muros comparan tiempos de vuelta: la amenaza ya no es el coche de delante, sino la ventana de parada.",
    en: "Pit walls compare lap times: the threat is no longer just the car ahead, but the stop window.",
    needs: "pitStrategy",
  },
];

const VSC_EVENTS = [
  {
    es: "Virtual Safety Car: todos deben respetar el delta y el muro recalcula si la parada sale barata.",
    en: "Virtual Safety Car: everyone must respect the delta and the pit wall recalculates whether the stop is cheap.",
  },
  {
    es: "VSC en pista por restos pequenos; no se compacta el grupo, pero la ventana estrategica cambia de golpe.",
    en: "VSC for small debris; the field does not bunch up, but the strategy window changes instantly.",
  },
  {
    es: "Direccion de carrera activa VSC: el ritmo cae sin juntar al peloton y las baterias se reorganizan.",
    en: "Race control deploys the VSC: pace drops without bunching the field and battery plans reset.",
  },
];

const RED_FLAG_EVENTS = [
  {
    es: "Bandera roja: el impacto en {corner} deja barreras por reparar y la carrera se detiene.",
    en: "Red flag: the impact at {corner} leaves barriers to repair and the race is stopped.",
  },
  {
    es: "Bandera roja por lluvia intensa; los coches vuelven al pit lane en orden de carrera.",
    en: "Red flag for heavy rain; cars return to the pit lane in race order.",
  },
  {
    es: "La carrera queda neutralizada con bandera roja tras un accidente multiple en {corner}.",
    en: "The race is neutralised with a red flag after a multi-car crash at {corner}.",
  },
  {
    es: "Bandera roja por restos grandes en pista: los mecanicos preparan ajustes para la nueva salida.",
    en: "Red flag for large debris on track: mechanics prepare setup changes for the restart.",
  },
];

const RESTART_EVENTS = [
  {
    es: "Resalida lanzada: {driver} calienta frenos, deja dos coches de margen y ataca al llegar a {corner}.",
    en: "Rolling restart: {driver} warms the brakes, leaves a two-car gap and attacks into {corner}.",
    kind: "safetyCar",
  },
  {
    es: "Nueva salida parada: {driver} clava el embrague y protege el interior de {corner}.",
    en: "Standing restart: {driver} nails the clutch and protects the inside of {corner}.",
    kind: "redFlag",
  },
  {
    es: "El safety car se marcha; {leader} espera hasta la linea y comprime al grupo.",
    en: "The safety car comes in; {leader} waits until the line and compresses the field.",
    kind: "safetyCar",
  },
  {
    es: "La resalida mezcla estrategias: blandos contra medios y bateria al maximo.",
    en: "The restart mixes strategies: softs against mediums and full battery deployment.",
    kind: "any",
    needs: "ers",
  },
];

const EXTRA_PHASES = [
  {
    es: "en plena gestion de bateria",
    en: "while managing battery deployment",
    needs: "ers",
  },
  {
    es: "con el tren de DRS formado",
    en: "with the DRS train forming",
    needs: "drs",
  },
  {
    es: "tras una vuelta de salida complicada",
    en: "after a tricky out-lap",
  },
  {
    es: "cuando el neumatico delantero empieza a abrirse",
    en: "as the front tyre starts to grain",
  },
  {
    es: "con el deposito mas ligero",
    en: "with the fuel load coming down",
  },
  {
    es: "mientras el muro recalcula la ventana de parada",
    en: "while the pit wall recalculates the stop window",
  },
  {
    es: "en trafico de doblados",
    en: "in lapped traffic",
  },
  {
    es: "justo despues de cambiar el mapa motor",
    en: "right after changing engine mode",
  },
  {
    es: "con goma usada contra goma nueva",
    en: "on used tyres against fresh tyres",
  },
  {
    es: "cuando la pista empieza a mejorar",
    en: "as the track starts to improve",
  },
];

const EXTRA_ACTIONS = [
  {
    es: "{driver} amaga por fuera y corta hacia el vertice para descolocar a {rival}",
    en: "{driver} feints outside and cuts back to the apex to unsettle {rival}",
  },
  {
    es: "{driver} fuerza a {rival} a defender antes de tiempo y gana traccion en la salida",
    en: "{driver} forces {rival} to defend early and gets better traction on exit",
  },
  {
    es: "{driver} se mete en el rebufo, descarga bateria y llega emparejado",
    en: "{driver} tucks into the slipstream, deploys battery and draws alongside",
    needs: "ers",
  },
  {
    es: "{driver} levanta medio segundo para enfriar frenos y preparar el ataque siguiente",
    en: "{driver} lifts for half a second to cool the brakes and prepare the next attack",
  },
  {
    es: "{team} pide a {driver} proteger el neumatico trasero izquierdo",
    en: "{team} asks {driver} to protect the left-rear tyre",
  },
  {
    es: "{driver} encuentra agarre fuera de la trazada limpia",
    en: "{driver} finds grip away from the clean racing line",
  },
  {
    es: "{driver} salva una correccion de volante a alta velocidad",
    en: "{driver} catches a high-speed steering correction",
  },
  {
    es: "{driver} cambia el balance de frenada dos puntos hacia delante",
    en: "{driver} moves brake balance two clicks forward",
  },
  {
    es: "{driver} se queda sin DRS por una decima y debe defender a pulso",
    en: "{driver} misses DRS by a tenth and has to defend manually",
    needs: "drs",
  },
  {
    es: "{driver} usa el piano interior para mantener el coche dentro del limite",
    en: "{driver} uses the inside kerb to keep the car within track limits",
  },
];

const EXTRA_OUTCOMES = [
  {
    es: "la maniobra cambia el ritmo del grupo durante dos vueltas",
    en: "the move changes the pace of the group for two laps",
  },
  {
    es: "el rival queda fuera de temperatura y pierde otra posicion",
    en: "the rival drops out of the tyre window and loses another place",
  },
  {
    es: "el muro celebra por radio una ejecucion limpia",
    en: "the pit wall praises a clean execution over the radio",
  },
  {
    es: "direccion de carrera anota la accion, pero no hay investigacion",
    en: "race control notes the action, but there is no investigation",
  },
  {
    es: "el coche queda vulnerable en la recta siguiente",
    en: "the car is vulnerable on the following straight",
  },
  {
    es: "la trazada sucia deja pequenas vibraciones en el volante",
    en: "the dirty line leaves small vibrations through the steering wheel",
  },
  {
    es: "la parada prevista se retrasa una vuelta para evitar trafico",
    en: "the planned stop is delayed by one lap to avoid traffic",
  },
  {
    es: "el lider recibe aviso de que la amenaza es real",
    en: "the leader is warned that the threat is real",
  },
  {
    es: "el grupo se parte y aparece aire limpio",
    en: "the pack splits and clean air opens up",
  },
  {
    es: "la grada reacciona porque la accion ha sido al limite",
    en: "the grandstands react because the move was right on the edge",
  },
];

const EXTRA_CONTEXTS = [
  {
    es: "sin tocarse",
    en: "without contact",
  },
  {
    es: "con una ligera bloqueada",
    en: "with a slight lock-up",
  },
  {
    es: "a menos de un segundo del coche de delante",
    en: "within one second of the car ahead",
    needs: "drs",
  },
  {
    es: "mientras cae alguna gota aislada",
    en: "as a few isolated drops fall",
    needs: "wet",
  },
  {
    es: "con el ingeniero pidiendo calma",
    en: "with the engineer asking for calm",
  },
  {
    es: "despues de pisar grava en la vuelta anterior",
    en: "after touching gravel on the previous lap",
  },
];

const PRESSURE_TRIGGERS = [
  {
    es: "la presion de neumaticos sube por encima de la ventana ideal",
    en: "tyre pressure rises above the ideal window",
  },
  {
    es: "el ingeniero avisa de lift and coast en la recta anterior",
    en: "the engineer calls for lift and coast on the previous straight",
  },
  {
    es: "el coche empieza a tocar fondo al final de recta",
    en: "the car starts bottoming at the end of the straight",
  },
  {
    es: "el trafico de boxes deja a {driver} en aire sucio",
    en: "pit-lane traffic drops {driver} into dirty air",
  },
  {
    es: "{rival} cambia de mapa y gana velocidad punta",
    en: "{rival} changes mode and gains top speed",
  },
  {
    es: "el viento de cola cambia el punto de frenada",
    en: "tailwind changes the braking marker",
  },
  {
    es: "la temperatura del freno trasero empieza a escalar",
    en: "rear brake temperature starts climbing",
  },
  {
    es: "el equipo detecta vibracion en la goma delantera derecha",
    en: "the team detects vibration on the front-right tyre",
  },
];

const PRESSURE_REACTIONS = [
  {
    es: "{driver} abre la trazada y sacrifica entrada para salir mejor",
    en: "{driver} opens the line and sacrifices entry for a better exit",
  },
  {
    es: "{driver} cambia el diferencial para ganar traccion",
    en: "{driver} adjusts the differential to gain traction",
  },
  {
    es: "{team} pide defender el interior y no gastar bateria",
    en: "{team} asks for inside defence without spending battery",
    needs: "ers",
  },
  {
    es: "{driver} deja respirar los neumaticos durante media vuelta",
    en: "{driver} lets the tyres breathe for half a lap",
  },
  {
    es: "{driver} busca aire limpio separandose del coche de delante",
    en: "{driver} looks for clean air by dropping back from the car ahead",
  },
  {
    es: "{driver} prepara la frenada con un cambio corto",
    en: "{driver} prepares the braking zone with a short shift",
  },
  {
    es: "{team} retrasa la parada para cubrir una posible neutralizacion",
    en: "{team} delays the stop to cover a possible neutralisation",
  },
  {
    es: "{driver} acepta perder DRS para no sobrecalentar el coche",
    en: "{driver} accepts losing DRS to avoid overheating the car",
    needs: "drs",
  },
];

const PRESSURE_CONSEQUENCES = [
  {
    es: "la decision evita una caida brusca de ritmo",
    en: "the decision prevents a sudden pace drop",
  },
  {
    es: "el rival se acerca pero no encuentra hueco limpio",
    en: "the rival closes in but cannot find a clean gap",
  },
  {
    es: "la diferencia se mantiene estable en ocho decimas",
    en: "the gap stabilises at eight tenths",
  },
  {
    es: "la siguiente vuelta sera clave para decidir la parada",
    en: "the next lap will be key to deciding the stop",
  },
  {
    es: "el coche gana estabilidad pero pierde punta",
    en: "the car gains stability but loses top speed",
  },
  {
    es: "el muro cambia el plan de ataque a una vuelta mas tarde",
    en: "the pit wall moves the attack plan one lap later",
  },
  {
    es: "aparece una oportunidad si hay error en la salida de curva",
    en: "an opportunity appears if there is a mistake on corner exit",
  },
  {
    es: "el grupo se comprime y cualquier bloqueo puede cambiar tres posiciones",
    en: "the group compresses and any lock-up could change three positions",
  },
];

const PLAYER_EVENT_SETUPS = [
  { es: "{driver} mide la salida de {rival} antes de abrir DRS", en: "{driver} measures {rival}'s exit before opening DRS", delta: 0, type: "player", needs: "drs" },
  { es: "{driver} prepara el adelantamiento sobre {rival} desde dos curvas antes", en: "{driver} sets up the pass on {rival} two corners in advance", delta: -1, type: "player" },
  { es: "{driver} cubre el interior ante el ataque de {rival}", en: "{driver} covers the inside against {rival}'s attack", delta: 0, type: "player" },
  { es: "{driver} queda sin bateria para defenderse de {rival}", en: "{driver} runs out of battery to defend from {rival}", delta: 1, type: "player", needs: "ers" },
  { es: "{driver} bloquea el neumatico delantero", en: "{driver} locks the front tyre", delta: 1, type: "danger" },
  { es: "{driver} toca ligeramente a {rival} en plena batalla", en: "{driver} makes light contact with {rival} in the fight", delta: 1, type: "danger" },
  { es: "{driver} completa una vuelta de salida mejor que {rival}", en: "{driver} completes a better out-lap than {rival}", delta: -1, type: "player" },
  { es: "{driver} pierde temperatura tras el safety car", en: "{driver} loses tyre temperature after the safety car", delta: 1, type: "player", needs: "safetyCar" },
  { es: "{driver} salva un latigazo del coche", en: "{driver} catches a snap from the car", delta: 0, type: "player" },
  { es: "{team} cambia el plan de {driver}", en: "{team} changes {driver}'s plan", delta: 0, type: "player" },
];

const PLAYER_EVENT_ACTIONS = [
  { es: "se tira por dentro justo al soltar el freno y deja el coche colocado en el vertice", en: "dives down the inside as he releases the brake and places the car on the apex" },
  { es: "aguanta por fuera con medio coche en paralelo y mejor traccion", en: "hangs around the outside with half a car alongside and better traction" },
  { es: "con un contravolante al pisar el piano", en: "with opposite lock after touching the kerb" },
  { es: "levanta lo justo para evitar contacto y vuelve a cargar bateria", en: "lifts just enough to avoid contact and starts harvesting again", needs: "ers" },
  { es: "alarga la frenada sin bloquear y obliga al rival a dejar espacio", en: "brakes late without locking and forces the rival to leave room" },
  { es: "protegiendo la bateria para la recta siguiente", en: "saving battery for the next straight", needs: "ers" },
  { es: "cruza la trazada en la salida y gana el interior de la siguiente curva", en: "switches back on exit and gains the inside for the next corner" },
  { es: "aprovecha una correccion minima del rival y mete el morro", en: "pounces on a tiny correction from the rival and gets the nose in" },
  { es: "con neumaticos frios y poca adherencia", en: "on cold tyres with little grip" },
  { es: "con el coche deslizando de atras", en: "with the rear of the car sliding" },
];

const PLAYER_EVENT_RESULTS = [
  { es: "sale por delante y corta el DRS del rival al final del sector", en: "comes out ahead and breaks the rival's DRS by the end of the sector", adjust: -1, needs: "drs" },
  { es: "mantiene la posicion por menos de medio coche y fuerza al rival a levantar", en: "keeps the place by less than half a car length and forces the rival to lift", adjust: 0 },
  { es: "pierde una posicion y debe recomponer la vuelta", en: "loses one place and has to rebuild the lap", adjust: 1 },
  { es: "pierde dos posiciones por salir sin traccion", en: "loses two places after exiting without traction", adjust: 2 },
  { es: "evita el contacto pero sacrifica la trazada y queda vulnerable", en: "avoids contact but sacrifices the line and becomes vulnerable", adjust: 1 },
  { es: "obliga al rival a levantar y mantiene aire limpio para empujar", en: "forces the rival to lift and keeps clean air to push", adjust: 0 },
  { es: "se queda en paralelo hasta la siguiente curva y el duelo sigue abierto", en: "stays side by side until the next corner and the duel remains open", adjust: 0 },
  { es: "aprovecha dos coches peleando y convierte la accion en ganancia doble", en: "uses two cars fighting ahead and turns it into a double gain", adjust: -2 },
  { es: "danan ligeramente el aleron y el coche subvira", en: "slightly damages the wing and the car understeers", adjust: 2 },
  { es: "recibe aviso de posible investigacion", en: "is warned about a possible investigation", adjust: 0 },
];

const PLAYER_EVENT_CONTEXTS = [
  { es: "cuando el stint entra en su fase critica", en: "as the stint enters its critical phase" },
  { es: "con lluvia fina en el visor", en: "with fine rain on the visor", needs: "wet" },
  { es: "mientras el muro pide no exceder limites de pista", en: "while the pit wall warns about track limits" },
  { es: "con un coche lento justo delante", en: "with a slow car just ahead" },
  { es: "tras una radio corta y tensa", en: "after a short and tense radio call" },
  { es: "cuando los frenos estan al limite", en: "when the brakes are on the limit" },
  { es: "con el grupo comprimido por el DRS", en: "with the pack compressed by DRS", needs: "drs" },
];

const replaceVars = (template, vars) =>
  template.replace(/\{(\w+)}/g, (_, key) => vars[key] ?? "");

export const getCornersForRace = (raceName = "") => {
  const normalized = raceName.toLowerCase();
  const matched = CIRCUIT_CORNERS.find((entry) => entry.match.some((token) => normalized.includes(token)));
  return matched?.corners || DEFAULT_CORNERS;
};

const pick = (items, rng) => items[Math.floor(rng() * items.length)];

// Wet means the track is wet *right now* (current condition), not merely that
// rain happened earlier and has since dried — otherwise rain flavour would leak
// into a track that is dry again.
const isWet = (state = {}) =>
  Boolean(state.wet) || state.condition === "lluvia" || state.condition === "intermedios";

// Whether a single requirement tag is satisfied by the live race state.
const needMet = (need, state = {}) => {
  switch (need) {
    case "safetyCar":
      return isEraFeatureAllowed(state.year, "safetyCar") && Boolean(state.scActive || state.scHappenedBefore);
    case "redFlag":
      return Boolean(state.redFlagActive || state.redFlagHappenedBefore);
    case "restart":
      return Boolean(
        state.scActive || state.scHappenedBefore || state.redFlagActive || state.redFlagHappenedBefore
      );
    case "drs":
      return isEraFeatureAllowed(state.year, "drs");
    case "vsc":
      return isEraFeatureAllowed(state.year, "vsc");
    case "ers":
      return isEraFeatureAllowed(state.year, "ers");
    case "refueling":
      return isEraFeatureAllowed(state.year, "refueling");
    case "advancedStrategy":
      return (state.year || 2026) >= 1978;
    case "pitStrategy":
      return (state.year || 2026) >= 1993;
    case "wet":
      return isWet(state);
    case "rainThreat":
      return Boolean(state.rainThreat || state.rainArrived || isWet(state));
    case "dryReturn":
      return Boolean(state.dryingNow);
    default:
      return true;
  }
};

// Decide whether a template is allowed given the live race state at its lap.
// Templates without a `needs` tag are always eligible; an array of needs means
// every requirement must hold (e.g. a restart line that also needs ERS).
const isEligible = (template, state = {}) => {
  if (!template || !template.needs) return true;
  if (Array.isArray(template.needs)) return template.needs.every((need) => needMet(need, state));
  return needMet(template.needs, state);
};

// Pick respecting eligibility. Falls back to the untagged subset (and finally to
// the full list) so a render call always returns something coherent.
const pickEligible = (items, rng, state = {}) => {
  const eligible = items.filter((item) => isEligible(item, state));
  if (eligible.length) return eligible[Math.floor(rng() * eligible.length)];
  const neutral = items.filter((item) => !item.needs);
  const pool = neutral.length ? neutral : items;
  return pool[Math.floor(rng() * pool.length)];
};

export const eventCatalogStats = () => ({
  overtakeCombinations: MOVE_STYLES.length * MOVE_RESULTS.length * DEFAULT_CORNERS.length,
  incidentCombinations: INCIDENT_CAUSES.length * INCIDENT_OUTCOMES.length * DEFAULT_CORNERS.length,
  strategyCombinations: STRATEGY_EVENTS.length,
  leaderCombinations: LEADER_EVENTS.length,
  weatherCombinations: WEATHER_EVENTS.length * DEFAULT_CORNERS.length,
  rhythmCombinations: RACE_RHYTHM_EVENTS.length,
  vscCombinations: VSC_EVENTS.length,
  redFlagCombinations: RED_FLAG_EVENTS.length * DEFAULT_CORNERS.length,
  restartCombinations: RESTART_EVENTS.length * DEFAULT_CORNERS.length,
  extraDynamicCombinations:
    EXTRA_PHASES.length * EXTRA_ACTIONS.length * EXTRA_OUTCOMES.length * EXTRA_CONTEXTS.length,
  pressureCombinations:
    PRESSURE_TRIGGERS.length * PRESSURE_REACTIONS.length * PRESSURE_CONSEQUENCES.length,
  playerSpecificCombinations:
    PLAYER_EVENT_SETUPS.length * PLAYER_EVENT_ACTIONS.length * PLAYER_EVENT_RESULTS.length * PLAYER_EVENT_CONTEXTS.length,
  eraKnowledge: raceKnowledgeStats(),
  totalMinimumCombinations:
    MOVE_STYLES.length * MOVE_RESULTS.length * DEFAULT_CORNERS.length +
    INCIDENT_CAUSES.length * INCIDENT_OUTCOMES.length * DEFAULT_CORNERS.length +
    STRATEGY_EVENTS.length +
    LEADER_EVENTS.length +
    WEATHER_EVENTS.length * DEFAULT_CORNERS.length +
    RED_FLAG_EVENTS.length * DEFAULT_CORNERS.length +
    RESTART_EVENTS.length * DEFAULT_CORNERS.length +
    EXTRA_PHASES.length * EXTRA_ACTIONS.length * EXTRA_OUTCOMES.length * EXTRA_CONTEXTS.length +
    PRESSURE_TRIGGERS.length * PRESSURE_REACTIONS.length * PRESSURE_CONSEQUENCES.length +
    PLAYER_EVENT_SETUPS.length * PLAYER_EVENT_ACTIONS.length * PLAYER_EVENT_RESULTS.length * PLAYER_EVENT_CONTEXTS.length,
});

export const renderOvertakeEvent = ({ driver, rival, lap, raceName, rng, player = false, year }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const style = pickEligible(MOVE_STYLES, rng, { year });
  const result = pick(MOVE_RESULTS, rng);
  const subjectEs = player ? driver : `${driver}`;
  const subjectEn = player ? driver : `${driver}`;
  return {
    lap,
    type: player ? "player" : "neutral",
    important: player,
    positionDelta: player ? -1 : undefined,
    text: `${subjectEs} ataca a ${rival} ${style.es} en ${corner.es}: ${result.es}.`,
    textEn: `${subjectEn} attacks ${rival} ${style.en} at ${corner.en}: ${result.en}.`,
  };
};

export const renderIncidentEvent = ({ driver, lap, raceName, rng, player = false, severe = false, state = {}, year }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const eraIncident = chooseEraTerm(year || state.year, "incidents", rng);
  const cause = severe
    ? pickEligible(INCIDENT_CAUSES.slice(1, 8), rng, state)
    : pickEligible(INCIDENT_CAUSES, rng, state);
  const outcome = severe
    ? pickEligible(INCIDENT_OUTCOMES.slice(2), rng, state)
    : pickEligible(INCIDENT_OUTCOMES, rng, state);
  return {
    lap,
    type: player ? "danger" : "neutral",
    important: player || severe,
    positionDelta: player ? (severe ? 3 : 1) : undefined,
    text: `${driver} sufre ${eraIncident?.es || cause.es} en ${corner.es}; ${outcome.es}.`,
    textEn: `${driver} suffers ${eraIncident?.en || cause.en} at ${corner.en}; ${outcome.en}.`,
  };
};

export const renderStrategyEvent = ({ driver, rival, team, lap, rng, player = false, state = {}, year }) => {
  const template = pickEligible(STRATEGY_EVENTS, rng, state);
  const eraStrategy = chooseEraTerm(year || state.year, "strategy", rng);
  const vars = { driver, rival, team };
  return {
    lap,
    type: player ? "player" : "neutral",
    important: player,
    positionDelta: player ? (rng() < 0.55 ? -1 : 0) : undefined,
    text: `${replaceVars(template.es, vars)}${eraStrategy ? ` La clave de epoca: ${eraStrategy.es}.` : ""}`,
    textEn: `${replaceVars(template.en, vars)}${eraStrategy ? ` Era-specific key: ${eraStrategy.en}.` : ""}`,
  };
};

export const renderLeaderEvent = ({ leader, chaser, third, lap, rng, year }) => {
  const template = pickEligible(LEADER_EVENTS, rng, { year });
  const vars = { leader, chaser, third };
  return {
    lap,
    type: "leader",
    important: false,
    text: replaceVars(template.es, vars),
    textEn: replaceVars(template.en, vars),
  };
};

export const renderWeatherEvent = ({ lap, raceName, rng, important = false, state = {} }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const pool = state.dryingNow
    ? WEATHER_EVENTS.filter((event) => event.needs === "dryReturn")
    : state.rainThreat && !isWet(state)
    ? WEATHER_EVENTS.filter((event) => event.needs === "rainThreat")
    : isWet(state)
    ? WEATHER_EVENTS.filter((event) => event.needs === "wet" || !event.needs)
    : WEATHER_EVENTS.filter((event) => !event.needs);
  const template = pickEligible(pool.length ? pool : WEATHER_EVENTS, rng, state);
  const wet = isWet(state);
  return {
    lap,
    type: important ? (wet ? "rain" : "player") : "neutral",
    important,
    positionDelta: important ? (rng() < 0.5 ? -1 : 1) : undefined,
    text: replaceVars(template.es, { corner: corner.es }),
    textEn: replaceVars(template.en, { corner: corner.en }),
  };
};

export const renderRaceRhythmEvent = ({ lap, rng, state = {} }) => {
  const template = pickEligible(RACE_RHYTHM_EVENTS, rng, state);
  return {
    lap,
    type: "neutral",
    important: false,
    text: template.es,
    textEn: template.en,
  };
};

export const renderVirtualSafetyCarEvent = ({ lap, rng, player = false }) => {
  const template = pick(VSC_EVENTS, rng);
  return {
    lap,
    type: player ? "player" : "safetycar",
    important: true,
    positionDelta: player ? (rng() < 0.45 ? -1 : rng() < 0.8 ? 0 : 1) : undefined,
    text: template.es,
    textEn: template.en,
  };
};

export const renderRedFlagEvent = ({ lap, raceName, rng }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const template = pick(RED_FLAG_EVENTS, rng);
  return {
    lap,
    type: "redflag",
    important: true,
    text: replaceVars(template.es, { corner: corner.es }),
    textEn: replaceVars(template.en, { corner: corner.en }),
  };
};

export const renderRestartEvent = ({ driver, leader, lap, raceName, rng, kind = "safetyCar", year, state }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const eligibilityState = state || { year };
  const byKind = RESTART_EVENTS.filter((item) => item.kind === kind || item.kind === "any");
  const template = pickEligible(byKind.length ? byKind : RESTART_EVENTS, rng, eligibilityState);
  return {
    lap,
    type: "player",
    important: true,
    positionDelta: rng() < 0.5 ? -1 : 1,
    text: replaceVars(template.es, { driver, leader, corner: corner.es }),
    textEn: replaceVars(template.en, { driver, leader, corner: corner.en }),
  };
};

export const renderExtraDynamicEvent = ({ driver, rival, team, lap, raceName, rng, player = false, state = {} }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const phase = pickEligible(EXTRA_PHASES, rng, state);
  const action = pickEligible(EXTRA_ACTIONS, rng, state);
  const outcome = pick(EXTRA_OUTCOMES, rng);
  const context = pickEligible(EXTRA_CONTEXTS, rng, state);
  const vars = { driver, rival, team };
  return {
    lap,
    type: player ? "player" : "neutral",
    important: player,
    positionDelta: player ? (rng() < 0.45 ? -1 : rng() < 0.7 ? 0 : 1) : undefined,
    text: `${phase.es}, ${replaceVars(action.es, vars)} en ${corner.es}; ${outcome.es}, ${context.es}.`,
    textEn: `${phase.en}, ${replaceVars(action.en, vars)} at ${corner.en}; ${outcome.en}, ${context.en}.`,
  };
};

export const renderPressureManagementEvent = ({ driver, rival, team, lap, raceName, rng, player = false, state = {} }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const trigger = pick(PRESSURE_TRIGGERS, rng);
  const reaction = pickEligible(PRESSURE_REACTIONS, rng, state);
  const consequence = pick(PRESSURE_CONSEQUENCES, rng);
  const vars = { driver, rival, team };
  return {
    lap,
    type: player ? "player" : "neutral",
    important: player,
    positionDelta: player ? (rng() < 0.35 ? -1 : rng() < 0.82 ? 0 : 1) : undefined,
    text: `En ${corner.es}, ${replaceVars(trigger.es, vars)}; ${replaceVars(reaction.es, vars)} y ${consequence.es}.`,
    textEn: `At ${corner.en}, ${replaceVars(trigger.en, vars)}; ${replaceVars(reaction.en, vars)} and ${consequence.en}.`,
  };
};

export const renderPlayerSpecificEvent = ({ driver, rival, team, lap, raceName, rng, state = {} }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const setup = pickEligible(PLAYER_EVENT_SETUPS, rng, state);
  const action = pickEligible(PLAYER_EVENT_ACTIONS, rng, state);
  // Keep the prose coherent, not just the net number: a setup that sets up a gain
  // (delta < 0) must not resolve into a losing result (adjust > 0), and a setup
  // that concedes ground (delta > 0) must not resolve into a gaining one.
  const resultPool = PLAYER_EVENT_RESULTS.filter((result) => {
    if (!isEligible(result, state)) return false;
    const setupDelta = setup.delta || 0;
    const adjust = result.adjust || 0;
    if (setupDelta < 0) return adjust <= 0;
    if (setupDelta > 0) return adjust >= 0;
    return true;
  });
  const result = pickEligible(resultPool.length ? resultPool : PLAYER_EVENT_RESULTS, rng, state);
  const context = pickEligible(PLAYER_EVENT_CONTEXTS, rng, state);
  const vars = { driver, rival, team };
  const positionDelta = clampPositionDelta((setup.delta || 0) + (result.adjust || 0));
  return {
    lap,
    type: setup.type,
    important: true,
    positionDelta,
    text: `${replaceVars(setup.es, vars)} en ${corner.es}, ${action.es}; ${result.es}, ${context.es}.`,
    textEn: `${replaceVars(setup.en, vars)} at ${corner.en}, ${action.en}; ${result.en}, ${context.en}.`,
  };
};

const clampPositionDelta = (delta) => Math.max(-2, Math.min(3, delta));

// Position as a racing ordinal: Spanish uses the masculine degree sign ("8º",
// from "octavo puesto"); English uses the usual suffix with the 11–13 exception.
export const formatOrdinal = (n, lang = "es") => {
  if (lang === "en") {
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  }
  return `${n}º`;
};

// Battle phrases keyed by outcome. {attacker}/{defender} are driver names,
// {corner} the corner token, {ord} the ordinal the overtaker moves into. Only
// the success/error outcomes carry {ord}; defence and side-by-side never claim a
// new position. DRS lines are era-gated through the standard `needs` mechanism.
const BATTLE_TEMPLATES = {
  inside: [
    {
      es: "¡{attacker} se lanza al interior de {corner} y supera a {defender} para colocarse {ord}!",
      en: "{attacker} dives down the inside of {corner} and takes {defender} to move up to {ord}!",
    },
    {
      es: "¡{attacker} clava la frenada en {corner}, se mete por dentro de {defender} y asciende a {ord}!",
      en: "{attacker} nails the brakes into {corner}, goes up the inside of {defender} and grabs {ord}!",
    },
  ],
  outside: [
    {
      es: "¡{attacker} completa el adelantamiento por fuera de {corner} sobre {defender} y sube a {ord}!",
      en: "{attacker} sweeps around the outside of {corner} past {defender} into {ord}!",
    },
    {
      es: "¡{attacker} aguanta por el exterior de {corner} y sale por delante de {defender} en {ord}!",
      en: "{attacker} holds it around the outside of {corner} and emerges ahead of {defender} in {ord}!",
    },
  ],
  switchback: [
    {
      es: "¡{attacker} obliga a {defender} a abrirse en {corner} y con la contratrazada escala a {ord}!",
      en: "{attacker} forces {defender} wide at {corner} and switches back to climb to {ord}!",
    },
  ],
  drs: [
    {
      es: "¡{attacker} abre el DRS en la recta y despacha a {defender} para colocarse {ord}!",
      en: "{attacker} opens DRS down the straight and clears {defender} to take {ord}!",
      needs: "drs",
    },
  ],
  error: [
    {
      es: "¡{defender} comete un error en {corner} y cede la plaza a {attacker}, que sube a {ord}!",
      en: "{defender} runs wide at {corner} and concedes the place to {attacker}, who moves up to {ord}!",
    },
  ],
  defense: [
    {
      es: "¡{defender} cierra el interior de {corner} y aguanta la posición ante {attacker}!",
      en: "{defender} shuts the door on the inside of {corner} and holds off {attacker}!",
    },
    {
      es: "¡{defender} se defiende de maravilla en {corner} y {attacker} no encuentra el hueco!",
      en: "{defender} defends brilliantly through {corner} and {attacker} can't find a way through!",
    },
  ],
  sideBySide: [
    {
      es: "¡{attacker} y {defender} cruzan {corner} rueda con rueda, sin ceder un palmo!",
      en: "{attacker} and {defender} run wheel to wheel through {corner}, neither giving an inch!",
    },
  ],
  lockup: [
    {
      es: "¡{attacker} se cuela tarde en {corner} pero se pasa de frenada y {defender} mantiene la plaza!",
      en: "{attacker} lunges late into {corner} but locks up, and {defender} keeps the place!",
    },
  ],
};

// Outcomes where the overtaker actually changes position (and announces it).
export const BATTLE_GAIN_OUTCOMES = ["inside", "outside", "switchback", "drs", "error"];

export const renderBattleEvent = ({ attacker, defender, ordinal, outcome = "inside", lap, raceName, rng, state = {}, player = false }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  // Fall back to a non-DRS pass when the era has no DRS, so the outcome still
  // resolves into a real overtake rather than anachronistic wording.
  let resolved = outcome;
  if (resolved === "drs" && !isEraFeatureAllowed(state.year, "drs")) {
    resolved = rng() < 0.5 ? "inside" : "outside";
  }
  const templates = BATTLE_TEMPLATES[resolved] || BATTLE_TEMPLATES.inside;
  const template = pickEligible(templates, rng, state);
  const esVars = { attacker, defender, corner: corner.es, ord: formatOrdinal(ordinal, "es") };
  const enVars = { attacker, defender, corner: corner.en, ord: formatOrdinal(ordinal, "en") };
  return {
    lap,
    type: player ? "player" : "neutral",
    important: player,
    text: replaceVars(template.es, esVars),
    textEn: replaceVars(template.en, enVars),
  };
};
