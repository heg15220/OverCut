import { chooseEraTerm, isEraFeatureAllowed, raceKnowledgeStats } from "./careerRaceEraKnowledge";

const DEFAULT_CORNERS = [
  { es: "la curva 1", en: "Turn 1", type: "braking" },
  { es: "la curva 2", en: "Turn 2", type: "traction" },
  { es: "la curva 3", en: "Turn 3", type: "flow" },
  { es: "la curva 4", en: "Turn 4", type: "flow" },
  { es: "la curva 6", en: "Turn 6", type: "slow" },
  { es: "la curva 8", en: "Turn 8", type: "commitment" },
  { es: "la curva 10", en: "Turn 10", type: "braking" },
  { es: "la curva 11", en: "Turn 11", type: "traction" },
  { es: "la curva 12", en: "Turn 12", type: "braking" },
  { es: "la curva 13", en: "Turn 13", type: "braking" },
  { es: "la horquilla", en: "the hairpin", type: "slow" },
  { es: "la salida de la horquilla", en: "the hairpin exit", type: "traction" },
  { es: "la curva de doble vertice", en: "the double-apex corner", type: "technical" },
  { es: "la curva rapida del segundo sector", en: "the fast corner in sector two", type: "commitment" },
  { es: "la frenada al final de la recta trasera", en: "the braking zone at the end of the back straight", type: "braking" },
  { es: "la chicane final", en: "the final chicane", type: "kerb" },
  { es: "la recta principal", en: "the main straight", type: "straight" },
  { es: "la recta trasera", en: "the back straight", type: "straight" },
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
  {
    match: ["united states", "austin", "cota", "americas"],
    corners: [
      { es: "la curva 1", en: "Turn 1", type: "braking" },
      { es: "las eses", en: "the Esses", type: "flow" },
      { es: "la curva 9", en: "Turn 9", type: "commitment" },
      { es: "la curva 11", en: "Turn 11", type: "traction" },
      { es: "la recta trasera", en: "the back straight", type: "straight" },
      { es: "la curva 12", en: "Turn 12", type: "braking" },
      { es: "la curva 15", en: "Turn 15", type: "technical" },
      { es: "la curva 19", en: "Turn 19", type: "commitment" },
      { es: "la ultima curva", en: "the final corner", type: "traction" },
    ],
  },
];


const MOVE_STYLES = [
  { es: "se pega al rebufo y aparece por dentro", en: "gets in the slipstream and appears down the inside" },
  { es: "aguanta por fuera con el coche completamente en paralelo", en: "hangs around the outside with the car fully alongside" },
  { es: "vende el ataque por fuera y cambia a la contratrazada", en: "sells the move outside and cuts back underneath" },
  { es: "retrasa la frenada medio coche mas que su rival", en: "brakes half a car length later than the rival" },
  { es: "abre DRS, descarga bateria y llega con mas punta", en: "opens DRS, deploys battery and arrives with more top speed", needs: ["drs", "ers"] },
  { es: "sale mejor de la curva anterior y no necesita forzar el contacto", en: "gets a better exit from the previous corner and does not need to force contact" },
  { es: "aprovecha una pequena correccion del rival para meter el morro", en: "uses a small correction from the rival to put the nose in" },
  { es: "se queda a la izquierda hasta el ultimo metro y luego cruza el coche", en: "stays left until the final metre and then switches the car back" },
  { es: "mantiene la presion durante todo el sector y el ataque llega preparado", en: "keeps the pressure on for the whole sector and arrives with the move prepared" },
  { es: "lee el trafico por delante y elige el lado limpio", en: "reads the traffic ahead and chooses the clean side" },
  { es: "usa la goma mas fresca para frenar tarde sin bloquear", en: "uses fresher tyres to brake late without locking" },
  { es: "obliga al rival a cubrir una linea que no queria defender", en: "forces the rival to cover a line they did not want to defend" },
  { es: "amaga por fuera, espera la defensa y cruza hacia el interior", en: "feints outside, waits for the defence and cuts back inside" },
  { es: "se queda escondido en el rebufo hasta el ultimo cartel de frenada", en: "stays hidden in the tow until the final braking board" },
  { es: "prepara la contratrazada desde la curva anterior", en: "sets up the switchback from the previous corner" },
  { es: "sale con mejor traccion de la horquilla y llega con medio coche al lado", en: "gets better traction out of the hairpin and arrives half a car alongside" },
  { es: "usa todo el ancho de pista para abrir el angulo de salida", en: "uses the full track width to open the exit angle" },
  { es: "cambia de lado dos veces para forzar el error defensivo", en: "changes side twice to force the defensive mistake" },
  { es: "se coloca por el exterior para tener el interior de la siguiente curva", en: "places the car outside to own the inside of the next corner" },
];

const MOVE_RESULTS = [
  { es: "completa el adelantamiento y sale con aire limpio", en: "completes the pass and exits in clean air" },
  { es: "sale delante por menos de medio coche, pero la posicion es suya", en: "comes out ahead by less than half a car length, but the place is theirs" },
  { es: "el rival tiene que levantar para evitar el toque", en: "the rival has to lift to avoid contact" },
  { es: "gana la posicion sin castigar de mas la goma delantera", en: "takes the place without overworking the front tyre" },
  { es: "se queda con el interior para la siguiente curva y cierra la puerta", en: "keeps the inside for the next corner and shuts the door" },
  { es: "roza el piano, corrige rapido y mantiene el coche bajo control", en: "clips the kerb, corrects quickly and keeps the car under control" },
  { es: "la maniobra queda hecha antes de la zona de frenada", en: "the move is done before the braking zone" },
  { es: "deja al rival sin respuesta antes de la siguiente recta", en: "leaves the rival without an answer before the next straight" },
  { es: "levanta al limite para evitar contacto y aun asi completa la maniobra", en: "backs out just enough to avoid contact and still completes the move" },
  { es: "sale mejor colocado y obliga al otro coche a abrir la trazada", en: "exits better placed and forces the other car to open the line" },
  { es: "convierte la defensa del rival en una salida lenta y gana la posicion", en: "turns the rival's defence into a slow exit and takes the place" },
  { es: "mantiene el coche por fuera y se queda con el interior siguiente", en: "keeps the car around the outside and owns the next inside line" },
  { es: "la contratrazada funciona y el rival no puede responder", en: "the switchback works and the rival cannot answer" },
  { es: "el adelantamiento queda preparado una curva antes y rematado en la salida", en: "the pass is set up one corner earlier and finished on exit" },
  { es: "obliga al rival a elegir entre levantar o salirse de pista", en: "forces the rival to choose between lifting or running off track" },
];

const INCIDENT_CAUSES = [
  { es: "bloqueo delantero", en: "front lock-up" },
  { es: "latigazo de sobreviraje", en: "snap oversteer" },
  { es: "toque rueda con rueda", en: "wheel-to-wheel contact" },
  { es: "toque por detras al cerrar la trazada", en: "rear contact as the line closes" },
  { es: "aleron delantero tocado en plena pelea", en: "front wing damage in the fight" },
  { es: "movimiento tardio en defensa", en: "late defensive move" },
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
  { es: "el piloto se queda sin carga delantera y empieza a perder ritmo", en: "the driver loses front load and starts dropping pace" },
  { es: "el rival evita el trompo por muy poco y ambos continuan", en: "the rival narrowly avoids a spin and both continue" },
  { es: "la maniobra queda anotada para revisar despues de carrera", en: "the move is noted for review after the race" },
  { es: "el coche se va largo y pierde la posicion al reincorporarse", en: "the car runs wide and loses the place on rejoining" },
  { es: "los comisarios preparan doble amarilla", en: "marshals prepare double yellows" },
  { es: "se abre una ventana estrategica inesperada", en: "an unexpected strategy window opens", needs: "advancedStrategy" },
  { es: "varios pilotos aprovechan para parar", en: "several drivers dive into the pits", needs: "pitStrategy" },
  { es: "la direccion considera bandera roja", en: "race control considers a red flag", needs: "redFlag" },
  { es: "el peloton se compacta de golpe", en: "the field suddenly bunches up" },
];


const STRATEGY_EVENTS = [
  {
    es: "{team} lanza el undercut con {driver}: entra antes que {rival}, clava la vuelta de salida y aparece por delante cuando el rival responde.",
    en: "{team} launches the undercut with {driver}: they pit before {rival}, nail the out-lap and emerge ahead when the rival responds.",
    delta: -1,
    needs: "advancedStrategy",
  },
  {
    es: "{driver} intenta el undercut sobre {rival}, pero sale detras de un coche lento; {rival} para una vuelta despues y conserva la posicion.",
    en: "{driver} tries the undercut on {rival}, but exits behind a slower car; {rival} pits one lap later and keeps the place.",
    delta: 0,
    needs: "advancedStrategy",
  },
  {
    es: "{team} pide a {driver} empujar en aire limpio y busca el overcut; {rival} responde parando, pero vuelve a pista por detras.",
    en: "{team} asks {driver} to push in clean air and goes for the overcut; {rival} responds by stopping, but rejoins behind.",
    delta: -1,
    needs: "advancedStrategy",
  },
  {
    es: "{driver} alarga el stint para cubrir a {rival}, pero la goma cae en la ultima vuelta antes de parar; la posicion se pierde en boxes.",
    en: "{driver} extends the stint to cover {rival}, but the tyre drops away on the final lap before stopping; the place is lost in the pit cycle.",
    delta: 1,
    needs: "advancedStrategy",
  },
  {
    es: "{team} prepara la parada de {driver}; {rival} entra primero, mete una vuelta de salida agresiva y completa el undercut.",
    en: "{team} prepares {driver}'s stop; {rival} pits first, delivers an aggressive out-lap and completes the undercut.",
    delta: 1,
    needs: "advancedStrategy",
  },
  {
    es: "{driver} para para salir con aire limpio, pero {rival} aguanta una vuelta mas y cruza por delante al reincorporarse.",
    en: "{driver} stops to find clean air, but {rival} stays out one lap longer and crosses ahead after rejoining.",
    delta: 1,
    needs: "advancedStrategy",
  },
  {
    es: "{team} amaga con parar a {driver}; {rival} muerde el anzuelo, entra demasiado pronto y deja a {driver} con pista libre para ganar la plaza.",
    en: "{team} feints a stop for {driver}; {rival} takes the bait, pits too early and leaves {driver} clear track to gain the place.",
    delta: -1,
    needs: "advancedStrategy",
  },
  {
    es: "{team} prepara doble parada; {driver} pierde un segundo esperando detras de su companero y {rival} se mete en la pelea.",
    en: "{team} prepares a double stack; {driver} loses a second waiting behind the team-mate and {rival} gets into the fight.",
    delta: 1,
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
    es: "{driver} pide adelantar la parada porque el ritmo cae en aire sucio detras de {rival}; {team} acepta y la jugada evita perder otra plaza.",
    en: "{driver} asks to pit early because the pace is dropping in dirty air behind {rival}; {team} agrees and the call avoids losing another place.",
    delta: 0,
  },
  {
    es: "{team} deja a {driver} una vuelta mas fuera; el sector final sale limpio y la parada le devuelve por delante de {rival}.",
    en: "{team} leaves {driver} out for one more lap; the final sector is clean and the stop returns them ahead of {rival}.",
    delta: -1,
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
    es: "{leader} lidera, pero {chaser} ya esta en ventana de DRS y obliga al lider a defender la recta principal.",
    en: "{leader} leads, but {chaser} is already in DRS range and forces the leader to defend the main straight.",
    needs: "drs",
  },
  {
    es: "{leader} responde con una vuelta rapida y rompe el rebufo antes de que {chaser} pueda preparar el ataque.",
    en: "{leader} answers with a fast lap and breaks the tow before {chaser} can set up the attack.",
  },
  {
    es: "{leader} informa de vibraciones; {chaser} reduce la diferencia y {third} se engancha al mismo tren.",
    en: "{leader} reports vibrations; {chaser} cuts the gap and {third} joins the same train.",
  },
  {
    es: "La cabeza se comprime: {leader}, {chaser} y {third} ruedan en menos de tres segundos, cada uno con un plan distinto.",
    en: "The front compresses: {leader}, {chaser} and {third} are covered by less than three seconds, each on a different plan.",
  },
  {
    es: "{leader} gestiona el eje delantero y acepta perder dos decimas; {chaser} necesita acercarse sin cocinar sus neumaticos.",
    en: "{leader} manages the front axle and accepts losing two tenths; {chaser} must close without cooking the tyres.",
  },
  {
    es: "{chaser} encuentra aire limpio tras la parada y empieza a devolverle presion a {leader}.",
    en: "{chaser} finds clean air after the stop and starts putting pressure back on {leader}.",
  },
  {
    es: "{third} marca un sector morado y convierte el duelo de cabeza en una pelea de tres coches.",
    en: "{third} sets a purple sector and turns the lead duel into a three-car fight.",
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
    es: "Carrera en ritmo verde: el grupo se estira y cada piloto protege su propia ventana de neumaticos.",
    en: "Green-flag rhythm: the field stretches out and every driver protects their own tyre window.",
  },
  {
    es: "Con pista verde, la carrera entra en fase de gestion pura: aire limpio, temperatura y paciencia.",
    en: "Under green-flag running, the race moves into pure management: clean air, temperature and patience.",
  },
  {
    es: "El peloton se ordena por ritmo real; adelantar exige preparar la maniobra varias curvas antes.",
    en: "The field settles by real pace; overtaking needs to be prepared several corners in advance.",
  },
  {
    es: "Los muros comparan tiempos de vuelta: la amenaza ya no es solo el coche de delante, sino la ventana de parada.",
    en: "Pit walls compare lap times: the threat is no longer just the car ahead, but the stop window.",
    needs: "pitStrategy",
  },
  {
    es: "La carrera se parte en pequenos trenes; quien pierda un segundo ahora puede pasar diez vueltas mirando al mismo aleron.",
    en: "The race splits into small trains; anyone losing a second now may spend ten laps staring at the same rear wing.",
  },
  {
    es: "Los ingenieros piden lift and coast: nadie quiere ganar una decima y pagarla con frenos al limite cinco vueltas despues.",
    en: "Engineers ask for lift and coast: nobody wants to gain a tenth and pay for it with overheated brakes five laps later.",
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
    es: "tras una vuelta delicada",
    en: "after a delicate lap",
  },
  {
    es: "cuando el neumatico delantero empieza a abrirse",
    en: "as the front tyre starts to grain",
  },
  {
    es: "con el deposito mas ligero y el coche mas reactivo",
    en: "with the fuel load dropping and the car more responsive",
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
    es: "cuando la pista empieza a mejorar vuelta a vuelta",
    en: "as the track starts improving lap by lap",
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
    es: "{driver} encuentra agarre fuera de la trazada habitual",
    en: "{driver} finds grip away from the usual racing line",
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
  {
    es: "{driver} deja respirar el coche en el primer sector para atacar en el segundo",
    en: "{driver} lets the car breathe in sector one to attack in sector two",
  },
  {
    es: "{team} avisa a {driver} de que {rival} empieza a perder salida de curva",
    en: "{team} warns {driver} that {rival} is starting to lose corner exit",
  },
];

const EXTRA_OUTCOMES = [
  {
    es: "la accion cambia el ritmo del grupo durante dos vueltas",
    en: "the action changes the pace of the group for two laps",
  },
  {
    es: "el rival queda fuera de temperatura y debe defender antes de tiempo",
    en: "the rival drops out of the tyre window and has to defend early",
  },
  {
    es: "el muro celebra por radio una ejecucion limpia",
    en: "the pit wall praises a clean execution over the radio",
  },
  {
    es: "la accion queda al limite, pero los dos coches siguen sin danos",
    en: "the move is right on the edge, but both cars continue without damage",
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
    es: "el ingeniero avisa de que la amenaza es real",
    en: "the engineer warns that the threat is real",
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
  {
    es: "con el rival mirando mas al retrovisor que al vertice",
    en: "with the rival watching the mirror more than the apex",
  },
  {
    es: "cuando la diferencia de goma empieza a notarse",
    en: "as the tyre offset starts to show",
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
  {
    es: "{driver} pierde dos decimas en trafico y {rival} se acerca a zona de ataque",
    en: "{driver} loses two tenths in traffic and {rival} moves into attack range",
  },
  {
    es: "el eje trasero empieza a deslizar al abrir gas",
    en: "the rear axle starts sliding on throttle",
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
    es: "{team} retrasa la parada para buscar una ventana con menos trafico",
    en: "{team} delays the stop to find a lighter traffic window",
  },
  {
    es: "{driver} acepta perder DRS para no sobrecalentar el coche",
    en: "{driver} accepts losing DRS to avoid overheating the car",
    needs: "drs",
  },
  {
    es: "{driver} protege el interior y obliga al rival a recorrer mas metros",
    en: "{driver} protects the inside and makes the rival travel the long way round",
  },
  {
    es: "{team} pide cambiar objetivo: conservar ritmo antes que pelear cada curva",
    en: "{team} changes the target: preserve pace rather than fight every corner",
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
    es: "el grupo se comprime y cualquier bloqueo puede cambiar la secuencia de paradas",
    en: "the group compresses and any lock-up could change the pit-stop sequence",
  },
  {
    es: "el ritmo se estabiliza justo antes de entrar en la ventana critica",
    en: "the pace stabilises just before entering the critical window",
  },
];


const PLAYER_RACE_EVENTS = [
  {
    es: "{driver} sale mejor que {rival} de {corner}, se queda en el rebufo y completa el adelantamiento antes de la frenada.",
    en: "{driver} exits {corner} better than {rival}, stays in the tow and completes the pass before the braking zone.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} espera a que {rival} defienda el interior en {corner}; cruza la trazada en la salida y gana la posicion con mejor traccion.",
    en: "{driver} waits for {rival} to defend the inside at {corner}; the switchback on exit wins the position with better traction.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} ensena el coche por fuera antes de {corner}; {rival} se protege demasiado pronto y la contratrazada deja el hueco abierto.",
    en: "{driver} shows the car outside before {corner}; {rival} protects too early and the switchback opens the gap.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} no ataca en la primera curva: obliga a {rival} a defender, sale mas recto y completa la pasada en la siguiente aceleracion.",
    en: "{driver} does not attack at the first corner: forces {rival} to defend, exits straighter and completes the pass on the next acceleration.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} abre DRS contra {rival}, llega emparejado a {corner} y deja la maniobra terminada sin bloquear.",
    en: "{driver} opens DRS on {rival}, draws alongside into {corner} and finishes the move without locking up.",
    delta: -1,
    type: "player",
    needs: "drs",
  },
  {
    es: "{driver} llega a {corner} con mas velocidad que {rival}; el rival defiende tarde, deja justo un coche de ancho y el adelantamiento sale limpio.",
    en: "{driver} arrives at {corner} faster than {rival}; the rival defends late, leaves exactly one car width and the pass is clean.",
    delta: -1,
    type: "player",
  },
  {
    es: "{rival} se va largo en {corner} al proteger el interior; {driver} no necesita forzar nada y gana la plaza por traccion.",
    en: "{rival} runs deep at {corner} while protecting the inside; {driver} does not need to force it and wins the place on traction.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} se queda por fuera de {rival} en {corner}, aguanta el coche por el lado dificil y completa la pasada en la salida.",
    en: "{driver} stays around the outside of {rival} at {corner}, holds the car on the difficult side and completes the pass on exit.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} coloca el coche por fuera en {corner} para tener el interior de la curva siguiente; {rival} se queda sin respuesta.",
    en: "{driver} places the car outside at {corner} to own the inside of the next corner; {rival} has no answer.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} aprovecha la salida lenta de {rival} en {corner}; no hay frenada heroica, solo mejor traccion y una pasada limpia.",
    en: "{driver} uses {rival}'s slow exit at {corner}; no heroic braking, just better traction and a clean pass.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} aprovecha que {rival} queda atrapado detras de un coche lento; cambia de lado antes de {corner} y gana la posicion sin contacto.",
    en: "{driver} uses {rival} being trapped behind a slower car; changes side before {corner} and takes the position without contact.",
    delta: -1,
    type: "player",
  },
  {
    es: "{driver} fuerza a {rival} a defender durante todo el sector, pero no encuentra hueco limpio en {corner}; la posicion no cambia.",
    en: "{driver} forces {rival} to defend for the whole sector, but cannot find a clean gap at {corner}; the order does not change.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} cubre el interior de {corner} ante {rival}; sacrifica entrada, gana la salida y mantiene la posicion.",
    en: "{driver} covers the inside of {corner} against {rival}; entry is sacrificed, exit is stronger and the place is held.",
    delta: 0,
    type: "player",
  },
  {
    es: "{rival} asoma el coche por dentro en {corner}; {driver} deja el espacio minimo, aguanta por fuera y conserva la plaza.",
    en: "{rival} shows the car down the inside at {corner}; {driver} leaves the minimum space, holds the outside and keeps the place.",
    delta: 0,
    type: "player",
  },
  {
    es: "{rival} intenta la contratrazada en {corner}, pero {driver} lee el cruce, abre la salida y conserva la posicion.",
    en: "{rival} tries the switchback at {corner}, but {driver} reads the crossover, opens the exit and keeps the place.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} protege la frenada de {corner} sin cerrar de golpe; {rival} mira por fuera, pero no encuentra agarre suficiente.",
    en: "{driver} protects the braking zone at {corner} without moving abruptly; {rival} looks outside, but cannot find enough grip.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} ve venir el ataque de {rival} al final de la recta; se queda en el centro de la pista y obliga al rival a frenar antes.",
    en: "{driver} sees {rival}'s attack coming at the end of the straight; stays in the middle of the road and makes the rival brake earlier.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} y {rival} pasan por {corner} rueda con rueda; no hay golpe, no hay cambio de posicion y la pelea sigue abierta.",
    en: "{driver} and {rival} go through {corner} wheel to wheel; no contact, no position change and the fight stays open.",
    delta: 0,
    type: "player",
  },
  {
    es: "{team} pide a {driver} guardar bateria detras de {rival}; no hay ataque esta vuelta, pero el coche queda preparado para la recta siguiente.",
    en: "{team} asks {driver} to save battery behind {rival}; there is no attack this lap, but the car is set up for the next straight.",
    delta: 0,
    type: "player",
    needs: "ers",
  },
  {
    es: "{driver} entra pasado en {corner} al intentar defenderse de {rival}; evita el contacto, pero pierde una posicion al salir sin traccion.",
    en: "{driver} runs deep into {corner} while trying to defend from {rival}; contact is avoided, but one place is lost on exit.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{driver} bloquea el delantero en {corner}; {rival} cambia de linea y aprovecha la salida para pasar.",
    en: "{driver} locks the front tyre at {corner}; {rival} changes line and uses the exit to pass.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{driver} intenta cerrar la puerta en {corner}, pero {rival} ya estaba al lado; hay un toque ligero y {driver} pierde impulso.",
    en: "{driver} tries to close the door at {corner}, but {rival} was already alongside; there is light contact and {driver} loses momentum.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{rival} cambia de linea muy tarde antes de {corner}; {driver} levanta para evitar un golpe mayor y pierde la posicion.",
    en: "{rival} changes line very late before {corner}; {driver} lifts to avoid a bigger hit and loses the position.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{driver} se tira desde demasiado lejos en {corner}; bloquea, se va ancho y debe devolver la plaza a {rival}.",
    en: "{driver} launches from too far back at {corner}; locks up, runs wide and has to give the place back to {rival}.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{driver} intenta la contratrazada sobre {rival}, pero pisa el piano en la salida de {corner}; el coche se cruza y pierde impulso.",
    en: "{driver} tries the switchback on {rival}, but hits the kerb on exit of {corner}; the car snaps sideways and loses momentum.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{rival} se queda por fuera en {corner} y {driver} no deja suficiente salida; hay que levantar y recomponer la vuelta.",
    en: "{rival} stays around the outside at {corner} and {driver} does not leave enough exit room; it takes a lift and a reset lap.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{driver} toca el piano de {corner} con el coche descargado, corrige a tiempo y conserva la posicion frente a {rival}.",
    en: "{driver} hits the kerb at {corner} with the car light, catches it in time and keeps the place from {rival}.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} sale de {corner} con el aleron tocado tras una pelea con {rival}; el coche subvira, pero aun puede mantenerse en pista.",
    en: "{driver} exits {corner} with a damaged wing after fighting {rival}; the car understeers, but can still stay on track.",
    delta: 1,
    type: "danger",
  },
  {
    es: "{driver} se queda en aire sucio detras de {rival}; los frenos suben de temperatura y el equipo pide no forzar la siguiente frenada.",
    en: "{driver} sits in dirty air behind {rival}; brake temperatures rise and the team asks not to force the next braking zone.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} encuentra aire limpio al separarse medio segundo de {rival}; el ritmo vuelve antes de entrar en la ventana de parada.",
    en: "{driver} finds clean air by dropping half a second from {rival}; the pace returns before the pit window opens.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} recibe el aviso de que {rival} tiene la goma delantera castigada; mantiene presion, pero espera la recta para no arriesgar un toque.",
    en: "{driver} is told {rival}'s front tyre is struggling; keeps the pressure on, but waits for the straight to avoid risking contact.",
    delta: 0,
    type: "player",
  },
  {
    es: "{driver} se queda sin bateria al final de la recta y {rival} llega con mas velocidad a {corner}; toca recomponer la vuelta.",
    en: "{driver} runs out of battery at the end of the straight and {rival} arrives faster into {corner}; the lap has to be rebuilt.",
    delta: 1,
    type: "player",
    needs: "ers",
  },
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
  playerSpecificCombinations: PLAYER_RACE_EVENTS.length,
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
    PLAYER_RACE_EVENTS.length,
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
  const strategyState = { ...state, year: year || state.year };
  const template = pickEligible(STRATEGY_EVENTS, rng, strategyState);
  const vars = { driver, rival, team };
  const positionDelta = player && Number.isFinite(template.delta) ? clampPositionDelta(template.delta) : undefined;
  return {
    lap,
    type: player ? "player" : "neutral",
    important: player,
    positionDelta,
    text: replaceVars(template.es, vars),
    textEn: replaceVars(template.en, vars),
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

export const renderPlayerSpecificEvent = ({ driver, rival, team, lap, raceName, rng, state = {}, allowedDeltas = null }) => {
  const corner = pick(getCornersForRace(raceName), rng);
  const pool = Array.isArray(allowedDeltas)
    ? PLAYER_RACE_EVENTS.filter((event) => allowedDeltas.includes(event.delta || 0))
    : PLAYER_RACE_EVENTS;
  const template = pickEligible(pool.length ? pool : PLAYER_RACE_EVENTS, rng, state);
  const vars = { driver, rival, team };
  const positionDelta = clampPositionDelta(template.delta || 0);
  return {
    lap,
    type: template.type || "player",
    important: true,
    positionDelta,
    text: replaceVars(template.es, { ...vars, corner: corner.es }),
    textEn: replaceVars(template.en, { ...vars, corner: corner.en }),
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
      es: "¡{attacker} se lanza al interior de {corner} y pasa a {defender} para colocarse en {ord} posicion!",
      en: "{attacker} dives down the inside of {corner}, passes {defender} and moves into {ord}.",
    },
    {
      es: "{attacker} se pega al aleron de {defender}, se lanza al interior de {corner} y gana la posicion para ponerse {ord}.",
      en: "{attacker} gets onto {defender}'s rear wing, dives down the inside of {corner} and takes the place for {ord}.",
    },
    {
      es: "{attacker} frena mas tarde en {corner}, deja espacio justo a {defender} y sale colocado en {ord}.",
      en: "{attacker} brakes later into {corner}, leaves {defender} just enough room and exits in {ord}.",
    },
    {
      es: "{defender} cubre tarde el interior y {attacker} ya tenia el morro dentro: adelantamiento limpio para {ord}.",
      en: "{defender} covers the inside too late and {attacker} already had the nose in: clean pass for {ord}.",
    },
    {
      es: "{attacker} aprovecha que {defender} bloquea un instante en {corner}; mete el coche por dentro y sube a {ord}.",
      en: "{attacker} catches {defender} locking briefly at {corner}; puts the car down the inside and moves into {ord}.",
    },
  ],
  outside: [
    {
      es: "¡{attacker} se lanza por fuera de {corner} y pasa a {defender} para colocarse en {ord} posicion!",
      en: "{attacker} launches around the outside of {corner}, passes {defender} and moves into {ord}.",
    },
    {
      es: "{attacker} aguanta por fuera de {corner}, no suelta el coche y supera a {defender} para subir a {ord}.",
      en: "{attacker} hangs around the outside of {corner}, keeps the car there and passes {defender} for {ord}.",
    },
    {
      es: "{attacker} se queda rueda con rueda por el exterior y encuentra traccion antes que {defender}: ya es {ord}.",
      en: "{attacker} stays wheel to wheel around the outside and finds traction before {defender}: now up to {ord}.",
    },
    {
      es: "{defender} protege la cuerda, pero {attacker} recorre el camino largo y aun asi completa la maniobra para {ord}.",
      en: "{defender} protects the apex, but {attacker} takes the long way round and still completes the move for {ord}.",
    },
    {
      es: "{attacker} encuentra agarre fuera de la trazada en {corner}; {defender} no puede cerrarle y el atacante sube a {ord}.",
      en: "{attacker} finds grip off the usual line at {corner}; {defender} cannot close the door and the attacker moves into {ord}.",
    },
    {
      es: "{attacker} aguanta por fuera en {corner} para quedarse con el interior siguiente; {defender} cede y el atacante sube a {ord}.",
      en: "{attacker} hangs around the outside at {corner} to own the next inside line; {defender} yields and the attacker moves into {ord}.",
    },
    {
      es: "{defender} intenta cerrar la salida de {corner}, pero {attacker} mantiene el coche en pista y completa una pasada de mucho compromiso hacia {ord}.",
      en: "{defender} tries to close the exit of {corner}, but {attacker} keeps the car on track and completes a high-commitment pass into {ord}.",
    },
  ],
  switchback: [
    {
      es: "¡{attacker} fuerza a {defender} a cubrir el interior y sale peor de {corner}; {attacker} le pasa por salir con mejor traccion y se coloca en {ord} posicion!",
      en: "{attacker} forces {defender} to cover the inside and get a worse exit from {corner}; better traction completes the pass for {ord}.",
    },
    {
      es: "{attacker} fuerza a {defender} a entrar pasado en {corner}, cruza la trazada y acelera hacia {ord}.",
      en: "{attacker} forces {defender} deep into {corner}, cuts back and accelerates into {ord}.",
    },
    {
      es: "{defender} se queda defendiendo la entrada y {attacker} le gana la salida con la contratrazada para ponerse {ord}.",
      en: "{defender} is left defending entry and {attacker} wins the exit with the switchback to move into {ord}.",
    },
    {
      es: "{attacker} amaga por el interior, obliga a {defender} a entrar estrecho y cruza mejor hacia {ord}.",
      en: "{attacker} feints inside, forces {defender} into a narrow entry and switches back better into {ord}.",
    },
    {
      es: "{attacker} no se precipita en {corner}: deja que {defender} cubra la cuerda, abre el angulo y acelera hacia {ord}.",
      en: "{attacker} does not rush it at {corner}: lets {defender} cover the apex, opens the angle and accelerates into {ord}.",
    },
    {
      es: "{defender} defiende la primera parte de {corner}, pero {attacker} tenia preparada la segunda y la contratrazada le da {ord}.",
      en: "{defender} defends the first part of {corner}, but {attacker} had the second part prepared and the switchback gives them {ord}.",
    },
    {
      es: "{attacker} vende el ataque por fuera, hace frenar a {defender} fuera de linea y cruza el coche para subir a {ord}.",
      en: "{attacker} sells the outside move, makes {defender} brake off-line and crosses the car back to move into {ord}.",
    },
  ],
  drs: [
    {
      es: "{attacker} abre DRS, sale del rebufo y pasa a {defender} antes de la frenada para colocarse {ord}.",
      en: "{attacker} opens DRS, pulls out of the tow and passes {defender} before the braking zone for {ord}.",
      needs: "drs",
    },
    {
      es: "{defender} intenta romper el rebufo, pero {attacker} llega con DRS y completa el adelantamiento hacia {ord}.",
      en: "{defender} tries to break the tow, but {attacker} arrives with DRS and completes the pass into {ord}.",
      needs: "drs",
    },
    {
      es: "{attacker} sale del rebufo con DRS y {defender} decide no pelear una frenada perdida: {ord} para el atacante.",
      en: "{attacker} pulls out of the tow with DRS and {defender} chooses not to fight a lost braking zone: {ord} for the attacker.",
      needs: "drs",
    },
  ],
  error: [
    {
      es: "{defender} se va largo en {corner}; {attacker} no duda, coloca el coche y sube a {ord}.",
      en: "{defender} runs wide at {corner}; {attacker} does not hesitate, places the car and moves up to {ord}.",
    },
    {
      es: "{defender} bloquea al defender {corner} y {attacker} recoge la posicion para ponerse {ord}.",
      en: "{defender} locks up defending {corner} and {attacker} collects the position for {ord}.",
    },
    {
      es: "{defender} pisa la zona sucia antes de {corner}; {attacker} lee el error, cambia de lado y gana {ord}.",
      en: "{defender} touches the dirty line before {corner}; {attacker} reads the mistake, changes side and takes {ord}.",
    },
  ],
  defense: [
    {
      es: "¡{defender} se defiende por el medio de la pista al llegar a {corner} y {attacker} no consigue pasarle!",
      en: "{defender} defends through the middle of the track on the run to {corner} and {attacker} cannot get past.",
    },
    {
      es: "¡{defender} se defiende por el interior de {corner} y {attacker} no consigue pasar!",
      en: "{defender} defends the inside of {corner} and {attacker} cannot make the pass.",
    },
    {
      es: "{defender} lee el ataque de {attacker}, cierra el interior de {corner} y mantiene la posicion.",
      en: "{defender} reads {attacker}'s attack, shuts the inside of {corner} and holds the place.",
    },
    {
      es: "{attacker} ensena el coche en {corner}, pero {defender} frena limpio y no deja hueco.",
      en: "{attacker} shows the car at {corner}, but {defender} brakes cleanly and leaves no gap.",
    },
    {
      es: "{defender} sacrifica la entrada, gana la salida y corta el intento de {attacker} sin contacto.",
      en: "{defender} sacrifices entry, wins the exit and stops {attacker}'s attempt without contact.",
    },
    {
      es: "{attacker} llega con mas velocidad, pero {defender} coloca el coche en el centro y le deja solo el camino largo.",
      en: "{attacker} arrives faster, but {defender} parks the car in the middle and leaves only the long way round.",
    },
    {
      es: "{defender} deja exactamente un coche de ancho en {corner}; {attacker} no puede completar la maniobra sin salirse.",
      en: "{defender} leaves exactly one car width at {corner}; {attacker} cannot finish the move without running off.",
    },
    {
      es: "{defender} cubre la frenada y despues abre el volante en la salida de {corner}; {attacker} no encuentra la contratrazada.",
      en: "{defender} covers the braking zone and then opens the wheel on exit of {corner}; {attacker} cannot make the switchback work.",
    },
    {
      es: "{attacker} intenta vender el ataque por fuera, pero {defender} no muerde el anzuelo y conserva la linea buena.",
      en: "{attacker} tries to sell the outside move, but {defender} does not bite and keeps the better line.",
    },
    {
      es: "{defender} acepta perder la entrada de {corner} para salir mas recto; {attacker} queda sin traccion para completar el ataque.",
      en: "{defender} accepts losing entry into {corner} to exit straighter; {attacker} lacks the traction to finish the attack.",
    },
  ],
  sideBySide: [
    {
      es: "{attacker} y {defender} cruzan {corner} rueda con rueda; ninguno cede y la pelea sigue viva.",
      en: "{attacker} and {defender} run wheel to wheel through {corner}; neither yields and the fight stays alive.",
    },
    {
      es: "Dos curvas en paralelo entre {attacker} y {defender}; el orden no cambia, pero el pulso sube.",
      en: "Two corners side by side between {attacker} and {defender}; the order stays the same, but the pressure rises.",
    },
    {
      es: "{attacker} ataca, {defender} responde y ambos llegan a {corner} con medio coche en paralelo.",
      en: "{attacker} attacks, {defender} answers and both reach {corner} with half a car alongside.",
    },
  ],
  contact: [
    {
      es: "{attacker} mete el morro en {corner} y {defender} cierra tarde; hay roce rueda con rueda, pero ambos siguen.",
      en: "{attacker} gets the nose in at {corner} and {defender} closes late; wheel-to-wheel contact, but both continue.",
    },
    {
      es: "{defender} se mueve para cubrir {corner} justo cuando {attacker} salia del rebufo; toque ligero y perdida de impulso para los dos.",
      en: "{defender} moves to cover {corner} just as {attacker} pulls out of the tow; light contact and momentum lost for both.",
    },
    {
      es: "{attacker} entra demasiado justo en {corner}; {defender} aguanta por fuera y los dos salen con el coche nervioso.",
      en: "{attacker} goes in too tight at {corner}; {defender} hangs on outside and both exit with the cars unsettled.",
    },
    {
      es: "{defender} deja poco espacio en {corner}; {attacker} evita el golpe fuerte, pero el aleron queda rozado.",
      en: "{defender} leaves little room at {corner}; {attacker} avoids heavy contact, but the wing is rubbed.",
    },
  ],
  lockup: [
    {
      es: "{attacker} llega demasiado optimista a {corner}, bloquea y {defender} conserva la plaza.",
      en: "{attacker} arrives too optimistic into {corner}, locks up and {defender} keeps the place.",
    },
    {
      es: "{attacker} intenta la frenada tarde, se pasa un metro y tiene que devolver el ataque a la siguiente vuelta.",
      en: "{attacker} tries the late brake, runs a metre too deep and has to try again next lap.",
    },
    {
      es: "{attacker} gana el interior de {corner}, pero bloquea y se va ancho; {defender} recupera la trazada.",
      en: "{attacker} wins the inside of {corner}, but locks up and runs wide; {defender} takes the line back.",
    },
    {
      es: "{attacker} llega demasiado lanzado a {corner}; la rueda delantera se bloquea y la posible pasada se convierte en defensa urgente.",
      en: "{attacker} arrives too hot into {corner}; the front locks and the possible pass turns into urgent defending.",
    },
    {
      es: "{attacker} intenta frenar por la zona sucia en {corner}, se queda sin agarre y {defender} sale mejor colocado.",
      en: "{attacker} tries to brake on the dirty side at {corner}, runs out of grip and {defender} exits better placed.",
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
