# src/main/resources/scripts/generate_categories.py

import argparse
import json
import random
import os

CACHE_PATH = "src/main/resources/scripts/category_letter_cache.json"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["es", "en"], default="es")
    args = parser.parse_args()
    lang = args.lang

    if not os.path.exists(CACHE_PATH):
        print(json.dumps({ "letter": None, "categories": [] }))
        return

    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        cache = json.load(f)

    # Filtrar letras con al menos una categoría viable
    viable_letters = [letter for letter, cat_map in cache.items()
                      if any(cat_map.get(cat, False) for cat in cat_map if cat in CATEGORY_MAP[lang])]

    if not viable_letters:
        print(json.dumps({ "letter": None, "categories": [] }))
        return

    selected_letter = random.choice(viable_letters)
    all_valid_cats = [cat for cat, ok in cache[selected_letter].items()
                      if ok and cat in CATEGORY_MAP[lang]]

    selected_categories = random.sample(all_valid_cats, min(5, len(all_valid_cats)))

    print(json.dumps({
        "letter": selected_letter,
        "categories": selected_categories
    }))


CATEGORY_MAP = {
    "es": {
        "Piloto": "driver",
        "Equipo": "constructor",
        "Circuito": "circuit",
        "País": "country",
        "Motor": "engine",
        "Campeón del Mundo": "driver_champion",
        "Circuito urbano": "street_circuit",
        "Nacionalidad": "nationality",
        "Neumáticos": "tyres",
        "Ciudad con GP": "city",
        "Escudería desaparecida": "defunct_team",
        "Debutante famoso": "rookie"
    },
    "en": {
        "Driver": "driver",
        "Team": "constructor",
        "Circuit": "circuit",
        "Country": "country",
        "Engine": "engine",
        "World Champion": "driver_champion",
        "Street Circuit": "street_circuit",
        "Nationality": "nationality",
        "Tyres": "tyres",
        "GP City": "city",
        "Defunct Team": "defunct_team",
        "Famous Rookie": "rookie"
    }
}

if __name__ == "__main__":
    main()
