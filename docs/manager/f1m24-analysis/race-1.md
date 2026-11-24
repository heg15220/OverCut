# race-1 — Carrera, tramo 53:00–90:00 (t = 3180–5400 s)

Fuente: vídeo de F1 Manager 24 (640x360, 30 fps). Solo tomamos de aquí ideas y estructura. No se copia ningún asset, sonido, logo ni texto de interfaz. La UI se describe por su función.
Los números leídos en pantalla son **valores del juego, solo de referencia**. Al lado va el valor real cuando lo conozco. Calibramos con FIA, f1db y OpenF1.
Confianza: A = alta, M = media, B = baja. **VI** = lo que se ve en pantalla. **INF** = lo que deduzco.

Material de trabajo: `scratchpad/f1m/work/race-1/` (cortes propios en `cuts_race1.txt`, trazas de f0 y hojas de fotogramas).

## 1. Cronología del tramo

| t (s) | mm:ss | Qué pasa | Conf. |
|---|---|---|---|
| 3180–3215 | 53:00–53:35 | Fin de la Q3. Tabla de resultados de clasificación con piloto en pole y botón para continuar | A |
| 3215–3260 | 53:35–54:20 | Cinemática de entrada a la carrera: vuelo aéreo nocturno sobre el circuito, tarjeta con título de la carrera y torre del hotel. Sin HUD y con botón de saltar | A |
| 3260–3270 | 54:20–54:30 | Escena en el garaje: los pilotos hablan con el ingeniero | A |
| 3270–3350 | 54:30–55:50 | Pantalla resumen del GP (meteo por días), luego **preparación de carrera** (2 columnas, coche 1 y coche 2: estrategia, compuestos, piezas, reglajes, combustible, opciones de pilotaje) y **editor de estrategia** (gráfico de vida del neumático por vuelta, ventana de parada, compuestos por stint). Botón para iniciar carrera | A |
| ~3350 | 55:50 | Cortinilla con el logo (≈1,5 s) | A |
| 3355–3379 | 55:55–56:19 | **Parrilla** en cámaras de TV: coche de seguridad aparcado tras la parrilla, comisarios, mecánicos alrededor del coche del jugador, primer plano del piloto, reloj del patrocinador y muro de boxes | A |
| 3379–3381 | 56:19–56:21 | Segunda cortinilla. **No se ve vuelta de formación** (se salta o está editada) | M |
| 3381–3389 | 56:21–56:29 | Plano lateral bajo del semáforo con toda la parrilla (2 columnas escalonadas). Las luces se encienden | A |
| 3389,37 | 56:29 | **Se apagan las luces** | A |
| 3390,3 | 56:30 | Aparece el HUD completo (≈0,9 s después del apagado). La cámara sigue al grupo | A |
| 3394–3430 | vuelta 1 | Curvas 1–4 en TV: grupo compacto, 2–3 coches en paralelo y cambios de cámara rápidos | A |
| 3470 | V1 | Radio: "adelantamiento con ERS disponible". El jugador abre el panel de ERS | A |
| 3490–3500 | V1–2 | **Bandera amarilla**: la cabecera de la torre se vuelve amarilla e indica el sector. Banner arriba: un rival trompea en la curva 14, con opción de ver la repetición. Radio "un rival ha trompeado" | A |
| 3495 | V2 | Aviso de Dirección de Carrera: **DRS activado** al inicio de la V2 (real: a partir de la V3, tras 2 vueltas) | A |
| 3510 | V2 | Ventana emergente "próxima ventana de parada: V20–26" con un gráfico de la vida del neumático | A |
| 3565 | V2 | Banner: un rival bloquea ruedas en la curva 11. Cae a P18. Bandera amarilla en el sector 2 | A |
| 3568–3582 | V2 | El jugador pulsa ver repetición: cortinilla de entrada (≈1,5 s), **repetición ≈10 s** (3 ángulos de TV, uno con el cartel de frenada de 150 m), cortinilla de salida (≈1,5 s) y vuelta al directo en la cámara del incidente | A |
| 3600–4500 | V3–15 | Fase estable: VER, LEC, SAI, NOR, PER… El jugador alterna onboards (T-cam de McLaren y cámara trasera de Ferrari), el mapa 3D a 4x y paneles de ritmo, ERS y combustible | A |
| 4425 | V13 | Pelea entre compañeros: radio "defiende la línea". Panel de tácticas con opciones de agresividad | A |
| 4505–4520 | V14–15 | Otra repetición con cortinilla (rival en la recta de meta) | A |
| 4605 | V17 | Banner: otro rival bloquea ruedas en la curva 4 | A |
| 4730–4810 | V18–19 | Parada de un rival mostrada con un plano de corte del equipo de boxes (tarjeta con el nombre, sin etiqueta de repetición) | M |
| 4810–4845 | V20 | **Parada de VER** (undercut). En la torre aparece "EN BOXES". Radio "ventana de parada abierta". LEC pasa a liderar | A |
| 4985–4995 | V23 | Banner "fallo mecánico" de un rival y repetición: le adelantan dos coches. Subtítulo de radio "me cuesta desplegar" | A |
| 4945, 4975 | V22–23 | Banner morado de **vuelta rápida** (p. ej. 1:36.248 y 1:35.778) | A |
| 5060–5112 | V24–25 | **Parada de LEC** (detalle en §6) | A |
| 5140–5185 | V25–26 | **Parada de SAI**: de líder a P5 | A |
| 5185–5205 | V26 | Repetición onboard de un McLaren | A |
| 5220–5243 | V26 | **Adelantamiento de LEC a NOR** en la curva 1 + repetición onboard (detalle en §5) | A |
| 5245–5400 | V26–30 | LEC P2 detrás de VER. Mapa 3D a 4x. Onboard trasero de LEC | A |

**No aparece en el tramo**: safety car, VSC, banderas rojas, abandonos, daños visibles ni salidas de pista largas. Al final del tramo el último va doblado (+1 vuelta).

## 2. Salida (medido a 30 fps, 3380–3394 s)

| Evento | t (s) | Δ | Conf. |
|---|---|---|---|
| Fin de la cortinilla y plano del semáforo | 3382,7 | – | A |
| Luces 1–2 ya encendidas al entrar el plano | 3385,47 | – | A |
| Luz 3 | ≈3385,8 | ≈0,3 s (posible artefacto de fundido) | M |
| Luz 4 | 3386,80 | +1,0 s | A |
| Luz 5 | 3387,77 | +0,97 s | A |
| Apagado | 3389,37 | **1,60 s** tras la 5ª | A |
| Aparece el HUD | ≈3390,3 | +0,9 s | A |

- VI: desde este plano, las luces se encienden de derecha a izquierda (es la vista desde la parrilla, al revés que para el piloto).
- Real: 1 luz por segundo y apagado aleatorio entre 0,2 y 3 s después de la 5ª. El juego encaja con esto.
- Sonido (VI, espectrograma): con las luces encendidas hay subidas de vueltas sueltas de los motores en parrilla (picos verticales en ~3383,5, 3384,3, 3385,6 y 3386,6). Desde 3392 hay un **ruido de grupo** ancho sin armónicos limpios (unos 20 motores superpuestos), a −15,7 dB RMS. Cuando corta a un plano lejano baja a −31,6 dB.
- Vuelta 1 (VI): la cámara sigue al grupo desde atrás y desde el lateral. Corta a la curva 1 con 2–3 coches en paralelo. Cortes cada ≈2–7 s.

## 3. Cámaras y realización

- Detección propia de cortes (diferencia de luminancia en el centro de la imagen a 15 fps, agrupando cortes a menos de 1 s): **225 cortes en 3390–5400 s**.
  - Duración de plano: mediana **5,4 s**, media 8,9 s, P25 2,8 s, P75 8,8 s. Conf. M (hay falsos positivos por movimiento rápido y ventanas emergentes).
  - Ritmo por bloques de 5 min: 46 cortes en la salida, 39, 20, 22, 18, 46 (paradas) y 34. Hay **más cortes en la salida y en las paradas**. Los tramos con pocos cortes son onboards que elige el jugador.
  - Planos más largos: 127 s, 82 s, 77 s y 73 s, todos onboard o del mapa 3D (el jugador fija la cámara).
- Tipos de cámara vistos (A):
  1. Tele de TV en curva, con panorámica que sigue al coche.
  2. Cámara lateral baja que viaja con el coche.
  3. Cenital o en grúa en la recta de boxes.
  4. Detrás del coche a ras de suelo.
  5. **T-cam** sobre el halo.
  6. **Halo/cockpit**, con el volante y la marcha visible.
  7. **Cámara trasera** sobre el alerón, mirando hacia atrás.
  8. Cámaras fijas en el pit lane y planos del equipo de boxes.
  9. **Mapa 3D** del circuito con etiquetas "posición | código".
- Control (VI): selector de coche anterior/siguiente con un icono de cámara abajo en el centro, y el puntero del ratón sobre él. Las pestañas de arriba a la derecha cambian entre vista de carrera y otras pantallas.
- Repeticiones (A): una cortinilla de logo de 1,5–2 s antes y después. Mientras dura, el HUD desaparece y quedan la etiqueta de repetición, la tarjeta del piloto abajo a la izquierda y un botón para saltar. Duración: ≈8–10 s. Se lanzan desde el banner de incidente (se hace clic en "ver repetición").
- INF: el director automático elige al coche del jugador o el incidente o batalla más cercana. Los onboards largos los fija el jugador.

## 4. Trazada, frenada y paso por curva (onboard de NOR, V9, 3995–4030 s, motor por audio)

Se siguió la fundamental del motor (peine de 12 armónicos, cada 50 ms). La frecuencia de la serie armónica (f0) es ≈ rpm/120, es decir, el ciclo del 4 tiempos. Comprobación cruzada: el tooltip de telemetría a 4437 s marca **7ª, 269–271 km/h y ≈11 000–11 100 rpm**.

| Fase | t (s) | f0 (Hz) | rpm est. | Nota |
|---|---|---|---|---|
| Cambios hacia arriba | 3997,7 / 3999,5 / 4002,1 / 4007,0 | sube hasta 96–99 y cae a 84–86 | ≈11 600–11 900 → ≈10 200 | Caída del 12–13 % por cambio. Hueco del cambio ≤ 0,1 s |
| Duración de cada marcha | 1,5 / 1,7 / 2,5 / 4,8 s | | | Las marchas largas duran más (la aceleración cae con la velocidad) |
| Marcha final en la recta | 4007,2–4010,2 | 86–89 estable | ≈10 500 | Meseta: límite por resistencia o levantar y dejar correr |
| Frenada en la curva 1 | 4010,3–4012,5 | 89 → 60 con "golpes" | → ≈7 000 | Reducciones rápidas en cadena con picos de gas (patrón en V del espectrograma) |
| Mínimo en el vértice | 4014,2–4014,8 | 58–60 | ≈7 000 | |
| Salida | desde 4015 | cambios a 86,8 / 96 / 96 / 96 Hz | | 4016,6, 4018,6, 4020,3, 4022,7 |
| Frenada en la curva 4 | 4025,8 | | | Recta de la 3 a la 4 en ≈9,4 s |

- VI (onboard): el coche de delante frena, el seguidor se acerca hasta ≈1 coche de distancia en la zona de frenada y luego se abre a la salida. Saltan chispas del fondo del coche de delante en la frenada (4011).
- Real: en Bahrein la velocidad punta es de ~320–330 km/h, se usa 8ª y el límite real está en ~11 500–12 000 rpm (el reglamento permite 15 000). Calibrar con OpenF1 (`car_data`: rpm, n_gear, speed, throttle, brake).
- Volumen por tipo de cámara (RMS mediano): onboard a fondo −17,8 dB, onboard en curva −20,0, grupo en la salida −15,7, TV lejana −31,6, mapa 3D −30,9, pit lane −28,9, parada −18,1, repetición onboard −24,1, cinemática −25,1. **La distancia a la cámara manda en la mezcla.**

## 5. Batallas, adelantamientos y defensas

**Adelantamiento LEC → NOR (V26, 5220–5243 s)**. LEC va con neumáticos nuevos tras su parada y con el DRS activo (casilla verde en su panel).

| t | Qué se ve |
|---|---|
| 5221–5223 | En la recta de meta, LEC a rebufo detrás de NOR, con PER detrás |
| 5224,5–5226 | **Rueda con rueda** al llegar a la curva 1: LEC por la derecha y NOR por la izquierda, separados ≈1 ancho de coche. PER, tercero, por detrás. Unos **3 s en paralelo** |
| 5226–5227,5 | LEC por delante en la frenada. NOR se pone detrás en la trazada |
| ≈5227,5 | Radio de "adelantamiento conseguido" y la torre se reordena (LEC P2) |
| 5230 | Banner con la opción de ver la repetición |
| 5232–5243 | Cortinilla, repetición onboard (marchas 4→2→3→4→5 en el volante) y cortinilla de salida |

- Nunca se ven coches solapados (A). Cuando dos coches van en paralelo, guardan unos 0,5–1 anchos de coche de separación. El de detrás se aparta en la frenada o espera en la trazada. INF: hay una capa de detección y evitación con desplazamiento lateral. El de dentro tiene preferencia en la curva.
- Compañeros (V13, 4425–4440): SAI detrás de LEC a <1 s. Radio de "defiende la línea". En el panel de tácticas aparece **la opción de no pelear con el compañero**. Luego van en fila con ≈0,2–0,5 s de diferencia.
- Fallo mecánico (V23): el coche afectado pierde dos posiciones seguidas en una recta. Lo adelantan en paralelo, uno a cada lado.
- Errores vistos: 1 trompo (V1, curva 14) y 3 bloqueos (curva 11 en V2, curva 4 en V17 y otro no localizado). Generan un banner con opción de repetición, una radio que lo comenta y, a veces, bandera amarilla en el sector y pérdida de puestos.

## 6. Paradas en boxes (A)

| Dato (VI) | LEC (V25) | SAI (V26) | Real 2024 |
|---|---|---|---|
| Entrada a boxes | ≈5065 | ≈5145 | |
| Tiempo parado | ≈2,8 s (el contador llega a 2,73 y sigue) | **2,490 s** | 2,0–2,6 s (Ferrari, buena parada ≈2,3–2,5) |
| Tiempo total en boxes | **28,589 s** | **28,245 s** | Pérdida típica en Bahrein ≈ 22–24 s más que pasar por pista |
| Estimación previa en el menú | 26,374 s (para SAI) | | |
| Posición antes → después | P1 → P3 (LEC) | P1 → P5 (la estimación decía 5º, +3) | |

- Secuencia de la UI (A):
  1. Radio de "ventana de parada abierta" y la cabecera del panel cambia a ÓPTIMA y luego a ABIERTA.
  2. El jugador abre las **opciones de parada**. **La sesión se pausa**: el contador de tiempo en boxes avanza 0,35 s mientras pasan 6 s de vídeo.
  3. En el menú se ve: matriz de juegos de neumáticos (seco, intermedio, mojado, con desgaste por juego), detalles del compuesto (puesto frente a previsto: desgaste, vueltas de vida, delta de vuelta −2,0 s), regla de uso obligatorio de 2 compuestos de seco, piezas del coche, penalizaciones, tiempo estimado de parada (~2 s) y tiempo total. También la posición estimada a la salida, el selector de vuelta para parar ("esta vuelta") y el botón de confirmar.
  4. Durante la parada, el panel del piloto cambia a "tiempo en boxes" (cronómetro), luego "tiempo parado" en rojo, luego "saliendo del pit lane" y al final "tiempo total en boxes".
  5. La posición del panel baja en directo (1 → 2 → 3 → 4 → 5).
- Cámaras de la parada: entrada al pit lane (plano fijo y aéreo), equipo de boxes en primer plano (corte rápido de 3–4 planos en ≈4 s), coche saliendo del box y plano cenital o largo del pit lane hasta la línea de salida. Radio de "empieza la vuelta de salida".
- El contador avanza 1 s por segundo de vídeo, así que **la parada se ve a 1x**.
- Velocidad en el pit lane: el coche va a velocidad constante. En el audio, los armónicos se mantienen planos entre 5095 y 5103 (limitador), pero las rpm exactas no se pueden leer (B). Límite real en Bahrein: 80 km/h.
- Después de la parada: neumático blando al 99 % y **70 °C (frío)**, frente a 118–125 °C de los usados. INF: hay un modelo de calentamiento en la vuelta de salida.

## 7. HUD de carrera (función y disposición)

- **Torre (arriba a la izquierda)**: vuelta N/57 y modo seleccionable con flechas. Modos vistos: intervalo, al líder, neumáticos (compuesto y % de desgaste), sectores (barras de color), última vuelta (tiempos), boxes. Los coches del jugador van resaltados en el color del equipo. Un icono morado marca la vuelta rápida. Estados por coche: "EN BOXES" y "+1 vuelta". **La cabecera cambia a amarillo con el sector** cuando hay bandera amarilla.
- **Arriba a la derecha**: pestañas de pantalla, hora local, previsión ("x minutos" y % de lluvia), aire en °C, pista en °C, agua en mm, goma y agarre. Evolución observada: goma muy baja → baja → normal → alta; agarre normal → alto; pista 23,5 → 28,6 °C.
- **Minimapa** (derecha): circuito con puntos de colores y número de posición. Los coches propios llevan un círculo.
- **2 paneles de piloto** (abajo a izquierda y derecha) con 4 pestañas: estado, tácticas/tiempos, telemetría, boxes. El estado muestra:
  - desgaste del neumático en %;
  - temperatura del neumático (°C, con flecha de tendencia);
  - delta de combustible en kg respecto al objetivo (+1,6 → +0,6 kg);
  - temperatura del motor (104–113 °C);
  - **batería en %** con barra;
  - modos actuales de ritmo (1–5 puntos), combustible (puntos) y ERS (icono).
  - En la cabecera: posición, nombre, indicadores de DRS (verde = activo) y de ventana de parada.
- **Centro abajo**: pausa, velocidad de simulación (1x, 2x, 4x u 8x; el jugador acelera en el mapa 3D y entre eventos), botón de radio y cámara anterior/siguiente.
- Ventanas emergentes de mando:
  - **Ritmo**: 5 niveles de más agresivo a más conservador, con un gráfico de vida del neumático.
  - **Combustible**: 3 niveles (empujar, equilibrado, conservar), con un gráfico del combustible por vuelta.
  - **ERS**: desplegado X/4,0 MJ y recuperado Y/2,0 MJ por vuelta. 4 modos con su delta por vuelta: desplegar −2 MJ, neutro, recargar +0,2 MJ y recuperar +1 MJ. Casilla de "ayuda de ERS en batalla". Real: MGU-K con 4 MJ de despliegue y 2 MJ de recuperación por vuelta. **Coincide con el reglamento.**
  - **Tácticas**: confianza del piloto, agresividad al adelantar (alta, media, baja), modo de defensa (siempre, neutro, rara vez) y casillas para evitar pianos de riesgo, ir en aire limpio y no pelear con el compañero.
  - **Tooltip de telemetría**: marcha, km/h, mph y una barra de rpm. Aparece al pasar el ratón y dura ≈1,2 s.
- **Mensajes de radio** (tarjeta con la foto de quien habla, título y subtítulo): ERS de adelantamiento disponible, DRS activado, menos ritmo y enfriar neumáticos, más ritmo, levantar y dejar correr, rival trompeó o bloqueó, defiende la línea, recorta la diferencia, ventana de parada abierta, entra a boxes, empieza la vuelta de salida, adelantamiento conseguido, ganando a un rival, temperatura óptima de neumáticos. Suelen aparecer cada 5–20 s. **Muchos piden una acción** (que el jugador cambie un modo).
- **Banners superiores**: incidentes de rivales con enlace a la repetición, Dirección de Carrera (DRS) y vuelta rápida (morado, con nombre y tiempo).

## 8. Gestión (valores leídos de LEC, referencia)

| Vuelta | Desgaste del neumático | Temp. neum. | Combustible Δ | Batería | Última vuelta |
|---|---|---|---|---|---|
| 1 | 97 % | 119 °C | +1,6 kg | 82 % | – |
| 3 | 95 % | 121 °C | +1,6 kg | 46 % | – |
| 9 | 82 % | 117 °C | +1,1 kg | 35 % | – |
| 13 | 74–78 % | 118–122 °C | +0,7–0,8 kg | 45–49 % | 1:38–1:39 |
| 17 | 64 % | 118 °C | +0,8 kg | 45 % | 1:38.898 |
| 22–24 | 50–54 % | 116–125 °C | +1,0 kg | 75–87 % | – |
| 26 (nuevo) | 95 % | 118 °C | +0,6 kg | 67 % | – |

- El desgaste baja ≈2 %/vuelta con medios. Real: el medio aguanta 18–25 vueltas en Bahrein.
- Tiempos de vuelta del juego: 1:36–1:40, con la vuelta rápida en 1:35.778. Real 2024: vuelta rápida de VER en 1:32.608 y ritmo de carrera ≈1:36–1:38.
- La batería sube cuando el jugador elige recargar o recuperar y baja en las batallas.

## 9. Qué aplicar en OverCut (ideas, no assets)

1. Secuencia previa: preparación → estrategia → parrilla (≈25 s de planos) → semáforo (1 s por luz, apagado aleatorio) → HUD a +1 s. Ofrecer la vuelta de formación como opción.
2. Director automático con planos de 3–8 s y más cortes en salidas y paradas. Cambio a onboard fijo cuando lo pide el usuario. Repeticiones de 8–10 s con cortinilla propia, lanzadas desde el banner del incidente.
3. Motor: f0 = rpm/120 con armónicos, cambio con caída de ~12 % de rpm y hueco ≤ 0,1 s, reducciones con picos de gas, mezcla según la distancia a la cámara (−14 dB entre onboard y TV lejana) y ruido de grupo en la salida.
4. Evitación: separación lateral mínima de ~0,5 anchos de coche, unos 3 s en paralelo antes de resolver y respeto de la trazada en la frenada.
5. Parada: el menú pausa la sesión, con cronómetros de tiempo en boxes, tiempo parado y total, y la posición baja en directo. Neumático a ~70 °C a la salida.
6. Banderas amarillas por sector en la cabecera de la torre. El DRS se activa con un aviso de Dirección de Carrera. **Corregir a la V3** (regla real).
