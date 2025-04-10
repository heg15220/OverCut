import json
import random

CRITERIOS_POSIBLES = [
    {"description": "Campeón del Mundo", "code": "world_champion"},
    {"description": "Piloto Británico", "code": "british_driver"},
    {"description": "Piloto Alemán", "code": "german_driver"},
    {"description": "Piloto con más de 10 podios", "code": "over_10_podiums"},
    {"description": "Piloto con más de 1 victoria", "code": "over_1_win"},
    {"description": "Ganador en Mónaco", "code": "won_in_monaco"},
    {"description": "Corrió para Ferrari", "code": "ferrari_driver"},
    {"description": "Corrió para McLaren", "code": "mclaren_driver"},
    {"description": "Debutó después de 2010", "code": "debut_after_2010"},
    {"description": "Piloto de Latinoamérica", "code": "latin_driver"},
]

def son_incompatibles(criterio1, criterio2):
    if criterio1['code'] in ["british_driver", "german_driver", "latin_driver"] and \
       criterio2['code'] in ["british_driver", "german_driver", "latin_driver"]:
        return True
    if criterio1['code'].startswith("debut_") and criterio2['code'].startswith("debut_"):
        return True
    return False

def generar_criterios():
    usados = set()
    filas, columnas = [], []

    while len(filas) < 3:
        c = random.choice(CRITERIOS_POSIBLES)
        if c['code'] not in usados:
            filas.append(c)
            usados.add(c['code'])

    while len(columnas) < 3:
        c = random.choice(CRITERIOS_POSIBLES)
        if c['code'] not in usados and not son_incompatibles(filas[len(columnas)], c):
            columnas.append(c)
            usados.add(c['code'])

    print(json.dumps({"rowCriteria": filas, "columnCriteria": columnas}))

if __name__ == "__main__":
    generar_criterios()
