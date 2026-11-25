# Validación estadística de temporadas (criterio 7.2)

Generado por `overcut/frontend/scripts/validateSeasons.js` el 2026-11-25.
Modo strict, 1000 simulaciones por temporada sin intervención (carrera espectadora, modo rápido),
10 hilos, 1695.1 s en total (44.6 ms por temporada simulada y hilo-equivalente 446.1 ms).

**Veredicto: CUMPLE.** Campeón real como más probable en 34/38 temporadas (89.5 %; mínimo 70 %), Spearman medio 0.918 (mínimo 0,8).

Antes (strict, 1000 ejecuciones): campeón real como más probable en 35/38 (92.1 %), Spearman medio 0.929.

| Año | Campeón real | P(campeón real) | Rango del real | Más probable (top 3) | Spearman medio (σ) | Antes: P / rango / ρ |
| --- | --- | --- | --- | --- | --- | --- |
| 1976 | ferrari | 32.2 % | 2 | mclaren 41.9 %, ferrari 32.2 %, tyrrell 25.7 % | 0.784 (0.075) | 16 % / 2 / 0.835 |
| 1986 | williams | 85.2 % | 1 | williams 85.2 %, mclaren 9.4 %, lotus 5.1 % | 0.856 (0.080) | 98.2 % / 1 / 0.884 |
| 1988 | mclaren | 99.1 % | 1 | mclaren 99.1 %, ferrari 0.9 % | 0.905 (0.054) | 100 % / 1 / 0.929 |
| 1990 | mclaren | 84.8 % | 1 | mclaren 84.8 %, ferrari 8.6 %, benetton 2.6 % | 0.845 (0.068) | 98 % / 1 / 0.849 |
| 1991 | mclaren | 71.9 % | 1 | mclaren 71.9 %, williams 28.1 % | 0.809 (0.093) | 82.8 % / 1 / 0.858 |
| 1992 | williams | 94.7 % | 1 | williams 94.7 %, benetton 4.3 %, mclaren 1 % | 0.767 (0.090) | 100 % / 1 / 0.815 |
| 1993 | williams | 100 % | 1 | williams 100 % | 0.815 (0.092) | 100 % / 1 / 0.852 |
| 1994 | williams | 48.1 % | 2 | benetton 49.5 %, williams 48.1 %, ferrari 2.4 % | 0.909 (0.051) | 54.1 % / 1 / 0.920 |
| 1995 | benetton | 90.1 % | 1 | benetton 90.1 %, williams 9.9 % | 0.868 (0.056) | 96.5 % / 1 / 0.882 |
| 1996 | williams | 99.9 % | 1 | williams 99.9 %, ferrari 0.1 % | 0.926 (0.047) | 100 % / 1 / 0.948 |
| 1997 | williams | 74.6 % | 1 | williams 74.6 %, benetton 21.2 %, ferrari 4.2 % | 0.881 (0.043) | 96.5 % / 1 / 0.888 |
| 1998 | mclaren | 57.1 % | 1 | mclaren 57.1 %, ferrari 42.9 % | 0.920 (0.034) | 70.6 % / 1 / 0.936 |
| 1999 | ferrari | 79.4 % | 1 | ferrari 79.4 %, mclaren 20.6 % | 0.960 (0.027) | 70.8 % / 1 / 0.975 |
| 2000 | ferrari | 48.7 % | 2 | mclaren 51.3 %, ferrari 48.7 % | 0.866 (0.062) | 49.2 % / 2 / 0.896 |
| 2001 | ferrari | 100 % | 1 | ferrari 100 % | 0.926 (0.046) | 100 % / 1 / 0.935 |
| 2002 | ferrari | 99.9 % | 1 | ferrari 99.9 %, williams 0.1 % | 0.897 (0.050) | 100 % / 1 / 0.895 |
| 2003 | ferrari | 74.4 % | 1 | ferrari 74.4 %, williams 23.6 %, mclaren 2 % | 0.884 (0.052) | 81.1 % / 1 / 0.878 |
| 2004 | ferrari | 99.8 % | 1 | ferrari 99.8 %, bar 0.2 % | 0.970 (0.025) | 100 % / 1 / 0.971 |
| 2005 | renault | 82.1 % | 1 | renault 82.1 %, mclaren 16.5 %, ferrari 1.3 % | 0.945 (0.035) | 79.1 % / 1 / 0.966 |
| 2006 | renault | 10.5 % | 2 | ferrari 89.5 %, renault 10.5 % | 0.966 (0.020) | 2.3 % / 2 / 0.970 |
| 2007 | ferrari | 99.8 % | 1 | ferrari 99.8 %, bmw-sauber 0.2 % | 0.929 (0.041) | 99.9 % / 1 / 0.944 |
| 2008 | ferrari | 53.7 % | 1 | ferrari 53.7 %, mclaren 33.4 %, bmw-sauber 12.9 % | 0.953 (0.026) | 56.3 % / 1 / 0.954 |
| 2009 | brawn | 87.3 % | 1 | brawn 87.3 %, red-bull 12.6 %, mclaren 0.1 % | 0.938 (0.032) | 87.4 % / 1 / 0.936 |
| 2010 | red-bull | 55.6 % | 1 | red-bull 55.6 %, mclaren 32.1 %, ferrari 12.3 % | 0.970 (0.015) | 70.5 % / 1 / 0.978 |
| 2011 | red-bull | 98.4 % | 1 | red-bull 98.4 %, mclaren 1.4 %, ferrari 0.2 % | 0.979 (0.012) | 100 % / 1 / 0.981 |
| 2012 | red-bull | 72.8 % | 1 | red-bull 72.8 %, ferrari 21 %, mclaren 6.2 % | 0.943 (0.021) | 93.4 % / 1 / 0.938 |
| 2013 | red-bull | 80 % | 1 | red-bull 80 %, mercedes 19.8 %, ferrari 0.2 % | 0.980 (0.012) | 93.8 % / 1 / 0.985 |
| 2014 | mercedes | 100 % | 1 | mercedes 100 % | 0.959 (0.023) | 100 % / 1 / 0.963 |
| 2016 | mercedes | 100 % | 1 | mercedes 100 % | 0.979 (0.016) | 100 % / 1 / 0.984 |
| 2018 | mercedes | 84.8 % | 1 | mercedes 84.8 %, ferrari 15.2 % | 0.921 (0.034) | 83.6 % / 1 / 0.919 |
| 2019 | mercedes | 97.8 % | 1 | mercedes 97.8 %, ferrari 2 %, red-bull 0.2 % | 0.974 (0.025) | 100 % / 1 / 0.976 |
| 2020 | mercedes | 100 % | 1 | mercedes 100 % | 0.946 (0.026) | 100 % / 1 / 0.947 |
| 2021 | mercedes | 86.7 % | 1 | mercedes 86.7 %, red-bull 13.3 % | 0.970 (0.017) | 95 % / 1 / 0.969 |
| 2022 | red-bull | 96.3 % | 1 | red-bull 96.3 %, ferrari 3.7 % | 0.938 (0.036) | 98 % / 1 / 0.950 |
| 2023 | red-bull | 100 % | 1 | red-bull 100 % | 0.942 (0.028) | 100 % / 1 / 0.929 |
| 2024 | mclaren | 91.7 % | 1 | mclaren 91.7 %, red-bull 6.2 %, ferrari 2.1 % | 0.935 (0.029) | 83.7 % / 1 / 0.927 |
| 2025 | mclaren | 100 % | 1 | mclaren 100 % | 0.963 (0.020) | 100 % / 1 / 0.957 |
| 2026 | mercedes | 94.2 % | 1 | mercedes 94.2 %, ferrari 5.8 % | 0.976 (0.015) | 98.1 % / 1 / 0.977 |

## Método

- Cada simulación es una carrera espectadora (`createCareer({ spectator: true })`): ningún equipo es del jugador, todos corren sus inscritos reales de cada GP, desarrollan con la IA y, en modo estricto, siguen el ancla guiada del pack (RF-CAR-05, SRS 6.1; `data/balance/historical-anchors.json`). No hay junta, cuentas, dilemas ni correo.
- Semilla `val-<año>-<n>`: cada ejecución se reproduce exactamente (RNF-05). Fines de semana en modo rápido (`race.js`).
- Orden real: clasificación de constructores del pack (`standings.constructors`). Spearman sobre los equipos presentes en ambos órdenes.
- Criterio 7.2: el campeón real debe ser el más probable en ≥ 70 % de las temporadas y la media de Spearman ≥ 0,8.
