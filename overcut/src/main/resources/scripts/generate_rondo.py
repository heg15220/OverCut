import random
import json
import argparse
import unicodedata
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import concurrent.futures
from threading import Lock
from functools import lru_cache

# Configuración de base de datos

# Configuración de base de datos
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL, poolclass=QueuePool, pool_size=10, max_overflow=5, pool_timeout=30)
Session = sessionmaker(bind=engine)

LETTERS = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
CACHE_FILE_TEMPLATE = "rosco_cache_{lang}.json"
CACHE_SIZE = 20
cache = []
cache_lock = Lock()


NAT_TRANSLATIONS = {
    "en": {
        "American": "American", "American-Italian": "American-Italian", "Argentine": "Argentine",
        "Argentine-Italian": "Argentine-Italian", "Argentinian": "Argentinian", "Australian": "Australian",
        "Austrian": "Austrian", "Belgian": "Belgian", "Brazilian": "Brazilian", "British": "British",
        "Canadian": "Canadian", "Chilean": "Chilean", "Chinese": "Chinese", "Colombian": "Colombian",
        "Czech": "Czech", "Danish": "Danish", "Dutch": "Dutch", "East German": "East German",
        "Finnish": "Finnish", "French": "French", "German": "German", "Hungarian": "Hungarian",
        "Indian": "Indian", "Indonesian": "Indonesian", "Irish": "Irish", "Italian": "Italian",
        "Japanese": "Japanese", "Liechtensteiner": "Liechtensteiner", "Malaysian": "Malaysian",
        "Mexican": "Mexican", "Monegasque": "Monegasque", "New Zealander": "New Zealander",
        "Polish": "Polish", "Portuguese": "Portuguese", "Rhodesian": "Rhodesian", "Russian": "Russian",
        "South African": "South African", "Spanish": "Spanish", "Swedish": "Swedish", "Swiss": "Swiss",
        "Thai": "Thai", "Uruguayan": "Uruguayan", "Venezuelan": "Venezuelan"
    },
    "es": {
        "American": "Estadounidense", "American-Italian": "Estadounidense-Italiano", "Argentine": "Argentino",
        "Argentine-Italian": "Argentino-Italiano", "Argentinian": "Argentino", "Australian": "Australiano",
        "Austrian": "Austriaco", "Belgian": "Belga", "Brazilian": "Brasileño", "British": "Británico",
        "Canadian": "Canadiense", "Chilean": "Chileno", "Chinese": "Chino", "Colombian": "Colombiano",
        "Czech": "Checo", "Danish": "Danés", "Dutch": "Neerlandés", "East German": "Alemán Oriental",
        "Finnish": "Finlandés", "French": "Francés", "German": "Alemán", "Hungarian": "Húngaro",
        "Indian": "Indio", "Indonesian": "Indonesio", "Irish": "Irlandés", "Italian": "Italiano",
        "Japanese": "Japonés", "Liechtensteiner": "Liechtensteiniano", "Malaysian": "Malasio",
        "Mexican": "Mexicano", "Monegasque": "Monegasco", "New Zealander": "Neozelandés",
        "Polish": "Polaco", "Portuguese": "Portugués", "Rhodesian": "Rodesiano", "Russian": "Ruso",
        "South African": "Sudafricano", "Spanish": "Español", "Swedish": "Sueco", "Swiss": "Suizo",
        "Thai": "Tailandés", "Uruguayan": "Uruguayo", "Venezuelan": "Venezolano"
    }
}
def translate_nationality(nationality, lang):
    return NAT_TRANSLATIONS.get(lang, {}).get(nationality.strip(), nationality)

@lru_cache(maxsize=None)
def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def cargar_cache(lang):
    global cache
    filename = CACHE_FILE_TEMPLATE.format(lang=lang)
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            cache = json.load(f)
    else:
        regenerar_cache(lang)

def regenerar_cache(lang):
    global cache
    nuevos_roscos = [generar_rosco(lang) for _ in range(CACHE_SIZE)]
    with open(CACHE_FILE_TEMPLATE.format(lang=lang), 'w', encoding='utf-8') as f:
        json.dump(nuevos_roscos, f, ensure_ascii=False, indent=2)
    cache = nuevos_roscos

def obtener_rosco_aleatorio(lang):
    with cache_lock:
        if not cache:
            regenerar_cache(lang)
        return cache.pop(random.randint(0, len(cache)-1))


def prefetch_data(session):
    return {
        "drivers": session.execute(text("SELECT driverId, forename, surname, nationality FROM drivers")).fetchall(),
        "constructors": session.execute(text("SELECT constructorId, name, nationality FROM constructors")).fetchall(),
        "circuits": session.execute(text("SELECT name FROM circuits")).fetchall(),
        "races": session.execute(text("SELECT raceId, year FROM races WHERE year >= 1980")).fetchall(),
        "results": session.execute(text("""
            SELECT r.raceId, r.driverId, r.constructorId, r.position
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year >= 1980
        """)).fetchall(),
        "driver_standings": session.execute(text("""
            SELECT ds.driverId, ds.raceId, ds.position
            FROM driverstandings ds
            JOIN races ra ON ds.raceId = ra.raceId
            WHERE ra.year >= 1980
        """)).fetchall()
    }

def get_driver_result_stats(results):
    stats = {}
    for raceId, driverId, _, pos in results:
        if pos in (1, 2, 3):
            stats.setdefault((driverId, pos), 0)
            stats[(driverId, pos)] += 1
    return stats

def build_indexes(data):
    races_by_id = {r[0]: r[1] for r in data["races"]}
    driver_names = {d[0]: (d[1], d[2]) for d in data["drivers"]}
    constructor_names = {c[0]: c[1] for c in data["constructors"]}
    stats = get_driver_result_stats(data["results"])
    return races_by_id, driver_names, constructor_names, stats

def get_items_starting_with(session, table, column, letter):
    query = text(f"SELECT {column} FROM {table} WHERE {column} LIKE :pattern")
    results = session.execute(query, {"pattern": f"{letter}%"}).fetchall()
    return [r[0] for r in results]


def get_driver_details(session, letter):
    query = text("""
        SELECT forename, surname, nationality
        FROM drivers
        WHERE surname LIKE :pattern OR forename LIKE :pattern OR nationality LIKE :pattern
    """)
    return session.execute(query, {"pattern": f"{letter}%"}).fetchall()


def get_constructor_info(session, letter):
    query = text("""
        SELECT name, nationality
        FROM constructors
        WHERE name LIKE :pattern
    """)
    return session.execute(query, {"pattern": f"{letter}%"}).fetchall()


def get_statistical_highlights(session, letter, position, label):
    query = text(f"""
        SELECT d.forename, d.surname, COUNT(*) AS total
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position = :position
        GROUP BY d.driverId
        HAVING total >= 5
        ORDER BY total DESC
    """)
    results = session.execute(query, {"position": position}).fetchall()
    return [(row[0], row[1], row[2], label) for row in results if strip_accents(row[1].upper()).startswith(letter)]


def get_driver_teams(session, letter, lang):
    query = text("""
        SELECT d.forename, d.surname, c.name
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN constructors c ON r.constructorId = c.constructorId
    """)
    result = session.execute(query).fetchall()

    teams_by_driver = {}
    for forename, surname, team in result:
        key = (forename, surname)
        teams_by_driver.setdefault(key, set()).add(team)

    candidates = []
    for (forename, surname), teams in teams_by_driver.items():
        if strip_accents(surname.upper()).startswith(letter):
            team_list = sorted(teams)
            if len(team_list) >= 1:
                if lang == "es":
                    q1 = f"Piloto que ha corrido para el equipo {random.choice(team_list)}"
                    q2 = f"Piloto que ha corrido para los equipos: {', '.join(team_list)}"
                else:
                    q1 = f"Driver who raced for team {random.choice(team_list)}"
                    q2 = f"Driver who raced for teams: {', '.join(team_list)}"
                candidates.append((q1, surname))
                candidates.append((q2, surname))
    return candidates


def get_world_champions(session, letter, lang):
    query = text("""
        SELECT d.driverId, d.forename, d.surname, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') as constructors
        FROM driverstandings ds
        JOIN races r ON ds.raceId = r.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN results res ON res.raceId = r.raceId AND res.driverId = d.driverId
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE ds.position = 1
          AND r.round = (
              SELECT MAX(r2.round)
              FROM races r2
              WHERE r2.year = r.year
          )
        GROUP BY d.driverId, d.forename, d.surname
    """)

    results = session.execute(query).fetchall()
    champions = {}  # ← ESTA LÍNEA FALTABA

    for driverId, forename, surname, constructor_string in results:
        teams = set(constructor_string.split(", "))
        key = (forename, surname)
        champions.setdefault(key, teams)

    candidates = []
    for (forename, surname), teams in champions.items():
        if strip_accents(surname.upper()).startswith(letter):
            teams_list = sorted(teams)
            if lang == "es":
                q1 = f"Piloto campeón del mundo cuyo apellido empieza por {letter}"
                q2 = f"Piloto que fue campeón del mundo con: {', '.join(teams_list)}"
            else:
                q1 = f"F1 World Champion whose surname starts with {letter}"
                q2 = f"Driver who won the championship with: {', '.join(teams_list)}"
            candidates.append((q1, surname))
            candidates.append((q2, surname))
    return candidates


def get_constructor_extra_questions(session, letter, lang):
    candidates = []

    # 1. Equipo por nacionalidad
    query = text("SELECT name, nationality FROM constructors")
    results = session.execute(query).fetchall()
    for name, nationality in results:
        if strip_accents(nationality.upper()).startswith(letter):
            if lang == "es":
                question = f"Equipo de nacionalidad {nationality}"
            else:
                question = f"Team with nationality {nationality}"
            candidates.append((question, name))

    # 2. Equipo con títulos de constructores
    query_titles = text("""
        SELECT constructors.name, COUNT(*) AS titles
        FROM constructorstandings
        JOIN constructors ON constructorstandings.constructorId = constructors.constructorId
        WHERE constructorstandings.position = 1
        GROUP BY constructors.name
        HAVING titles >= 1
    """)

    titles_result = session.execute(query_titles).fetchall()
    for name, count in titles_result:
        if strip_accents(name.upper()).startswith(letter):
            if lang == "es":
                question = f"Equipo con {count} título(s) de constructores"
            else:
                question = f"Team with {count} constructor title(s)"
            candidates.append((question, name))

    # 3. Año de debut
    query_debut = text("""
        SELECT constructors.name, MIN(ra.year) AS debut
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors ON r.constructorId = constructors.constructorId
        GROUP BY constructors.name

    """)
    debut_result = session.execute(query_debut).fetchall()
    for name, debut in debut_result:
        if strip_accents(name.upper()).startswith(letter):
            if lang == "es":
                question = f"Equipo que debutó en el año {debut}"
            else:
                question = f"Team that debuted in {debut}"
            candidates.append((question, name))

    # 4. Campeones del mundo que han corrido en el equipo
    query_champs = text("""
        SELECT c.name, d.forename, d.surname
        FROM driverstandings ds
        JOIN races r ON ds.raceId = r.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN results res ON res.raceId = r.raceId AND res.driverId = d.driverId
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE ds.position = 1
          AND r.round = (
              SELECT MAX(r2.round)
              FROM races r2
              WHERE r2.year = r.year
          )
    """)



    team_champions = {}
    for team, forename, surname in session.execute(query_champs):
        team_champions.setdefault(team, set()).add(f"{forename} {surname}")

    for team, champions in team_champions.items():
        if strip_accents(team.upper()).startswith(letter):
            top_names = sorted(champions)[:3]
            if lang == "es":
                question = f"Equipo por el que han pasado campeones del mundo como: {', '.join(top_names)}"
            else:
                question = f"Team that had world champions like: {', '.join(top_names)}"
            candidates.append((question, team))

    return candidates

def get_f1_jargon_questions(letter, lang):
    all_jargon = {
        'A': {
            'es': [
                ("Parte del coche que canaliza el aire al frente del vehículo", "Alerón"),
                ("Término general para la eficiencia aerodinámica del coche", "Aero"),
                ("Término para aire turbulento detrás de un monoplaza", "Aire sucio"),
                ("Término para pruebas de desarrollo aerodinámico con restricciones", "ATR")
            ],
            'en': [
                ("Part of the car that channels air at the front", "Aero"),
                ("Restricted aerodynamic testing protocol", "ATR")
            ]
        },
        'B': {
            'es': [
                ("Apodo de la zona técnica donde se revisa el coche tras la carrera", "Box técnico"),
                ("Bandera que indica peligro y prohibe adelantar", "Bandera amarilla"),
                ("Configuración con mínima carga aerodinámica", "Baja carga"),
                ("Tipo de neumático de compuesto más blando", "Blandos")
            ],
            'en': [
                ("Flag indicating danger and no overtaking", "Yellow flag")
            ]
        },
        'C': {
            'es': [
                ("Nombre que recibe la sucesión de curvas enlazadas de baja velocidad", "Chicane")
            ],
            'en': [
                ("Sequence of slow left-right corners", "Chicane")
            ]
        },
        'D': {
            'es': [
                ("Dispositivo que reduce la resistencia aerodinámica en rectas", "DRS"),
                ("Fenómeno que provoca pérdida de adherencia trasera", "Patinaje")
            ],
            'en': [
                ("Device that reduces aerodynamic drag on straights", "DRS"),
                ("Turbulent air behind a car", "Dirty air")
            ]
        },
        'E': {
            'es': [
                ("Sistema de recuperación de energía cinética en F1", "ERS"),
            ],
            'en': [
                ("Kinetic energy recovery system in F1", "ERS"),
                ("Command to let teammate pass", "Team order")
            ]
        },
        'F': {
            'es': [
                ("Término para la vuelta previa a la salida", "Formation lap"),
                ("Indica que un coche ha completado la carrera", "Finalizado")
            ],
            'en': [
                ("Lap before race start to warm up tyres", "Formation lap"),
                ("Indicates a car has completed the race", "Finished")
            ]
        },
        'G': {
            'es': [
                ("Fuerza que experimenta un piloto en curvas y frenadas", "Fuerza G"),
                ("Fenómeno de pérdida de adherencia en neumáticos por exceso de temperatura", "Graining"),
                ("Victoria sin oposición de principio a fin, vuelta rápida, consiguiendo la pole y liderando todas las vueltas",
                "Grand Chelem")
            ],
            'en': [
                ("Force felt by drivers in turns and braking", "G-force"),
                ("Loss of grip due to tyre surface overheating", "Graining"),
                ("Start-to-finish dominant race win with pole, fastest lap and leading every lap", "Grand Chelem")
            ]
        },
        'H': {
            'es': [
                ("Sistema obligatorio de protección del habitáculo", "Halo"),
                ("Nombre del intento rápido durante clasificación", "Hot lap")
            ],
            'en': [
                ("Mandatory head protection system in F1", "Halo"),
                ("Fast lap attempt during quali", "Hot lap")
            ]
        },

        'I': {
            'es': [
                ("Apodo de los neumáticos de lluvia intermedia", "Intermedios")

            ],
            'en': [

            ]

        },
        'K': {
            'es': [
                ("Antiguo sistema de recuperación de energía cinética usado a principios de los 2010s", "KERS"),
                ("Unidad que convierte energía térmica en eléctrica", "Kinetic Unit")
            ],
            'en': [
                ("Old energy recovery system in F1 used at the beginning of 2010s", "KERS"),
                ("Unit converting thermal into electric energy", "Kinetic Unit")
            ]
        },
        'O': {
            'es': [
                ("Orden dada por el equipo a un piloto para favorecer a su compañero", "Orden de equipo")
            ],

            'en': [

            ]

        },
        'P': {
            'es': [
                ("Zona donde se hacen cambios de neumáticos", "Pit stop"),
                ("Zona designada donde los coches son inspeccionados tras la carrera", "Parque cerrado"),
                ("Zona de boxes donde se realizan los cambios de neumáticos", "Pit lane")
            ],
            'en': [
                ("Area where tyre changes are performed", "Pit stop"),
                ("Designated area where cars are inspected post-race", "Parc fermé"),
                ("Box lane where tyre changes and pit stops occur", "Pit lane"),
                ("Point system applied to drivers' licences for infringements", "Penalty points")
            ]
        },
        'Q': {
            'es': [
                ("Sesión para determinar el orden de salida", "Qualifying")
            ],
            'en': [
                ("Session that determines starting order", "Qualifying")
            ]
        },
        'R': {
            'es': [
                ("Cuando un piloto abandona una carrera", "Retirado")
            ],
            'en': [
                ("When a driver abandons a race", "Retired"),
                ("Low downforce configuration", "Low-drag setup")
            ]
        },
        'S': {
            'es': [
                ("Documento oficial que permite a un piloto participar en la F1", "Superlicencia"),
                ("Sesión de carrera corta previa al Gran Premio", "Sprint"),
                ("Sistema de puntos en la licencia del piloto por infracciones", "Sistema de sanciones"),
                ("Short race session before the main Grand Prix", "Sprint")
            ],
            'en': [
                ("Softest tyre compound", "Soft"),
                ("System that tracks live car data", "Telemetry"),
                ("Official document required to compete in Formula 1", "Super Licence")
            ]
        },
        'T': {
            'es': [
                ("Estructura trasera del coche que ofrece protección", "T-tray"),
                ("Término para los sensores que monitorean el coche en tiempo real", "Telemetría"),
                ("Orden de equipo que se da al piloto para dejar pasar al compañero", "Team order")
            ],
            'en': [
                ("Rear car structure for protection", "T-tray"),
                ("System that tracks live car data", "Telemetry")
            ]
        },
        'U': {
            'es': [
                ("Componente que ha sido utilizado previamente", "Usado"),
                ("Condición de neumático sin usar", "Nuevo")
            ],
            'en': [
                ("Component that has been previously used", "Used"),
                ("Tyre condition never used", "Unused")
            ]
        },
        'V': {
            'es': [
                ("Indica que el coche va en vuelta válida para clasificación", "Vuelta lanzada"),
                ("Modalidad de coche de seguridad controlado electrónicamente", "VSC")
            ],
            'en': [
                ("Valid flying lap in quali", "Flying lap"),
                ("Electronically controlled safety car mode", "VSC")
            ]
        },
        'W': {
            'es': [
                ("Neumático para condiciones de lluvia extrema", "Wet")
            ],
            'en': [
                ("Tyre for extreme wet conditions", "Wet"),
                ("Nickname for intermediate rain tyres", "Inters"),
                ("Loss of rear grip under acceleration", "Wheelspin")
            ]
        },
        'X': {
            'es': [
                ("Letra con la que se marcan estrategias experimentales", "Plan X")
            ],
            'en': [
                ("Code letter for unknown or experimental strategies", "Plan X")
            ]
        },
        'Y': {
            'es': [
                ("Término que se refiere al coche de seguridad virtual", "VSC")
            ],
            'en': [
                ("Term for Virtual Safety Car", "VSC")
            ]
        },
        'Z': {
            'es': [
                ("Maniobra de calentamiento de neumáticos", "Zig zag"),
                ("Zonas con sensores de activación DRS", "Zona DRS")
            ],
            'en': [
                ("Tyre-warming manoeuvre", "Zig zag"),
                ("Zones where DRS is enabled", "DRS Zone")
            ]
        }
    }
    if letter in all_jargon and lang in all_jargon[letter]:
        return all_jargon[letter][lang]
    return []




def generate_for_letter(letter, lang, data):
    letter = strip_accents(letter.upper())
    candidates = []
    session = Session()
    try:
        for _, forename, surname, nationality in data["drivers"]:
            translated_nat = translate_nationality(nationality, lang)
            if strip_accents(surname.upper()).startswith(letter):
                q = f"Piloto de nacionalidad {translated_nat}" if lang == "es" else f"Driver with nationality {translated_nat}"
                candidates.append((q, surname))
            if strip_accents(forename.upper()).startswith(letter):
                q = f"¿Cuál es el apellido del piloto llamado {forename}?" if lang == "es" else f"What is the surname of the driver named {forename}"
                candidates.append((q, surname))

        for _, name, nationality in data["constructors"]:
            translated_nat = translate_nationality(nationality, lang)
            if strip_accents(name.upper()).startswith(letter):
                q = f"Escudería de nacionalidad {translated_nat}" if lang == "es" else f"Team with nationality {translated_nat}"
                candidates.append((q, name))
            if strip_accents(nationality.upper()).startswith(letter):
                q = f"Equipo con nacionalidad que empieza por {letter}" if lang == "es" else f"Team with nationality starting with {letter}"
                candidates.append((q, name))

        for (circuit,) in data["circuits"]:
            if strip_accents(circuit.upper()).startswith(letter):
                q = f"Circuito de F1 cuyo nombre empieza por {letter}" if lang == "es" else f"F1 circuit starting with {letter}"
                candidates.append((q, circuit))

        from generate_rondo import get_statistical_highlights, get_driver_teams, get_world_champions, get_constructor_extra_questions, get_f1_jargon_questions

        for row in get_statistical_highlights(session, letter, 1, "victorias"):
            candidates.append((f"Piloto con al menos 5 victorias cuyo apellido empieza por {letter}" if lang == "es" else f"Driver with at least 5 wins whose surname starts with {letter}", row[1]))

        candidates += get_driver_teams(session, letter, lang)
        candidates += get_world_champions(session, letter, lang)
        candidates += get_constructor_extra_questions(session, letter, lang)
        candidates += get_f1_jargon_questions(letter, lang)

        grouped = {}
        for question, answer in candidates:
            grouped.setdefault(question, []).append(answer)

        valid = [(q, [a for a in ans if strip_accents(a.upper()).startswith(letter)]) for q, ans in grouped.items()]
        valid = [(q, ans) for q, ans in valid if len(ans) > 0]

        if not valid:
            return {"letter": letter, "question": f"No hay pregunta para {letter}", "hasValidAnswer": False}

        question, answers = random.choice(valid)
        return {"letter": letter, "question": question, "hasValidAnswer": True}

    except Exception as e:
        print(f"[ERROR] Letra {letter} → {e}")
        return {"letter": letter, "question": f"Error generando pregunta para {letter}", "hasValidAnswer": False}
    finally:
        session.close()



def generar_rosco(lang):
    session = Session()
    try:
        data = {
            "drivers": session.execute(text("SELECT driverId, forename, surname, nationality FROM drivers")).fetchall(),
            "constructors": session.execute(text("SELECT constructorId, name, nationality FROM constructors")).fetchall(),
            "circuits": session.execute(text("SELECT circuitRef FROM circuits")).fetchall(),
            "races": session.execute(text("SELECT raceId, year FROM races WHERE year >= 1980")).fetchall(),
            "results": session.execute(text("""
                SELECT r.raceId, r.driverId, r.constructorId, r.position
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                WHERE ra.year >= 1980
            """)).fetchall(),
            "driver_standings": session.execute(text("""
                SELECT ds.driverId, ds.raceId, ds.position
                FROM driverstandings ds
                JOIN races ra ON ds.raceId = ra.raceId
                WHERE ra.year >= 1980
            """)).fetchall()
        }

        def process_letter(letter):
            return generate_for_letter(letter, lang, data)

        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
            futures = [executor.submit(process_letter, letter) for letter in LETTERS]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        results.sort(key=lambda x: x["letter"])
        return results
    finally:
        session.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", default="es", choices=["es", "en"])
    args = parser.parse_args()
    rosco = generar_rosco(args.lang)
    print(json.dumps(rosco, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
