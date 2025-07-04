import json
import random

LANG = "es"


def index_cache():
    global GENERIC_STATS_CACHE

    # Indexar pilotos por circuito
    pilotos_por_circuito = {}
    for entry in GENERIC_STATS_CACHE.get("pilotos_victorias_en_circuito", []):
        pilotos_por_circuito.setdefault(entry["circuito"], []).append(entry)
    GENERIC_STATS_CACHE["pilotos_por_circuito"] = pilotos_por_circuito
    GENERIC_STATS_CACHE["circuitos_piloto_keys"] = list(pilotos_por_circuito.keys())

    # Indexar constructores por circuito
    constructores_por_circuito = {}
    for entry in GENERIC_STATS_CACHE.get("constructores_victorias_en_circuito", []):
        constructores_por_circuito.setdefault(entry["circuito"], []).append(entry)
    GENERIC_STATS_CACHE["constructores_por_circuito"] = constructores_por_circuito
    GENERIC_STATS_CACHE["circuitos_constructor_keys"] = list(constructores_por_circuito.keys())

    # Indexar constructores por país
    constructores_por_pais = {}
    for entry in GENERIC_STATS_CACHE.get("constructores_victorias_en_pais", []):
        constructores_por_pais.setdefault(entry["pais"], []).append(entry)
    GENERIC_STATS_CACHE["constructores_por_pais_index"] = constructores_por_pais
    GENERIC_STATS_CACHE["paises_constructor_keys"] = list(constructores_por_pais.keys())


def load_generic_stats_cache(path="generic_stats_data.json"):
    global GENERIC_STATS_CACHE
    with open(path, encoding="utf-8") as f:
        GENERIC_STATS_CACHE = json.load(f)
    index_cache()
    print(f"[OK] GenericStats cache cargada e indexada desde {path}.")



# ==== 2️⃣ Utilidades ====
def get_random_incorrect(correct, pool, k=3):
    pool = [item for item in pool if item != correct]
    return random.sample(pool, k=min(k, len(pool)))


def make_question(question_es, question_en, correct, pool, category="GenericStats", level=2):
    question_text = question_es if LANG == "es" else question_en
    options = get_random_incorrect(correct, pool) + [correct]
    random.shuffle(options)
    return {
        "question": question_text,
        "answers": options,
        "correctAnswer": correct,
        "knowledgeLevel": level,
        "category": category,
        "language": LANG
    }




# ==== 3️⃣ Generadores de preguntas usando el JSON ====

def pregunta_piloto_mas_podios():
    candidates = random.sample(GENERIC_STATS_CACHE["pilotos_podios"], k=4)
    correct_entry = max(candidates, key=lambda x: x["podios"])
    correct = correct_entry["nombre"]
    pool = [c["nombre"] for c in candidates]
    return make_question(
        "¿Qué piloto tiene más podios en su carrera?",
        "Which driver has the most podiums in their career?",
        correct,
        pool
    )


def pregunta_constructor_mas_titulos():
    candidates = random.sample(GENERIC_STATS_CACHE["constructores_titulos"], k=4)
    correct_entry = max(candidates, key=lambda x: x["titulos"])
    correct = correct_entry["nombre"]
    pool = [c["nombre"] for c in candidates]
    return make_question(
        "¿Qué escudería ha ganado más títulos de constructores en F1?",
        "Which team has won the most F1 constructors championships?",
        correct,
        pool
    )


def pregunta_pais_mas_gp():
    pool = [p["pais"] for p in GENERIC_STATS_CACHE["gp_por_pais"]]
    correct = max(GENERIC_STATS_CACHE["gp_por_pais"], key=lambda x: x["count"])["pais"]
    return make_question(
        "¿En qué país se han disputado más Grandes Premios?",
        "Which country hosted the most GPs?",
        correct,
        pool
    )

def pregunta_circuito_mas_usado():
    stats = GENERIC_STATS_CACHE["circuitos_con_carreras"]

    if len(stats) < 4:
        return None

    # Elegir 4 circuitos distintos al azar
    sample = random.sample(stats, k=4)
    correct_entry = max(sample, key=lambda x: x["count"])
    correct = correct_entry["nombre"]
    pool = [x["nombre"] for x in sample]

    return make_question(
        "¿Qué circuito ha sido usado más veces en la historia de la F1?",
        "Which track has been used more times in F1 history?",
        correct,
        pool
    )


def pregunta_piloto_random():
    pool = GENERIC_STATS_CACHE["pilotos"]
    correct = random.choice(pool)
    return make_question(
        "¿Cuál de estos es piloto de F1?",
        "Which one is a Formula 1 driver?",
        correct,
        pool
    )

def pregunta_constructor_random():
    pool = GENERIC_STATS_CACHE["constructores"]
    correct = random.choice(pool)
    return make_question(
        "¿Cuál de estos es un constructor de F1?",
        "Which one is an F1 team?",
        correct,
        pool
    )

def pregunta_pais_random():
    pool = GENERIC_STATS_CACHE["paises"]
    correct = random.choice(pool)
    return make_question(
        "¿Cuál de estos es un país con GP de F1?",
        "Which of these countries hosts a GP?",
        correct,
        pool
    )

def pregunta_campeon_piloto_anio():
    if not GENERIC_STATS_CACHE["campeones_pilotos_por_anio"]:
        return None
    champ = random.choice(GENERIC_STATS_CACHE["campeones_pilotos_por_anio"])
    anio = champ["year"]
    correct = champ["piloto"]
    pool = GENERIC_STATS_CACHE.get("pilotos_por_periodo", {}).get(str(anio), GENERIC_STATS_CACHE["pilotos"])
    return make_question(
        f"¿Quién ganó el campeonato de pilotos en {anio}?",
        f"Who won the drivers' championship in {anio}?",
        correct,
        pool
    )

def pregunta_campeon_constructor_anio():
    if not GENERIC_STATS_CACHE["campeones_constructores_por_anio"]:
        return None
    champ = random.choice(GENERIC_STATS_CACHE["campeones_constructores_por_anio"])
    anio = champ["year"]
    correct = champ["constructor"]
    pool = GENERIC_STATS_CACHE.get("constructores_por_periodo", {}).get(str(anio), GENERIC_STATS_CACHE["constructores"])
    return make_question(
        f"¿Qué constructor ganó el campeonato de constructores en {anio}?",
        f"Which team won the constructors' championship in {anio}?",
        correct,
        pool
    )

def pregunta_piloto_gano_en_mas_paises():
    candidates = random.sample(GENERIC_STATS_CACHE["pilotos_mas_paises"], k=4)
    correct_entry = max(candidates, key=lambda x: x["count"])
    correct = correct_entry["nombre"]
    pool = [p["nombre"] for p in candidates]
    return make_question(
        "¿Qué piloto ganó en más países diferentes?",
        "Which driver won in more different countries?",
        correct,
        pool
    )


def pregunta_circuito_campeones_distintos():
    pool = [c["nombre"] for c in GENERIC_STATS_CACHE["circuitos_campeones_distintos"]]
    correct = max(GENERIC_STATS_CACHE["circuitos_campeones_distintos"], key=lambda x: x["count"])["nombre"]
    return make_question(
        "¿Qué circuito ha visto ganar a más campeones del mundo distintos?",
        "Which circuit has seen more different world champions win?",
        correct,
        pool
    )

def generar_pregunta_ganador_gp():
    entry = random.choice(GENERIC_STATS_CACHE["resultados_gp_ganadores"])
    year = entry["year"]
    gp = entry["gp"]
    correct = entry["piloto"]
    pool = GENERIC_STATS_CACHE.get("pilotos_por_periodo", {}).get(str(year), GENERIC_STATS_CACHE["pilotos"])
    return make_question(
        f"¿Quién ganó el GP {gp} en {year}?",
        f"Who won the {gp} GP in {year}?",
        correct,
        pool
    )

def generar_pregunta_segundo_gp():
    entry = random.choice(GENERIC_STATS_CACHE["resultados_gp_segundos"])
    year = entry["year"]
    gp = entry["gp"]
    correct = entry["piloto"]
    pool = GENERIC_STATS_CACHE.get("pilotos_por_periodo", {}).get(str(year), GENERIC_STATS_CACHE["pilotos"])
    return make_question(
        f"¿Quién quedó segundo en el {gp} en {year}?",
        f"Who finished second in the {gp} in {year}?",
        correct,
        pool
    )

def generar_pregunta_tercero_gp():
    entry = random.choice(GENERIC_STATS_CACHE["resultados_gp_terceros"])
    year = entry["year"]
    gp = entry["gp"]
    correct = entry["piloto"]
    pool = GENERIC_STATS_CACHE.get("pilotos_por_periodo", {}).get(str(year), GENERIC_STATS_CACHE["pilotos"])
    return make_question(
        f"¿Quién quedó tercero en el GP {gp} en {year}?",
        f"Who finished third in the {gp} GP in {year}?",
        correct,
        pool
    )

def generar_pregunta_escuderia_ganadora():
    entry = random.choice(GENERIC_STATS_CACHE["resultados_gp_escuderias_ganadoras"])
    year = entry["year"]
    gp = entry["gp"]
    correct = entry["escuderia"]
    pool = GENERIC_STATS_CACHE.get("constructores_por_periodo", {}).get(str(year), GENERIC_STATS_CACHE["constructores"])
    return make_question(
        f"¿Qué escudería ganó el GP {gp} en {year}?",
        f"Which team won the {gp} GP in {year}?",
        correct,
        pool
    )

def pregunta_piloto_primera_victoria_joven():
    correct = min(GENERIC_STATS_CACHE["pilotos_primera_victoria_edad"], key=lambda x: x["edad"])["nombre"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        "¿Qué piloto fue más joven en lograr su primera victoria?",
        "Which driver was the youngest to get their first win?",
        correct,
        pool
    )

def pregunta_escuderia_mas_dobletes():
    candidates = random.sample(GENERIC_STATS_CACHE["constructores_dobletes"], k=4)
    correct_entry = max(candidates, key=lambda x: x["dobletes"])
    correct = correct_entry["nombre"]
    pool = [c["nombre"] for c in candidates]
    return make_question(
        "¿Qué escudería logró más dobletes (1º y 2º) en F1?",
        "Which team achieved more 1-2 finishes in F1?",
        correct,
        pool
    )


def pregunta_piloto_mas_temporadas_consecutivas():
    candidates = random.sample(GENERIC_STATS_CACHE["pilotos_temporadas"], k=4)
    correct_entry = max(candidates, key=lambda x: x["temporadas"])
    correct = correct_entry["nombre"]
    pool = [p["nombre"] for p in candidates]
    return make_question(
        "¿Qué piloto ha disputado más temporadas?",
        "Which driver has raced in the most seasons?",
        correct,
        pool
    )



def pregunta_piloto_mas_victorias_temporada():
    candidates = random.sample(GENERIC_STATS_CACHE["pilotos_victorias_por_temporada"], k=4)
    correct_entry = max(candidates, key=lambda x: x["victorias"])
    correct = correct_entry["nombre"]
    pool = [p["nombre"] for p in candidates]
    return make_question(
        "¿Qué piloto logró más victorias en una sola temporada?",
        "Which driver won the most races in a single season?",
        correct,
        pool
    )


def pregunta_piloto_mas_carreras_sin_victoria():
    candidates = random.sample(GENERIC_STATS_CACHE["pilotos_carreras_sin_victoria"], k=4)
    correct_entry = max(candidates, key=lambda x: x["carreras"])
    correct = correct_entry["nombre"]
    pool = [p["nombre"] for p in candidates]
    return make_question(
        "¿Qué piloto corrió más carreras sin victoria?",
        "Which driver raced more times without a win?",
        correct,
        pool
    )


def pregunta_constructor_mas_podios_temporada():
    candidates = random.sample(GENERIC_STATS_CACHE["constructores_podios_por_temporada"], k=4)
    correct_entry = max(candidates, key=lambda x: x["podios"])
    correct = correct_entry["nombre"]
    pool = [c["nombre"] for c in candidates]
    return make_question(
        "¿Qué constructor logró más podios en una temporada?",
        "Which team got the most podiums in a season?",
        correct,
        pool
    )



def pregunta_piloto_mas_participaciones_escuderia():
    # Elegir aleatoriamente 4 piloto-escudería distintos
    candidates = random.sample(GENERIC_STATS_CACHE["pilotos_participaciones_escuderia"], k=4)

    # Encontrar entre esos 4 el que más participaciones tiene
    correct_entry = max(candidates, key=lambda x: x["participaciones"])

    correct = f"{correct_entry['piloto']} ({correct_entry['escuderia']})"
    pool = [f"{x['piloto']} ({x['escuderia']})" for x in candidates]

    return make_question(
        "¿Qué piloto tuvo más participaciones en una misma escudería?",
        "Which driver had the most races with a single team?",
        correct,
        pool
    )


def pregunta_gp_mas_antiguo():
    entry = GENERIC_STATS_CACHE.get("gp_mas_antiguo")
    if not entry:
        return None
    correct = entry["nombre"]
    pool = [x["gp"] for x in GENERIC_STATS_CACHE["resultados_gp_ganadores"] if x["gp"] != correct]
    return make_question(
        "¿Cuál es el Gran Premio más antiguo en la historia de la F1?",
        "Which is the oldest Grand Prix in F1 history?",
        correct,
        pool
    )


def pregunta_escuderia_debut_victoria():
    correct = random.choice(GENERIC_STATS_CACHE["escuderias_debut_victoria"])
    pool = GENERIC_STATS_CACHE["constructores"]
    return make_question(
        "¿Qué escudería debutó ganando en su primera carrera?",
        "Which team debuted by winning their first race?",
        correct,
        pool
    )


def pregunta_piloto_sin_podio_largo():
    correct_entry = max(GENERIC_STATS_CACHE["pilotos_sin_podio"], key=lambda x: x["carreras"])
    correct = correct_entry["nombre"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        "¿Qué piloto corrió más carreras sin subir al podio?",
        "Which driver raced the most times without a podium?",
        correct,
        pool
    )


def pregunta_primer_gp_fuera_europa():
    entry = GENERIC_STATS_CACHE.get("primer_gp_fuera_europa")
    if not entry:
        return None
    correct = entry["pais"]
    pool = GENERIC_STATS_CACHE["paises"]
    return make_question(
        "¿Cuál fue el primer país fuera de Europa en albergar un GP?",
        "Which was the first country outside Europe to host a GP?",
        correct,
        pool
    )


def pregunta_piloto_debut_victoria():
    correct = random.choice(GENERIC_STATS_CACHE["pilotos_debut_victoria"])
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        "¿Qué piloto ganó en su carrera de debut en F1?",
        "Which driver won on their F1 debut?",
        correct,
        pool
    )


def pregunta_piloto_mas_victorias_en_circuito():
    circuitos = GENERIC_STATS_CACHE["circuitos_piloto_keys"]
    for _ in range(10):
        circuito = random.choice(circuitos)
        pilotos_en_circuito = GENERIC_STATS_CACHE["pilotos_por_circuito"].get(circuito, [])
        if len(pilotos_en_circuito) >= 4:
            sample = random.sample(pilotos_en_circuito, k=4)
            correct_entry = max(sample, key=lambda x: x["victorias"])
            correct = correct_entry["piloto"]
            pool = [x["piloto"] for x in sample]
            return make_question(
                f"¿Qué piloto logró más victorias en el circuito {circuito}?",
                f"Which driver achieved the most wins at {circuito}?",
                correct,
                pool
            )
    return None




def pregunta_piloto_sin_pole_subio_podio():
    correct_entry = max(GENERIC_STATS_CACHE["pilotos_podio_sin_pole"], key=lambda x: x["podios"])
    correct = correct_entry["nombre"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        "¿Qué piloto subió más veces al podio sin haber logrado una pole?",
        "Which driver stood on the podium the most without ever taking pole?",
        correct,
        pool
    )


def pregunta_pais_mas_constructores():
    stats = GENERIC_STATS_CACHE["constructores_por_pais"]

    if len(stats) < 4:
        return None

    sample = random.sample(stats, k=4)
    correct_entry = max(sample, key=lambda x: x["count"])
    correct = correct_entry["pais"]
    pool = [x["pais"] for x in sample]

    return make_question(
        "¿Qué país ha tenido más constructores en la historia de la F1?",
        "Which country has had the most F1 teams in history?",
        correct,
        pool
    )


def pregunta_piloto_mas_poles_en_circuito():
    correct_entry = max(GENERIC_STATS_CACHE["pilotos_poles_en_circuito"], key=lambda x: x["poles"])
    correct = correct_entry["piloto"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        f"¿Qué piloto logró más poles en el circuito {correct_entry['circuito']}?",
        f"Which driver achieved the most poles at {correct_entry['circuito']}?",
        correct,
        pool
    )



def pregunta_constructor_mas_victorias_en_circuito():
    circuitos = GENERIC_STATS_CACHE["circuitos_constructor_keys"]
    for _ in range(10):
        circuito = random.choice(circuitos)
        constructores_en_circuito = GENERIC_STATS_CACHE["constructores_victorias_en_circuito"]
        if len(constructores_en_circuito) >= 4:
            sample = random.sample(constructores_en_circuito, k=4)
            correct_entry = max(sample, key=lambda x: x["victorias"])
            correct = correct_entry["constructor"]
            pool = [x["constructor"] for x in sample]
            return make_question(
                f"¿Qué constructor logró más victorias en el circuito {circuito}?",
                f"Which constructor achieved the most wins at {circuito}?",
                correct,
                pool
            )
    return None




def pregunta_constructor_mas_victorias_en_pais():
    # Obtener todos los países disponibles
    paises = GENERIC_STATS_CACHE["paises_constructor_keys"]

    # Intentar hasta encontrar un país con suficientes constructores
    for _ in range(10):
        pais = random.choice(paises)
        constructores_en_pais = [
            entry for entry in GENERIC_STATS_CACHE["constructores_victorias_en_pais"]
            if entry["pais"] == pais
        ]

        if len(constructores_en_pais) >= 4:
            sample = random.sample(constructores_en_pais, k=4)
            correct_entry = max(sample, key=lambda x: x["victorias"])
            correct = correct_entry["constructor"]
            pool = [x["constructor"] for x in sample]

            return make_question(
                f"¿Qué constructor logró más victorias en {pais}?",
                f"Which constructor achieved the most wins in {pais}?",
                correct,
                pool
            )

    return None  # No se encontró país con 4 constructores distintos






# ==== 4️⃣ Selector de generadores ====
ALL_GENERATORS = [
    pregunta_piloto_mas_podios,
    pregunta_constructor_mas_titulos,
    pregunta_pais_mas_gp,
    pregunta_circuito_mas_usado,
    pregunta_campeon_piloto_anio,
    pregunta_campeon_constructor_anio,
    pregunta_piloto_gano_en_mas_paises,
    pregunta_circuito_campeones_distintos,
    generar_pregunta_ganador_gp,
    generar_pregunta_segundo_gp,
    generar_pregunta_tercero_gp,
    generar_pregunta_escuderia_ganadora,
    pregunta_piloto_primera_victoria_joven,
    pregunta_escuderia_mas_dobletes,
    pregunta_piloto_mas_temporadas_consecutivas,
    pregunta_piloto_mas_victorias_temporada,
    pregunta_piloto_mas_carreras_sin_victoria,
    pregunta_constructor_mas_podios_temporada,
    pregunta_piloto_mas_participaciones_escuderia,
    pregunta_gp_mas_antiguo,
    pregunta_piloto_sin_podio_largo,
    pregunta_piloto_mas_victorias_en_circuito,
    pregunta_piloto_sin_pole_subio_podio,
    pregunta_pais_mas_constructores,
    pregunta_piloto_mas_poles_en_circuito,
    pregunta_constructor_mas_victorias_en_circuito,
    pregunta_constructor_mas_victorias_en_pais
]

# ==== 5️⃣ Generar conjunto de preguntas ====
def generate_genericstats_questions(n=10):
    preguntas = []

    # Elegir n generadores aleatorios distintos (si hay menos disponibles, usa todos)
    selected_generators = random.sample(ALL_GENERATORS, k=min(n, len(ALL_GENERATORS)))

    for generator in selected_generators:
        try:
            q = generator()
            if q:
                preguntas.append(q)
        except Exception as e:
            print(f"[WARN] Error en generador {generator.__name__}: {e}")

    random.shuffle(preguntas)
    return preguntas[:n]

def generar_preguntas_genericstats_desde_main(lang: str = "es"):
    global LANG
    LANG = lang
    preguntas_generadas = generate_genericstats_questions()
    return preguntas_generadas[:10]
