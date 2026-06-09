import { locale } from "./i18n";

// Grand Prix names must always carry the definite article when named in prose:
// "el Gran Premio de Mónaco" / "the Monaco Grand Prix". We inject it around the
// {race} placeholder according to the surrounding grammar (Spanish contracts
// "de el" -> "del" and "a el" -> "al", and the article is capitalised at the
// start of a sentence). A sentinel marks already-handled spots so the generic
// pass doesn't double-article them.
const articleizeRaceTemplate = (template) => {
  if (template.indexOf("{race}") === -1) return template;
  if (locale === "es") {
    // Capture whatever sits right before {race}: a sentence break, the
    // prepositions "de"/"a" (which contract to del/al), or a plain space.
    return template.replace(/(^|[.!?]\s+|\bde |\ba |\s)\{race\}/g, function (match, pre) {
      if (pre === "de ") return "del {race}";
      if (pre === "a ") return "al {race}";
      if (pre === "" || /[.!?]\s+$/.test(pre)) return pre + "El {race}";
      return pre + "el {race}";
    });
  }
  return template.replace(/(^|[.!?]\s+|\s)\{race\}/g, function (match, pre) {
    return pre === "" || /[.!?]\s+$/.test(pre) ? pre + "The {race}" : pre + "the {race}";
  });
};

const fillTemplate = (template, vars) =>
  articleizeRaceTemplate(template).replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] != null ? String(vars[key]) : match
  );

const pickFromBank = (bank, rng) => {
  if (!bank || !bank.length) return "";
  return bank[Math.floor(rng() * bank.length)];
};

const pickByLocale = (bankByLocale) => bankByLocale[locale] || bankByLocale.es;

const ordinal = (position) => {
  if (!position) return "";
  return locale === "es" ? `${position}.º` : `P${position}`;
};

const SEASON_INTRO_TEMPLATES_BY_LOCALE = {
  es: [
    "Arranca la temporada {year}. {teamCount} escuderías y {driverCount} pilotos persiguen el cetro mundial a lo largo de {raceCount} grandes premios.",
    "Telón arriba para {year}: la parrilla reúne a {teamCount} equipos y {driverCount} pilotos en busca de la corona en {raceCount} carreras.",
    "Bienvenidos a {year}. {teamCount} constructores y {driverCount} volantes abren un mundial de {raceCount} citas que promete escribir historia.",
    "Calendario abierto. {raceCount} grandes premios decidirán al campeón {year} entre {teamCount} equipos y {driverCount} pilotos de élite.",
    "El paddock toma posiciones en {year}. {teamCount} escuderías y {driverCount} pilotos compiten por el título en {raceCount} citas.",
    "Comienza el mundial {year}. {teamCount} constructores y {driverCount} volantes apuntan a un calendario de {raceCount} carreras.",
    "{year} arranca con {teamCount} equipos y {driverCount} pilotos sobre una cuadrícula histórica. {raceCount} grandes premios por delante.",
    "Año {year}: las máquinas rugen y los cascos brillan. {teamCount} equipos y {driverCount} pilotos pelean en {raceCount} grandes premios.",
    "La cuenta atrás se acabó. {year}, {teamCount} equipos, {driverCount} pilotos, {raceCount} carreras: campeonato abierto.",
    "El paddock está listo. {year} encara {raceCount} citas con {teamCount} escuderías y {driverCount} pilotos a bordo.",
    "Cinco luces, fuera. {year} pone en pista a {teamCount} equipos y {driverCount} pilotos para un mundial de {raceCount} carreras.",
    "Estreno de la temporada {year}. {teamCount} equipos y {driverCount} pilotos firman compromiso para {raceCount} carreras.",
    "Garages abiertos, motores arrancados. {year} inaugura su mundial con {teamCount} constructores y {driverCount} pilotos sobre {raceCount} grandes premios.",
    "Curva uno a la vista. {year} suelta a {teamCount} equipos y {driverCount} pilotos en {raceCount} grandes premios.",
    "Una parrilla soñada se planta en {year}: {teamCount} equipos, {driverCount} pilotos, {raceCount} carreras. Que gane el mejor.",
    "Lights out en {year}. La leyenda continúa con {teamCount} constructores, {driverCount} pilotos y {raceCount} citas en el horizonte.",
    "Se levanta el telón en {year}. {teamCount} equipos miden fuerzas y {driverCount} pilotos firman {raceCount} duelos al límite.",
  ],
  en: [
    "The {year} season is on. {teamCount} teams and {driverCount} drivers chase the title across {raceCount} grands prix.",
    "Curtain up on {year}: a grid of {teamCount} constructors and {driverCount} drivers fight for the crown over {raceCount} races.",
    "Welcome to {year}. {teamCount} teams and {driverCount} drivers kick off a {raceCount}-race championship that promises to make history.",
    "Calendar open. {raceCount} grands prix will crown the {year} champion among {teamCount} teams and {driverCount} elite drivers.",
    "The paddock takes its place in {year}. {teamCount} teams and {driverCount} drivers fight for the title across {raceCount} dates.",
    "The {year} world championship begins. {teamCount} constructors and {driverCount} drivers set their sights on {raceCount} races.",
    "{year} opens with {teamCount} teams and {driverCount} drivers on a historic grid. {raceCount} grands prix lie ahead.",
    "Year {year}: engines roar and helmets shine. {teamCount} teams and {driverCount} drivers battle across {raceCount} grands prix.",
    "The countdown is over. {year}, {teamCount} teams, {driverCount} drivers, {raceCount} races: championship wide open.",
    "The paddock is ready. {year} faces {raceCount} races with {teamCount} teams and {driverCount} drivers on board.",
    "Five lights out. {year} puts {teamCount} teams and {driverCount} drivers on track for a {raceCount}-race championship.",
    "Season opener for {year}. {teamCount} teams and {driverCount} drivers sign up for {raceCount} races.",
    "Garages open, engines fired. {year} kicks off its title fight with {teamCount} constructors and {driverCount} drivers over {raceCount} grands prix.",
    "Turn one in sight. {year} unleashes {teamCount} teams and {driverCount} drivers across {raceCount} grands prix.",
    "A dream grid lines up for {year}: {teamCount} teams, {driverCount} drivers, {raceCount} races. May the best one win.",
    "Lights out for {year}. The legend continues with {teamCount} constructors, {driverCount} drivers and {raceCount} dates on the horizon.",
    "The curtain rises on {year}. {teamCount} teams measure up and {driverCount} drivers stage {raceCount} duels on the limit.",
  ],
};

const DECISIVE_MOMENTS_BY_LOCALE = {
  es: {
    dominant: [
      "Ritmo de referencia y victoria en pista limpia, sin un solo error.",
      "Marcó el tono en la primera vuelta y no soltó el liderato hasta meta.",
      "Ningún rival pudo acercarse a tres décimas durante toda la carrera.",
      "Convirtió el trazado en un Gran Premio a un coche: diferencia desde la salida.",
      "Pista limpia tras las paradas y un margen invencible al final.",
      "Ritmo de manual con vueltas rápidas selladas en cada relanzamiento.",
      "Defensa tranquila, ataque medido, victoria con espacio de sobra.",
    ],
    upset: [
      "Un undercut imposible cambió la carrera en una sola vuelta.",
      "Aguantó la presión final para llevarse el triunfo.",
      "Subió desde un perfil de zona media a un fin de semana de leyenda.",
      "Su ritmo en los stints largos descolocó a los favoritos.",
      "Compromisos de neumáticos arriesgados que salieron perfectos.",
      "Aprovechó cada error ajeno con frialdad de veterano.",
      "Su parada llegó en el momento exacto y cambió por completo la lectura de carrera.",
    ],
    chaos: [
      "Tres coches fuera en diez vueltas reescribieron la clasificación.",
      "Salieron pancartas y banderas amarillas en el peor momento para los líderes.",
      "Cuando reventó la suspensión del favorito, la carrera quedó decidida.",
      "Choque múltiple en el inicio que abrió hueco para el resto del pelotón.",
      "Una segunda salida con caos repartió cartas nuevas a media carrera.",
    ],
    safety_car: [
      "El coche de seguridad borró de un plumazo la ventaja construida durante toda la carrera.",
      "Una salida tras coche de seguridad decidió quién entraba a boxes con el carril libre.",
      "El relanzamiento a quince vueltas del final repartió cartas nuevas para todos.",
      "La amarilla tardía convirtió la estrategia en un cara o cruz.",
      "Neutralización en el peor momento para el líder y comprimido el pelotón hasta el parachoques.",
      "El reinicio juntó a todo el mundo y la victoria se jugó en una sola frenada.",
    ],
    wet: [
      "En la transición de seco a mojado se separó al ganador del resto.",
      "La elección de intermedios tres vueltas antes que el rival fue letal.",
      "Bajo la lluvia, la muñeca del ganador volvió a marcar diferencia.",
      "Un cambio brusco del tiempo descolocó a quienes esperaron una vuelta más.",
      "Diluvio inesperado: solo los que se atrevieron a cambiar a tiempo sobrevivieron.",
    ],
    leader_dnf: [
      "El abandono del líder del campeonato torció de golpe el rumbo del mundial.",
      "El motor del hasta entonces líder dijo basta a doce vueltas del final.",
      "Una rotura de transmisión hizo trizas el guion del puntero de la tabla.",
      "El error en boxes del piloto top tiró por la borda la carrera y abrió la puerta a un nuevo rey.",
      "El líder se fue a la grava cuando mejor pintaba todo, y nadie desaprovechó la herencia.",
      "Un toque tonto dejó fuera al favorito y reescribió la tarde para todos los demás.",
    ],
    comeback: [
      "Desde la sexta plaza hilvanó una de las remontadas del año.",
      "Tres adelantamientos en cinco vueltas pusieron la victoria a tiro.",
      "Convirtió un pit lane lento en una clase magistral de gestión de ritmo.",
      "Volvió desde fuera de los puntos hasta el podio en quince vueltas de infarto.",
      "Cada vuelta era un coche menos por delante hasta que ya no quedó ninguno.",
      "Salió mal parado, pero fue comiéndose la parrilla a bocados hasta liderarla.",
    ],
    tyre: [
      "La gestión de la degradación marcó el resultado en los últimos veinte giros.",
      "Un stint medio-medio decisivo desnudó al rival a falta de seis vueltas.",
      "Estiró el primer juego diez vueltas más que cualquiera y eso bastó.",
    ],
    control: [
      "Posición en pista bien guardada, con ritmo de control en cada fase de la carrera.",
      "Defensa serena desde la salida hasta la última curva, sin un solo amago de duda.",
      "Sin sobresaltos, sin riesgos y sin necesidad de enseñar más cartas de la cuenta.",
      "Administró la ventaja con la cabeza fría de quien ya sabe que la carrera está hecha.",
      "Cada vez que un rival se acercaba, respondía con una vuelta rápida y volvía a estirar el hueco.",
    ],
    photo_finish: [
      "Final a degüello: entre el oro y la plata cupo apenas un suspiro.",
      "El último sector escribió una victoria que se decidió por puros detalles.",
      "Foto de meta, tensión en el muro y todo el paddock conteniendo la respiración hasta el veredicto.",
      "Llegaron emparejados a la línea y la victoria se resolvió por el ancho de un faldón.",
      "Una última vuelta de las que dejan sin uñas, resuelta en la frenada final.",
    ],
    team_double: [
      "Doblete de la escudería con los dos coches funcionando como un mecanismo de relojería.",
      "Los dos pilotos del equipo gestionaron el cierre como si fueran un solo coche.",
      "Estrategia de garaje milimétricamente sincronizada para amarrar el 1-2.",
      "Cuando uno marcaba el ritmo, el otro cerraba la puerta: pleno al equipo.",
      "Un fin de semana redondo para la escudería, con sus dos máquinas intratables de principio a fin.",
    ],
    strategy: [
      "El overcut en la primera ronda de paradas fue el golpe que sentenció la carrera.",
      "Apostar por una sola parada mientras el resto iba a dos descolocó al ganador de antes.",
      "Estiró el segundo juego de duros hasta extremos que parecían imposibles.",
      "El falso amago de boxes de los rivales se tradujo en ventaja real para el campeón del día.",
      "El muro acertó la ventana exacta y lo que era empate en pista se volvió victoria cómoda.",
      "Un undercut clavado al milímetro le dio la posición que ya no soltaría.",
    ],
    streak: [
      "La racha sigue viva y el dominio empieza a oler a ley no escrita.",
      "Una secuencia que aplana el campeonato y obliga a reescribir la lista de favoritos.",
      "Cada Gran Premio se convierte en un capítulo más de la misma historia.",
      "Van tantas seguidas que el resto ya corre por el segundo puesto.",
      "Otra muesca en el casco: el guion se repite y nadie encuentra la manera de pararlo.",
    ],
    rookie: [
      "Un primer triunfo en F1 que el paddock recordará durante años.",
      "Estreno de campeón: nervios, ritmo y carácter en una sola tarde.",
      "El novato escribió su primer titular grande con tinta indeleble.",
    ],
    veteran: [
      "Un recordatorio del veterano: la experiencia sigue valiendo décimas.",
      "Lección de oficio: cada vuelta calculada al milímetro.",
      "El más experto del pelotón saca a relucir el manual del campeón.",
    ],
  },
  en: {
    dominant: [
      "Reference pace and a flawless win on a clear track.",
      "Set the tone on lap one and never let the lead go until the flag.",
      "No rival could get within three tenths the whole race.",
      "Turned the venue into a one-car grand prix from the lights out.",
      "Clear air after the pit stops and an unbeatable margin at the end.",
      "Textbook pace with hammer-down laps sealed at every restart.",
      "Calm defense, measured attack, win with plenty of room to spare.",
    ],
    upset: [
      "An impossible undercut flipped the race in a single lap.",
      "Held off three attacks on the last lap to take the win.",
      "Climbed from the sixth row to a weekend of legend.",
      "Long-stint pace caught the favorites by surprise.",
      "Risky tyre calls that paid off perfectly.",
      "Capitalised on every rival error with veteran composure.",
      "A pit stop four tenths faster than anyone had a right to expect.",
    ],
    chaos: [
      "Three cars out in ten laps rewrote the order.",
      "Yellow flags and barriers came up at the worst moment for the leaders.",
      "When the favourite's suspension let go, the race was effectively decided.",
      "An opening-lap pile-up cleared the way for the rest of the pack.",
      "A chaotic second start dealt a fresh hand mid-race.",
    ],
    safety_car: [
      "The safety car wiped out the gap built over the whole race in one swoop.",
      "A restart behind the safety car decided who got the free pit stop.",
      "The relaunch fifteen laps from home reshuffled the deck for everyone.",
      "The late yellow turned strategy into a coin toss.",
      "Neutralisation at the worst possible moment for the leader, with the pack squeezed bumper to bumper.",
      "The restart bunched everyone up and the win came down to a single braking zone.",
    ],
    wet: [
      "The crossover from dry to wet separated the winner from the rest.",
      "Switching to inters three laps before the rivals was lethal.",
      "Under the rain, the winner's wrist made the difference once again.",
      "A sudden weather swing caught out anyone who waited one more lap.",
      "Unexpected downpour: only those bold enough to box on time survived.",
    ],
    leader_dnf: [
      "The championship leader's retirement reshaped the title race in an instant.",
      "The leader's engine cried enough with twelve laps to go.",
      "A driveline failure tore up the script of the man at the front of the table.",
      "A pit-lane blunder by the top driver threw the race away and opened the door for a new king.",
      "The leader beached it in the gravel just as everything was falling into place, and nobody wasted the gift.",
      "A clumsy tap put the favourite out and rewrote the afternoon for everyone else.",
    ],
    comeback: [
      "From sixth place, one of the year's great comebacks.",
      "Three passes in five laps put the win in range.",
      "Turned a slow pit stop into a masterclass in pace management.",
      "Climbed from outside the points to the podium in fifteen electric laps.",
      "Every lap meant one fewer car ahead, until there were none left.",
      "Started on the back foot and chewed through the grid one bite at a time until he led it.",
    ],
    tyre: [
      "Tyre management decided the result in the final twenty laps.",
      "A decisive medium-medium stint exposed the rival with six laps left.",
      "Stretched the first set ten laps further than anyone, and that was enough.",
    ],
    control: [
      "Track position guarded with controlled pace in every phase of the race.",
      "Calm defence from the lights to the final corner, never a flicker of doubt.",
      "No drama, no risks, no need to show a single card more than necessary.",
      "Managed the gap with the cool head of a driver who already knows the race is done.",
      "Every time a rival crept closer, the answer was a fastest lap and the gap stretched again.",
    ],
    photo_finish: [
      "Last lap to the wire: barely a breath between gold and silver.",
      "The final corner wrote a win settled by pure detail.",
      "Photo finish, stopwatch deciding and the whole paddock holding its breath for the verdict.",
      "They arrived side by side at the line and the win came down to a bodywork's width.",
      "A final lap to chew your nails to the bone, settled under braking into the last corner.",
    ],
    team_double: [
      "Team double with both cars ticking like clockwork.",
      "Both team drivers managed the finish as if they were a single car.",
      "Garage strategy synced to the millimetre to lock in the 1-2.",
      "When one set the pace, the other shut the door: a clean sweep for the team.",
      "A perfect weekend for the constructor, its two machines untouchable from start to finish.",
    ],
    strategy: [
      "The overcut at the first pit window was the blow that settled the race.",
      "Betting on one stop while everyone else went for two caught the previous winner off guard.",
      "Stretched the second set of hards to lengths that looked impossible.",
      "The rivals' fake stop-and-go turned into real advantage for the winner of the day.",
      "The pit wall nailed the exact window and an on-track stalemate became a comfortable win.",
      "An undercut timed to the millimetre handed over the position he'd never give back.",
    ],
    streak: [
      "The streak lives on and the dominance is starting to look like unwritten law.",
      "A run that flattens the championship and forces a rethink of the favourites.",
      "Every grand prix becomes another chapter of the same story.",
      "So many in a row now that everyone else is racing for second.",
      "Another notch on the helmet: the script repeats and nobody can find a way to stop it.",
    ],
    rookie: [
      "A first F1 win the paddock will remember for years.",
      "Champion's debut: nerves, pace and character in one afternoon.",
      "The rookie wrote his first big headline in indelible ink.",
    ],
    veteran: [
      "A veteran reminder: experience still earns tenths.",
      "Masterclass in craft: every lap calibrated to the millimetre.",
      "The most experienced driver in the field pulled out the champion's playbook.",
    ],
  },
};

const CATEGORY_TEMPLATES_BY_LOCALE = {
  es: {
    dominant: [
      "Recital de {winner} en {race}. {team} firma una victoria sin oposición real.",
      "{race}: {winner} sale, lidera y gana sin un solo titular incómodo para {team}.",
      "Pista propia para {winner} en {race}. {team} pasea por la cuadrícula.",
      "Sin sorpresas en {race}: {winner} convierte el mejor ritmo en victoria como dictaba el guion.",
      "Clase magistral de {winner} en {race}: {team} se va con una victoria de alto valor.",
      "{race} cae del lado lógico: {winner} para {team}, en el final del día sigue todo como debía.",
      "Dominio puro de {winner} en {race}. {team} maneja el escaparate de {weather} sin un solo paso en falso.",
      "{race} sin emoción al frente: {winner} controla todos los relojes y entrega a {team} otra victoria cómoda.",
      "Cátedra de {winner} en {race}. {team} ejecuta una carrera de manual y se lleva todo en juego.",
      "{race}: máximo control del binomio {winner} / {team}, sin un solo momento de duda en las fases clave.",
      "Lección de paddock en {race}: {winner} marca ritmo, neumático y línea.",
      "{winner} encadena vuelta perfecta tras vuelta perfecta en {race} para regalarle a {team} un triunfo de manual.",
    ],
    upset: [
      "Sorpresa mayúscula en {race}: {winner} arrebata la victoria desde fuera del grupo favorito.",
      "{race} se cae del lado imprevisto. {winner} regala a {team} un triunfo que pocos imaginaban en clasificación.",
      "Bombazo en {race}: {winner} lee mejor la carrera y deja a los favoritos sin respuesta.",
      "{race} entrega un giro inesperado: {winner} aparece donde nadie le esperaba y se lleva la victoria para {team}.",
      "Resultado inédito en {race}. {winner} y {team} firman un capítulo digno de antología del mundial.",
      "Carrera de cuento de hadas en {race}: {winner} cruza la línea primero contra todo pronóstico.",
      "Nadie tenía en su quiniela a {winner} ganando {race}; lo hizo, y con margen para hacerlo otra vez.",
      "{race} se reescribe por completo. {winner} aprovecha cada apertura y entrega a {team} un sorpresón.",
      "Cambio de actores en {race}: {winner} se sube al escenario principal y firma el triunfo más improbable de la temporada.",
      "Cuando todos miraban a otros, {winner} colocó a {team} en lo más alto de {race}.",
      "{race} para {winner} y para {team}: una victoria de pizarra que vuela todo lo previsto.",
    ],
    wet_master: [
      "Carrera de los valientes en {race}. {winner} domina la lluvia y le entrega a {team} una victoria épica.",
      "Diluvio en {race}, exhibición de {winner}: {team} se lleva un triunfo bajo el agua que vale por dos.",
      "{race} se transforma con la lluvia y {winner} demuestra por qué su muñeca es de las mejores del paddock.",
      "Pasarela acuática en {race}. {winner} firma vueltas que parecían imposibles y {team} se queda con el botín.",
      "Carrera anfibia en {race}: {winner} elige momento e intermedios y le da a {team} un trofeo de leyenda.",
      "Lluvia, niebla y {winner}. {team} se llevó un Gran Premio en condiciones que muy pocos disfrutaron en {race}.",
      "El cielo se desplomó sobre {race} y {winner} respondió con una clase de manejo de neumático mojado.",
      "{winner} hizo de {race} su pintura particular. {team} gana en una carrera de las que se ven una vez por temporada.",
      "Diluvio bíblico en {race}: {winner} y {team} construyen una victoria que ya forma parte del folclore del campeonato.",
      "Bailando bajo la lluvia: {winner} pone a {team} en lo más alto en una de las grandes carreras del año en {race}.",
    ],
    chaos: [
      "Caos absoluto en {race}: tres coches fuera y {winner} aparece para llevarse la victoria por {team}.",
      "{race} se rompe en pedazos. Mientras los favoritos se quedan tirados, {winner} hace su carrera y entrega a {team} el botín completo.",
      "Carrera demolida en {race}. {winner} sobrevive, ejecuta y firma un triunfo para {team}.",
      "Hecatombe mecánica en {race}: muchos coches fuera, {winner} de pie. {team} se lleva la única consistencia del día.",
      "Carambolas, banderas amarillas y {winner} al frente. {race} entrega a {team} la victoria a base de mantenerse entero.",
      "Escenas de circo en {race}. {winner} guarda la calma, esquiva la guerra y firma un triunfo de oficio para {team}.",
      "Una de las carreras más rotas del año en {race}. {winner} mantiene el coche entero y se va con todos los puntos.",
      "Bandera roja, recapitulación, reinicio y {winner} arriba. {team} no se mete en líos en {race}.",
      "{race} fue un juego de supervivencia. {winner} jugó mejor que nadie y le regaló a {team} 25 puntos de oro.",
    ],
    safety_car: [
      "El coche de seguridad decidió {race}. {winner} aprovechó el reinicio y le entregó a {team} una victoria táctica.",
      "{race} cambió tras el coche de seguridad. {winner} respondió mejor que nadie y {team} se llevó el día.",
      "Ventaja borrada por el coche de seguridad en {race}, pero {winner} reconstruyó la diferencia y {team} firmó la victoria.",
      "Coche de seguridad en el momento más caliente de {race}: {winner} respondió, {team} celebró.",
      "{winner} aprovechó el coche de seguridad en {race} y le regaló a {team} una victoria que parecía cuesta arriba.",
      "Carrera reseteada por el coche de seguridad, victoria reconstruida por {winner}. {team} suma fuerte en {race}.",
      "La neutralización tardía en {race} reordenó las opciones y {winner} eligió el momento exacto para atacar.",
      "Reinicio caliente en {race}: {winner} ejecutó como un veterano y {team} recogió las recompensas.",
      "Un coche de seguridad a falta de quince vueltas comprimió el grupo en {race} y {winner} respondió con un ataque inmediato.",
    ],
    leader_dnf: [
      "Golpe brutal al campeonato en {race}: el líder se queda sin coche y {winner} hereda la victoria para {team}.",
      "El puntero de la tabla se rompe en {race}. {winner} aparece para llevarse el botín para {team}.",
      "{race} cambia el mundial: abandono del líder y {winner} cosecha 25 puntos de oro para {team}.",
      "Drama en {race}: el coche del líder dice basta y {winner} convierte la suerte en victoria para {team}.",
      "El líder se queda fuera de combate en {race}. {winner} no perdona y {team} se queda con la victoria.",
      "Cataclismo para el primero del mundial en {race}. {winner} la heredó pero la peleó. {team} se va con todo.",
      "{race} dejó al líder con cara larga. {winner} respondió como un campeón y {team} aprovechó la oportunidad.",
    ],
    comeback: [
      "Remontada espectacular de {winner} en {race}: {team} gana una carrera que parecía perdida.",
      "{winner} subió desde el fondo del grupo en {race} y firmó un triunfo épico para {team}.",
      "Carrera de remontada en {race}. {winner} firma adelantamientos de los que cuentan y {team} brinda con la victoria.",
      "{race} se hizo cuesta arriba para {winner}, que la convirtió en cuesta abajo a base de adelantamientos. {team} celebra.",
      "Maratón de adelantamientos en {race}. {winner} la peleó vuelta a vuelta y {team} se la quedó.",
      "Remontada de campeón en {race}: {winner} subió escalón a escalón hasta dejarle la victoria a {team}.",
      "Crónica de un asalto: {winner} convirtió un fin de semana complicado en triunfo en {race} para {team}.",
    ],
    streak: [
      "{winner} no se cansa en {race}: otra victoria para {team} y la racha continúa.",
      "Sigue dominando {winner} en {race}. {team} amplía la diferencia y empieza a oler a campeonato.",
      "Otra vez {winner}, otra vez {team}. En {race}, la racha se vuelve cuestión de tiempo.",
      "La hegemonía de {winner} continúa en {race}. {team} consolida liderato y mensaje.",
      "{race} no rompe la racha. {winner} suma otra victoria y {team} firma su dominio.",
      "Cada vez que parece una nueva carrera, gana lo mismo: {winner} y {team} repiten guion en {race}.",
      "Vuelven a coincidir nombre y apellido: {winner} para {team} en {race}, sin sobresaltos.",
    ],
    photo_finish: [
      "Final de foto en {race}: {winner} cruza la meta apenas por delante para meter el oro en casa de {team}.",
      "{race} se decide en el tramo final. {winner} aguanta el ataque y le entrega a {team} un triunfo épico.",
      "Tramo final de infarto en {race}. {winner} firma una de las victorias más estrechas de la temporada.",
      "{race} se decide por detalles: {winner} encuentra el hueco decisivo y {team} se la queda.",
      "Final de carrera para enmarcar en {race}. {winner} y {team} se llevan un triunfo decidido por muy poco.",
      "Duelo a brazo partido hasta el cierre en {race}. {winner} prevalece y {team} estalla en boxes.",
      "Carrera de las que se cuentan: {winner} se lleva {race} por margen mínimo y le regala a {team} una victoria histórica.",
    ],
    team_double: [
      "Doblete de {team} en {race}: {winner} adelante, {second} a continuación.",
      "1-2 perfecto para {team} en {race}, encabezado por {winner}.",
      "Día redondo para {team}: {winner} primero, {second} segundo. {race} se llevó el premio mayor.",
      "Doble podio de {team} en {race}, con {winner} y {second} de la mano hasta meta.",
      "Ejecución limpia de {team} en {race}: dos coches arriba, sin estorbarse, sin errores.",
      "Pintar de los colores del equipo el podio: {team} ocupa el 1-2 en {race} con {winner} al frente.",
    ],
    strategy: [
      "Pizarrazo de manual en {race}. {winner} ejecutó la estrategia perfecta y {team} se llevó el día.",
      "{race} se decidió en boxes. {winner} hizo correr su carta y {team} firmó la victoria.",
      "Estrategia de campeones para {team} en {race}. {winner} convirtió la pizarra en victoria.",
      "{race} fue ajedrez sobre asfalto. {winner} jugó el mejor movimiento y {team} se llevó la partida.",
      "Movida brillante de {team} en {race}. {winner} ejecutó el plan a la perfección.",
      "Cuestión de timing: {winner} y {team} cerraron {race} con el momento perfecto en boxes.",
      "Estrategia diferente, resultado diferente. {winner} ganó {race} para {team} con un guion atípico.",
    ],
    control: [
      "{race} no se complicó: {winner} controló de salida a meta y le entregó a {team} una victoria de oficio.",
      "Carrera bajo control en {race}. {winner} no dio opciones y {team} suma fuerte sin estrés.",
      "{race} en piloto automático para {winner}. {team} suma puntos importantes sin sobresaltos.",
      "Día tranquilo para {team} en {race}: {winner} hizo su carrera y mandó toda la cita.",
      "Sin sobresaltos: {winner} colocó a {team} en lo más alto de {race} y a otra cosa.",
      "Gestión de oficio en {race}: {winner} no rompió nada y {team} celebra la victoria.",
      "Resultado natural en {race}: {winner} ganó como lo dictaba la lógica y {team} consolida momento.",
      "{winner} se llevó {race} sin necesidad de subir el listón. {team} firma sin estridencias.",
      "Control absoluto en {race}. {winner} y {team} no dejaron resquicios al rival.",
    ],
  },
  en: {
    dominant: [
      "A {winner} masterclass at {race}. {team} bag a win with no real opposition.",
      "{race}: {winner} starts, leads and wins without a single awkward headline for {team}.",
      "Home turf for {winner} at {race}. {team} stroll through the grid.",
      "No surprises at {race}: {winner} turns the strongest pace into victory, just as the script demanded.",
      "Masterclass from {winner} at {race}: {team} leave with the win and the fastest lap.",
      "{race} falls on the logical side: {winner} for {team}, and at the end of the day everything stays as it should.",
      "Pure dominance from {winner} at {race}. {team} handle the {weather} showcase without a single misstep.",
      "{race} with no drama at the front: {winner} controls every clock and hands {team} another comfortable win.",
      "{winner}'s lecture at {race}. {team} run a textbook race and take everything on offer.",
      "{race}: total control of the {winner} / {team} pairing, never a moment's doubt in the key phases.",
      "Paddock lesson at {race}: {winner} sets pace, tyre and line.",
      "{winner} strings together perfect lap after perfect lap at {race} to gift {team} a textbook win.",
    ],
    upset: [
      "Major upset at {race}: {winner} snatches the win from outside the favourites.",
      "{race} falls on the unexpected side. {winner} hands {team} a win few imagined in qualifying.",
      "Bombshell at {race}: {winner} turns the race into a personal canvas and leaves the favourites without an answer.",
      "{race} delivers a twist: {winner} turns up where nobody expected and takes the win for {team}.",
      "Unprecedented result at {race}. {winner} and {team} write a chapter worthy of any championship anthology.",
      "Fairy-tale race at {race}: {winner} crosses the line first against every prediction.",
      "Nobody had {winner} winning {race} on their card; he did, and with room to do it again.",
      "{race} is rewritten entirely. {winner} takes every opening and gifts {team} a stunner.",
      "Cast change at {race}: {winner} steps onto the main stage and seals the most improbable win of the season.",
      "When everyone was looking elsewhere, {winner} put {team} on top at {race}.",
      "{race} for {winner} and for {team}: a chalkboard win that blows up every forecast.",
    ],
    wet_master: [
      "A race for the brave at {race}. {winner} masters the rain and hands {team} an epic win.",
      "Deluge at {race}, exhibition from {winner}: {team} take a wet-weather win worth twice as much.",
      "{race} is transformed by the rain and {winner} shows again why his wrist is one of the paddock's best.",
      "Aquatic catwalk at {race}. {winner} pulls off laps that looked impossible and {team} keep the spoils.",
      "Amphibian race at {race}: {winner} picks the moment, picks the inters and gifts {team} a legendary trophy.",
      "Rain, fog and {winner}. {team} took a grand prix in conditions few enjoyed at {race}.",
      "The sky collapsed on {race} and {winner} responded with a wet-tyre masterclass.",
      "{winner} made {race} a personal painting. {team} win in a race seen once a season.",
      "Biblical downpour at {race}: {winner} and {team} build a win that's already paddock folklore.",
      "Singing in the rain: {winner} puts {team} on top in one of the year's defining races at {race}.",
    ],
    chaos: [
      "Total chaos at {race}: three cars out and {winner} surfaces to take the win for {team}.",
      "{race} falls apart. While the favourites are stranded, {winner} runs his own race and hands {team} the lot.",
      "Race demolished at {race}. {winner} survives, executes and seals a win for {team}.",
      "Mechanical mayhem at {race}: lots of cars out, {winner} standing. {team} take the only consistency of the day.",
      "Pile-ups, yellow flags and {winner} at the front. {race} gives {team} the win by simply staying intact.",
      "Circus scenes at {race}. {winner} stays calm, dodges the war and seals a craftsman's win for {team}.",
      "One of the year's most broken races at {race}. {winner} keeps the car together and leaves with every point.",
      "Red flag, restart, and {winner} on top. {team} stay out of trouble at {race}.",
      "{race} was a survival game. {winner} played it better than anyone and gifted {team} 25 golden points.",
    ],
    safety_car: [
      "The safety car decided {race}. {winner} took the restart and delivered {team} a tactical win.",
      "{race} changed after the safety car. {winner} answered best and {team} took the day.",
      "Lead wiped by the safety car at {race}, but {winner} rebuilt the gap and {team} sealed the win.",
      "Safety car at the hottest moment of {race}: {winner} answered, {team} celebrated.",
      "{winner} thanked the safety car at {race} and gave {team} a win that looked uphill.",
      "Race reset by the safety car, win rebuilt by {winner}. {team} score big at {race}.",
      "The late neutralisation at {race} dealt fresh cards and {winner} shuffled best.",
      "Hot restart at {race}: {winner} executed like a veteran and {team} took the rewards.",
      "A safety car with fifteen laps left compressed the pack at {race} and {winner} answered with an instant strike.",
    ],
    leader_dnf: [
      "Brutal blow to the championship at {race}: the leader is out and {winner} inherits the win for {team}.",
      "The man at the top of the table breaks at {race}. {winner} surfaces to take the spoils for {team}.",
      "{race} changes the title race: leader's retirement and {winner} bags 25 golden points for {team}.",
      "Drama at {race}: the leader's car cries enough and {winner} turns luck into win for {team}.",
      "The leader runs dry at {race}. {winner} doesn't forgive and {team} keep the victory.",
      "Title cataclysm for the championship leader at {race}. {winner} inherited it but earned it. {team} leave with everything.",
      "{race} left the leader gutted. {winner} answered like a champion and {team} grabbed the chance.",
    ],
    comeback: [
      "Spectacular comeback from {winner} at {race}: {team} win a race that looked lost.",
      "{winner} climbed from the back at {race} and sealed an epic win for {team}.",
      "Comeback race at {race}. {winner} the kind of passes that count; {team} toast the win.",
      "{race} turned into a climb for {winner}, who turned it into a descent with pass after pass. {team} celebrate.",
      "Overtaking marathon at {race}. {winner} fought lap by lap and {team} kept it.",
      "Champion's comeback at {race}: {winner} climbed step by step until he handed {team} the win.",
      "Chronicle of an assault: {winner} turned a tough weekend into victory at {race} for {team}.",
    ],
    streak: [
      "{winner} doesn't tire at {race}: another win for {team} and the streak goes on.",
      "{winner} keeps dominating at {race}. {team} extend the gap and start to smell a title.",
      "Once again {winner}, once again {team}. At {race}, the streak becomes a matter of time.",
      "{winner}'s hegemony continues at {race}. {team} consolidate the lead and the message.",
      "{race} doesn't break the streak. {winner} adds another win and {team} cement their dominance.",
      "Every time it looks like a new race, the same name wins: {winner} and {team} replay the script at {race}.",
      "Name and surname align again: {winner} for {team} at {race}, no drama.",
    ],
    photo_finish: [
      "Photo finish at {race}: {winner} crosses the line just ahead to put the gold at {team}.",
      "{race} decided on the last lap. {winner} holds the attack and gives {team} an epic win.",
      "Heart-stopping last lap at {race}. {winner} delivers one of the closest wins of the season.",
      "{race} settled by millimetres: {winner} passes the leader three corners from home. {team} keep it.",
      "A frame-worthy finish at {race}. {winner} and {team} take the win by less than half a car.",
      "Bare-knuckle duel to the final straight at {race}. {winner} prevails, {team} explode in the pit box.",
      "One for the books: {winner} takes {race} by two tenths and gifts {team} a historic win.",
    ],
    team_double: [
      "Team double for {team} at {race}: {winner} ahead, {second} right behind.",
      "Perfect 1-2 for {team} at {race}, led by {winner}.",
      "Dream day for {team}: {winner} first, {second} second. {race} brought home the biggest prize.",
      "Double podium for {team} at {race}, with {winner} and {second} side by side to the flag.",
      "Clean execution from {team} at {race}: two cars on top, no contact, no errors.",
      "Painting the podium team colours: {team} take 1-2 at {race} with {winner} leading.",
    ],
    strategy: [
      "Textbook chalkboard at {race}. {winner} executed the perfect strategy and {team} took the day.",
      "{race} decided in the pits. {winner} played his card and {team} sealed the win.",
      "Champion's strategy for {team} at {race}. {winner} turned chalkboard into victory.",
      "{race} was asphalt chess. {winner} played the best move and {team} took the game.",
      "Brilliant move from {team} at {race}. {winner} executed the plan to perfection.",
      "Question of timing: {winner} and {team} closed out {race} with the perfect pit window.",
      "Different strategy, different result. {winner} won {race} for {team} with an atypical script.",
    ],
    control: [
      "{race} kept things simple: {winner} controlled lights to flag and gave {team} a craftsman's win.",
      "Race under control at {race}. {winner} gave no openings and {team} score big without stress.",
      "{race} on autopilot for {winner}. {team} take important points with no drama.",
      "Calm day for {team} at {race}: {winner} ran his race and ran the show.",
      "No drama: {winner} put {team} on top at {race} and on to the next.",
      "Craftsman management at {race}: {winner} didn't break anything and {team} celebrate the win.",
      "Natural result at {race}: {winner} won as logic dictated and {team} consolidate momentum.",
      "{winner} took {race} without lifting the level. {team} sign off without fireworks.",
      "Total control at {race}. {winner} and {team} left no openings for the rival.",
    ],
  },
};

const CONTRAST_CONNECTORS_BY_LOCALE = {
  es: [
    "Mientras tanto, {leaderAfter} sigue mandando en el mundial con {gapAfter} puntos de colchón.",
    "Arriba, en la general, {leaderAfter} aguanta el liderato con {gapAfter} puntos sobre el segundo.",
    "{leaderAfter} mantiene el rumbo del campeonato con un margen de {gapAfter} puntos.",
    "Al bajar el telón, {leaderAfter} sigue dictando el ritmo de la tabla con {gapAfter} puntos de renta.",
    "Foto de la general: {leaderAfter} en cabeza, {gapAfter} puntos por delante del perseguidor.",
    "{leaderAfter} se va de la cita con el liderato atado y {gapAfter} puntos de diferencia.",
    "En la pelea por el título, {leaderAfter} respira algo más tranquilo: {gapAfter} puntos de ventaja.",
    "Y en lo alto del mundial, lo de siempre por ahora: {leaderAfter}, con {gapAfter} puntos de margen.",
  ],
  en: [
    "Meanwhile, {leaderAfter} keeps the championship in hand with a {gapAfter}-point cushion.",
    "Up at the top of the table, {leaderAfter} holds the lead {gapAfter} points clear of second.",
    "{leaderAfter} stays on course in the title race with a {gapAfter}-point margin.",
    "As the curtain falls, {leaderAfter} still sets the table's pace with {gapAfter} points in hand.",
    "Standings snapshot: {leaderAfter} out front, {gapAfter} points clear of the chaser.",
    "{leaderAfter} leaves the weekend with the lead locked down and {gapAfter} points to spare.",
    "In the fight for the crown, {leaderAfter} breathes a little easier: {gapAfter} points up.",
    "And at the summit, same as ever for now: {leaderAfter}, {gapAfter} points to the good.",
  ],
};

// Used when the leader is level on points and only ahead on countback.
const CONTRAST_TIED_BY_LOCALE = {
  es: [
    "Mientras tanto, {leaderAfter} encabeza el mundial, pero solo por el desempate: nadie le saca un punto.",
    "Arriba todo sigue en tablas: {leaderAfter} manda en la general sin diferencia de puntos con su perseguidor.",
    "Foto de la general: {leaderAfter} en cabeza, aunque empatado a puntos con el segundo.",
    "{leaderAfter} se va líder por la vía del desempate, sin la menor renta en la tabla.",
  ],
  en: [
    "Meanwhile, {leaderAfter} leads the championship on countback alone: nobody is a single point behind.",
    "It's all square up top: {leaderAfter} heads the table level on points with the chaser.",
    "Standings snapshot: {leaderAfter} out front, but tied on points with second.",
    "{leaderAfter} stays top on the tiebreak only, with no points cushion at all.",
  ],
};

// Used when the leader is ahead, but by less than a single win.
const CONTRAST_SLIM_BY_LOCALE = {
  es: [
    "Mientras tanto, {leaderAfter} aguanta el liderato por la mínima: apenas {gapAfter} puntos sobre el segundo.",
    "Arriba la cosa está al rojo: {leaderAfter} manda con un frágil colchón de {gapAfter} puntos.",
    "{leaderAfter} sigue líder, pero con la respiración contenida: solo {gapAfter} puntos de margen.",
    "Foto de la general: {leaderAfter} en cabeza, con un hilo de {gapAfter} puntos sobre el perseguidor.",
  ],
  en: [
    "Meanwhile, {leaderAfter} clings to the lead by a whisker: just {gapAfter} points clear of second.",
    "It's tight at the top: {leaderAfter} leads on a fragile {gapAfter}-point cushion.",
    "{leaderAfter} stays ahead, but only just — a slim {gapAfter} points in hand.",
    "Standings snapshot: {leaderAfter} out front by a thread, {gapAfter} points up.",
  ],
};

const SCENARIO_TAGS_BY_LOCALE = {
  es: {
    dominant: "Dominio",
    upset: "Sorpresa",
    wet_master: "Lluvia",
    chaos: "Carrera rota",
    safety_car: "Coche de seguridad",
    leader_dnf: "Golpe al líder",
    comeback: "Remontada",
    streak: "Racha",
    photo_finish: "Foto finish",
    team_double: "Doblete",
    strategy: "Estrategia",
    control: "Control",
  },
  en: {
    dominant: "Domination",
    upset: "Upset",
    wet_master: "Rain",
    chaos: "Race in pieces",
    safety_car: "Safety car",
    leader_dnf: "Leader blow",
    comeback: "Comeback",
    streak: "Streak",
    photo_finish: "Photo finish",
    team_double: "1-2",
    strategy: "Strategy",
    control: "Control",
  },
};

const SEASON_INTRO_TEMPLATES = pickByLocale(SEASON_INTRO_TEMPLATES_BY_LOCALE);
const DECISIVE_MOMENTS = pickByLocale(DECISIVE_MOMENTS_BY_LOCALE);
const CATEGORY_TEMPLATES = pickByLocale(CATEGORY_TEMPLATES_BY_LOCALE);
const CONTRAST_CONNECTORS = pickByLocale(CONTRAST_CONNECTORS_BY_LOCALE);
const CONTRAST_TIED = pickByLocale(CONTRAST_TIED_BY_LOCALE);
const CONTRAST_SLIM = pickByLocale(CONTRAST_SLIM_BY_LOCALE);
const SCENARIO_TAGS = pickByLocale(SCENARIO_TAGS_BY_LOCALE);

const renderMidfieldInsight = (vars) => {
  if (!vars.midfieldDriver || !vars.midfieldTeam) {
    return "";
  }

  const position = ordinal(vars.midfieldPosition);
  const pointsText =
    vars.midfieldPoints > 0
      ? locale === "es"
        ? `sumó ${vars.midfieldPoints} ${vars.midfieldPoints === 1 ? "punto" : "puntos"}`
        : `scored ${vars.midfieldPoints} ${vars.midfieldPoints === 1 ? "point" : "points"}`
      : locale === "es"
      ? "rozó la zona de puntos"
      : "knocked on the door of the points";
  const gainText =
    vars.midfieldGain > 0
      ? locale === "es"
        ? `rindió ${vars.midfieldGain} puestos por encima de su ranking base`
        : `ran ${vars.midfieldGain} places above baseline`
      : locale === "es"
      ? "maximizó un coche de zona media"
      : "maximised a midfield car";
  const fastestLapText = vars.midfieldFastestLap
    ? locale === "es"
      ? " y además se llevó la vuelta rápida"
      : " and also took fastest lap"
    : "";

  if (locale === "es") {
    return `En la zona media, {midfieldDriver} también merece foco: terminó ${position} para {midfieldTeam}, ${pointsText} y ${gainText}${fastestLapText}.`;
  }

  return `In the midfield, {midfieldDriver} also deserves attention: ${position} for {midfieldTeam}, ${pointsText}, and ${gainText}${fastestLapText}.`;
};

const joinNames = (names) => {
  const filtered = names.filter(Boolean);
  if (filtered.length <= 1) return filtered[0] || "";
  const last = filtered[filtered.length - 1];
  const rest = filtered.slice(0, -1).join(", ");
  return locale === "es" ? `${rest} y ${last}` : `${rest} and ${last}`;
};

const describeMidfieldHighlight = (highlight) => {
  const position = ordinal(highlight.position);
  const pointsText =
    highlight.points > 0
      ? locale === "es"
        ? `${highlight.points} ${highlight.points === 1 ? "punto" : "puntos"}`
        : `${highlight.points} ${highlight.points === 1 ? "point" : "points"}`
      : locale === "es"
      ? "a las puertas de los puntos"
      : "just outside the points";
  const gain =
    highlight.overPerformance > 0
      ? `+${highlight.overPerformance}`
      : locale === "es"
      ? "coche al límite"
      : "car on the limit";
  return `${highlight.driver} (${highlight.team}) ${position}, ${pointsText}, ${gain}`;
};

const renderMidfieldInsights = (vars) => {
  const highlights = Array.isArray(vars.midfieldHighlights)
    ? vars.midfieldHighlights.filter((highlight) => highlight?.driver && highlight?.team)
    : [];

  if (!highlights.length) {
    return renderMidfieldInsight(vars);
  }

  if (highlights.length >= 2) {
    const names = joinNames(highlights.map((highlight) => highlight.driver));
    const teamSpread = new Set(highlights.map((highlight) => highlight.team)).size;
    const fastest = highlights.find((highlight) => highlight.fastestLap);
    const scoredPoints = highlights.some((highlight) => highlight.points > 0);
    const details = highlights.map(describeMidfieldHighlight).join("; ");
    const templates =
      locale === "es"
        ? scoredPoints
          ? [
              `La zona media no tuvo un solo protagonista: ${names} metieron a sus equipos en una carrera que, sobre el papel, no les pertenecía. ${details}.`,
              `Detrás del podio también hubo carrera de verdad: ${names} sostuvieron una pelea garaje contra garaje que movió el reparto fino de puntos.`,
              `La batalla secundaria fue de las que enganchan: ${names} convirtieron la zona media en una carrera dentro de la carrera, con ${teamSpread} equipos distintos sacando rendimiento real.`,
              `No todo se jugó delante: ${names} firmaron una actuación coral en la zona media y se llevaron puntos que pueden pesar más adelante.`,
            ]
          : [
              `La zona media no tuvo un solo protagonista: ${names} se enzarzaron en una pelea aparte que el podio no llegó a ver. ${details}.`,
              `Lejos de los puntos también hubo carrera: ${names} sostuvieron un duelo garaje contra garaje por el orgullo de la zona media.`,
              `La batalla secundaria fue de las que enganchan: ${names} convirtieron la zona media en una carrera dentro de la carrera, con ${teamSpread} equipos distintos peleándose cada posición.`,
              `No todo se jugó delante: ${names} firmaron una actuación coral en la zona media, sin premio en la tabla pero a cara de perro.`,
            ]
        : scoredPoints
        ? [
            `The midfield had more than one story: ${names} put their teams into a race that was not supposed to belong to them. ${details}.`,
            `Behind the podium there was a proper race too: ${names} made the midfield a garage-to-garage fight that shifted the minor scoring.`,
            `The secondary battle mattered: ${names} turned the midfield into a race within the race, with ${teamSpread} teams finding real performance.`,
            `It was not all about the front: ${names} delivered a collective midfield result that may matter later.`,
          ]
        : [
            `The midfield had more than one story: ${names} fought a separate battle the podium never saw. ${details}.`,
            `Away from the points there was a race too: ${names} traded blows garage-to-garage for midfield pride.`,
            `The secondary battle mattered: ${names} turned the midfield into a race within the race, with ${teamSpread} teams scrapping over every place.`,
            `It was not all about the front: ${names} delivered a collective midfield scrap, no reward on the table but no quarter given.`,
          ];
    const fastestTail = fastest
      ? locale === "es"
        ? ` ${fastest.driver} hasta se quedó con la vuelta rápida.`
        : ` ${fastest.driver} even took fastest lap.`
      : "";
    return `${pickFromBank(templates, vars.rng || Math.random)}${fastestTail}`;
  }

  const highlight = highlights[0];
  const position = ordinal(highlight.position);
  const pointsText =
    highlight.points > 0
      ? locale === "es"
        ? `sumó ${highlight.points} ${highlight.points === 1 ? "punto" : "puntos"}`
        : `scored ${highlight.points} ${highlight.points === 1 ? "point" : "points"}`
      : locale === "es"
      ? "se quedó a las puertas de los puntos"
      : "knocked on the door of the points";
  const gainText =
    highlight.overPerformance > 0
      ? locale === "es"
        ? `ganó ${highlight.overPerformance} posiciones respecto a lo que dictaba su coche`
        : `ran ${highlight.overPerformance} places above expectation`
      : locale === "es"
      ? "exprimió hasta la última gota un coche de zona media"
      : "maximised a midfield car";
  const strategyText = highlight.strategy
    ? locale === "es"
      ? ` apoyado en ${highlight.strategy}`
      : ` on ${highlight.strategy}`
    : "";
  const fastestLapText = highlight.fastestLap
    ? locale === "es"
      ? " y, de propina, la vuelta rápida"
      : " and also took fastest lap"
    : "";
  const templates =
    locale === "es"
      ? [
          `${highlight.driver} también firmó una carrera seria para ${highlight.team}: ${position}, ${pointsText}, ${gainText}${strategyText}${fastestLapText}.`,
          `En la pelea menos televisada, ${highlight.driver} colocó a ${highlight.team} donde nadie le esperaba: ${position}, ${pointsText} y una ejecución impecable${fastestLapText}.`,
          `${highlight.team} respiró gracias a ${highlight.driver}: acabó ${position}, ${pointsText} y aguantó ritmo de puntos cuando la carrera se rompía por delante.`,
          `El nombre de la zona media fue ${highlight.driver}: lejos de las cámaras, terminó ${position} y ${pointsText}, con una lectura de carrera muy por encima de su coche.`,
        ]
      : [
          `${highlight.driver} also delivered a serious race for ${highlight.team}: ${position}, ${pointsText}, ${gainText}${strategyText}${fastestLapText}.`,
          `In the less visible fight, ${highlight.driver} put ${highlight.team} somewhere unexpected: ${position}, ${pointsText}, clean execution${fastestLapText}.`,
          `${highlight.team} found oxygen through ${highlight.driver}: ${position}, ${pointsText}, and points-level pace when the race broke ahead.`,
          `The midfield standout was ${highlight.driver}: away from the cameras, ${position}, ${pointsText}, and a race read above the car.`,
        ];

  return pickFromBank(templates, vars.rng || Math.random);
};

const renderChampionshipInsight = (vars) => {
  const contenders = Array.isArray(vars.titleContenders) ? vars.titleContenders : [];
  const rng = vars.rng || Math.random;
  const round = vars.round || 0;
  const raceCount = vars.raceCount || 0;
  const progress = raceCount > 1 ? (round - 1) / (raceCount - 1) : 0;
  // Very start of the year: nothing has settled yet, so don't pretend there is
  // an established storyline or "plot twists" to read.
  const earlyPhase = round > 0 && (round <= 2 || progress < 0.15);
  const names4 = joinNames(contenders.slice(0, 4).map((row) => row.name));
  const names3 = joinNames(contenders.slice(0, 3).map((row) => row.name));

  if (locale === "es") {
    if (vars.seasonArc === "driver_domination" && vars.leaderAfter && vars.gapAfter >= 35) {
      return `${vars.leaderAfter} está convirtiendo el mundial en una demolición: la ventaja ya no parece coyuntural, parece estructura.`;
    }
    if (vars.seasonArc === "team_domination" && vars.dominantTeam) {
      return `${vars.dominantTeam} juega a otro campeonato: gane quien gane dentro del equipo, casi siempre hay dos coches suyos en la zona noble.`;
    }
    if (vars.seasonArc === "cross_team_duel" && !earlyPhase && contenders.length >= 2) {
      return `${contenders[0].name} y ${contenders[1].name} siguen enzarzados en un duelo entre equipos distintos en el que cada victoria mueve el centro de gravedad del título.`;
    }
    if (vars.seasonArc === "intra_team_duel" && !earlyPhase && contenders.length >= 2) {
      return `La tensión gorda vive dentro del mismo garaje: ${contenders[0].name} y ${contenders[1].name} comparten equipo, pero ni un milímetro de margen de error.`;
    }
    if (vars.seasonArc === "streak_breakaway" && vars.leaderAfter && vars.gapAfter >= 25) {
      return `${vars.leaderAfter} ha convertido un mano a mano en una escapada: la racha ya pesa más que la igualdad de los primeros grandes premios.`;
    }
    if (earlyPhase && contenders.length >= 3) {
      return pickFromBank(
        [
          `Demasiado pronto para sacar conclusiones: con tan pocas carreras disputadas, ${names4} siguen apelotonados en lo más alto.`,
          `El campeonato apenas ha echado a rodar y ${names4} comparten la zona noble; aún no ha dado tiempo a que nadie marque distancias.`,
          `Todavía no hay patrón que leer: la tabla está casi en blanco y ${names4} arrancan prácticamente empatados.`,
          `Es solo el arranque del año, así que toca prudencia: ${names4} encabezan un mundial que aún no ha enseñado sus cartas.`,
          `Primeras citas, primeras impresiones: ${names4} mandan de momento, pero es pronto para fiarse de nada.`,
        ],
        rng
      );
    }
    if (contenders.length >= 4) {
      return pickFromBank(
        [
          `El título sigue en el aire: ${names4} llegan vivos a esta altura de temporada y ninguno termina de imponerse.`,
          `Nadie consigue escaparse: ${names4} mantienen un pulso a varias bandas que cambia de líder casi cada fin de semana.`,
          `La corona no tiene dueño: ${names4} siguen dentro y cada carrera vuelve a barajar el orden.`,
          `Cuatro en danza por el cetro: ${names4} se niegan a soltar el grupo de cabeza.`,
          `El mundial se mantiene abierto de verdad: la distancia entre ${names4} cabe en una sola tarde mala.`,
          `Pelea de altura por el campeonato: ${names4} se reparten las opciones y obligan a recalcular tras cada bandera a cuadros.`,
        ],
        rng
      );
    }
    if (contenders.length === 3) {
      return pickFromBank(
        [
          `Ya no es un duelo a dos: ${contenders[2].name} se ha metido como tercer candidato y obliga a rehacer todos los cálculos.`,
          `El título es cosa de tres: ${names3} se reparten las opciones reales con la temporada avanzada.`,
          `Aparece un tercero en discordia: ${contenders[2].name} mete presión a los dos de delante y reabre el campeonato.`,
          `Tres pretendientes para una sola corona: ${names3} mantienen la pelea encendida hasta nuevo aviso.`,
        ],
        rng
      );
    }
    return "";
  }

  if (vars.seasonArc === "driver_domination" && vars.leaderAfter && vars.gapAfter >= 35) {
    return `${vars.leaderAfter} is turning the championship into a demolition job: the gap no longer looks circumstantial.`;
  }
  if (vars.seasonArc === "team_domination" && vars.dominantTeam) {
    return `${vars.dominantTeam} are running a different championship: whoever wins inside the team, they almost always have two cars near the front.`;
  }
  if (vars.seasonArc === "cross_team_duel" && !earlyPhase && contenders.length >= 2) {
    return `${contenders[0].name} and ${contenders[1].name} remain locked in a cross-team duel where every win shifts the title's centre of gravity.`;
  }
  if (vars.seasonArc === "intra_team_duel" && !earlyPhase && contenders.length >= 2) {
    return `The main tension sits inside one garage: ${contenders[0].name} and ${contenders[1].name} share a team, not margin for error.`;
  }
  if (vars.seasonArc === "streak_breakaway" && vars.leaderAfter && vars.gapAfter >= 25) {
    return `${vars.leaderAfter} has turned a direct duel into a breakaway: the streak now matters more than the early balance.`;
  }
  if (earlyPhase && contenders.length >= 3) {
    return pickFromBank(
      [
        `Far too early to read anything into it: with so few races run, ${names4} are still bunched at the top.`,
        `The season has barely started and ${names4} share the front; nobody has had time to pull clear yet.`,
        `No pattern to read just yet: the table is almost blank and ${names4} are level on next to nothing.`,
        `It is only the opening stretch, so caution: ${names4} lead a championship that hasn't shown its hand.`,
        `Early rounds, early impressions: ${names4} set the early pace, but it is far too soon to trust it.`,
      ],
      rng
    );
  }
  if (contenders.length >= 4) {
    return pickFromBank(
      [
        `The title is still up for grabs: ${names4} are all alive this deep into the year and none can shake the rest.`,
        `Nobody can break clear: ${names4} keep a multi-way fight that swaps leader almost every weekend.`,
        `The crown has no owner: ${names4} remain in it and every race reshuffles the order.`,
        `Four in the dance for the title: ${names4} refuse to let the front group go.`,
        `The championship stays genuinely open: the gap between ${names4} fits inside a single bad afternoon.`,
        `A heavyweight title scrap: ${names4} share the odds and force a recalculation after every chequered flag.`,
      ],
      rng
    );
  }
  if (contenders.length === 3) {
    return pickFromBank(
      [
        `No longer a simple duel: ${contenders[2].name} has arrived as a third title candidate and rewrites the maths.`,
        `The title is now a three-way affair: ${names3} share the real odds with the season well advanced.`,
        `A third name gatecrashes the fight: ${contenders[2].name} piles pressure on the front two and reopens it.`,
        `Three suitors for one crown: ${names3} keep the fight alight until further notice.`,
      ],
      rng
    );
  }
  return "";
};

const renderRaceInsight = (scenario, vars) => {
  const rng = vars.rng || Math.random;
  const facts = [];

  if (vars.winnerStrategy) {
    const purePace = vars.winnerStrategyCode === "pure_pace";
    facts.push(
      pickFromBank(
        locale === "es"
          ? purePace
            ? [
                `Aquí no hubo pizarra que valiera: el hueco se abrió a base de ritmo puro, vuelta tras vuelta.`,
                `Sin artificios en boxes ni jugadas de estrategia: mandó la velocidad pura y dura.`,
                `Nada de overcuts ni undercuts; la diferencia la marcó el cronómetro, sin más.`,
              ]
            : [
                `Y todo se apoyó en una palanca clara: la estrategia de ${vars.winnerStrategy}, ejecutada sin un solo titubeo.`,
                `La carta de ${vars.winnerStrategy} fue la que terminó marcando la diferencia en el muro.`,
                `Por encima del ritmo puro, fue la estrategia de ${vars.winnerStrategy} la que abrió el hueco definitivo.`,
              ]
          : purePace
          ? [
              `No pit-wall games here: the gap opened on raw pace, lap after lap.`,
              `No undercuts, no overcuts — sheer speed did all the talking.`,
              `Nothing clever in the strategy; the stopwatch settled it on pace alone.`,
            ]
          : [
              `And it all hinged on one clear lever: the ${vars.winnerStrategy} strategy, executed without a flinch.`,
              `The ${vars.winnerStrategy} call was the one that made the difference on the pit wall.`,
              `Beyond raw pace, it was the ${vars.winnerStrategy} strategy that cracked the race open.`,
            ],
        rng
      )
    );
  }

  if (vars.winnerBaseRank && vars.winnerBaseRank > 8) {
    facts.push(
      pickFromBank(
        locale === "es"
          ? [
              `Nadie lo tenía en la quiniela: {winner} arrancaba con galones de candidato de segunda fila.`,
              `Que ganara {winner}, con su perfil de partida, no entraba en ningún pronóstico sensato.`,
              `{winner} llegaba como outsider, lejos del foco de los favoritos, y aun así mandó.`,
            ]
          : [
              `Nobody saw it coming: {winner} started with the profile of a second-row outsider.`,
              `{winner} winning, given the starting form, was in nobody's sensible forecast.`,
              `{winner} came in as an outsider, well off the favourites' radar, and still ran the show.`,
            ],
        rng
      )
    );
  }

  if (vars.fastestLapDriver) {
    const fastestLapIsWinner = vars.fastestLapDriver === vars.winner;
    facts.push(
      pickFromBank(
        locale === "es"
          ? fastestLapIsWinner
            ? [
                `Y por si fuera poco, {winner} se llevó también la vuelta rápida.`,
                `Para cerrar el día redondo, suya fue además la vuelta rápida.`,
                `Remató la faena firmando encima la vuelta rápida.`,
              ]
            : [
                `Como nota al margen, la vuelta rápida se la quedó {fastestLapDriver}.`,
                `El punto extra de la vuelta rápida cayó del lado de {fastestLapDriver}.`,
                `{fastestLapDriver} se llevó al menos el premio de la vuelta rápida.`,
              ]
          : fastestLapIsWinner
          ? [
              `And for good measure, {winner} grabbed the fastest lap too.`,
              `Fastest lap as well — the cherry on a flawless afternoon.`,
              `The fastest lap went their way too, rounding off the perfect day.`,
            ]
          : [
              `As a footnote, fastest lap went the way of {fastestLapDriver}.`,
              `The bonus point for fastest lap landed with {fastestLapDriver}.`,
              `{fastestLapDriver} took at least the fastest-lap point.`,
            ],
        rng
      )
    );
  }

  if (vars.dnfCount >= 3) {
    facts.push(
      pickFromBank(
        locale === "es"
          ? [
              `Con ${vars.dnfCount} coches en el muro, la parrilla de meta poco tuvo que ver con la de salida.`,
              `${vars.dnfCount} abandonos dinamitaron por completo el orden natural de la carrera.`,
              `${vars.dnfCount} retiradas reescribieron la clasificación sobre la marcha.`,
            ]
          : [
              `With ${vars.dnfCount} cars in the barriers, the finishing order had little to do with the grid.`,
              `${vars.dnfCount} retirements blew the natural running order apart.`,
              `${vars.dnfCount} cars out rewrote the order on the fly.`,
            ],
        rng
      )
    );
  } else if (vars.safetyCar) {
    facts.push(
      pickFromBank(
        locale === "es"
          ? [
              "Un coche de seguridad reseteó los relojes y reabrió una carrera que parecía sentenciada.",
              "El coche de seguridad volvió a barajar el mazo justo cuando todo parecía decidido.",
            ]
          : [
              "A safety car reset the clocks and reopened a race that looked done.",
              "The safety car shuffled the deck again just as everything seemed settled.",
            ],
        rng
      )
    );
  }

  const midfield = renderMidfieldInsights(vars);
  const championship = renderChampionshipInsight(vars);
  const factualTail = facts.join(" ");

  const scenarioTail =
    scenario === "leader_dnf" && vars.leaderAfter
      ? locale === "es"
        ? "El abandono del líder no solo repartió la victoria: comprimió de golpe toda la pelea por el título."
        : "The leader's retirement didn't just hand out the win; it squeezed the whole title fight shut."
      : scenario === "team_double"
      ? locale === "es"
        ? "Un doblete que engorda a la vez el mundial de pilotos y el de constructores."
        : "A one-two that fattens both the drivers' and the constructors' tables at once."
      : "";

  return [factualTail, scenarioTail, championship, midfield].filter(Boolean).join(" ");
};

export const classifyRaceScenario = ({
  winner,
  podium,
  dnfList,
  leaderBefore,
  driverStreak,
  teamStreak,
  gapBefore,
  gapAfter,
  conditions,
  profile,
  previousWinner,
  previousTeamWinner,
}) => {
  const sameTeamPodium = podium.length >= 2 && podium[0].team.name === podium[1].team.name;
  const leaderDnf = leaderBefore && dnfList.some((entry) => entry.id === leaderBefore.id);

  const STRATEGY_TAG_CODES = new Set(["undercut", "early_inter", "tyre_mgmt"]);

  if (leaderDnf) return "leader_dnf";
  if (conditions.weatherCode && conditions.weatherCode !== "dry") return "wet_master";
  if (dnfList.length >= 4 || (profile.chaos > 0.55 && dnfList.length >= 3)) return "chaos";
  if (conditions.safetyCar && Math.abs(gapAfter - gapBefore) >= 6) return "safety_car";
  if (driverStreak >= 3 || teamStreak >= 4) return "streak";
  if (winner.performanceRank > 8 || winner.baseRank > 10) return "upset";
  if (sameTeamPodium && podium[0].position === 1) return "team_double";
  if (winner.strategy && STRATEGY_TAG_CODES.has(winner.strategy.code)) return "strategy";
  if (previousWinner && previousWinner !== winner.driver.name && Math.abs(gapAfter - gapBefore) >= 12) return "comeback";
  if (winner.baseRank >= 5 && winner.baseRank <= 10) return "comeback";
  if (profile.chaos > 0.5 && winner.performanceRank <= 3) return "photo_finish";
  return "control";
};

export const pickDecisiveMoment = (scenario, rng) => {
  const directBank = DECISIVE_MOMENTS[scenario];
  if (directBank && directBank.length) return pickFromBank(directBank, rng);
  if (scenario === "team_double") return pickFromBank(DECISIVE_MOMENTS.team_double, rng);
  if (scenario === "strategy") return pickFromBank(DECISIVE_MOMENTS.strategy, rng);
  if (scenario === "streak") return pickFromBank(DECISIVE_MOMENTS.streak, rng);
  if (scenario === "comeback") return pickFromBank(DECISIVE_MOMENTS.comeback, rng);
  if (scenario === "wet_master") return pickFromBank(DECISIVE_MOMENTS.wet, rng);
  if (scenario === "photo_finish") return pickFromBank(DECISIVE_MOMENTS.photo_finish, rng);
  return pickFromBank(DECISIVE_MOMENTS.control, rng);
};

export const renderRaceNarrative = ({
  scenario,
  vars,
  rng,
  withContrast = true,
}) => {
  const templates = CATEGORY_TEMPLATES[scenario] || CATEGORY_TEMPLATES.control;
  const baseTemplate = pickFromBank(templates, rng);
  let text = fillTemplate(baseTemplate, vars);
  const insight = fillTemplate(renderRaceInsight(scenario, { ...vars, rng }), vars);
  if (insight) {
    text = `${text} ${insight}`;
  }
  if (withContrast && vars.leaderAfter) {
    const gap = Number(vars.gapAfter) || 0;
    const bank = gap === 0 ? CONTRAST_TIED : gap <= 6 ? CONTRAST_SLIM : CONTRAST_CONNECTORS;
    const tail = fillTemplate(pickFromBank(bank, rng), vars);
    text = `${text} ${tail}`;
  }
  return {
    tag: SCENARIO_TAGS[scenario] || SCENARIO_TAGS.control,
    text,
  };
};

export const renderChampionTitle = ({ champion, team, year, racesToSpare = 0, points = 0, wins = 0, rng }) => {
  if (!champion) return "";
  const pick = rng || Math.random;
  const winsText =
    locale === "es"
      ? `${wins} ${wins === 1 ? "victoria" : "victorias"}`
      : `${wins} ${wins === 1 ? "win" : "wins"}`;
  const when =
    racesToSpare > 0
      ? locale === "es"
        ? `a falta de ${racesToSpare} ${racesToSpare === 1 ? "carrera" : "carreras"}`
        : `with ${racesToSpare} ${racesToSpare === 1 ? "race" : "races"} to spare`
      : locale === "es"
      ? "en la última cita del año"
      : "in the final round of the year";

  const templates =
    locale === "es"
      ? [
          `Y con esto, hay campeón del mundo: ${champion} se proclama campeón ${year} ${when}, coronando con ${team} una temporada de ${winsText}.`,
          `Cae el telón sobre el título: ${champion} amarra matemáticamente el Mundial ${year} ${when}, y lo firma con ${points} puntos en el casillero.`,
          `Misión cumplida para ${champion}: el Mundial ${year} ya lleva su nombre, sellado ${when} al volante de ${team}.`,
          `No hará falta esperar más: ${champion} es campeón del mundo ${year}, con la corona atada ${when} y ${winsText} en la mochila.`,
          `Se acabó la pelea por el cetro: ${champion} conquista para ${team} el Mundial ${year} ${when}, premio a una campaña de ${points} puntos.`,
        ]
      : [
          `And there it is — a world champion: ${champion} is crowned ${year} champion ${when}, capping a ${winsText} season with ${team}.`,
          `The title curtain falls: ${champion} clinches the ${year} World Championship ${when}, sealing it with ${points} points on the board.`,
          `Mission accomplished for ${champion}: the ${year} crown now carries their name, secured ${when} at the wheel of ${team}.`,
          `No need to wait any longer: ${champion} is ${year} world champion, the title locked up ${when} with ${winsText} in the bag.`,
          `The fight for the crown is over: ${champion} takes the ${year} World Championship for ${team} ${when}, reward for a ${points}-point campaign.`,
        ];

  return pickFromBank(templates, pick);
};

export const renderSeasonIntro = ({ year, teamCount, driverCount, raceCount, rng, arcLabel }) => {
  const template = pickFromBank(SEASON_INTRO_TEMPLATES, rng);
  const arcTail = arcLabel
    ? locale === "es"
      ? ` El pulso previsto: ${arcLabel}.`
      : ` Expected storyline: ${arcLabel}.`
    : "";
  return `${fillTemplate(template, { year, teamCount, driverCount, raceCount })}${arcTail}`;
};

export const renderLastRacePreview = ({ race, contenders, maxPoints, constructorsLeader, arc, rng }) => {
  const titleNames = joinNames(contenders.map((row) => row.name));
  const leader = contenders[0];
  const chasers = contenders.slice(1);
  const chaserNames = joinNames(chasers.map((row) => row.name));
  const templates =
    locale === "es"
      ? contenders.length >= 5
        ? [
            `Última carrera en {race} con cinco pilotos vivos. {titleNames} llegan tan apretados que la distancia cabe dentro de una sola victoria de {maxPoints} puntos: aquí no vale la calculadora, solo la ejecución.`,
            `{race} decide un mundial salvaje: cinco nombres con opciones reales —{titleNames}— y un simple coche de seguridad bastaría para cambiar al campeón.`,
          ]
        : contenders.length === 4
        ? [
            `Final a cuatro en {race}. {titleNames} aún pueden levantar la corona; {leader} defiende la ventaja, pero {chaserNames} llegan con margen para convertir una carrera normal en un terremoto.`,
            `El campeonato entra en {race} sin dueño: cuatro pilotos siguen con vida y la presión no recae solo sobre el líder.`,
          ]
        : contenders.length === 3
        ? [
            `{race} abre una última batalla a tres. {leader} llega por delante, pero {chaserNames} tienen puntos de sobra para darle la vuelta a todo si la carrera se rompe.`,
            `Tres pilotos, una sola corona. En {race}, {leader} necesita controlar los daños; {chaserNames} necesitan transformar el ritmo en golpe definitivo.`,
          ]
        : [
            `El mundial se decide en {race}: {leader} contra {chaserNames}. La distancia cabe dentro de una victoria de {maxPoints} puntos y cada parada puede valer un título o una derrota.`,
            `{race} acoge el duelo final. {leader} parte con ventaja; {chaserNames} llega obligado a atacar desde la primera ventana de boxes.`,
          ]
      : contenders.length >= 5
      ? [
          `Final race at {race} with five drivers alive. {titleNames} are within a {maxPoints}-point win: no safe calculator, only execution.`,
          `{race} decides a wild championship: five real contenders, {titleNames}, and any safety car can change the champion.`,
        ]
      : contenders.length === 4
      ? [
          `Four-way finale at {race}. {titleNames} can still be champion; {leader} defends the lead, but {chaserNames} can still turn a normal race into an earthquake.`,
          `The championship enters {race} ownerless: four drivers remain alive and the pressure is not only on the leader.`,
        ]
      : contenders.length === 3
      ? [
          `{race} opens a final three-way fight. {leader} arrives ahead, but {chaserNames} have enough points to flip it if the race breaks open.`,
          `Three drivers, one crown. At {race}, {leader} needs damage limitation; {chaserNames} need to turn pace into the decisive blow.`,
        ]
      : [
          `The title is decided at {race}: {leader} versus {chaserNames}. The gap fits inside a {maxPoints}-point win and every stop can mean title or defeat.`,
          `{race} hosts the final duel. {leader} starts ahead, {chaserNames} has to attack from the first pit window.`,
        ];
  const constructorsText = constructorsLeader
    ? locale === "es"
      ? ` En constructores, ${constructorsLeader.name} llega como referencia del garaje.`
      : ` In constructors, ${constructorsLeader.name} arrives as the garage benchmark.`
    : "";
  const arcText =
    arc?.type === "team_domination"
      ? locale === "es"
        ? " Si el equipo dominante vuelve a hacer primero y segundo, el resto necesita una carrera imperfecta."
        : " If the dominant team goes one-two again, everyone else needs an imperfect race."
      : "";
  return (
    fillTemplate(pickFromBank(templates, rng), {
      race,
      titleNames,
      leader: leader?.name || "",
      chaserNames,
      maxPoints,
    }) + constructorsText + arcText
  );
};
