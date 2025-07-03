import json
import random

LANG = "es"


def load_generic_stats_cache(path="generic_stats_data.json"):
    global GENERIC_STATS_CACHE
    with open(path, encoding="utf-8") as f:
        GENERIC_STATS_CACHE = json.load(f)
    print(f"[OK] GenericStats cache cargada desde {path}.")



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

def pregunta_piloto_mas_podios(lang="es"):
    pool = [p["nombre"] for p in GENERIC_STATS_CACHE["pilotos_podios"]]
    correct = PRECOMPUTED_TOPS["piloto_mas_podios"]
    return make_question(
        "¿Qué piloto tiene más podios en su carrera?",
        "Which driver has the most podiums in their career?",
        correct,
        pool
    )

def pregunta_constructor_mas_titulos():
    pool = [c["nombre"] for c in GENERIC_STATS_CACHE["constructores_titulos"]]
    correct = max(GENERIC_STATS_CACHE["constructores_titulos"], key=lambda x: x["titulos"])["nombre"]
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
    pool = [c["nombre"] for c in GENERIC_STATS_CACHE["circuitos_con_carreras"]]
    correct = max(GENERIC_STATS_CACHE["circuitos_con_carreras"], key=lambda x: x["count"])["nombre"]
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
    pool = GENERIC_STATS_CACHE["pilotos_por_anio"].get(str(anio), GENERIC_STATS_CACHE["pilotos"])
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
    pool = GENERIC_STATS_CACHE["constructores_por_anio"].get(str(anio), GENERIC_STATS_CACHE["constructores"])
    return make_question(
        f"¿Qué constructor ganó el campeonato de constructores en {anio}?",
        f"Which team won the constructors' championship in {anio}?",
        correct,
        pool
    )

def pregunta_piloto_gano_en_mas_paises():
    pool = [p["nombre"] for p in GENERIC_STATS_CACHE["pilotos_mas_paises"]]
    correct = max(GENERIC_STATS_CACHE["pilotos_mas_paises"], key=lambda x: x["count"])["nombre"]
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
    pool = GENERIC_STATS_CACHE["pilotos"]
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
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        f"¿Quién quedó segundo en el GP {gp} en {year}?",
        f"Who finished second in the {gp} GP in {year}?",
        correct,
        pool
    )

def generar_pregunta_tercero_gp():
    entry = random.choice(GENERIC_STATS_CACHE["resultados_gp_terceros"])
    year = entry["year"]
    gp = entry["gp"]
    correct = entry["piloto"]
    pool = GENERIC_STATS_CACHE["pilotos"]
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
    pool = GENERIC_STATS_CACHE["constructores"]
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
    correct = max(GENERIC_STATS_CACHE["constructores_dobletes"], key=lambda x: x["dobletes"])["nombre"]
    pool = GENERIC_STATS_CACHE["constructores"]
    return make_question(
        "¿Qué escudería logró más dobletes (1º y 2º) en F1?",
        "Which team achieved more 1-2 finishes in F1?",
        correct,
        pool
    )

def pregunta_piloto_mas_temporadas_consecutivas():
    correct = max(GENERIC_STATS_CACHE["pilotos_temporadas"], key=lambda x: x["temporadas"])["nombre"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        "¿Qué piloto ha disputado más temporadas?",
        "Which driver has raced in the most seasons?",
        correct,
        pool
    )

def pregunta_piloto_mas_victorias_temporada():
    correct = max(GENERIC_STATS_CACHE["pilotos_victorias_por_temporada"], key=lambda x: x["victorias"])["nombre"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        "¿Qué piloto logró más victorias en una sola temporada?",
        "Which driver won the most races in a single season?",
        correct,
        pool
    )

def pregunta_piloto_mas_carreras_sin_victoria():
    correct = max(GENERIC_STATS_CACHE["pilotos_carreras_sin_victoria"], key=lambda x: x["carreras"])["nombre"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        "¿Qué piloto corrió más carreras sin victoria?",
        "Which driver raced more times without a win?",
        correct,
        pool
    )

def pregunta_constructor_mas_podios_temporada():
    correct = max(GENERIC_STATS_CACHE["constructores_podios_por_temporada"], key=lambda x: x["podios"])["nombre"]
    pool = GENERIC_STATS_CACHE["constructores"]
    return make_question(
        "¿Qué constructor logró más podios en una temporada?",
        "Which team got the most podiums in a season?",
        correct,
        pool
    )

def pregunta_piloto_mas_participaciones_escuderia():
    correct_entry = max(GENERIC_STATS_CACHE["pilotos_participaciones_escuderia"], key=lambda x: x["participaciones"])
    correct = f"{correct_entry['piloto']} ({correct_entry['escuderia']})"
    pool = [f"{x['piloto']} ({x['escuderia']})" for x in GENERIC_STATS_CACHE["pilotos_participaciones_escuderia"]]
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
    correct_entry = max(GENERIC_STATS_CACHE["pilotos_victorias_en_circuito"], key=lambda x: x["victorias"])
    correct = correct_entry["piloto"]
    pool = GENERIC_STATS_CACHE["pilotos"]
    return make_question(
        f"¿Qué piloto logró más victorias en el circuito {correct_entry['circuito']}?",
        f"Which driver achieved the most wins at {correct_entry['circuito']}?",
        correct,
        pool
    )


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
    correct_entry = max(GENERIC_STATS_CACHE["constructores_por_pais"], key=lambda x: x["count"])
    correct = correct_entry["pais"]
    pool = GENERIC_STATS_CACHE["paises"]
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
    correct_entry = max(GENERIC_STATS_CACHE["constructores_victorias_en_circuito"], key=lambda x: x["victorias"])
    correct = correct_entry["constructor"]
    pool = GENERIC_STATS_CACHE["constructores"]
    return make_question(
        f"¿Qué constructor logró más victorias en el circuito {correct_entry['circuito']}?",
        f"Which constructor achieved the most wins at {correct_entry['circuito']}?",
        correct,
        pool
    )


def pregunta_constructor_mas_victorias_en_pais():
    correct_entry = max(GENERIC_STATS_CACHE["constructores_victorias_en_pais"], key=lambda x: x["victorias"])
    correct = correct_entry["constructor"]
    pool = GENERIC_STATS_CACHE["constructores"]
    return make_question(
        f"¿Qué constructor logró más victorias en {correct_entry['pais']}?",
        f"Which constructor achieved the most wins in {correct_entry['pais']}?",
        correct,
        pool
    )





# ==== 4️⃣ Selector de generadores ====
ALL_GENERATORS = [
    pregunta_piloto_mas_podios,
    pregunta_constructor_mas_titulos,
    pregunta_pais_mas_gp,
    pregunta_circuito_mas_usado,
    pregunta_piloto_random,
    pregunta_constructor_random,
    pregunta_pais_random,
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
    pregunta_escuderia_debut_victoria,
    pregunta_piloto_sin_podio_largo,
    pregunta_primer_gp_fuera_europa,
    pregunta_piloto_debut_victoria,
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
