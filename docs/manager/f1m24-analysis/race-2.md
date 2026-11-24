# race-2 — Segunda mitad de la carrera (90:00–124:32 de vídeo)

Fuente: vídeo F1 Manager 24, Bahrein, 640x360 a 30 fps. Tramo de vuelta 30/57 hasta la bandera a cuadros y la vuelta de enfriamiento (el vídeo termina antes de la pantalla de resultados).
Los números se leyeron en pantalla («observado en el juego») y solo sirven de referencia; la calibración real saldrá de FIA, f1db y OpenF1.
Leyenda: **V** = lo vi; **I** = lo infiero. Confianza: A (alta), M (media), B (baja). Los tiempos son de vídeo (mm:ss, con los segundos absolutos entre paréntesis cuando importan).
Ojo: el jugador cambia a menudo la velocidad de simulación (1x/2x/4x/8x). Por eso los tiempos de vídeo **no** son tiempos de juego salvo a 1x. Para el pit usé los cronómetros del propio juego, contrastados con el recuento de fotogramas a 1x.

Carpeta de trabajo: `C:/Users/hugoe/AppData/Local/Temp/claude/f96a86a4187a3fa3/ca0f17ed-6bb4-4ef9-b0f3-3638380e9349/scratchpad/f1m/work/race-2/`. Ahí están las hojas de contacto (`p1a.png`, `p1b.png`, `p1t.png`, `p2a.png`, `p3a.png`, `o1.png`, `o2.png`, `fin1.png`, `fin2.png`, `t3sheet.png`, `plsheet.png`, `prsheet.png`, `lapsheet*.png`), los espectrogramas (`spec_onb.png`, `spec_lim.png`) y los scripts (`fx.sh`, `sheet.py`, `hdr.py`).

## 1. Cronología de la carrera (vueltas 30 a 57)

| Vídeo | Vuelta | Suceso | Conf. |
|---|---|---|---|
| 90:00 | 30 | Orden VER, LEC, NOR, PER, SAI. El jugador abre el panel ERS (desplegar / neutral / recargar / cosechar, con «ayuda ERS en batalla») | V-A |
| 91:17 / 91:35 / 92:24 / 94:34 | 31–33 | Duelo de ida y vuelta NOR–LEC: el banner «X adelanta a Y» sale 4 veces (NOR, LEC, NOR, LEC) | V-A |
| 91:37–91:43 (5497–5503) | 31 | **Choque entre varios coches** (GAS, Alpine, contra un Sauber, BOT). Cabecera amarilla «SECTOR 2» (bandera amarilla por sector), rombo amarillo en las filas implicadas y banner «choque con varios coches · ver repetición». El jugador entra en la repetición (cortinilla, unos 14 s de replay y plano del garaje de Alpine) y vuelve. **Sin SC ni VSC.** | V-A |
| 92:30 | 31 | SAI adelanta a PER | V-A |
| ~92:35 (5555) | 31 | Banner blanco/azul «INVESTIGACIÓN» de comisarios (no se ve el resultado) | V-A |
| 97:07 / 98:45 | 35–36 | SAI adelanta a NOR (dos veces, así que NOR le devolvió la posición entre medias) | V-A |
| 98:06 / 100:22 | 36–38 | Banners «problema en el pit stop» de SARGEANT y TSUNODA (paradas lentas de la IA) | V-A |
| 100:52 (6052) | 38 | LEC adelanta a VER (VER ya en el final de su stint) | V-A |
| ~101–103 | 39–40 | VER para (sale con M, a +24,6 s en la vuelta 40) y los Ferrari quedan 1-2 | V-M |
| 104:28 (6268) | 41 | Bandera amarilla corta: trompo («wheel spin») de OCO. Replay con cortinilla | V-A |
| 104:45–105:30 | 42 | Pantalla de opciones de pit (pausa) para los 2 coches; parada de SAI (sección 2) | V-A |
| 107:10 (6430) | 44 | **VER adelanta a SAI**, que va con gomas frías de vuelta de salida (95 °C) | V-A |
| 107:16 | 44 | Opciones de pit para LEC; al final pone blandos | V-A |
| 108:20–108:47 | 45 | Parada de LEC. Amarilla en T9 (bloqueo de GAS) mientras está en el pit | V-A |
| 108:47 | 45 | LEC sale **P3** detrás de VER y SAI (pierde el liderato) | V-A |
| 109:00–115:45 | 45–52 | SAI (S) persigue a VER (M): gap de 3,46 s a 0,16 s en unas 7 vueltas | V-A |
| 115:48 (6948) | 52 | SAI adelanta a VER (T9–T10). El banner sale 13 s más tarde (6961) | V-A |
| 117:56–118:28 | 54 | LEC adelanta a SAI y a VER en la misma vuelta. Mensajes «adelantamiento fallido» → «adelantamiento conseguido» y banner «SAINZ ha perdido 2 posiciones» | V-A |
| ~119:40 (7180) | 55 | SAI vuelve a adelantar a VER | V-A |
| 121:30 | 57 | Cabecera «Última vuelta» (texto rojo) | V-A |
| 123:06 (7386) | 57 | LEC cruza la meta. Radio «¡piloto ganador!», cabecera «Terminado» | V-A |
| 123:23 (7404) | — | Banner «LECLERC · ganador de la carrera · ver repetición». El jugador entra: replay de la meta y primer plano del casco | V-A |
| 123:49–124:32 | — | Cámara que va siguiendo a cada piloto que recibe la bandera | V-A |

Resultado final (leaderboard a 124:30, **V-A**): 1 LEC; 2 SAI +2,783; 3 VER +4,373; 4 NOR +20,856; 5 PER +31,747; 6 PIA +43,927; 7 ALO; 8 HAM; 9 RIC; 10 STR (a 1 vuelta); … 20 ZHO (a 2 vueltas). Vuelta rápida: VER, 1:32.417 (banner morado a 107:37). (Real 2024: ganó VER y SAI fue 3.º. Esto es una partida simulada.)

## 2. Pit stops de principio a fin (medidos)

### 2.1 Llamada (opciones de pit) — V-A
- Desde el panel del piloto se abre una pantalla a pantalla completa con la **sesión en pausa** («SESIÓN EN PAUSA»; vuelta y meteo arriba). Contenido:
  - **Neumáticos:** rejilla de juegos disponibles (seco / intermedio / lluvia extrema, con el rango de mm de agua de cada uno) y los juegos usados con su % de vida.
  - **Comparativa montado / planificado:** compuesto y %, vida estimada en vueltas (~20 frente a ~37) y delta de tiempo por vuelta (−1,7 s con blando nuevo; +5,6 s si se pasa el ratón por un intermedio).
  - **Regla de compuestos obligatorios** con casillas: 1 compuesto obligatorio y 2 compuestos de seco distintos, con contador «1/2» si falta uno.
  - **Piezas del coche** (desplegable para cambiar alerón, etc.).
  - Penalizaciones pendientes, tiempo estimado de parada y **tiempo total en pit** (23,736 s en los dos coches).
  - **Gráfico de la estrategia** (stints coloreados por compuesto a lo largo de las 57 vueltas), ventana de pit «ABIERTA, vueltas 38–44», **posición estimada de salida** (3.º «+2»; 4.º «+2») y un selector «vuelta para entrar» (esta vuelta / siguientes).
  - Avisos: **conflicto de estrategia** («fuera de la ventana planificada») y **«el compañero también entra esta vuelta»** (riesgo de doble parada).
  - Botón para confirmar o dejar «sin cambios».
- Al cerrar, el ingeniero manda por radio «PIT NOW / box» (104:48 para SAI, 107:28 para LEC).
- Con la ventana abierta, el botón de pit del panel muestra la **distancia hasta la entrada del pit** (2,19 km a 106:30), que va bajando.

### 2.2 Secuencia y cámaras (parada de SAI, vuelta 42; vídeo 105:34–106:30)

| Fase | Vídeo (s) | Juego | Cámara / UI |
|---|---|---|---|
| Aviso «box» | 6328 | — | Notificación de radio; panel de SAI con el combustible resaltado |
| Resto de la vuelta | 6343–6351 | 8x | Vista de mapa 3D. **La velocidad baja sola de 8x a 2x a 1x** al llegar a la entrada (I-M: pasa igual en las dos paradas) |
| Entrada al pit | ~6350 | 2x | Plano fijo de la calle de boxes. El panel del piloto se convierte en un cronómetro «TIEMPO EN PIT» (empieza en 0 en la línea de entrada) y el leaderboard marca «EN PIT» |
| Aproximación | 6353.6 | 1x | Corte a los mecánicos esperando con las ruedas (el coche aún no ha llegado) |
| Llegada | 6354.6 | 1x | Plano lateral bajo; el coche entra en el cajón |
| Parado | 6356.3 → 6358.9 | 1x | Plano cerrado de la tripulación. El cronómetro cambia a **«TIEMPO DE PARADA»** en rojo, que cuenta desde 0 |
| Salida del cajón | 6358.9 | 1x | Tiempo de parada congelado en **2,627 s** junto al tiempo en pit; cabecera «SALIENDO DEL PIT»; radio «sal del box; cuidado con la línea blanca» |
| Calle de boxes | 6362–6372 | 1x | 3 cámaras fijas a lo largo de la calle, con barrido siguiendo al coche |
| Línea de salida | 6372.1 | 1x | El tiempo en pit se congela en **28,152 s** (a 6372 bajo el pórtico con reloj) y pasa a «TIEMPO TOTAL EN PIT» |
| Salida e incorporación | 6374–6379 | 1x | Plano alto de la salida y la incorporación a T1; el panel sigue vacío |
| Vuelta de salida | 6380 | 1x | Vuelve el panel normal (S 92 %, **neumático a 70 °C**); radio «empieza la vuelta de salida, vas P2»; el jugador abre los comandos de ritmo |

Recuento de fotogramas, tiempo de parada (`p1t.png`): el contador rojo marca 0,028 a 6356.3 y 2,588 a 6358.8. Son 2,56 s de juego en 2,5 s de vídeo (1x confirmado), coherente con los 2,627 que muestra (**A**).

### 2.3 Parada de LEC (vuelta 45; vídeo 108:20–108:55)
- Mismo patrón: mapa 8x → 2x → 1x, entrada, plano alto de la calle, mecánicos y salida. Tiempo de parada **2,843 s**; tiempo total en pit **29,374 s** (congelado a 6527). Sale P3 (**V-A**).
- Durante la parada aparece arriba el banner «GASLY · bloqueo en la curva 9 · ver repetición» y la cabecera muestra «BANDERA AMARILLA». Los eventos de otros coches **no interrumpen** las cámaras de la parada del jugador (**V-A**).

### 2.4 Cifras de referencia

| Medida | SAI | LEC | Real / FIA |
|---|---|---|---|
| Tiempo parado | 2,627 s | 2,843 s | Ferrari 2024: 2,2–3,0 s habitual |
| Tiempo en pit (línea a línea) | 28,152 s | 29,374 s | Bahrein ~24–25 s en total; pérdida neta ~22–23 s |
| Estimación previa «total en pit» | 23,736 s | 23,736 s | — (I: la estimación no cuadra con el tiempo medido; quizá mide otra cosa, como la pérdida neta) |
| En movimiento por la calle | ~25,5 s | ~26,5 s | Límite FIA en Bahrein: **80 km/h** |

- La calle de boxes en sí no la pude medir en metros (no hay referencia de escala). Lo único que puedo decir es que ~25,5 s a 80 km/h equivalen a ~570 m incluyendo frenada y aceleración (**I-B**).
- **Sonido del limitador (A):** con el limitador puesto, el tono del motor se queda **plano en ~188–199 Hz** (f0 estimado). Lo vi a 6364–6371 (SAI saliendo), a 6505–6508 y a 6521–6525 (LEC). En el espectrograma se ven armónicos horizontales y constantes. En el cajón suenan pistolas neumáticas y ruido metálico: el RMS sube de −24 a **−15 dB** y el centroide pasa de 2,2 a 2,8 kHz (6355–6358). En el plano lejano de la salida el sonido cae a −41 dB, es decir, la mezcla de audio depende de la cámara.

### 2.5 Después de la parada (vuelta de salida y undercut)
- Calentamiento de los blandos nuevos de SAI (**V-A**): 70 °C (106:20), 75 °C (106:30), 95 °C (107:10), 106 °C (107:30) y 109 °C (108:00). A los ~95 s (más o menos una vuelta) llega la radio «temperatura del neumático ya óptima» (107:56).
- Con las gomas frías, VER (con mediums ya calientes) le adelanta en la vuelta 44: hay **penalización real de vuelta de salida** (**V-A**).
- LEC para 3 vueltas después que SAI y 6 después que VER, y sale P3: el **undercut de VER** funcionó (**I-A**).

## 3. Estrategia, neumáticos, combustible y ERS a lo largo del stint
Panel del piloto (lectura cada 30 s): % de neumático y compuesto; temperatura del neumático; **delta de combustible en kg** (margen sobre el objetivo); temperatura del motor; % de batería ERS y su modo; puntos de ritmo (1–5) y de mezcla de combustible.

| Coche / stint | Vueltas | Desgaste | Ritmo medio | Conf. |
|---|---|---|---|---|
| LEC, M (stint 2) | 30 → 45 | 85 % → 50 % | **~2,3 %/vuelta** | A |
| LEC, S (stint 3) | 45 → 57 | 96 % → 55 % | **~3,4 %/vuelta** (atacando, con 5 puntos de ritmo muchas veces) | A |
| SAI, S (stint 2) | 30 → 42 | 85 % → 46 % | ~3,2 %/vuelta | A |
| SAI, S (stint 3) | 42 → 57 | 92 % → 46 % | ~3,0 %/vuelta | A |
| Columna «neumáticos» a 113:24 | — | VER M 68 %, SAI S 67 %, LEC S 78 % | — | A |
| Columna «neumáticos» a 117:24 | — | SAI 59 %, VER 59 %, LEC 60 % | LEC gasta ~18 puntos en 4 min de ataque | A |

- **Temperatura del neumático:** entre 112 y 126 °C. Las cifras se ponen en **rojo por encima de ~120–122 °C**. Radio de «neumático sobrecalentado» o «ligeramente sobrecalentado» (**V-A**).
- **Combustible:** el delta de LEC baja de +0,9 kg (101:00) a +0,1 kg (120:00, con un «–» a 119:00) mientras ataca. SAI acaba en +0,3/+0,4. Radios de «haz más / menos lift-and-coast» (**V-A**). Real 2024: 110 kg máximo y la regla de 1 kg de muestra no aplica aquí.
- **ERS:** la batería oscila entre 3 % y 100 % en cada vuelta. Baja al atacar (LEC 25 % en el adelantamiento de 118:04) y se recupera con «Recargar». Junto a la barra se ve un icono del modo (N, «<<» desplegar, recarga) (**V-A**). Real: 4 MJ de almacenamiento, 4 MJ/vuelta de despliegue y 120 kW de MGU-K.
- **DRS:** la etiqueta «DRS» del panel se pone verde cuando el coche está dentro de rango (LEC a 118:04, SAI a 118:16) (**V-A**). Real: menos de 1 s en el punto de detección.
- **Comandos de ritmo:** 5 niveles (Ataque, Agresivo, Estándar, Ligero, Conservar), cada uno con iconos de efecto sobre el desgaste y del delta por vuelta, y un mini gráfico de la estrategia encima (**V-A**).
- **Tácticas de piloto:** agresividad al adelantar (alta / media / baja), forma de defender (siempre / neutral / rara vez) y opciones «evitar adelantamientos arriesgados», «aire limpio» y «no luchar con el compañero». El mensaje «no dejes pasar al compañero» se ve a 103:00 (**V-A**).
- **Cambio de estrategia de LEC:** el plan era M–M (gráfico amarillo y «último stint de la estrategia»). En la vuelta 44 elige S fuera de la ventana, con el aviso de conflicto, y acaba con blandos (**V-A** el resultado; **I-M** que lo cambió en esa pantalla).
- **Modos de la columna derecha del leaderboard:** gap al líder, intervalo, neumático (compuesto + %), número de paradas («PITS»), último tiempo de vuelta y barras de algo parecido al ERS. Se cambian con unas flechas en la cabecera (**V-A**).

## 4. Batallas, adelantamientos, defensas y errores
- **Banners de evento** (arriba, en el centro, con subrayado rojo animado y «ver repetición»), los 11 que detecté: NOR/LEC ×4, SAI>PER, SAI>NOR ×2, LEC>VER, VER>SAI, SAI>VER ×2, «SAINZ ha perdido 2 posiciones», «ganador de la carrera», «choque con varios coches», «problema en el pit stop» ×2 y «bloqueo en la curva 9». Duran ~3–5 s (**V-A**).
- **El banner llega tarde respecto al cambio en el leaderboard:** en SAI>VER el orden cambia a 115:49 y el banner sale a 116:01. Parece que el adelantamiento se confirma algo después (¿al pasar por una línea de cronometraje?) (**V-A** el retraso; **I-M** la causa).
- **Ciclo de radio del ataque** (**V-A**): «ganando al rival (el gap es X)» → «adelantamiento fallido» → «adelantamiento conseguido / buen trabajo». Las posiciones perdidas tienen sus propios mensajes («posición perdida», «vamos, tú puedes»).
- **Persecución con DRS:** SAI recorta de 3,46 s a 0,16 s en ~7 vueltas (≈0,45 s/vuelta, S frente a M) y después pasa varias vueltas en 0,2–0,6 s antes de adelantar. Un adelantamiento cuesta: 3–4 vueltas dentro de rango (**V-A**).
- **Lucha a tres** en la vuelta 54: LEC (S, más gomas) pasa a SAI y a VER en la misma vuelta (T1 y T4). En el leaderboard llega a verse «VER 1, LEC +0,000», es decir, rueda con rueda (**V-A**).
- Ningún choque entre los coches de cabeza. Las cámaras de 118:05–118:08 muestran tres coches en paralelo sin solaparse (**V-M**; no sirve para medir detección de colisiones).
- **Errores:** trompo de OCO (replay con un mensaje de radio sobre patinar), bloqueo de GAS en T9, «el rival se ha ido largo», «GASLY tiene daños», chispas por tocar fondo en la recta (107:54) (**V-A**).
- **Daños:** solo se ven el mensaje de radio y el choque con humo en la repetición. No vi piezas sueltas ni un coche del jugador dañado (**V-A**).

## 5. Banderas: amarilla sí, SC/VSC no
- Escaneé el color de la cabecera a 2 fps en todo el tramo. Solo hay **amarillas** en 91:37–91:43, 104:28–104:34 y 108:22–108:24 (a 8x o 2x, así que en juego duran más). La amarilla es **por sector**: la cabecera dice «SECTOR 2» o «BANDERA AMARILLA» (**V-A**).
- **No aparece ningún Safety Car, VSC ni bandera roja** en 90:00–124:32, ni siquiera con el choque múltiple de la vuelta 31 (**A**). Por tanto, en este tramo no se puede medir la velocidad bajo SC/VSC, el delta, el agrupamiento ni las paradas bajo SC.

## 6. Final de carrera
- A 3, 10 y 15 vueltas del final, la cabecera cambia el «VUELTA N/57» por «N vueltas para el final», con el número grande en rojo y durante ~1 vuelta. En la última vuelta pone «Última vuelta» en rojo y, al cruzar el líder, «Terminado» (**V-A**).
- Al cruzar la meta, en las filas del leaderboard aparece una **bandera a cuadros** según va pasando cada coche (**V-A**).
- **El panel del piloto que ya ha terminado se pliega** a una barra fina; el del compañero sigue completo hasta que cruza (**V-A**).
- Radio: «¡piloto ganador!» con frase del piloto. Al resto, «piloto ha terminado» / «buen trabajo» (**V-A**).
- **Dirección de cámara en la vuelta de enfriamiento:** sigue por orden a cada coche que acaba (SAI, VER, NOR, PER, PIA, ALO, HAM, ALB…) y cambia a los ~3–7 s de cada uno. La fila del coche seguido se resalta (**V-A**).
- **Repetición de la victoria** (si se pide): cortinilla con el logo (~2 s) → 3–4 planos de la meta (~10 s) → cortinilla → **primer plano del piloto en la cabina celebrándolo** (~7 s) → cortinilla → vuelve al directo (**V-A**). En OverCut habría que usar una transición propia.
- El vídeo acaba en 124:32 durante la vuelta de enfriamiento: **no hay pantalla de resultados ni podio**.

## 7. Cámaras (este tramo)
- Tipos que se ven: onboard en la T-cam, onboard trasera (alerón trasero), cámara de casco (volante con la marcha visible en la pantalla), TV fija a pie de pista con barrido, TV en alto o grúa sobre las curvas, tracking lateral bajo a ras de suelo, vista de mapa 3D (el jugador la usa a 4–8x), cámaras de pit (mecánicos esperando, lateral bajo, cerrada, calle con 3 fijas, alta de la salida) y cámaras de repetición (**V-A**).
- Detector de cortes (umbral 0,3): 88 cortes en 2072 s, con mediana de 11 s y p25 de 4 s. Pero de noche se le escapan muchos cortes. En las hojas a 1 fps, la TV cambia de plano cada **~2–6 s** en las batallas y cada ~20–60 s cuando el jugador fija el onboard (**M**).
- Al acelerar el tiempo (8x) el jugador suele ir a la vista de mapa. Al llegar a su pit, la simulación baja sola a 1x (**I-M**).

## 8. Sonido del motor y cambios (espectrograma de la cámara de casco, 107:24–107:44)
- Al acelerar, los armónicos del motor forman una **sierra**: suben de forma continua y caen de golpe en cada cambio (`spec_onb.png`) (**V-A**).
- Cambios a 6448.1, 6449.5, 6450.5, 6452.7 y 6455.9. **Las marchas duran cada vez más:** 1,0 / 1,2 / 2,2 / 3,2 s, y la última se mantiene ~5,4 s. El armónico de seguimiento (280–460 Hz) llega siempre a **~395–401 Hz** antes de cambiar (cambio a régimen constante) y cae un **~9–10 %** en las marchas altas (ratio 0,87–0,91) (**A**).
- En la última marcha el tono casi no sube (388 → 390 Hz): la velocidad punta queda limitada por la resistencia. Después viene la frenada con reducciones en bajada (6461.2) (**A**).
- El volante muestra la marcha (6, 7, 8 y después 5…1, 2) (**V-A**). Real: 8 marchas y régimen limitado a 15 000 rpm; en la práctica se cambia a ~11 500–12 000.

## 9. Interfaz (por función, sin copiar textos ni assets)
- **Arriba a la izquierda:** torre de clasificación con 20 filas, cabecera de vuelta o estado y columna de modo variable. Etiquetas por fila: «EN PIT», rombo amarillo de incidente, morado de vuelta rápida y bandera a cuadros.
- **Arriba a la derecha:** pestañas de vista, hora y meteo del circuito (aire y pista en °C, probabilidad de lluvia, previsión en minutos), estado de la pista (seca, mm de agua, goma acumulada, agarre) y minimapa con los coches.
- **Abajo, izquierda y derecha:** un panel por cada coche del jugador (los mandos de la sección 3) que se puede expandir a tácticas / tiempos / telemetría. Encima salen los mensajes de radio con foto y título.
- **Abajo en el centro:** pausa, velocidad de simulación (1x/2x/4x/8x) y cámara (anterior / siguiente / tipo).
- **Arriba en el centro:** banner de evento con acceso a la repetición e indicador de investigación de comisarios.
