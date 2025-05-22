#!/usr/bin/env python3
# generate_criteria_static.py

import json

print(json.dumps({
    "rowCriteria": [
        {"code": "nationality_british", "description": "Nacionalidad británica", "imageUrl": "https://flagcdn.com/w320/gb.png"},
        {"code": "min_10_wins", "description": "Mínimo 10 victorias", "imageUrl": None},
        {"code": "world_champion", "description": "Campeón del mundo", "imageUrl": None}
    ],
    "columnCriteria": [
        {"code": "nationality_german", "description": "Nacionalidad alemana", "imageUrl": "https://flagcdn.com/w320/de.png"},
        {"code": "team_ferrari", "description": "Ha corrido en Ferrari", "imageUrl": "https://upload.wikimedia.org/wikipedia/en/d/d4/Scuderia_Ferrari_Logo.svg"},
        {"code": "won_in_monaco", "description": "Ha ganado en Mónaco", "imageUrl": None}
    ]
}))
