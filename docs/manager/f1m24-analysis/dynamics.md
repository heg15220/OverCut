# Dinámica en pista: F1 Manager 24, Bahrain (carrera 55:00–124:32 + salida de boxes en libres)

Clave: `dynamics`. Todo lo que es número leído o medido en el vídeo es **"observado en el juego"** y vale solo como referencia. La calibración de OverCut tiene que salir de datos reales (FIA, OpenF1, f1db). Los valores reales que pongo son aproximados, salvo los que marco como reglamento. Los de memoria están marcados con *(verificar en OpenF1)*.

Ficheros de trabajo en `C:/Users/hugoe/AppData/Local/Temp/claude/f96a86a4187a3fa3/ca0f17ed-6bb4-4ef9-b0f3-3638380e9349/scratchpad/f1m/work/dynamics/`:
- Perfil de velocidad: `speed_profile_bahrain_minimap.csv`
- Mapa coloreado por velocidad: `speedmap.png`
- Posición del marcador del minimapa a 10 Hz: `race_mm.csv`
- Scripts: `track_mm.py`, `centerline.py`, `speed.py`, `corners.py`

## 1. Método (lo que permite medir)

| Fuente | Qué se obtiene | Limitaciones |
|---|---|---|
| **Minimapa del HUD**. Seguí el marcador grande del coche enfocado a 10 Hz (centroide del blob rojo Ferrari, unas 90 px²) desde 56:10 hasta el final. Hay 41 000 muestras y el 60 % son válidas | Con todas las posiciones reconstruí la línea central del trazado: 420 px de perímetro, escalados a 5412 m, o sea **12,9 m/px**. Cada muestra se proyecta sobre esa línea para obtener s(t). La velocidad es ds/dt con Savitzky‑Golay (ventana de 0,7 / 1,1 / 2,1 s). El perfil se agrega como mediana por tramos de 10 m sobre todas las pasadas a 1x | El suavizado y la interpolación del marcador **aplanan los picos**: las deceleraciones salen bajas (1,6–2 g frente a 4–5 g reales) y los mínimos dependen del método. El minimapa es esquemático, así que puede haber un error de escala local de ±10 %. Cuando el foco salta entre LEC y SAI (los dos marcadores son rojos) aparecen saltos, que filtro |
| **Validación de escala** | El tiempo de vuelta que implica el perfil mediano es **95,4 s**. Encaja con la vuelta de carrera típica del juego y con la vuelta rápida que muestra el banner (HAM 1:35.778 a 1:22:57, alta) | — |
| **Velocidad de simulación** | En las cámaras de TV y onboard el control inferior marca **1x** (5605, 5925, 3525 s). En la vista 3D del circuito marca **4x** (3605 y 6786 s, alta). Lo confirman los cronómetros de boxes: el contador avanza 11,52 s en 11,5 s de vídeo. Las vueltas medidas son, por tanto, a 1x. Avance de vueltas: L5 a 3750 s, L24 a 5045, L47 a 6655, L54 a 7256. El vídeo resume 57 vueltas en unos 68 min porque mucho del tiempo pasa en la vista 3D a 4x | — |
| **Pantalla del volante (onboard)** | Con la cámara de cabina desde fuera del casco, la marcha se lee bien: **7→8 a 1:52:32 (6752 s), en la recta principal a unos 280–300 km/h** (alta). Con la cámara de casco tipo T no se lee (360p) | La velocidad del volante **no se lee** |

## 2. Velocidad por curva (carrera, 1x, vueltas limpias)

Origen de s: la recta principal, unos 315 m antes del vértice de T1. El "mín" va como mediana del perfil y, entre corchetes, el mínimo mediano por pasada. El valor real está entre ambos porque el perfil infla los mínimos y la pasada los subestima por ruido. La salida es la velocidad 150 m después del vértice.

| Curva (s vértice) | Entrada km/h | Mín km/h | Salida +150 m | Inicio frenada (antes del vértice) | Método / n | Conf. | Real aprox. *(verificar)* |
|---|---|---|---|---|---|---|---|
| T1 horquilla dcha. (315) | 300–311 | **68** [45] | 186 | ~105 m, unos 3 s | minimapa, n=363 / 8 pasadas | media | mín ~80–90 |
| T2–T3 (400–550) | — | 147 → 210 (enlazadas) | 230–250 | — | minimapa | media | T3 ~200+ |
| T4 dcha. (1125) | 289–312 | **112** [86] | 203 | ~170–195 m | n=256 / 12 | media‑alta | ~115–125 |
| T5 (1250–1400) | 230 | 220–233 | — | sin frenada | perfil | media | ~230–250 |
| T6–T7 enlazadas (1505) | 239 | **192** | 227 | ligera, 110 m | n=121 | media | ~180–200 |
| T8 horquilla dcha. (1825) | 255–284 | **83** [57] | 178 | ~130–195 m | n=174 / 5 | media | ~95–100 |
| T9–T10 izq. (2295) | 236–247 | **75** [51] | 220 | ~130–145 m | n=186 / 5 | media | ~85–100 |
| T11 izq. (3045) | 293–297 | **142** [120] | 218 | ~150–210 m | n=184 / 6 | media | ~150–160 |
| T12 curva larga rápida (3150–3550) | 260 | **215–245** (sin frenada clara) | 245–262 | levantar pie | perfil | media | ~250–270 |
| T13 dcha. (3695) | 265–269 | **131** [116] | 206 | ~135–240 m | n=162 / 7 | media | ~125–135 |
| T14 dcha. (4515) | 296–316 | **120** [104] | 218 | ~150–205 m | n=148 / 1 | media | ~105–115 |
| T15 (4550–4600) | — | 148 → 177 (aceleración) | 204 | — | perfil | media | ~150 |
| Recta principal, punta (4900 → 130) | — | **mediana 303–313**, p85 336–359 | — | — | perfil | media (el p85 lo infla el ruido) | ~315–325 de trampa *(verificar)* |
| Recta T3→T4, punta (~900–1000) | — | 281–289 | — | — | perfil | media | ~300 |
| Recta T10→T11, punta (~2800–2900) | — | 281–293 | — | — | perfil | media | ~290–300 |

Aceleraciones (perfil mediano):
- Salida de T1: 68 → 158 km/h en 100 m, 209 en 200 m, 246 en 300 m y unos 285 a 500 m.
- Salida de T10: 75 → 165 en 100 m, 219 en 150 m.
- Salida de T14: 120 → 192 en 100 m, 233 en 200 m.

Tiempos de tramo: T14 → recta principal (700 m) en 9,75 s de mediana (n=12). Entre el principio de la carrera (<4700 s, 10,10 s) y el final (>6500 s, 9,60 s) baja unos 0,5 s; atribuible a combustible y goma (baja confianza).

**Para OverCut:** el patrón cualitativo sí sirve. Hay tres horquillas lentas (T1, T8, T10) a 70–90 km/h, curvas medias (T4, T11, T13, T14) a 110–145 y tramos rápidos sin frenada (T5–T7, T12) a 190–260. Los números absolutos hay que sacarlos de OpenF1 `car_data` (speed, n_gear, brake) de Bahrain 2024, no de esta tabla.

## 3. Salida, frenadas y trazada (visto en cámaras de TV)

- **Salida (lap 1):** los semáforos se apagan hacia las **56:31 (3391,5 s ±0,5)**. LEC (P2) pasa de 0 a unos 120 km/h en ~2 s y a 180–190 en ~4 s. Llega a unos 240 km/h antes de frenar para T1 en 3401 s. El vértice de T1 está a **unos 11,5 s del apagado**. En la primera vuelta, el mínimo en T1 es de solo ~30–60 km/h por el tráfico (baja).
- **Trazada:** en las tomas de TV (5459–5480 s y 6666–6678 s, media) los coches abren hacia el exterior antes de la frenada, cortan al vértice pisando el piano interior y salen usando el piano exterior. En las rectas suelen ir por un lado de la pista; en la recta principal, por el lado del muro de boxes. En las secuencias que vi, la trazada es estable y sin ruido lateral: parece un spline fijo con desvíos solo cuando hay batalla.
- **Frenada:** desde fuera no se ven luces ni chispas (sin chispas visibles a 360p, baja). El dato que hay es el del minimapa: deceleración aparente de 1,6–2,0 g. **Es un artefacto del suavizado**, no el valor real; para F1 se usan 4–5 g de pico.

## 4. Coches cerca: seguimiento, lado a lado y adelantamiento

Secuencia medida: SAI y PER en la recta principal → T1, de 1:30:59 a 1:31:16 (5459–5476 s). Los fotogramas están en `ov_5459.png`, `side.png` y `ov_5468.png`.

| t | Lo que se VE | Conf. |
|---|---|---|
| 5460–5463 | El coche de detrás va **justo en la estela**, a unos 2–3 largos (≈11–17 m). Cuando no hay batalla mantiene la misma línea | alta |
| 5463,5–5465 | Sale de la estela con un **desplazamiento lateral de ~1 ancho de coche (≈2 m)** en unos 1,5 s y se pone a la par en la frenada de T1 | alta |
| 5466–5468 | En T1 van **lado a lado**: el atacante por dentro y el defensor por fuera, solapados ~½ coche y con **un hueco lateral de unos 0,3–0,7 m**. No hay contacto ni piezas sueltas. En el vértice, desde esa cámara, las siluetas parecen tocarse; lo atribuyo a la perspectiva (baja) | media |
| 5468–5476 | En la salida de T1–T3, el coche de fuera (McLaren) vuelve a pasar por delante. Aparecen la notificación de posición perdida y un banner superior con quién adelanta a quién (≈5476). Después, el perdedor se queda a **1–2 largos, desplazado a un lado**, en la recta hacia T4 | alta |

**Lo que deduzco (inferido):**
- Hay una "burbuja" por coche que nunca se atraviesa. Cuando el de atrás llega a la distancia mínima, se va hacia la estela o hacia un carril lateral de ~1 ancho.
- Lado a lado se reserva una holgura lateral de ≥0,3 m y en el vértice el de fuera cede.
- El adelantamiento se decide en la zona de frenada o en la salida, y se confirma con el cambio de posición en la torre y el banner.
- No vi ningún contacto en todo el tramo de carrera revisado.

## 5. Boxes: velocidad en el pit lane

| Evento | Entrada (vídeo) | Llegada al box | Parado | Salida (fin del cronómetro) | Tiempo en el pit lane | Velocidad en el pit lane |
|---|---|---|---|---|---|---|
| SAI, parada | ≈6343 s (1:45:43) | ≈6356 s (cronómetro ~12,9 s) | **2,627 s** (marcador rojo) | ≈6371 s | **28,152 s** | 81 km/h (203 m en 9 s, minimapa) |
| LEC, parada | ≈6498 s (1:48:18) | ≈6510,5 s (cronómetro ~12,5 s) | **≈2,8 s** (el último dígito no se lee) | ≈6526 s | **28,374 s** | 80 km/h (134 m en 6 s antes del box) |
| SAI, parada (1:25:4x) | ≈5148 s | ≈5157 s | ~5 s parado en el minimapa | ≈5175 s | — | 72–90 km/h |
| Libres: salida del garaje | 13:21 (801,5 s) | — | — | 13:33 (813,5 s, "saliendo del pit lane") | — | **83 km/h**: alcanza el límite en ~1 s y va estable (278 m en 12 s) |

- Comportamiento: entra a velocidad limitada y constante, decelera en los últimos ~20 m hasta el box y se queda parado unos 2,6–2,8 s. Luego acelera al límite en ~1 s y lo mantiene hasta la línea de salida. Esa línea queda en s≈5380, ~350 m antes del vértice de T1 en la proyección del minimapa. Desde ahí acelera a 130–200 km/h antes de llegar a T1 (alta).
- El cronómetro del pit lane avanza durante todo el recorrido y, al parar, muestra el tiempo parado en rojo. El total queda fijo unos segundos al salir (alta).
- **Reglamento real:** límite de **80 km/h** en Bahrain 2024 (FIA). El juego lo respeta: medí 80–83 km/h, con un error de escala de ±5 %.
- **Real aprox.** *(verificar en OpenF1 `pit`)*: unos 2,3–2,6 s parado en Ferrari y unos 23–25 s de pit lane. Los 28,2–28,4 s del juego parecen algo largos; habría que confirmar en OpenF1 si el cronómetro del juego cuenta lo mismo.

## 6. Banderas, safety car / VSC, errores y daños

- **SC y VSC: no aparecen** en 55:00–124:32. Revisé la cabecera de la torre a 1 Hz durante toda la carrera (detección de color, con los falsos positivos de vallas comprobados a mano) y todos los mosaicos. Por eso no hay velocidades ni delta bajo SC/VSC que dar. Lo que sí hay son **dos banderas amarillas locales**:
  1. **58:08–58:27 (3488–3507 s), vuelta 1→2, sector 3.** La cabecera de la torre se vuelve amarilla y va alternando el texto entre la bandera, el sector y la vuelta. Coincide con un aviso de trompo de un rival (~3510 s, media).
  2. **1:44:29–1:44:34 (6269–6274 s), vuelta 41, sector 1.** Es el trompo de OCO, anunciado con un banner superior. Luego viene una repetición: transición con el logo y el rótulo de repetición. El coche gira con humo de neumáticos y se sale a la escapatoria asfaltada. Sigue una toma de la reacción del equipo en el garaje y otra transición con logo de vuelta al directo (6280–6300 s). No hay daños visibles, ni piezas, ni SC (alta).
- Otros errores: notificaciones de bloqueo de rueda y de trompo de rivales (≈3510, 3565, 3600 s). Hay repeticiones cortas de otros coches (~5250 s con cámara de cabina NOR; ~5515 s GAS), sin daños visibles (media).
- **Daños:** no vi en ningún momento alerones rotos, ruedas sueltas ni humo de motor (alta para el tramo revisado).

## 7. Notas para el diseño de OverCut (deducidas)

1. Velocidad en pista: perfil v(s) por circuito con mínimos por curva y aceleración y frenada limitadas por la física. Calibrar con OpenF1 `car_data` (Bahrain 2024) y escalar por neumático, combustible y modo de ritmo. El juego da unos 0,5 s por tramo entre el principio y el final de carrera.
2. Pit lane: estado propio con velocidad fija igual al límite FIA del evento (80 km/h), una rampa corta de ~1 s, la parada (cronómetro con lo que dura la parada en rojo) y el cronómetro total del pit lane. Tiempo de simulación siempre a 1x en la vista de cámara.
3. Interacción entre coches: distancia mínima longitudinal, carril de estela y carril lateral de ~1 ancho para atacar. Holgura lateral ≥0,3 m lado a lado, cesión en el vértice y nunca solapamiento de geometría.
4. Incidentes: bandera amarilla local por sector (la cabecera de la torre cambia de estado), banner, repetición con transición, toma del garaje y vuelta al directo. SC y VSC quedan pendientes de otra fuente porque aquí no aparecen. Para el delta del VSC y la velocidad del SC hay que usar el reglamento FIA y OpenF1 `race_control`.
5. Velocidad de simulación: el jugador usa la vista 3D a 4x y la cámara a 1x. La física tiene que ser independiente del multiplicador.

## 8. No visto / no medible
- SC, VSC y su velocidad o delta.
- Velocidad del volante (ilegible).
- Daños y contacto entre coches.
- Frenada real en g (el minimapa la suaviza).
- Último dígito del tiempo parado de LEC (≈2,8 s).
