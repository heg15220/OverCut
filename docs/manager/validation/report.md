# Validación estadística de temporadas (criterio 7.2)

Generado por `overcut/frontend/scripts/validateSeasons.js` el 2026-11-23.
Modo strict, 1000 simulaciones por temporada sin intervención (carrera espectadora, modo rápido),
15 hilos, 655.9 s en total (17.3 ms por temporada simulada y hilo-equivalente 258.9 ms).

**Veredicto: CUMPLE.** Campeón real como más probable en 35/38 temporadas (92.1 %; mínimo 70 %), Spearman medio 0.929 (mínimo 0,8).

Antes (strict, 1000 ejecuciones): campeón real como más probable en 35/38 (92.1 %), Spearman medio 0.929.

| Año | Campeón real | P(campeón real) | Rango del real | Más probable (top 3) | Spearman medio (σ) | Antes: P / rango / ρ |
| --- | --- | --- | --- | --- | --- | --- |
| 1976 | ferrari | 16 % | 2 | mclaren 79.9 %, ferrari 16 %, tyrrell 4.1 % | 0.835 (0.060) | 16 % / 2 / 0.835 |
| 1986 | williams | 98.2 % | 1 | williams 98.2 %, lotus 1.4 %, mclaren 0.4 % | 0.884 (0.062) | 98.2 % / 1 / 0.884 |
| 1988 | mclaren | 100 % | 1 | mclaren 100 % | 0.929 (0.036) | 100 % / 1 / 0.929 |
| 1990 | mclaren | 98 % | 1 | mclaren 98 %, tyrrell 1 %, ferrari 0.9 % | 0.849 (0.054) | 98 % / 1 / 0.849 |
| 1991 | mclaren | 82.8 % | 1 | mclaren 82.8 %, williams 17.2 % | 0.858 (0.062) | 82.8 % / 1 / 0.858 |
| 1992 | williams | 100 % | 1 | williams 100 % | 0.815 (0.062) | 100 % / 1 / 0.815 |
| 1993 | williams | 100 % | 1 | williams 100 % | 0.852 (0.056) | 100 % / 1 / 0.852 |
| 1994 | williams | 54.1 % | 1 | williams 54.1 %, benetton 45.1 %, ferrari 0.8 % | 0.920 (0.039) | 54.1 % / 1 / 0.920 |
| 1995 | benetton | 96.5 % | 1 | benetton 96.5 %, williams 3.5 % | 0.882 (0.039) | 96.5 % / 1 / 0.882 |
| 1996 | williams | 100 % | 1 | williams 100 % | 0.948 (0.037) | 100 % / 1 / 0.948 |
| 1997 | williams | 96.5 % | 1 | williams 96.5 %, benetton 2.6 %, ferrari 0.9 % | 0.888 (0.032) | 96.5 % / 1 / 0.888 |
| 1998 | mclaren | 70.6 % | 1 | mclaren 70.6 %, ferrari 29.4 % | 0.936 (0.027) | 70.6 % / 1 / 0.936 |
| 1999 | ferrari | 70.8 % | 1 | ferrari 70.8 %, mclaren 29.2 % | 0.975 (0.019) | 70.8 % / 1 / 0.975 |
| 2000 | ferrari | 49.2 % | 2 | mclaren 50.8 %, ferrari 49.2 % | 0.896 (0.045) | 49.2 % / 2 / 0.896 |
| 2001 | ferrari | 100 % | 1 | ferrari 100 % | 0.935 (0.035) | 100 % / 1 / 0.935 |
| 2002 | ferrari | 100 % | 1 | ferrari 100 % | 0.895 (0.049) | 100 % / 1 / 0.895 |
| 2003 | ferrari | 81.1 % | 1 | ferrari 81.1 %, williams 18.5 %, mclaren 0.4 % | 0.878 (0.041) | 81.1 % / 1 / 0.878 |
| 2004 | ferrari | 100 % | 1 | ferrari 100 % | 0.971 (0.020) | 100 % / 1 / 0.971 |
| 2005 | renault | 79.1 % | 1 | renault 79.1 %, mclaren 20.9 % | 0.966 (0.021) | 79.1 % / 1 / 0.966 |
| 2006 | renault | 2.3 % | 2 | ferrari 97.7 %, renault 2.3 % | 0.970 (0.015) | 2.3 % / 2 / 0.970 |
| 2007 | ferrari | 99.9 % | 1 | ferrari 99.9 %, bmw-sauber 0.1 % | 0.944 (0.029) | 99.9 % / 1 / 0.944 |
| 2008 | ferrari | 56.3 % | 1 | ferrari 56.3 %, mclaren 41.3 %, bmw-sauber 2.4 % | 0.954 (0.027) | 56.3 % / 1 / 0.954 |
| 2009 | brawn | 87.4 % | 1 | brawn 87.4 %, red-bull 12.6 % | 0.936 (0.025) | 87.4 % / 1 / 0.936 |
| 2010 | red-bull | 70.5 % | 1 | red-bull 70.5 %, mclaren 27.3 %, ferrari 2.2 % | 0.978 (0.012) | 70.5 % / 1 / 0.978 |
| 2011 | red-bull | 100 % | 1 | red-bull 100 % | 0.981 (0.011) | 100 % / 1 / 0.981 |
| 2012 | red-bull | 93.4 % | 1 | red-bull 93.4 %, ferrari 4 %, mclaren 2.6 % | 0.938 (0.015) | 93.4 % / 1 / 0.938 |
| 2013 | red-bull | 93.8 % | 1 | red-bull 93.8 %, mercedes 6.2 % | 0.985 (0.010) | 93.8 % / 1 / 0.985 |
| 2014 | mercedes | 100 % | 1 | mercedes 100 % | 0.963 (0.023) | 100 % / 1 / 0.963 |
| 2016 | mercedes | 100 % | 1 | mercedes 100 % | 0.984 (0.014) | 100 % / 1 / 0.984 |
| 2018 | mercedes | 83.6 % | 1 | mercedes 83.6 %, ferrari 16.4 % | 0.919 (0.033) | 83.6 % / 1 / 0.919 |
| 2019 | mercedes | 100 % | 1 | mercedes 100 % | 0.976 (0.021) | 100 % / 1 / 0.976 |
| 2020 | mercedes | 100 % | 1 | mercedes 100 % | 0.947 (0.026) | 100 % / 1 / 0.947 |
| 2021 | mercedes | 95 % | 1 | mercedes 95 %, red-bull 5 % | 0.969 (0.017) | 95 % / 1 / 0.969 |
| 2022 | red-bull | 98 % | 1 | red-bull 98 %, ferrari 2 % | 0.950 (0.029) | 98 % / 1 / 0.950 |
| 2023 | red-bull | 100 % | 1 | red-bull 100 % | 0.929 (0.030) | 100 % / 1 / 0.929 |
| 2024 | mclaren | 83.7 % | 1 | mclaren 83.7 %, red-bull 15.7 %, ferrari 0.6 % | 0.927 (0.030) | 83.7 % / 1 / 0.927 |
| 2025 | mclaren | 100 % | 1 | mclaren 100 % | 0.957 (0.022) | 100 % / 1 / 0.957 |
| 2026 | mercedes | 98.1 % | 1 | mercedes 98.1 %, ferrari 1.9 % | 0.977 (0.012) | 98.1 % / 1 / 0.977 |

## Método

- Cada simulación es una carrera espectadora (`createCareer({ spectator: true })`): ningún equipo es del jugador, todos corren sus inscritos reales de cada GP, desarrollan con la IA y, en modo estricto, siguen el ancla guiada del pack (RF-CAR-05, SRS 6.1; `data/balance/historical-anchors.json`). No hay junta, cuentas, dilemas ni correo.
- Semilla `val-<año>-<n>`: cada ejecución se reproduce exactamente (RNF-05). Fines de semana en modo rápido (`race.js`).
- Orden real: clasificación de constructores del pack (`standings.constructors`). Spearman sobre los equipos presentes en ambos órdenes.
- Criterio 7.2: el campeón real debe ser el más probable en ≥ 70 % de las temporadas y la media de Spearman ≥ 0,8.
