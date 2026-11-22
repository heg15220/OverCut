# Validación estadística de temporadas (criterio 7.2)

Generado por `overcut/frontend/scripts/validateSeasons.js` el 2026-11-22.
Modo free, 1000 simulaciones por temporada sin intervención (carrera espectadora, modo rápido),
15 hilos, 855.8 s en total (22.5 ms por temporada simulada y hilo-equivalente 337.8 ms).

**Veredicto: CUMPLE.** Campeón real como más probable en 28/38 temporadas (73.7 %; mínimo 70 %), Spearman medio 0.901 (mínimo 0,8).

| Año | Campeón real | P(campeón real) | Rango del real | Más probable (top 3) | Spearman medio (σ) |
| --- | --- | --- | --- | --- | --- |
| 1976 | ferrari | 4.1 % | 2 | mclaren 94 %, ferrari 4.1 %, tyrrell 1.9 % | 0.864 (0.044) |
| 1986 | williams | 81.4 % | 1 | williams 81.4 %, lotus 18.5 %, mclaren 0.1 % | 0.878 (0.052) |
| 1988 | mclaren | 99.9 % | 1 | mclaren 99.9 %, ferrari 0.1 % | 0.925 (0.037) |
| 1990 | mclaren | 100 % | 1 | mclaren 100 % | 0.847 (0.045) |
| 1991 | mclaren | 89.8 % | 1 | mclaren 89.8 %, williams 10.2 % | 0.876 (0.046) |
| 1992 | williams | 99.6 % | 1 | williams 99.6 %, mclaren 0.4 % | 0.903 (0.045) |
| 1993 | williams | 100 % | 1 | williams 100 % | 0.840 (0.054) |
| 1994 | williams | 59.7 % | 1 | williams 59.7 %, benetton 39.6 %, ferrari 0.7 % | 0.860 (0.049) |
| 1995 | benetton | 54.9 % | 1 | benetton 54.9 %, williams 45.1 % | 0.883 (0.041) |
| 1996 | williams | 100 % | 1 | williams 100 % | 0.913 (0.051) |
| 1997 | williams | 100 % | 1 | williams 100 % | 0.855 (0.061) |
| 1998 | mclaren | 97.4 % | 1 | mclaren 97.4 %, ferrari 2.6 % | 0.932 (0.029) |
| 1999 | ferrari | 0.2 % | 2 | mclaren 99.7 %, ferrari 0.2 %, jordan 0.1 % | 0.955 (0.024) |
| 2000 | ferrari | 73.9 % | 1 | ferrari 73.9 %, mclaren 26.1 % | 0.891 (0.041) |
| 2001 | ferrari | 94.5 % | 1 | ferrari 94.5 %, williams 5.5 % | 0.918 (0.039) |
| 2002 | ferrari | 46.9 % | 2 | williams 53.1 %, ferrari 46.9 % | 0.865 (0.049) |
| 2003 | ferrari | 32.8 % | 2 | williams 67 %, ferrari 32.8 %, mclaren 0.2 % | 0.839 (0.039) |
| 2004 | ferrari | 98.2 % | 1 | ferrari 98.2 %, williams 1.8 % | 0.892 (0.030) |
| 2005 | renault | 18.1 % | 2 | mclaren 81.9 %, renault 18.1 % | 0.901 (0.027) |
| 2006 | renault | 0 % | — | ferrari 99.9 %, mclaren 0.1 % | 0.912 (0.027) |
| 2007 | ferrari | 9.3 % | 2 | mclaren 90.7 %, ferrari 9.3 % | 0.891 (0.041) |
| 2008 | ferrari | 96.1 % | 1 | ferrari 96.1 %, mclaren 3.9 % | 0.982 (0.017) |
| 2009 | brawn | 0 % | — | red-bull 100 % | 0.830 (0.039) |
| 2010 | red-bull | 97.7 % | 1 | red-bull 97.7 %, ferrari 1.9 %, mclaren 0.3 % | 0.964 (0.014) |
| 2011 | red-bull | 99.9 % | 1 | red-bull 99.9 %, mclaren 0.1 % | 0.972 (0.014) |
| 2012 | red-bull | 28.8 % | 2 | mclaren 71.2 %, red-bull 28.8 % | 0.885 (0.032) |
| 2013 | red-bull | 88 % | 1 | red-bull 88 %, mercedes 12 % | 0.938 (0.019) |
| 2014 | mercedes | 99.9 % | 1 | mercedes 99.9 %, williams 0.1 % | 0.952 (0.019) |
| 2016 | mercedes | 100 % | 1 | mercedes 100 % | 0.962 (0.018) |
| 2018 | mercedes | 80.7 % | 1 | mercedes 80.7 %, ferrari 19.3 % | 0.837 (0.042) |
| 2019 | mercedes | 97.7 % | 1 | mercedes 97.7 %, ferrari 2.3 % | 0.872 (0.038) |
| 2020 | mercedes | 100 % | 1 | mercedes 100 % | 0.879 (0.037) |
| 2021 | mercedes | 100 % | 1 | mercedes 100 % | 0.913 (0.020) |
| 2022 | red-bull | 93.7 % | 1 | red-bull 93.7 %, ferrari 6.3 % | 0.921 (0.030) |
| 2023 | red-bull | 99.9 % | 1 | red-bull 99.9 %, ferrari 0.1 % | 0.910 (0.021) |
| 2024 | mclaren | 0 % | — | red-bull 100 % | 0.868 (0.034) |
| 2025 | mclaren | 99.3 % | 1 | mclaren 99.3 %, red-bull 0.7 % | 0.944 (0.020) |
| 2026 | mercedes | 100 % | 1 | mercedes 100 % | 0.976 (0.011) |

## Método

- Cada simulación es una carrera espectadora (`createCareer({ spectator: true })`): ningún equipo es del jugador, todos corren sus inscritos reales de cada GP, desarrollan con la IA y, en modo estricto, siguen el ancla guiada del pack (RF-CAR-05, SRS 6.1; `data/balance/historical-anchors.json`). No hay junta, cuentas, dilemas ni correo.
- Semilla `val-<año>-<n>`: cada ejecución se reproduce exactamente (RNF-05). Fines de semana en modo rápido (`race.js`).
- Orden real: clasificación de constructores del pack (`standings.constructors`). Spearman sobre los equipos presentes en ambos órdenes.
- Criterio 7.2: el campeón real debe ser el más probable en ≥ 70 % de las temporadas y la media de Spearman ≥ 0,8.
