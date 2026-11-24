# Cámaras y realización: F1 Manager 24, Bahrain (análisis de vídeo)

Clave: `cameras`. Fuente: vídeo de 2 h 04 min, 640x360, 30 fps. Análisis a fondo de la carrera (55:00–124:32) y visión general del resto.
Solo se toman ideas de estructura y comportamiento. No se copia ningún asset, texto de UI ni logotipo. Las cifras leídas en pantalla son **valores observados en el juego y solo sirven de referencia**.

Ficheros de trabajo: `C:/Users/hugoe/AppData/Local/Temp/claude/f96a86a4187a3fa3/ca0f17ed-6bb4-4ef9-b0f3-3638380e9349/scratchpad/f1m/work/cameras/`
(`mycuts.txt` = cortes propios, `cls.txt` = clasificación de cada plano, `shots.json`, `shotpos.json` = posición en la vuelta, `sheets/` = hojas antes/después de cada corte).

## 0. Método y límites

- **No se usó `cuts.txt` (umbral 0,30) para la carrera**: en carrera el HUD ocupa cerca del 45 % del cuadro y oculta los cortes. Solo detecta 157 cortes; por ejemplo, da como un único plano de 529 s el tramo 65:57–74:46, que en realidad tiene decenas de planos.
- Detector propio: se recorta el centro sin HUD (x 120–500, y 20–260), se reduce a 76x48 y se calcula la diferencia media entre fotogramas a 30 fps. Un corte es un pico mayor que 3 veces la mediana local, o un salto de histograma mayor que 0,35. Resultado: **755 cortes en carrera**. Se revisaron uno a uno en hojas antes/después; 20 eran falsos (ventanas emergentes o destellos) y se fusionaron.
- **Cortes perdidos**: una segunda pasada con umbral bajo dio 88 candidatos. Unos 30 eran cortes reales que se escapaban por el desenfoque de movimiento (planos de seguimiento lateral). El resto eran barridos continuos. Estimación: faltan alrededor del **5 %** de los cortes, así que las duraciones TS están algo sobreestimadas (confianza media).
- **Posición en la vuelta**: el minimapa marca el coche seguido con un círculo grande. Se siguió a 5 fps y se proyectó sobre una polilínea del trazado (fracción 0 = salida de T14‑15, sentido de carrera hacia la izquierda por la recta inferior). El box de Ferrari queda en la fracción 0,113. Los nombres de curva son aproximados (confianza media‑baja); la fracción de vuelta es fiable.

## 1. Duración de plano por sesión (vídeo completo)

| Sesión | Tramo | Fuente | Planos | Mediana | p10–p90 | Qué se ve (observado) |
|---|---|---|---|---|---|---|
| Menús | 0–12 min | cuts.txt | 146 | 1,4 s | 0,3–10,1 s | Cambios de pantalla de UI, no son cámaras |
| Libres | 12–35 min | cuts.txt | 121 | 3,4 s | 0,7–36 s | Casi todo en **mapa 3D** a velocidad x8–x16; planos TV sueltos, de día (m_012, m_020) |
| Clasificación | 35–53 min | cuts.txt | 52 | 2,8 s | 0,8–40 s | Mapa 3D en la vuelta de salida; **cámara del piloto** sostenida en la vuelta rápida (m_031, m_037) |
| Intro | 53–55 min | cuts.txt | 8 | 7,9 s | — | Animación de transición de marca |
| **Carrera** | 56:39–124:32 | **detector propio** | **688** | **3,3 s (TV)** | ver §2 | Realización TV, mapa, onboards, repeticiones |

(Libres y clasificación también pierden cortes con `cuts.txt`; tómense como orientación, confianza baja.)

## 2. Tipos de plano en carrera (688 planos, 4072 s)

| Código | Tipo (descripción funcional) | n | Mediana | p25–p75 | Rango | % tiempo | ¿Quién lo elige? |
|---|---|---|---|---|---|---|---|
| TS | Cámara de pista baja/media con tele; panea y hace zoom siguiendo al coche | 406 | **3,3 s** | 1,7–5,3 | 0,2–42 | 40 % | Realizador automático |
| TW | Cámara de pista alta o gran angular en curva (vista de la trazada) | 75 | **2,4 s** | 1,1–4,4 | 0,2–30 | 7,5 % | Realizador automático |
| KC | Cámara a ras de muro o piano, con primer término desenfocado | 2 | 1,7 s | — | — | <1 % | Automático (raro) |
| HELI | Cámara volante (helicóptero o dron) que acompaña al coche a unos 30–60 m | 8 | **26 s** | 7–34 | 3–49 | 4,6 % | Usuario (sale al ciclar cámaras) |
| CP | Onboard alto sobre el halo (cámara T frontal) | 39 | 3,2 s* | 0,7–12 | 0,2–127 | 12 % | Usuario |
| RO | Onboard trasero desde el airbox, mirando hacia atrás | 13 | 2,5 s* | 0,9–26 | 0,1–122 | 6,3 % | Usuario |
| HP | Vista del piloto (ojos del casco) | 18 | **5,5 s** | 4,3–8,8 | 1,5–24 | 3,3 % | Usuario **y** automático (insertos de 3–16 s) |
| HS / SP | Lateral de cabina (casco o volante) / pontón bajo tipo cámara de espejo | 8 | 0,4 s* | — | 0,2–38 | 1 % | Usuario (ciclado) |
| MAP | Mapa 3D del circuito con etiquetas de pilotos | 50 | **7,4 s** | 4,0–11,8 | 0,6–38 | 12 % | Usuario (botón de vista) |
| PL | Pit lane: entrada, carril y salida | 18 | 5,8 s | 4,6–10,6 | 0,9–40 | 3,6 % | Automático en parada |
| GA | Box: mecánicos esperando y llegada del coche | 6 | 7,3 s | 4,3–9,2 | 4,0–9,4 | 1 % | Automático en parada |
| RPL | Plano dentro de una repetición | 12 | 6,3 s | 3,5–7,9 | 1,5–16 | 2 % | Automático por evento |
| STING | Cortinilla de marca (entra o sale de repetición) | 23 | **1,2 s** medida | 1,2–1,4 | — | — | Automático |
| UI / PAUSE | Menú de parada o pausa a pantalla completa | 10 | 3,6 s | — | — | 1,4 % | Usuario |

\* Las medianas de CP/RO/HS/SP salen bajas porque mezclan dos usos. Al **ciclar** cámaras (20 planos, mediana 0,4 s) el usuario pasa por varias en menos de 1 s. Al **fijar** una cámara la sostiene 25–127 s (por ejemplo 66:19 CP McLaren 126,6 s; 120:13 RO Ferrari 47,6 s).

- Rachas de realizador TV (TS/TW seguidos): mediana 15,7 s; máximo 170 s y 47 planos sin interrupción (114:55–117:46).
- En una vuelta completa a 1x con realizador libre hay **21–24 planos** (vuelta de unos 94–98 s). Por ejemplo 101:56–103:34: 24 planos, media de 4,1 s. Confianza alta.
- Matriz de transiciones (las más frecuentes): TS→TS 311, TW→TS 41, TS→MAP 37, TS→TW 28, MAP→TS 27, TW→TW 20, CP↔RO 19, STING→RPL 9, TS→HP 9, HP→TS 8, PL→GA 5, GA→PL 5.

## 3. Geometría de los onboards (vista en fotogramas a resolución completa)

Las medidas en metros son **inferencias** a partir de la imagen (confianza media‑baja). Lo que se describe como visible en el cuadro está **visto**.

| Cámara | Visto en el cuadro | Posición estimada (ejes del coche) | FOV horizontal estimado | Ejemplo |
|---|---|---|---|---|
| CP sobre el halo | La barra superior del halo cruza el tercio inferior central; neumáticos delanteros en las esquinas inferiores; sin volante; horizonte a ~30 % desde arriba; mucha pista visible | Eje central, ~1,0 m del suelo, justo detrás y encima del halo | ~85° (±10) | 66:40, 89:55 |
| RO trasero | Tapa motor y airbox en primer término abajo; alerón trasero ocupa ~40–45 % del ancho; coches perseguidores encima | Encima del airbox mirando hacia atrás, ~1,0 m de alto | ~70° | 57:05, 90:25 |
| HP piloto | Pilar central del halo en el centro superior; volante con la **marcha legible** (4, 5, 6…); laterales de la cabina; vibración y movimiento de cabeza | Ojos del piloto, ~0,7–0,75 m, eje central | ~100° | 77:46–78:13 |
| HS lateral de cabina | Casco y volante de perfil y desde 3/4 delantero; muy cerca | A un lado del cockpit, a la altura del casco | ~70° | 77:42.5, 112:41 |
| SP pontón (cámara de espejo) | Pontón con patrocinador en primer término (~40 % inferior izquierdo); pista al frente | Lateral, ~0,6 m de alto, ~0,5 m fuera del eje | ~80° | 77:43, 120:13.3 |
| CU primer plano | Visera del piloto y celebración (solo en la repetición de meta) | Frontal al casco | tele | 123:41 |

- Todas las onboards llevan el HUD completo encima.
- La marcha solo es legible en el volante en la vista HP (visto, confianza alta). Es una buena pista visual para el sonido y la caja de cambios en OverCut.
- Cada coche tiene su juego de onboards. El usuario cambia de coche con los onboards activos (58:47–58:50: Ferrari→Red Bull→McLaren→Red Bull→Ferrari en ~0,4–1,4 s por coche).

## 4. Cámaras de pista: comportamiento

- **Paneo y zoom continuos.** Las TS bajas siguen al coche con el tele y el fondo queda muy desenfocado. Hay tres variantes (vistas en ráfagas a 10 fps, 102:22–102:44):
  1. **Frontal de recta (head‑on)**: tele largo, el coche viene de frente y crece. Ejemplos: el puente de patrocinio al inicio de la recta trasera y el cartel de 150 m antes de T1. 35 de estos planos, mediana de 4–6 s.
  2. **Paso con barrido**: el coche se acerca de 3/4 frontal, pasa junto a la cámara y esta gira ~180° para terminar viéndolo de espaldas. Es un solo plano, no dos (unos 20 casos detectados como falsos cortes).
  3. **Seguimiento lateral**: el coche queda fijo en cuadro, de perfil, y el fondo hace barrido. Parece una cámara sobre carril o con paneo perfecto, de 2–3 s. Suele ir entre dos planos abiertos (ej. 102:36.6–102:38.6).
- **TW altas** en las curvas lentas (T1, T4, T8, T10): encuadran la curva entera y el coche entra y sale de cuadro; planos cortos de 1–4 s.
- **Relevo**: la cámara entrega el coche cuando este llega a un punto fijo de la pista (ver §5); no espera a que salga de cuadro. Las secuencias de 1–3 cortes de menos de 1 s (ej. 98:35–98:38) alternan TW y TS en la misma curva durante una pelea.
- **HELI** (63:06–63:36 y otros 7 casos): un solo plano continuo de 20–49 s. Viaja a lo largo de la pista acompañando a uno o dos coches, gira en las curvas y pasa entre torres de luz. Sin cortes (la diferencia máxima entre fotogramas es 17 frente a más de 40 en un corte). Confianza alta.

## 5. Colocación de cámaras alrededor de la vuelta (relevos medidos)

Se agruparon los inicios de 450 planos TS/TW por fracción de vuelta. Los mismos puntos de relevo se repiten vuelta tras vuelta. Comparación entre vueltas: 101:56, 118:25 y 121:31, con diferencias de ±0,01 de vuelta. Confianza alta en las posiciones; media en los nombres de curva.

| Fracción | Zona aprox. | Planos | Tipo dominante | Mediana |
|---|---|---|---|---|
| 0,012 | Salida T15, inicio de recta | 13 | TS | 5,7 s |
| 0,041 | Recta principal (antes de meta y boxes) | 10 | TS | 4,1 s |
| 0,095 | Recta principal (zona de boxes) | 10 | TS/TW | 4,6 s |
| 0,170 | Frenada de T1, frontal (cartel de 150 m) | 24 | TS **frontal** | 2,3 s |
| 0,228 | T1 | 60 | TS + TW alta | 3,3 s |
| 0,282 | T2 | 34 | TS | 3,2 s |
| 0,330 | T3 | 20 | TS | 1,6 s |
| 0,353 | Recta a T4 | 16 | TS | 5,7 s |
| 0,394 | T4 → eses | 20 | TS (plano largo 8–15 s hasta 0,51) | 4,6 s |
| 0,512 | Final de eses | 7 | TS | 3,2 s |
| 0,572 | Hacia T8 | 25 | TS | 2,5 s |
| 0,637 | Salida T8 hacia T9‑10, **frontal** (puente) | 15 | TS frontal | 5,7 s |
| 0,717 | T10, frontal | 14 | TS frontal | 4,8 s |
| 0,735–0,781 | Recta trasera | 22 | TS/TW | 4,3–5,2 s |
| 0,840 | T11‑T12 | 46 | TS | 2,1 s |
| 0,938 | Recta a T13 | 10 | TS | 6,4 s |

Regla deducida: hay unas **18–22 zonas de cámara por vuelta**, cada una con 1–3 cámaras alternativas (por ejemplo, en la misma zona sale un frontal en una vuelta y un lateral en otra). El plano dura lo que el coche tarda en recorrer la zona. Por eso en las curvas lentas los planos son más cortos y en las rectas más largos. A velocidad de simulación 2x o 4x los relevos siguen el mismo patrón de pista, pero el plano dura la mitad o la cuarta parte en tiempo real (inferido; se ve el indicador de velocidad en cuadro, por ejemplo 68:33 y 76:27).

## 6. A quién sigue el realizador y qué dispara un corte

| Regla | Evidencia | Confianza |
|---|---|---|
| La cámara TV sigue siempre al **coche enfocado** (el que el usuario eligió; resaltado en la clasificación y con marcador grande en el minimapa). En carrera fue sobre todo Leclerc; Norris en 63:44–66:17 y 70:03–70:46; Sainz en sus paradas | Marcador del minimapa continuo entre cortes; color del marcador rojo en 305 planos TS y naranja en 30 | Alta |
| **Corte por posición en la pista** (zona de cámara), no por tiempo fijo | §5 | Alta |
| **Pelea**: si hay coches cerca, el mismo plano los encuadra juntos (tele más abierto) y aparecen ráfagas de planos de menos de 1 s en la curva | 57:56–58:20, 98:35–98:38 | Media |
| **Adelantamiento** del coche enfocado (aviso de adelantamiento completado) → repetición del adelantamiento | 87:14 tras el aviso de 87:09; 101:00 tras 100:51 | Alta |
| **Bloqueo de rueda** de un rival (aviso) → repetición de ese rival | 59:30 tras el aviso de 59:25 | Alta |
| **Abandono o accidente** (bandera amarilla en la cabecera de la clasificación) → repetición del incidente + **plano del garaje de ese equipo** con su reacción | 91:45–92:05; 104:37–104:53 | Alta |
| **Parada en boxes** del coche enfocado → secuencia de boxes automática (§7); parada de un rival → repetición de su parada con primer plano de mecánicos | 84:25–86:20, 105:52, 108:22; repetición de Russell 78:33 | Alta |
| **Victoria o bandera a cuadros** → repetición del cruce de meta + primer plano del piloto celebrando | 123:28–123:48 | Alta |
| **Tras meta**: el realizador va saltando de un coche a otro según cruzan la línea, con planos de 1,3–2,5 s (aviso de piloto que termina) | 124:04–124:32 | Media |
| Insertos automáticos de **vista del piloto** (HP) de 3–16 s dentro de la realización TV, unas 1–2 veces por vuelta en el último tercio | 112:31, 112:44, 113:36, 114:44, 117:30, 117:52, 119:19, 119:30 | Media (no se puede descartar que fuera el usuario) |

**Repeticiones (10 medidas)**
- Cortinilla de entrada de 1,2 s, contenido de 9–22 s (mediana ~17 s) y cortinilla de salida de 1,2 s. Dentro puede haber una cortinilla intermedia (incidente → garaje).
- El HUD se oculta: solo quedan una etiqueta de repetición arriba a la izquierda, número y nombre del piloto abajo a la izquierda y un botón para saltar abajo a la derecha.
- **La simulación se detiene durante la repetición.** El coche enfocado avanza solo 0,007–0,037 de vuelta en 14–23 s de repetición, lo que equivale aproximadamente al tiempo de las dos cortinillas. Medido en el minimapa, confianza media‑alta.
- Al salir se vuelve a la cámara TV en la zona actual del coche.

## 7. Secuencias fijas

**Parada en boxes (vista 4 veces; confianza alta).** Ejemplo, Leclerc a las 84:25:

| # | Plano | Duración |
|---|---|---|
| 1 | TS frontal o lateral de la entrada a boxes (aviso de entrada a boxes) | 4–5 s |
| 2 | PL alto sobre el carril (se ve la noria) | 5–6 s |
| 3 | GA en el box: mecánicos esperando y llegada del coche | 5–9 s, a veces en dos planos de 4–5 s |
| 4 | PL saliendo del box, desde detrás y encima del muro | ~10,7 s |
| 5 | PL salida del pit lane (reloj de patrocinio, semáforo) | 3–7 s |
| 6 | TW incorporación a pista | 1–2 s |
| 7 | Vuelve la realización TS normal | — |

- Durante la parada aparece un widget con tiempo en el pit lane y tiempo de parada. Observado, solo referencia: 26,5 s / 2,85 s y 28,2 s / 2,49 s.
- Referencia real: las paradas de Ferrari en 2024 duran ~2,3–2,8 s, y en Bahrain se pierden ~22–24 s con la parada.
- Mientras el coche está en boxes la posición del minimapa no se lee bien, porque el rojo de los mecánicos confunde el detector.

**Prerrace y salida**

| Hora | Plano |
|---|---|
| 55:52–55:54 | Cortinilla |
| 55:54 | Coche de seguridad aparcado con comisarios (7,9 s) |
| 56:01 | Parrilla con gente (6,3 s) |
| 56:08 | Piloto dentro del coche (6,9 s) |
| 56:15 | Coche y mecánicos (3,1 s) |
| 56:18 | Reloj del patrocinador (4,6 s) |
| 56:22 | Muro de boxes del equipo |
| 56:22.7 | Cortinilla de 1,3 s |
| 56:23–56:39 | Parrilla desde atrás y en alto (16,7 s; semáforo) |
| 56:39.5 | Frontal alto de la parrilla en la salida |
| 56:43–56:50 | 4 planos bajos de T1 de 0,5–3,3 s |
| 56:50 | TW alta de T2‑T3 (13,3 s) |
| 57:03 | Ráfaga de onboards (usuario) |

En la primera vuelta el ritmo de cortes es el más alto de toda la carrera: planos de 0,5–3,5 s.

**Meta (123:28)**: cortinilla → repetición del cruce de meta (2 planos) → cortinilla → primer plano del piloto celebrando (8 s) → cortinilla → vuelta de enfriamiento con realización por coches que terminan.

## 8. Controles de cámara del usuario (descritos por función; no se copia la UI)

- **Arriba a la derecha**: tres botones de vista (mapa 3D, vista de carrera con cámaras, y datos) más ajustes. El usuario alterna mapa y TV con frecuencia: 50 veces en carrera, con el mapa sostenido una mediana de 7,4 s.
- **Barra inferior central**:
  - pausa;
  - velocidad de simulación con flechas (1x, 2x, 4x; en cuadro aparece un indicador "2x"/"4x" cuando no es 1x);
  - selector de cámara con flechas anterior/siguiente: cicla CP → RO → HP/HS/SP → HELI → TV. El orden exacto se deduce de las ráfagas de 70:48, 77:41–77:43 y 120:12–120:13 (confianza baja).
- Al pulsar en la clasificación o en un piloto cambia el coche enfocado (inferido).
- **Las pausas y los menús de parada** ponen el cuadro en gris con un panel encima (83:32, 84:30, 104:59–105:25). La cámara de fondo se queda congelada.

## 9. Máquina de estados del realizador (propuesta para OverCut, a partir de lo observado)

```
            ┌──────────────┐  botón vista   ┌───────┐
   ┌───────►│   TV_AUTO    │◄──────────────►│  MAP  │ (cámara libre, 3D)
   │        │ (zonas pista)│                └───────┘
   │        └──┬───┬───┬───┘
   │  selector │   │   │ evento                    usuario fija cámara
   │  cámara   │   │   └────────────┐              ┌─────────────────┐
   │           ▼   │                ▼              ▼                 │
   │   ┌───────────┴┐      ┌────────────────┐  ┌────────────────┐    │
   │   │ USER_CAM   │      │ PIT_SEQUENCE   │  │ REPLAY         │    │
   │   │ CP/RO/HP/  │      │ entrada→carril │  │ sting 1,2s →   │    │
   │   │ HS/SP/HELI │      │ →box→salida→   │  │ 1–3 planos     │    │
   │   │ (sin cortes│      │ incorporación  │  │ (9–22s, sim    │    │
   │   │ automáticos│      │ → TV_AUTO      │  │ en pausa) →    │    │
   │   └────────────┘      └────────────────┘  │ sting → TV_AUTO│    │
   │                                           └────────────────┘    │
   └─────────────────────────────── selector "TV" ───────────────────┘

TV_AUTO (subestados):
  ZONE_SHOT(zone_i, cam_j)  -- el coche enfocado sale de la zona i --> ZONE_SHOT(i+1, elegir cam)
  ZONE_SHOT  -- pelea a <1 s y otro coche en cuadro --> BATTLE_CUTS (alterna TW/TS en la misma curva, 0,5–1,5 s)
  ZONE_SHOT  -- p≈1–2/vuelta, recta --> ONBOARD_INSERT(HP, 3–16 s) --> ZONE_SHOT
  ZONE_SHOT  -- coche enfocado entra en carril de boxes --> PIT_SEQUENCE
  any        -- evento (adelantamiento propio, bloqueo, abandono/amarilla, parada rival, victoria) --> REPLAY (cola; una a la vez)
  FINISHED   -- cada coche que cruza meta --> plano corto de ese coche (1,3–2,5 s)
```

Duraciones guía (observadas en el juego, solo referencia):

| Plano | Duración |
|---|---|
| TS | 3,3 s (1,7–5,3) |
| TW | 2,4 s (1,1–4,4) |
| Frontal de recta | 4–6 s |
| HELI | 20–50 s |
| Onboard fijo | indefinido |
| Mapa | lo que dure la vista |
| Cortinilla | 1,2 s |
| Repetición | ~17 s |
| Parada completa | ~40 s en 5–7 planos |

## 10. Indicaciones para implementarlo

- Modelar cada circuito como una lista de **zonas de cámara** con [s_inicio, s_fin] en distancia de pista. Cada zona tiene una lista de cámaras posibles (tipo, posición, objetivo de zoom). Para Bahrain bastan unas 20 zonas; usar la tabla del §5 como plantilla de densidad, no como posiciones finales. Las posiciones reales de cámara de FOM no se conocen. Se pueden colocar a partir de la geometría del trazado (f1db / OpenF1 para las coordenadas del circuito).
- Realizador determinista con semilla: en cada zona se elige una cámara con pesos y se evita repetir la misma variante dos vueltas seguidas.
- Las cámaras TS hacen look‑at con suavizado crítico al coche y un zoom que mantiene su tamaño en pantalla (~15–35 % del ancho). Una variante "paso con barrido" permite al yaw girar hasta 180°.
- Un bus de eventos alimenta la cola de repeticiones: adelantamiento del jugador, bloqueo, DNF o bandera amarilla, parada de un rival y meta. Hace falta un buffer circular de estados de los coches de al menos 20–25 s para poder reproducir. Pausar la simulación durante la repetición, como hace el juego, o permitir saltarla.
- Pit: la máquina de estados del coche (pit_entry, pit_lane, stopped, leaving, pit_exit) dispara la secuencia de cámaras PL/GA de forma directa.
- Onboards: definir montajes por chasis en coordenadas del coche (CP ~1,0 m sobre el suelo detrás del halo; RO sobre el airbox mirando atrás; HP a la altura de los ojos ~0,72 m con vibración; SP lateral bajo). El FOV debe ser configurable (85° / 70° / 100° / 80° como punto de partida).
- Para la cortinilla de transición usar un diseño propio, sin la marca F1.

## 11. Lo que no se ha visto en este vídeo

- **Coche de seguridad ni VSC en pista durante la carrera.** Solo aparece parado en la previa (55:54) y hay dos banderas amarillas (91:45 y 104:37). No hay datos de cámara ni de velocidad bajo SC/VSC.
- Ningún accidente en directo en cámara: los abandonos solo se ven en repetición.
- Lluvia ni cambios de luz en carrera (es de noche todo el tiempo).
- Cámara de casco del box en directo para el coche propio (solo en la repetición de Russell).
