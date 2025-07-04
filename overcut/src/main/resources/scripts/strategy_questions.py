
import random
import json
import sys
import argparse

def pregunta_numero_paradas_ganador_gp():
    if LANG == "es":
        return {
            "question": "¿Cuántas paradas en boxes realizó el ganador del GP de Hungría 2021?",
            "answers": ["2", "1", "3", "4"],
            "correctAnswer": "2",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many pit stops did the winner of the 2021 Hungarian GP make?",
            "answers": ["2", "1", "3", "4"],
            "correctAnswer": "2",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def pregunta_estrategia_una_parada():
    if LANG == "es":
        return {
            "question": "¿Qué piloto ganó el GP de Mónaco 2022 utilizando solo una parada?",
            "answers": ["Sergio Pérez", "Charles Leclerc", "Carlos Sainz", "Max Verstappen"],
            "correctAnswer": "Sergio Pérez",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which driver won the 2022 Monaco GP using only one stop?",
            "answers": ["Sergio Pérez", "Charles Leclerc", "Carlos Sainz", "Max Verstappen"],
            "correctAnswer": "Sergio Pérez",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def pregunta_piloto_gano_con_safety_car():
    if LANG == "es":
        return {
            "question": "¿Qué piloto aprovechó un coche de seguridad para ganar el GP de Azerbaiyán 2021?",
            "answers": ["Sergio Pérez", "Lewis Hamilton", "Sebastian Vettel", "Pierre Gasly"],
            "correctAnswer": "Sergio Pérez",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which driver took advantage of a safety car to win the 2021 Azerbaijan GP?",
            "answers": ["Sergio Pérez", "Lewis Hamilton", "Sebastian Vettel", "Pierre Gasly"],
            "correctAnswer": "Sergio Pérez",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def pregunta_compuestos_utilizados_ganador():
    if LANG == "es":
        return {
            "question": "¿Qué compuestos utilizó el ganador del GP de Brasil 2023?",
            "answers": ["Medio y blando", "Blando y duro", "Solo medio", "Duro y medio"],
            "correctAnswer": "Medio y blando",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which tyre compounds did the 2023 Brazilian GP winner use?",
            "answers": ["Medium and soft", "Soft and hard", "Only medium", "Hard and medium"],
            "correctAnswer": "Medium and soft",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def pregunta_quien_entra_primero_boxes():
    if LANG == "es":
        return {
            "question": "¿Quién entró primero a boxes en el GP de Gran Bretaña 2022 entre los pilotos de Ferrari?",
            "answers": ["Carlos Sainz", "Charles Leclerc", "Ninguno paró", "Ambos al mismo tiempo"],
            "correctAnswer": "Carlos Sainz",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Who pitted first in the 2022 British GP among Ferrari drivers?",
            "answers": ["Carlos Sainz", "Charles Leclerc", "Neither pitted", "Both at the same time"],
            "correctAnswer": "Carlos Sainz",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def situacion_simulada_undercut_vs_aguantar():
    if LANG == "es":
        return {
            "question": "Faltan 12 vueltas para el final. Tu piloto está en P3 con neumáticos medios usados, a 1 segundo de P2 y 7 segundos delante de P4. P2 entra a boxes y monta neumáticos blandos nuevos. ¿Qué estrategia es la mejor?",
            "answers": [
                "Parar en la siguiente vuelta para evitar el undercut y montar blandos",
                "Permanecer en pista y esperar un posible Safety Car",
                "Pedir al piloto que gestione los neumáticos hasta el final",
                "Cambiar a neumáticos duros para asegurar la estabilidad"
            ],
            "correctAnswer": "Pedir al piloto que gestione los neumáticos hasta el final",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "With 12 laps remaining, your driver is in P3 on used medium tyres, 1s behind P2 and 7s ahead of P4. P2 pits and switches to new softs. What is the best strategy?",
            "answers": [
                "Pit on the next lap to cover the undercut and switch to softs",
                "Stay out and hope for a Safety Car",
                "Ask the driver to manage tyres until the end",
                "Switch to hard tyres to ensure stability"
            ],
            "correctAnswer": "Ask the driver to manage tyres until the end",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def simulacion_lluvia_inminente():
    if LANG == "es":
        return {
            "question": "Tu piloto está en P2 con neumáticos blandos nuevos, y el radar indica lluvia fuerte en 5 vueltas. El líder va con medios usados. ¿Qué decisión estratégica deberías tomar?",
            "answers": [
                "Alargar el stint hasta que empiece la lluvia para evitar una parada extra",
                "Entrar ahora y montar intermedios anticipadamente",
                "Parar inmediatamente por medios y asegurar rendimiento hasta la lluvia",
                "Intentar un undercut y confiar en la lluvia más tarde"
            ],
            "correctAnswer": "Alargar el stint hasta que empiece la lluvia para evitar una parada extra",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is P2 on fresh softs, and heavy rain is expected in 5 laps. The leader is on worn mediums. What is the best strategic decision?",
            "answers": [
                "Extend the stint until the rain starts to avoid an extra stop",
                "Pit now and switch early to intermediates",
                "Box immediately for mediums to hold pace until rain",
                "Try an undercut and hope the rain comes later"
            ],
            "correctAnswer": "Extend the stint until the rain starts to avoid an extra stop",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def simulacion_safety_car_final():
    if LANG == "es":
        return {
            "question": "Un Safety Car sale a falta de 4 vueltas. Tu piloto lidera con neumáticos duros de 25 vueltas. Segundo y tercero paran y montan blandos nuevos. ¿Qué deberías hacer?",
            "answers": [
                "Permanecer en pista para mantener la posición en la resalida",
                "Entrar a boxes y arriesgarse a salir tercero con mejor ritmo",
                "Montar intermedios por si cambia el clima",
                "Cambiar a medios usados por equilibrio entre agarre y desgaste"
            ],
            "correctAnswer": "Permanecer en pista para mantener la posición en la resalida",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A Safety Car is deployed with 4 laps remaining. Your driver leads on 25-lap-old hards. P2 and P3 pit for new softs. What should you do?",
            "answers": [
                "Stay out to keep track position for the restart",
                "Pit and risk rejoining in P3 with better grip",
                "Switch to intermediates in case of changing weather",
                "Change to used mediums for a balance of grip and durability"
            ],
            "correctAnswer": "Stay out to keep track position for the restart",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def simulacion_doble_parada_con_distancias():
    if LANG == "es":
        return {
            "question": "Tu piloto lidera con 15 vueltas en neumáticos medios. Faltan 12 vueltas para el final. El segundo está a 6.3 segundos y acaba de parar para blandos. El tercero está a 10.1s y también ha parado. ¿Qué estrategia es mejor?",
            "answers": [
                "Hacer una segunda parada y confiar en recuperar la posición en pista con blandos nuevos",
                "Aguantar hasta el final gestionando los neumáticos actuales",
                "Parar por neumáticos duros usados para defenderse",
                "Esperar un Virtual Safety Car para minimizar la pérdida"
            ],
            "correctAnswer": "Aguantar hasta el final gestionando los neumáticos actuales",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is leading on 15-lap-old mediums. 12 laps remain. P2 is 6.3s behind and just pitted for softs. P3 is 10.1s back and also stopped. What is the best strategy?",
            "answers": [
                "Make a second stop and trust in overtaking with fresh softs",
                "Stay out and manage tyre wear",
                "Pit for used hards to defend position",
                "Wait for a Virtual Safety Car to minimize time loss"
            ],
            "correctAnswer": "Stay out and manage tyre wear",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def simulacion_riesgo_slicks_con_gap():
    if LANG == "es":
        return {
            "question": "La pista se seca y tu piloto está en P5 con intermedios. El sexto ha puesto slicks y viene 4.2s detrás marcando mejores sectores. El líder ya ha cambiado también. ¿Qué decisión tomar?",
            "answers": [
                "Parar ya por slicks para evitar perder posición y ritmo",
                "Esperar una vuelta más para evaluar el sector 2",
                "Permanecer fuera y mantener temperatura con intermedios",
                "Parar por medios usados para menor degradación"
            ],
            "correctAnswer": "Parar ya por slicks para evitar perder posición y ritmo",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Track is drying. Your driver is P5 on intermediates with 8 laps to go. P6 switched to slicks and is 4.2s behind, setting purple sectors. Leader has also changed. What do you do?",
            "answers": [
                "Box now for slicks to avoid losing position and pace",
                "Wait one more lap to monitor sector 2",
                "Stay out and keep inter tyre temps",
                "Box for used mediums to reduce degradation"
            ],
            "correctAnswer": "Box now for slicks to avoid losing position and pace",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def simulacion_sacrificio_equipo_con_tiempos():
    if LANG == "es":
        return {
            "question": "Tus pilotos están 1º y 2º. El líder (Leclerc) tiene 1.8s de ventaja sobre Hamilton, pero Verstappen en P3 ha parado y viene 7s detrás con blandos nuevos. Quedan 14 vueltas. Si Leclerc entra ahora, pierde posición. ¿Qué es mejor para el equipo?",
            "answers": [
                "Hacer parar a Leclerc para cubrir a Verstappen y mantener opciones de victoria",
                "Mantener ambos fuera y frenar el ritmo de Verstappen",
                "Parar a Sainz para el undercut y dejar a Leclerc en pista",
                "Doblar parada en boxes pese al riesgo"
            ],
            "correctAnswer": "Mantener ambos fuera y frenar el ritmo de Verstappen",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your drivers are 1st and 2nd. Leclerc leads by 1.8s over Sainz. Verstappen in P3 is 7s back on fresh softs. If Leclerc pits now, he loses track position. 14 laps left. What’s best for the team?",
            "answers": [
                "Box Leclerc to cover Verstappen and preserve win chances",
                "Keep both drivers out and defend Verstappen's pace",
                "Pit Sainz for undercut and keep Leclerc out",
                "Double stack both cars despite pit lane risk"
            ],
            "correctAnswer": "Keep both drivers out and defend Verstappen's pace",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_undercut_defensivo():
    if LANG == "es":
        return {
            "question": "P4 con medios (13v). P5 está a 1.2s y acaba de parar por blandos. Doble bandera amarilla. SC posible. ¿Qué haces?",
            "answers": [
                "Parar ahora para cubrir undercut",
                "Aguantar por si hay SC",
                "Parar por duros para más vida útil",
                "Esperar ataque directo y defender"
            ],
            "correctAnswer": "Parar ahora para cubrir undercut",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P4 on mediums (13 laps). P5 is 1.2s behind and pitted for softs. Double yellow flag. SC likely. What do you do?",
            "answers": [
                "Pit now to cover undercut",
                "Stay out hoping for SC",
                "Switch to hards for durability",
                "Defend on track when attacked"
            ],
            "correctAnswer": "Pit now to cover undercut",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_aguantar_neumaticos():
    if LANG == "es":
        return {
            "question": "P2 con duros (20v), faltan 10v. P3 con blandos nuevos está a 4.8s. ¿Qué estrategia tomas?",
            "answers": [
                "Aguantar y gestionar ritmo",
                "Parar por blandos y recuperar",
                "Parar por medios usados",
                "Reducir ritmo para proteger goma"
            ],
            "correctAnswer": "Aguantar y gestionar ritmo",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P2 on hards (20 laps), 10 laps to go. P3 on fresh softs 4.8s behind. Best strategy?",
            "answers": [
                "Stay out and manage pace",
                "Pit for softs and attack",
                "Switch to used mediums",
                "Slow down to preserve tyres"
            ],
            "correctAnswer": "Stay out and manage pace",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_vsc_repentino():
    if LANG == "es":
        return {
            "question": "VSC activo. P1 con medios (17v), P2 a 2.3s (17v). ¿Qué haces?",
            "answers": [
                "Parar ya por duros y cubrir posición",
                "Aprovechar VSC para montar blandos",
                "Esperar y parar más tarde",
                "No parar y mantener ritmo"
            ],
            "correctAnswer": "Parar ya por duros y cubrir posición",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "VSC out. P1 on 17-lap mediums, P2 2.3s (17-lap mediums). What’s the call?",
            "answers": [
                "Box now for hards to cover position",
                "Use VSC to take softs",
                "Wait and pit later",
                "Stay out and keep pace"
            ],
            "correctAnswer": "Box now for hards to cover position",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_safety_y_doble_parada():
    if LANG == "es":
        return {
            "question": "SC activa. Faltan 6v. P3 a 1.1s con blandos viejos. P5 entra por nuevos. ¿Qué haces?",
            "answers": [
                "Entrar también y asegurar ritmo",
                "Quedarte y defender posición",
                "Montar medios si hay",
                "Esperar otro SC"
            ],
            "correctAnswer": "Entrar también y asegurar ritmo",
            "knowledgeLevel": 4,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "SC out. 6 laps to go. P3 1.1s ahead on old softs. P5 pits for new. What do you do?",
            "answers": [
                "Pit as well for pace",
                "Stay out and defend",
                "Switch to mediums if available",
                "Wait for another SC"
            ],
            "correctAnswer": "Pit as well for pace",
            "knowledgeLevel": 4,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_retrasar_undercut():
    if LANG == "es":
        return {
            "question": "P5, tu rival en P6 entra a boxes vuelta 18. Tienes 3s de gap. ¿Undercut o sobrecorte?",
            "answers": [
                "Parar vuelta siguiente y cubrir",
                "Alargar 2 vueltas y sobrecorte",
                "Esperar SC",
                "Cambiar estrategia a una parada"
            ],
            "correctAnswer": "Parar vuelta siguiente y cubrir",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P5, rival in P6 pits lap 18. You have 3s gap. Undercut or overcut?",
            "answers": [
                "Box next lap to cover",
                "Extend 2 laps for overcut",
                "Wait for SC",
                "Switch to one-stop"
            ],
            "correctAnswer": "Box next lap to cover",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_gestion_doble_stint():
    if LANG == "es":
        return {
            "question": "P2 con medios nuevos, 16v para el final. P1 está a 5.2s con duros de 10v. ¿Plan ideal?",
            "answers": [
                "Atacar con ritmo antes de que degraden",
                "Esperar y conservar neumáticos para final",
                "Hacer otra parada e ir a por vuelta rápida",
                "Reducir ritmo y proteger P2"
            ],
            "correctAnswer": "Atacar con ritmo antes de que degraden",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P2 on fresh mediums, 16 laps to go. P1 is 5.2s ahead on 10-lap-old hards. Best plan?",
            "answers": [
                "Push now before tyres degrade",
                "Hold pace and save tyres for the end",
                "Pit again and go for fastest lap",
                "Slow down and defend P2"
            ],
            "correctAnswer": "Push now before tyres degrade",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_doble_stack_apretado():
    if LANG == "es":
        return {
            "question": "SC desplegado. P1 y P2 (mismo equipo) separados por 1.4s. ¿Doble parada o no?",
            "answers": [
                "Sí, doble parada y arriesgar tráfico",
                "Solo parar al líder",
                "Solo parar al segundo",
                "Dejar ambos fuera"
            ],
            "correctAnswer": "Sí, doble parada y arriesgar tráfico",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "SC active. P1 and P2 (same team) 1.4s apart. Double stack?",
            "answers": [
                "Yes, double stack and risk traffic",
                "Pit only the leader",
                "Pit only the second driver",
                "Leave both out"
            ],
            "correctAnswer": "Yes, double stack and risk traffic",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_compuesto_equivocado():
    if LANG == "es":
        return {
            "question": "P3 con blandos nuevos. SC inesperado desplegado. Todos montan medios. 20 vueltas para el final. ¿Cambio o mantener?",
            "answers": [
                "Cambiar a medios para igualar ritmo",
                "Mantener blandos para ventaja inicial",
                "Parar por duros y apostar por menos degradación",
                "Esperar y ver ritmo en 1 vuelta"
            ],
            "correctAnswer": "Cambiar a medios para igualar ritmo",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P3 on new softs. Unexpected SC. Everyone switches to mediums. Change or stay?",
            "answers": [
                "Switch to mediums to match pace",
                "Stay on softs for restart grip",
                "Pit for hards to reduce wear",
                "Wait 1 lap to evaluate pace"
            ],
            "correctAnswer": "Switch to mediums to match pace",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_sin_neumaticos_ideales():
    if LANG == "es":
        return {
            "question": "P4, SC activa. Solo tienes duros usados o blandos nuevos. 10 vueltas para el final. ¿Qué montas?",
            "answers": [
                "Blandos nuevos para atacar en relanzamiento",
                "Duros usados y defender posición",
                "No parar",
                "Salir con blandos y parar de nuevo si degrada"
            ],
            "correctAnswer": "Blandos nuevos para atacar en relanzamiento",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P4, SC active. Only options: used hards or new softs. 10 laps to go. What do you choose?",
            "answers": [
                "New softs to attack at restart",
                "Used hards to defend",
                "Stay out",
                "Go with softs and box again if needed"
            ],
            "correctAnswer": "New softs to attack at restart",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_defensa_final():
    if LANG == "es":
        return {
            "question": "Faltan 5v. P1 con duros de 20v, P2 (Leclerc) a 2.6s con blandos nuevos. ¿Qué haces?",
            "answers": [
                "Conservar ERS y defender en rectas",
                "Empujar para evitar DRS",
                "Cambiar estrategia y parar",
                "Reducir ritmo y conservar neumáticos"
            ],
            "correctAnswer": "Conservar ERS y defender en rectas",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "5 laps left. P1 on 20-lap hards, P2 (Leclerc) 2.6s back on new softs. What’s best?",
            "answers": [
                "Save ERS for straight-line defense",
                "Push to avoid DRS window",
                "Change strategy and pit",
                "Slow down to save tyres"
            ],
            "correctAnswer": "Save ERS for straight-line defens",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_bajo_lluvia_ligera():
    if LANG == "es":
        return {
            "question": "Lluvia ligera empieza en vuelta 34. P3 con blandos usados, pista aún rápida. P4 entra por intermedios. ¿Qué haces?",
            "answers": [
                "Esperar y seguir en pista hasta que la lluvia aumente",
                "Parar ya por intermedios y ganar con tracción",
                "Montar duros por seguridad",
                "Entrar por medios usados"
            ],
            "correctAnswer": "Esperar y seguir en pista hasta que la lluvia aumente",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Light rain starts on lap 34. P3 on used softs, track still fast. P4 pits for inters. What do you do?",
            "answers": [
                "Stay out and wait for heavier rain",
                "Pit now for inters and gain traction",
                "Switch to hards for safety",
                "Box for used mediums"
            ],
            "correctAnswer": "Stay out and wait for heavier rain",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_pit_stop_lento():
    if LANG == "es":
        return {
            "question": "Tu piloto P2 hace una parada lenta (+3.5s) y cae a P4. Tiene blandos nuevos. Faltan 10v. ¿Qué orden das?",
            "answers": [
                "Empujar al máximo para recuperar posiciones",
                "Guardar neumáticos y atacar en últimas vueltas",
                "Esperar errores delante",
                "Reducir ritmo y conservar P4"
            ],
            "correctAnswer": "Empujar al máximo para recuperar posiciones",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver P2 has a slow stop (+3.5s) and drops to P4. He has new softs. 10 laps left. What’s the call?",
            "answers": [
                "Push hard to regain places",
                "Save tyres and attack late",
                "Wait for mistakes ahead",
                "Back off and hold P4"
            ],
            "correctAnswer": "Push hard to regain places",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_error_delantero():
    if LANG == "es":
        return {
            "question": "P1 comete error y pierde 2s. Tu piloto en P2 está a 3.3s, blandos nuevos. 2 vueltas para el final. ¿Qué haces?",
            "answers": [
                "Empujar ahora y forzar error extra",
                "Esperar a que se degraden sus neumáticos",
                "Conservar para el último ataque",
                "Entrar por neumáticos extra para vuelta rápida"
            ],
            "correctAnswer": "Empujar ahora y forzar error extra",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P1 makes a mistake and loses 2s. Your driver in P2 is 3.3s back on new softs. 2 laps to go. What’s best?",
            "answers": [
                "Push now and trigger another mistake",
                "Wait for his tyres to degrade",
                "Save for final-lap attack",
                "Box for extra set and go fastest lap"
            ],
            "correctAnswer": "Push now and trigger another mistake",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_con_rival_bloqueando():
    if LANG == "es":
        return {
            "question": "Tu piloto está P4, 0.6s detrás de un rival que defiende agresivamente. Faltan 7v. ¿Estrategia?",
            "answers": [
                "Mantener presión y buscar error",
                "Parar y hacer undercut agresivo",
                "Esperar hasta última vuelta para intento único",
                "Intentar pasar en recta sin DRS"
            ],
            "correctAnswer": "Mantener presión y buscar error",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is P4, 0.6s behind an aggressive defender. 7 laps left. Strategy?",
            "answers": [
                "Keep pressure and wait for mistake",
                "Pit now for aggressive undercut",
                "Wait until last lap for one-shot move",
                "Try passing on straight without DRS"
            ],
            "correctAnswer": "Keep pressure and wait for mistake",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_final_con_ventaja():
    if LANG == "es":
        return {
            "question": "Tu piloto lidera con 4.2s a falta de 5v. Tiene duros de 22v. ¿Qué orden das?",
            "answers": [
                "Conservar neumáticos y evitar errores",
                "Empujar para asegurar margen",
                "Parar por blandos y arriesgar",
                "Cambiar configuración ERS a ataque total"
            ],
            "correctAnswer": "Conservar neumáticos y evitar errores",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver leads by 4.2s with 5 laps to go on 22-lap hards. What’s the call?",
            "answers": [
                "Manage tyres and avoid mistakes",
                "Push harder to keep gap",
                "Pit for softs and risk it",
                "Switch ERS to full attack mode"
            ],
            "correctAnswer": "Manage tyres and avoid mistakes",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_sin_DRS_con_rebufo():
    if LANG == "es":
        return {
            "question": "Tu piloto está P6 a 0.8s de P5 sin DRS pero con gran rebufo. ¿Qué haces?",
            "answers": [
                "Intentar adelantamiento usando rebufo y ERS",
                "Esperar DRS en la siguiente vuelta",
                "Conservar neumáticos y esperar error",
                "Parar en boxes y buscar aire limpio"
            ],
            "correctAnswer": "Esperar DRS en la siguiente vuelta",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is P6, 0.8s behind P5 without DRS but with strong slipstream. What do you do?",
            "answers": [
                "Try overtaking using tow and ERS",
                "Wait for DRS next lap",
                "Save tyres and wait for mistake",
                "Box now and go for clean air"
            ],
            "correctAnswer": "Wait for DRS next lap",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_reincorporacion_congestion():
    if LANG == "es":
        return {
            "question": "Parar ahora te devuelve en tráfico (P9–P12). Estás en P5 con medios. ¿Parar o alargar?",
            "answers": [
                "Alargar stint para evitar tráfico",
                "Parar ya y pasar en pista",
                "Esperar VSC o SC",
                "Cambiar a estrategia de una parada"
            ],
            "correctAnswer": "Alargar stint para evitar tráfico",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Boxing now drops you into traffic (P9–P12). You're in P5 on mediums. Box or extend?",
            "answers": [
                "Extend stint to avoid traffic",
                "Pit now and overtake on track",
                "Wait for VSC or SC",
                "Switch to one-stop strategy"
            ],
            "correctAnswer": "Extend stint to avoid traffic",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_bluff_equipo():
    if LANG == "es":
        return {
            "question": "Tu equipo finge parada. Rival (P1) entra. Tú en P2 con blandos nuevos. ¿Acción?",
            "answers": [
                "Quedarse en pista y ganar posición",
                "Parar también y cubrir ritmo",
                "Cambiar a duros y ahorrar otra parada",
                "Esperar y atacar con ritmo final"
            ],
            "correctAnswer": "Quedarse en pista y ganar posición",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your team fakes a pit stop. Rival (P1) boxes. You're P2 on new softs. Decision?",
            "answers": [
                "Stay out and gain track position",
                "Pit too to match pace",
                "Switch to hards to avoid another stop",
                "Wait and attack with later pace"
            ],
            "correctAnswer": "Stay out and gain track position",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_bajo_safety_cars_consecutivos():
    if LANG == "es":
        return {
            "question": "Dos SC en 4 vueltas. Tu piloto con medios nuevos en P3. ¿Qué hacer?",
            "answers": [
                "Mantenerse y proteger neumáticos",
                "Parar por blandos frescos",
                "Pasar a duros por posibles relanzamientos largos",
                "Reducir ritmo para alargar stint"
            ],
            "correctAnswer": "Mantenerse y proteger neumáticos",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Two SCs in 4 laps. Your driver P3 on new mediums. What now?",
            "answers": [
                "Stay out and preserve tyres",
                "Pit for fresh softs",
                "Switch to hards for possible long run",
                "Back off to extend the stint"
            ],
            "correctAnswer": "Stay out and preserve tyres",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_final_carrera_apretada():
    if LANG == "es":
        return {
            "question": "Última vuelta. Estás P2 a 0.5s del líder sin DRS. ¿Cuál es la mejor táctica?",
            "answers": [
                "Usar todo el ERS en recta final",
                "Intentar divebomb en curva lenta",
                "Presionar para fallo bajo presión",
                "Esperar DRS tras meta"
            ],
            "correctAnswer": "Usar todo el ERS en recta final",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Final lap. You're P2, 0.5s behind leader without DRS. Best move?",
            "answers": [
                "Use all ERS on final straight",
                "Try a divebomb in slow corner",
                "Force a mistake under pressure",
                "Wait for DRS after finish line"
            ],
            "correctAnswer": "Use all ERS on final straight",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_reinicio_despues_safety_car():
    if LANG == "es":
        return {
            "question": "Reinicio tras SC. Tu piloto en P2 con medios nuevos, el líder en duros usados. ¿Qué orden das?",
            "answers": [
                "Atacar desde la curva 1 aprovechando tracción",
                "Esperar errores y guardar neumáticos",
                "Conservar energía y observar ritmo",
                "Parar por blandos y buscar vuelta rápida"
            ],
            "correctAnswer": "Atacar desde la curva 1 aprovechando tracción",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Restart after SC. Your driver P2 on new mediums, leader on used hards. What’s the call?",
            "answers": [
                "Attack in turn 1 with traction advantage",
                "Wait for errors and save tyres",
                "Save energy and monitor pace",
                "Box for softs and go for fastest lap"
            ],
            "correctAnswer": "Attack in turn 1 with traction advantage",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_al_final_de_sprint():
    if LANG == "es":
        return {
            "question": "Final de Sprint. Tu piloto va 8º, blandos muy degradados, detrás de P7 con medios. ¿Qué haces?",
            "answers": [
                "Intentar el adelantamiento con todo el ERS restante",
                "Conservar y mantener posición para la carrera",
                "Parar para montar compuestos nuevos",
                "Reducir ritmo para evitar errores"
            ],
            "correctAnswer": "Intentar el adelantamiento con todo el ERS restante",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Sprint ending. Your driver is P8 on heavily degraded softs behind P7 on mediums. What do you do?",
            "answers": [
                "Use all remaining ERS to attack",
                "Hold and secure starting spot",
                "Pit for fresh compound",
                "Back off to avoid mistakes"
            ],
            "correctAnswer": "Use all remaining ERS to attack",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_sin_parar_con_safety_car():
    if LANG == "es":
        return {
            "question": "SC sale vuelta 40/52. Todos paran menos tú. Estás P1 con duros usados. ¿Decisión?",
            "answers": [
                "Mantener pista y defender al reinicio",
                "Parar ahora y perder posición",
                "Esperar otro SC",
                "Entrar en la vuelta siguiente"
            ],
            "correctAnswer": "Mantener pista y defender al reinicio",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "SC out on lap 40/52. Everyone pits but you. P1 on old hards. What now?",
            "answers": [
                "Stay out and defend on restart",
                "Pit now and give up lead",
                "Wait for another SC",
                "Box on next lap"
            ],
            "correctAnswer": "Stay out and defend on restart",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_pierde_drs_en_tren():
    if LANG == "es":
        return {
            "question": "P7 en tren DRS, pierdes zona por 1.1s. P8 ataca. ¿Qué estrategia tomas?",
            "answers": [
                "Defender en curvas y ahorrar energía",
                "Parar y buscar aire limpio",
                "Reducir ritmo y conservar goma",
                "Forzar para reconectar con DRS"
            ],
            "correctAnswer": "Forzar para reconectar con DRS",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P7 in DRS train, lost DRS by 1.1s. P8 is closing in. What’s your call?",
            "answers": [
                "Defend corners and save energy",
                "Pit for clean air",
                "Slow down to preserve tyres",
                "Push to reconnect DRS gap"
            ],
            "correctAnswer": "Push to reconnect DRS gap",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_sancion_5s_posible():
    if LANG == "es":
        return {
            "question": "Tu piloto está P3 pero con sanción de 5s. P4 a 4.6s. ¿Qué hacer?",
            "answers": [
                "Empujar para abrir más de 5s",
                "Dejar pasar a P4 y seguirle",
                "Pedir que defienda en pista",
                "Reducir ritmo para conservar P3"
            ],
            "correctAnswer": "Empujar para abrir más de 5s",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is P3 but has a 5s penalty. P4 is 4.6s back. What’s the call?",
            "answers": [
                "Push to build over 5s gap",
                "Let P4 pass and follow",
                "Instruct to defend on track",
                "Back off to keep P3 tyre life"
            ],
            "correctAnswer": "Push to build over 5s gap",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }



def estrategia_bajo_virtual_y_gap_optimo():
    if LANG == "es":
        return {
            "question": "VSC activa. Tu piloto está P2, a 5s de P1. Parar ahora es 14s. ¿Parar o no?",
            "answers": [
                "Parar y aprovechar VSC para reducir pérdida",
                "No parar y mantener presión",
                "Esperar SC real",
                "Cambiar a duros usados"
            ],
            "correctAnswer": "Parar y aprovechar VSC para reducir pérdida",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "VSC active. You're P2, 5s behind P1. Pit loss now is 14s. Box?",
            "answers": [
                "Box now and minimize loss under VSC",
                "Stay out and keep pressure",
                "Wait for full SC",
                "Switch to used hards"
            ],
            "correctAnswer": "Box now and minimize loss under VSC",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_cambio_meteorologico_repaso():
    if LANG == "es":
        return {
            "question": "Radar muestra lluvia en 3v. Tu piloto P5 con blandos. Todos siguen en slicks. ¿Acción?",
            "answers": [
                "Permanecer en pista y reaccionar en el momento justo",
                "Parar ahora por intermedios y anticipar",
                "Parar por duros y evitar dos paradas",
                "Forzar ritmo para adelantar antes de la lluvia"
            ],
            "correctAnswer": "Permanecer en pista y reaccionar en el momento justo",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Radar shows rain in 3 laps. You're P5 on softs. All others still on slicks. Move?",
            "answers": [
                "Stay out and react at right moment",
                "Pit now for inters and anticipate",
                "Pit for hards to avoid double stop",
                "Push to overtake before rain hits"
            ],
            "correctAnswer": "Stay out and react at right moment",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_final_drs_train():
    if LANG == "es":
        return {
            "question": "Tu piloto está P6 en tren DRS detrás de coches con ritmo similar. ¿Cómo progresar?",
            "answers": [
                "Ahorrar energía y atacar con doble DRS",
                "Cambiar estrategia y parar por aire limpio",
                "Reducir ritmo y conservar neumáticos",
                "Forzar adelantamiento en zona lenta"
            ],
            "correctAnswer": "Ahorrar energía y atacar con doble DRS",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "You're P6 in DRS train behind cars with similar pace. Best way to progress?",
            "answers": [
                "Save energy and attack with double DRS",
                "Change strategy and pit for clean air",
                "Slow down to conserve tyres",
                "Force overtake in slow sector"
            ],
            "correctAnswer": "Save energy and attack with double DRS",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_con_riesgo_de_bandera_roja():
    if LANG == "es":
        return {
            "question": "Sector 3 con bandera amarilla prolongada. Hay riesgo de bandera roja. Tu piloto está P2. ¿Estrategia?",
            "answers": [
                "Parar ya para tener gomas nuevas si se detiene",
                "Quedarse fuera y mantener posición",
                "Esperar y ver si se limpia pista",
                "Entrar por intermedios por precaución"
            ],
            "correctAnswer": "Parar ya para tener gomas nuevas si se detiene",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Sector 3 under prolonged yellow. Red flag risk. You're P2. Best option?",
            "answers": [
                "Box now to have fresh tyres if race is stopped",
                "Stay out and keep position",
                "Wait to see if track clears",
                "Pit for inters just in case"
            ],
            "correctAnswer": "Box now to have fresh tyres if race is stopped",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_monedas_spa_dos_paradas():
    if LANG == "es":
        return {
            "question": "Históricamente en Spa, ganar con 2 paradas es habitual. Tu piloto va P1 tras 1 parada. Faltan 17v. ¿Qué haces?",
            "answers": [
                "Parar otra vez y asegurar ritmo final",
                "Ir hasta el final y conservar neumáticos",
                "Esperar un SC para parar",
                "Montar duros y alargar todo"
            ],
            "correctAnswer": "Parar otra vez y asegurar ritmo final",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "At Spa, winning with 2 stops is common. Your driver leads after 1 stop. 17 laps to go. Strategy?",
            "answers": [
                "Pit again to guarantee strong finish",
                "Stay out and manage tyre wear",
                "Wait for a SC to pit",
                "Switch to hards and go long"
            ],
            "correctAnswer": "Pit again to guarantee strong finish",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_monaco_una_parada_ideal():
    if LANG == "es":
        return {
            "question": "En Mónaco, una parada es lo normal. Tu piloto está P4 con medios, rivales con duros. ¿Estrategia?",
            "answers": [
                "Parar pronto e intentar undercut",
                "Alargar stint y esperar SC",
                "Cambiar a duros ahora",
                "Parar por blandos y atacar"
            ],
            "correctAnswer": "Parar pronto e intentar undercut",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "At Monaco, one-stop is typical. Your driver is P4 on mediums, rivals on hards. Strategy?",
            "answers": [
                "Pit early and attempt undercut",
                "Extend stint and wait for SC",
                "Switch to hards now",
                "Pit for softs and attack"
            ],
            "correctAnswer": "Pit early and attempt undercut",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_mexico_altitud_temperatura():
    if LANG == "es":
        return {
            "question": "En México, el desgaste térmico es alto. Tu piloto va P2 con blandos vuelta 22/71. ¿Parar o alargar?",
            "answers": [
                "Parar ya y cambiar a medios",
                "Aguantar hasta vuelta 30 y montar duros",
                "Parar por otro juego de blandos",
                "Esperar a VSC"
            ],
            "correctAnswer": "Aguantar hasta vuelta 30 y montar duros",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "In Mexico, thermal degradation is high. Your driver is P2 on softs lap 22/71. Pit or extend?",
            "answers": [
                "Box now for mediums",
                "Extend to lap 30 and go to hards",
                "Pit for another set of softs",
                "Wait for a VSC"
            ],
            "correctAnswer": "Extend to lap 30 and go to hards",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_silverstone_dos_stints_blando():
    if LANG == "es":
        return {
            "question": "En Silverstone, los blandos rinden bien al inicio. Tu piloto va P3 con medios. ¿Parar pronto o alargar?",
            "answers": [
                "Parar pronto por blandos y atacar",
                "Aguantar para un stint final con blandos",
                "Montar duros y defender",
                "Esperar lluvia en 10 vueltas"
            ],
            "correctAnswer": "Aguantar para un stint final con blandos",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "At Silverstone, softs perform well at end. Your driver P3 on mediums. Early stop or extend?",
            "answers": [
                "Pit early for softs and push",
                "Extend for strong soft final stint",
                "Switch to hards and defend",
                "Wait for rain in 10 laps"
            ],
            "correctAnswer": "Extend for strong soft final stint",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_australia_drs_train():
    if LANG == "es":
        return {
            "question": "Australia tiene trenes de DRS. Tu piloto es P7 sin poder pasar. ¿Estrategia?",
            "answers": [
                "Parar temprano y hacer undercut",
                "Esperar y alargar con neumáticos duros",
                "Parar por medios usados",
                "No parar y defender con ritmo"
            ],
            "correctAnswer": "Parar temprano y hacer undercut",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Australia race has strong DRS trains. Your driver is P7 stuck behind. Strategy?",
            "answers": [
                "Pit early and attempt undercut",
                "Extend with hard tyres",
                "Pit for used mediums",
                "Stay out and defend with pace"
            ],
            "correctAnswer": "Pit early and attempt undercut",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_barcelona_combinacion_compuestos():
    if LANG == "es":
        return {
            "question": "Barcelona suele favorecer estrategias mixtas. Tu piloto está en P6 con medios al inicio. ¿Qué alternativa es mejor?",
            "answers": [
                "Montar duros y hacer una parada",
                "Hacer doble parada con medios y blandos",
                "Parar por otro juego de medios",
                "Esperar SC y montar blandos"
            ],
            "correctAnswer": "Hacer doble parada con medios y blandos",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Barcelona often rewards mixed strategies. You're P6 on mediums at the beginning. Best plan?",
            "answers": [
                "Switch to hards for a one-stop",
                "Two-stop using mediums and softs",
                "Pit for another set of mediums",
                "Wait for SC and fit softs"
            ],
            "correctAnswer": "Two-stop using mediums and softs",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_baku_safety_car_probable():
    if LANG == "es":
        return {
            "question": "Bakú suele tener SC. Estás en P5 vuelta 8/51 con medios. ¿Parar pronto o esperar?",
            "answers": [
                "Esperar SC y parar con menos pérdida",
                "Parar ya y montar duros hasta el final",
                "Parar por blandos y atacar",
                "Mantener ritmo y hacer overcut"
            ],
            "correctAnswer": "Esperar SC y parar con menos pérdida",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Baku usually has SC. You're P5 on lap 8/51 with mediums. Pit now or wait?",
            "answers": [
                "Wait for SC and reduce pit loss",
                "Pit now and switch to hards to the end",
                "Switch to softs and attack",
                "Hold pace and overcut"
            ],
            "correctAnswer": "Wait for SC and reduce pit loss",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_jeddah_neumatico_seguro():
    if LANG == "es":
        return {
            "question": "En Jeddah, la velocidad es alta y hay poco margen. Vas P2 con blandos vuelta 15/50. ¿Cambio ideal?",
            "answers": [
                "Cambiar a duros para una parada segura",
                "Parar por medios y planear otra parada",
                "Alargar y esperar VSC",
                "Volver a blandos al final"
            ],
            "correctAnswer": "Cambiar a duros para una parada segura",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Jeddah is high-speed with limited margin. You're P2 on softs lap 15/50. Ideal switch?",
            "answers": [
                "Switch to hards for a safe one-stop",
                "Pit for mediums and plan two stops",
                "Extend and hope for VSC",
                "Return to softs later"
            ],
            "correctAnswer": "Switch to hards for a safe one-stop",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_singapur_estrategia_reactiva():
    if LANG == "es":
        return {
            "question": "Singapur tiene ritmo lento y SC habitual. Estás P3 con medios vuelta 22/61. Líder para. ¿Reaccionas?",
            "answers": [
                "Sí, parar también y cubrir estrategia",
                "Alargar y esperar un SC",
                "Cambiar a duros ya mismo",
                "Parar por blandos y atacar"
            ],
            "correctAnswer": "Sí, parar también y cubrir estrategia",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Singapore is slow and SC-prone. You're P3 on mediums lap 22/61. Leader pits. Do you react?",
            "answers": [
                "Yes, box to cover strategy",
                "Stay out and hope for SC",
                "Switch to hards now",
                "Fit softs and attack"
            ],
            "correctAnswer": "Yes, box to cover strategy",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_brasil_parada_extra_opcional():
    if LANG == "es":
        return {
            "question": "Interlagos permite parar 2 o 3 veces. Vas P1 con medios de 20v, faltan 22v. P2 para. ¿Qué haces?",
            "answers": [
                "Parar también y cubrir ritmo",
                "Quedarte fuera y conservar neumáticos",
                "Cambiar a duros y llegar al final",
                "Montar blandos si hay VSC"
            ],
            "correctAnswer": "Parar también y cubrir ritmo",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Interlagos allows 2 or 3 stops. You're P1 on 20-lap mediums, 22 laps left. P2 pits. Your move?",
            "answers": [
                "Box too and cover pace",
                "Stay out and preserve tyres",
                "Switch to hards and go to the end",
                "Fit softs if VSC appears"
            ],
            "correctAnswer": "Box too and cover pace",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }



def estrategia_hungria_1997_villeneuve():
    if LANG == "es":
        return {
            "question": "GP Hungría 1997: Villeneuve partía 3º y terminó 1º.  ¿Qué estrategia le permitió a Jacques Villeneuve ganar a pesar de tener un coche más lento?",
            "answers": [
                "Parar tarde y usar neumáticos blandos para adelantar",
                "Hacer una parada menos que Schumacher",
                "Aprovechar el VSC para cambiar a intermedios",
                "Salir con neumáticos duros e ir hasta el final"
            ],
            "correctAnswer": "Parar tarde y usar neumáticos blandos para adelantar",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "1997 Hungarian GP: Villeneuve started 3rd and finished 1st.  What strategy helped Villeneuve win despite having a slower car?",
            "answers": [
                "Stopped late and used softs to overtake",
                "Did one stop less than Schumacher",
                "Used VSC to switch to inters",
                "Started on hards and went to the end"
            ],
            "correctAnswer": "Stopped late and used softs to overtake",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_monaco_1992_mansell_senna():
    if LANG == "es":
        return {
            "question": "GP Mónaco 1992: Senna salía 3º y ganó la carrera defendiendo hasta el final.  ¿Cómo logró Senna mantener detrás a Mansell con neumáticos más nuevos?",
            "answers": [
                "Estrategia defensiva perfecta y uso del trazado estrecho",
                "Parar antes para defender posición",
                "Usar rebufo y ERS en cada vuelta",
                "Cambio a intermedios justo antes del final"
            ],
            "correctAnswer": "Estrategia defensiva perfecta y uso del trazado estrecho",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "1992 Monaco GP: Senna started 3rd and won defending to the end.  How did Senna keep Mansell behind despite fresher tyres?",
            "answers": [
                "Perfect defensive strategy and use of narrow layout",
                "Pitted earlier to hold track position",
                "Used tow and ERS every lap",
                "Switched to inters just before the end"
            ],
            "correctAnswer": "Perfect defensive strategy and use of narrow layout",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_jerez_1997_dos_paradas_sorpresa():
    if LANG == "es":
        return {
            "question": "GP Jerez 1997: Villeneuve salía 1º y terminó 3º, logrando el título.  ¿Qué sorprendió en la estrategia de Villeneuve frente a Schumacher?",
            "answers": [
                "Villeneuve usó una parada adicional para forzar error",
                "Usó neumáticos duros toda la carrera",
                "Schumacher paró innecesariamente y perdió ventaja",
                "Villeneuve no paró en toda la carrera"
            ],
            "correctAnswer": "Villeneuve usó una parada adicional para forzar error",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "1997 Jerez GP: Villeneuve started 1st and finished 3rd, securing the title.  What was surprising in Villeneuve's strategy against Schumacher?",
            "answers": [
                "Villeneuve added a stop to pressure Schumacher into a mistake",
                "He used hard tyres the entire race",
                "Schumacher pitted unnecessarily and lost advantage",
                "Villeneuve didn't pit at all"
            ],
            "correctAnswer": "Villeneuve added a stop to pressure Schumacher into a mistake",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_italia_2009_brawn():
    if LANG == "es":
        return {
            "question": "GP Italia 2009: Barrichello partía 5º y Button 6º. Ganó Brawn GP haciendo doblete.  ¿Qué estrategia permitió al Brawn GP vencer a los coches más rápidos?",
            "answers": [
                "Ir a una sola parada y usar aire limpio",
                "Salir último y aprovechar un SC",
                "Ir a tres paradas agresivas",
                "No cambiar neumáticos en toda la carrera"
            ],
            "correctAnswer": "Ir a una sola parada y usar aire limpio",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2009 Italian GP: Barrichello started 5th and Button 6th .Brawn GP won the race with a 1-2 finish. What strategy helped Brawn GP beat faster cars?",
            "answers": [
                "One-stop strategy and clean air",
                "Started last and used SC",
                "Three aggressive stops",
                "No tyre changes for the whole race"
            ],
            "correctAnswer": "One-stop strategy and clean air",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_brasil_2012_estrategia_caotica():
    if LANG == "es":
        return {
            "question": "GP Brasil 2012: Vettel partía 4º y terminó 6º, asegurando el campeonato.  ¿Cómo sobrevivió Vettel y ganó el título en una carrera tan estratégica?",
            "answers": [
                "Cambió varias veces de neumáticos y se adaptó al caos",
                "Hizo una única parada y resistió",
                "No se detuvo hasta la vuelta final",
                "Solo paró por intermedios tras la bandera roja"
            ],
            "correctAnswer": "Cambió varias veces de neumáticos y se adaptó al caos",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2012 Brazil GP: Vettel started 4th and finished 6th, securing the championship.  How did Vettel survive and win the title in a strategic chaos?",
            "answers": [
                "Multiple tyre changes and adapting to the chaos",
                "One stop and held on",
                "Did not stop until final lap",
                "Only pitted for inters after red flag"
            ],
            "correctAnswer": "Multiple tyre changes and adapting to the chaos",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_china_2010_button():
    if LANG == "es":
        return {
            "question": "GP China 2010: Button partía 5º y ganó la carrera. ¿Qué estrategia lo ayudó a superar a Hamilton y Rosberg?",
            "answers": [
                "Paró en el momento justo antes de la lluvia",
                "Hizo una sola parada sin degradar",
                "Salió con intermedios mientras otros iban con slicks",
                "No paró durante un SC clave"
            ],
            "correctAnswer": "Paró en el momento justo antes de la lluvia",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2010 Chinese GP: Button started 5th and won. What strategy helped him beat Hamilton and Rosberg?",
            "answers": [
                "Stopped just before rain arrived",
                "One-stopped without tyre wear",
                "Started on inters while others used slicks",
                "Didn't stop during crucial SC"
            ],
            "correctAnswer": "Stopped just before rain arrived",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_canada_2011_button():
    if LANG == "es":
        return {
            "question": "GP Canadá 2011: Button salía 7º y ganó tras 6 paradas. ¿Qué factor estratégico fue clave?",
            "answers": [
                "Paró siempre en el momento ideal durante el caos",
                "No paró hasta la vuelta final",
                "Usó intermedios hasta el final",
                "No cambió al neumático obligatorio"
            ],
            "correctAnswer": "Paró siempre en el momento ideal durante el caos de los safety Car",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2011 Canadian GP: Button started 7th and won after 6 stops. What was the key strategy?",
            "answers": [
                "Pitted at the ideal moment during all Safety Car`s chaos",
                "Didn't stop until final lap",
                "Used inters until the end",
                "Avoided mandatory tyre change"
            ],
            "correctAnswer": "Pitted at the ideal moment during all Safety Car`s chaos",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_brasil_2008_hamilton():
    if LANG == "es":
        return {
            "question": "GP Brasil 2008: Hamilton partía 4º y terminó 5º para ser campeón. ¿Qué decisión estratégica fue crucial?",
            "answers": [
                "Paró por intermedios justo antes del cambio de clima",
                "Mantuvo una estrategia conservadora a una parada",
                "No cambió neumáticos bajo lluvia",
                "Hizo undercut a Glock"
            ],
            "correctAnswer": "Paró por intermedios justo antes del cambio de clima",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2008 Brazilian GP: Hamilton started 4th and finished 5th to win the title. What strategy was key?",
            "answers": [
                "Switched to inters just before rain",
                "Stuck to conservative one-stop plan",
                "Didn't change tyres under rain",
                "Undercut Glock"
            ],
            "correctAnswer": "Switched to inters just before rain",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_alemania_2019_verstappen():
    if LANG == "es":
        return {
            "question": "GP Alemania 2019: Verstappen partía 2º y ganó en condiciones mixtas. ¿Qué hizo diferente en su estrategia?",
            "answers": [
                "Cambió 5 veces de neumáticos y eligió bien cada vez",
                "No paró bajo lluvia",
                "Montó blandos desde la salida",
                "Solo paró dos veces y ahorró tiempo"
            ],
            "correctAnswer": "Cambió 5 veces de neumáticos y eligió bien cada vez",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2019 German GP: Verstappen started 2nd and won in mixed conditions. What was key in his strategy?",
            "answers": [
                "Changed tyres 5 times and picked right every time",
                "Didn't pit under rain",
                "Started on softs and stayed",
                "Stopped only twice to save time"
            ],
            "correctAnswer": "Changed tyres 5 times and picked right every time",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }





def estrategia_francia_2004_schumacher():
    if LANG == "es":
        return {
            "question": "GP Francia 2004: Schumacher partía 2º y ganó tras 4 paradas. ¿Por qué fue efectiva esta estrategia?",
            "answers": [
                "Le permitió evitar tráfico y hacer vueltas rápidas constantemente",
                "Aprovechó el VSC para parar sin pérdida",
                "No cambió neumáticos, solo repostó",
                "Engañó a Alonso simulando una estrategia a dos paradas"
            ],
            "correctAnswer": "Le permitió evitar tráfico y hacer vueltas rápidas constantemente",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2004 French GP: Schumacher started 2nd and won with 4 stops. Why was this strategy effective?",
            "answers": [
                "Allowed him to avoid traffic and push constant fast laps",
                "Used VSC to pit without time loss",
                "Didn't change tyres, only refueled",
                "Tricked Alonso simulating two-stop strategy"
            ],
            "correctAnswer": "Allowed him to avoid traffic and push constant fast laps",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_hungria_1998_irvine_schumacher():
    if LANG == "es":
        return {
            "question": "GP Hungría 1998: Schumacher partía 1º y ganó tras estrategia de vuelta rápida constante. ¿Qué orden recibió?",
            "answers": [
                "Hacer 20 vueltas como clasificación tras segunda parada",
                "Reducir ritmo para conservar neumáticos",
                "Hacer una parada menos que los demás",
                "No parar tras el SC"
            ],
            "correctAnswer": "Hacer 20 vueltas de clasificación tras la segunda parada",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "1998 Hungarian GP: Schumacher started 1st and won with relentless pace. What order did he receive?",
            "answers": [
                "Do 20 qualifying laps after second pit stop",
                "Slow down to save tyres",
                "One-stop while rivals did two",
                "Stay out after the SC"
            ],
            "correctAnswer": "Do 20 qualifying laps after second pit stop",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_malasia_2009_bandera_roja():
    if LANG == "es":
        return {
            "question": "GP Malasia 2009: La carrera fue interrumpida. ¿Qué piloto se benefició por parar justo antes de la bandera roja?",
            "answers": [
                "Timo Glock",
                "Jenson Button",
                "Rubens Barrichello",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Jenson Button",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2009 Malaysian GP: The race was red-flagged. Which driver benefitted by pitting just before?",
            "answers": [
                "Timo Glock",
                "Jenson Button",
                "Rubens Barrichello",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Jenson Button",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_monaco_2022_ferrari_error():
    if LANG == "es":
        return {
            "question": "GP Mónaco 2022: ¿Qué error cometió Ferrari en la estrategia de Leclerc que le costó la victoria?",
            "answers": [
                "Lo llamó dos veces seguidas y perdió posición",
                "Montó blandos en lluvia",
                "No paró en el momento correcto",
                "Salió con intermedios en seco"
            ],
            "correctAnswer": "Lo llamó dos veces seguidas y perdió posición",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2022 Monaco GP: What strategy mistake cost Leclerc the win?",
            "answers": [
                "Ferrari double-stacked him and lost track position",
                "Fitted softs in the rain",
                "Didn’t pit at the right time",
                "Started on inters in dry"
            ],
            "correctAnswer": "Ferrari double-stacked him and lost track position",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_alemania_2000_barrichello():
    if LANG == "es":
        return {
            "question": "GP Alemania 2000: Barrichello partía 18º y ganó. ¿Qué decisión fue clave?",
            "answers": [
                "No parar por lluvia al final",
                "Ir a una sola parada con duros",
                "Cambiar a intermedios antes que nadie",
                "Hacer undercut a Schumacher"
            ],
            "correctAnswer": "No parar por lluvia al final",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2000 German GP: Barrichello started 18th and won. What was key?",
            "answers": [
                "Didn’t stop for rain at the end",
                "One-stopped on hard tyres",
                "Switched to inters earlier than rivals",
                "Undercut Schumacher"
            ],
            "correctAnswer": "Didn’t stop for rain at the end",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_brasil_2001_montoya_estrategia_riesgo():
    if LANG == "es":
        return {
            "question": "GP Brasil 2001: Montoya lideraba con estrategia arriesgada. ¿Qué causó su abandono pese al ritmo?",
            "answers": [
                "Fue golpeado por Verstappen tras el SC",
                "Paró muy tarde y perdió el liderato",
                "Montó neumáticos equivocados tras lluvia",
                "Su parada fue muy lenta y cayó al tráfico"
            ],
            "correctAnswer": "Fue golpeado por Verstappen tras el SC",
            "knowledgeLevel": 4,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2001 Brazilian GP: Montoya led on a risky strategy. Why did he retire despite great pace?",
            "answers": [
                "Hit by Verstappen after Safety Car",
                "Pitted too late and lost lead",
                "Fitted wrong tyres after rain",
                "Slow stop dropped him into traffic"
            ],
            "correctAnswer": "Hit by Verstappen after Safety Car",
            "knowledgeLevel": 4,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_suzuka_2005_raikkonen_remontada():
    if LANG == "es":
        return {
            "question": "GP Japón 2005: Räikkönen salía 17º y ganó. ¿Qué combinación estratégica fue clave?",
            "answers": [
                "Parar tarde y empujar con aire limpio",
                "Evitar tráfico y SC con parada temprana",
                "Hacer una sola parada con blandos",
                "Montar intermedios al principio"
            ],
            "correctAnswer": "Parar tarde y empujar con aire limpio",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2005 Japanese GP: Räikkönen started 17th and won. What strategy made it possible?",
            "answers": [
                "Pitted late and pushed in clean air",
                "Early stop to avoid traffic and SC",
                "One-stop with softs",
                "Started on inters"
            ],
            "correctAnswer": "Pitted late and pushed in clean air",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_malasia_2012_alonso_lluvia():
    if LANG == "es":
        return {
            "question": "GP Malasia 2012: Alonso ganó en lluvia saliendo 8º. ¿Cuál fue la clave estratégica?",
            "answers": [
                "Parar en el momento exacto entre intermedios y slicks",
                "No parar tras la bandera roja",
                "Cambiar a duros antes de todos",
                "Hacer una sola parada y aguantar"
            ],
            "correctAnswer": "Parar en el momento exacto entre intermedios y slicks",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2012 Malaysian GP: Alonso won from P8 in wet conditions. What was the key move?",
            "answers": [
                "Stopped at perfect moment between inters and slicks",
                "Didn't stop after red flag",
                "Switched to hards before everyone",
                "One-stopped and held on"
            ],
            "correctAnswer": "Stopped at perfect moment between inters and slicks",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_abu_dhabi_2010_alonso_trafico():
    if LANG == "es":
        return {
            "question": "GP Abu Dabi 2010: ¿Qué error estratégico le costó el título a Alonso?",
            "answers": [
                "Parar para cubrir a Webber y quedar atrapado en tráfico",
                "Montar neumáticos fríos tras SC",
                "No parar bajo SC",
                "Usar blandos desde el inicio"
            ],
            "correctAnswer": "Parar para cubrir a Webber y quedar atrapado en tráfico",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2010 Abu Dhabi GP: What strategic mistake cost Alonso the title?",
            "answers": [
                "Pitted to cover Webber and got stuck in traffic",
                "Fitted cold tyres after SC",
                "Didn’t stop under SC",
                "Started on softs"
            ],
            "correctAnswer": "Pitted to cover Webber and got stuck in traffic",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_italia_2021_mclaren_undercut():
    if LANG == "es":
        return {
            "question": "GP Italia 2021: Ricciardo ganó con McLaren. ¿Qué ayudó estratégicamente frente a Verstappen y Hamilton?",
            "answers": [
                "Undercut efectivo y ritmo tras el SC",
                "No parar durante VSC",
                "Montó intermedios antes que nadie",
                "Hizo una sola parada con blandos"
            ],
            "correctAnswer": "Undercut efectivo y ritmo tras el SC",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2021 Italian GP: Ricciardo won with McLaren. What was key against Verstappen and Hamilton?",
            "answers": [
                "Effective undercut and strong SC restart pace",
                "Didn’t pit during VSC",
                "Switched to inters before rivals",
                "One-stopped with softs"
            ],
            "correctAnswer": "Effective undercut and strong SC restart pace",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_italia_2024_leclerc():
    if LANG == "es":
        return {
            "question": "GP Italia 2024: Leclerc ganó desde la pole mientras McLaren perdió ritmo. ¿Qué decisión estratégica fue clave?",
            "answers": [
                "Paró una sola vez y usó medios-duros con gestión excelente",
                "Montó blandos al final y remontó",
                "No paró bajo SC como el resto",
                "Usó intermedios en pista seca"
            ],
            "correctAnswer": "Paró una sola vez y usó medios-duros con gestión excelente",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2024 Italian GP: Leclerc won from pole as McLaren faded. What was the key strategic move?",
            "answers": [
                "One-stop strategy with excellent medium-hard tyre management",
                "Switched to softs late and overtook",
                "Didn’t pit under SC unlike rivals",
                "Used inters on a dry track"
            ],
            "correctAnswer": "One-stop strategy with excellent medium-hard tyre management",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_monaco_2023_aston_alonso():
    if LANG == "es":
        return {
            "question": "GP Mónaco 2023: ¿Qué error estratégico cometió Aston Martin con Alonso cuando empezó a llover?",
            "answers": [
                "Le pusieron slicks en lugar de intermedios justo antes de que lloviera más fuerte",
                "Lo dejaron fuera una vuelta extra",
                "Montó duros desde la salida sin parar",
                "No cambió a blandos cuando el resto sí"
            ],
            "correctAnswer": "Le pusieron slicks en lugar de intermedios justo antes de que lloviera más fuerte",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2023 Monaco GP: What strategic mistake did Aston Martin make with Alonso when rain arrived?",
            "answers": [
                "They fitted slicks instead of inters just before heavy rain hit",
                "Kept him out one lap too long",
                "Started on hards and never stopped",
                "Didn’t switch to softs when others did"
            ],
            "correctAnswer": "They fitted slicks instead of inters just before heavy rain hit",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_turquia_2021_hamilton():
    if LANG == "es":
        return {
            "question": "GP Turquía 2021: Hamilton salía 11º y terminó 5º. ¿Qué decisión de neumáticos le costó un posible podio?",
            "answers": [
                "Paró tarde por intermedios y perdió ritmo",
                "Montó secos demasiado pronto",
                "No paró en toda la carrera",
                "Hizo una parada extra sin necesidad"
            ],
            "correctAnswer": "Paró tarde por intermedios y perdió ritmo",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2021 Turkish GP: Hamilton started 11th and finished 5th. What tyre decision cost him a podium?",
            "answers": [
                "Pitted late for inters and lost pace",
                "Switched to slicks too early",
                "Did not pit all race",
                "Made an extra unnecessary stop"
            ],
            "correctAnswer": "Pitted late for inters and lost pace",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_espana_2021_hamilton_verstappen():
    if LANG == "es":
        return {
            "question": "GP España 2021: Hamilton batió a Verstappen. ¿Qué estrategia fue decisiva?",
            "answers": [
                "Parar dos veces y alcanzar con blandos más frescos",
                "Hacer una parada y conservar",
                "No parar bajo SC y mantener ritmo",
                "Usar intermedios en seco"
            ],
            "correctAnswer": "Parar dos veces y alcanzar con blandos más frescos",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2021 Spanish GP: Hamilton beat Verstappen. What strategy was key?",
            "answers": [
                "Two-stop strategy to catch him on fresher softs",
                "One-stop and tyre conservation",
                "Didn’t stop under SC and pushed",
                "Used inters on a dry track"
            ],
            "correctAnswer": "Two-stop strategy to catch him on fresher softs",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_hungria_2019_hamilton_verstappen():
    if LANG == "es":
        return {
            "question": "GP Hungría 2019: Hamilton remontó a Verstappen al final. ¿Por qué fue clave su segunda parada?",
            "answers": [
                "Montó medios nuevos y recortó 20s en 20 vueltas",
                "Evitar tráfico fue suficiente",
                "Hizo una única parada con intermedios",
                "Paró por blandos sin perder posición"
            ],
            "correctAnswer": "Montó medios nuevos y recortó 20s en 20 vueltas",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2019 Hungarian GP: Hamilton chased down Verstappen. Why was his second stop crucial?",
            "answers": [
                "Fitted fresh mediums and cut 20s in 20 laps",
                "Avoiding traffic was enough",
                "One-stopped on inters",
                "Pitted for softs without losing position"
            ],
            "correctAnswer": "Fitted fresh mediums and cut 20s in 20 laps",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_francia_2021_hamilton_verstappen():
    if LANG == "es":
        return {
            "question": "GP Francia 2021: Verstappen ganó con doble parada. ¿Qué hizo diferente a Hamilton?",
            "answers": [
                "Paró dos veces y lo adelantó con neumáticos medios nuevos al final",
                "Hizo una parada menos y mantuvo ritmo",
                "Montó blandos en las dos últimas vueltas",
                "Aprovechó un SC tardío para ganar"
            ],
            "correctAnswer": "Paró dos veces y lo adelantó con neumáticos medios nuevos al final",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2021 French GP: Verstappen beat Hamilton with a two-stop. What did he do differently?",
            "answers": [
                "Pitted twice and overtook on fresher mediums at the end",
                "Made one less stop and held pace",
                "Switched to softs in the final laps",
                "Took advantage of a late SC to win"
            ],
            "correctAnswer": "Pitted twice and overtook on fresher mediums at the end",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_australia_2013_raikkonen():
    if LANG == "es":
        return {
            "question": "GP Australia 2013: Räikkönen partía 7º y ganó. ¿Qué estrategia fue clave?",
            "answers": [
                "Solo hizo dos paradas mientras otros hicieron tres",
                "Montó intermedios al final",
                "Salió con duros y atacó desde el inicio",
                "Paró bajo SC y ganó pista"
            ],
            "correctAnswer": "Solo hizo dos paradas mientras otros hicieron tres",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2013 Australian GP: Räikkönen started 7th and won. What strategy was key?",
            "answers": [
                "Only made two stops while others did three",
                "Switched to inters at the end",
                "Started on hards and pushed early",
                "Pitted under SC to gain track"
            ],
            "correctAnswer": "Only made two stops while others did three",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_espana_2013_alonso():
    if LANG == "es":
        return {
            "question": "GP España 2013: Alonso ganó desde la 5ª posición. ¿Por qué fue efectiva su estrategia?",
            "answers": [
                "Hizo 4 paradas para mantener ritmo constante",
                "Fue el único en una parada",
                "Montó intermedios antes del resto",
                "No paró bajo VSC"
            ],
            "correctAnswer": "Hizo 4 paradas para mantener ritmo constante",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2013 Spanish GP: Alonso won from P5. Why was his strategy effective?",
            "answers": [
                "He made 4 stops to keep constant pace",
                "He was the only one on a one-stop",
                "Switched to inters before others",
                "Didn’t stop under VSC"
            ],
            "correctAnswer": "He made 4 stops to keep constant pace",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_suzuka_2011_button():
    if LANG == "es":
        return {
            "question": "GP Japón 2011: Button ganó tras salir 2º. ¿Qué le permitió vencer a Vettel?",
            "answers": [
                "Paradas perfectas y subviraje de Vettel con neumáticos duros",
                "Hizo solo una parada y mantuvo ritmo",
                "SC le dio la posición",
                "Montó intermedios en seco y sorprendió"
            ],
            "correctAnswer": "Paradas perfectas y subviraje de Vettel con neumáticos duros",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2011 Japanese GP: Button won from 2nd. What allowed him to beat Vettel?",
            "answers": [
                "Perfect stops and Vettel struggling with understeer on hards",
                "One-stop with strong pace",
                "SC gave him the position",
                "Used inters in dry and surprised all"
            ],
            "correctAnswer": "Perfect stops and Vettel struggling with understeer on hards",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_australia_2010_button():
    if LANG == "es":
        return {
            "question": "GP Australia 2010: Button ganó parando antes que nadie. ¿Por qué fue efectiva su decisión?",
            "answers": [
                "Fue el primero en cambiar a slicks en pista aún húmeda",
                "No paró en toda la carrera",
                "Montó intermedios al final mientras otros no",
                "Hizo tres paradas con blandos"
            ],
            "correctAnswer": "Fue el primero en cambiar a slicks en pista aún húmeda",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2010 Australian GP: Button won by stopping early. Why was this effective?",
            "answers": [
                "He was first to switch to slicks on a damp track",
                "Didn’t stop the entire race",
                "Fitted inters at the end while others didn’t",
                "Three-stopped on softs"
            ],
            "correctAnswer": "He was first to switch to slicks on a damp track",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_hungria_2006_button():
    if LANG == "es":
        return {
            "question": "GP Hungría 2006: Button salía 14º y ganó. ¿Qué combinación le permitió lograrlo?",
            "answers": [
                "Buena lectura de pista cambiante y uso oportuno de intermedios",
                "No paró tras SC final",
                "Usó neumáticos blandos hasta el final",
                "Solo hizo una parada en lluvia"
            ],
            "correctAnswer": "Buena lectura de pista cambiante y uso oportuno de intermedios",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2006 Hungarian GP: Button won from P14. What helped him succeed?",
            "answers": [
                "Great reading of changing track and perfect inter tyre timing",
                "Didn’t stop after final SC",
                "Used softs to the end",
                "One-stopped in the rain"
            ],
            "correctAnswer": "Great reading of changing track and perfect inter tyre timing",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }



def estrategia_monaco_2015_hamilton():
    if LANG == "es":
        return {
            "question": "GP Mónaco 2015: Hamilton lideraba cómodamente. ¿Qué error estratégico cometió Mercedes?",
            "answers": [
                "Lo hizo parar bajo SC y perdió la posición con Rosberg y Vettel",
                "Montó intermedios cuando la pista estaba seca",
                "Hizo 3 paradas innecesarias",
                "Salió con blandos en lluvia"
            ],
            "correctAnswer": "Lo hizo parar bajo SC y perdió la posición con Rosberg y Vettel",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2015 Monaco GP: Hamilton was leading comfortably. What strategic mistake did Mercedes make?",
            "answers": [
                "They pitted him under SC, losing position to Rosberg and Vettel",
                "They fitted inters on a dry track",
                "He made 3 unnecessary stops",
                "Started on softs in rain"
            ],
            "correctAnswer": "They pitted him under SC, losing position to Rosberg and Vettel",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_hungria_2014_richiardo_alonso_hamilton():
    if LANG == "es":
        return {
            "question": "GP Hungría 2014: ¿Cómo aprovechó Ricciardo la estrategia para ganar a Alonso y Hamilton?",
            "answers": [
                "Hizo 3 paradas y pasó con blandos nuevos al final",
                "Montó duros e hizo una sola parada",
                "Se benefició de un SC para liderar",
                "No paró tras bandera roja"
            ],
            "correctAnswer": "Hizo 3 paradas y pasó con blandos nuevos al final",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2014 Hungarian GP: How did Ricciardo beat Alonso and Hamilton?",
            "answers": [
                "He made 3 stops and overtook on fresh softs at the end",
                "One-stopped on hards",
                "Benefitted from SC to lead",
                "Didn’t stop after red flag"
            ],
            "correctAnswer": "He made 3 stops and overtook on fresh softs at the end",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_australia_2017_vettel():
    if LANG == "es":
        return {
            "question": "GP Australia 2017: Vettel venció a Hamilton. ¿Qué fue clave en su estrategia?",
            "answers": [
                "Permaneció en pista mientras Hamilton quedó atrapado en tráfico tras su parada",
                "Montó intermedios antes",
                "Usó neumáticos duros desde la salida",
                "Paró dos veces mientras Hamilton solo una"
            ],
            "correctAnswer": "Permaneció en pista mientras Hamilton quedó atrapado en tráfico tras su parada",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2017 Australian GP: Vettel beat Hamilton. What was key in his strategy?",
            "answers": [
                "Stayed out while Hamilton got stuck in traffic after his stop",
                "Switched to inters earlier",
                "Started on hards",
                "Two-stopped while Hamilton did one"
            ],
            "correctAnswer": "Stayed out while Hamilton got stuck in traffic after his stop",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_singapur_2023_sainz():
    if LANG == "es":
        return {
            "question": "GP Singapur 2023: ¿Qué hizo Sainz para mantener a Norris y frenar a Mercedes?",
            "answers": [
                "Le dio DRS a Norris a propósito para evitar el ataque de Russell",
                "Hizo una sola parada sin perder posición",
                "Paró tarde por blandos y ganó",
                "Montó intermedios cuando todos iban con slicks"
            ],
            "correctAnswer": "Le dio DRS a Norris a propósito para evitar el ataque de Russell",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2023 Singapore GP: What did Sainz do to keep Norris and hold off Mercedes?",
            "answers": [
                "He gave Norris DRS on purpose to protect against Russell",
                "One-stopped without losing position",
                "Pitted late for softs and won",
                "Switched to inters while others used slicks"
            ],
            "correctAnswer": "He gave Norris DRS on purpose to protect against Russell",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_china_2006_schumacher():
    if LANG == "es":
        return {
            "question": "GP China 2006: ¿Cómo ganó Schumacher a Alonso en condiciones mixtas?",
            "answers": [
                "Paró en el momento justo para montar neumáticos secos cuando la pista mejoró",
                "No paró bajo lluvia y mantuvo posición",
                "Montó intermedios antes que Alonso",
                "Hizo menos paradas que Renault"
            ],
            "correctAnswer": "Paró en el momento justo para montar neumáticos secos cuando la pista mejoró",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2006 Chinese GP: How did Schumacher beat Alonso in mixed conditions?",
            "answers": [
                "Pitted at the right time for dry tyres as the track improved",
                "Stayed out on wets and held position",
                "Switched to inters earlier than Alonso",
                "Made fewer stops than Renault"
            ],
            "correctAnswer": "Pitted at the right time for dry tyres as the track improved",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_australia_2018_vettel():
    if LANG == "es":
        return {
            "question": "GP Australia 2018: Vettel superó a Hamilton sin adelantar en pista. ¿Qué fue clave?",
            "answers": [
                "Paró bajo VSC y salió delante de Hamilton",
                "Hizo una parada menos",
                "Montó blandos y no volvió a parar",
                "Hamilton tuvo una penalización"
            ],
            "correctAnswer": "Paró bajo VSC y salió delante de Hamilton",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2018 Australian GP: Vettel passed Hamilton without on-track overtaking. What was key?",
            "answers": [
                "Pitted under VSC and rejoined ahead of Hamilton",
                "Made one stop fewer",
                "Ran softs to the end",
                "Hamilton got a penalty"
            ],
            "correctAnswer": "Pitted under VSC and rejoined ahead of Hamilton",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_espana_2017_vettel_hamilton():
    if LANG == "es":
        return {
            "question": "GP España 2017: ¿Cómo ganó Hamilton a Vettel con ayuda del SC virtual?",
            "answers": [
                "Paró con mejor timing bajo VSC y tenía neumáticos más frescos",
                "Montó duros desde la salida",
                "Vettel se equivocó de neumáticos",
                "Hizo solo una parada"
            ],
            "correctAnswer": "Paró con mejor timing bajo VSC y tenía neumáticos más frescos",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2017 Spanish GP: How did Hamilton beat Vettel with help from the VSC?",
            "answers": [
                "He pitted with better timing under VSC and had fresher tyres",
                "Started on hards",
                "Vettel chose wrong compound",
                "One-stopped"
            ],
            "correctAnswer": "He pitted with better timing under VSC and had fresher tyres",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_espana_2009_button():
    if LANG == "es":
        return {
            "question": "GP España 2009: ¿Qué cambio de estrategia hizo Brawn GP con Button frente a Barrichello?",
            "answers": [
                "Pasó de 3 a 2 paradas para ganar por ritmo limpio",
                "Montó intermedios al final",
                "Paró bajo SC y ganó pista",
                "Usó solo neumáticos duros"
            ],
            "correctAnswer": "Pasó de 3 a 2 paradas para ganar por ritmo limpio",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2009 Spanish GP: What strategy change helped Button beat Barrichello?",
            "answers": [
                "Switched from 3 to 2 stops and won with clean-air pace",
                "Used inters at the end",
                "Pitted under SC and gained position",
                "Ran only hard tyres"
            ],
            "correctAnswer": "Switched from 3 to 2 stops and won with clean-air pace",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_estoril_1993_prost_senna():
    if LANG == "es":
        return {
            "question": "GP Estoril 1993: ¿Qué hizo Senna para superar a coches más rápidos?",
            "answers": [
                "Hizo una sola parada y mantuvo ritmo en neumáticos desgastados",
                "Montó intermedios al final",
                "Paró dos veces pero con SC",
                "Paró bajo bandera roja"
            ],
            "correctAnswer": "Hizo una sola parada y mantuvo ritmo en neumáticos desgastados",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "1993 Estoril GP: How did Senna beat faster cars?",
            "answers": [
                "One-stopped and held pace on worn tyres",
                "Switched to inters late",
                "Two-stopped but got SC advantage",
                "Pitted under red flag"
            ],
            "correctAnswer": "One-stopped and held pace on worn tyres",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_suzuka_2005_alonso_schumacher():
    if LANG == "es":
        return {
            "question": "GP Japón 2005: ¿Qué momento estratégico permitió a Alonso pasar a Schumacher en plena lucha por el título?",
            "answers": [
                "Entró una vuelta después y aprovechó el neumático caliente para pasar en 130R",
                "Paró antes para undercut",
                "Usó intermedios antes",
                "No paró en toda la carrera"
            ],
            "correctAnswer": "Entró una vuelta después y aprovechó el neumático caliente para pasar en 130R",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "2005 Japanese GP: What strategic moment let Alonso pass Schumacher in a title fight?",
            "answers": [
                "Pitted one lap later and used warmer tyres to pass at 130R",
                "Undercut with early stop",
                "Switched to inters first",
                "Didn’t stop all race"
            ],
            "correctAnswer": "Pitted one lap later and used warmer tyres to pass at 130R",
            "knowledgeLevel": 5,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_undercut_vs_overcut_con_vsc():
    if LANG == "es":
        return {
            "question": "Faltan 18 vueltas. Tu piloto está en P3 a 2.5s de P2. Se activa un VSC. ¿Cuál es la mejor estrategia?",
            "answers": [
                "Parar ya para undercut con menos pérdida de tiempo",
                "Alargar stint y esperar SC",
                "Mantenerse en pista y confiar en ritmo",
                "Cambiar a neumáticos duros al final"
            ],
            "correctAnswer": "Parar ya para undercut con menos pérdida de tiempo",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "18 laps to go. Your driver is P3, 2.5s behind P2. A VSC is deployed. What's the best move?",
            "answers": [
                "Pit now for undercut with reduced time loss",
                "Extend and hope for full SC",
                "Stay out and rely on pace",
                "Switch to hards late in the race"
            ],
            "correctAnswer": "Pit now for undercut with reduced time loss",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_rebote_con_piloto_lider():
    if LANG == "es":
        return {
            "question": "Tu piloto lidera pero informa rebote excesivo. Faltan 12v. P2 está a 3.1s. ¿Qué estrategia seguir?",
            "answers": [
                "Pedirle que conserve y no use pianos para llegar",
                "Parar por neumáticos nuevos",
                "Aumentar ritmo para abrir más margen",
                "Ceder posición y hacer undercut"
            ],
            "correctAnswer": "Pedirle que conserve y no use pianos para llegar",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver leads but reports excessive bouncing. 12 laps left. P2 is 3.1s behind. What do you do?",
            "answers": [
                "Ask him to conserve and avoid kerbs to finish",
                "Pit for fresh tyres",
                "Push to extend gap further",
                "Let P2 by and undercut"
            ],
            "correctAnswer": "Ask him to conserve and avoid kerbs to finish",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_doble_stack_critico():
    if LANG == "es":
        return {
            "question": "SC en pista. Tus dos pilotos están 1º y 2º con 1.6s de diferencia. ¿Decisión óptima?",
            "answers": [
                "Parar ambos en doble stack con riesgo de perder P2",
                "Solo parar al líder",
                "Mantener a ambos fuera",
                "Parar al segundo y sacrificar al líder"
            ],
            "correctAnswer": "Parar ambos en doble stack con riesgo de perder P2",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "SC on track. Your two drivers are 1st and 2nd, 1.6s apart. Optimal decision?",
            "answers": [
                "Double stack both with risk of P2 losing position",
                "Pit only the leader",
                "Keep both out",
                "Pit second driver and sacrifice leader"
            ],
            "correctAnswer": "Double stack both with risk of P2 losing position",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_defensa_final_con_blandos_usados():
    if LANG == "es":
        return {
            "question": "Tu piloto lidera con blandos usados. Faltan 5v y P2 tiene medios nuevos. ¿Cómo defender?",
            "answers": [
                "Conservar batería y usar ERS en recta principal",
                "Parar y atacar con neumáticos frescos",
                "Reducir ritmo para conservar goma",
                "Intentar bloqueo en cada frenada"
            ],
            "correctAnswer": "Conservar batería y usar ERS en recta principal",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver leads on worn softs. 5 laps left, P2 on fresh mediums. How to defend?",
            "answers": [
                "Save battery and deploy ERS on main straight",
                "Pit and counterattack with new tyres",
                "Back off to save tyres",
                "Block in every braking zone"
            ],
            "correctAnswer": "Save battery and deploy ERS on main straight",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_pit_exit_trafico():
    if LANG == "es":
        return {
            "question": "Tu piloto está P6 con aire limpio, pero parar ahora lo reincorpora en tráfico. ¿Qué hacer?",
            "answers": [
                "Esperar dos vueltas para tener pista libre",
                "Parar ya y arriesgar en pista",
                "Cambiar a estrategia de una parada",
                "Esperar SC o VSC"
            ],
            "correctAnswer": "Esperar dos vueltas para tener pista libre",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is P6 in clean air, but pitting now puts him in traffic. What do you do?",
            "answers": [
                "Wait two laps for clear track",
                "Pit now and fight on track",
                "Switch to one-stop strategy",
                "Hope for SC or VSC"
            ],
            "correctAnswer": "Wait two laps for clear track",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_reinicio_final_sin_parada():
    if LANG == "es":
        return {
            "question": "SC a falta de 4 vueltas. Tus rivales paran. Tú lideras con neumáticos usados. ¿Qué haces?",
            "answers": [
                "Quedarte en pista y defender posición en la resalida",
                "Parar también y confiar en ritmo",
                "Montar intermedios por si llueve",
                "Reducir ritmo y conservar neumáticos"
            ],
            "correctAnswer": "Quedarte en pista y defender posición en la resalida",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "SC with 4 laps to go. Rivals pit. You're leading on used tyres. What do you do?",
            "answers": [
                "Stay out and defend track position on restart",
                "Pit as well and rely on pace",
                "Switch to inters in case of rain",
                "Slow down to save tyres"
            ],
            "correctAnswer": "Stay out and defend track position on restart",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_gestion_compuestos_p1_vs_p2():
    if LANG == "es":
        return {
            "question": "P1 tiene medios de 20 vueltas. P2 va con duros nuevos. Faltan 10v. ¿Qué debe hacer P1?",
            "answers": [
                "Cambiar estilo de conducción y defender en tracción",
                "Parar otra vez y recuperar en pista",
                "Dejarse adelantar y conservar DRS",
                "Montar blandos para vueltas rápidas"
            ],
            "correctAnswer": "Cambiar estilo de conducción y defender en tracción",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "P1 is on 20-lap mediums. P2 has fresh hards. 10 laps to go. What should P1 do?",
            "answers": [
                "Change driving style and defend on traction zones",
                "Pit again and try to recover",
                "Let P2 pass and use DRS",
                "Switch to softs for fastest laps"
            ],
            "correctAnswer": "Change driving style and defend on traction zones",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_virtual_safety_timing():
    if LANG == "es":
        return {
            "question": "Tu piloto está en ventana de parada. Se activa VSC. ¿Cuándo parar?",
            "answers": [
                "Justo antes de que termine VSC para minimizar pérdida",
                "Parar inmediatamente",
                "Esperar SC completo",
                "No parar para evitar tráfico"
            ],
            "correctAnswer": "Justo antes de que termine VSC para minimizar pérdida",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is in pit window. VSC is deployed. When should you stop?",
            "answers": [
                "Just before VSC ends to minimize time loss",
                "Immediately pit",
                "Wait for full SC",
                "Don’t pit to avoid traffic"
            ],
            "correctAnswer": "Just before VSC ends to minimize time loss",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_ritmo_vs_trafico():
    if LANG == "es":
        return {
            "question": "Tu piloto tiene neumáticos más frescos pero está en tráfico. ¿Cuál es la mejor decisión táctica?",
            "answers": [
                "Conservar batería y atacar cuando haya aire limpio",
                "Atacar inmediatamente en zona sucia",
                "Parar otra vez por neumáticos nuevos",
                "Cambiar a compuestos duros"
            ],
            "correctAnswer": "Conservar batería y atacar cuando haya aire limpio",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver has fresher tyres but is in traffic. Best tactical call?",
            "answers": [
                "Save battery and attack when clean air opens",
                "Attack immediately in dirty air",
                "Pit again for new tyres",
                "Switch to hards"
            ],
            "correctAnswer": "Save battery and attack when clean air opens",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_sorpresa_cambio_estrategia():
    if LANG == "es":
        return {
            "question": "Tu estrategia era a una parada, pero el ritmo de tus rivales aumenta. ¿Qué opción te permite responder mejor?",
            "answers": [
                "Cambiar a dos paradas antes que ellos y atacar",
                "Esperar a SC y mantener estrategia",
                "Parar muy tarde y conservar neumáticos",
                "Montar intermedios por si llueve"
            ],
            "correctAnswer": "Cambiar a dos paradas antes que ellos y atacar",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your plan was a one-stop but rivals increase pace. Best adjustment?",
            "answers": [
                "Switch to two-stop before they do and push",
                "Wait for SC and stay on strategy",
                "Pit late and conserve tyres",
                "Fit inters in case it rains"
            ],
            "correctAnswer": "Switch to two-stop before they do and push",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_lluvia_inminente():
    if LANG == "es":
        return {
            "question": "El radar muestra lluvia en 5 minutos. Tu piloto está en P3. ¿Cuál es la mejor estrategia?",
            "answers": [
                "Esperar y no parar todavía para evitar una parada extra",
                "Parar ya por intermedios",
                "Montar neumáticos duros para preparar el cambio posterior",
                "Cambiar a blandos para ganar posiciones rápidamente"
            ],
            "correctAnswer": "Esperar y no parar todavía para evitar una parada extra",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Radar shows rain in 5 minutes. Your driver is P3. Best strategy?",
            "answers": [
                "Stay out and delay pitting to avoid extra stop",
                "Pit now for intermediates",
                "Switch to hards to prepare for later stop",
                "Fit softs to attack now"
            ],
            "correctAnswer": "Stay out and delay pitting to avoid extra stop",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_pista_mojada_seca():
    if LANG == "es":
        return {
            "question": "La pista está húmeda pero se está secando. Tu piloto está con intermedios. ¿Qué opción da mejor resultado?",
            "answers": [
                "Cambiar a slicks justo cuando el sector 2 se seca",
                "Mantener intermedios hasta el final",
                "Volver a parar por intermedios nuevos",
                "Parar por neumáticos duros"
            ],
            "correctAnswer": "Cambiar a slicks justo cuando el sector 2 se seca",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Track is damp but drying. Your driver is on inters. What’s the optimal choice?",
            "answers": [
                "Switch to slicks when sector 2 dries",
                "Stay on inters to the end",
                "Pit again for fresh inters",
                "Switch to hards"
            ],
            "correctAnswer": "Switch to slicks when sector 2 dries",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_gotas_aisladas():
    if LANG == "es":
        return {
            "question": "Empiezan a caer gotas pero solo en el sector 3. Tu piloto va P1. ¿Qué decisión tomas?",
            "answers": [
                "Seguir en pista con slicks y monitorear sector 3",
                "Parar por intermedios preventivamente",
                "Pedir que entre por blandos nuevos",
                "Reducir ritmo en ese sector y conservar neumáticos"
            ],
            "correctAnswer": "Seguir en pista con slicks y monitorear sector 3",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Raindrops start falling in sector 3 only. Your driver is P1. What’s the call?",
            "answers": [
                "Stay out on slicks and monitor sector 3",
                "Pit early for inters just in case",
                "Box for new softs",
                "Slow down in that sector and conserve tyres"
            ],
            "correctAnswer": "Stay out on slicks and monitor sector 3",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_parada_seca_a_mojada():
    if LANG == "es":
        return {
            "question": "La pista pasa de seca a mojada en 2 vueltas. Tu piloto acaba de parar por slicks. ¿Qué hacer?",
            "answers": [
                "Hacer una parada extra por intermedios en cuanto empiece a llover",
                "Mantener los slicks esperando SC",
                "Montar blandos para una vuelta rápida",
                "No parar y rodar lento"
            ],
            "correctAnswer": "Hacer una parada extra por intermedios en cuanto empiece a llover",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Track changing from dry to wet in 2 laps. Driver just fitted slicks. What now?",
            "answers": [
                "Add another stop for inters as soon as rain starts",
                "Stay on slicks and hope for SC",
                "Fit softs for a fast lap",
                "Don’t pit and drive slow"
            ],
            "correctAnswer": "Add another stop for inters as soon as rain starts",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_parada_correcta_intermedios():
    if LANG == "es":
        return {
            "question": "Lluvia ligera constante. La mayoría monta intermedios. ¿Cuál es la clave para maximizar rendimiento?",
            "answers": [
                "Entrar justo cuando los sectores empiezan a perder tiempo",
                "Esperar dos vueltas más y conservar posición",
                "Poner neumáticos duros",
                "Montar intermedios nuevos con carga de combustible alta"
            ],
            "correctAnswer": "Entrar justo cuando los sectores empiezan a perder tiempo",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Light constant rain. Most teams go for inters. What’s key to optimize performance?",
            "answers": [
                "Pit right when sectors start losing time",
                "Wait two more laps and hold position",
                "Fit hard tyres",
                "Use new inters with heavy fuel"
            ],
            "correctAnswer": "Pit right when sectors start losing time",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_intensidad_variable_de_lluvia():
    if LANG == "es":
        return {
            "question": "La lluvia varía de vuelta a vuelta. Tu piloto está con intermedios. ¿Qué estrategia aplicar?",
            "answers": [
                "Evaluar cada sector y mantenerse fuera hasta que la pista cambie claramente",
                "Cambiar a neumáticos de lluvia completa inmediatamente",
                "Parar por slicks",
                "Reducir el ritmo a propósito y conservar neumáticos"
            ],
            "correctAnswer": "Evaluar cada sector y mantenerse fuera hasta que la pista cambie claramente",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Rain varies lap to lap. Your driver is on inters. What’s the strategy?",
            "answers": [
                "Assess each sector and stay out until clear change",
                "Switch to full wets immediately",
                "Pit for slicks",
                "Slow down intentionally to preserve tyres"
            ],
            "correctAnswer": "Assess each sector and stay out until clear change",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_rivales_con_neumaticos_distintos():
    if LANG == "es":
        return {
            "question": "Tu piloto está con intermedios. Los rivales dividen estrategia entre slicks e intermedios. ¿Qué hacer?",
            "answers": [
                "Permanecer en pista y observar tiempos por vuelta",
                "Cambiar a slicks ya mismo",
                "Parar por intermedios nuevos",
                "Esperar y luego montar neumáticos duros"
            ],
            "correctAnswer": "Permanecer en pista y observar tiempos por vuelta",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is on inters. Rivals split between slicks and inters. What now?",
            "answers": [
                "Stay out and monitor lap times",
                "Switch to slicks immediately",
                "Pit for new inters",
                "Wait and switch to hards"
            ],
            "correctAnswer": "Stay out and monitor lap times",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_full_wet_vs_inters():
    if LANG == "es":
        return {
            "question": "Tu piloto está con neumáticos de lluvia extrema, pero la pista se seca. ¿Qué decisión tomar?",
            "answers": [
                "Cambiar a intermedios cuanto antes",
                "Mantener los full wet hasta el final",
                "Montar neumáticos duros directamente",
                "Esperar que la lluvia vuelva"
            ],
            "correctAnswer": "Cambiar a intermedios cuanto antes",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is on full wets, but track is drying. What’s the right call?",
            "answers": [
                "Switch to inters as soon as possible",
                "Stay on full wets to the end",
                "Go directly to hards",
                "Wait for rain to return"
            ],
            "correctAnswer": "Switch to inters as soon as possible",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_piloto_rezago_lluvia():
    if LANG == "es":
        return {
            "question": "Tu piloto va último, llega lluvia intensa. ¿Qué estrategia puede darle ventaja?",
            "answers": [
                "Parar antes que nadie por intermedios o lluvia completa",
                "Esperar SC y conservar neumáticos",
                "Mantener slicks esperando una bandera roja",
                "Montar duros y alargar el stint"
            ],
            "correctAnswer": "Parar antes que nadie por intermedios o lluvia completa",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is last and heavy rain is coming. What can give him advantage?",
            "answers": [
                "Pit before anyone for inters or wets",
                "Wait for SC and conserve tyres",
                "Stay on slicks hoping for red flag",
                "Fit hards and extend stint"
            ],
            "correctAnswer": "Pit before anyone for inters or wets",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_secado_sectores_diferenciales():
    if LANG == "es":
        return {
            "question": "La pista está seca en sector 1 y mojada en sector 3. ¿Qué variable es más importante para tomar decisión?",
            "answers": [
                "El nivel de agarre promedio y la tracción en la curva de salida",
                "El número de vueltas restantes",
                "La posición del SC en pista",
                "El compuesto rival más cercano"
            ],
            "correctAnswer": "El nivel de agarre promedio y la tracción en la curva de salida",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Track is dry in S1, wet in S3. What matters most for tyre decision?",
            "answers": [
                "Average grip and traction out of last corner",
                "Laps remaining",
                "SC position",
                "Closest rival’s compound"
            ],
            "correctAnswer": "Average grip and traction out of last corner",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_resalida_lluvia_con_slicks():
    if LANG == "es":
        return {
            "question": "Tras bandera roja por lluvia, la resalida es en pista húmeda sin lluvia activa. ¿Qué compuesto usar?",
            "answers": [
                "Slicks si hay carril seco en al menos dos sectores",
                "Intermedios obligatoriamente",
                "Lluvia extrema por seguridad",
                "Blandos nuevos por temperatura"
            ],
            "correctAnswer": "Intermedios obligatoriamente",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "After red flag due to rain, restart is on damp track without active rain. Which tyre?",
            "answers": [
                "Slicks if two sectors have a dry line",
                "Mandatory intermediates",
                "Full wets for safety",
                "New softs for temperature"
            ],
            "correctAnswer": "Mandatory intermediates",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_rivales_pierden_tiempo_bajo_lluvia():
    if LANG == "es":
        return {
            "question": "Tu piloto va en intermedios y los rivales con slicks están perdiendo tiempo. ¿Cuándo atacar?",
            "answers": [
                "Aprovechar el momento sin esperar parada rival",
                "Esperar a que ellos entren en boxes",
                "Conservar neumáticos por si continúa la lluvia",
                "Reducir ritmo y evitar errores"
            ],
            "correctAnswer": "Aprovechar el momento sin esperar parada rival",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is on inters, rivals on slicks are losing time. When to attack?",
            "answers": [
                "Capitalize immediately without waiting for their stop",
                "Wait until they box",
                "Save tyres in case rain intensifies",
                "Slow down and avoid risks"
            ],
            "correctAnswer": "Capitalize immediately without waiting for their stop",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_drs_habilitado_en_pista_humeda():
    if LANG == "es":
        return {
            "question": "La pista aún está húmeda pero se habilita el DRS. ¿Cómo afecta la estrategia ofensiva?",
            "answers": [
                "Puede favorecer adelantamientos si ya hay carril seco",
                "Es irrelevante en condiciones mixtas",
                "Debe usarse solo en recta principal",
                "No afecta si llevas neumáticos de lluvia"
            ],
            "correctAnswer": "Puede favorecer adelantamientos si ya hay carril seco",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Track still damp, but DRS is enabled. How does this impact attack strategy?",
            "answers": [
                "It can help overtakes if dry line exists",
                "Irrelevant in mixed conditions",
                "Use only on main straight",
                "No effect with wet tyres"
            ],
            "correctAnswer": "It can help overtakes if dry line exists",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_seguridad_lluvia_sector_1():
    if LANG == "es":
        return {
            "question": "Sector 1 está muy mojado, resto seco. ¿Qué influye más en la elección de neumáticos?",
            "answers": [
                "El sector con menor adherencia para evitar errores",
                "El promedio de todos los sectores",
                "La cantidad de curvas rápidas",
                "La distancia total de rectas"
            ],
            "correctAnswer": "El sector con menor adherencia para evitar errores",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Sector 1 is very wet, others are dry. What matters most in tyre choice?",
            "answers": [
                "The lowest-grip sector to avoid mistakes",
                "Average condition across all sectors",
                "Amount of fast corners",
                "Total straight-line distance"
            ],
            "correctAnswer": "The lowest-grip sector to avoid mistakes",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_inters_gastados_versus_secos_nuevos():
    if LANG == "es":
        return {
            "question": "Tu piloto lleva intermedios gastados. La pista empieza a secarse. ¿Cuándo cambiar a slicks?",
            "answers": [
                "Cuando los intermedios pierdan más de 1s por vuelta",
                "Esperar a que el rival más cercano lo haga",
                "Solo tras una bandera amarilla",
                "Parar inmediatamente sin revisar sectores"
            ],
            "correctAnswer": "Cuando los intermedios pierdan más de 1s por vuelta",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is on worn inters. Track drying. When to switch to slicks?",
            "answers": [
                "When inters lose over 1s per lap",
                "After nearest rival pits",
                "Only after yellow flag",
                "Immediately without checking sectors"
            ],
            "correctAnswer": "When inters lose over 1s per lap",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


def estrategia_pit_lane_resbaladizo():
    if LANG == "es":
        return {
            "question": "La entrada al pit lane está muy mojada y peligrosa. ¿Cómo afecta la decisión de parada?",
            "answers": [
                "Retrasar la parada hasta que la zona mejore o aparezca SC",
                "Mantener la estrategia original sin importar la entrada",
                "Obligar al piloto a entrar igualmente",
                "Cambiar a duros por seguridad"
            ],
            "correctAnswer": "Retrasar la parada hasta que la zona mejore o aparezca SC",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "The pit lane entry is very wet and slippery. How does it affect stop decision?",
            "answers": [
                "Delay the stop until entry improves or SC appears",
                "Stick to original strategy regardless",
                "Force driver to box anyway",
                "Switch to hards for safety"
            ],
            "correctAnswer": "Delay the stop until entry improves or SC appears",
            "knowledgeLevel": 3,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_adelantar_con_linea_seca_incompleta():
    if LANG == "es":
        return {
            "question": "Hay carril seco parcial solo en línea interior. Tu piloto está detrás. ¿Cuál es la mejor táctica?",
            "answers": [
                "Adelantar solo en zonas con buena tracción y visibilidad",
                "Atacar en curvas cerradas donde no hay carril seco",
                "Esperar a SC",
                "Montar intermedios nuevos"
            ],
            "correctAnswer": "Adelantar solo en zonas con buena tracción y visibilidad",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Partial dry line exists only on the inside. Your driver is behind. Best tactic?",
            "answers": [
                "Overtake only where grip and visibility are solid",
                "Attack in tight corners regardless",
                "Wait for SC",
                "Pit for new inters"
            ],
            "correctAnswer": "Overtake only where grip and visibility are solid",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_tiempo_de_reaccion_a_lluvia():
    if LANG == "es":
        return {
            "question": "Empieza a llover en la recta. ¿Qué piloto tiene ventaja inicial?",
            "answers": [
                "El que tiene la mejor temperatura de neumáticos en ese momento",
                "El que ya lleva intermedios",
                "El que más combustible tiene",
                "El que está en aire limpio"
            ],
            "correctAnswer": "El que tiene la mejor temperatura de neumáticos en ese momento",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Rain starts on the main straight. Which driver has the initial advantage?",
            "answers": [
                "The one with best tyre temperature at that moment",
                "The one already on inters",
                "The one with more fuel",
                "The one in clean air"
            ],
            "correctAnswer": "The one with best tyre temperature at that moment",
            "knowledgeLevel": 1,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_neumaticos_slicks_en_pista_irregular():
    if LANG == "es":
        return {
            "question": "Tu piloto va con slicks, pero hay charcos dispersos. ¿Cómo gestionar la vuelta?",
            "answers": [
                "Seguir línea seca estrictamente y evitar zonas mojadas",
                "Conducir agresivamente para calentar neumáticos",
                "Cambiar a intermedios de inmediato",
                "Tomar curvas por exterior más mojado"
            ],
            "correctAnswer": "Seguir línea seca estrictamente y evitar zonas mojadas",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Your driver is on slicks, but puddles appear randomly. How to manage the lap?",
            "answers": [
                "Stick to dry line strictly and avoid wet patches",
                "Drive aggressively to warm tyres",
                "Switch to inters immediately",
                "Take corners on wetter outside"
            ],
            "correctAnswer": "Stick to dry line strictly and avoid wet patches",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }

def estrategia_ventana_parada_con_lluvia_impredecible():
    if LANG == "es":
        return {
            "question": "La ventana ideal de parada coincide con lluvia inestable. ¿Qué deberías priorizar?",
            "answers": [
                "Evitar una parada extra y aguantar hasta lluvia estable",
                "Hacer la parada planificada pase lo que pase",
                "Cambiar ya mismo a neumáticos duros",
                "Montar blandos esperando bandera roja"
            ],
            "correctAnswer": "Evitar una parada extra y aguantar hasta lluvia estable",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Pit window overlaps with unstable rain. What should you prioritize?",
            "answers": [
                "Avoid extra stop and hold until consistent rain",
                "Stick to planned stop no matter what",
                "Switch to hards now",
                "Fit softs hoping for red flag"
            ],
            "correctAnswer": "Avoid extra stop and hold until consistent rain",
            "knowledgeLevel": 2,
            "category": "RaceStrategy",
            "language": LANG
        }


generadores_por_categoria = {
    "RaceStrategy": [
        pregunta_numero_paradas_ganador_gp,
        pregunta_estrategia_una_parada,
        pregunta_piloto_gano_con_safety_car,
        pregunta_compuestos_utilizados_ganador,
        pregunta_quien_entra_primero_boxes,
        simulacion_lluvia_inminente,
        simulacion_safety_car_final,
        simulacion_doble_parada_con_distancias,
        simulacion_riesgo_slicks_con_gap,
        simulacion_sacrificio_equipo_con_tiempos,
        estrategia_undercut_defensivo,
        estrategia_aguantar_neumaticos,
        estrategia_vsc_repentino,
        estrategia_safety_y_doble_parada,
        estrategia_retrasar_undercut,
        estrategia_gestion_doble_stint,
        estrategia_doble_stack_apretado,
        estrategia_compuesto_equivocado,
        estrategia_sin_neumaticos_ideales,
        estrategia_defensa_final,
        estrategia_bajo_lluvia_ligera,
        estrategia_pit_stop_lento,
        estrategia_error_delantero,
        estrategia_con_rival_bloqueando,
        estrategia_final_con_ventaja,
        estrategia_sin_DRS_con_rebufo,
        estrategia_reincorporacion_congestion,
        estrategia_bluff_equipo,
        estrategia_bajo_safety_cars_consecutivos,
        estrategia_final_carrera_apretada,
        estrategia_reinicio_despues_safety_car,
        estrategia_al_final_de_sprint,
        estrategia_sin_parar_con_safety_car,
        estrategia_pierde_drs_en_tren,
        estrategia_sancion_5s_posible,
        estrategia_bajo_virtual_y_gap_optimo,
        estrategia_cambio_meteorologico_repaso,
        estrategia_final_drs_train,
        estrategia_con_riesgo_de_bandera_roja,
        estrategia_monedas_spa_dos_paradas,
        estrategia_monaco_una_parada_ideal,
        estrategia_mexico_altitud_temperatura,
        estrategia_silverstone_dos_stints_blando,
        estrategia_australia_drs_train,
        estrategia_barcelona_combinacion_compuestos,
        estrategia_baku_safety_car_probable,
        estrategia_jeddah_neumatico_seguro,
        estrategia_singapur_estrategia_reactiva,
        estrategia_brasil_parada_extra_opcional,
        estrategia_hungria_1997_villeneuve,
        estrategia_monaco_1992_mansell_senna,
        estrategia_jerez_1997_dos_paradas_sorpresa,
        estrategia_italia_2009_brawn,
        estrategia_brasil_2012_estrategia_caotica,
        estrategia_china_2010_button,
        estrategia_canada_2011_button,
        estrategia_brasil_2008_hamilton,
        estrategia_alemania_2019_verstappen,
        estrategia_francia_2004_schumacher,
        estrategia_hungria_1998_irvine_schumacher,
        estrategia_malasia_2009_bandera_roja,
        estrategia_monaco_2022_ferrari_error,
        estrategia_alemania_2000_barrichello,
        estrategia_brasil_2001_montoya_estrategia_riesgo,
        estrategia_suzuka_2005_raikkonen_remontada,
        estrategia_malasia_2012_alonso_lluvia,
        estrategia_abu_dhabi_2010_alonso_trafico,
        estrategia_italia_2021_mclaren_undercut,
        estrategia_italia_2024_leclerc,
        estrategia_monaco_2023_aston_alonso,
        estrategia_turquia_2021_hamilton,
        estrategia_espana_2021_hamilton_verstappen,
        estrategia_hungria_2019_hamilton_verstappen,
        estrategia_francia_2021_hamilton_verstappen,
        estrategia_australia_2013_raikkonen,
        estrategia_espana_2013_alonso,
        estrategia_suzuka_2011_button,
        estrategia_australia_2010_button,
        estrategia_hungria_2006_button,
        estrategia_monaco_2015_hamilton,
        estrategia_hungria_2014_richiardo_alonso_hamilton,
        estrategia_australia_2017_vettel,
        estrategia_singapur_2023_sainz,
        estrategia_china_2006_schumacher,
        estrategia_australia_2018_vettel,
        estrategia_espana_2017_vettel_hamilton,
        estrategia_espana_2009_button,
        estrategia_estoril_1993_prost_senna,
        estrategia_suzuka_2005_alonso_schumacher,
        estrategia_undercut_vs_overcut_con_vsc,
        estrategia_rebote_con_piloto_lider,
        estrategia_doble_stack_critico,
        estrategia_defensa_final_con_blandos_usados,
        estrategia_pit_exit_trafico,
        estrategia_reinicio_final_sin_parada,
        estrategia_gestion_compuestos_p1_vs_p2,
        estrategia_virtual_safety_timing,
        estrategia_ritmo_vs_trafico,
        estrategia_sorpresa_cambio_estrategia,
        estrategia_lluvia_inminente,
        estrategia_pista_mojada_seca,
        estrategia_gotas_aisladas,
        estrategia_parada_seca_a_mojada,
        estrategia_parada_correcta_intermedios,
        estrategia_intensidad_variable_de_lluvia,
        estrategia_rivales_con_neumaticos_distintos,
        estrategia_full_wet_vs_inters,
        estrategia_piloto_rezago_lluvia,
        estrategia_secado_sectores_diferenciales,
        estrategia_resalida_lluvia_con_slicks,
        estrategia_rivales_pierden_tiempo_bajo_lluvia,
        estrategia_drs_habilitado_en_pista_humeda,
        estrategia_seguridad_lluvia_sector_1,
        estrategia_inters_gastados_versus_secos_nuevos,
        estrategia_pit_lane_resbaladizo,
        estrategia_adelantar_con_linea_seca_incompleta,
        estrategia_tiempo_de_reaccion_a_lluvia,
        estrategia_neumaticos_slicks_en_pista_irregular,
        estrategia_ventana_parada_con_lluvia_impredecible

    ]
}


# Función auxiliar para barajar respuestas y mantener la correcta
def barajar_respuestas(pregunta):
    if not pregunta or "answers" not in pregunta or "correctAnswer" not in pregunta:
        return pregunta

    respuestas = pregunta["answers"]
    correcta = pregunta["correctAnswer"]

    if correcta not in respuestas:
        return pregunta

    random.shuffle(respuestas)
    pregunta["answers"] = respuestas
    return pregunta

def generar_preguntas_filtradas(categoria):
    preguntas = []

    if not categoria:
        return preguntas

    # Buscar la categoría sin importar mayúsculas/minúsculas
    categoria_real = next((k for k in generadores_por_categoria if k.lower() == categoria.lower()), None)

    if categoria_real:
        generadores = generadores_por_categoria[categoria_real]
        generadores_seleccionados = random.sample(generadores, 5)
        for gen in generadores_seleccionados:
            p = gen()
            if p:
                p = barajar_respuestas(p)
                preguntas.append(p)
    return preguntas

def generar_preguntas_estrategia_desde_main(lang='es', category=None):
    global LANG
    LANG = lang
    categoria = category.lower() if category else None
    return generar_preguntas_filtradas(categoria=categoria) if categoria else generar_preguntas_reglamento()


if __name__ == "__main__":
    global LANG  # ✅ Esto hace que se modifique la variable global y no una local
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, help="Filtrar por categoría (opcional)", default=None)
    parser.add_argument('--lang', type=str, default='es')
    args = parser.parse_args()
    LANG = args.lang  # Ahora sí modifica la global

    categoria_normalizada = args.category.lower() if args.category else None
    preguntas = generar_preguntas_filtradas(categoria=categoria_normalizada) \
        if categoria_normalizada else generar_preguntas_reglamento()

    if not preguntas:
        print(f"[ERROR] No se encontraron preguntas para la categoría: {args.category}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(preguntas, ensure_ascii=False, indent=2))
