<!-- Copia en Markdown del SRS (fuente: Claude Doc https://claude.ai/artifact/2ZaMbCs2RJZtKSwU1Hugi4, PDF en docs/manager/SRS-OverCut-Manager.pdf). Exportada el 2026-11-22. -->

# OverCut Manager — Especificación de Requisitos (SRS)

Nov 22, 2026 · @Hugo

## 1. Introducción

OverCut Manager será un modo de gestión de escudería para OverCut GP. Cubrirá todas las temporadas de F1 que tienen coche en el repositorio `f1-3d-assets`: 1976, década de los 80, de 1990 a 2014, 2016 y de 2018 a 2026. Cada temporada respetará los hechos reales de ese año: equipos, pilotos, calendario, reglamento y sistema de puntos. F1 Manager 24 (Frontier, 2024) sirve de referencia de género: de él se toman la arquitectura de datos, el ciclo del fin de semana y los sistemas de gestión. No se copian su marca, sus textos, su interfaz ni sus assets.

**Punto de partida.** En `BackUp-OverCutServer` ya existe un modo Manager: el commit `0748b33` del 18/10/2026 añadió 75 ficheros y unas 22.900 líneas en `frontend/src/modules/overcutManager/`. Incluye motor de carrera vuelta a vuelta, sesiones, setup, economía, mercado y una escena 3D con three.js. Ese commit no está en el repo principal `OverCut`, cuyo último commit es del 24/08/2026. Coches y circuitos se generan por código; nada carga GLB. Esta especificación amplía ese módulo y no lo sustituye.

### 1.1 Alcance

- **Incluido:** carrera de director de equipo, de una temporada histórica a varias seguidas; fin de semana jugable (libres, clasificación, sprint, carrera) con vista 3D; desarrollo del coche, plantilla, instalaciones, finanzas, patrocinio y junta directiva; motor de coherencia histórica por año.
- **Excluido de la v1:** multijugador en tiempo real, editor de librea, categorías de promoción jugables (F2/F3 solo como cantera simulada), conducción manual.

### 1.2 Referencias

- Instalación de F1 Manager 2024 en `E:\SteamLibrary\steamapps\common\F1 Manager 2024` y partida guardada del usuario en `%LOCALAPPDATA%\F1Manager24\Saved\SaveGames\save0.sav` (25/07/2024).
- Repositorio de assets [heg15220/f1-3d-assets](https://github.com/heg15220/f1-3d-assets): `MANIFEST.md`, una GitHub Release por carpeta.
- Código de OverCut: repo principal `Proyectos/OverCut` y backup `Proyectos/BackUp-OverCutServer`.
- Datos históricos: f1db, ya importado en `overcut/src/main/resources/scripts/` (`generic_stats_data.json`, `career_lineups.json`, `career_constructor_standings.json`).

### 1.3 Definiciones

| Término | Significado |
| --- | --- |
| Temporada jugable | Año con al menos un GLB de coche asignable en el repositorio |
| Era reglamentaria | Bloque de años con las mismas reglas técnicas y deportivas (p. ej. 2009–2013) |
| Pack de temporada | Datos versionados de un año: parrilla, calendario, reglas, ratings y eventos |
| Ancla histórica | Hecho real que la simulación debe respetar o, si el jugador lo altera, registrar como desviación |
| Requisito RF / RNF | Requisito funcional / no funcional, con prioridad MoSCoW (M, S, C, W) |

### 1.4 Método de ingeniería inversa

El índice de `pakchunk0-Windows.pak` (4,7 GB, versión 11, Oodle) está cifrado con AES, igual que los contenedores IoStore. **No se ha extraído ni usado la clave de cifrado.** El análisis se basa solo en material no cifrado:

1. Estructura de la instalación y DLL de terceros.
2. 752.655 cadenas del ejecutable `F1Manager24.exe`: nombres reflejados de módulos, clases, enums y propiedades de Unreal.
3. La partida guardada del propio usuario: un contenedor GVAS con una base SQLite comprimida con zlib (7,7 MB, 315 tablas y vistas). Es el modelo de datos completo del juego.

Las reglas o valores que no se pueden ver así (fórmulas internas, curvas de los DataAssets) se marcan como inferidos.

## 2. Análisis de F1 Manager 24

F1 Manager 24 separa tres capas: una base SQLite que guarda todo el estado de la carrera deportiva, un simulador de carrera en C++ con estado propio por coche, y una interfaz HTML/JS que se renderiza dentro de Unreal. OverCut Manager debe copiar esta separación, no el contenido.

### 2.1 Instalación y motor

| Elemento | Hallazgo | Lectura técnica |
| --- | --- | --- |
| Motor | Unreal Engine 5 (IoStore `.utoc/.ucas` v5, MaterialX, Nanite, DLSS, FSR2) | Render 3D de circuito y coches; la lógica de gestión no depende del render |
| Contenido | 116 ficheros en `Content/Paks`, 17,2 GB; `pakchunk0` de 4,7 GB con Oodle | Troceado por circuito y por tipo de asset (chunks 0–4 con subchunks `_sN`) |
| UI | Plugin Coherent Gameface (`cohtml.WindowsDesktop.dll`, `v8.dll`, `HttpServer`) | La UI es HTML + CSS + JavaScript sobre V8, enlazada al motor por *bindings* |
| Audio | Wwise | Radio de equipo y ambiente por eventos |
| Servicios | `KeplerAPI.dll` (`KeplerAPI_Telemetry_NamedJson`) y Steamworks 1.55 | Telemetría de sesión, temporada y escenarios hacia Frontier |
| Otros | Boost 1.70, Python 3.9 vía `boost_python39`, TBB, Razer Chroma | Herramientas internas y efectos de periféricos |
| Módulos propios | `RaceSim`, `RaceManagement`, `RaceGame`, `RaceGameCore`, `GameLogic`, `GameDatabase`, `DatabaseAssets`, `Kepler` | Simulación, gestión, partida, persistencia y servicios en módulos distintos |

### 2.2 Backend: la base de datos de partida

Cada `.sav` es un contenedor GVAS con metadatos (`CareerSaveMetaData`: equipo, carrera actual, vuelta, `WeekendStage`) y, desde el byte 2.828, una base SQLite comprimida con zlib. Esa base contiene **315 tablas y vistas**, agrupadas por prefijo de dominio. Las tablas `*_Enum_*` son catálogos de tipos y las `Save_*` guardan el estado vivo del simulador a mitad de sesión.

| Dominio | Tablas clave | Qué modela |
| --- | --- | --- |
| Calendario y temporada | `Seasons`, `Seasons_Deadlines`, `Races`, `Races_Templates`, `Races_Tracks` | Fondo de premios, fechas límite (16 tipos), carreras con clima por sesión, plantilla anual por circuito |
| Resultados | `Races_Results`, `Races_QualifyingResults`, `Races_SprintResults`, `Races_PracticeResults`, `Races_DriverStandings`, `Races_TeamStandings`, `Races_PitStopResults` | Resultados por sesión, incluidos adelantamientos, defensas, SC/VSC y combustible |
| Coche y piezas | `Parts_Designs`, `Parts_Designs_StatValues`, `Parts_Items`, `Parts_CarLoadout`, `Parts_TeamExpertise`, `Parts_Projects` | Diseño → fabricación → montaje; *expertise* por equipo, pieza y estadística |
| Personal | `Staff_BasicData`, `Staff_DriverData`, `Staff_GameData`, `Staff_PerformanceStats`, `Staff_Contracts`, `Staff_Mentality_*`, `Staff_PitCrew_*` | Pilotos y técnicos, atributos, contratos, moral, fatiga del *pit crew* |
| Instalaciones | `Buildings`, `Buildings_HQ`, `Buildings_Effects` | 16 edificios con nivel, mantenimiento, degradación y efectos |
| Finanzas | `Finance_TeamBudget`, `Finance_TeamBudget_SpendingBuckets`, `Finance_Transactions` | Presupuesto por categoría (11), techo de gasto, transacciones (39 tipos) |
| Patrocinio | `Sponsorship_ActivePackages`, `Sponsorship_RaceBonuses`, `Sponsorship_EngagementActivities` | Paquetes, bonus por objetivo de carrera, actividades de imagen |
| Junta | `Board_Confidence`, `Board_Objectives`, `Board_TeamRating` | Confianza, objetivos anuales, rating del equipo |
| Reglamento | `Regulations_Enum_Changes`, `Regulations_ChangeGroups`, `Regulations_NonTechnical_*`, `Regulations_Technical_*` | Cambios votados: técnicos, financieros y deportivos |
| Narrativa | `Mail_*` (cadenas, dilemas, efectos), `Effects_ActiveEffects`, `Fanfares` | Correos con decisiones que aplican efectos (36 tipos) |
| IA de equipos | `Teams_PriorityList*`, `Teams_AI_Records` | Lista de prioridades de los equipos rivales: desarrollar pieza, mejorar edificio, contratar |
| Estado de sesión | `Save_Weekend`, `Save_RaceSimCars*`, `Save_Strategist*`, `Save_RaceControl*`, `Save_WeatherHistory`, `Save_TimingManager_*` | Guardado a mitad de sesión: física, estrategia, incidentes, clima, cronometraje |

**Valores de referencia leídos de la base** (contexto de la temporada 2024 del juego; importes en dólares):

- 9 tipos de pieza (motor, ERS, caja, chasis, alerón delantero, alerón trasero, pontones, suelo, suspensión). Cada uno tiene coste base de diseño y fabricación (motor 5 M USD; alerón delantero 1,8 M USD de diseño y 0,225 M USD por unidad) y umbrales de daño.
- 23 estadísticas de coche, entre ellas velocidad punta, aceleración, frenada, carga baja/media/alta, paso por curva lenta/media/rápida, flujo de aire, refrigeración, conservación de neumáticos, consumo, DRS y paso por curva en aire sucio.
- 4 ritmos de desarrollo: Normal (×1 coste), Acelerado (×1,5), Intenso (×3, +50 % de *expertise*) y Emergencia (×4).
- Recursos de túnel de viento y CFD inversos a la posición: el 1.º tiene 46 bloques de túnel y el 10.º, 82.
- Techo de gasto 139,2 M USD (rango votable 125–175 M USD). Límites de motor 4, ERS 2 y caja 4. Penalización de 5 posiciones por exceder un límite.
- Tres esquemas de puntos parametrizados (25-18-15…, 10-8-6…, 10-6-4…), con opciones de puntos dobles en la última carrera, vuelta rápida y pole.
- 5 tipos de personal: piloto, director técnico, ingeniero de carrera, jefe de aerodinámica y director deportivo. Cada tipo tiene edades, salario base y plantilla de atributos (pilotos: 9 atributos sembrados entre 45 y 70).
- Objetivos de la junta según el rating del equipo: Campeón (600–1000), Aspirante a podio (450–599), Aspirante a puntos (0–449).
- Confianza de la junta por carrera: −6 por quedar por debajo de lo esperado y +8 por superar lo esperado en más de una posición.
- Circuitos con vueltas, longitud, tipo (equilibrado, carga, potencia), probabilidad de SC y pérdida en *pit lane* en verde y bajo SC. Ejemplo: Monaco, 78 vueltas, 3,337 km, SC 0,33, *pit lane* 20 s.

### 2.3 Simulación de carrera

El ejecutable expone la jerarquía `URaceWeekendManager` → `URaceSimManager` → coches. Cada coche tiene una IA por sesión (`URaceSimCarAIPractice`, `…Qualifying`, `…Race`) y un estratega por equipo (`URaceStrategistManager`, `URaceSimStrategist_*`). El tuning está en DataAssets: IA, neumáticos, combustible, incidentes, *pit stop*, dirección de carrera, clima, tácticas y confianza del piloto. La simulación es híbrida:

1. **Movimiento sobre *spline*.** Cada coche avanza por la *spline* del trazado con nodos, zonas de frenada y desplazamiento lateral respecto a la trazada (`Save_SimpleSimCars`). No hay física de neumático real: la velocidad sale de las estadísticas del coche y de multiplicadores.
2. **Modificadores por vuelta:** desgaste y temperatura de superficie y carcasa por rueda; combustible y multiplicadores de consumo (modo de ritmo, nivel de combustible, agua en pista, suavidad del piloto, SC); ERS con carga y despliegue por vuelta; temperatura de motor y frenos; aire sucio y rebufo por distancia y velocidad.
3. **Adelantamiento como tirada.** El atacante elige línea y curva objetivo. Se reclama la curva (`CornerClaim`, hasta 3 coches) y se tira el éxito con modificadores de DRS, ERS, ritmo, ahorro de combustible, daño y coche. Hay contraataque (*switchback*) y enfriamiento tras fallar. La defensa puede ser `HoldCarBehind`, `Block` o `HoldRacingLine`.
4. **Incidentes y dirección de carrera.** La probabilidad por vuelta depende de control del piloto, agua en pista y multiplicador del circuito. Gravedad, velocidad de impacto y tiempo de limpieza deciden la respuesta: amarilla, VSC, SC o bandera roja. Las investigaciones pueden acabar en sanción.
5. **Pit stop por etapas.** Elevar, aflojar, quitar, poner, apretar, bajar, soltar, más alerón. Cada etapa tiene tiempo según los atributos y la fatiga del *pit crew*, y puede fallar (`MistakeStage/Severity`).
6. **Clima dinámico.** Siete estados, de soleado a lluvia fuerte, con agua en pista, temperatura y goma acumulada. El pronóstico es más fiable con el Weather Centre.
7. **Simulación rápida.** Las sesiones no jugadas se simulan (`USimulateRaceDataAsset`, `SimulatedP1…SimulatedRace`) con estadísticas agregadas por coche.

**Órdenes del jugador (enum `EDriverCommand`, 25 valores):** modo ERS (neutro, cargar, desplegar, adelantar, defender, recargar), ritmo (±, empujar, cerrar hueco), *lift & coast*, evitar pianos, buscar aire limpio, dejar pasar al compañero, retener a los de detrás, adelantamiento de riesgo alto o bajo, y pedir o cancelar parada. El desgaste se gestiona en 5 niveles, de Attack a Conserve. Las estrategias se planifican como A–F con ventana de parada (inicio, óptima, fin).

### 2.4 Fin de semana y frontend

El enum `EWeekendStage` fija el flujo: intro → P1 → P2 → P3 → Q1 → Q2 → Q3 → intro de carrera → carrera → post-carrera. En fin de semana sprint se sustituye por SQ1–SQ3 y Sprint. Hay tres tipos de fin de semana: Normal, Sprint y RQF. `ERaceWeekendGuiScreens` (48 valores) da el mapa de pantallas:

| Bloque | Pantallas |
| --- | --- |
| Antes de la sesión | Resumen de sesión e info del circuito, objetivos del piloto, setup del piloto, estrategia del coche, **CarSetup**, editor y selector de estrategia, almacén de piezas (aero, motor, fabricar, nuevo diseño) |
| En sesión | Práctica, carrera, opciones de parada, **DataView** (telemetría), analíticas, «jugar o simular», simulando sesiones |
| Después de la sesión | Resultados, resumen post-libres (revelación de confianza), post-clasificación, post-sprint, post-carrera (con paradas), clasificaciones de pilotos y constructores, gráficos, repetición |
| Cinemáticas | Intro, salida del coche del garaje, apagado de semáforos, reacciones, *highlights*, salida |

Fuera del fin de semana, el HQ se recorre en 3D (`UHQNavigationDataAsset`). Las áreas son: bandeja de correo (`UMailDataAsset`), finanzas, instalaciones, diseño y fabricación, personal y mercado, ojeo, patrocinio, junta y votación del reglamento. Las notificaciones y celebraciones (*fanfares*, 13 tipos) cierran cada proceso: diseño terminado, fichaje, revisión de mitad de temporada, resumen de fin de temporada.

### 2.5 Lecciones para OverCut

- La base de datos es la fuente de verdad y el simulador solo lee y escribe estado. Esto permite guardar a mitad de sesión y simular sesiones no jugadas.
- Todo número de equilibrio vive en datos (DataAssets y tablas `*_Enum_*`), no en el código. OverCut debe hacer lo mismo con un pack por temporada.
- F1 Manager 24 solo modela la era 2022–2024: sin repostaje, ERS fijo, techo de gasto, sprint. OverCut tiene que parametrizar todo lo que en F1M24 es constante, porque cubre de 1976 a 2026.

## 3. Inventario de `f1-3d-assets`

El repositorio tiene 136 GLB de coches en 30 releases y unos 200 GLB de circuitos. Solo 2012 tiene la parrilla completa. El resto de temporadas necesita coches de relleno, así que el juego debe combinar GLB reales con los coches procedurales que ya existen en `three/carModel.js`. Los binarios están en GitHub Releases con tag normalizado (`coches/2005` → `coches-2005`) y el listado en `MANIFEST.md`.

### 3.1 Coches por temporada

Recuento de equipos real hecho de memoria; se verificará contra f1db (`career_lineups.json`) al generar el pack de cada año.

| Temporada | GLB | Equipos reales | Falta | Observaciones |
| --- | --- | --- | --- | --- |
| 2026 | 5 (Audi R26, Cadillac MAC-26, Ferrari SF-26, Mercedes W17, Red Bull RB22) | 11 | McLaren, Aston Martin, Alpine, Williams, Racing Bulls, Haas | Primer año con 11 equipos desde 2016 |
| 2025 | 6 (Alpine A525, Williams, Aston AMR25, RB21, McLaren MCL39, Ferrari SF-25) | 10 | Mercedes, Racing Bulls, Haas, Sauber | MCL39 pesa 116 MB: necesita LOD |
| 2024 | 3 (RB20, VCARB 01, Ferrari «LEGO») | 10 | 7 equipos | El Ferrari LEGO no sirve como coche de carrera |
| 2023 | 8 (Mercedes, Alfa Romeo, AlphaTauri, Alpine, Aston, McLaren, RB19, Ferrari) | 10 | Williams, Haas | El nombre del GLB de Alfa Romeo (`kick_c43_24`) sugiere librea 2024; revisar |
| 2022 | 1 (Ferrari F1-75) | 10 | 9 |  |
| 2021 | 3 + 1 genérico (Alpine, RB16B, McLaren MCL35M) | 10 | 7 | `f1_2021_car` es genérico (2,3 MB) |
| 2020 | 1 (Mercedes) | 10 | 9 |  |
| 2019 | 2 (RB15, Ferrari) | 10 | 8 |  |
| 2018 | 3 (Ferrari SF71H, RB14, Renault R.S.18) | 10 | 7 |  |
| 2016 | 2 (McLaren MP4-31, RB12) | 11 | 9 | 2015 y 2017 no tienen carpeta |
| 2014 | 1 pack | 11 | Por determinar | Hay que abrir el pack y separar nodos por equipo |
| 2013 | 1 pack | 11 | Por determinar | Ídem |
| 2012 | 12 | 12 | — | **Parrilla completa** |
| 2011 | 10 | 12 | Williams, Virgin |  |
| 2010 | 1 pack | 12 | Por determinar |  |
| 2009 | 5 (BMW, Brawn, Ferrari, Renault, Toro Rosso) | 10 | 5 |  |
| 2008 | 10 | 11 | Toyota | Archivo `redbull_rb3` en carpeta 2008: el coche de 2008 era el RB4; revisar. Super Aguri solo corrió 4 GP |
| 2007 | 1 (`2007.glb`, equipo sin identificar) | 11 | Por determinar |  |
| 2006 | 10 | 11 | BMW Sauber |  |
| 2005 | 9 | 10 | Red Bull |  |
| 2004 | 3 (Ferrari, McLaren, Renault) | 10 | 7 |  |
| 2003 | 1 (Renault R23) | 10 | 9 |  |
| 2002 | 10 | 11 | Arrows | Arrows se retiró a mitad de año |
| 1998–2001 | 4 (McLaren MP4/13 1998, Arrows A20 1999, Ferrari F2000, Ferrari F2001) | 11–12 por año | Casi toda la parrilla |  |
| 1990–1997 | 11 (B190, Jordan 191, MP4/6, FW14, MP4/8, B194, 412 T1, B197, F310, MP4/12, FW19) | 14–20 por año | Casi toda la parrilla | El Ferrari de 1997 fue el F310B |
| 1986 y 1988 | 4 (Tyrrell 015, Benetton B186, Lotus 98T, McLaren MP4/4) | 16–18 por año | Casi toda la parrilla | El nombre del GLB de Benetton dice `b168` |
| 1976 | 1 (Ferrari 312T) | unos 16 | Casi toda la parrilla | En 1976 Ferrari corrió con 312T y 312T2 |

### 3.2 Circuitos con uso en F1

Unos 45 GLB corresponden a circuitos que han tenido GP de F1, muchos con varias versiones del trazado por años. Los demás (karting, óvalos, drift, rallycross, ficticios) no tienen uso en este modo.

| Circuito | Versiones en el repo | Temporadas a las que sirve |
| --- | --- | --- |
| Spa-Francorchamps | 1939, 1992, 1998, 2009, 2022, genérico | 1983–2026 por versión; la de 1939 no vale para 1976 (no hubo GP en Spa) |
| Monza | 1998, 2020, otras 5 | Todas |
| Nürburgring | Nordschleife 1967, GP 1995, 2016, 2022, genéricos | Nordschleife para 1976; GP para 1984–2013 y 2020 |
| Hockenheim | 1988, genéricos | Trazado largo hasta 2001; corto 2002–2019 |
| Silverstone | 1999, 2024, genérico | Todas, con versión por época |
| Monaco | 5 versiones | Todas |
| Suzuka | 2001, 2 más | 1987 en adelante |
| Interlagos | 2023, 2 más | 1990 en adelante (el trazado largo de 1976 no está) |
| Albert Park | 2018, genérico, neón, Melbourne | 1996 en adelante |
| Barcelona-Catalunya | 2023, 2 más | 1991 en adelante |
| Montreal | 2019, 2 más | 1978 en adelante |
| Hungaroring | 2020, 2 más | 1986 en adelante |
| Imola | 2024 | Versión moderna (sin Tamburello de los 80) |
| Marina Bay | 2 | 2008 en adelante |
| Shanghai | 2018, 2 más | 2004 en adelante |
| Sepang | genérico, «2025 layout» | 1999–2017 |
| Red Bull Ring | 2025, genérico | 1997–2003 como A1-Ring, 2014 en adelante |
| Yas Marina | 2021, genérico | 2009 en adelante |
| Bahrain, Istanbul Park, Korea, Valencia, Jeddah («Yeddah»), COTA, Zandvoort 2023, Paul Ricard, Magny-Cours, Indianapolis, Zolder, Brands Hatch, Detroit, Fuji, Jerez, Le Mans Bugatti | 1–2 cada uno | Según los años en que albergaron GP |

**Faltan** circuitos de calendario importantes: Bakú, Miami, Las Vegas, Lusail, Hermanos Rodríguez, Sochi, Portimão, Mugello, Estoril, Adelaida, Phoenix, Kyalami, Jacarepaguá, Buenos Aires, Watkins Glen, Long Beach, Mosport, Anderstorp, Dijon, Österreichring y Madrid (2026). Para ellos se usará el trazado procedural que ya genera `engine/layouts.js` del módulo actual. Hanoi está en el repo pero nunca albergó un GP y no debe aparecer en ningún calendario.

### 3.3 Licencias

- Los circuitos traen `ATTRIBUTION.txt` con autor, enlace y licencia (CC BY, BY-SA, BY-ND o CC0). Los coches no traen atribución en git: **hay que completarla antes de publicar**.
- Con **CC BY-ND** no se puede recolorear ni modificar el modelo. Un GLB BY-ND no puede usarse como base de librea de otro equipo.
- El README del repo avisa de que muchos circuitos están *ripped* de otros videojuegos (Real Racing 3, GRID, Asphalt, F1 2010…). Es un riesgo legal para cualquier uso comercial. El juego debe poder excluirlos con un indicador por asset.
- Los nombres y marcas de equipos y pilotos reales son marcas de terceros. Ver riesgos en la sección 7.

## 4. Arquitectura de OverCut Manager

Se mantiene la pila actual de OverCut: React 18 y three.js 0.170 en el cliente, Spring Boot 3.1 con MySQL para guardados y datos. Como en F1 Manager 24, el estado del mundo es la única fuente de verdad. Los simuladores lo leen y lo escriben, y la interfaz solo lo muestra y envía órdenes. El motor corre en un Web Worker para que la simulación no bloquee el render.

Diagrama de arquitectura (3 capas, 12 componentes):

```text
DATOS          [Packs de temporada]      [Partida guardada]        [Manifiesto de assets]
               JSON por año desde f1db   local + API de guardado   GLB en GitHub Releases
                     | pack del año            ^ | cargar y guardar        | assets GLB
                     v                         | v                         |
MOTOR          [Director histórico]      [ESTADO DEL MUNDO]        [Simulación de gestión]
(Web Worker)   aplica anclas por era     única fuente de verdad    I+D, staff, finanzas, junta
               [Fin de semana]           [Simulación de carrera]   [IA de equipos]
               libres, clasif., carrera  paso fijo y semilla       estrategas y prioridades
                                               ^ | estado y eventos hacia abajo,  |
                                               | v órdenes hacia arriba           |
PRESENTACIÓN   [Oficina y HQ]            [Pantallas del GP]        [Vista 3D] <---+
(React+three)  correo, mercado, I+D      setup, estrategia, tiempos  GLB o coche procedural
```

Los datos entran por arriba: pack del año, partida y assets. El motor no conoce three.js. La vista 3D solo recibe posiciones y eventos del motor, y carga los GLB del manifiesto por su cuenta.

### 4.1 Modelo de datos

El estado se organiza por dominios, igual que la base de F1 Manager 24, pero con tablas más ligeras y con claves de era que allí no existen.

| Entidad OverCut | Equivalente en F1M24 | Campos clave |
| --- | --- | --- |
| `Season` | `Seasons`, `Seasons_Deadlines`, `Regulations_*` | año, era, reglas (6.2), fondo de premios, fechas límite |
| `Event` | `Races`, `Races_Templates` | GP, fecha, circuito y versión, tipo de fin de semana, clima previsto |
| `Circuit` | `Races_Tracks`, `Parts_RecommendedTrackStats` | longitud, vueltas, tipo, probabilidad de SC, pérdida en *pit lane*, zonas DRS, estadísticas críticas, `splineId` |
| `Team` | `Teams`, `Board_*`, `Buildings_HQ` | nombre del año, motor, presupuesto, rating, confianza, edificios |
| `Entry` | `Staff_Contracts` (PosInTeam) | GP, equipo, chasis, piloto, dorsal |
| `Person` | `Staff_BasicData`, `Staff_GameData`, `Staff_PerformanceStats` | rol, atributos, edad, potencial, moral |
| `Contract` | `Staff_Contracts` | salario, bonus, fin, cláusulas |
| `PartDesign` / `PartItem` | `Parts_Designs`, `Parts_Items`, `Parts_CarLoadout` | tipo de pieza por era, estadísticas, estado, unidades |
| `Expertise` | `Parts_TeamExpertise` | equipo, pieza, estadística, valor |
| `Transaction` | `Finance_Transactions` | día, categoría, importe, cuenta para el techo |
| `Mail` / `Effect` | `Mail_*`, `Effects_ActiveEffects` | asunto, opciones, efectos tipados |
| `SessionState` | `Save_*` | estado completo del simulador para guardar a mitad de sesión |
| `HistoryLog` | Sin equivalente | desviaciones respecto a la historia real |

### 4.2 Bucle de simulación de carrera

1. Cada paso (0,25 s), cada coche calcula su ritmo objetivo en el segmento de trazada: estadísticas del coche × perfil del segmento, más piloto, neumático, combustible, energía, clima y orden de ritmo.
2. Se aplican aire sucio y rebufo según la distancia al coche de delante y la era.
3. Si un coche alcanza a otro antes de una curva candidata, se abre un duelo. El duelo reclama la curva, tira el éxito con modificadores, y puede acabar en adelantamiento, defensa o incidente.
4. Se actualizan desgaste, temperaturas, consumo, energía y fiabilidad; se tiran incidentes y averías.
5. La dirección de carrera decide la respuesta según la era (amarilla, VSC, SC, roja) y las investigaciones.
6. Los estrategas, el del jugador y los de la IA, revisan su plan cada vuelta y en cada evento.
7. El cronometraje registra sectores y vueltas, y se emiten eventos para la UI y la radio.

El modo rápido usa el mismo modelo, pero vuelta a vuelta y sin duelos individuales. Su salida debe ser estadísticamente equivalente: misma media y varianza de tiempos por vuelta ± 2 %.

### 4.3 Manifiesto de assets

`MANIFEST.md` solo lista ficheros. Hace falta un manifiesto propio, `manager-assets.json`, que diga qué GLB usar para cada equipo y año y cómo colocarlo:

```json
{
  "cars": [{
    "season": 2012, "teamRef": "red_bull", "chassis": "RB8",
    "release": "coches-2012", "file": "2012_red_bull_rb8.glb",
    "scale": 1.0, "forwardAxis": "-Z",
    "wheelNodes": ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"],
    "license": "CC-BY-4.0", "author": "…", "allowRecolor": true, "riskRipped": false
  }],
  "circuits": [{
    "circuitRef": "spa", "validFrom": 2007, "validTo": 2021,
    "release": "circuitos-circuit-de-spa-francorchamps-2009-layout",
    "file": "circuit_de_spa_francorchamps_2009_layout.glb",
    "splineId": "spa-2009", "license": "CC-BY-4.0", "riskRipped": false
  }]
}
```

- Cada coche o circuito sin entrada en el manifiesto usa el generador procedural de su era (RF-3D-02).
- Las descargas directas de GitHub Releases no garantizan cabeceras CORS. Los GLB se servirán desde el nginx del despliegue (proxy o copia), con compresión Draco o Meshopt y texturas KTX2.
- Un script de importación normaliza cada GLB, genera los LOD y saca la *spline* de cada circuito a partir del centro de la malla, con revisión manual.

## 5. Requisitos funcionales

Hay 66 requisitos en 10 módulos. Prioridad MoSCoW: M = imprescindible en v1, S = debería, C = podría, W = no en v1. «Base» indica lo que ya existe en el módulo `overcutManager` del backup y solo hay que ampliar.

### 5.1 Partida y temporadas (CAR)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-CAR-01 | El jugador elige temporada de inicio entre las jugables (sección 3.1) y un equipo real de esa parrilla | M | `career.js` |
| RF-CAR-02 | Al elegir temporada se cargan parrilla, pilotos, calendario, reglamento y puntos de ese año desde su pack | M | Parcial: `reference.js` |
| RF-CAR-03 | La partida puede durar una temporada o encadenar temporadas hasta 2026. Las rivales evolucionan hacia su historia real (sección 6.3) | M | `offseason.js` |
| RF-CAR-04 | Modo Escenario: empezar en una carrera concreta con un objetivo (p. ej. ganar Jerez 1997 con Williams) | S | No |
| RF-CAR-05 | Modo Histórico estricto o Libre: en estricto, los resultados de rivales que el jugador no altera se acercan a los reales | S | No |
| RF-CAR-06 | Equipo propio opcional, inscrito como equipo nuevo con presupuesto y rating bajos | C | No |
| RF-CAR-07 | Cinco niveles de dificultad separados para simulación y para gestión, como `Difficulty_RaceSim` y `Difficulty_TeamManagement` | S | No |

### 5.2 Fin de semana (WKD)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-WKD-01 | La máquina de estados del fin de semana se configura por año: número de libres, formato de clasificación y sprint | M | `sessions.js` |
| RF-WKD-02 | Cada sesión se puede jugar en vivo (con 3D) o simular al instante, con resultado reproducible por semilla | M | Parcial |
| RF-WKD-03 | Libres: plan de tandas (vueltas, combustible, neumático), revelación progresiva del setup óptimo por *feedback* del piloto y confianza del piloto (6 niveles) | M | `setup.js` |
| RF-WKD-04 | Setup con ajustes que dependen de la era: alerones, barras, caída, convergencia; altura y *wing* trasero único antes de 1990 si procede | M | 5 ajustes |
| RF-WKD-05 | Asignación de neumáticos por fin de semana según la era, incluida la del proveedor (Goodyear, Bridgestone, Michelin, Pirelli) | M | Parcial |
| RF-WKD-06 | Guardado a mitad de sesión con todo el estado del simulador, como las tablas `Save_*` | S | No |
| RF-WKD-07 | Pantallas post-sesión: resultados, gráfica de vueltas, paradas, clasificaciones y resumen | M | `LapChart`, `Standings` |

### 5.3 Simulación de carrera (SIM)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-SIM-01 | Simulación por pasos de tiempo fijos (p. ej. 0,25 s) sobre la trazada del circuito; la vuelta a vuelta queda como modo rápido | M | Vuelta a vuelta en `race.js` |
| RF-SIM-02 | El ritmo de cada coche sale de sus estadísticas ponderadas por el perfil del circuito (potencia, carga, equilibrado) y de los atributos del piloto | M | `car.js` |
| RF-SIM-03 | Neumáticos: desgaste y temperatura por compuesto, caída de rendimiento (*cliff*), *graining* opcional y gestión en 5 niveles | M | Sí |
| RF-SIM-04 | Combustible: consumo por modo de ritmo, *lift & coast*, peso que cambia el tiempo por vuelta; repostaje activo en 1994–2009 | M | Sí |
| RF-SIM-05 | Energía: sin sistema hasta 2008, KERS 2009 y 2011–2013, ERS 2014–2025, nuevo reparto eléctrico 2026 con modo de adelantamiento manual | M | Parcial |
| RF-SIM-06 | Aire sucio y rebufo por distancia, con efecto distinto por era (alto en 2017–2021, menor desde 2022) | M | Sí |
| RF-SIM-07 | Adelantamiento como duelo en curva: reclamo de curva, tirada con modificadores (diferencia de ritmo, DRS, energía, riesgo, agresividad, defensa) y contraataque | M | Parcial |
| RF-SIM-08 | DRS de 2011 a 2025 con zonas por circuito y regla de 1 s; desactivado con lluvia y en las dos primeras vueltas | M | Sí |
| RF-SIM-09 | Incidentes (trompos, salidas de pista, choques, averías) según control del piloto, fiabilidad, agua en pista y tasa del circuito | M | Sí |
| RF-SIM-10 | Dirección de carrera con amarillas, SC (desde 1993), VSC (desde 2015), bandera roja y sanciones (*drive-through*, *stop-go*, +5/+10 s, parrilla) según la era | M | Parcial |
| RF-SIM-11 | Clima dinámico de 7 estados, agua en pista, temperatura y goma; pronóstico más fiable con mejor instalación | M | `weatherTimeline` |
| RF-SIM-12 | Parada en boxes por etapas con tiempo según el *pit crew*, posibles errores, y repostaje en las eras con repostaje | M | Parcial |
| RF-SIM-13 | IA estratega para cada rival: plan A–F antes de la carrera, recalculo con SC, lluvia o daños, y *undercut*/*overcut* | M | `strategyCall` |
| RF-SIM-14 | Fiabilidad por componente y desgaste acumulado entre carreras, con límites de unidades según la era | S | Parcial |
| RF-SIM-15 | Resultado determinista: misma semilla y mismas órdenes dan el mismo resultado | M | `rng.js` |

### 5.4 Órdenes en carrera (CMD)

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-CMD-01 | Órdenes por piloto en cualquier momento: ritmo (5 niveles), modo de energía (solo si la era tiene ERS/KERS), *lift & coast*, riesgo de adelantamiento, estilo de defensa, aire limpio, evitar pianos, dejar pasar o retener al compañero | M |
| RF-CMD-02 | Pedir, cambiar o cancelar parada: neumático, alerón delantero, combustible en eras de repostaje, retrasar una vuelta | M |
| RF-CMD-03 | Radio del ingeniero con avisos de *undercut*, lluvia, daños y gaps, filtrable por importancia | S |
| RF-CMD-04 | Velocidad de simulación ×1, ×2, ×4, ×8, ×16 y saltar al siguiente evento relevante | M |

### 5.5 Coche e I+D (CAR-DEV)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-DEV-01 | El coche se describe con piezas por era (alerón delantero y trasero, chasis, pontones, suelo, suspensión, motor, caja y, desde 2014, ERS), cada una con estadísticas | M | 4 bloques en `car.js` |
| RF-DEV-02 | Ciclo diseño → fabricación → montaje, con coste, días, ritmo de desarrollo (Normal, Acelerado, Intenso, Emergencia) y unidades limitadas | M | No |
| RF-DEV-03 | *Expertise* por equipo, pieza y estadística que crece al diseñar, como `Parts_TeamExpertise` | S | No |
| RF-DEV-04 | Recursos aerodinámicos (túnel, CFD) limitados por posición solo desde 2021; antes, limitados solo por dinero y por la prohibición de test cuando aplique | M | No |
| RF-DEV-05 | Proveedor de motor: equipos cliente compran motor con coste anual y no desarrollan esa pieza | M | No |
| RF-DEV-06 | Proyecto del coche del año siguiente que compite por recursos con el actual; más peso en años de cambio de reglamento | S | No |
| RF-DEV-07 | Reducción de estadísticas por cambio reglamentario real al cambiar de era (p. ej. −30 % de carga en 2009) | M | No |
| RF-DEV-08 | Daño por pieza en 4 estados (perfecto, leve, grave, destruido) que exige repuesto | S | No |

### 5.6 Personal y mercado (STF)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-STF-01 | Cinco roles: piloto, director técnico, jefe de aerodinámica, ingeniero de carrera y director deportivo, con atributos propios del rol | M | `market.js` |
| RF-STF-02 | Pilotos con 9 atributos (paso por curva, frenada, control, suavidad, adaptabilidad, adelantamiento, defensa, salida, precisión) más agresividad, potencial y valor comercial | M | Parcial |
| RF-STF-03 | Ratings iniciales de cada piloto real derivados de sus resultados históricos y del compañero, nunca inventados a mano | M | `attributes.js` |
| RF-STF-04 | Contratos con salario, bonus, duración, cláusula de salida y rol (n.º 1, n.º 2, reserva); negociación con paciencia del agente | M | `Negotiation` |
| RF-STF-05 | Moral por eventos (resultados, fichajes, retiradas) con decaimiento, como `Staff_Mentality_*` | S | No |
| RF-STF-06 | Pilotos nuevos que entran en el año en que debutaron en la realidad; jubilaciones en su año real en modo estricto | M | `world.js` |
| RF-STF-07 | *Pit crew* con entrenamiento, foco y fatiga | C | No |
| RF-STF-08 | Ojeo de pilotos de categorías inferiores con precisión creciente | C | No |

### 5.7 Instalaciones (HQ)

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-HQ-01 | Edificios con nivel 1–5, coste y tiempo de mejora, mantenimiento y degradación: fábrica, centro de diseño, túnel, CFD (desde finales de los 90), simulador, centro meteorológico, hospitality | S |
| RF-HQ-02 | Cada edificio aplica efectos medibles (velocidad de diseño, capacidad de fabricación, precisión del pronóstico, ingresos) | S |
| RF-HQ-03 | Nivel inicial de cada equipo según su tamaño real en el año de inicio | S |

### 5.8 Finanzas, patrocinio y junta (FIN)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-FIN-01 | Presupuesto por categorías (salarios, desarrollo, instalaciones, motor, incidentes, varios) con transacciones auditables | M | `economy.js` |
| RF-FIN-02 | Techo de gasto solo desde 2021, con el importe de cada año; antes, presupuesto libre según el tamaño del equipo | M | No |
| RF-FIN-03 | Ingresos por premios según la posición de constructores, patrocinadores con bonus por objetivo y venta de motores | M | Parcial |
| RF-FIN-04 | Junta con confianza que sube o baja según el resultado frente a lo esperado, objetivos por rating y despido del jugador si la confianza llega a cero | M | `board.js` |
| RF-FIN-05 | Patrocinadores ficticios o genéricos por defecto; los reales solo con un pack de datos aportado por el usuario | M | No |

### 5.9 Narrativa y bandeja (INB)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-INB-01 | Bandeja de correo con avisos, decisiones (dilemas) y efectos tipados (dinero, moral, confianza, plazos) | M | `inbox.js` |
| RF-INB-02 | Eventos históricos del año como correos o noticias en su fecha (sección 6) | M | `events.js` |
| RF-INB-03 | Votación de reglamento solo en modo Libre; en modo estricto el reglamento siguiente es el real | S | No |

### 5.10 Presentación 3D (3D)

| ID | Requisito | Prioridad | Base |
| --- | --- | --- | --- |
| RF-3D-01 | Cargar GLB de coche y circuito desde GitHub Releases según un manifiesto propio (sección 4.3), con caché local | M | No |
| RF-3D-02 | Si no hay GLB para un equipo y año, usar el coche procedural de su era con la librea del equipo; si no hay GLB de circuito, usar el trazado procedural | M | `carModel.js`, `trackScene.js` |
| RF-3D-03 | Alinear la trazada de simulación con la malla GLB del circuito mediante una *spline* calibrada por circuito y versión | M | No |
| RF-3D-04 | Cámaras TV, persecución, *onboard* y helicóptero; mapa 2D en vivo como alternativa sin 3D | M | `cameras.js` |
| RF-3D-05 | Escalado, orientación y ruedas de cada GLB normalizados por metadatos (escala, eje delantero, nodos de rueda) | M | No |
| RF-3D-06 | Showroom de la temporada con los coches disponibles y su procedencia y licencia | S | `Showroom.js` |

## 6. Coherencia histórica

Cada temporada se carga desde un pack de datos versionado. El pack fija lo que no puede cambiar (inscritos, calendario, reglamento, puntos) y propone lo que sí puede cambiar (resultados, fichajes). Sin pack validado, una temporada no se puede jugar.

### 6.1 Tres niveles de ancla

| Nivel | Qué incluye | Comportamiento |
| --- | --- | --- |
| **Fijo** | Equipos y pilotos inscritos en cada GP, motores, calendario con fechas, carreras canceladas (p. ej. Imola 2023), reglamento técnico y deportivo, puntos, proveedor de neumáticos | El jugador no puede alterarlo en ningún modo |
| **Guiado** | Rendimiento relativo de los coches por carrera, evolución de los rivales durante el año, fichajes y retiradas de pilotos rivales | En modo estricto la simulación tiende a la realidad; en Libre solo marca el punto de partida |
| **Libre** | Resultados del equipo del jugador y sus consecuencias, contratos del jugador, dilemas | Lo decide el jugador; cada desviación de la historia se guarda en un registro |

**Regla de sensibilidad (RF-HIS-00, M).** Los accidentes mortales reales (por ejemplo Imola 1994) nunca se simulan ni se usan como evento de juego. Aparecen solo como nota histórica sobria en la fecha. La parrilla de las carreras siguientes es la inscripción real.

### 6.2 Parámetros por era

Valores de memoria. Cada uno se verificará contra el reglamento FIA de su año al construir el pack.

| Años | Motor | Energía | Neumáticos | Repostaje | Clasificación | Puntos | Ayudas de carrera |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1976 | 3.0 atmosférico (1,5 turbo permitido) | — | Slicks, Goodyear | No | Dos sesiones, mejor tiempo | 9-6-4-3-2-1, solo cuentan algunos resultados; constructores: mejor coche | — |
| 1986–1988 | 1,5 turbo (1986); turbo con límite y atmosféricos (1987–1988) | — | Slicks, Goodyear (Pirelli hasta 1986) | Prohibido desde 1984 | Dos sesiones | 9-6-4-3-2-1, mejores 11 de 16 | — |
| 1990 | 3.5 atmosférico | — | Slicks | No | Dos sesiones | 9-6-4-3-2-1, mejores 11 | — |
| 1991–1993 | 3.5 atmosférico; ayudas electrónicas hasta 1993 | — | Slicks, Goodyear | No | Dos sesiones | 10-6-4-3-2-1, cuentan todos | SC oficial desde 1993 |
| 1994–1997 | 3.5 (1994), 3.0 (desde 1995) | — | Slicks; Bridgestone entra en 1997 | Sí | Una hora, 12 vueltas (desde 1996) | 10-6-4-3-2-1 | SC |
| 1998–2002 | 3.0 V10 | — | Ranurados; guerra Bridgestone–Michelin desde 2001 | Sí | Una hora, 12 vueltas | 10-6-4-3-2-1 | SC; órdenes de equipo prohibidas desde 2002 |
| 2003–2005 | 3.0 V10, un motor por fin de semana (2004) y dos por GP en 2005 | — | Ranurados; sin cambio de ruedas en carrera en 2005 | Sí | Vuelta única (2005: agregada y luego única) | 10-8-6-5-4-3-2-1 | SC; *parc fermé* |
| 2006–2008 | 2.4 V8 | — | Ranurados; Bridgestone único desde 2007; dos compuestos obligatorios | Sí | Eliminatoria Q1–Q3 con combustible de carrera en Q3 | 10-8-6… | SC |
| 2009 | 2.4 V8, 8 motores por año | KERS opcional | Slicks, Bridgestone | Sí | Q1–Q3 | 10-8-6… | SC; difusor doble |
| 2010 | 2.4 V8 | — | Slicks, Bridgestone | **No** | Q1–Q3, top 10 sale con neumático de Q2 | 25-18-15-12-10-8-6-4-2-1 | SC |
| 2011–2013 | 2.4 V8 | KERS | Pirelli | No | Q1–Q3 | 25-18… | SC, **DRS** |
| 2014–2016 | 1.6 V6 turbo híbrido | ERS (MGU-K + MGU-H) | Pirelli | No | Q1–Q3 | 25-18…; dobles en la última de 2014 | SC, DRS, **VSC desde 2015** |
| 2017–2021 | V6 híbrido; coches más anchos | ERS | Pirelli, más anchos | No | Q1–Q3 | 25-18… + 1 por vuelta rápida (2019–2024) | SC, VSC, DRS; *halo* 2018 |
| 2021 | V6 híbrido | ERS | Pirelli | No | Q1–Q3 + 3 sprints (3-2-1) | +VR | Techo de gasto 145 M USD; reparto de túnel/CFD por posición |
| 2022–2025 | V6 híbrido; efecto suelo | ERS | Pirelli 18" | No | Q1–Q3; sprints (3 en 2022, 6 desde 2023 con *shootout*) | 25-18…; sprint 8-7-…-1; sin punto de VR desde 2025 | Techo 140 M USD (2022), 135 M USD (2023+); DRS |
| 2026 | Nueva unidad 50 % eléctrica, combustible sostenible | Modo de adelantamiento manual | Pirelli, más estrechos | No | Q1–Q3, 6 sprints | 25-18… | Aero activa en lugar de DRS; techo nuevo (cifra por verificar) |

### 6.3 Pack de temporada

| Contenido | Fuente | Formato |
| --- | --- | --- |
| Inscritos por GP: equipo, chasis, motor, pilotos y dorsales, incluidos cambios a mitad de año (Arrows se retira en 2002, Super Aguri tras 4 GP en 2008) | f1db, `career_lineups.json` | JSON por año |
| Calendario con fecha, circuito, versión del trazado, vueltas, distancia y tipo de fin de semana | f1db, `reference.js` | JSON por año |
| Reglamento: parámetros de la tabla 6.2 como claves cerradas (`refuelling`, `energySystem`, `drs`, `vsc`, `qualiFormat`, `pointsScheme`, `budgetCap`, `tyreSupplier`, `unitLimits`) | Reglamentos FIA | JSON validado con esquema |
| Rendimiento real por carrera: posición media de clasificación por equipo, para calibrar el rendimiento y guiar a los rivales | f1db | Serie por carrera |
| Ratings iniciales de pilotos y equipos | Derivados por script de resultados, comparación con el compañero y fiabilidad | JSON generado |
| Eventos del año con fecha y nivel de ancla | Curados a mano con fuente | JSON con enlace de fuente |
| Assets: GLB de coche por equipo (o procedural), GLB de circuito por versión (o procedural), librea base | `f1-3d-assets`, `carModel.js` | Manifiesto (sección 4.3) |

### 6.4 Ejemplos de eventos por temporada

| Temporada | Evento | Nivel | Tratamiento |
| --- | --- | --- | --- |
| 1976 | Accidente de Lauda en Nürburgring; vuelve en Monza; Hunt campeón en Fuji con lluvia | Fijo (ausencia de Lauda en Austria y Holanda) / Guiado (título) | Correo y noticia; parrilla real por GP |
| 1988 | McLaren gana 15 de 16 | Guiado | El rendimiento de MP4/4 se calibra a ese nivel |
| 1994 | Imola; descalificaciones de Benetton; final de Adelaida | Fijo / Guiado | Regla de sensibilidad para Imola |
| 1997 | Jerez: colisión Schumacher–Villeneuve y exclusión del campeonato | Guiado | Solo se aplica si se reproduce la situación |
| 2005 | Indianápolis: solo 6 coches con Bridgestone salen | Fijo | Los equipos Michelin no salen, juegue quien juegue |
| 2007 | McLaren excluido del Mundial de Constructores (caso de espionaje) | Fijo en modo estricto | Puntos de constructores de McLaren a 0 |
| 2009 | Brawn GP y el difusor doble | Guiado | Ventaja inicial de Brawn en el pack |
| 2020 | Calendario por la pandemia: 17 GP con sedes nuevas | Fijo | Calendario real |
| 2021 | Abu Dabi y su reinicio | Guiado | Solo como contexto si llega la situación |
| 2026 | Audi y Cadillac entran; Madrid en el calendario | Fijo | Parrilla de 11 equipos y GP de Madrid con trazado procedural |

### 6.5 Evolución entre temporadas

- Al cerrar una temporada, se carga el pack del año siguiente. Los rivales toman los pilotos reales salvo los que el jugador haya fichado, y el hueco lo ocupa el siguiente candidato real del mercado.
- El rendimiento de los rivales se mezcla: `estado_simulado × (1 − k) + estado_real × k`, con k = 0,6 en estricto y 0,2 en Libre. El valor exacto de k se fija en las pruebas de balance.
- El equipo del jugador conserva su estado simulado. Si cambia la era, se aplican las reducciones reglamentarias (RF-DEV-07).
- Cada desviación relevante (otro campeón, un piloto en otro equipo) se registra y se muestra en una línea temporal de «historia alternativa».

## 7. Calidad, aceptación, riesgos y entrega

### 7.1 Requisitos no funcionales

| ID | Requisito | Medida |
| --- | --- | --- |
| RNF-01 Rendimiento sim | Una carrera completa simulada al instante en un portátil medio | ≤ 2 s para 22 coches y 70 vueltas, en un Web Worker |
| RNF-02 Rendimiento 3D | Vista en vivo fluida | ≥ 50 fps a 1080p con 22 coches en LOD medio; ≥ 30 fps en móvil con LOD bajo |
| RNF-03 Peso de assets | Descarga razonable por GP | ≤ 60 MB por circuito y ≤ 8 MB por coche tras pasar los GLB por Draco/Meshopt y texturas KTX2 (MCL39: 116 MB de origen) |
| RNF-04 Caché | Reabrir un GP no vuelve a descargar | Cache Storage o IndexedDB con versión por hash del manifiesto |
| RNF-05 Determinismo | Reproducibilidad | Misma semilla y órdenes dan una salida idéntica byte a byte; test automático |
| RNF-06 Guardado | Persistencia fiable | Autoguardado local en cada fase; código de guardado en servidor (`CareerModeSave`, MEDIUMBLOB) con versión de esquema y migraciones |
| RNF-07 Datos | Equilibrio fuera del código | Ningún valor de balance escrito en código; todo en packs con esquema JSON |
| RNF-08 Idiomas | ES y EN desde v1 | Todo texto por `react-intl`; nombres reales sin traducir |
| RNF-09 Accesibilidad | Legible sin 3D | Mapa 2D y tablas de tiempos equivalentes; colores de equipo con contraste suficiente |
| RNF-10 Compatibilidad | Navegadores | Chrome, Edge, Firefox y Safari en sus dos últimas versiones; WebGL2 obligatorio |
| RNF-11 Pruebas | Cobertura del motor | ≥ 80 % de líneas en `engine/`; extender `manager.test.js` y `circuits.test.js` |

### 7.2 Criterios de aceptación

- [ ] Cada temporada jugable carga su pack y pasa la validación de esquema sin errores.
- [ ] Para cada temporada, 1.000 simulaciones en modo estricto sin intervención dan al campeón real como campeón más probable de constructores en al menos el 70 % de los años.
- [ ] La correlación de Spearman entre el orden simulado de constructores y el real es ≥ 0,8 de media.
- [ ] Ninguna carrera muestra un equipo o piloto que no estuviera inscrito ese GP ni una regla fuera de su era (p. ej. DRS en 2008 o repostaje en 2012). Lo comprueba un test que recorre todas las temporadas.
- [ ] Todo GP con GLB de circuito tiene una *spline* calibrada, con desviación ≤ 2 m respecto al centro de la malla.
- [ ] Todo equipo de cada temporada tiene coche visible: GLB o procedural con su librea.
- [ ] El showroom muestra autor y licencia de cada GLB usado.

### 7.3 Riesgos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Marcas de F1, equipos y pilotos reales | Alto si se monetiza | Uso no comercial; aviso de no afiliación; patrocinadores genéricos; packs de nombres reales separados y opcionales |
| Circuitos *ripped* de otros juegos | Alto | Indicador `riskRipped` por asset y exclusión automática en una build pública |
| GLB CC BY-ND recoloreados | Medio | Bloquear el recoloreado de esos GLB en el cargador |
| Coches sin atribución | Medio | Completar `ATTRIBUTION.txt` en `coches/` antes de publicar |
| Cobertura de coches baja fuera de 2002–2012 | Medio | Coche procedural por era como práctica normal, no como excepción |
| Diferencia entre `OverCut` y el backup | Alto | Integrar primero el commit `0748b33` en el repo principal (fase 0) |
| Ingeniería inversa del juego de referencia | Bajo | Solo se toman ideas de diseño y la estructura de datos; ningún asset, texto ni código de F1 Manager 24 entra en OverCut; no se descifran sus paquetes |

### 7.4 Fases de entrega

1. **Fase 0, integración.** Llevar el módulo `overcutManager` del backup al repo principal y dejar los tests en verde.
2. **Fase 1, datos.** Esquema de pack, generador desde f1db y validador; packs de 2012, 2008 y 2005, las tres temporadas con más GLB.
3. **Fase 2, assets.** Manifiesto, cargador GLB con caché y LOD, normalización de coches, *spline* calibrada para 10 circuitos.
4. **Fase 3, simulación.** Simulación por pasos (RF-SIM-01), adelantamiento en curva, dirección de carrera por era, energía por era.
5. **Fase 4, gestión.** Ciclo de piezas, *expertise*, instalaciones, techo de gasto y junta.
6. **Fase 5, cobertura.** Packs de todas las temporadas jugables, eventos históricos y validación estadística (7.2).
7. **Fase 6, pulido.** Radio, cinemáticas, línea temporal de historia alternativa y escenarios.
