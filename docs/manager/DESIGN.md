# OverCut Manager — Dirección de arte y sistema de diseño

2026-11-22 · paso 1 del rediseño de la interfaz. Requisitos afectados: RNF-08 (ES + EN, todo texto por `t(es, en)`),
RNF-09 (legible sin 3D, colores de equipo con contraste suficiente), RNF-02 (fps: el 3D solo donde aporta),
SRS §2.4 (mapa de pantallas de F1 Manager 24: **solo estructura e ideas**; ningún asset, texto, logo, fuente ni
código suyo), §5 (pantallas de WKD, STF, FIN, INB, 3D).

Código de referencia: `components/OvercutManager.css` (capas 1–5), `components/atoms.js`, `components/icons.js`,
`components/Hub.js` (shell) y `components/Central.js` (pantalla de referencia). Cuando este documento y el código
discrepen, manda este documento y se corrige el código.

---

## 1. Dirección

| | |
| --- | --- |
| **Producto** | Un despacho de director de equipo para llevar una escudería real de F1, temporada a temporada, desde 1976 hasta 2026 |
| **Carácter** | Exacto, de retransmisión, con nervio (decisiones con dinero y puntos en juego) |
| **Mundo** | El muro de boxes de noche: monitores de tiempos, el azul marino de la librea del logo, el amarillo de señal (el oro del logo, el de la bandera amarilla y el del cronometraje), el flanco de un neumático |
| **Momentos** | 1) El coche real del equipo girando en su peana (GLB del manifiesto, o el procedural de su era). 2) El trazado del próximo GP dibujado con su zona DRS y la línea de salida. 3) Las tablas de clasificación con la franja de color de cada equipo |
| **Firma** | La diagonal del logo como **un corte de 45°** en el borde de salida de la acción principal (`--mn-cut`), en la ficha de valoración y en el marcador de sección activa del raíl. En ningún otro sitio |

### Por qué, desde el logo

`public/LogoOverCut.png` es un cuadrado partido por una diagonal dura: azul marino `#10294f` arriba a la izquierda,
oro `#f2b705` abajo a la derecha, letras de palo seco muy pesadas en hueso `#f3f1e9` y tinta `#0e0f12`, un
neumático como «O» y un monoplaza en silueta. De ahí salen cuatro decisiones:

1. **Superficies oscuras con tinte marino**, no el marino puro: el jugador mira tablas durante horas y el color
   tiene que estar en los datos. El marino del logo queda como tinte del grafito (`--mn-bg #0b111b`…`--mn-surface-3`).
2. **Un solo acento: el oro.** Marca la acción que mueve la temporada (Continuar), la selección y la cifra que
   importa. Nunca fondos dorados grandes, nunca degradados, nunca brillo.
3. **Bordes duros.** Radios de 2–8 px, nada de píldoras; el corte diagonal es la única forma «expresiva».
4. **Tipo ancho y pesado solo en titulares.** Archivo con su eje de anchura (`font-stretch: 112%`) y peso 700 para
   el nombre del GP y del equipo, como el rótulo del logo; el resto de la interfaz en 400–600.

Lo que se ha quitado del estado anterior (auditoría *unslop*): el gran lavado diagonal semitransparente sobre todo
el contenido (`.mn-cut` ahora solo en el asistente de inicio), títulos en mayúsculas con tracking en cada panel y
etiqueta, monoespaciada en mayúsculas para todos los rótulos, botones con corte por todas partes, el pulso del
botón «Volver al fin de semana» y del segmento actual de la tira de temporada, la cabecera tapada por la barra
fija del sitio.

---

## 2. Tokens

Todos viven en `.mn-root` (capa 1 de `OvercutManager.css`). Una regla de componente lee tokens, nunca valores
sueltos. Los nombres antiguos (`--mn-navy`, `--mn-gold`, `--mn-bone`, `--mn-line`, `--mn-panel`…) siguen como
alias para las pantallas aún no migradas; **no usarlos en código nuevo**.

**Tema.** Solo oscuro. Es un muro de boxes, la vista 3D y los coches se leen mejor sobre oscuro y el resto de
OverCut (cabecera y pie del sitio) ya es oscuro. Un tema claro no aporta y duplica la verificación de contraste.

### 2.1 Color

| Rol | Token | Valor | Uso |
| --- | --- | --- | --- |
| Fondo | `--mn-bg` | `#0b111b` | Página |
| Superficie 0 | `--mn-surface-0` | `#0e1520` | Raíl, barra de contexto, pozos (mapa, peana del coche) |
| Superficie 1 | `--mn-surface-1` | `#131c2b` | Tarjetas (`Panel`, `StatTile`) |
| Superficie 2 | `--mn-surface-2` | `#1a2436` | Hover, elementos dentro de una tarjeta, item activo |
| Superficie 3 | `--mn-surface-3` | `#222e43` | Pistas de barras, segmento activo, presionado |
| Línea | `--mn-hairline` / `--mn-hairline-strong` | 8 % / 14 % de `#e2e8f2` | Separadores / bordes de controles y cabecera de tabla |
| Texto 1 | `--mn-text` | `#f1efe8` (hueso del logo) | Contenido, cifras |
| Texto 2 | `--mn-text-2` | `#a9b2c1` | Secundario, etiquetas de barra |
| Texto 3 | `--mn-text-3` | `#808ca2` (4,9:1 sobre surface-1) | Meta, cabeceras de tabla, rótulos de grupo |
| Acento | `--mn-accent` (+`-hover`, `-ink`, `-soft`, `-line`) | `#f2b705` | Acción principal, selección, fila propia (`-soft`), cifra clave |
| Positivo | `--mn-pos` | `#4cc38a` | Mejora, objetivo en camino, DRS en el plano |
| Negativo | `--mn-neg` | `#ef5b52` | Pérdida, caja negativa, fin de semana en vivo |
| Aviso | `--mn-warn` | `#f0a43a` | Decisiones pendientes, objetivo «cerca», sin conexión |
| Info | `--mn-info` | `#5aa2e6` | Lluvia, datos neutros con significado |
| Mejor | `--mn-best` | `#b07cf2` | Mejor vuelta/sector absoluto (convención de cronometraje); solo en tiempos |
| Dato neutro | `--mn-data` | `#8a9cbc` | Serie «resto», barras de perfil |

**Neumáticos** (`--mn-tyre-soft/medium/hard/inter/wet`: `#e8463c`, `#f2c230`, `#ebe8df`, `#3fae4a`, `#3d8fe0`;
`TYRE_COLORS` en `atoms.js` los refleja). Siempre con la letra del compuesto (`Tyre`), nunca solo color.

**Banderas y dirección de carrera** (`--mn-flag-green/yellow/red/blue/sc`). Siempre con texto o icono además del color.

### 2.2 Colores de equipo (RNF-09)

- `--team` / `--team2` se fijan en `.mn-root` desde la partida. Son **identidad, no interfaz**: no tiñen fondos de
  tarjeta ni botones.
- Donde pueden aparecer: franja de 3 px en tablas (`TeamStripe`), borde superior de 3 px de la tarjeta del próximo
  GP y de las hojas, la línea superior de 2 px de la barra de contexto, librea del coche.
- **Contraste:** cualquier color de equipo usado como línea o texto sobre superficies oscuras pasa por
  `readableOn(hex, fondo = SURFACE, min = 3)` (`atoms.js`), que aclara el mismo tono hasta 3:1. Si se rellena una
  superficie con el color del equipo y lleva texto, el texto usa `inkOn(hex)` (`engine/identity.js`).
- El color nunca es el único portador de información: la franja va junto al nombre del equipo.

### 2.3 Tipografía

Familias (enlazadas en `public/index.html` desde Google Fonts; sin dependencias npm):

- `--mn-font`: **Archivo** (variable, `wdth 62–125`, `wght 400–800`), con pila de sistema de respaldo.
- `--mn-mono`: **Chivo Mono** (400–600): tiempos, gaps, códigos, pie de los mapas. No para rótulos.

Escala (rem sobre 16 px; la raíz del módulo es 14 px):

| Token | px | Uso |
| --- | --- | --- |
| `--mn-fs-40` | 40 | Titular héroe (nombre del GP), 700, `font-stretch: 112%`. 28 en móvil |
| `--mn-fs-28` | 28 | Título de página (`PageHeader`), cifra de `StatTile`; 600, ancho 108–112 % |
| `--mn-fs-20` | 20 | Cifras secundarias, títulos de hoja en móvil |
| `--mn-fs-16` | 16 | Título de tarjeta, nombre del equipo en la barra |
| `--mn-fs-14` | 14 | Texto base, filas de lista |
| `--mn-fs-13` | 13 | Tablas, botones, navegación |
| `--mn-fs-12` | 12 | Etiquetas, meta |
| `--mn-fs-11` | 11 | Cabeceras de tabla, contadores, pie mono. **Mínimo absoluto** (también en móvil) |

Reglas: pesos 400/500/600; 700 solo en titular héroe, nombre del equipo y marca del raíl. Mayúsculas de frase
siempre (nada de `text-transform: uppercase` con tracking). Sin cursiva. `font-variant-numeric: tabular-nums` en
todo el módulo. Un formato por magnitud: dinero con `money()`, posiciones con `ordinal()`, fechas con `shortDate()`.

### 2.4 Espacio, radios, elevación

- Rejilla de 4 px: `--mn-s-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48.
- Densidad: navegación filas de 36 px con 2 px entre ellas; filas de tabla 36 (32 en `dense`); tarjetas padding 20
  (24 el héroe, 16 en móvil); separación entre tarjetas 16 (12 en móvil); márgenes de página 24 (16 en móvil).
- Radios: `--mn-r-1` 2 (barras, fichas, chips) · `-2` 4 (controles, botones) · `-3` 6 (tarjetas) · `-4` 8 (hojas).
  Radio interior = exterior − padding, mínimo 2.
- Elevación: la profundidad sale de los pasos de superficie y las líneas. Sombra solo en lo que flota: `--mn-e-2`
  (popover) y `--mn-e-3` (hoja/modal).

### 2.5 Iconografía

- Solo `components/icons.js`: dibujos propios en rejilla 24, trazo 1,6, puntas y uniones redondeadas,
  `currentColor`. Tamaños: 16 en botones y tablas, 18 en el raíl, 20 en la barra inferior móvil.
- El icono toma el rol de texto de su etiqueta (normalmente texto 2/3). Única excepción: el icono del item activo
  del raíl y de la barra inferior va en acento.
- Columna fija para iconos (18 px en el raíl) y separación fija de 12 px con la etiqueta.
- Nada de emoji. Las pantallas que aún importan `react-icons/lu` deben pasar a `icons.js` al migrar; si falta un
  icono, se dibuja en `icons.js` con las mismas reglas.

### 2.6 Movimiento

- Una curva: `--mn-ease` `cubic-bezier(0.2, 0.7, 0.2, 1)`. Duraciones: `--mn-dur-1` 120 ms (hover, color),
  `--mn-dur-2` 200 ms (hojas, menús), `--mn-dur-3` 280 ms (entrada del contenido, barras que cambian de valor).
- Se animan solo `color`, `background-color`, `border-color`, `opacity` y `transform` (nombrados, nunca `all`).
- Una entrada por pantalla (`mn-rise`: 6 px y fundido). Presionar = `translateY(1px)`. Sin escalados en hover.
- Nada en bucle salvo lo que está vivo de verdad (crono en marcha en la sesión en vivo). El botón «Volver al fin de
  semana» es rojo y fijo, con icono de radio; no late.
- `prefers-reduced-motion` anula duraciones (regla ya presente al final de la capa de respuesta).

---

## 3. Rejilla y shell

### 3.1 Escritorio (≥ 1280 px)

```text
┌ cabecera fija del sitio (OverCut) ─────────────────────────────────────────────────────┐
├──────────┬─────────────────────────────────────────────────────────────────────────────┤
│ RAÍL 232 │ BARRA DE CONTEXTO 60 (sticky): equipo · temporada/ronda · próximo GP ·        │
│ marca    │   caja · directiva · guardar · [Continuar]                                    │
│ Despacho │ tira de temporada (un segmento por ronda)                                     │
│ Equipo   ├─────────────────────────────────────────────────────────────────────────────┤
│ Temporada│ CONTENIDO  máx. 1480, márgenes 24, rejilla de 12 columnas, gap 16             │
│ ─────    │                                                                              │
│ guardar  │                                                                              │
│ salir    │                                                                              │
└──────────┴─────────────────────────────────────────────────────────────────────────────┘
```

- `Hub.js` mide la cabecera fija del sitio y publica `--mn-site-top` (para los `sticky`) y `--mn-site-pad`
  (lo que tapa en el scroll 0). Cualquier elemento fijo o pegajoso del módulo usa `top: var(--mn-site-top)`.
- Raíl agrupado: **Despacho** (Central, Bandeja), **Equipo** (Pilotos, Coche e I+D, Personal, Mercado, Oficina),
  **Temporada** (Mundial, Calendario). Contador de la bandeja en acento. Pie: guardar (punto de estado), salir al
  Modo Carrera, menú principal, fuente de datos.
- 761–1279 px: el raíl se queda en 64 px solo con iconos (etiquetas accesibles ocultas, `title` con el nombre).
  La barra de contexto suelta la directiva por debajo de 1100 y el próximo GP por debajo de 960.

### 3.2 Móvil (360–760 px)

- Sin raíl. Barra inferior fija de 5: Central, Bandeja, Coche e I+D, Mundial, Más (hoja con el resto, exportar,
  Modo Carrera, menú principal). Contador sobre el icono.
- **Continuar** acoplado encima de la barra inferior, a todo el ancho (`.mn-dock`); el contenido reserva 136 px
  abajo. Respeta `--mn-ad-space` cuando hay anuncio inferior.
- Barra de contexto en una fila: escudo, equipo, «gestor · año · ronda», caja y guardar.
- Todo en una columna, en orden de lectura; las tablas se simplifican (menos columnas), no se encogen; nada bajo 11 px.
- Probado a 390×844; no hay scroll horizontal a 360.

### 3.3 Rejilla de contenido

12 columnas en escritorio, colapsos a 2 columnas (≤ 1200: héroe y coche a ancho completo) y a 1 columna (≤ 760).
Las tarjetas de una fila se estiran a la misma altura (`align-items: stretch`). Ritmo: una pieza ancha + una
estrecha, nunca filas de tarjetas iguales salvo la fila de cifras.

---

## 4. Inventario de componentes (`atoms.js`)

| Componente | Props clave | Cuándo |
| --- | --- | --- |
| `PageHeader` | `title`, `meta`, `actions` | Primera fila de cada pantalla del HQ. Título = nombre de la sección; `meta` = contexto concreto (temporada, recuento). Máx. 1 acción primaria + 1 secundaria. En móvil la Central lo oculta (la barra de contexto ya lo dice) |
| `Panel` | `title`, `meta`, `action`, `flush`, `className` | La tarjeta. `action` es un enlace discreto (`mn-link`) o un `Tabs`/`Segmented` pequeño. `flush` cuando el cuerpo es una tabla o imagen a sangre |
| `StatTile` | `label`, `value`, `unit`, `delta`, `trend`, `hint`, `accent`, `onClick` | Cifras que importan. Siempre dicen con qué se comparan (`hint`: «a 12 pts del líder», «vs. año pasado»). Sin mini-gráficos ni iconos. `accent` solo para una cifra por pantalla |
| `DataTable` | `columns`, `rows`, `rowKey`, `highlight`, `onRowClick`, `dense`, `empty`, `caption` | Toda tabla nueva (ver §5) |
| `Tabs` | `options [{value,label,count}]`, `value`, `onChange` | Cambiar de vista dentro de una tarjeta o página (constructores/pilotos) |
| `Segmented` | (sin cambios) | Elegir un valor de un control (ritmo, compuesto, foco). No para navegar |
| `IconButton` | `icon`, `label` (obligatorio), `active` | Acciones de icono solo; `label` es el nombre accesible y el `title` |
| `Badge` | `tone` (neutral, accent, pos, neg, warn, info), `dot` | Estado en texto discreto con punto opcional. Sustituye a `Pill` en código nuevo |
| `Pill` | `tone` | Heredado: caja de línea fina. Se mantiene para pantallas antiguas |
| `EmptyState` | `title`, `body`, `action`, `compact` | «Nada aún», dicho llano y con lo que hay que hacer |
| `Meter` | `value` 0–100, `tone` auto (neg < 30 ≤ warn < 50 ≤ pos) | Confianza, moral, fiabilidad. 6 px |
| `Bar` | `value`, `marker`, `tone`, `label`, `caption` | Atributos y perfiles con escala; `marker` = mejor de la parrilla |
| `Rating` | `value`, `size` | Valoración 0–100 con corte diagonal; banda por color, texto siempre oscuro |
| `TeamBadge` | `team`, `size` | Escudo del equipo (logo real o siglas con `inkOn`) |
| `TeamStripe` | `color`, `height` | Marca del equipo en filas de tabla y listas; aplica `readableOn` |
| `Flag`, `Tyre` | | Bandera de país; neumático con letra del compuesto y vueltas |
| `Livery` | `teamRef`, `year`, `color(2)`, `width`, `height` | El coche: GLB del manifiesto si existe, procedural si no, perfil 2D sin WebGL. Una sola instancia 3D visible por pantalla (RNF-02). Relación de aspecto ≥ 2,1:1 (ver problemas conocidos) |
| `Sheet` | `open`, `onClose`, `title`, `wide` | Detalle o confirmación modal; hoja inferior en móvil |
| `Kbd` | | Tecla de atajo |
| `readableOn`, `contrastRatio`, `SURFACE` | | Utilidades de contraste para colores de equipo |

Botones (`mn-btn`): primario (oro con corte; uno por vista), normal (superficie 2), `--ghost` (transparente),
`--danger` (línea roja), tamaños `--sm` 28 px, normal 36, `--xl` 48. `ContinueButton` es el primario global y vive
en la barra de contexto (y en el héroe de la Central / el dock en móvil).

Iconos (`icons.js`): `IconHome, IconInbox, IconHelmet, IconTyre, IconTransfer, IconHeadset, IconTrophy,
IconCalendar, IconBriefcase, IconSave, IconDownload, IconExit, IconMore, IconPlay, IconFastForward,
IconChevronRight, IconChevronLeft, IconClose, IconRail, IconGauge, IconAlert, IconRain, IconWallet, IconFlag,
IconClock, IconRadio, IconCheck, IconArrowUp, IconArrowDown` (todos con `size` y `title` opcional).

---

## 5. Tablas de datos

Aplican a torres de tiempos, clasificaciones, resultados, mercado, transacciones.

1. **Columnas:** posición (mono 12, texto 3, 44 px) → identidad (franja de equipo + nombre, 500) → datos →
   la cifra que se ordena, a la derecha y en 600. Números siempre a la derecha, texto a la izquierda.
2. **Cabecera:** 11 px, 500, texto 3, frase («Pos», «Equipo», «Pts»), línea inferior fuerte. Sin mayúsculas.
3. **Filas:** 36 px (32 en `dense`), separador de 8 %. Hover = superficie 2. Fila propia = `--mn-accent-soft` y
   2 px de oro a la izquierda (`highlight`). Foco de teclado = contorno oro de 2 px. Seleccionada (si hay
   selección distinta de «propia») = superficie 3 + línea fuerte.
4. **Tiempos y gaps:** Chivo Mono 12, `tabular-nums`; `+1.234`, vueltas como `+1 v`/`+1 L`. Mejor absoluto en
   `--mn-best`, mejor personal en `--mn-pos`; peor/retirado en texto 3.
5. **Torre de tiempos (en vivo):** 32 px por fila, posición · franja · código de 3 letras · gap · neumático
   (`Tyre` 18 px con vueltas) · estado (BOX, OUT, DNF como `Badge`). Los cambios de posición se marcan con
   `IconArrowUp/Down` en pos/neg durante 3 s, sin animar la fila.
6. **Clasificaciones:** fila propia siempre visible: si cae fuera del top N, se añade al final (ver `MiniStandings`).
7. **Transacciones:** fecha (mono) · concepto · categoría (`Badge`) · importe a la derecha, positivo en
   `--mn-pos`, negativo en `--mn-neg`, con signo; total al pie en 600 con línea fuerte encima.
8. **Móvil:** quitar columnas secundarias (victorias, podios, chasis) antes que reducir tamaño; scroll horizontal
   solo dentro de `.mn-dt-wrap` y nunca para la columna de identidad.

---

## 6. Plantillas de pantalla

### 6.1 Shell — `Hub.js`

Ya implementado (§3). Las pantallas no pintan su propia cabecera de equipo ni su navegación; empiezan con
`PageHeader` dentro de `.mn-main`.

### 6.2 Dashboard — `Central.js` (referencia implementada)

```text
PageHeader  Central · Temporada 2012 · 20 Grandes Premios
[ PRÓXIMO GP (8) ─ bandera + nombre 40/700 · meta    ][ COCHE (4) ─ peana 3D ]
[  plano del circuito │ perfil (4 barras)            ][  valoración · pilotos ]
[  Continuar · Simular · aviso de decisiones         ][                       ]
[ Constructores ][ Mejor piloto ][ Última carrera ][ Confianza ]   ← StatTile × 4
[ Mundial (5) Tabs+DataTable ][ Último resultado (3) ][ Directiva (4) ]
[ Bandeja (6) ][ Paddock (6) ]
```

Invierno: el héroe pasa a «Preparando 20xx» con `StatTile` de balance, lista de tareas y ofertas.

### 6.3 Pantalla de datos — Mundial, Mercado, Personal, Calendario, Oficina (finanzas)

- `PageHeader` con `Tabs` o `Segmented` de vista y, a la derecha, filtros.
- Una tabla principal a ancho de 8–12 columnas (`Panel flush` + `DataTable`), con un panel lateral de 4 para el
  detalle de la fila elegida o un resumen (`StatTile` en vertical).
- **Mundial:** tabla completa de constructores/pilotos; lateral con gráfico de puntos por ronda (una línea en
  `readableOn(team)` para el equipo propio, el resto en `--mn-data`).
- **Mercado / Personal:** tabla de candidatos (rol, edad, valoración `Rating`, salario, contrato); lateral con la
  ficha y el botón de negociar; la negociación abre `Sheet wide`.
- **Calendario:** lista de rondas (fecha mono, bandera, GP, formato, resultado propio como `Badge`); la ronda actual
  con borde oro; detalle con `CircuitCard`.
- **Oficina:** fila de `StatTile` (caja, techo de gasto si la era lo tiene, ingresos, gastos), tabla de
  transacciones (§5.7), patrocinadores y junta en paneles de 4.

### 6.4 Detalle / Hoja — Pilotos, Coche e I+D, ficha de persona, Negociación

- Cabecera de detalle: identidad grande (nombre 28/600 ancho 112 %, `TeamBadge`/bandera, `Rating lg`), meta
  (edad, contrato, rol) y acciones.
- Cuerpo en dos columnas 7/5: izquierda atributos (`Bar` con `marker` = mejor de la parrilla), derecha contrato,
  moral (`Meter`), historial (`DataTable dense`).
- **Coche e I+D:** el `Livery` grande es el único 3D de la pantalla; debajo, áreas como `Bar` con posición en la
  parrilla; proyectos como tabla (pieza, ritmo, coste, días, riesgo) con un único botón primario «Encargar diseño».
- En móvil una columna y las acciones fijas abajo, encima de la barra inferior (mismo patrón que `.mn-dock`).
- `Sheet` para confirmaciones y formularios cortos; nunca para una pantalla completa.

### 6.5 Sesión en vivo — `Weekend.js`, `SessionLive.js`, `LiveRace.js`

- Pantalla completa sobre el HQ, con `top: var(--mn-site-top)` para no quedar bajo la cabecera del sitio.
- Tres zonas: torre de tiempos a la izquierda (§5.5, 280–320 px), vista central (3D `Race3D` o mapa 2D
  equivalente; RF-3D-04 y RNF-09: el 2D debe bastar para jugar), panel de órdenes a la derecha (pilotos propios:
  neumático, ritmo `Segmented`, energía si la era la tiene, parada).
- Barra inferior de reproducción: pausa, velocidad (`Segmented` ×1…×16), cámara, saltar al siguiente evento.
- Banderas y SC como franja de estado arriba con el color de bandera y texto («Coche de seguridad», «VSC»).
- Los grafismos tipo retransmisión (rótulos de piloto, torre) usan las superficies y tipos de este sistema, no
  blanco puro con cursivas: texto hueso sobre `--mn-surface-0` al 92 %, franja de equipo, cifras mono.
- Móvil: la vista arriba (16:9), la torre como lista desplegable de 5 filas alrededor del piloto propio y las
  órdenes en hoja inferior.

---

## 7. Comprobación antes de dar una pantalla por terminada

- [ ] Todo texto por `t(es, en)`; nombres reales sin traducir (RNF-08)
- [ ] Solo tokens; espaciados en la rejilla de 4; radios de la tabla
- [ ] Un primario por vista; un `accent` de cifra como mucho
- [ ] Colores de equipo vía `TeamStripe`/`readableOn`/`inkOn` (RNF-09); nada que dependa solo del color
- [ ] Iconos de `icons.js`, 16/18/20, color del texto
- [ ] Sin mayúsculas con tracking, sin cursiva, sin texto < 11 px, sin signos de exclamación
- [ ] Sin animaciones en bucle ni `transition: all`
- [ ] 1440×900 y 390×844 vistos en navegador; sin scroll horizontal a 360
- [ ] Una sola escena 3D a la vez (RNF-02); la pantalla funciona sin WebGL
- [ ] `CI=true npx react-scripts test --watchAll=false --testPathPattern overcutManager` en verde
