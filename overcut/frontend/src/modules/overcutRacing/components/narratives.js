import { locale } from "./i18n";

const fillTemplate = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (match, key) => (vars[key] != null ? String(vars[key]) : match));

const pickFromBank = (bank, rng) => {
  if (!bank || !bank.length) return "";
  return bank[Math.floor(rng() * bank.length)];
};

const pickByLocale = (bankByLocale) => bankByLocale[locale] || bankByLocale.es;

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
      "Pole, vuelta rápida y victoria en pista limpia, sin un solo error.",
      "Marcó el tono en la primera vuelta y no soltó el liderato hasta meta.",
      "Ningún rival pudo acercarse a tres décimas durante toda la carrera.",
      "Convirtió el trazado en un Gran Premio a un coche: diferencia desde la salida.",
      "Pista limpia tras las paradas y un margen invencible al final.",
      "Ritmo de manual con vueltas rápidas selladas en cada relanzamiento.",
      "Defensa tranquila, ataque medido, victoria con espacio de sobra.",
    ],
    upset: [
      "Un undercut imposible cambió la carrera en una sola vuelta.",
      "Aguantó tres ataques en la última vuelta para llevarse el triunfo.",
      "Subió desde la sexta fila a un fin de semana de leyenda.",
      "Su ritmo en los stints largos descolocó a los favoritos.",
      "Compromisos de neumáticos arriesgados que salieron perfectos.",
      "Aprovechó cada error ajeno con frialdad de veterano.",
      "Su pit-stop fue cuatro décimas más rápido de lo que cualquiera podía pedirle.",
    ],
    chaos: [
      "Tres coches fuera en diez vueltas reescribieron la clasificación.",
      "Salieron pancartas y banderas amarillas en el peor momento para los líderes.",
      "Cuando reventó la suspensión del favorito, la carrera quedó decidida.",
      "Choque múltiple en el inicio que abrió hueco para el resto del pelotón.",
      "Una segunda salida con caos repartió cartas nuevas a media carrera.",
    ],
    safety_car: [
      "El safety car neutralizó la ventaja construida durante toda la carrera.",
      "Una salida tras safety car decidió quién pasaba por boxes con tiempo libre.",
      "El re-arranque a falta de quince vueltas repartió cartas nuevas.",
      "La banda amarilla tardía hizo de la estrategia un juego de tirar la moneda.",
    ],
    wet: [
      "En la transición de seco a mojado se separó al ganador del resto.",
      "La elección de intermedios tres vueltas antes que el rival fue letal.",
      "Bajo la lluvia, la muñeca del ganador volvió a marcar diferencia.",
      "Un cambio brusco del tiempo descolocó a quienes esperaron una vuelta más.",
      "Diluvio inesperado: solo los que se atrevieron a cambiar a tiempo sobrevivieron.",
    ],
    leader_dnf: [
      "El abandono del líder del campeonato cambió el rumbo del mundial.",
      "El motor del entonces líder dijo basta a falta de doce vueltas.",
      "Una rotura de transmisión arruinó el guion del puntero de la tabla.",
      "El golpe en boxes del piloto top sacrificó la carrera y abrió la puerta a un nuevo rey.",
    ],
    comeback: [
      "Desde sexta posición trazó una de las remontadas del año.",
      "Tres adelantamientos en cinco vueltas pusieron la victoria a tiro.",
      "Convirtió un paso por pit lane lento en una clase de gestión de ritmo.",
      "Volvió desde fuera de los puntos a podio en quince vueltas eléctricas.",
    ],
    tyre: [
      "La gestión de la degradación marcó el resultado en los últimos veinte giros.",
      "Un stint medio-medio decisivo desnudó al rival a falta de seis vueltas.",
      "Estiró el primer juego diez vueltas más que cualquiera y eso bastó.",
    ],
    control: [
      "Posición en pista guardada con ritmo de control en cada fase.",
      "Defensa tranquila desde la salida hasta la última curva.",
      "Sin sobresaltos, sin riesgos, sin necesidad de exhibir más de la cuenta.",
    ],
    photo_finish: [
      "Última vuelta a degollar: dos décimas separaron oro y plata.",
      "La curva final escribió la victoria por menos de medio coche.",
      "Foto de meta, cronómetro decidiendo y un suspiro de paddock al confirmar el orden.",
    ],
    team_double: [
      "Doblete de la escudería con un ritmo simbiótico de los dos coches.",
      "Los dos pilotos del equipo gestionaron el cierre como uno solo.",
      "Strategia de equipo perfectamente sincronizada para amarrar 1-2.",
    ],
    strategy: [
      "El overcut en la primera ronda de paradas fue el golpe definitivo.",
      "Pasar a una parada cuando todos iban a dos descolocó al ganador anterior.",
      "El segundo juego de duros estiró hasta extremos imposibles.",
      "Stop&go fingido de los rivales se convirtió en ventaja real para el campeón del día.",
    ],
    streak: [
      "La racha continúa y el dominio empieza a parecer ley.",
      "Una secuencia que aplana el campeonato y obliga a redefinir favoritos.",
      "Cada Gran Premio se convierte en un capítulo más de la misma historia.",
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
      "Pole, fastest lap and a flawless win on a clear track.",
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
      "The safety car wiped out the gap built over the whole race.",
      "A restart behind the safety car decided who got a free pit stop.",
      "The relaunch fifteen laps from home reshuffled the deck.",
      "The late yellow flag turned strategy into a coin toss.",
    ],
    wet: [
      "The crossover from dry to wet separated the winner from the rest.",
      "Switching to inters three laps before the rivals was lethal.",
      "Under the rain, the winner's wrist made the difference once again.",
      "A sudden weather swing caught out anyone who waited one more lap.",
      "Unexpected downpour: only those bold enough to box on time survived.",
    ],
    leader_dnf: [
      "The championship leader's retirement reshaped the title race.",
      "The leader's engine cried enough with twelve laps to go.",
      "A driveline failure ruined the script of the man at the front of the table.",
      "A pit-lane incident for the top driver opened the door for a new king.",
    ],
    comeback: [
      "From sixth place, one of the year's great comebacks.",
      "Three passes in five laps put the win in range.",
      "Turned a slow pit stop into a masterclass in pace management.",
      "Climbed from outside the points to the podium in fifteen electric laps.",
    ],
    tyre: [
      "Tyre management decided the result in the final twenty laps.",
      "A decisive medium-medium stint exposed the rival with six laps left.",
      "Stretched the first set ten laps further than anyone, and that was enough.",
    ],
    control: [
      "Track position guarded with controlled pace in every phase.",
      "Calm defence from the lights to the final corner.",
      "No drama, no risks, no need to show more than necessary.",
    ],
    photo_finish: [
      "Last lap to the wire: two tenths between gold and silver.",
      "The final corner wrote the win by less than half a car.",
      "Photo finish, stopwatch deciding and a paddock-wide sigh when the order was confirmed.",
    ],
    team_double: [
      "Team double with the two cars working as one.",
      "Both team drivers managed the finish like a single act.",
      "Team strategy perfectly synced to lock in the 1-2.",
    ],
    strategy: [
      "The overcut at the first pit window was the decisive blow.",
      "Switching to one stop while everyone else went for two caught the previous winner off guard.",
      "The second set of hards was stretched to impossible lengths.",
      "Rivals' fake stop-and-go became real advantage for the winner of the day.",
    ],
    streak: [
      "The streak continues and the dominance starts to look like law.",
      "A run that flattens the championship and forces a rethink of the favourites.",
      "Every grand prix becomes another chapter of the same story.",
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
      "Recital de {winner} en {race}. {team} firma una victoria sin oposición real. {decisive}",
      "{race}: {winner} sale, lidera y gana sin un solo titular incómodo para {team}. {decisive}",
      "Pista propia para {winner} en {race}. {team} pasea por la cuadrícula. {decisive}",
      "Sin sorpresas en {race}: {winner} convierte la pole en victoria como dictaba el guion. {decisive}",
      "Clase magistral de {winner} en {race}: {team} se va con la victoria y la vuelta rápida. {decisive}",
      "{race} cae del lado lógico: {winner} para {team}, en el final del día sigue todo como debía. {decisive}",
      "Dominio puro de {winner} en {race}. {team} maneja el escaparate de {weather} sin un solo paso en falso. {decisive}",
      "{race} sin emoción al frente: {winner} controla todos los relojes y entrega a {team} otra victoria cómoda. {decisive}",
      "Cátedra de {winner} en {race}. {team} ejecuta una carrera de manual y se lleva todo en juego. {decisive}",
      "{race}: máximo control del binomio {winner} / {team}, sin un solo momento de duda durante 305 km. {decisive}",
      "Lección de paddock en {race}: {winner} marca ritmo, neumático y línea. {decisive}",
      "{winner} encadena vuelta perfecta tras vuelta perfecta en {race} para regalarle a {team} un triunfo de manual. {decisive}",
    ],
    upset: [
      "Sorpresa mayúscula en {race}: {winner} arrebata la victoria desde fuera del grupo favorito. {decisive}",
      "{race} se cae del lado imprevisto. {winner} regala a {team} un triunfo que pocos imaginaban en clasificación. {decisive}",
      "Bombazo en {race}: {winner} convierte la carrera en pintada propia y deja a los favoritos sin respuesta. {decisive}",
      "{race} entrega un giro inesperado: {winner} aparece donde nadie le esperaba y se lleva la victoria para {team}. {decisive}",
      "Resultado inédito en {race}. {winner} y {team} firman un capítulo digno de antología del mundial. {decisive}",
      "Carrera de cuento de hadas en {race}: {winner} cruza la línea primero contra todo pronóstico. {decisive}",
      "Nadie tenía en su quiniela a {winner} ganando {race}; lo hizo, y con margen para hacerlo otra vez. {decisive}",
      "{race} se reescribe por completo. {winner} aprovecha cada apertura y entrega a {team} un sorpresón. {decisive}",
      "Cambio de actores en {race}: {winner} se sube al escenario principal y firma el triunfo más improbable de la temporada. {decisive}",
      "Cuando todos miraban a otros, {winner} colocó a {team} en lo más alto de {race}. {decisive}",
      "{race} para {winner} y para {team}: una victoria de pizarra que vuela todo lo previsto. {decisive}",
    ],
    wet_master: [
      "Carrera de los valientes en {race}. {winner} domina la lluvia y le entrega a {team} una victoria épica. {decisive}",
      "Diluvio en {race}, exhibición de {winner}: {team} se lleva un triunfo bajo el agua que vale por dos. {decisive}",
      "{race} se transforma con la lluvia y {winner} demuestra por qué su muñeca es de las mejores del paddock. {decisive}",
      "Pasarela acuática en {race}. {winner} firma vueltas que parecían imposibles y {team} se queda con el botín. {decisive}",
      "Carrera anfibia en {race}: {winner} elige momento e intermedios y le da a {team} un trofeo de leyenda. {decisive}",
      "Lluvia, niebla y {winner}. {team} se llevó un Gran Premio en condiciones que muy pocos disfrutaron en {race}. {decisive}",
      "El cielo se desplomó sobre {race} y {winner} respondió con una clase de manejo de neumático mojado. {decisive}",
      "{winner} hizo de {race} su pintura particular. {team} gana en una carrera de las que se ven una vez por temporada. {decisive}",
      "Diluvio bíblico en {race}: {winner} y {team} construyen una victoria que ya forma parte del folclore del campeonato. {decisive}",
      "Bailando bajo la lluvia: {winner} pone a {team} en lo más alto en una de las grandes carreras del año en {race}. {decisive}",
    ],
    chaos: [
      "Caos absoluto en {race}: tres coches fuera y {winner} aparece para llevarse la victoria por {team}. {decisive}",
      "{race} se rompe en pedazos. Mientras los favoritos se quedan tirados, {winner} hace su carrera y entrega a {team} el botín completo. {decisive}",
      "Carrera demolida en {race}. {winner} sobrevive, ejecuta y firma un triunfo para {team}. {decisive}",
      "Hecatombe mecánica en {race}: muchos coches fuera, {winner} de pie. {team} se lleva la única consistencia del día. {decisive}",
      "Carambolas, banderas amarillas y {winner} al frente. {race} entrega a {team} la victoria a base de mantenerse entero. {decisive}",
      "Escenas de circo en {race}. {winner} guarda la calma, esquiva la guerra y firma un triunfo de oficio para {team}. {decisive}",
      "Una de las carreras más rotas del año en {race}. {winner} mantiene el coche entero y se va con todos los puntos. {decisive}",
      "Bandera roja, recapitulación, reinicio y {winner} arriba. {team} no se mete en líos en {race}. {decisive}",
      "{race} fue un juego de supervivencia. {winner} jugó mejor que nadie y le regaló a {team} 25 puntos de oro. {decisive}",
    ],
    safety_car: [
      "El safety car decidió {race}. {winner} aprovechó el reinicio y le entregó a {team} una victoria táctica. {decisive}",
      "{race} cambió tras el safety car. {winner} respondió mejor que nadie y {team} se llevó el día. {decisive}",
      "Ventaja borrada por el safety car en {race}, pero {winner} reconstruyó la diferencia y {team} firmó la victoria. {decisive}",
      "Coche de seguridad en el momento más caliente de {race}: {winner} respondió, {team} celebró. {decisive}",
      "{winner} dijo gracias al safety car en {race} y le regaló a {team} una victoria que parecía cuesta arriba. {decisive}",
      "Carrera reseteada por el safety car, victoria reconstruida por {winner}. {team} suma fuerte en {race}. {decisive}",
      "La neutralización tardía en {race} ofreció una baraja nueva y {winner} barajó mejor que nadie. {decisive}",
      "Reinicio caliente en {race}: {winner} ejecutó como un veterano y {team} recogió las recompensas. {decisive}",
      "Un safety car a falta de quince vueltas comprimió el grupo en {race} y {winner} respondió con un ataque inmediato. {decisive}",
    ],
    leader_dnf: [
      "Golpe brutal al campeonato en {race}: el líder se queda sin coche y {winner} hereda la victoria para {team}. {decisive}",
      "El puntero de la tabla se rompe en {race}. {winner} aparece para llevarse el botín para {team}. {decisive}",
      "{race} cambia el mundial: abandono del líder y {winner} cosecha 25 puntos de oro para {team}. {decisive}",
      "Drama en {race}: el coche del líder dice basta y {winner} convierte la suerte en victoria para {team}. {decisive}",
      "El líder se queda sin tirar en {race}. {winner} no perdona y {team} se queda con la victoria. {decisive}",
      "Cataclismo para el primero del mundial en {race}. {winner} la heredó pero la peleó. {team} se va con todo. {decisive}",
      "{race} dejó al líder con cara larga. {winner} respondió como un campeón y {team} aprovechó la oportunidad. {decisive}",
    ],
    comeback: [
      "Remontada espectacular de {winner} en {race}: {team} gana una carrera que parecía perdida. {decisive}",
      "{winner} subió desde el fondo del grupo en {race} y firmó un triunfo épico para {team}. {decisive}",
      "Carrera de remontada en {race}. {winner} adelantamientos de los que cuentan; {team} brinda con la victoria. {decisive}",
      "{race} se hizo cuesta arriba para {winner}, que la convirtió en cuesta abajo a base de adelantamientos. {team} celebra. {decisive}",
      "Maratón de adelantamientos en {race}. {winner} la peleó vuelta a vuelta y {team} se la quedó. {decisive}",
      "Remontada de campeón en {race}: {winner} subió escalón a escalón hasta dejarle la victoria a {team}. {decisive}",
      "Crónica de un asalto: {winner} convirtió un fin de semana complicado en triunfo en {race} para {team}. {decisive}",
    ],
    streak: [
      "{winner} no se cansa en {race}: otra victoria para {team} y la racha continúa. {decisive}",
      "Sigue dominando {winner} en {race}. {team} amplía la diferencia y empieza a oler a campeonato. {decisive}",
      "Otra vez {winner}, otra vez {team}. En {race}, la racha se vuelve cuestión de tiempo. {decisive}",
      "La hegemonía de {winner} continúa en {race}. {team} consolida liderato y mensaje. {decisive}",
      "{race} no rompe la racha. {winner} suma otra victoria y {team} firma su dominio. {decisive}",
      "Cada vez que parece una nueva carrera, gana lo mismo: {winner} y {team} repiten guion en {race}. {decisive}",
      "Vuelven a coincidir nombre y apellido: {winner} para {team} en {race}, sin sobresaltos. {decisive}",
    ],
    photo_finish: [
      "Final de foto en {race}: {winner} cruza la meta apenas por delante para meter el oro en casa de {team}. {decisive}",
      "{race} se decide en la última vuelta. {winner} aguanta el ataque y le entrega a {team} un triunfo de épico. {decisive}",
      "Última vuelta de infarto en {race}. {winner} firma una de las victorias más estrechas de la temporada. {decisive}",
      "{race} se decide al milímetro: {winner} adelanta al primero a falta de tres curvas. {team} se la queda. {decisive}",
      "Final de carrera para enmarcar en {race}. {winner} y {team} se llevan el triunfo por menos de medio coche. {decisive}",
      "Duelo a brazo partido hasta la última recta en {race}. {winner} prevalece, {team} estalla en boxes. {decisive}",
      "Carrera de las que se cuentan: {winner} se lleva {race} por dos décimas y le regala a {team} una victoria histórica. {decisive}",
    ],
    team_double: [
      "Doblete de {team} en {race}: {winner} adelante, {second} a continuación. {decisive}",
      "1-2 perfecto para {team} en {race}, encabezado por {winner}. {decisive}",
      "Día redondo para {team}: {winner} primero, {second} segundo. {race} se llevó el premio mayor. {decisive}",
      "Doble podio de {team} en {race}, con {winner} y {second} de la mano hasta meta. {decisive}",
      "Ejecución limpia de {team} en {race}: dos coches arriba, sin estorbarse, sin errores. {decisive}",
      "Pintar de los colores del equipo el podio: {team} ocupa el 1-2 en {race} con {winner} al frente. {decisive}",
    ],
    strategy: [
      "Pizarrazo de manual en {race}. {winner} ejecutó la estrategia perfecta y {team} se llevó el día. {decisive}",
      "{race} se decidió en boxes. {winner} hizo correr su carta y {team} firmó la victoria. {decisive}",
      "Estrategia de campeones para {team} en {race}. {winner} convirtió la pizarra en victoria. {decisive}",
      "{race} fue ajedrez sobre asfalto. {winner} jugó el mejor movimiento y {team} se llevó la partida. {decisive}",
      "Movida brillante de {team} en {race}. {winner} ejecutó el plan a la perfección. {decisive}",
      "Cuestión de timing: {winner} y {team} cerraron {race} con el momento perfecto en boxes. {decisive}",
      "Estrategia diferente, resultado diferente. {winner} ganó {race} para {team} con un guion atípico. {decisive}",
    ],
    control: [
      "{race} no se complicó: {winner} controló de salida a meta y le entregó a {team} una victoria de oficio. {decisive}",
      "Carrera bajo control en {race}. {winner} no dio opciones y {team} suma fuerte sin estrés. {decisive}",
      "{race} en piloto automático para {winner}. {team} suma puntos importantes sin sobresaltos. {decisive}",
      "Día tranquilo para {team} en {race}: {winner} hizo su carrera y mandó toda la cita. {decisive}",
      "Sin sobresaltos: {winner} colocó a {team} en lo más alto de {race} y a otra cosa. {decisive}",
      "Gestión de oficio en {race}: {winner} no rompió nada y {team} celebra la victoria. {decisive}",
      "Resultado natural en {race}: {winner} ganó como lo dictaba la lógica y {team} consolida momento. {decisive}",
      "{winner} se llevó {race} sin necesidad de subir el listón. {team} firma sin estridencias. {decisive}",
      "Control absoluto en {race}. {winner} y {team} no dejaron resquicios al rival. {decisive}",
    ],
  },
  en: {
    dominant: [
      "A {winner} masterclass at {race}. {team} bag a win with no real opposition. {decisive}",
      "{race}: {winner} starts, leads and wins without a single awkward headline for {team}. {decisive}",
      "Home turf for {winner} at {race}. {team} stroll through the grid. {decisive}",
      "No surprises at {race}: {winner} turns pole into victory, just as the script demanded. {decisive}",
      "Masterclass from {winner} at {race}: {team} leave with the win and the fastest lap. {decisive}",
      "{race} falls on the logical side: {winner} for {team}, and at the end of the day everything stays as it should. {decisive}",
      "Pure dominance from {winner} at {race}. {team} handle the {weather} showcase without a single misstep. {decisive}",
      "{race} with no drama at the front: {winner} controls every clock and hands {team} another comfortable win. {decisive}",
      "{winner}'s lecture at {race}. {team} run a textbook race and take everything on offer. {decisive}",
      "{race}: total control of the {winner} / {team} pairing, never a moment's doubt for 305 km. {decisive}",
      "Paddock lesson at {race}: {winner} sets pace, tyre and line. {decisive}",
      "{winner} strings together perfect lap after perfect lap at {race} to gift {team} a textbook win. {decisive}",
    ],
    upset: [
      "Major upset at {race}: {winner} snatches the win from outside the favourites. {decisive}",
      "{race} falls on the unexpected side. {winner} hands {team} a win few imagined in qualifying. {decisive}",
      "Bombshell at {race}: {winner} turns the race into a personal canvas and leaves the favourites without an answer. {decisive}",
      "{race} delivers a twist: {winner} turns up where nobody expected and takes the win for {team}. {decisive}",
      "Unprecedented result at {race}. {winner} and {team} write a chapter worthy of any championship anthology. {decisive}",
      "Fairy-tale race at {race}: {winner} crosses the line first against every prediction. {decisive}",
      "Nobody had {winner} winning {race} on their card; he did, and with room to do it again. {decisive}",
      "{race} is rewritten entirely. {winner} takes every opening and gifts {team} a stunner. {decisive}",
      "Cast change at {race}: {winner} steps onto the main stage and seals the most improbable win of the season. {decisive}",
      "When everyone was looking elsewhere, {winner} put {team} on top at {race}. {decisive}",
      "{race} for {winner} and for {team}: a chalkboard win that blows up every forecast. {decisive}",
    ],
    wet_master: [
      "A race for the brave at {race}. {winner} masters the rain and hands {team} an epic win. {decisive}",
      "Deluge at {race}, exhibition from {winner}: {team} take a wet-weather win worth twice as much. {decisive}",
      "{race} is transformed by the rain and {winner} shows again why his wrist is one of the paddock's best. {decisive}",
      "Aquatic catwalk at {race}. {winner} pulls off laps that looked impossible and {team} keep the spoils. {decisive}",
      "Amphibian race at {race}: {winner} picks the moment, picks the inters and gifts {team} a legendary trophy. {decisive}",
      "Rain, fog and {winner}. {team} took a grand prix in conditions few enjoyed at {race}. {decisive}",
      "The sky collapsed on {race} and {winner} responded with a wet-tyre masterclass. {decisive}",
      "{winner} made {race} a personal painting. {team} win in a race seen once a season. {decisive}",
      "Biblical downpour at {race}: {winner} and {team} build a win that's already paddock folklore. {decisive}",
      "Singing in the rain: {winner} puts {team} on top in one of the year's defining races at {race}. {decisive}",
    ],
    chaos: [
      "Total chaos at {race}: three cars out and {winner} surfaces to take the win for {team}. {decisive}",
      "{race} falls apart. While the favourites are stranded, {winner} runs his own race and hands {team} the lot. {decisive}",
      "Race demolished at {race}. {winner} survives, executes and seals a win for {team}. {decisive}",
      "Mechanical mayhem at {race}: lots of cars out, {winner} standing. {team} take the only consistency of the day. {decisive}",
      "Pile-ups, yellow flags and {winner} at the front. {race} gives {team} the win by simply staying intact. {decisive}",
      "Circus scenes at {race}. {winner} stays calm, dodges the war and seals a craftsman's win for {team}. {decisive}",
      "One of the year's most broken races at {race}. {winner} keeps the car together and leaves with every point. {decisive}",
      "Red flag, restart, and {winner} on top. {team} stay out of trouble at {race}. {decisive}",
      "{race} was a survival game. {winner} played it better than anyone and gifted {team} 25 golden points. {decisive}",
    ],
    safety_car: [
      "The safety car decided {race}. {winner} took the restart and delivered {team} a tactical win. {decisive}",
      "{race} changed after the safety car. {winner} answered best and {team} took the day. {decisive}",
      "Lead wiped by the safety car at {race}, but {winner} rebuilt the gap and {team} sealed the win. {decisive}",
      "Safety car at the hottest moment of {race}: {winner} answered, {team} celebrated. {decisive}",
      "{winner} thanked the safety car at {race} and gave {team} a win that looked uphill. {decisive}",
      "Race reset by the safety car, win rebuilt by {winner}. {team} score big at {race}. {decisive}",
      "The late neutralisation at {race} dealt fresh cards and {winner} shuffled best. {decisive}",
      "Hot restart at {race}: {winner} executed like a veteran and {team} took the rewards. {decisive}",
      "A safety car with fifteen laps left compressed the pack at {race} and {winner} answered with an instant strike. {decisive}",
    ],
    leader_dnf: [
      "Brutal blow to the championship at {race}: the leader is out and {winner} inherits the win for {team}. {decisive}",
      "The man at the top of the table breaks at {race}. {winner} surfaces to take the spoils for {team}. {decisive}",
      "{race} changes the title race: leader's retirement and {winner} bags 25 golden points for {team}. {decisive}",
      "Drama at {race}: the leader's car cries enough and {winner} turns luck into win for {team}. {decisive}",
      "The leader runs dry at {race}. {winner} doesn't forgive and {team} keep the victory. {decisive}",
      "Title cataclysm for the championship leader at {race}. {winner} inherited it but earned it. {team} leave with everything. {decisive}",
      "{race} left the leader gutted. {winner} answered like a champion and {team} grabbed the chance. {decisive}",
    ],
    comeback: [
      "Spectacular comeback from {winner} at {race}: {team} win a race that looked lost. {decisive}",
      "{winner} climbed from the back at {race} and sealed an epic win for {team}. {decisive}",
      "Comeback race at {race}. {winner} the kind of passes that count; {team} toast the win. {decisive}",
      "{race} turned into a climb for {winner}, who turned it into a descent with pass after pass. {team} celebrate. {decisive}",
      "Overtaking marathon at {race}. {winner} fought lap by lap and {team} kept it. {decisive}",
      "Champion's comeback at {race}: {winner} climbed step by step until he handed {team} the win. {decisive}",
      "Chronicle of an assault: {winner} turned a tough weekend into victory at {race} for {team}. {decisive}",
    ],
    streak: [
      "{winner} doesn't tire at {race}: another win for {team} and the streak goes on. {decisive}",
      "{winner} keeps dominating at {race}. {team} extend the gap and start to smell a title. {decisive}",
      "Once again {winner}, once again {team}. At {race}, the streak becomes a matter of time. {decisive}",
      "{winner}'s hegemony continues at {race}. {team} consolidate the lead and the message. {decisive}",
      "{race} doesn't break the streak. {winner} adds another win and {team} cement their dominance. {decisive}",
      "Every time it looks like a new race, the same name wins: {winner} and {team} replay the script at {race}. {decisive}",
      "Name and surname align again: {winner} for {team} at {race}, no drama. {decisive}",
    ],
    photo_finish: [
      "Photo finish at {race}: {winner} crosses the line just ahead to put the gold at {team}. {decisive}",
      "{race} decided on the last lap. {winner} holds the attack and gives {team} an epic win. {decisive}",
      "Heart-stopping last lap at {race}. {winner} delivers one of the closest wins of the season. {decisive}",
      "{race} settled by millimetres: {winner} passes the leader three corners from home. {team} keep it. {decisive}",
      "A frame-worthy finish at {race}. {winner} and {team} take the win by less than half a car. {decisive}",
      "Bare-knuckle duel to the final straight at {race}. {winner} prevails, {team} explode in the pit box. {decisive}",
      "One for the books: {winner} takes {race} by two tenths and gifts {team} a historic win. {decisive}",
    ],
    team_double: [
      "Team double for {team} at {race}: {winner} ahead, {second} right behind. {decisive}",
      "Perfect 1-2 for {team} at {race}, led by {winner}. {decisive}",
      "Dream day for {team}: {winner} first, {second} second. {race} brought home the biggest prize. {decisive}",
      "Double podium for {team} at {race}, with {winner} and {second} side by side to the flag. {decisive}",
      "Clean execution from {team} at {race}: two cars on top, no contact, no errors. {decisive}",
      "Painting the podium team colours: {team} take 1-2 at {race} with {winner} leading. {decisive}",
    ],
    strategy: [
      "Textbook chalkboard at {race}. {winner} executed the perfect strategy and {team} took the day. {decisive}",
      "{race} decided in the pits. {winner} played his card and {team} sealed the win. {decisive}",
      "Champion's strategy for {team} at {race}. {winner} turned chalkboard into victory. {decisive}",
      "{race} was asphalt chess. {winner} played the best move and {team} took the game. {decisive}",
      "Brilliant move from {team} at {race}. {winner} executed the plan to perfection. {decisive}",
      "Question of timing: {winner} and {team} closed out {race} with the perfect pit window. {decisive}",
      "Different strategy, different result. {winner} won {race} for {team} with an atypical script. {decisive}",
    ],
    control: [
      "{race} kept things simple: {winner} controlled lights to flag and gave {team} a craftsman's win. {decisive}",
      "Race under control at {race}. {winner} gave no openings and {team} score big without stress. {decisive}",
      "{race} on autopilot for {winner}. {team} take important points with no drama. {decisive}",
      "Calm day for {team} at {race}: {winner} ran his race and ran the show. {decisive}",
      "No drama: {winner} put {team} on top at {race} and on to the next. {decisive}",
      "Craftsman management at {race}: {winner} didn't break anything and {team} celebrate the win. {decisive}",
      "Natural result at {race}: {winner} won as logic dictated and {team} consolidate momentum. {decisive}",
      "{winner} took {race} without lifting the level. {team} sign off without fireworks. {decisive}",
      "Total control at {race}. {winner} and {team} left no openings for the rival. {decisive}",
    ],
  },
};

const CONTRAST_CONNECTORS_BY_LOCALE = {
  es: [
    "Mientras tanto, {leaderAfter} sigue al frente del mundial con {gapAfter} puntos de ventaja.",
    "El campeonato lo lidera {leaderAfter}, con {gapAfter} puntos sobre el segundo.",
    "{leaderAfter} mantiene el rumbo del mundial con un margen de {gapAfter} puntos.",
    "Al cierre, {leaderAfter} sigue dictando ritmo de tabla con {gapAfter} puntos de colchón.",
    "Tabla mundial al cierre: {leaderAfter} en cabeza, {gapAfter} puntos sobre el segundo.",
    "{leaderAfter} amarra el liderato con {gapAfter} puntos de diferencia tras la cita.",
  ],
  en: [
    "Meanwhile, {leaderAfter} stays at the top of the championship with a {gapAfter}-point lead.",
    "{leaderAfter} leads the table, {gapAfter} points clear of second.",
    "{leaderAfter} stays on course in the championship with a {gapAfter}-point margin.",
    "At the close, {leaderAfter} keeps setting the table's pace with a {gapAfter}-point cushion.",
    "Championship snapshot: {leaderAfter} on top, {gapAfter} points clear of second.",
    "{leaderAfter} ties up the lead by {gapAfter} points after the race.",
  ],
};

const SCENARIO_TAGS_BY_LOCALE = {
  es: {
    dominant: "Dominio",
    upset: "Sorpresa",
    wet_master: "Lluvia",
    chaos: "Carrera rota",
    safety_car: "Safety car",
    leader_dnf: "Golpe al lider",
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
const SCENARIO_TAGS = pickByLocale(SCENARIO_TAGS_BY_LOCALE);

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
  if (withContrast && vars.leaderAfter) {
    const tail = fillTemplate(pickFromBank(CONTRAST_CONNECTORS, rng), vars);
    text = `${text} ${tail}`;
  }
  return {
    tag: SCENARIO_TAGS[scenario] || SCENARIO_TAGS.control,
    text,
  };
};

export const renderSeasonIntro = ({ year, teamCount, driverCount, raceCount, rng }) => {
  const template = pickFromBank(SEASON_INTRO_TEMPLATES, rng);
  return fillTemplate(template, { year, teamCount, driverCount, raceCount });
};
