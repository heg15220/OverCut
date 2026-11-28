# Validación estadística de temporadas (criterio 7.2)

Generado por `overcut/frontend/scripts/validateSeasons.js` el 2026-11-28.
Modo strict, 1000 simulaciones por temporada sin intervención (carrera espectadora, modo rápido),
15 hilos, 2370.3 s en total (62.4 ms por temporada simulada y hilo-equivalente 935.7 ms).

**Veredicto: CUMPLE.** Campeón real como más probable en 35/38 temporadas (92.1 %; mínimo 70 %), Spearman medio 0.918 (mínimo 0,8).

| Año | Campeón real | P(campeón real) | Rango del real | Más probable (top 3) | Spearman medio (σ) |
| --- | --- | --- | --- | --- | --- |
| 1976 | ferrari | 32.2 % | 2 | mclaren 40.4 %, ferrari 32.2 %, tyrrell 26.5 % | 0.785 (0.076) |
| 1986 | williams | 85 % | 1 | williams 85 %, mclaren 8.3 %, lotus 6.3 % | 0.860 (0.079) |
| 1988 | mclaren | 98.9 % | 1 | mclaren 98.9 %, ferrari 1.1 % | 0.907 (0.054) |
| 1990 | mclaren | 86.5 % | 1 | mclaren 86.5 %, ferrari 9.1 %, williams 2 % | 0.842 (0.069) |
| 1991 | mclaren | 69.2 % | 1 | mclaren 69.2 %, williams 30.8 % | 0.812 (0.088) |
| 1992 | williams | 93.3 % | 1 | williams 93.3 %, benetton 5.9 %, mclaren 0.8 % | 0.770 (0.090) |
| 1993 | williams | 100 % | 1 | williams 100 % | 0.809 (0.099) |
| 1994 | williams | 48.1 % | 2 | benetton 50 %, williams 48.1 %, ferrari 1.9 % | 0.913 (0.048) |
| 1995 | benetton | 90.2 % | 1 | benetton 90.2 %, williams 9.8 % | 0.874 (0.055) |
| 1996 | williams | 99.9 % | 1 | williams 99.9 %, ferrari 0.1 % | 0.928 (0.047) |
| 1997 | williams | 77.1 % | 1 | williams 77.1 %, benetton 18.5 %, ferrari 4.4 % | 0.882 (0.042) |
| 1998 | mclaren | 58.1 % | 1 | mclaren 58.1 %, ferrari 41.8 %, williams 0.1 % | 0.920 (0.035) |
| 1999 | ferrari | 80.6 % | 1 | ferrari 80.6 %, mclaren 19.4 % | 0.959 (0.028) |
| 2000 | ferrari | 51.5 % | 1 | ferrari 51.5 %, mclaren 48.5 % | 0.868 (0.061) |
| 2001 | ferrari | 100 % | 1 | ferrari 100 % | 0.927 (0.042) |
| 2002 | ferrari | 99.7 % | 1 | ferrari 99.7 %, williams 0.3 % | 0.896 (0.054) |
| 2003 | ferrari | 76.3 % | 1 | ferrari 76.3 %, williams 21.7 %, mclaren 2 % | 0.884 (0.051) |
| 2004 | ferrari | 99.9 % | 1 | ferrari 99.9 %, bar 0.1 % | 0.968 (0.027) |
| 2005 | renault | 82.4 % | 1 | renault 82.4 %, mclaren 16.2 %, ferrari 0.8 % | 0.943 (0.036) |
| 2006 | renault | 11.9 % | 2 | ferrari 88.1 %, renault 11.9 % | 0.967 (0.018) |
| 2007 | ferrari | 100 % | 1 | ferrari 100 % | 0.932 (0.038) |
| 2008 | ferrari | 56.2 % | 1 | ferrari 56.2 %, mclaren 33.3 %, bmw-sauber 10.5 % | 0.952 (0.028) |
| 2009 | brawn | 89.4 % | 1 | brawn 89.4 %, red-bull 10.5 %, ferrari 0.1 % | 0.937 (0.032) |
| 2010 | red-bull | 53.3 % | 1 | red-bull 53.3 %, mclaren 33.8 %, ferrari 12.9 % | 0.970 (0.015) |
| 2011 | red-bull | 97.7 % | 1 | red-bull 97.7 %, mclaren 2.3 % | 0.979 (0.012) |
| 2012 | red-bull | 73.8 % | 1 | red-bull 73.8 %, ferrari 18.4 %, mclaren 7.7 % | 0.941 (0.021) |
| 2013 | red-bull | 78 % | 1 | red-bull 78 %, mercedes 21.7 %, ferrari 0.3 % | 0.979 (0.013) |
| 2014 | mercedes | 100 % | 1 | mercedes 100 % | 0.960 (0.024) |
| 2016 | mercedes | 100 % | 1 | mercedes 100 % | 0.979 (0.016) |
| 2018 | mercedes | 85.6 % | 1 | mercedes 85.6 %, ferrari 14.4 % | 0.919 (0.034) |
| 2019 | mercedes | 98.1 % | 1 | mercedes 98.1 %, ferrari 1.9 % | 0.973 (0.025) |
| 2020 | mercedes | 100 % | 1 | mercedes 100 % | 0.946 (0.026) |
| 2021 | mercedes | 86 % | 1 | mercedes 86 %, red-bull 14 % | 0.970 (0.019) |
| 2022 | red-bull | 97.3 % | 1 | red-bull 97.3 %, ferrari 2.7 % | 0.937 (0.037) |
| 2023 | red-bull | 100 % | 1 | red-bull 100 % | 0.940 (0.031) |
| 2024 | mclaren | 88.9 % | 1 | mclaren 88.9 %, red-bull 8.6 %, ferrari 2.5 % | 0.934 (0.029) |
| 2025 | mclaren | 100 % | 1 | mclaren 100 % | 0.963 (0.021) |
| 2026 | mercedes | 93.9 % | 1 | mercedes 93.9 %, ferrari 6 %, mclaren 0.1 % | 0.976 (0.014) |

## Método

- Cada simulación es una carrera espectadora (`createCareer({ spectator: true })`): ningún equipo es del jugador, todos corren sus inscritos reales de cada GP, desarrollan con la IA y, en modo estricto, siguen el ancla guiada del pack (RF-CAR-05, SRS 6.1; `data/balance/historical-anchors.json`). No hay junta, cuentas, dilemas ni correo.
- Semilla `val-<año>-<n>`: cada ejecución se reproduce exactamente (RNF-05). Fines de semana en modo rápido (`race.js`).
- Orden real: clasificación de constructores del pack (`standings.constructors`). Spearman sobre los equipos presentes en ambos órdenes.
- Criterio 7.2: el campeón real debe ser el más probable en ≥ 70 % de las temporadas y la media de Spearman ≥ 0,8.
