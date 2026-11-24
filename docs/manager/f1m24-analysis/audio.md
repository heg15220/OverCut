# F1 Manager 24 (Bahrein) — análisis de audio

Alcance: el vídeo completo, sobre todo la carrera (55–124 min). Fuente: la pista estéreo original (AAC 44,1 kHz, 128 kb/s) y el mono de 22 kHz ya preparado. **No se ha exportado ningún clip de audio**: en `work/audio/` solo hay PNG (espectrogramas y fotogramas), arrays .npy/.npz y scripts.
Solo tomamos estructura y comportamiento. Todos los números son medidas "observadas en el juego" y sirven **solo de referencia**. La calibración de OverCut debe salir de datos reales (FIA, OpenF1).

Grados de fiabilidad: **A** = medido y repetido muchas veces, coherente; **B** = medido pero depende de una interpretación; **C** = indicio o inferencia.

## 0. Método y advertencias
- `audio_frames.csv`/`shift_events.csv` (los ficheros preparados) **no son fiables para el tono**. Su f0 sale cuantizado en saltos de unos 5,4 Hz y salta entre armónicos. No los he usado para cifras.
- He usado tres trazadores propios (scripts `work/audio/*.py`):
  1. Un "comb tracker": suma armónica de 24 órdenes sobre ventanas de 100 ms cada 25 ms. Da la frecuencia de ciclo `c` del peine del motor.
  2. Un Viterbi sobre la línea dominante (3·c).
  3. Una correlación en espectro log-frecuencia que mide la razón de tono antes y después de cada evento. No depende del armónico que se siga.
- Los planos onboard se detectaron por saliencia armónica y se verificaron con fotogramas:
  - 66:25–70:00 McLaren (cockpit)
  - 71:15–73:10 Ferrari (T-cam)
  - 76:00–79:50 Ferrari (cockpit)
  - 81:40–82:20 Ferrari (cámara lateral del halo)
  - 89:45–90:55 Ferrari y McLaren
  - 116:05, 120:00–121:00 Ferrari (T-cam)
  - En la clasificación: 36–37 min Red Bull; 39 y 43–44 min Ferrari.

## 1. Motor: estructura del sonido (A)
- El sonido es un **peine armónico con separación `c`**. Las líneas más fuertes son 3c, 6c y 9c (y 15c).
  - Ejemplo en recta, 76:51: 288 / 576 / 864 Hz con c = 96 Hz.
  - Ejemplo en vértice, 76:56: 167 / 337 / 503 / 837 Hz con c = 55,8 Hz.
- Interpretación (B): `c` = frecuencia de ciclo = rpm/120 (un ciclo de 4 tiempos cada 2 vueltas).
  - La **frecuencia de encendido** del V6 es 6c = rpm/60·3 = rpm/20.
  - La línea fuerte 3c (rpm/40) es la "media frecuencia de encendido" por bancada.
  - Si se tomara 3c (≈290 Hz) como fundamental con f = rpm/60·3, saldrían unas 5.800 rpm a fondo en recta, lo que no es plausible. Con 6c se obtienen unas 11.500 rpm, que es coherente con la F1 real.

| Magnitud (onboard en carrera, 9 tramos, 42.800 frames válidos) | `c` (Hz) | 3c (Hz) | Encendido 6c (Hz) | rpm = 120·c | Fiab. |
|---|---|---|---|---|---|
| Mínimo en curva lenta (p2–p5) | 48–54 | 145–162 | 290–323 | 5.800–6.500 | B |
| Vértice típico (horquilla T1, 76:56) | 55,7 | 167 | 334 | ~6.700 | A (tono) / B (rpm) |
| Mediana en carrera | 91 | 274 | 548 | ~11.000 | A / B |
| Punto de cambio (marchas altas) | 98,5–99,2 | 296–298 | 591–595 | ~11.800–11.900 | A / B |
| Máximo sostenido (final de recta, 8.ª) | 96–99 | 288–297 | 576–594 | ~11.500–11.900 | A / B |

- Las cifras >300 Hz de 3c que salen en los percentiles altos son errores de seguimiento (salto a 4c). Las descarto.
- **Referencia real**: el PU de 2024 tiene un límite reglamentario de 15.000 rpm y en carrera trabaja sobre 10.500–12.000 rpm. El encendido cae así en 525–600 Hz, coherente con lo observado.
- **Lo que no coincide con la realidad** (C): en las horquillas el juego deja caer el motor a unas 6.000–6.700 rpm. En la F1 real rara vez baja de ~9.000.

## 2. Cambios de marcha
### 2.1 Subidas: escalera medida en dos vueltas del Ferrari (A)
Recta principal, 76:36–76:52, y salida de T1, 76:56–77:06. La 8.ª es la marcha final (tramo plano hasta frenar). Hay dos pasadas casi idénticas, así que **los puntos de cambio son deterministas por marcha**.

| Cambio | Tono antes → después (`c`, Hz) | Razón de caída | rpm aprox. | Tiempo en la marcha previa (recta) | Subida de tono en la marcha previa |
|---|---|---|---|---|---|
| 3→4 | ~88 → ~80–82 | ~0,91–0,93 (C, vértice ruidoso) | 10.600 → 9.700 | ~2,4 s desde el vértice | +25 %/s |
| 4→5 | 93,3 → 80,0 | **0,856–0,860** | 11.200 → 9.600 | 1,97 s | +15 %/s |
| 5→6 | 98,3–98,7 → 89,2–91,1 | **0,907–0,923** | 11.800 → 10.700 | 1,55–1,75 s | +15 %/s |
| 6→7 | 98,7–98,9 → 88,3–88,7 | **0,893–0,898** | 11.850 → 10.600 | 1,07–1,82 s | +5–7 %/s |
| 7→8 | 98,8–98,9 → 89,7 | **0,906–0,907** | 11.850 → 10.750 | 3,45–3,55 s | +2 %/s |
| 8.ª hasta frenar | 89,7 → 96,4 (asintótico) | — | 10.750 → 11.570 | ~7,5 s (76:45,1–76:52,6) | +0,5 %/s, se aplana por el arrastre: **no hay limitador** |

- **Espaciado de cambios en la recta principal** (A): 76:38,18 → 39,73 → 41,56 → 45,10, es decir **1,55 s, 1,83 s, 3,54 s**, y luego ~7,5 s en 8.ª.
- **Salida de T1** (A): 76:58,6 → 76:59,65 → 77:01,40 → 77:02,47 → 77:05,92.
- **Otros coches** (A): el punto de cambio y la razón cambian según el equipo. Parecen perfiles de sonido por coche o por PU:

| Coche (plano) | `c` al cambiar | rpm | Razón típica en marchas altas | Ejemplo |
|---|---|---|---|---|
| Ferrari (71–79, 81, 90, 116, 120 min; también en la clasificación) | 98,5–99 (marchas bajas: 92,3) | ~11.850 (~11.080) | 0,90–0,91 (bajas: 0,86–0,88) | 76:45,10 |
| McLaren (66–70, 90:53) | 96,0–96,8 (última: 99,2) | ~11.560 | **0,866–0,876** (3→4: 0,815) | 69:42,8 / 44,7 / 46,5 / 49,0 / 53,7 |
| Red Bull (clasificación, 36–37 min) | 100,2 | ~12.000 | 0,863–0,876 | 36:14,9 |

- **Forma del evento de subida** (A, zoom a 16 muestras): el tono baja con un **deslizamiento de unos 70–100 ms**, no es un salto seco.
  - Ferrari: no hay corte de encendido. Hay un "pop" de +2…+3 dB durante ~30–40 ms y después el nivel queda 1–3 dB más bajo.
  - McLaren: hay una muesca de −3…−8 dB de ~40 ms (corte) antes de la marcha nueva.

### 2.2 Frenada y reducciones (B/C)
- **Levantar el pie** (A):
  - El tono cae de forma suave, ~−1 % cada 100 ms.
  - La banda principal del motor (150–1.500 Hz) baja **7–9 dB en ~0,7 s** (p. ej. 76:52,6 → 76:53,3).
  - Antes de algunas frenadas se ve una caída lenta más larga, compatible con la orden "lift and coast" que muestra la interfaz. Eso es inferencia (C).
- **Reducciones con golpe de gas** (B):
  - Durante la frenada, sobre la caída global (de c ≈ 96 a ≈ 56 en ~3,3 s), aparecen 4–6 picos en forma de "^": subidas rápidas de tono de +6 a +15 % (algunas +20 %) que duran ~80–150 ms.
  - Espaciado: **0,25–0,5 s** al principio de la frenada y más amplio al acercarse al vértice.
  - Ejemplo T1, 76:53,66 / 53,95 / 54,18 / 54,51 / 55,45: cinco picos, compatible con pasar de 8.ª a 3.ª.
  - El detector automático solo encuentra 1–3 por frenada (C). Conviene fijar estas cifras con datos reales, no con este vídeo.
- **Vértice** (A): se ve una meseta de tono de ~0,3–0,5 s (c ≈ 55,7, 76:55,9–76:56,3) antes de que el tono vuelva a subir.

### 2.3 Limitador de régimen
- En carrera **no se ha visto rebote de limitador** (A). En la última marcha el tono se aplana de forma asintótica, por la velocidad terminal.
- El "limitador" sí aparece en el **pit-lane** (sección 4).

## 3. Mezcla por tipo de cámara (A, medido en estéreo)
| Vista | Nivel medio (dBFS, canal medio) | Correlación L/R | Lado/Medio | Qué se oye |
|---|---|---|---|---|
| Onboard (cockpit, T-cam, halo) | **−26 a −30** | **0,98** | −19 dB | Motor propio casi mono y centrado, dominante. Pegado al tono va un ruido ancho de 2–8 kHz que crece unos 5 dB con la velocidad (viento/rodadura, C). Pianos: zumbido con peine de ~40 Hz (120/160/200 Hz), +12–15 dB en 40–150 Hz durante 0,5–0,8 s (77:01,5; 76:38,1; 69:43,5). Coches cercanos: peines extra que se cruzan con Doppler (76:09–76:11). |
| TV trackside (planos abiertos o altos) | −41 | 0,68 | −7 dB | Lecho difuso: varios motores lejanos más ruido ancho, a veces un zumbido estable de 58/88/118/178 Hz (C: lecho ambiente). Pasadas cercanas con **Doppler y paneo** (ver abajo). |
| Persecución o TV cerca del coche | ≈ onboard (−25 a −30) | 0,9+ | — | La cámara "lleva micro": el motor del coche seguido suena limpio y con poco Doppler (59:00–59:21). |
| Mapa 3D del circuito | **−43 a −59** | 0,29–0,32 | −3 dB | Motores casi silenciados, solo ambiente ancho y difuso (59:23,7–59:26,5 a −59 dBFS). |
| Pantallas con la sesión pausada (opciones de parada, reglajes) | **−49,5** | 0,26 | — | Lecho ambiente o pad muy bajo más los clics de interfaz. Al pausar, el motor desaparece. |
| Repetición (onboard de otro coche) | −32 | 0,97 | −16 dB | Igual que un onboard. Entra con una **cortinilla con "whoosh"** sincronizada con la transición del logo (59:27,5–59:28,2; 86:38). |
| Menús fuera de sesión (0–12 min) | −43 a −45 | 0,35–0,50 | −4,5 dB | Música con notas estables, estéreo ancho, sin motor. |
| Parrilla o cinemática previa (56:03–56:20) | −32 | 0,63–0,89 | — | Ambiente del equipo y la parrilla, centrado. |

- **Espacialización** (A):
  - El onboard es prácticamente mono.
  - En trackside el sonido se panea con la posición en pantalla. Ejemplo de pasada, 61:45–61:48: paneo −2,8 dB (izquierda) → +5 dB (derecha) en ~2 s, con pico de nivel (−35 dBFS) en el cruce (61:47,0).
  - Salida del pit (86:13,75): paneo de hasta **+17 dB a la derecha**.
- **Doppler en pasadas** (B): en 61:46,3–61:47,6 la línea dominante baja de 735 → 505 Hz (razón 0,687) con forma de S en ~0,6–0,8 s. A rpm constante equivale a ~64 m/s (~230 km/h). Es razonable para ese punto, pero no está verificado contra la velocidad del juego.

## 4. Pit-lane (parada de Sainz, 85:45–86:20) (A en tiempos, B en rpm)
| t | Evento visual | Audio |
|---|---|---|
| 85:44,9–85:45,6 | Aviso "piloto entrando en boxes" | Whoosh de interfaz (~0,7 s, banda ancha) más un arpegio de 4 tonos puros |
| 85:46,1–85:46,9 | — | **Radio del equipo**: 4 ráfagas de voz (f0 ≈ 120 Hz) **limitadas en banda a ~300–3.000 Hz** (−20 dB por encima de 3 kHz) |
| 85:49–85:54 | Cámaras de entrada y de torre del pit-lane | Tono **estable**: 197,5 / 395 / 593,5 / 1.185 Hz. Cae ligeramente a 192 / 580 Hz al acercarse al box. Equivale a c ≈ 65,9 Hz, unas 7.900 rpm (B). Nivel bajo, −44 dBFS |
| 85:55–86:02 | Coche en el box, mecánicos | Ruido ancho de 0,3–8 kHz (+15–20 dB), ráfagas cerca de 85:58,9 y 85:59,1. **No se aíslan zumbidos claros de pistola** (C). Hacia 86:00 sube el peine del motor (arranque) |
| 86:03–86:05,5 | Aviso "salida del box" | Clics y tonos de interfaz |
| 86:06–86:10 | Coche bajando por el pit-lane | **El mismo tono exacto (197,5 / 593,5 Hz)** que a la entrada. Es el limitador: mismo tono a la ida y a la vuelta, variación <1 % en 2 s |
| 86:11–86:14 | Salida del pit y vuelta a pista | El tono sube en escalón (se suelta el limitador) más un paneo fuerte a la derecha |

- Referencia real: el límite del pit-lane en Bahrein es 80 km/h. En OverCut, el tono del limitador debe salir de la velocidad límite y de la marcha, no de este vídeo.

## 5. Salida de la carrera (A)
- Cinco **golpes graves** (30–120 Hz, ~−24 dB sobre un fondo de −50) con un **tono de ~523 Hz** (más 1.045 y 1.570 Hz). Uno por luz, cada **1,0 s**: 56:23,98 / 24,96 / 25,96 / 26,96 / 27,97.
- El vídeo a 30 fps confirma 3 luces en 56:25,77, 4 en 56:26,80 y 5 en 56:27,77. El sonido va ~0,2 s por detrás del cambio visual, medido en el pico de la envolvente.
- **Apagado de luces: 56:29,37**, es decir 1,6 s después de la quinta luz. El apagado no tiene sonido propio. Los motores lanzados empiezan ~0,4 s después (56:29,75–56:30,6).
- De 56:32 a 56:40, pelotón: banda ancha densa con peines múltiples. Es el mayor nivel de la mezcla en trackside.
- Referencia real (FIA): 5 luces a intervalos de 1 s y apagado tras una espera variable. OverCut debe aleatorizar esa espera.

## 6. Interfaz y radio
- **Clics de interfaz** (A, pantallas de reglajes, 16:00–16:10): transitorios de 5–30 ms con centroide de 1,5–3,5 kHz. Los deslizadores producen ráfagas cada ~0,15–0,2 s.
- **Cambios de panel** (A): whoosh de ruido de ~0,4–0,7 s.
- **Avisos** (A): tonos cortos en escalera.
- **Radio** (B): voz filtrada en banda telefónica, ligada a algunos avisos (entrada a boxes).
- Lo que no se ha separado: no he identificado pitidos de radio diferenciados del resto de tonos de aviso.

## 7. Safety car / VSC
- **No aparecen en este vídeo.** Lo comprobé con muestreo de mosaicos y con un barrido de pancartas amarillas cada 5 s de 53 a 124 min: solo salen carteles de patrocinio. Hay un posible amarillo local (cabecera de clasificación amarilla, 59:20–59:27), pero no hay coche de seguridad.
- Por tanto no hay medidas de sonido ni de velocidad bajo SC/VSC.
- Diseño sugerido (C, no observado): con SC/VSC, rpm más bajas (marchas largas, menos gas), menos subidas por minuto y ninguna frenada con reducciones fuertes. La velocidad debe salir del delta FIA y de OpenF1.

## 8. Qué copiar como estructura (ideas, sin assets)
1. Motor = peine armónico paramétrico, con c = rpm/120 y énfasis en 3c, 6c y 9c. Tono y nivel ligados al gas. Perfil por PU o equipo: punto de cambio y razón por marcha.
2. Tabla de cambios determinista por marcha:
   - Deslizamiento de 70–100 ms.
   - "Pop" o corte opcional de ~40 ms.
   - Reducciones con golpe de gas de +6…+15 %, de 80–150 ms, cada 0,25–0,5 s.
   - Meseta en el vértice.
3. Mezcla por vista:
   - Onboard: mono y alto.
   - Trackside: estéreo ancho, −12…−15 dB, Doppler y paneo por posición en pantalla.
   - Mapa o pausa: motores fuera, ambiente a −45…−60 dBFS.
   - Repetición: cortinilla y mezcla de onboard.
4. Eventos sonoros:
   - Luces de salida con golpe y tono por luz.
   - Pianos: retumbo grave periódico.
   - Pit-lane: tono constante del limitador, ruido de mecánicos, aviso y radio filtrada.
   - Interfaz: clics, whoosh y arpegio de aviso.
5. Ruido de viento o rodadura en 2–8 kHz, que sube unos 5 dB con la velocidad (C).

## 9. Ficheros
- Scripts y datos: `C:/Users/hugoe/AppData/Local/Temp/claude/f96a86a4187a3fa3/ca0f17ed-6bb4-4ef9-b0f3-3638380e9349/scratchpad/f1m/work/audio/`
  - `comb_onboard.npy`, `comb_quali.npy`: traza de `c`.
  - `ladder.py`: escaleras de cambios.
  - `stereo.py`: mezcla y paneo.
  - `z_*.png`, `L_*.png`, `pit_*.png`, `start.png`, `dop.png`: espectrogramas.
