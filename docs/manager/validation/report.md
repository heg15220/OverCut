# Validación estadística de temporadas (criterio 7.2)

Generado por `overcut/frontend/scripts/validateSeasons.js` el 2026-11-22.
Modo strict, 1000 simulaciones por temporada sin intervención (carrera espectadora, modo rápido),
15 hilos, 781.0 s en total (20.6 ms por temporada simulada y hilo-equivalente 308.3 ms).

**Veredicto: CUMPLE.** Campeón real como más probable en 35/38 temporadas (92.1 %; mínimo 70 %), Spearman medio 0.929 (mínimo 0,8).

Antes (free, 1000 ejecuciones): campeón real como más probable en 28/38 (73.7 %), Spearman medio 0.901.

| Año | Campeón real | P(campeón real) | Rango del real | Más probable (top 3) | Spearman medio (σ) | Antes: P / rango / ρ |
| --- | --- | --- | --- | --- | --- | --- |
| 1976 | ferrari | 16.7 % | 2 | mclaren 77.4 %, ferrari 16.7 %, tyrrell 5.9 % | 0.836 (0.056) | 4.1 % / 2 / 0.864 |
| 1986 | williams | 97 % | 1 | williams 97 %, lotus 2.5 %, mclaren 0.5 % | 0.888 (0.059) | 81.4 % / 1 / 0.878 |
| 1988 | mclaren | 100 % | 1 | mclaren 100 % | 0.931 (0.035) | 99.9 % / 1 / 0.925 |
| 1990 | mclaren | 97.8 % | 1 | mclaren 97.8 %, ferrari 1.2 %, tyrrell 1 % | 0.846 (0.057) | 100 % / 1 / 0.847 |
| 1991 | mclaren | 80.8 % | 1 | mclaren 80.8 %, williams 19.2 % | 0.859 (0.061) | 89.8 % / 1 / 0.876 |
| 1992 | williams | 99.9 % | 1 | williams 99.9 %, benetton 0.1 % | 0.815 (0.062) | 99.6 % / 1 / 0.903 |
| 1993 | williams | 100 % | 1 | williams 100 % | 0.848 (0.059) | 100 % / 1 / 0.840 |
| 1994 | williams | 53.3 % | 1 | williams 53.3 %, benetton 46.5 %, ferrari 0.2 % | 0.921 (0.040) | 59.7 % / 1 / 0.860 |
| 1995 | benetton | 95.9 % | 1 | benetton 95.9 %, williams 4.1 % | 0.883 (0.040) | 54.9 % / 1 / 0.883 |
| 1996 | williams | 100 % | 1 | williams 100 % | 0.950 (0.035) | 100 % / 1 / 0.913 |
| 1997 | williams | 96.9 % | 1 | williams 96.9 %, benetton 2.3 %, ferrari 0.8 % | 0.888 (0.032) | 100 % / 1 / 0.855 |
| 1998 | mclaren | 70.9 % | 1 | mclaren 70.9 %, ferrari 29.1 % | 0.935 (0.027) | 97.4 % / 1 / 0.932 |
| 1999 | ferrari | 69.9 % | 1 | ferrari 69.9 %, mclaren 30.1 % | 0.976 (0.017) | 0.2 % / 2 / 0.955 |
| 2000 | ferrari | 52.6 % | 1 | ferrari 52.6 %, mclaren 47.4 % | 0.896 (0.045) | 73.9 % / 1 / 0.891 |
| 2001 | ferrari | 100 % | 1 | ferrari 100 % | 0.935 (0.034) | 94.5 % / 1 / 0.918 |
| 2002 | ferrari | 100 % | 1 | ferrari 100 % | 0.895 (0.046) | 46.9 % / 2 / 0.865 |
| 2003 | ferrari | 81.6 % | 1 | ferrari 81.6 %, williams 18.3 %, mclaren 0.1 % | 0.876 (0.042) | 32.8 % / 2 / 0.839 |
| 2004 | ferrari | 100 % | 1 | ferrari 100 % | 0.971 (0.020) | 98.2 % / 1 / 0.892 |
| 2005 | renault | 77.8 % | 1 | renault 77.8 %, mclaren 22.2 % | 0.965 (0.018) | 18.1 % / 2 / 0.901 |
| 2006 | renault | 2 % | 2 | ferrari 98 %, renault 2 % | 0.970 (0.015) | 0 % / — / 0.912 |
| 2007 | ferrari | 2 % | 2 | mclaren 98 %, ferrari 2 % | 0.944 (0.029) | 9.3 % / 2 / 0.891 |
| 2008 | ferrari | 58.1 % | 1 | ferrari 58.1 %, mclaren 39.3 %, bmw-sauber 2.6 % | 0.955 (0.025) | 96.1 % / 1 / 0.982 |
| 2009 | brawn | 88.2 % | 1 | brawn 88.2 %, red-bull 11.8 % | 0.939 (0.025) | 0 % / — / 0.830 |
| 2010 | red-bull | 71.6 % | 1 | red-bull 71.6 %, mclaren 26.5 %, ferrari 1.9 % | 0.978 (0.012) | 97.7 % / 1 / 0.964 |
| 2011 | red-bull | 99.9 % | 1 | red-bull 99.9 %, mclaren 0.1 % | 0.983 (0.010) | 99.9 % / 1 / 0.972 |
| 2012 | red-bull | 94.8 % | 1 | red-bull 94.8 %, ferrari 2.9 %, mclaren 2.3 % | 0.937 (0.015) | 28.8 % / 2 / 0.885 |
| 2013 | red-bull | 94.6 % | 1 | red-bull 94.6 %, mercedes 5.4 % | 0.985 (0.010) | 88 % / 1 / 0.938 |
| 2014 | mercedes | 100 % | 1 | mercedes 100 % | 0.965 (0.021) | 99.9 % / 1 / 0.952 |
| 2016 | mercedes | 100 % | 1 | mercedes 100 % | 0.986 (0.014) | 100 % / 1 / 0.962 |
| 2018 | mercedes | 84.8 % | 1 | mercedes 84.8 %, ferrari 15.2 % | 0.916 (0.033) | 80.7 % / 1 / 0.837 |
| 2019 | mercedes | 99.9 % | 1 | mercedes 99.9 %, ferrari 0.1 % | 0.978 (0.021) | 97.7 % / 1 / 0.872 |
| 2020 | mercedes | 100 % | 1 | mercedes 100 % | 0.951 (0.022) | 100 % / 1 / 0.879 |
| 2021 | mercedes | 96.1 % | 1 | mercedes 96.1 %, red-bull 3.9 % | 0.970 (0.015) | 100 % / 1 / 0.913 |
| 2022 | red-bull | 99.1 % | 1 | red-bull 99.1 %, ferrari 0.9 % | 0.952 (0.028) | 93.7 % / 1 / 0.921 |
| 2023 | red-bull | 100 % | 1 | red-bull 100 % | 0.930 (0.026) | 99.9 % / 1 / 0.910 |
| 2024 | mclaren | 84 % | 1 | mclaren 84 %, red-bull 15.4 %, ferrari 0.6 % | 0.928 (0.029) | 0 % / — / 0.868 |
| 2025 | mclaren | 100 % | 1 | mclaren 100 % | 0.958 (0.021) | 99.3 % / 1 / 0.944 |
| 2026 | mercedes | 97 % | 1 | mercedes 97 %, ferrari 3 % | 0.977 (0.012) | 100 % / 1 / 0.976 |

## Método

- Cada simulación es una carrera espectadora (`createCareer({ spectator: true })`): ningún equipo es del jugador, todos corren sus inscritos reales de cada GP, desarrollan con la IA y, en modo estricto, siguen el ancla guiada del pack (RF-CAR-05, SRS 6.1; `data/balance/historical-anchors.json`). No hay junta, cuentas, dilemas ni correo.
- Semilla `val-<año>-<n>`: cada ejecución se reproduce exactamente (RNF-05). Fines de semana en modo rápido (`race.js`).
- Orden real: clasificación de constructores del pack (`standings.constructors`). Spearman sobre los equipos presentes en ambos órdenes.
- Criterio 7.2: el campeón real debe ser el más probable en ≥ 70 % de las temporadas y la media de Spearman ≥ 0,8.
