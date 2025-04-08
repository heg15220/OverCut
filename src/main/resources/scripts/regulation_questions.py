
import random
import json
import sys
import argparse




def pregunta_puntos_sprint():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos obtiene el piloto que gana una carrera sprint?",
            "answers": ["8", "10", "6", "5"],
            "correctAnswer": "8",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does the driver who wins a sprint race receive?",
            "answers": ["8", "10", "6", "5"],
            "correctAnswer": "8",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }
def pregunta_penalizacion_componentes():
    if LANG == "es":
        return {
            "question": "¿Qué penalización recibe un piloto si excede el número permitido de componentes de la unidad de potencia?",
            "answers": [
                "Pérdida de posiciones en la parrilla",
                "Descalificación de la carrera",
                "Penalización de tiempo durante la carrera",
                "No puede participar en la clasificación"
            ],
            "correctAnswer": "Pérdida de posiciones en la parrilla",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty does a driver receive if they exceed the allowed number of power unit components?",
            "answers": [
                "Grid place penalty",
                "Disqualification from the race",
                "Time penalty during the race",
                "Cannot participate in qualifying"
            ],
            "correctAnswer": "Grid place penalty",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
def pregunta_bandera_roja():
    if LANG == "es":
        return {
            "question": "En caso de suspensión de la carrera por bandera roja, ¿qué sucede con los coches?",
            "answers": [
                "Deben dirigirse al pit lane y detenerse en el orden de carrera",
                "Regresan a boxes pero no pueden cambiar neumáticos sin restricción",
                "Continúan circulando detrás del coche de seguridad",
                "Se detienen en la línea de salida en el orden original de la parrilla"
            ],
            "correctAnswer": "Deben dirigirse al pit lane y detenerse en el orden de carrera",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "In case the race is suspended due to a red flag, what happens to the cars?",
            "answers": [
                "They must go to the pit lane and stop in race order",
                "They return to the garage but cannot change tyres freely",
                "They continue circulating behind the safety car",
                "They stop on the starting grid in the original order"
            ],
            "correctAnswer": "They must go to the pit lane and stop in race order",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
def pregunta_modificaciones_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Qué modificaciones están permitidas durante el estado de parque cerrado?",
            "answers": [
                "Solo reparaciones autorizadas por los comisarios",
                "Cualquier ajuste aerodinámico",
                "Cambio libre de suspensión",
                "Sustitución de motor sin sanción"
            ],
            "correctAnswer": "Solo reparaciones autorizadas por los comisarios",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What modifications are allowed during parc fermé conditions?",
            "answers": [
                "Only repairs authorized by the stewards",
                "Any aerodynamic adjustment",
                "Free suspension changes",
                "Engine replacement without penalty"
            ],
            "correctAnswer": "Only repairs authorized by the stewards",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
def pregunta_vuelta_formacion():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer un piloto si no arranca al final de la vuelta de formación?",
            "answers": [
                "Iniciar la carrera desde el pit lane",
                "Esperar en su posición hasta que lo remolquen",
                "Reintegrarse desde la posición original",
                "Realizar otra vuelta de formación"
            ],
            "correctAnswer": "Iniciar la carrera desde el pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a driver do if they fail to start at the end of the formation lap?",
            "answers": [
                "Start the race from the pit lane",
                "Wait in position until being towed",
                "Rejoin from their original position",
                "Do another formation lap"
            ],
            "correctAnswer": "Start the race from the pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
def pregunta_velocidad_pitlane():
    if LANG == "es":
        return {
            "question": "¿Qué sanción se impone si se supera el límite de velocidad en el pit lane durante la carrera?",
            "answers": [
                "Multa económica o penalización en tiempo",
                "Descalificación inmediata",
                "Reinicio desde el pit en la siguiente vuelta",
                "Advertencia sin consecuencias"
            ],
            "correctAnswer": "Multa económica o penalización en tiempo",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty is applied if the speed limit is exceeded in the pit lane during the race?",
            "answers": [
                "Financial fine or time penalty",
                "Immediate disqualification",
                "Restart from the pit lane on the next lap",
                "Warning without consequences"
            ],
            "correctAnswer": "Financial fine or time penalty",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
def pregunta_neumaticos_disponibles():
    if LANG == "es":
        return {
            "question": "¿Cuántos juegos de neumáticos puede usar un piloto durante un fin de semana completo?",
            "answers": [
                "13 juegos",
                "8 juegos",
                "20 juegos",
                "10 juegos"
            ],
            "correctAnswer": "13 juegos",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many sets of tyres can a driver use during a full race weekend?",
            "answers": [
                "13 sets",
                "8 sets",
                "20 sets",
                "10 sets"
            ],
            "correctAnswer": "13 sets",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
def pregunta_safety_car():
    if LANG == "es":
        return {
            "question": "¿Cuándo puede un coche adelantar al Safety Car según el reglamento?",
            "answers": [
                "Solo cuando el Safety Car ha apagado sus luces y se dirige al pit lane",
                "En cualquier momento si va más rápido",
                "Durante bandera roja",
                "Nunca está permitido"
            ],
            "correctAnswer": "Solo cuando el Safety Car ha apagado sus luces y se dirige al pit lane",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is a car allowed to overtake the Safety Car according to the regulations?",
            "answers": [
                "Only when the Safety Car has turned off its lights and is heading to the pit lane",
                "At any time if it is faster",
                "During a red flag",
                "It is never allowed"
            ],
            "correctAnswer": "Only when the Safety Car has turned off its lights and is heading to the pit lane",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
def pregunta_sesiones_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Cuántas sesiones componen la clasificación normal del sábado en Fórmula 1?",
            "answers": ["3", "2", "4", "1"],
            "correctAnswer": "3",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many sessions are there in a standard Saturday qualifying in Formula 1?",
            "answers": ["3", "2", "4", "1"],
            "correctAnswer": "3",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
def pregunta_orden_salida_sprint():
    if LANG == "es":
        return {
            "question": "¿Qué define el orden de salida de la carrera sprint según el reglamento 2025?",
            "answers": [
                "El resultado de la Sprint Shootout",
                "El resultado de la clasificación del viernes",
                "La clasificación del campeonato",
                "El orden invertido de la parrilla"
            ],
            "correctAnswer": "El resultado de la Sprint Shootout",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What determines the starting order of the sprint race according to the 2025 regulations?",
            "answers": [
                "The result of the Sprint Shootout",
                "The result of Friday’s qualifying",
                "The championship standings",
                "The reverse grid order"
            ],
            "correctAnswer": "The result of the Sprint Shootout",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }
def pregunta_bandera_roja_suspension():
    if LANG == "es":
        return {
            "question": "¿Qué condiciones deben cumplirse para suspender una sesión con bandera roja?",
            "answers": [
                "Condiciones peligrosas o imposibilidad de continuar la sesión de forma segura",
                "Interrupción televisiva",
                "Cambio de condiciones meteorológicas sin lluvia",
                "Petición del equipo local"
            ],
            "correctAnswer": "Condiciones peligrosas o imposibilidad de continuar la sesión de forma segura",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What conditions must be met to suspend a session with a red flag?",
            "answers": [
                "Dangerous conditions or inability to safely continue the session",
                "Television interruption",
                "Change in weather without rain",
                "Request from the local team"
            ],
            "correctAnswer": "Dangerous conditions or inability to safely continue the session",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }
def pregunta_cambio_piloto():
    if LANG == "es":
        return {
            "question": "¿Cuándo puede un equipo cambiar de piloto durante un fin de semana de Gran Premio?",
            "answers": [
                "Antes del inicio de la clasificación, con aprobación de los comisarios",
                "Después de la carrera libremente",
                "En cualquier momento, sin restricciones",
                "Solo si el piloto titular está sancionado"
            ],
            "correctAnswer": "Antes del inicio de la clasificación, con aprobación de los comisarios",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When can a team change drivers during a Grand Prix weekend?",
            "answers": [
                "Before the start of qualifying, with approval from the stewards",
                "Freely after the race",
                "At any time, without restrictions",
                "Only if the main driver is penalized"
            ],
            "correctAnswer": "Before the start of qualifying, with approval from the stewards",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
def pregunta_verificacion_tecnica():
    if LANG == "es":
        return {
            "question": "¿Qué procedimiento se sigue si un coche no pasa la verificación técnica tras la carrera?",
            "answers": [
                "Puede ser descalificado de la sesión",
                "Se repite la verificación",
                "Se permite corregir el fallo en el siguiente Gran Premio",
                "No tiene consecuencias"
            ],
            "correctAnswer": "Puede ser descalificado de la sesión",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What procedure is followed if a car fails the technical inspection after the race?",
            "answers": [
                "It may be disqualified from the session",
                "The inspection is repeated",
                "The failure can be fixed before the next Grand Prix",
                "There are no consequences"
            ],
            "correctAnswer": "It may be disqualified from the session",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def caso_bandera_roja_pista_bloqueada():
    if LANG == "es":
        return {
            "question": "Un coche choca y bloquea la pista. Dirección de carrera saca bandera roja. ¿Qué deben hacer los pilotos?",
            "answers": [
                "Reducir la velocidad y dirigirse al pit lane en el orden de carrera",
                "Continuar hasta que vean bandera verde",
                "Pararse en la recta principal",
                "Dirigirse directamente al parque cerrado"
            ],
            "correctAnswer": "Reducir la velocidad y dirigirse al pit lane en el orden de carrera",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car crashes and blocks the track. Race control shows the red flag. What should the drivers do?",
            "answers": [
                "Reduce speed and head to the pit lane in race order",
                "Continue until they see a green flag",
                "Stop on the main straight",
                "Go directly to parc fermé"
            ],
            "correctAnswer": "Reduce speed and head to the pit lane in race order",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_exceso_velocidad_pitlane():
    if LANG == "es":
        return {
            "question": "Un coche entra al pit lane y no respeta el límite de 80 km/h. ¿Qué puede suceder según el reglamento?",
            "answers": [
                "Recibir una sanción económica o de tiempo",
                "Nada, no hay límite durante la carrera",
                "Solo recibe una advertencia verbal",
                "Es automáticamente descalificado"
            ],
            "correctAnswer": "Recibir una sanción económica o de tiempo",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car enters the pit lane and exceeds the 80 km/h speed limit. What can happen according to the regulations?",
            "answers": [
                "Receive a financial or time penalty",
                "Nothing, there is no limit during the race",
                "Only receives a verbal warning",
                "Is automatically disqualified"
            ],
            "correctAnswer": "Receive a financial or time penalty",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
def caso_neumatico_incorrecto_clasificacion():
    if LANG == "es":
        return {
            "question": "Un equipo decide usar un compuesto de neumático diferente al asignado para la clasificación. ¿Está permitido?",
            "answers": [
                "No, solo pueden usarse los compuestos asignados por la FIA",
                "Sí, si lo aprueba el equipo contrario",
                "Sí, pero solo en la Q1",
                "Solo si se notifica con 24 horas de antelación"
            ],
            "correctAnswer": "No, solo pueden usarse los compuestos asignados por la FIA",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A team decides to use a different tyre compound than the one assigned for qualifying. Is it allowed?",
            "answers": [
                "No, only compounds assigned by the FIA can be used",
                "Yes, if approved by the rival team",
                "Yes, but only in Q1",
                "Only if notified 24 hours in advance"
            ],
            "correctAnswer": "No, only compounds assigned by the FIA can be used",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
def caso_orden_reinicio_bandera_roja():
    if LANG == "es":
        return {
            "question": "Tras una bandera roja, ¿cómo se determina el orden para el reinicio de la carrera?",
            "answers": [
                "Según la última línea de cronometraje válida antes de la bandera roja",
                "Según la parrilla de salida original",
                "Por votación de los equipos",
                "En orden inverso al campeonato"
            ],
            "correctAnswer": "Según la última línea de cronometraje válida antes de la bandera roja",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "After a red flag, how is the order determined for the race restart?",
            "answers": [
                "According to the last valid timing line before the red flag",
                "According to the original starting grid",
                "By vote of the teams",
                "In reverse championship order"
            ],
            "correctAnswer": "According to the last valid timing line before the red flag",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
def caso_adelantar_tras_safety_car():
    if LANG == "es":
        return {
            "question": "El coche de seguridad apaga sus luces y entra al pit. ¿Cuándo puede adelantar el líder?",
            "answers": [
                "Después de cruzar la línea de salida/meta",
                "Tan pronto como el coche de seguridad entre al pit",
                "Inmediatamente, incluso en la última curva",
                "Solo tras completar otra vuelta completa"
            ],
            "correctAnswer": "Después de cruzar la línea de salida/meta",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "The safety car turns off its lights and enters the pit lane. When can the leader overtake?",
            "answers": [
                "After crossing the start/finish line",
                "As soon as the safety car enters the pit",
                "Immediately, even in the final corner",
                "Only after completing another full lap"
            ],
            "correctAnswer": "After crossing the start/finish line",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
def pregunta_puntuacion_diez_puntos():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos obtiene el piloto que finaliza en décima posición?",
            "answers": ["1", "2", "0", "3"],
            "correctAnswer": "1",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does the driver finishing in tenth place receive?",
            "answers": ["1", "2", "0", "3"],
            "correctAnswer": "1",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }
def pregunta_licencia_12_puntos():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto acumula 12 puntos de penalización en su licencia en un periodo de 12 meses?",
            "answers": [
                "Es suspendido automáticamente por una carrera",
                "Recibe una multa económica",
                "Pierde su superlicencia",
                "Debe comenzar desde el pit lane en la siguiente carrera"
            ],
            "correctAnswer": "Es suspendido automáticamente por una carrera",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver accumulates 12 penalty points on their license within 12 months?",
            "answers": [
                "They are automatically suspended for one race",
                "They receive a financial fine",
                "They lose their super license",
                "They must start from the pit lane in the next race"
            ],
            "correctAnswer": "They are automatically suspended for one race",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
def pregunta_activacion_drs():
    if LANG == "es":
        return {
            "question": "¿En qué momento se permite activar el DRS durante una carrera?",
            "answers": [
                "Tras las dos primeras vueltas si hay menos de un segundo con el coche de delante",
                "Desde el inicio de la carrera",
                "Solamente en clasificación",
                "Después de 10 vueltas"
            ],
            "correctAnswer": "Tras las dos primeras vueltas si hay menos de un segundo con el coche de delante",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is DRS allowed to be activated during a race?",
            "answers": [
                "After the first two laps if within one second of the car ahead",
                "From the start of the race",
                "Only during qualifying",
                "After 10 laps"
            ],
            "correctAnswer": "After the first two laps if within one second of the car ahead",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
def pregunta_fin_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Cuándo finaliza el estado de parque cerrado durante un evento?",
            "answers": [
                "Al inicio de la carrera",
                "Cuando los coches entran a boxes después del evento",
                "Tras finalizar la clasificación",
                "En el momento en que se abre el pit lane antes de la carrera"
            ],
            "correctAnswer": "Cuando los coches entran a boxes después del evento",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When does parc fermé status end during an event?",
            "answers": [
                "When the cars enter the pits after the event",
                "At the start of the race",
                "After qualifying ends",
                "When the pit lane opens before the race"
            ],
            "correctAnswer": "When the cars enter the pits after the event",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
def pregunta_bandera_amarilla_doble():
    if LANG == "es":
        return {
            "question": "¿Qué significa una doble bandera amarilla en pista?",
            "answers": [
                "Reducir velocidad significativamente y estar preparado para detenerse",
                "Zona de DRS desactivada",
                "Bandera roja inminente",
                "Se permite adelantar"
            ],
            "correctAnswer": "Reducir velocidad significativamente y estar preparado para detenerse",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a double yellow flag on track mean?",
            "answers": [
                "Reduce speed significantly and be prepared to stop",
                "DRS zone deactivated",
                "Red flag is imminent",
                "Overtaking is allowed"
            ],
            "correctAnswer": "Reduce speed significantly and be prepared to stop",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
def pregunta_neumaticos_compuestos():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto no utiliza al menos dos compuestos de neumáticos secos distintos durante una carrera?",
            "answers": [
                "Puede ser descalificado o sancionado",
                "Recibe una advertencia verbal",
                "Debe repetir la carrera",
                "No hay sanción si termina la carrera"
            ],
            "correctAnswer": "Puede ser descalificado o sancionado",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver does not use at least two different dry tyre compounds during a race?",
            "answers": [
                "They may be disqualified or penalized",
                "They receive a verbal warning",
                "They must repeat the race",
                "There is no penalty if they finish the race"
            ],
            "correctAnswer": "They may be disqualified or penalized",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
def pregunta_vsc_significado():
    if LANG == "es":
        return {
            "question": "¿Qué implica la activación del coche de seguridad virtual (VSC)?",
            "answers": [
                "Los pilotos deben mantener un delta de tiempo y no pueden adelantar",
                "Los coches se alinean detrás del coche de seguridad",
                "Se detiene la carrera temporalmente",
                "Los pilotos deben entrar obligatoriamente a boxes"
            ],
            "correctAnswer": "Los pilotos deben mantener un delta de tiempo y no pueden adelantar",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the activation of the Virtual Safety Car (VSC) mean?",
            "answers": [
                "Drivers must maintain a delta time and cannot overtake",
                "Cars line up behind the safety car",
                "The race is temporarily stopped",
                "Drivers must pit"
            ],
            "correctAnswer": "Drivers must maintain a delta time and cannot overtake",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
def pregunta_regla_107_por_ciento():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si un piloto no marca un tiempo dentro del 107% respecto al mejor tiempo en Q1?",
            "answers": [
                "Puede no ser autorizado a participar en la carrera",
                "Comienza desde el pit lane por defecto",
                "Tiene una vuelta adicional",
                "No hay consecuencias si es piloto local"
            ],
            "correctAnswer": "Puede no ser autorizado a participar en la carrera",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver does not set a time within 107% of the best time in Q1?",
            "answers": [
                "They may not be allowed to race",
                "They start from the pit lane by default",
                "They get an additional lap",
                "No consequences if the driver is local"
            ],
            "correctAnswer": "They may not be allowed to race",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }


def pregunta_revision_postcarrera():
    if LANG == "es":
        return {
            "question": "¿Qué se revisa durante la inspección técnica posterior a la carrera?",
            "answers": [
                "Conformidad del coche con el reglamento técnico",
                "El estado emocional del piloto",
                "La velocidad media de vuelta",
                "Los mensajes de radio del equipo"
            ],
            "correctAnswer": "Conformidad del coche con el reglamento técnico",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is checked during the post-race technical inspection?",
            "answers": [
                "Compliance of the car with technical regulations",
                "The emotional state of the driver",
                "The average lap speed",
                "The team's radio messages"
            ],
            "correctAnswer": "Compliance of the car with technical regulations",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
def caso_reincorporacion_peligrosa():
    if LANG == "es":
        return {
            "question": "Un coche se reincorpora de forma peligrosa tras salirse de pista. ¿Qué sanción puede recibir?",
            "answers": [
                "Penalización de tiempo o pérdida de posiciones",
                "Bandera negra directa",
                "Repetición de la maniobra",
                "Advertencia verbal"
            ],
            "correctAnswer": "Penalización de tiempo o pérdida de posiciones",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car rejoins the track dangerously after going off. What penalty can it receive?",
            "answers": [
                "Time penalty or loss of positions",
                "Immediate black flag",
                "Must repeat the maneuver",
                "Verbal warning"
            ],
            "correctAnswer": "Time penalty or loss of positions",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
# Categoría: Puntuaciones
def pregunta_puntuacion_segundo_clasificado():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos obtiene el segundo clasificado en una carrera normal?",
            "answers": ["18", "15", "20", "25"],
            "correctAnswer": "18",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does the second-place finisher receive in a normal race?",
            "answers": ["18", "15", "20", "25"],
            "correctAnswer": "18",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntuacion_quinto_clasificado():
    if LANG == "es":
        return {
            "question": "¿Qué puntuación recibe el piloto en 5º lugar?",
            "answers": ["10", "12", "8", "6"],
            "correctAnswer": "10",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does the driver in 5th place receive?",
            "answers": ["10", "12", "8", "6"],
            "correctAnswer": "10",
            "knowledgeLevel": 1,
            "category": "Scores",
            "language": LANG
        }
def pregunta_puntos_reducidos_condiciones():
    if LANG == "es":
        return {
            "question": "¿En qué condiciones se otorgan puntos reducidos?",
            "answers": [
                "Cuando la carrera se interrumpe antes del 75% sin reiniciarse",
                "Cuando hay más de 20 coches en pista",
                "Cuando llueve",
                "Cuando se produce un safety car en la última vuelta"
            ],
            "correctAnswer": "Cuando la carrera se interrumpe antes del 75% sin reiniciarse",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Under what conditions are reduced points awarded?",
            "answers": [
                "When the race is stopped before 75% and not restarted",
                "When there are more than 20 cars on track",
                "When it rains",
                "When a safety car is deployed on the final lap"
            ],
            "correctAnswer": "When the race is stopped before 75% and not restarted",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
def pregunta_puntos_mitad_carrera():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos se otorgan si se completa menos del 50% de la carrera?",
            "answers": ["50% de los puntos normales", "25% de los puntos normales", "No se otorgan puntos", "Puntos completos"],
            "correctAnswer": "50% de los puntos normales",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points are awarded if less than 50% of the race is completed?",
            "answers": [
                "50% of the normal points",
                "25% of the normal points",
                "No points awarded",
                "Full points"
            ],
            "correctAnswer": "50% of the normal points",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_victoria_sprint():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos otorga una victoria en una carrera sprint?",
            "answers": ["8", "6", "10", "5"],
            "correctAnswer": "8",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does a sprint race victory award?",
            "answers": ["8", "6", "10", "5"],
            "correctAnswer": "8",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
def pregunta_equipo_1y2():
    if LANG == "es":
        return {
            "question": "¿Cuál es la puntuación total para el equipo ganador si sus dos pilotos acaban 1º y 2º?",
            "answers": ["43", "45", "40", "38"],
            "correctAnswer": "43",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the total score for a team if their drivers finish 1st and 2nd?",
            "answers": ["43", "45", "40", "38"],
            "correctAnswer": "43",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
def pregunta_puntos_octavo_sprint():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos otorga el 8º puesto en una sprint?",
            "answers": ["1", "0", "2", "3"],
            "correctAnswer": "1",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does 8th place receive in a sprint race?",
            "answers": ["1", "0", "2", "3"],
            "correctAnswer": "1",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
def pregunta_puntos_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Se otorgan puntos si una carrera termina bajo bandera roja sin alcanzar el 25%?",
            "answers": ["No se otorgan puntos", "Sí, puntos completos", "Se otorgan puntos reducidos", "Solo medio punto al primero"],
            "correctAnswer": "No se otorgan puntos",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Are points awarded if a race ends under red flag without reaching 25%?",
            "answers": [
                "No points are awarded",
                "Yes, full points",
                "Reduced points are awarded",
                "Only half a point to the winner"
            ],
            "correctAnswer": "No points are awarded",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
# Categoría: Sanciones

def pregunta_sancion_pit_lane():
    if LANG == "es":
        return {
            "question": "¿Qué sanción puede recibir un piloto por exceso de velocidad en el pit lane?",
            "answers": ["Multa económica o penalización en carrera", "Bandera negra", "Reprimenda", "Descalificación inmediata"],
            "correctAnswer": "Multa económica o penalización en carrera",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty can a driver receive for speeding in the pit lane?",
            "answers": [
                "Financial fine or in-race penalty",
                "Black flag",
                "Reprimand",
                "Immediate disqualification"
            ],
            "correctAnswer": "Financial fine or in-race penalty",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
def pregunta_penalizacion_5_segundos():
    if LANG == "es":
        return {
            "question": "¿Qué implica una penalización de 5 segundos?",
            "answers": ["El piloto debe parar en boxes y esperar 5 segundos sin trabajar en el coche", "El piloto recibe 5 segundos extra en su tiempo final", "El piloto debe ceder posición", "No puede adelantar en 5 vueltas"],
            "correctAnswer": "El piloto recibe 5 segundos extra en su tiempo final",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a 5-second penalty mean?",
            "answers": [
                "The driver must stop in the pits and wait 5 seconds without work on the car",
                "The driver gets 5 seconds added to final race time",
                "The driver must yield position",
                "No overtaking for 5 laps"
            ],
            "correctAnswer": "The driver gets 5 seconds added to final race time",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
def pregunta_penalizacion_10_segundos():
    if LANG == "es":
        return {
            "question": "¿Cuándo se impone una penalización de 10 segundos?",
            "answers": ["Por infracciones graves en pista", "Por exceder límites de pista tres veces", "Por adelantamiento en bandera amarilla", "Por saltarse la salida"],
            "correctAnswer": "Por infracciones graves en pista",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is a 10-second penalty given?",
            "answers": [
                "For severe on-track infringements",
                "For exceeding track limits three times",
                "For overtaking under yellow flag",
                "For jumping the start"
            ],
            "correctAnswer": "For severe on-track infringements",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
def pregunta_parque_cerrado_infraccion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un equipo trabaja en el coche en parque cerrado sin autorización?",
            "answers": ["Puede ser descalificado de la sesión", "Recibe una multa", "Pierde 5 posiciones", "No puede competir en la carrera"],
            "correctAnswer": "Puede ser descalificado de la sesión",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a team works on the car in parc fermé without permission?",
            "answers": [
                "It may be disqualified from the session",
                "They receive a fine",
                "Lose 5 grid positions",
                "Not allowed to compete in the race"
            ],
            "correctAnswer": "It may be disqualified from the session",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_drive_through():
    if LANG == "es":
        return {
            "question": "¿Cuándo se aplica la sanción de ‘drive-through’?",
            "answers": ["Cuando el piloto comete una infracción en carrera", "Por exceso de velocidad en clasificación", "Cuando se cambia motor sin permiso", "Por no presentarse al pesaje"],
            "correctAnswer": "Cuando el piloto comete una infracción en carrera",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is a drive-through penalty applied?",
            "answers": ["When a driver commits an infraction during the race", "For speeding in qualifying", "When changing engine without permission", "For missing the weigh-in"],
            "correctAnswer": "When a driver commits an infraction during the race",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }


def pregunta_stop_and_go():
    if LANG == "es":
        return {
            "question": "¿Qué implica una sanción de ‘stop and go’ de 10 segundos?",
            "answers": ["El piloto debe detenerse 10 segundos sin que el equipo trabaje en el coche", "El piloto debe detenerse 10 segundos con cambio de neumáticos obligatorio", "El piloto pierde 10 segundos en clasificación", "El piloto debe ceder una posición"],
            "correctAnswer": "El piloto debe detenerse 10 segundos sin que el equipo trabaje en el coche",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a 10-second stop-and-go penalty involve?",
            "answers": ["The driver must stop for 10 seconds with no work on the car", "The driver must stop for 10 seconds with a mandatory tyre change", "The driver loses 10 seconds in qualifying", "The driver must give up a position"],
            "correctAnswer": "The driver must stop for 10 seconds with no work on the car",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }


def pregunta_peso_minimo():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un coche no cumple con el peso mínimo tras la carrera?",
            "answers": ["Puede ser descalificado de la carrera", "Recibe una reprimenda", "Pierde 5 posiciones en la parrilla siguiente", "Debe pagar una multa"],
            "correctAnswer": "Puede ser descalificado de la carrera",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car fails to meet the minimum weight after the race?",
            "answers": ["It can be disqualified from the race", "It receives a reprimand", "It loses 5 grid positions in the next race", "It must pay a fine"],
            "correctAnswer": "It can be disqualified from the race",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_aleron_ilegal():
    if LANG == "es":
        return {
            "question": "¿Qué pasa si se utiliza un alerón ilegal?",
            "answers": ["Puede ser motivo de descalificación", "Se pierde una sesión de clasificación", "Solo se aplica una multa", "El coche no puede salir del parque cerrado"],
            "correctAnswer": "Puede ser motivo de descalificación",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if an illegal wing is used?",
            "answers": ["It may result in disqualification", "One qualifying session is lost", "Only a fine is applied", "The car cannot leave parc fermé"],
            "correctAnswer": "It may result in disqualification",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }


def pregunta_bandera_azul():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si un piloto ignora una bandera azul?",
            "answers": ["Puede recibir una sanción por bloquear a otro coche", "Pierde automáticamente una vuelta", "Se le ordena abandonar la carrera", "Debe dejar de usar DRS"],
            "correctAnswer": "Puede recibir una sanción por bloquear a otro coche",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver ignores a blue flag?",
            "answers": ["They may be penalized for blocking another car", "They automatically lose a lap", "They are ordered to retire", "They must stop using DRS"],
            "correctAnswer": "They may be penalized for blocking another car",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }


def pregunta_repostaje_irregular():
    if LANG == "es":
        return {
            "question": "¿Qué sanción recibe un equipo por repostar en condiciones no permitidas?",
            "answers": ["Descalificación inmediata", "Solo una advertencia", "Penalización de tiempo", "Pérdida de puntos del campeonato"],
            "correctAnswer": "Descalificación inmediata",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty does a team receive for refueling under prohibited conditions?",
            "answers": ["Immediate disqualification", "Only a warning", "Time penalty", "Loss of championship points"],
            "correctAnswer": "Immediate disqualification",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }

# Categoría: Procedimientos
def pregunta_final_vuelta_formacion():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer un piloto al final de la vuelta de formación?",
            "answers": ["Detenerse en su posición de parrilla", "Entrar a boxes", "Activar el DRS", "Cambiar neumáticos"],
            "correctAnswer": "Detenerse en su posición de parrilla",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a driver do at the end of the formation lap?",
            "answers": ["Stop at their grid position", "Enter the pit lane", "Activate the DRS", "Change tyres"],
            "correctAnswer": "Stop at their grid position",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_no_arranca_parrilla():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto no puede arrancar desde la parrilla?",
            "answers": ["Debe salir desde el pit lane", "Queda descalificado", "Debe abandonar la carrera", "Sale al final del grupo"],
            "correctAnswer": "Debe salir desde el pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver cannot start from the grid?",
            "answers": ["They must start from the pit lane", "They are disqualified", "They must abandon the race", "They start from the back of the grid"],
            "correctAnswer": "They must start from the pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_segunda_vuelta_formacion():
    if LANG == "es":
        return {
            "question": "¿Cuándo se cancela una salida y se realiza una segunda vuelta de formación?",
            "answers": ["Si un coche se queda parado en parrilla", "Cuando hay lluvia", "Si un piloto tiene un fallo mecánico previo", "Por orden del director de carrera sin razón"],
            "correctAnswer": "Si un coche se queda parado en parrilla",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is a start aborted and a second formation lap done?",
            "answers": ["If a car stalls on the grid", "When it rains", "If a driver has a mechanical failure", "By random race director decision"],
            "correctAnswer": "If a car stalls on the grid",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_coche_detiene_parrilla():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un coche se detiene en la parrilla antes de la salida?",
            "answers": ["Puede empujarse a boxes y salir desde el pit lane", "Debe abandonar la carrera", "No puede ser tocado por los mecánicos", "Recibe una sanción automática"],
            "correctAnswer": "Puede empujarse a boxes y salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car stops on the grid before the start?",
            "answers": ["It can be pushed to the pits and start from the pit lane", "It must retire from the race", "It cannot be touched by mechanics", "It receives an automatic penalty"],
            "correctAnswer": "It can be pushed to the pits and start from the pit lane",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_salida_abortada():
    if LANG == "es":
        return {
            "question": "¿Cuál es el procedimiento si la salida se aborta?",
            "answers": ["Se inicia una vuelta de formación adicional", "Los coches deben detenerse en pista", "Se muestra bandera negra a todos", "Todos deben regresar a boxes"],
            "correctAnswer": "Se inicia una vuelta de formación adicional",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the procedure if the start is aborted?",
            "answers": ["An additional formation lap is started", "Cars must stop on track", "Black flag is shown to all", "All must return to the pits"],
            "correctAnswer": "An additional formation lap is started",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_inicio_carrera():
    if LANG == "es":
        return {
            "question": "¿En qué momento se considera que la carrera ha comenzado?",
            "answers": ["Cuando se apagan las luces del semáforo", "Cuando se inicia la vuelta de formación", "Cuando el primer coche cruza la línea de salida", "Cuando se muestra la bandera verde"],
            "correctAnswer": "Cuando se apagan las luces del semáforo",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is the race considered to have started?",
            "answers": ["When the starting lights go out", "When the formation lap begins", "When the first car crosses the start line", "When the green flag is shown"],
            "correctAnswer": "When the starting lights go out",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_salida_pitlane_parrilla():
    if LANG == "es":
        return {
            "question": "¿Cuándo pueden los coches salir del pit lane hacia la parrilla?",
            "answers": ["Cuando se muestra la luz verde al final del pit lane", "Cuando el equipo lo indique", "Cuando termina la bandera roja", "Siempre que haya pista libre"],
            "correctAnswer": "Cuando se muestra la luz verde al final del pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When can cars exit the pit lane towards the grid?",
            "answers": ["When the green light at the end of the pit lane is shown", "When the team signals", "When the red flag ends", "Whenever the track is clear"],
            "correctAnswer": "When the green light at the end of the pit lane is shown",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_cierre_pitlane():
    if LANG == "es":
        return {
            "question": "¿Cuánto tiempo antes de la salida se cierra el pit lane?",
            "answers": ["20 minutos", "10 minutos", "5 minutos", "15 minutos"],
            "correctAnswer": "10 minutos",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How long before the start is the pit lane closed?",
            "answers": ["20 minutes", "10 minutes", "5 minutes", "15 minutes"],
            "correctAnswer": "10 minutes",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_boxes_vuelta_formacion():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si un coche entra a boxes durante la vuelta de formación?",
            "answers": ["Debe iniciar la carrera desde el pit lane", "Debe regresar a su posición en la parrilla", "Recibe una sanción de tiempo", "Pierde su vuelta de formación"],
            "correctAnswer": "Debe iniciar la carrera desde el pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car enters the pits during the formation lap?",
            "answers": ["It must start the race from the pit lane", "It must return to its grid position", "It receives a time penalty", "It loses its formation lap"],
            "correctAnswer": "It must start the race from the pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_luces_salida():
    if LANG == "es":
        return {
            "question": "¿Qué señales indican que la salida se realizará normalmente?",
            "answers": ["Encendido progresivo de luces rojas y su apagado", "Bandera verde ondeando", "Semáforo verde intermitente", "Luz azul en la línea de salida"],
            "correctAnswer": "Encendido progresivo de luces rojas y su apagado",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What signals indicate that the start will proceed normally?",
            "answers": ["Progressive lighting of red lights and then turning off", "Waving green flag", "Flashing green light", "Blue light at the start line"],
            "correctAnswer": "Progressive lighting of red lights and then turning off",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


# Categoría: Parque Cerrado
def pregunta_inicio_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Cuándo comienza el estado de parque cerrado en un evento?",
            "answers": ["Al final de la sesión de clasificación", "Antes del inicio de la Q1", "Después del briefing de pilotos", "Cuando los coches llegan al circuito"],
            "correctAnswer": "Al final de la sesión de clasificación",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When does parc fermé begin during an event?",
            "answers": ["At the end of the qualifying session", "Before Q1 begins", "After the drivers' briefing", "When the cars arrive at the circuit"],
            "correctAnswer": "At the end of the qualifying session",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_final_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Cuándo finaliza el estado de parque cerrado en un evento?",
            "answers": ["Cuando comienza la carrera", "Al terminar el procedimiento de salida", "Cuando se apagan las luces del semáforo", "Después del pesaje obligatorio"],
            "correctAnswer": "Cuando comienza la carrera",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When does parc fermé end during an event?",
            "answers": ["When the race starts", "After the start procedure ends", "When the starting lights go out", "After the mandatory weighing"],
            "correctAnswer": "When the race starts",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_autorizacion_modificaciones():
    if LANG == "es":
        return {
            "question": "¿Qué se necesita para realizar modificaciones en el coche durante parque cerrado?",
            "answers": ["Autorización del delegado técnico", "Permiso del jefe de equipo", "Aviso al piloto", "Informe a los comisarios"],
            "correctAnswer": "Autorización del delegado técnico",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is required to make changes to the car during parc fermé?",
            "answers": ["Authorization from the technical delegate", "Permission from the team principal", "Notification to the driver", "Report to the stewards"],
            "correctAnswer": "Authorization from the technical delegate",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_motivo_sancion_pc():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si un equipo rompe el parque cerrado sin permiso?",
            "answers": ["El coche sale desde el pit lane", "Recibe una multa", "Pierde 5 posiciones en parrilla", "Debe repetir clasificación"],
            "correctAnswer": "El coche sale desde el pit lane",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a team violates parc fermé without permission?",
            "answers": ["The car must start from the pit lane", "They receive a fine", "They lose 5 grid positions", "They must repeat qualifying"],
            "correctAnswer": "The car must start from the pit lane",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_tipo_modificaciones_permitidas():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de modificaciones están permitidas durante parque cerrado sin autorización?",
            "answers": ["Ninguna modificación", "Cambio de neumáticos por razones de seguridad", "Cambio de combustible", "Cambio de piloto"],
            "correctAnswer": "Ninguna modificación",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What kind of modifications are allowed during parc fermé without authorization?",
            "answers": ["No modifications", "Tyre change for safety reasons", "Fuel change", "Driver change"],
            "correctAnswer": "No modifications",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_sustitucion_componentes_pc():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si se sustituye un componente clave durante parque cerrado?",
            "answers": ["El coche puede ser descalificado o salir desde el pit lane", "Debe reiniciar la clasificación", "Pierde puntos del campeonato", "Recibe una advertencia"],
            "correctAnswer": "El coche puede ser descalificado o salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a key component is replaced during parc fermé?",
            "answers": ["The car may be disqualified or must start from the pit lane", "Must redo qualifying", "Loses championship points", "Receives a warning"],
            "correctAnswer": "The car may be disqualified or must start from the pit lane",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_reparaciones_durante_pc():
    if LANG == "es":
        return {
            "question": "¿Cuándo pueden realizarse reparaciones al coche en parque cerrado?",
            "answers": ["Con autorización de la FIA", "Durante el pesaje", "En todo momento", "Solo en condiciones de lluvia"],
            "correctAnswer": "Con autorización de la FIA",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When can repairs be made to the car during parc fermé?",
            "answers": ["With FIA authorization", "During weighing", "At any time", "Only in wet conditions"],
            "correctAnswer": "With FIA authorization",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_objetivo_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Cuál es el objetivo principal del parque cerrado?",
            "answers": ["Evitar cambios en el coche después de clasificación", "Permitir revisión técnica rápida", "Reducir costes de operación", "Evitar conflictos entre equipos"],
            "correctAnswer": "Evitar cambios en el coche después de clasificación",
            "knowledgeLevel": 1,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main purpose of parc fermé?",
            "answers": ["Prevent changes to the car after qualifying", "Allow quick technical checks", "Reduce operating costs", "Avoid team conflicts"],
            "correctAnswer": "Prevent changes to the car after qualifying",
            "knowledgeLevel": 1,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_parque_cerrado_despues_sprint():
    if LANG == "es":
        return {
            "question": "¿Se aplica el parque cerrado después de una carrera sprint?",
            "answers": ["Sí, hasta la parrilla de la carrera principal", "No, antes de la clasificación", "Solo si llueve", "Sí, pero solo en la Q3"],
            "correctAnswer": "No, antes de la clasificación",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is parc fermé applied after a sprint race?",
            "answers": ["Yes, until the main race grid", "No, only before qualifying", "Only if it rains", "Yes, but only during Q3"],
            "correctAnswer": "No, only before qualifying",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_comunicacion_violacion_pc():
    if LANG == "es":
        return {
            "question": "¿Quién comunica una violación del parque cerrado?",
            "answers": ["El delegado técnico a los comisarios", "El jefe de equipo al director de carrera", "El piloto a la FIA", "El mecánico principal al director de seguridad"],
            "correctAnswer": "El delegado técnico a los comisarios",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Who reports a parc fermé violation?",
            "answers": ["The technical delegate to the stewards", "The team principal to the race director", "The driver to the FIA", "The chief mechanic to the safety director"],
            "correctAnswer": "The technical delegate to the stewards",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

# Categoría: Seguridad
def pregunta_doble_bandera_amarilla():
    if LANG == "es":
        return {
            "question": "¿Qué significa una doble bandera amarilla?",
            "answers": ["Precaución extrema, posible coche o comisario en pista", "Adelantar permitido con precaución", "Zona resbaladiza, pero sin detenerse", "Safety Car en pista"],
            "correctAnswer": "Precaución extrema, posible coche o comisario en pista",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a double yellow flag mean?",
            "answers": ["Extreme caution, possible car or marshal on track", "Overtaking allowed with caution", "Slippery zone but no need to stop", "Safety Car on track"],
            "correctAnswer": "Extreme caution, possible car or marshal on track",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }

def pregunta_bandera_roja_seguridad():
    if LANG == "es":
        return {
            "question": "¿Qué implica una bandera roja durante la carrera?",
            "answers": ["La carrera se detiene inmediatamente", "Solo se reduce la velocidad", "Se permite repostar", "Cambio de neumáticos obligatorio"],
            "correctAnswer": "La carrera se detiene inmediatamente",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a red flag mean during the race?",
            "answers": ["The race is stopped immediately", "Only speed is reduced", "Refueling is allowed", "Tyre change is mandatory"],
            "correctAnswer": "The race is stopped immediately",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }


def pregunta_bandera_amarilla_simple():
    if LANG == "es":
        return {
            "question": "¿Qué indica una bandera amarilla simple?",
            "answers": ["Peligro en pista, no adelantar", "Coche de seguridad en pista", "Pista libre", "Condiciones húmedas"],
            "correctAnswer": "Peligro en pista, no adelantar",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a single yellow flag indicate?",
            "answers": ["Danger on track, no overtaking", "Safety Car on track", "Clear track", "Wet conditions"],
            "correctAnswer": "Danger on track, no overtaking",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }


def pregunta_bandera_azul_significado():
    if LANG == "es":
        return {
            "question": "¿Qué indica la bandera azul en carrera?",
            "answers": ["Un coche más rápido se aproxima, dejar pasar", "Zona de boxes abierta", "Lluvia en el sector siguiente", "Salida del pit lane habilitada"],
            "correctAnswer": "Un coche más rápido se aproxima, dejar pasar",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the blue flag indicate during a race?",
            "answers": ["A faster car is approaching, let it pass", "Pit lane is open", "Rain in the next sector", "Pit exit enabled"],
            "correctAnswer": "A faster car is approaching, let it pass",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }

def pregunta_bandera_blanca():
    if LANG == "es":
        return {
            "question": "¿Qué significa la bandera blanca ondeando?",
            "answers": ["Vehículo lento en pista adelante", "Inicio de última vuelta", "Parada obligatoria", "Coche averiado fuera de pista"],
            "correctAnswer": "Vehículo lento en pista adelante",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a waving white flag mean?",
            "answers": ["Slow vehicle ahead on track", "Start of final lap", "Mandatory stop", "Broken car off track"],
            "correctAnswer": "Slow vehicle ahead on track",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }


def pregunta_bandera_negra():
    if LANG == "es":
        return {
            "question": "¿Qué implica la bandera negra con número?",
            "answers": ["El piloto indicado debe retirarse de la carrera", "Debe entrar a boxes a reparar", "Penalización de tiempo", "Cambio de neumáticos obligatorio"],
            "correctAnswer": "El piloto indicado debe retirarse de la carrera",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the black flag with a number mean?",
            "answers": ["The indicated driver must retire from the race", "Must pit for repairs", "Time penalty", "Mandatory tyre change"],
            "correctAnswer": "The indicated driver must retire from the race",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }


def pregunta_luces_pit_lane():
    if LANG == "es":
        return {
            "question": "¿Qué indica la luz roja al final del pit lane?",
            "answers": ["Prohibido salir del pit lane", "Autorizado el ingreso a boxes", "Activación de bandera azul", "Zona peligrosa"],
            "correctAnswer": "Prohibido salir del pit lane",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the red light at the end of the pit lane mean?",
            "answers": ["Exit from pit lane is prohibited", "Entry to pit lane is allowed", "Blue flag activated", "Danger zone"],
            "correctAnswer": "Exit from pit lane is prohibited",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }


def pregunta_bandera_a_cuadros():
    if LANG == "es":
        return {
            "question": "¿Qué indica la bandera a cuadros?",
            "answers": ["Fin de la carrera o sesión", "Inicio de carrera", "Zona de adelantamiento", "Neutralización de la prueba"],
            "correctAnswer": "Fin de la carrera o sesión",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the chequered flag indicate?",
            "answers": ["End of the race or session", "Start of the race", "Overtaking zone", "Race neutralization"],
            "correctAnswer": "End of the race or session",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }


def pregunta_bandera_negra_naranja():
    if LANG == "es":
        return {
            "question": "¿Qué indica una bandera negra con círculo naranja?",
            "answers": ["El coche tiene un problema mecánico y debe entrar a boxes", "Condiciones peligrosas en pista", "Parada por condiciones meteorológicas", "Penalización pendiente"],
            "correctAnswer": "El coche tiene un problema mecánico y debe entrar a boxes",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a black flag with an orange circle mean?",
            "answers": ["The car has a mechanical issue and must pit", "Dangerous track conditions", "Stopped due to weather", "Pending penalty"],
            "correctAnswer": "The car has a mechanical issue and must pit",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }


def pregunta_bandera_verde():
    if LANG == "es":
        return {
            "question": "¿Qué indica la bandera verde?",
            "answers": ["Pista libre de peligros", "Fin de carrera", "Zona de boxes abierta", "Adelantamiento prohibido"],
            "correctAnswer": "Pista libre de peligros",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the green flag indicate?",
            "answers": ["Track clear of hazards", "End of race", "Pit lane open", "Overtaking prohibited"],
            "correctAnswer": "Track clear of hazards",
            "knowledgeLevel": 1,
            "category": "Safety",
            "language": LANG
        }


# Categoría: Neumáticos
def pregunta_uso_dos_compuestos():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un equipo no utiliza al menos dos compuestos de neumáticos secos en carrera?",
            "answers": ["Puede ser descalificado o sancionado", "Debe abandonar la carrera", "Recibe una advertencia", "Pierde posiciones en clasificación"],
            "correctAnswer": "Puede ser descalificado o sancionado",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a team does not use at least two dry tyre compounds during the race?",
            "answers": ["They may be disqualified or penalized", "They must retire from the race", "They receive a warning", "They lose qualifying positions"],
            "correctAnswer": "They may be disqualified or penalized",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_tipo_compuestos_drs():
    if LANG == "es":
        return {
            "question": "¿Cuántos tipos de compuestos de neumáticos secos están disponibles por evento?",
            "answers": ["Tres", "Dos", "Cinco", "Cuatro"],
            "correctAnswer": "Tres",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many types of dry tyre compounds are available per event?",
            "answers": ["Three", "Two", "Five", "Four"],
            "correctAnswer": "Three",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_neumaticos_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Qué neumáticos deben usarse obligatoriamente en Q1 y Q2 cuando aplica el reglamento específico?",
            "answers": ["Duro en Q1 y Medio en Q2", "Blando en ambas", "Cualquiera disponible", "Intermedio en Q1 y Blando en Q2"],
            "correctAnswer": "Duro en Q1 y Medio en Q2",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which tyres must be used in Q1 and Q2 when the specific regulation applies?",
            "answers": ["Hard in Q1 and Medium in Q2", "Soft in both", "Any available compound", "Intermediate in Q1 and Soft in Q2"],
            "correctAnswer": "Hard in Q1 and Medium in Q2",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_compuestos_lluvia():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de neumáticos se utilizan en condiciones de lluvia intensa?",
            "answers": ["Full Wet (azul)", "Intermedios (verde)", "Blandos (rojo)", "Medios (amarillo)"],
            "correctAnswer": "Full Wet (azul)",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What type of tyres are used in heavy rain conditions?",
            "answers": ["Full Wet (blue)", "Intermediate (green)", "Soft (red)", "Medium (yellow)"],
            "correctAnswer": "Full Wet (blue)",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_uso_intermedios():
    if LANG == "es":
        return {
            "question": "¿Qué condiciones justifican el uso de neumáticos intermedios?",
            "answers": ["Pista húmeda pero sin acumulación de agua", "Asfalto seco", "Temperatura alta", "Pista completamente inundada"],
            "correctAnswer": "Pista húmeda pero sin acumulación de agua",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What conditions justify the use of intermediate tyres?",
            "answers": ["Damp track without water accumulation", "Dry asphalt", "High temperature", "Track fully flooded"],
            "correctAnswer": "Damp track without water accumulation",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_restriccion_uso_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Existe una cantidad limitada de neumáticos por fin de semana?",
            "answers": ["Sí, regulado por la FIA", "No, cada equipo decide", "Solo en clasificación", "Solo para sprint"],
            "correctAnswer": "Sí, regulado por la FIA",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is there a limited number of tyres per weekend?",
            "answers": ["Yes, regulated by the FIA", "No, each team decides", "Only in qualifying", "Only for sprint events"],
            "correctAnswer": "Yes, regulated by the FIA",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_asignacion_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Cómo se determina la asignación de neumáticos a los equipos?",
            "answers": ["Especificada por Pirelli y la FIA", "Cada equipo elige libremente", "Según sorteo previo", "Depende del clima"],
            "correctAnswer": "Especificada por Pirelli y la FIA",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is tyre allocation to teams determined?",
            "answers": ["Specified by Pirelli and the FIA", "Each team chooses freely", "By prior draw", "Depends on the weather"],
            "correctAnswer": "Specified by Pirelli and the FIA",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_pit_stop_neumaticos():
    if LANG == "es":
        return {
            "question": "¿En qué momento deben cambiar neumáticos los equipos en carrera?",
            "answers": ["Cuando el compuesto actual no es válido o por estrategia", "Cada 10 vueltas", "Solo si hay bandera amarilla", "Después de la vuelta 10"],
            "correctAnswer": "Cuando el compuesto actual no es válido o por estrategia",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When must teams change tyres during a race?",
            "answers": ["When the current compound is no longer valid or for strategy", "Every 10 laps", "Only under yellow flag", "After lap 10"],
            "correctAnswer": "When the current compound is no longer valid or for strategy",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_neumaticos_sprint():
    if LANG == "es":
        return {
            "question": "¿Se requiere el uso de dos compuestos distintos en carrera sprint?",
            "answers": ["No, no es obligatorio", "Sí, siempre", "Solo si llueve", "Solo si dura más de 20 vueltas"],
            "correctAnswer": "No, no es obligatorio",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is the use of two different compounds required in a sprint race?",
            "answers": ["No, it's not mandatory", "Yes, always", "Only if it rains", "Only if it lasts more than 20 laps"],
            "correctAnswer": "No, it's not mandatory",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }


def pregunta_marca_colores_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Qué color identifica al neumático más blando disponible?",
            "answers": ["Rojo", "Amarillo", "Blanco", "Verde"],
            "correctAnswer": "Rojo",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What color identifies the softest tyre available?",
            "answers": ["Red", "Yellow", "White", "Green"],
            "correctAnswer": "Red",
            "knowledgeLevel": 1,
            "category": "Tyres",
            "language": LANG
        }


# Categoría: Safety Car

def pregunta_salida_safety_car():
    if LANG == "es":
        return {
            "question": "¿En qué casos se activa el coche de seguridad?",
            "answers": [
                "Cuando hay un peligro que requiere neutralizar la carrera",
                "Cuando termina la clasificación",
                "Cada vez que llueve",
                "Cuando un piloto cambia de neumáticos"
            ],
            "correctAnswer": "Cuando hay un peligro que requiere neutralizar la carrera",
            "knowledgeLevel": 1,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is the safety car deployed?",
            "answers": [
                "When there's a hazard requiring race neutralization",
                "When qualifying ends",
                "Every time it rains",
                "When a driver changes tyres"
            ],
            "correctAnswer": "When there's a hazard requiring race neutralization",
            "knowledgeLevel": 1,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_regreso_boxes_safety_car():
    if LANG == "es":
        return {
            "question": "¿Qué indica que el coche de seguridad regresará a boxes esta vuelta?",
            "answers": [
                "Luce el mensaje ‘SC in this lap’",
                "Se encienden las luces azules",
                "Los coches lo adelantan",
                "El director de carrera usa bandera verde"
            ],
            "correctAnswer": "Luce el mensaje ‘SC in this lap’",
            "knowledgeLevel": 1,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What indicates that the safety car will return to the pits this lap?",
            "answers": [
                "The message 'SC in this lap' is displayed",
                "Blue lights are turned on",
                "Cars overtake it",
                "The race director waves a green flag"
            ],
            "correctAnswer": "The message 'SC in this lap' is displayed",
            "knowledgeLevel": 1,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_condiciones_vsc():
    if LANG == "es":
        return {
            "question": "¿Qué condiciones deben cumplirse durante VSC?",
            "answers": [
                "Velocidad reducida sin adelantamientos",
                "Cambio obligatorio de neumáticos",
                "Bandera azul activa",
                "Posibilidad de recuperar vueltas"
            ],
            "correctAnswer": "Velocidad reducida sin adelantamientos",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What conditions apply during VSC?",
            "answers": [
                "Reduced speed with no overtaking",
                "Mandatory tyre change",
                "Blue flag is active",
                "Possibility of recovering laps"
            ],
            "correctAnswer": "Reduced speed with no overtaking",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_adelantamientos_safety_car():
    if LANG == "es":
        return {
            "question": "¿Está permitido adelantar durante el coche de seguridad?",
            "answers": [
                "Solo cuando se indica específicamente",
                "Siempre que se mantenga distancia",
                "Durante todo el periodo",
                "Solo entre compañeros de equipo"
            ],
            "correctAnswer": "Solo cuando se indica específicamente",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is overtaking allowed during the safety car period?",
            "answers": [
                "Only when specifically instructed",
                "As long as distance is maintained",
                "Throughout the entire period",
                "Only between teammates"
            ],
            "correctAnswer": "Only when specifically instructed",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_salida_safety_car_linea():
    if LANG == "es":
        return {
            "question": "¿Qué línea debe cruzar un coche para poder adelantar tras el safety car?",
            "answers": ["Línea de Safety Car 1", "Línea de boxes", "Línea de meta", "Línea de clasificación"],
            "correctAnswer": "Línea de Safety Car 1",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which line must a car cross to be allowed to overtake after the safety car?",
            "answers": ["Safety Car Line 1", "Pit lane line", "Finish line", "Qualifying line"],
            "correctAnswer": "Safety Car Line 1",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_tiempos_vsc():
    if LANG == "es":
        return {
            "question": "¿Cómo se controlan los tiempos de los pilotos bajo VSC?",
            "answers": ["Mediante sectores de referencia por la FIA", "Con sensores en los neumáticos", "Por GPS en el volante", "Por aviso de los comisarios"],
            "correctAnswer": "Mediante sectores de referencia por la FIA",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How are driver times controlled under VSC?",
            "answers": ["Through reference sectors set by the FIA", "Using tyre sensors", "By GPS on the steering wheel", "Via marshal notifications"],
            "correctAnswer": "Through reference sectors set by the FIA",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_vuelta_lanzada():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de relanzamiento realiza el líder tras el Safety Car?",
            "answers": [
                "Vuelta lanzada con ritmo libre desde la última curva",
                "Relanzamiento desde pit lane",
                "Salida detenida",
                "No hay relanzamiento, se retira y continúa la carrera"
            ],
            "correctAnswer": "Vuelta lanzada con ritmo libre desde la última curva",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What type of restart does the leader do after the Safety Car?",
            "answers": [
                "Flying restart with free pace from the last corner",
                "Restart from the pit lane",
                "Standing start",
                "No restart, just resumes the race"
            ],
            "correctAnswer": "Flying restart with free pace from the last corner",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_coche_doblado_safety_car():
    if LANG == "es":
        return {
            "question": "¿Qué pueden hacer los coches doblados durante un Safety Car?",
            "answers": [
                "Adelantar para recuperar vuelta si se autoriza",
                "Permanecer en posición siempre",
                "Detenerse en boxes",
                "Salir del trazado y reincorporarse"
            ],
            "correctAnswer": "Adelantar para recuperar vuelta si se autoriza",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can lapped cars do during a Safety Car period?",
            "answers": [
                "Overtake to unlap themselves if authorized",
                "Always stay in position",
                "Stop in the pits",
                "Leave the track and rejoin"
            ],
            "correctAnswer": "Overtake to unlap themselves if authorized",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }


def pregunta_bandera_verde_post_sc():
    if LANG == "es":
        return {
            "question": "¿Qué bandera se muestra cuando se termina el periodo de coche de seguridad?",
            "answers": ["Bandera verde", "Bandera azul", "Bandera blanca", "Bandera amarilla"],
            "correctAnswer": "Bandera verde",
            "knowledgeLevel": 1,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which flag is shown when the safety car period ends?",
            "answers": ["Green flag", "Blue flag", "White flag", "Yellow flag"],
            "correctAnswer": "Green flag",
            "knowledgeLevel": 1,
            "category": "SafetyCar",
            "language": LANG
        }

# Categoría: Clasificación

def pregunta_formato_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Cuántas sesiones tiene la clasificación habitual?",
            "answers": ["Tres (Q1, Q2 y Q3)", "Dos (Q1 y Q2)", "Una única tanda de 60 minutos", "Cinco rondas eliminatorias"],
            "correctAnswer": "Tres (Q1, Q2 y Q3)",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many sessions does regular qualifying have?",
            "answers": ["Three (Q1, Q2 and Q3)", "Two (Q1 and Q2)", "A single 60-minute session", "Five elimination rounds"],
            "correctAnswer": "Three (Q1, Q2 and Q3)",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }

def pregunta_duracion_q3():
    if LANG == "es":
        return {
            "question": "¿Cuál es la duración de la sesión Q3?",
            "answers": ["12 minutos", "15 minutos", "10 minutos", "20 minutos"],
            "correctAnswer": "12 minutos",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the duration of Q3?",
            "answers": ["12 minutes", "15 minutes", "10 minutes", "20 minutes"],
            "correctAnswer": "12 minutes",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }


def pregunta_orden_salida_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Cómo se determina el orden de salida en la clasificación?",
            "answers": ["Libre durante la sesión", "Según resultados de prácticas", "Por sorteo", "Por orden de llegada al pit lane"],
            "correctAnswer": "Libre durante la sesión",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is the running order determined in qualifying?",
            "answers": ["Free during the session", "According to practice results", "By lottery", "By pit lane arrival order"],
            "correctAnswer": "Free during the session",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }


def pregunta_tiempos_q1_eliminacion():
    if LANG == "es":
        return {
            "question": "¿Cuántos pilotos son eliminados al final de Q1?",
            "answers": ["5", "3", "6", "4"],
            "correctAnswer": "5",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many drivers are eliminated at the end of Q1?",
            "answers": ["5", "3", "6", "4"],
            "correctAnswer": "5",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }


def pregunta_prohibiciones_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Qué está prohibido durante una vuelta rápida en clasificación?",
            "answers": ["Obstaculizar a otro piloto", "Usar DRS", "Cambiar de compuesto", "Pasar por boxes"],
            "correctAnswer": "Obstaculizar a otro piloto",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is prohibited during a flying lap in qualifying?",
            "answers": ["Blocking another driver", "Using DRS", "Changing compound", "Going through the pit lane"],
            "correctAnswer": "Blocking another driver",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def pregunta_autorizacion_participacion_fuera_107():
    if LANG == "es":
        return {
            "question": "¿Quién puede autorizar a un piloto a correr si no cumple el 107%?",
            "answers": ["Los comisarios", "El director de equipo", "El director de carrera", "El delegado técnico"],
            "correctAnswer": "Los comisarios",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Who can authorize a driver to race if they fail to meet the 107% rule?",
            "answers": ["The stewards", "The team principal", "The race director", "The technical delegate"],
            "correctAnswer": "The stewards",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }


def pregunta_influencia_sanciones_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Pueden las sanciones cambiar el orden de parrilla después de la clasificación?",
            "answers": ["Sí, afectan la posición de salida", "No, la clasificación es definitiva", "Solo si es por neumáticos", "Depende del circuito"],
            "correctAnswer": "Sí, afectan la posición de salida",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can penalties alter the starting grid after qualifying?",
            "answers": ["Yes, they affect the starting position", "No, qualifying is final", "Only if related to tyres", "Depends on the circuit"],
            "correctAnswer": "Yes, they affect the starting position",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }


def pregunta_mas_de_un_tiempo():
    if LANG == "es":
        return {
            "question": "¿Puede un piloto marcar más de un tiempo por sesión?",
            "answers": ["Sí, puede hacer varias vueltas rápidas", "No, solo una vuelta rápida por sesión", "Solo si no ha usado DRS", "Depende del compuesto usado"],
            "correctAnswer": "Sí, puede hacer varias vueltas rápidas",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver set more than one lap time per session?",
            "answers": ["Yes, multiple fast laps are allowed", "No, only one flying lap per session", "Only if DRS was not used", "Depends on the compound used"],
            "correctAnswer": "Yes, multiple fast laps are allowed",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }


def pregunta_uso_neumaticos_q3():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de neumáticos suelen usarse en Q3?",
            "answers": ["Los más blandos disponibles", "Intermedios por normativa", "Duro obligatorio", "Cualquiera, según decisión del piloto"],
            "correctAnswer": "Los más blandos disponibles",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which tyres are typically used in Q3?",
            "answers": ["The softest available", "Intermediates by regulation", "Mandatory hard compound", "Any, depending on driver's decision"],
            "correctAnswer": "The softest available",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }



# Categoría: Sprint
def pregunta_dia_sprint_shootout():
    if LANG == "es":
        return {
            "question": "¿Qué día se celebra la Sprint Shootout durante un fin de semana con formato sprint?",
            "answers": ["Sábado", "Domingo", "Viernes", "Depende del circuito"],
            "correctAnswer": "Sábado",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "On what day is the Sprint Shootout held during a sprint weekend?",
            "answers": ["Saturday", "Sunday", "Friday", "Depends on the circuit"],
            "correctAnswer": "Saturday",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }


def pregunta_duracion_sprint():
    if LANG == "es":
        return {
            "question": "¿Cuál es la duración máxima de una carrera Sprint?",
            "answers": ["100 km o 30 minutos", "200 km o 45 minutos", "50 km o 20 minutos", "150 km o 60 minutos"],
            "correctAnswer": "100 km o 30 minutos",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum duration of a Sprint race?",
            "answers": ["100 km or 30 minutes", "200 km or 45 minutes", "50 km or 20 minutes", "150 km or 60 minutes"],
            "correctAnswer": "100 km or 30 minutes",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }


def pregunta_objetivo_sprint():
    if LANG == "es":
        return {
            "question": "¿Cuál es el propósito principal de la carrera Sprint?",
            "answers": [
                "Determinar el orden de salida del Gran Premio",
                "Reemplazar la clasificación",
                "Reducir el número de prácticas",
                "Asignar neumáticos"
            ],
            "correctAnswer": "Reducir el número de prácticas",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main purpose of the Sprint race?",
            "answers": [
                "To determine the starting grid for the Grand Prix",
                "To replace qualifying",
                "To reduce practice sessions",
                "To allocate tyres"
            ],
            "correctAnswer": "To reduce practice sessions",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }


def pregunta_compuestos_sprint():
    if LANG == "es":
        return {
            "question": "¿Es obligatorio usar diferentes compuestos de neumáticos en la Sprint?",
            "answers": ["No", "Sí, al menos dos", "Solo si llueve", "Solo si dura más de 20 vueltas"],
            "correctAnswer": "No",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is it mandatory to use different tyre compounds in the Sprint?",
            "answers": ["No", "Yes, at least two", "Only if it rains", "Only if it lasts more than 20 laps"],
            "correctAnswer": "No",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }


def pregunta_parrilla_gp():
    if LANG == "es":
        return {
            "question": "¿Cómo se define la parrilla del Gran Premio en fin de semana Sprint?",
            "answers": [
                "Según la clasificación del viernes",
                "Según el resultado de la Sprint",
                "Por orden inverso a la Sprint",
                "Por puntos en el campeonato"
            ],
            "correctAnswer": "Según la clasificación del viernes",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is the Grand Prix grid determined during a Sprint weekend?",
            "answers": [
                "Based on Friday's qualifying",
                "Based on the Sprint result",
                "Reverse order of the Sprint",
                "Championship points standings"
            ],
            "correctAnswer": "Based on Friday's qualifying",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }


def pregunta_neumaticos_ss():
    if LANG == "es":
        return {
            "question": "¿Qué neumáticos deben usarse en la Sprint Shootout?",
            "answers": [
                "Medios en Q1 y Q2, blandos en Q3",
                "Libres en todas las sesiones",
                "Solo duros en Q1 y Q2",
                "Intermedios obligatorios"
            ],
            "correctAnswer": "Medios en Q1 y Q2, blandos en Q3",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What tyres must be used in the Sprint Shootout?",
            "answers": [
                "Mediums in Q1 and Q2, softs in Q3",
                "Any tyres in all sessions",
                "Only hards in Q1 and Q2",
                "Mandatory intermediates"
            ],
            "correctAnswer": "Mediums in Q1 and Q2, softs in Q3",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }


def pregunta_vuelta_lanzada_sprint():
    if LANG == "es":
        return {
            "question": "¿Cómo inicia la Sprint?",
            "answers": [
                "Con salida detenida desde parrilla",
                "Lanzada tras Safety Car",
                "Desde boxes",
                "Con semáforo verde en curva 1"
            ],
            "correctAnswer": "Con salida detenida desde parrilla",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does the Sprint start?",
            "answers": [
                "With a standing start from the grid",
                "Rolling start after Safety Car",
                "From the pit lane",
                "Green light at turn 1"
            ],
            "correctAnswer": "With a standing start from the grid",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }


def pregunta_penalizaciones_sprint():
    if LANG == "es":
        return {
            "question": "¿Pueden aplicarse penalizaciones tras la Sprint?",
            "answers": [
                "Sí, y afectar la parrilla del GP",
                "No, solo durante la Sprint",
                "Sí, pero solo en puntos",
                "Solo si son sanciones monetarias"
            ],
            "correctAnswer": "Sí, y afectar la parrilla del GP",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can penalties be applied after the Sprint?",
            "answers": [
                "Yes, and they can affect the GP grid",
                "No, only during the Sprint",
                "Yes, but only in points",
                "Only if they are monetary fines"
            ],
            "correctAnswer": "Yes, and they can affect the GP grid",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }


# Categoría: Bandera Roja
def pregunta_modificaciones_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Qué está permitido hacer en el coche durante una bandera roja?",
            "answers": ["Reparaciones y cambios autorizados por la FIA", "Nada, el coche debe permanecer intacto", "Solo cambio de neumáticos", "Repostar combustible"],
            "correctAnswer": "Reparaciones y cambios autorizados por la FIA",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is allowed to be done to the car during a red flag?",
            "answers": ["Repairs and changes authorized by the FIA", "Nothing, the car must remain untouched", "Only tyre changes", "Refueling"],
            "correctAnswer": "Repairs and changes authorized by the FIA",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_fin_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Cómo se reanuda una carrera tras una bandera roja?",
            "answers": [
                "Con salida detenida o lanzada, según decisión del director de carrera",
                "Siempre con salida desde boxes",
                "Se reinicia con bandera verde en pista",
                "Por orden inverso al anterior"
            ],
            "correctAnswer": "Con salida detenida o lanzada, según decisión del director de carrera",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is a race resumed after a red flag?",
            "answers": [
                "With a standing or rolling start as decided by the race director",
                "Always from the pit lane",
                "With a green flag on track",
                "In reverse order"
            ],
            "correctAnswer": "With a standing or rolling start as decided by the race director",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_duracion_maxima_suspension():
    if LANG == "es":
        return {
            "question": "¿Cuál es la duración máxima permitida para una suspensión por bandera roja?",
            "answers": ["3 horas de duración total del evento", "1 hora desde interrupción", "30 minutos exactos", "Sin límite"],
            "correctAnswer": "3 horas de duración total del evento",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum allowed duration for a red flag suspension?",
            "answers": ["3 hours total event duration", "1 hour from the interruption", "Exactly 30 minutes", "No limit"],
            "correctAnswer": "3 hours total event duration",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_motivo_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de situaciones justifican una bandera roja?",
            "answers": [
                "Condiciones peligrosas o accidente grave",
                "Adelantamientos múltiples",
                "Fin de sesión",
                "Bandera azul ignorada"
            ],
            "correctAnswer": "Condiciones peligrosas o accidente grave",
            "knowledgeLevel": 1,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What type of situations justify a red flag?",
            "answers": [
                "Dangerous conditions or a serious accident",
                "Multiple overtakes",
                "End of session",
                "Blue flag ignored"
            ],
            "correctAnswer": "Dangerous conditions or a serious accident",
            "knowledgeLevel": 1,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_posiciones_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Cómo se determinan las posiciones cuando se suspende una carrera con bandera roja?",
            "answers": [
                "Con el orden al final de la última vuelta completa válida",
                "Con el orden de la clasificación",
                "Según tiempo de reacción",
                "Por decisión de los comisarios"
            ],
            "correctAnswer": "Con el orden al final de la última vuelta completa válida",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How are positions determined when a race is suspended with a red flag?",
            "answers": [
                "Based on the order at the end of the last full valid lap",
                "Based on qualifying order",
                "According to reaction time",
                "By decision of the stewards"
            ],
            "correctAnswer": "Based on the order at the end of the last full valid lap",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_pitlane_durante_roja():
    if LANG == "es":
        return {
            "question": "¿Está permitido entrar al pit lane durante una bandera roja?",
            "answers": [
                "Sí, pero bajo condiciones específicas",
                "No bajo ninguna circunstancia",
                "Solo para repostar",
                "Sí, siempre que sea urgente"
            ],
            "correctAnswer": "Sí, pero bajo condiciones específicas",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is it allowed to enter the pit lane during a red flag?",
            "answers": [
                "Yes, but under specific conditions",
                "Not under any circumstances",
                "Only to refuel",
                "Yes, always if it’s urgent"
            ],
            "correctAnswer": "Yes, but under specific conditions",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_pilotos_vehiculos_roja():
    if LANG == "es":
        return {
            "question": "¿Qué deben hacer los pilotos durante una bandera roja?",
            "answers": [
                "Conducir lentamente hasta el pit lane",
                "Detenerse en pista",
                "Seguir compitiendo con precaución",
                "Esperar instrucciones de comisarios en la pista"
            ],
            "correctAnswer": "Conducir lentamente hasta el pit lane",
            "knowledgeLevel": 1,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must drivers do during a red flag?",
            "answers": [
                "Drive slowly to the pit lane",
                "Stop on track",
                "Keep racing with caution",
                "Wait for stewards' instructions on track"
            ],
            "correctAnswer": "Drive slowly to the pit lane",
            "knowledgeLevel": 1,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_comunicacion_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Cómo se comunica oficialmente la bandera roja a los equipos?",
            "answers": [
                "Mediante paneles luminosos y mensaje oficial en cronometraje",
                "Por señal acústica en boxes",
                "Por radio entre comisarios",
                "Por luces intermitentes azules"
            ],
            "correctAnswer": "Mediante paneles luminosos y mensaje oficial en cronometraje",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is a red flag officially communicated to teams?",
            "answers": [
                "Through light panels and an official message on timing screens",
                "By acoustic signal in the pit lane",
                "Via stewards' radio",
                "By flashing blue lights"
            ],
            "correctAnswer": "Through light panels and an official message on timing screens",
            "knowledgeLevel": 2,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_obligaciones_durante_roja():
    if LANG == "es":
        return {
            "question": "¿Qué está prohibido hacer al personal del equipo durante una bandera roja?",
            "answers": [
                "Trabajar en el coche sin autorización",
                "Salir del garaje",
                "Comunicarse con el piloto",
                "Entrar a boxes"
            ],
            "correctAnswer": "Trabajar en el coche sin autorización",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is team personnel forbidden to do during a red flag?",
            "answers": [
                "Work on the car without authorization",
                "Leave the garage",
                "Communicate with the driver",
                "Enter the pits"
            ],
            "correctAnswer": "Work on the car without authorization",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }


def pregunta_modificacion_setup_roja():
    if LANG == "es":
        return {
            "question": "¿Puede modificarse el setup del coche durante una bandera roja?",
            "answers": [
                "Solo con autorización de la FIA",
                "Sí, libremente",
                "No, nunca",
                "Solo si hay lluvia"
            ],
            "correctAnswer": "Solo con autorización de la FIA",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can the car setup be modified during a red flag?",
            "answers": [
                "Only with FIA authorization",
                "Yes, freely",
                "No, never",
                "Only if it’s raining"
            ],
            "correctAnswer": "Only with FIA authorization",
            "knowledgeLevel": 3,
            "category": "RedFlag",
            "language": LANG
        }


# Categoría: Pilotos
def pregunta_reemplazo_piloto():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer un equipo si un piloto no puede competir tras el inicio del evento?",
            "answers": [
                "Solicitar aprobación de los comisarios para un reemplazo",
                "Nada, solo se corre con un coche",
                "Reclamar puntos automáticamente",
                "Cambiar de piloto sin avisar"
            ],
            "correctAnswer": "Solicitar aprobación de los comisarios para un reemplazo",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a team do if a driver can't compete after the event has started?",
            "answers": [
                "Request stewards’ approval for a replacement",
                "Do nothing and race with one car",
                "Automatically claim points",
                "Change driver without notifying anyone"
            ],
            "correctAnswer": "Request stewards’ approval for a replacement",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }


def pregunta_minimo_edad_piloto():
    if LANG == "es":
        return {
            "question": "¿Cuál es la edad mínima para competir en Fórmula 1?",
            "answers": ["18 años", "16 años", "21 años", "No hay límite"],
            "correctAnswer": "18 años",
            "knowledgeLevel": 1,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the minimum age to compete in Formula 1?",
            "answers": ["18 years", "16 years", "21 years", "There is no limit"],
            "correctAnswer": "18 years",
            "knowledgeLevel": 1,
            "category": "Drivers",
            "language": LANG
        }


def pregunta_superlicencia():
    if LANG == "es":
        return {
            "question": "¿Qué documento necesita un piloto para competir en F1?",
            "answers": [
                "Superlicencia otorgada por la FIA",
                "Carnet de conducir internacional",
                "Licencia nacional",
                "Certificado de equipo"
            ],
            "correctAnswer": "Superlicencia otorgada por la FIA",
            "knowledgeLevel": 1,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What document does a driver need to compete in F1?",
            "answers": [
                "Super Licence issued by the FIA",
                "International driving license",
                "National racing license",
                "Team certificate"
            ],
            "correctAnswer": "Super Licence issued by the FIA",
            "knowledgeLevel": 1,
            "category": "Drivers",
            "language": LANG
        }


def pregunta_puntos_superlicencia():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto acumula 12 puntos en su superlicencia en 12 meses?",
            "answers": [
                "Es suspendido por una carrera",
                "Pierde 10 posiciones en parrilla",
                "Debe pagar una multa",
                "Es excluido de la temporada"
            ],
            "correctAnswer": "Es suspendido por una carrera",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver accumulates 12 penalty points on their super licence in 12 months?",
            "answers": [
                "They are suspended for one race",
                "They lose 10 grid positions",
                "They must pay a fine",
                "They are excluded from the season"
            ],
            "correctAnswer": "They are suspended for one race",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }


def pregunta_cambio_numero():
    if LANG == "es":
        return {
            "question": "¿Puede un piloto cambiar su número durante la temporada?",
            "answers": [
                "No, debe mantenerlo todo el año",
                "Sí, si cambia de equipo",
                "Solo una vez",
                "Solo con aprobación de los comisarios"
            ],
            "correctAnswer": "No, debe mantenerlo todo el año",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver change their number during the season?",
            "answers": [
                "No, it must be kept all year",
                "Yes, if switching teams",
                "Only once",
                "Only with stewards' approval"
            ],
            "correctAnswer": "No, it must be kept all year",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }


def pregunta_duracion_contrato():
    if LANG == "es":
        return {
            "question": "¿Quién regula la duración del contrato de un piloto?",
            "answers": [
                "Es una cuestión entre equipo y piloto",
                "La FIA",
                "El promotor del campeonato",
                "El director de carrera"
            ],
            "correctAnswer": "Es una cuestión entre equipo y piloto",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Who regulates the duration of a driver's contract?",
            "answers": [
                "It’s an agreement between team and driver",
                "The FIA",
                "The championship promoter",
                "The race director"
            ],
            "correctAnswer": "It’s an agreement between team and driver",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }


def pregunta_uso_mismo_coche():
    if LANG == "es":
        return {
            "question": "¿Puede un segundo piloto usar el coche de otro piloto en el mismo evento?",
            "answers": [
                "No, salvo autorización expresa de los comisarios",
                "Sí, siempre que esté libre",
                "Solo si el otro piloto abandona",
                "Sí, en la última sesión"
            ],
            "correctAnswer": "No, salvo autorización expresa de los comisarios",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a second driver use another driver's car in the same event?",
            "answers": [
                "No, unless expressly authorized by the stewards",
                "Yes, if the car is available",
                "Only if the other driver retires",
                "Yes, during the last session"
            ],
            "correctAnswer": "No, unless expressly authorized by the stewards",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }


def pregunta_test_jovenes():
    if LANG == "es":
        return {
            "question": "¿Qué es un test de jóvenes pilotos?",
            "answers": [
                "Una sesión oficial para pilotos con poca experiencia en F1",
                "Un test libre para cualquier piloto",
                "Un simulacro de carrera en lluvia",
                "Una prueba de seguridad"
            ],
            "correctAnswer": "Una sesión oficial para pilotos con poca experiencia en F1",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is a young drivers' test?",
            "answers": [
                "An official session for drivers with little F1 experience",
                "An open test for any driver",
                "A simulated race in wet conditions",
                "A safety test"
            ],
            "correctAnswer": "An official session for drivers with little F1 experience",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_sustitucion_urgente():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto debe ser sustituido de forma urgente?",
            "answers": [
                "El equipo puede proponer un piloto con autorización de la FIA",
                "Debe competir un solo coche",
                "Se anula la inscripción",
                "El evento se suspende"
            ],
            "correctAnswer": "El equipo puede proponer un piloto con autorización de la FIA",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver must be urgently replaced?",
            "answers": [
                "The team may propose a driver with FIA approval",
                "The team must compete with only one car",
                "Entry is canceled",
                "The event is suspended"
            ],
            "correctAnswer": "The team may propose a driver with FIA approval",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_debut_f1():
    if LANG == "es":
        return {
            "question": "¿Qué debe cumplir un piloto para debutar en F1?",
            "answers": [
                "Tener superlicencia y experiencia previa en categorías menores",
                "Participar en tres sesiones de práctica",
                "Haber ganado un campeonato regional",
                "Contar con aprobación de equipo rival"
            ],
            "correctAnswer": "Tener superlicencia y experiencia previa en categorías menores",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a driver fulfill to debut in F1?",
            "answers": [
                "Hold a super licence and have previous experience in lower categories",
                "Participate in three practice sessions",
                "Have won a regional championship",
                "Be approved by a rival team"
            ],
            "correctAnswer": "Hold a super licence and have previous experience in lower categories",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }



generadores_por_categoria = {
    "Scores": [
        pregunta_puntuacion_diez_puntos,
        pregunta_licencia_12_puntos,
        pregunta_puntuacion_segundo_clasificado,
        pregunta_puntuacion_quinto_clasificado,
        pregunta_puntos_reducidos_condiciones,
        pregunta_puntos_mitad_carrera,
        pregunta_puntos_victoria_sprint,
        pregunta_equipo_1y2,
        pregunta_puntos_octavo_sprint,
        pregunta_puntos_bandera_roja,
        pregunta_puntos_sprint
    ],
    "Penalty": [
        pregunta_sancion_pit_lane,
        pregunta_penalizacion_5_segundos,
        pregunta_penalizacion_10_segundos,
        pregunta_parque_cerrado_infraccion,
        pregunta_drive_through,
        pregunta_stop_and_go,
        pregunta_peso_minimo,
        pregunta_aleron_ilegal,
        pregunta_bandera_azul,
        pregunta_repostaje_irregular,
        pregunta_penalizacion_componentes
    ],
    "Procedures": [
        pregunta_final_vuelta_formacion,
        pregunta_no_arranca_parrilla,
        pregunta_segunda_vuelta_formacion,
        pregunta_coche_detiene_parrilla,
        pregunta_salida_abortada,
        pregunta_inicio_carrera,
        pregunta_salida_pitlane_parrilla,
        pregunta_cierre_pitlane,
        pregunta_boxes_vuelta_formacion,
        pregunta_luces_salida,
        pregunta_activacion_drs,
        pregunta_vuelta_formacion
    ],
    "ParcFerme": [
        pregunta_inicio_parque_cerrado,
        pregunta_final_parque_cerrado,
        pregunta_autorizacion_modificaciones,
        pregunta_motivo_sancion_pc,
        pregunta_tipo_modificaciones_permitidas,
        pregunta_sustitucion_componentes_pc,
        pregunta_reparaciones_durante_pc,
        pregunta_objetivo_parque_cerrado,
        pregunta_parque_cerrado_despues_sprint,
        pregunta_comunicacion_violacion_pc,
        pregunta_fin_parque_cerrado
    ],
    "Safety": [
        pregunta_doble_bandera_amarilla,
        pregunta_bandera_roja_seguridad,
        pregunta_bandera_amarilla_simple,
        pregunta_bandera_azul_significado,
        pregunta_bandera_blanca,
        pregunta_bandera_negra,
        pregunta_luces_pit_lane,
        pregunta_bandera_a_cuadros,
        pregunta_bandera_negra_naranja,
        pregunta_bandera_verde,
        pregunta_velocidad_pitlane
    ],
    "Tyres": [
        pregunta_uso_dos_compuestos,
        pregunta_tipo_compuestos_drs,
        pregunta_neumaticos_clasificacion,
        pregunta_compuestos_lluvia,
        pregunta_uso_intermedios,
        pregunta_restriccion_uso_neumaticos,
        pregunta_asignacion_neumaticos,
        pregunta_pit_stop_neumaticos,
        pregunta_neumaticos_sprint,
        pregunta_marca_colores_neumaticos,
        pregunta_neumaticos_compuestos,
        pregunta_neumaticos_disponibles
    ],
    "SafetyCar": [
        pregunta_salida_safety_car,
        pregunta_regreso_boxes_safety_car,
        pregunta_condiciones_vsc,
        pregunta_adelantamientos_safety_car,
        pregunta_salida_safety_car_linea,
        pregunta_tiempos_vsc,
        pregunta_vuelta_lanzada,
        pregunta_coche_doblado_safety_car,
        pregunta_bandera_verde_post_sc,
        pregunta_vsc_significado,
        pregunta_safety_car
    ],
    "Qualifying": [
        pregunta_formato_clasificacion,
        pregunta_duracion_q3,
        pregunta_orden_salida_clasificacion,
        pregunta_tiempos_q1_eliminacion,
        pregunta_prohibiciones_clasificacion,
        pregunta_autorizacion_participacion_fuera_107,
        pregunta_influencia_sanciones_clasificacion,
        pregunta_mas_de_un_tiempo,
        pregunta_uso_neumaticos_q3,
        pregunta_regla_107_por_ciento,
        pregunta_sesiones_clasificacion
    ],
    "Sprint": [
        pregunta_duracion_sprint,
        pregunta_objetivo_sprint,
        pregunta_compuestos_sprint,
        pregunta_parrilla_gp,
        pregunta_neumaticos_ss,
        pregunta_vuelta_lanzada_sprint,
        pregunta_penalizaciones_sprint,
        pregunta_dia_sprint_shootout,
        pregunta_orden_salida_sprint
    ],
    "RedFlag": [
        pregunta_bandera_roja,
        pregunta_fin_bandera_roja,
        pregunta_duracion_maxima_suspension,
        pregunta_motivo_bandera_roja,
        pregunta_posiciones_bandera_roja,
        pregunta_pitlane_durante_roja,
        pregunta_pilotos_vehiculos_roja,
        pregunta_comunicacion_bandera_roja,
        pregunta_obligaciones_durante_roja,
        pregunta_modificacion_setup_roja,
        pregunta_bandera_roja_suspension
    ],
    "Drivers": [
        pregunta_minimo_edad_piloto,
        pregunta_superlicencia,
        pregunta_puntos_superlicencia,
        pregunta_cambio_numero,
        pregunta_duracion_contrato,
        pregunta_uso_mismo_coche,
        pregunta_test_jovenes,
        pregunta_sustitucion_urgente,
        pregunta_debut_f1,
        pregunta_cambio_piloto,
        pregunta_reemplazo_piloto,
        pregunta_revision_postcarrera
    ],
    "Technical": [
        pregunta_verificacion_tecnica,
        pregunta_modificaciones_parque_cerrado,
        pregunta_bandera_amarilla_doble,
        pregunta_modificaciones_bandera_roja
    ],
    "PracticalCase": [
        caso_reincorporacion_peligrosa,
        caso_bandera_roja_pista_bloqueada,
        caso_exceso_velocidad_pitlane,
        caso_neumatico_incorrecto_clasificacion,
        caso_orden_reinicio_bandera_roja,
        caso_adelantar_tras_safety_car
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
        generadores_seleccionados = random.sample(generadores, min(10, len(generadores)))
        for gen in generadores_seleccionados:
            p = gen()
            if p:
                p = barajar_respuestas(p)
                preguntas.append(p)
    return preguntas

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


