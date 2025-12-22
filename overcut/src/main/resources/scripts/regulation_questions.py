
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
            "question": "¿Qué define el orden de salida de la carrera sprint según el reglamento?",
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
            "question": "What determines the starting order of the sprint race according to the regulations?",
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
            "question": "Un coche entra al pit lane y no respeta el límite de velocidad. ¿Qué puede suceder según el reglamento?",
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
            "question": "A car enters the pit lane and exceeds the speed limit. What can happen according to the regulations?",
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
    # 2026: el concepto relevante en el reglamento deportivo es Driver Adjustable Bodywork (con Activation Zones),
    # no “DRS tras 2 vueltas y a <1s”.
    if LANG == "es":
        return {
            "question": "¿Cuándo está permitido que el piloto active la aerodinámoica activa desde 2026?",
            "answers": [
                "Solo cuando el coche está parado o dentro de una Activation Zone, y si el sistema está habilitado por la electrónica",
                "En cualquier momento de la carrera desde la salida, sin restricciones de zona",
                "Únicamente en clasificación, nunca en carrera",
                "Después de 10 vueltas, siempre que esté a menos de un segundo del coche de delante"
            ],
            "correctAnswer": "Solo cuando el coche está parado o dentro de una Activation Zone, y si el sistema está habilitado por la electrónica",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is a driver allowed to activate Driver Adjustable Bodywork from 2026 onwards?",
            "answers": [
                "Only when the car is stationary or inside an Activation Zone, and if the system is enabled via the control electronics",
                "At any time from the start with no zone restrictions",
                "Only in qualifying, never in the race",
                "After 10 laps, provided they are within one second of the car ahead"
            ],
            "correctAnswer": "Only when the car is stationary or inside an Activation Zone, and if the system is enabled via the control electronics",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_override_mode_condicion_uso():
    if LANG == "es":
        return {
            "question": "Durante una TTCS, ¿cuándo puede el piloto usar el Override Mode (modo 'overtake/boost')?",
            "answers": [
                "Cuando se activa en la Activation Line y el coche estaba a menos del Detection Gap en la Detection Line",
                "Siempre que el piloto lo desee, sin depender de distancias ni líneas",
                "Solo si ha parado en boxes en las dos vueltas anteriores",
                "Únicamente en la primera vuelta tras la salida"
            ],
            "correctAnswer": "Cuando se activa en la Activation Line y el coche estaba a menos del Detection Gap en la Detection Line",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a TTCS, when may a driver use Override Mode ('overtake/boost' mode)?",
            "answers": [
                "When it is activated at the Activation Line and the car was less than the Detection Gap behind at the Detection Line",
                "Any time the driver wants, with no distance/line conditions",
                "Only if they pitted in the previous two laps",
                "Only on the first lap after the start"
            ],
            "correctAnswer": "When it is activated at the Activation Line and the car was less than the Detection Gap behind at the Detection Line",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_override_mode_desactivacion_gap():
    if LANG == "es":
        return {
            "question": "¿Cuándo se desactiva el Override Mode en una TTCS si el piloto ya lo llevaba activado?",
            "answers": [
                "Al cruzar la Activation Line si en la Detection Line estaba a más del Detection Gap del coche precedente",
                "En cuanto el piloto frena por primera vez, siempre",
                "Solo cuando el Race Director lo anuncia por radio",
                "Al completar exactamente 10 segundos de uso"
            ],
            "correctAnswer": "Al cruzar la Activation Line si en la Detection Line estaba a más del Detection Gap del coche precedente",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is Override Mode deactivated in a TTCS if it was already active?",
            "answers": [
                "When crossing the Activation Line if the car was greater than the Detection Gap at the Detection Line",
                "As soon as the driver brakes for the first time, always",
                "Only when Race Control announces it by radio",
                "After exactly 10 seconds of use"
            ],
            "correctAnswer": "When crossing the Activation Line if the car was greater than the Detection Gap at the Detection Line",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_override_mode_recharge_harvesting():
    if LANG == "es":
        return {
            "question": "Respecto al 'recharge' (energía recuperada), ¿qué información/limitaciones debe proporcionar la FIA antes de un GP sobre el ERS-K?",
            "answers": [
                "Límites de energía recuperable por vuelta (incluyendo condiciones con Override Mode) y parámetros como Detection Gap/Detection Line/Activation Line",
                "Únicamente el compuesto de neumáticos obligatorio para carrera",
                "Solo el número máximo de vueltas de formación",
                "La lista de penalizaciones estándar por adelantamientos"
            ],
            "correctAnswer": "Límites de energía recuperable por vuelta (incluyendo condiciones con Override Mode) y parámetros como Detection Gap/Detection Line/Activation Line",
            "knowledgeLevel": 4,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Regarding 'recharge' (harvested energy), what information/limits must the FIA provide before a GP about the ERS-K?",
            "answers": [
                "Per-lap harvest limits (including cases involving Override Mode) and parameters such as Detection Gap/Detection Line/Activation Line",
                "Only the mandatory race tyre compound",
                "Only the maximum number of formation laps",
                "A standard list of overtaking penalties"
            ],
            "correctAnswer": "Per-lap harvest limits (including cases involving Override Mode) and parameters such as Detection Gap/Detection Line/Activation Line",
            "knowledgeLevel": 4,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_override_mode_safety_car():
    if LANG == "es":
        return {
            "question": "¿Cuándo NO puede usarse el Override Mode durante un periodo de Safety Car?",
            "answers": [
                "Desde que se despliega el Safety Car hasta cruzar la Activation Line después de que el Safety Car entre en el pit lane",
                "Solo en la vuelta de salida; después siempre se puede",
                "Nunca se prohíbe: Override Mode sigue activo bajo Safety Car",
                "Solo se prohíbe si está lloviendo, pero no por Safety Car"
            ],
            "correctAnswer": "Desde que se despliega el Safety Car hasta cruzar la Activation Line después de que el Safety Car entre en el pit lane",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When may Override Mode NOT be used during a Safety Car period?",
            "answers": [
                "From SC deployment until crossing the Activation Line after the SC has returned to the pit lane",
                "Only on lap 1; afterwards it is always allowed",
                "It is never forbidden: Override Mode remains active under SC",
                "Only forbidden in the wet, not because of SC"
            ],
            "correctAnswer": "From SC deployment until crossing the Activation Line after the SC has returned to the pit lane",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_aerodinamica_activa_definicion():
    if LANG == "es":
        return {
            "question": "¿Qué se entiende por aerodinámica activa en la Fórmula 1?",
            "answers": [
                "Sistemas del coche cuya configuración aerodinámica puede modificarse durante la marcha bajo condiciones reglamentadas",
                "Elementos aerodinámicos que cambian automáticamente con la velocidad sin control del piloto",
                "Piezas intercambiables entre sesiones",
                "Componentes aerodinámicos que solo se ajustan en boxes"
            ],
            "correctAnswer": "Sistemas del coche cuya configuración aerodinámica puede modificarse durante la marcha bajo condiciones reglamentadas",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is meant by active aerodynamics in Formula 1?",
            "answers": [
                "Car systems whose aerodynamic configuration can be modified while running under regulated conditions",
                "Aerodynamic elements that automatically change with speed without driver control",
                "Parts that can be swapped between sessions",
                "Aerodynamic components adjusted only in the pit lane"
            ],
            "correctAnswer": "Car systems whose aerodynamic configuration can be modified while running under regulated conditions",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_driver_adjustable_bodywork_definicion():
    if LANG == "es":
        return {
            "question": "¿Qué es el Driver Adjustable Bodywork según el reglamento?",
            "answers": [
                "Un sistema que permite al piloto modificar ciertas superficies aerodinámicas cuando el reglamento lo permite",
                "Un alerón móvil utilizado únicamente en clasificación",
                "Un sistema automático que se activa por velocidad",
                "Un dispositivo exclusivo para condiciones de lluvia"
            ],
            "correctAnswer": "Un sistema que permite al piloto modificar ciertas superficies aerodinámicas cuando el reglamento lo permite",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is Driver Adjustable Bodywork according to the regulations?",
            "answers": [
                "A system allowing the driver to modify certain aerodynamic surfaces when permitted by the regulations",
                "A movable wing used only in qualifying",
                "An automatic system activated by speed",
                "A device exclusive to wet conditions"
            ],
            "correctAnswer": "A system allowing the driver to modify certain aerodynamic surfaces when permitted by the regulations",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_override_mode_definicion():
    if LANG == "es":
        return {
            "question": "¿Cuál es el objetivo principal del Override Mode?",
            "answers": [
                "Facilitar adelantamientos mediante una configuración aerodinámica y energética más favorable",
                "Aumentar la velocidad máxima sin restricciones",
                "Sustituir al Safety Car en neutralizaciones",
                "Reducir el consumo total de energía"
            ],
            "correctAnswer": "Facilitar adelantamientos mediante una configuración aerodinámica y energética más favorable",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main purpose of Override Mode?",
            "answers": [
                "To facilitate overtaking through a more favorable aerodynamic and energy configuration",
                "To increase top speed without restrictions",
                "To replace the Safety Car during neutralizations",
                "To reduce total energy consumption"
            ],
            "correctAnswer": "To facilitate overtaking through a more favorable aerodynamic and energy configuration",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }


def pregunta_recharge_mode_definicion():
    if LANG == "es":
        return {
            "question": "¿Qué se entiende por modo de recarga (harvesting/recharge) en el reglamento?",
            "answers": [
                "El proceso mediante el cual el sistema híbrido recupera energía para su uso posterior",
                "Un modo de máxima potencia para adelantamientos",
                "Una configuración exclusiva para vueltas de salida",
                "Un sistema de recarga externa en boxes"
            ],
            "correctAnswer": "El proceso mediante el cual el sistema híbrido recupera energía para su uso posterior",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is meant by recharge (harvesting) mode under the regulations?",
            "answers": [
                "The process by which the hybrid system recovers energy for later use",
                "A maximum power mode for overtaking",
                "A configuration exclusive to formation laps",
                "An external recharging system in the pit lane"
            ],
            "correctAnswer": "The process by which the hybrid system recovers energy for later use",
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
                "Zona de adelantamiento desactivada",
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
                "Overtake zone deactivated",
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
            "answers": ["Puede recibir una sanción por bloquear a otro coche", "Pierde automáticamente una vuelta", "Se le ordena abandonar la carrera", "Debe dejar de usar overtake"],
            "correctAnswer": "Puede recibir una sanción por bloquear a otro coche",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver ignores a blue flag?",
            "answers": ["They may be penalized for blocking another car", "They automatically lose a lap", "They are ordered to retire", "They must stop using overtake"],
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
            "answers": ["Detenerse en su posición de parrilla", "Entrar a boxes", "Activar el overtake", "Cambiar neumáticos"],
            "correctAnswer": "Detenerse en su posición de parrilla",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a driver do at the end of the formation lap?",
            "answers": ["Stop at their grid position", "Enter the pit lane", "Activate the overtake mode", "Change tyres"],
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
            "answers": ["Obstaculizar a otro piloto", "Usar overtake", "Cambiar de compuesto", "Pasar por boxes"],
            "correctAnswer": "Obstaculizar a otro piloto",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is prohibited during a flying lap in qualifying?",
            "answers": ["Blocking another driver", "Using overtake", "Changing compound", "Going through the pit lane"],
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
            "answers": ["Sí, puede hacer varias vueltas rápidas", "No, solo una vuelta rápida por sesión", "Solo si no ha usado overtake", "Depende del compuesto usado"],
            "correctAnswer": "Sí, puede hacer varias vueltas rápidas",
            "knowledgeLevel": 1,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver set more than one lap time per session?",
            "answers": ["Yes, multiple fast laps are allowed", "No, only one flying lap per session", "Only if overtake mode was not used", "Depends on the compound used"],
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
            "correctAnswer": "Viernes",
            "knowledgeLevel": 1,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "On what day is the Sprint Shootout held during a sprint weekend?",
            "answers": ["Saturday", "Sunday", "Friday", "Depends on the circuit"],
            "correctAnswer": "Friday",
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
                "Según la clasificación del sábado",
                "Según el resultado de la Sprint",
                "Por orden inverso a la Sprint",
                "Por puntos en el campeonato"
            ],
            "correctAnswer": "Según la clasificación del sábado",
            "knowledgeLevel": 2,
            "category": "Sprint",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is the Grand Prix grid determined during a Sprint weekend?",
            "answers": [
                "Based on Saturday's qualifying",
                "Based on the Sprint result",
                "Reverse order of the Sprint",
                "Championship points standings"
            ],
            "correctAnswer": "Based on Saturday's qualifying",
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

def pregunta_reemplazo_componentes_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si se reemplaza una pieza sin autorización durante el parque cerrado?",
            "answers": [
                "El coche puede ser descalificado de la sesión",
                "Se permite sin penalización",
                "El coche debe salir desde boxes",
                "Se resta tiempo de clasificación"
            ],
            "correctAnswer": "El coche puede ser descalificado de la sesión",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a part is replaced without authorization during parc fermé?",
            "answers": [
                "The car may be disqualified from the session",
                "It is allowed without penalty",
                "The car must start from the pit lane",
                "Qualifying time is subtracted"
            ],
            "correctAnswer": "The car may be disqualified from the session",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
def pregunta_reemplazo_piloto_despues_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si se cambia de piloto después de la clasificación?",
            "answers": [
                "El coche debe salir desde el pit lane",
                "No hay consecuencias si el nuevo piloto tiene superlicencia",
                "Solo se permite en caso de fuerza mayor",
                "El equipo pierde todos los puntos del evento"
            ],
            "correctAnswer": "El coche debe salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver is changed after qualifying?",
            "answers": [
                "The car must start from the pit lane",
                "There are no consequences if the new driver holds a super license",
                "Only allowed in case of force majeure",
                "The team loses all points from the event"
            ],
            "correctAnswer": "The car must start from the pit lane",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_dimensiones_vehiculo():
    if LANG == "es":
        return {
            "question": "A partir de 2026, ¿cuál es la anchura máxima del coche (excluyendo retrovisores y neumáticos)?",
            "answers": ["1.900 mm", "2.000 mm", "1.800 mm", "1.950 mm"],
            "correctAnswer": "1.900 mm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "From 2026 onwards, what is the maximum car width (excluding mirrors and tyres)?",
            "answers": ["1,900 mm", "2,000 mm", "1,800 mm", "1,950 mm"],
            "correctAnswer": "1,900 mm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_peso_combustible_postcarrera():
    if LANG == "es":
        return {
            "question": "¿Qué volumen de muestra de combustible debe poder tomarse del coche en cualquier momento de la competición?",
            "answers": ["0,70 litros", "1,00 litros", "0,50 litros", "0,25 litros"],
            "correctAnswer": "0,70 litros",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What fuel sample volume must be possible to take from the car at any time during the Competition?",
            "answers": ["0.70 litres", "1.00 litres", "0.50 litres", "0.25 litres"],
            "correctAnswer": "0.70 litres",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_refueling_rate():
    if LANG == "es":
        return {
            "question": "Desde 2026, en operaciones de repostaje en garaje, ¿cuál es la tasa máxima a la que se puede repostar o extraer combustible del coche?",
            "answers": ["0,8 litros por segundo", "1,0 litros por segundo", "0,5 litros por segundo", "2,0 litros por segundo"],
            "correctAnswer": "0,8 litros por segundo",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Since 2026, during garage refuelling operations, what is the maximum rate at which fuel may be added to or removed from the car?",
            "answers": ["0.8 litres per second", "1.0 litres per second", "0.5 litres per second", "2.0 litres per second"],
            "correctAnswer": "0.8 litres per second",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_monoplaza_ers():
    if LANG == "es":
        return {
            "question": "¿Qué elemento forma parte del ERS definido en el reglamento técnico?",
            "answers": ["MGU-K y Energy Store", "MGU-H y KERS mecánico", "Turbocompresor y wastegate", "Intercooler y radiador de aceite"],
            "correctAnswer": "MGU-K y Energy Store",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which items are part of the ERS as defined in the Technical Regulations?",
            "answers": ["MGU-K and the Energy Store", "MGU-H and a mechanical KERS", "Turbocharger and wastegate", "Intercooler and oil radiator"],
            "correctAnswer": "MGU-K and the Energy Store",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }


def pregunta_mguk_potencia_maxima():
    if LANG == "es":
        return {
            "question": "¿Cuál es la potencia máxima permitida del MGU-K?",
            "answers": ["350 kW", "120 kW", "500 kW", "200 kW"],
            "correctAnswer": "350 kW",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted MGU-K?",
            "answers": ["350 kW", "120 kW", "500 kW", "200 kW"],
            "correctAnswer": "350 kW",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }


def pregunta_mguk_velocidad_minima_uso():
    if LANG == "es":
        return {
            "question": "¿A partir de qué velocidad del coche puede usarse el MGU-K (en un arranque/lanzamiento)?",
            "answers": ["50 km/h", "0 km/h", "80 km/h", "20 km/h"],
            "correctAnswer": "50 km/h",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "From what car speed may the MGU-K be used (during a start/launch)?",
            "answers": ["50 km/h", "0 km/h", "80 km/h", "20 km/h"],
            "correctAnswer": "50 km/h",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }


def pregunta_mguk_par_maximo():
    if LANG == "es":
        return {
            "question": "¿Cuál es el par máximo permitido del MGU-K (en el eje de salida del MGU-K)?",
            "answers": ["500 Nm", "300 Nm", "650 Nm", "1200 Nm"],
            "correctAnswer": "500 Nm",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted MGU-K torque (at the MGU-K output shaft)?",
            "answers": ["500 Nm", "300 Nm", "650 Nm", "1200 Nm"],
            "correctAnswer": "500 Nm",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_mguk_rpm_maximo():
    if LANG == "es":
        return {
            "question": "¿Cuál es la velocidad de giro máxima permitida del MGU-K (valor límite típico especificado)?",
            "answers": ["60.000 rpm", "100.000 rpm", "15.000 rpm", "30.000 rpm"],
            "correctAnswer": "60.000 rpm",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted rotational speed of the MGU-K (typical specified limit)?",
            "answers": ["60,000 rpm", "100,000 rpm", "15,000 rpm", "30,000 rpm"],
            "correctAnswer": "60,000 rpm",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }


def pregunta_energia_recuperada_por_vuelta():
    if LANG == "es":
        return {
            "question": "Desde 2026, ¿cuál es el máximo de energía que el MGU-K puede recuperar desde el eje trasero por vuelta (límite por vuelta)?",
            "answers": ["8,5 MJ", "2,0 MJ", "12,0 MJ", "20,0 MJ"],
            "correctAnswer": "8,5 MJ",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Since 2026, what is the maximum energy the MGU-K may recover from the rear axle per lap (per-lap limit)?",
            "answers": ["8.5 MJ", "2.0 MJ", "12.0 MJ", "20.0 MJ"],
            "correctAnswer": "8.5 MJ",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_flujo_energia_combustible():
    if LANG == "es":
        return {
            "question": "¿Cuál es el límite máximo del ‘Fuel Energy Flow’ (flujo de energía del combustible) para la unidad de potencia?",
            "answers": ["3000 MJ/h", "2000 MJ/h", "4000 MJ/h", "1500 MJ/h"],
            "correctAnswer": "3000 MJ/h",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum ‘Fuel Energy Flow’ limit for the power unit?",
            "answers": ["3000 MJ/h", "2000 MJ/h", "4000 MJ/h", "1500 MJ/h"],
            "correctAnswer": "3000 MJ/h",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_spark_energy_maxima():
    if LANG == "es":
        return {
            "question": "¿Cuál es la energía máxima permitida por chispa (spark energy) en el sistema de encendido?",
            "answers": ["120 mJ", "200 mJ", "50 mJ", "500 mJ"],
            "correctAnswer": "120 mJ",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted spark energy per ignition event?",
            "answers": ["120 mJ", "200 mJ", "50 mJ", "500 mJ"],
            "correctAnswer": "120 mJ",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_modo_ice_unico():
    if LANG == "es":
        return {
            "question": "Salvo entrenamientos libres, ¿cómo debe operarse el motor de combustión (ICE) durante cada vuelta competitiva?",
            "answers": [
                "En un único modo de ICE durante cada vuelta competitiva",
                "Con modos ilimitados siempre que no cambie la mezcla de combustible",
                "Con al menos dos mapas distintos por vuelta para mejorar seguridad",
                "Con cambios de modo solo permitidos en rectas"
            ],
            "correctAnswer": "En un único modo de ICE durante cada vuelta competitiva",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Except free practice, how must the ICE be operated during each competitive lap?",
            "answers": [
                "In a single ICE mode during each competitive lap",
                "With unlimited modes as long as fuel mixture does not change",
                "With at least two different maps per lap for safety reasons",
                "With mode changes allowed only on straights"
            ],
            "correctAnswer": "In a single ICE mode during each competitive lap",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_numero_depositos_aceite():
    if LANG == "es":
        return {
            "question": "¿Cuántos depósitos de aceite (Oil Tank) se permiten en el coche según el reglamento técnico?",
            "answers": ["Uno solo", "Dos (principal y auxiliar)", "Ilimitados si están dentro del perímetro de PU", "Uno por cada radiador de aceite"],
            "correctAnswer": "Uno solo",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many oil tanks are permitted on the car under the Technical Regulations?",
            "answers": ["A single one", "Two (main and auxiliary)", "Unlimited if inside the PU perimeter", "One per oil cooler"],
            "correctAnswer": "A single one",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_valvula_alivio_refrigerante():
    if LANG == "es":
        return {
            "question": "¿A qué presión máxima debe estar ajustada la válvula de alivio (pressure relief valve) de un header tank del refrigerante?",
            "answers": ["3,75 barG", "2,00 barG", "5,00 barG", "10,00 barG"],
            "correctAnswer": "3,75 barG",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "To what maximum pressure must the coolant header tank pressure relief valve be set?",
            "answers": ["3.75 barG", "2.00 barG", "5.00 barG", "10.00 barG"],
            "correctAnswer": "3.75 barG",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_combustible_temperatura():
    if LANG == "es":
        return {
            "question": "Cuando el coche está rodando tras salir del garaje, ¿qué regla resume mejor el límite de temperatura del combustible en el coche?",
            "answers": [
                "No puede estar más frío que el menor de: 10°C por debajo de ambiente o 10°C",
                "Debe estar siempre a 30°C constantes para estabilidad de densidad",
                "Puede ser enfriado activamente si no supera el flujo máximo de combustible",
                "Debe estar al menos 15°C por encima de la temperatura ambiente"
            ],
            "correctAnswer": "No puede estar más frío que el menor de: 10°C por debajo de ambiente o 10°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Once the car is running after leaving the garage area, which rule best summarises the fuel temperature limit in the car?",
            "answers": [
                "It must not be colder than the lower of: 10°C below ambient or 10°C",
                "It must always be a constant 30°C for density stability",
                "It may be actively cooled provided maximum fuel flow is respected",
                "It must be at least 15°C above ambient temperature"
            ],
            "correctAnswer": "It must not be colder than the lower of: 10°C below ambient or 10°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_dispositivo_temperatura_combustible():
    if LANG == "es":
        return {
            "question": "¿Qué dice el reglamento sobre dispositivos a bordo para aumentar o disminuir la temperatura del combustible?",
            "answers": [
                "Están prohibidos",
                "Son obligatorios para evitar vaporización",
                "Se permiten solo en clasificación",
                "Se permiten si el combustible es 100% sostenible"
            ],
            "correctAnswer": "Están prohibidos",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What do the rules say about on-board devices to increase or decrease fuel temperature?",
            "answers": [
                "They are forbidden",
                "They are mandatory to prevent vapour lock",
                "They are allowed only in qualifying",
                "They are allowed if the fuel is 100% sustainable"
            ],
            "correctAnswer": "They are forbidden",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_fuel_bladders_edad():
    if LANG == "es":
        return {
            "question": "¿Cuánto tiempo máximo puede usarse un ‘fuel bladder’ desde su fecha de fabricación?",
            "answers": ["5 años", "3 años", "10 años", "Ilimitado si pasa los crash tests"],
            "correctAnswer": "5 años",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum time a fuel bladder may be used after its date of manufacture?",
            "answers": ["5 years", "3 years", "10 years", "Unlimited if it passes crash tests"],
            "correctAnswer": "5 years",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_fuel_line_cockpit():
    if LANG == "es":
        return {
            "question": "¿Pueden pasar líneas que contengan combustible por el cockpit?",
            "answers": ["No, está prohibido", "Sí, si están blindadas", "Sí, solo en entrenamientos", "Sí, si son de material no metálico"],
            "correctAnswer": "No, está prohibido",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can fuel-carrying lines pass through the cockpit?",
            "answers": ["No, it is forbidden", "Yes, if they are shielded", "Yes, only in practice", "Yes, if made of non-metallic material"],
            "correctAnswer": "No, it is forbidden",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_breakaway_valve():
    if LANG == "es":
        return {
            "question": "¿Qué requisito se aplica a las líneas de combustible entre el depósito y el motor?",
            "answers": [
                "Deben tener una válvula auto-sellante de separación (breakaway valve)",
                "Deben pasar siempre por el cockpit para facilitar inspección",
                "Pueden ir sin válvula si usan conectores de titanio",
                "Deben ser rígidas en toda su longitud, sin tramos flexibles"
            ],
            "correctAnswer": "Deben tener una válvula auto-sellante de separación (breakaway valve)",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What requirement applies to fuel lines between the tank and the engine?",
            "answers": [
                "They must have a self-sealing breakaway valve",
                "They must always pass through the cockpit for inspection access",
                "They may omit the valve if titanium connectors are used",
                "They must be fully rigid with no flexible sections"
            ],
            "correctAnswer": "They must have a self-sealing breakaway valve",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_fuel_cell_presion_max():
    if LANG == "es":
        return {
            "question": "¿Cuál es la presión interna máxima que puede ejercer el sistema sobre el fuel bladder (presión en el interior del depósito)?",
            "answers": ["1,0 barG", "2,5 barG", "3,75 barG", "10,0 barG"],
            "correctAnswer": "1,0 barG",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum internal pressure exerted on the fuel bladder (tank internal pressure)?",
            "answers": ["1.0 barG", "2.5 barG", "3.75 barG", "10.0 barG"],
            "correctAnswer": "1.0 barG",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_fuel_tank_blader_standard():
    if LANG == "es":
        return {
            "question": "¿Cómo debe ser el depósito de combustible (fuel tank) según el reglamento técnico?",
            "answers": [
                "Un único ‘rubber bladder’ conforme (o superior) al estándar FIA FT5-1999",
                "Dos depósitos gemelos metálicos soldados con espuma obligatoria",
                "Un depósito rígido de carbono con ventilación libre al cockpit",
                "Un depósito flexible sin estándar FIA si la estructura del chasis lo protege"
            ],
            "correctAnswer": "Un único ‘rubber bladder’ conforme (o superior) al estándar FIA FT5-1999",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How must the fuel tank be built under the Technical Regulations?",
            "answers": [
                "A single rubber bladder conforming to (or exceeding) FIA Standard FT5-1999",
                "Two welded metal twin tanks with mandatory foam",
                "A rigid carbon tank with free venting into the cockpit",
                "A flexible tank without FIA standard if the chassis structure protects it"
            ],
            "correctAnswer": "A single rubber bladder conforming to (or exceeding) FIA Standard FT5-1999",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_oil_tank_sensor():
    if LANG == "es":
        return {
            "question": "¿Qué obligación existe sobre la medición del nivel de aceite en el Oil Tank?",
            "answers": [
                "Debe llevar un sensor y la medida debe suministrarse a la FIA en todo momento",
                "Es opcional si el equipo usa un único aceite homologado",
                "Solo se requiere en carrera, no en clasificación",
                "Se puede reemplazar por inspección visual entre sesiones"
            ],
            "correctAnswer": "Debe llevar un sensor y la medida debe suministrarse a la FIA en todo momento",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is required regarding oil level measurement in the oil tank?",
            "answers": [
                "It must have a sensor and the oil level measurement must be supplied to the FIA at all times",
                "It is optional if the team uses a single approved oil",
                "It is required only in the race, not in qualifying",
                "It can be replaced by visual checks between sessions"
            ],
            "correctAnswer": "It must have a sensor and the oil level measurement must be supplied to the FIA at all times",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_materiales_combustible_exotermicos():
    if LANG == "es":
        return {
            "question": "Además de los límites de composición, ¿qué prohíbe explícitamente el reglamento sobre el combustible respecto a reacciones químicas?",
            "answers": [
                "No debe contener sustancias capaces de reacción exotérmica en ausencia de oxígeno externo",
                "Debe incluir un compuesto exotérmico para facilitar el arranque en frío",
                "Debe permitir reacciones exotérmicas siempre que sean a baja presión",
                "Solo se prohíben reacciones endotérmicas durante la carrera"
            ],
            "correctAnswer": "No debe contener sustancias capaces de reacción exotérmica en ausencia de oxígeno externo",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Beyond composition limits, what does the regulation explicitly forbid regarding fuel chemical reactions?",
            "answers": [
                "It must contain no substance capable of exothermic reaction in the absence of external oxygen",
                "It must include an exothermic compound to aid cold starts",
                "Exothermic reactions are allowed as long as they occur at low pressure",
                "Only endothermic reactions are forbidden during the race"
            ],
            "correctAnswer": "It must contain no substance capable of exothermic reaction in the absence of external oxygen",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_oil_propiedades_flashpoint():
    if LANG == "es":
        return {
            "question": "¿Cuál es el punto de inflamación (flashpoint) máximo permitido para el aceite de motor según la tabla de propiedades?",
            "answers": ["93°C", "120°C", "60°C", "210°C"],
            "correctAnswer": "93°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum engine oil flashpoint allowed in the oil properties table?",
            "answers": ["93°C", "120°C", "60°C", "210°C"],
            "correctAnswer": "93°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_voltage_maximo_ers():
    if LANG == "es":
        return {
            "question": "¿Cuál es el voltaje DC máximo permitido en el sistema eléctrico de alto voltaje del ERS?",
            "answers": ["1000 V DC", "800 V DC", "120 V DC", "1500 V DC"],
            "correctAnswer": "1000 V DC",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted DC voltage in the ERS high-voltage electrical system?",
            "answers": ["1000 V DC", "800 V DC", "120 V DC", "1500 V DC"],
            "correctAnswer": "1000 V DC",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_fuel_oxigeno_pct():
    if LANG == "es":
        return {
            "question": "Desde 2026, ¿qué rango de porcentaje en masa de oxígeno (Oxygen wt%) se especifica para el combustible permitido?",
            "answers": ["6,70–7,10 wt%", "0,00–1,00 wt%", "2,00–3,00 wt%", "10,00–12,00 wt%"],
            "correctAnswer": "6,70–7,10 wt%",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Since 2026, what oxygen mass percentage (Oxygen wt%) range is specified for the permitted fuel?",
            "answers": ["6.70–7.10 wt%", "0.00–1.00 wt%", "2.00–3.00 wt%", "10.00–12.00 wt%"],
            "correctAnswer": "6.70–7.10 wt%",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }


def pregunta_fuel_sulphur_max():
    if LANG == "es":
        return {
            "question": "¿Cuál es el máximo de azufre (Sulphur) permitido en el combustible (mg/kg)?",
            "answers": ["10 mg/kg", "50 mg/kg", "100 mg/kg", "500 mg/kg"],
            "correctAnswer": "10 mg/kg",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted sulphur content in fuel (mg/kg)?",
            "answers": ["10 mg/kg", "50 mg/kg", "100 mg/kg", "500 mg/kg"],
            "correctAnswer": "10 mg/kg",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_componentes_combustible_no_sostenibles():
    if LANG == "es":
        return {
            "question": "¿Qué límite se aplica al paquete de aditivos/denaturantes de fuentes no sostenibles en el combustible final (concentración total combinada)?",
            "answers": ["1,0% m/m", "5,0% m/m", "0,1% m/m", "10,0% m/m"],
            "correctAnswer": "1,0% m/m",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What limit applies to the non-sustainable additive/denaturant package in the final blended fuel (total combined concentration)?",
            "answers": ["1.0% m/m", "5.0% m/m", "0.1% m/m", "10.0% m/m"],
            "correctAnswer": "1.0% m/m",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_aperturas_fuel_blader():
    if LANG == "es":
        return {
            "question": "¿Cuál es el área total máxima de aperturas permitida en el fuel bladder?",
            "answers": ["35.000 mm²", "10.000 mm²", "50.000 mm²", "100.000 mm²"],
            "correctAnswer": "35.000 mm²",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum total area of apertures permitted in the fuel bladder?",
            "answers": ["35,000 mm²", "10,000 mm²", "50,000 mm²", "100,000 mm²"],
            "correctAnswer": "35,000 mm²",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_componentes_mangueras_fuel_sampling():
    if LANG == "es":
        return {
            "question": "Si se usa una bomba externa para extraer combustible al tomar una muestra, ¿qué restricción clave se aplica a la manguera entre el coche y la bomba?",
            "answers": [
                "No debe exceder 2 m y debe ser de diámetro −3",
                "Debe ser de al menos 5 m para asegurar mezcla representativa",
                "Debe pasar por el cockpit para facilitar el acceso",
                "Debe ser de diámetro −10 para evitar cavitación"
            ],
            "correctAnswer": "No debe exceder 2 m y debe ser de diámetro −3",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If an external pump is used to remove fuel for sampling, what key restriction applies to the hose between the car and the pump?",
            "answers": [
                "It must not exceed 2 m and must be −3 in diameter",
                "It must be at least 5 m long to ensure a representative mix",
                "It must pass through the cockpit for easier access",
                "It must be −10 in diameter to avoid cavitation"
            ],
            "correctAnswer": "It must not exceed 2 m and must be −3 in diameter",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_lubricacion_componentes_pu():
    if LANG == "es":
        return {
            "question": "¿Qué afirmación describe mejor la restricción de lubricantes dentro del perímetro de la unidad de potencia (PU)?",
            "answers": [
                "Solo se permite una especificación de aceite, con excepciones limitadas (p.ej., hidráulico y fluido del ERS para funciones concretas)",
                "Se permiten tantas especificaciones de aceite como componentes tenga el motor",
                "El aceite puede mezclarse libremente con aditivos de combustible durante la carrera",
                "Solo se restringe el aceite del turbo; el resto de componentes son libres"
            ],
            "correctAnswer": "Solo se permite una especificación de aceite, con excepciones limitadas (p.ej., hidráulico y fluido del ERS para funciones concretas)",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which statement best describes the lubricant restriction within the power unit (PU) perimeter?",
            "answers": [
                "Only one oil specification is allowed, with limited exceptions (e.g., hydraulic fluid and ERS fluid for specific functions)",
                "As many oil specifications as engine components are allowed",
                "Oil may be freely mixed with fuel additives during the race",
                "Only the turbo oil is restricted; other components are unrestricted"
            ],
            "correctAnswer": "Only one oil specification is allowed, with limited exceptions (e.g., hydraulic fluid and ERS fluid for specific functions)",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_oil_tank_auxiliar_prohibido():
    if LANG == "es":
        return {
            "question": "¿Qué dice el reglamento sobre el uso de un depósito de aceite auxiliar (Auxiliary Oil Tank) u otras formas de almacenamiento extra de aceite?",
            "answers": [
                "No está permitido; solo se admite el depósito único definido",
                "Se permite un auxiliar si su volumen es menor de 1 litro",
                "Se permite en entrenamientos, pero no en clasificación ni carrera",
                "Se permite siempre que sea de material transparente para inspección"
            ],
            "correctAnswer": "No está permitido; solo se admite el depósito único definido",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What do the rules say about using an auxiliary oil tank or other extra forms of oil storage?",
            "answers": [
                "It is not permitted; only the single defined oil tank is allowed",
                "An auxiliary is allowed if its volume is under 1 litre",
                "It is allowed in practice but not in qualifying or the race",
                "It is allowed provided it is transparent for inspection"
            ],
            "correctAnswer": "It is not permitted; only the single defined oil tank is allowed",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_ers_transport_un383():
    if LANG == "es":
        return {
            "question": "¿Qué certificación de transporte debe compartirse con la FIA durante la homologación de cada especificación del Energy Store?",
            "answers": ["UN38.3", "ISO 9001", "FIA 8860-2018", "EN 228:2012"],
            "correctAnswer": "UN38.3",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What transport certification must be shared with the FIA during homologation of each Energy Store specification?",
            "answers": ["UN38.3", "ISO 9001", "FIA 8860-2018", "EN 228:2012"],
            "correctAnswer": "UN38.3",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_principio_cooling_latent_heat():
    if LANG == "es":
        return {
            "question": "¿Qué prohíbe el reglamento sobre los sistemas de refrigeración de la PU y el uso del calor latente de vaporización?",
            "answers": [
                "No pueden usar intencionalmente el calor latente de vaporización de ningún fluido excepto el combustible para la combustión normal",
                "Deben usar obligatoriamente el calor latente de un fluido auxiliar para enfriar admisión",
                "Se permite cualquier fluido siempre que no sea agua",
                "Solo se prohíbe en clasificación; en carrera está permitido"
            ],
            "correctAnswer": "No pueden usar intencionalmente el calor latente de vaporización de ningún fluido excepto el combustible para la combustión normal",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the regulation forbid about PU cooling systems and the intentional use of latent heat of vaporisation?",
            "answers": [
                "They must not intentionally use latent heat of vaporisation of any fluid except fuel for normal combustion",
                "They must mandatorily use an auxiliary fluid’s latent heat to cool the intake",
                "Any fluid is allowed as long as it is not water",
                "It is forbidden only in qualifying; in the race it is permitted"
            ],
            "correctAnswer": "They must not intentionally use latent heat of vaporisation of any fluid except fuel for normal combustion",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def pregunta_cooling_sistema_driver_heat_hazard():
    if LANG == "es":
        return {
            "question": "Si se declara ‘Heat Hazard’, ¿qué ocurre con los componentes del Driver Cooling System para Sprint o Carrera?",
            "answers": [
                "Deben estar instalados y el sistema debe ser funcional y disponible para el piloto",
                "Se prohíbe cualquier sistema de refrigeración del piloto por seguridad eléctrica",
                "Solo se permite si el coche está por debajo del peso mínimo",
                "Se permite únicamente en clasificación, no en carrera"
            ],
            "correctAnswer": "Deben estar instalados y el sistema debe ser funcional y disponible para el piloto",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If a ‘Heat Hazard’ is declared, what happens regarding the Driver Cooling System components for Sprint or Race?",
            "answers": [
                "They must be fitted and the system must be functional and available to the driver",
                "Any driver cooling system is forbidden due to electrical safety",
                "It is allowed only if the car is below minimum weight",
                "It is allowed only in qualifying, not in the race"
            ],
            "correctAnswer": "They must be fitted and the system must be functional and available to the driver",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_limite_bancos_prueba():
    if LANG == "es":
        return {
            "question": "Cuando se imponen controles y documentación sobre bancos/pruebas (dyno, sensores, etc.), ¿cuál es el objetivo técnico principal?",
            "answers": [
                "Evitar que se eludan límites de la PU y garantizar trazabilidad/verificación de parámetros críticos",
                "Aumentar el ruido de los motores para mejorar el espectáculo",
                "Permitir que cada equipo elija libremente el criterio de medición",
                "Eliminar por completo el uso de sensores obligatorios en la PU"
            ],
            "correctAnswer": "Evitar que se eludan límites de la PU y garantizar trazabilidad/verificación de parámetros críticos",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When controls and documentation are imposed on test benches and testing (dynos, sensors, etc.), what is the main technical objective?",
            "answers": [
                "Preventing circumvention of PU limits and ensuring traceability/verification of critical parameters",
                "Increasing engine noise to improve the show",
                "Allowing each team to freely choose measurement criteria",
                "Eliminating the use of mandatory PU sensors altogether"
            ],
            "correctAnswer": "Preventing circumvention of PU limits and ensuring traceability/verification of critical parameters",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def tecnica_repostaje_durante_carrera():
    if LANG == "es":
        return {
            "question": "¿Se puede añadir o retirar combustible del coche durante una carrera (Race)?",
            "answers": ["No, está prohibido", "Sí, pero solo bajo Safety Car", "Sí, si es menos de 5 litros", "Sí, siempre que sea en el pitlane"],
            "correctAnswer": "No, está prohibido",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is it permitted to add or remove fuel from the car during a race?",
            "answers": ["No, it is forbidden", "Yes, but only under Safety Car", "Yes, if it is less than 5 litres", "Yes, as long as it is in the pit lane"],
            "correctAnswer": "No, it is forbidden",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_presion_componentes_fuera_deposito():
    if LANG == "es":
        return {
            "question": "¿Qué regla aplica a componentes con combustible a más de 10 barG?",
            "answers": [
                "Deben estar situados fuera del fuel tank",
                "Deben estar dentro del fuel tank para minimizar longitud de tuberías",
                "Pueden estar en el cockpit si se aíslan térmicamente",
                "Solo se restringen por encima de 100 barG"
            ],
            "correctAnswer": "Deben estar situados fuera del fuel tank",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What rule applies to components containing fuel at more than 10 barG?",
            "answers": [
                "They must be located outside the fuel tank",
                "They must be inside the fuel tank to minimise pipe length",
                "They may be in the cockpit if thermally insulated",
                "They are restricted only above 100 barG"
            ],
            "correctAnswer": "They must be located outside the fuel tank",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_sensores_obligatorios_fuel_density():
    if LANG == "es":
        return {
            "question": "Al verificar muestras de combustible, ¿qué control de densidad se aplica típicamente durante la competición?",
            "answers": [
                "La densidad debe estar dentro de ±0,15% del valor anotado en el análisis de preaprobación",
                "La densidad es libre mientras el oxígeno esté entre 0% y 1%",
                "La densidad solo se controla si hay protesta de un equipo",
                "La densidad debe ser idéntica al valor del combustible de calle EN 228"
            ],
            "correctAnswer": "La densidad debe estar dentro de ±0,15% del valor anotado en el análisis de preaprobación",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When checking fuel samples, what density control typically applies during the competition?",
            "answers": [
                "Density must be within ±0.15% of the figure noted during pre-approval analysis",
                "Density is free as long as oxygen is between 0% and 1%",
                "Density is checked only if a team protests",
                "Density must match standard road fuel EN 228 exactly"
            ],
            "correctAnswer": "Density must be within ±0.15% of the figure noted during pre-approval analysis",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_aceite_un_solo_tipo():
    if LANG == "es":
        return {
            "question": "¿Cuál es la regla general sobre tipos de aceite de motor permitidos para competir?",
            "answers": [
                "No puede usarse ningún aceite sin aprobación previa por escrito de la FIA",
                "Se permiten aceites sin aprobación si cumplen viscosidad mínima",
                "Solo hace falta aprobación para el aceite usado en entrenamientos libres",
                "El aceite es libre si el equipo usa el mismo combustible que el año anterior"
            ],
            "correctAnswer": "No puede usarse ningún aceite sin aprobación previa por escrito de la FIA",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the general rule about engine oils permitted for competition use?",
            "answers": [
                "No engine oil may be used without the FIA’s prior written approval",
                "Unapproved oils are allowed if they meet a minimum viscosity",
                "Approval is needed only for oils used in free practice",
                "Oil is unrestricted if the team uses last year’s fuel"
            ],
            "correctAnswer": "No engine oil may be used without the FIA’s prior written approval",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_declaracion_aceite_competicion():
    if LANG == "es":
        return {
            "question": "¿Qué debe declarar cada equipo antes de cada competición respecto al aceite?",
            "answers": [
                "Qué aceite se usará en cada motor durante la competición",
                "La marca de aceite preferida del piloto para todo el año",
                "La densidad del aceite medida en el garaje cada hora",
                "Un listado de aceites alternativos que podrían mezclarse sin límite"
            ],
            "correctAnswer": "Qué aceite se usará en cada motor durante la competición",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must each team declare prior to every competition regarding oil?",
            "answers": [
                "Which oil will be used in each of their engines during the competition",
                "The driver’s favourite oil brand for the whole season",
                "The oil density measured in the garage every hour",
                "A list of alternative oils that may be mixed without limit"
            ],
            "correctAnswer": "Which oil will be used in each of their engines during the competition",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_methanol_pct():
    if LANG == "es":
        return {
            "question": "¿Cuál es el máximo de metanol permitido en el combustible (porcentaje v/v)?",
            "answers": ["3,0% v/v", "1,0% v/v", "5,0% v/v", "10,0% v/v"],
            "correctAnswer": "3,0% v/v",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted methanol content in fuel (percent v/v)?",
            "answers": ["3.0% v/v", "1.0% v/v", "5.0% v/v", "10.0% v/v"],
            "correctAnswer": "3.0% v/v",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_fuel_density_range():
    if LANG == "es":
        return {
            "question": "¿Qué rango de densidad (a 15°C) se especifica para el combustible permitido?",
            "answers": ["720–785 kg/m³", "650–700 kg/m³", "800–900 kg/m³", "600–650 kg/m³"],
            "correctAnswer": "720–785 kg/m³",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What density range (at 15°C) is specified for permitted fuel?",
            "answers": ["720–785 kg/m³", "650–700 kg/m³", "800–900 kg/m³", "600–650 kg/m³"],
            "correctAnswer": "720–785 kg/m³",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_conductividad_electrica_fuel():
    if LANG == "es":
        return {
            "question": "¿Cuál es la conductividad eléctrica mínima del combustible (pS/m) indicada en las propiedades del fuel?",
            "answers": ["200 pS/m", "50 pS/m", "500 pS/m", "10 pS/m"],
            "correctAnswer": "200 pS/m",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the minimum electrical conductivity of the fuel (pS/m) stated in the fuel properties?",
            "answers": ["200 pS/m", "50 pS/m", "500 pS/m", "10 pS/m"],
            "correctAnswer": "200 pS/m",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_boiling_point_fuel():
    if LANG == "es":
        return {
            "question": "¿Cuál es el ‘Final Boiling Point’ máximo permitido para el combustible según la tabla de características?",
            "answers": ["210°C", "180°C", "250°C", "300°C"],
            "correctAnswer": "210°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum permitted Final Boiling Point for the fuel according to the properties table?",
            "answers": ["210°C", "180°C", "250°C", "300°C"],
            "correctAnswer": "210°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_oil_kinematic_viscosity_min():
    if LANG == "es":
        return {
            "question": "¿Cuál es la viscosidad cinemática mínima del aceite de motor a 100°C (cSt) según la tabla de propiedades?",
            "answers": ["2,8 cSt", "1,0 cSt", "5,0 cSt", "10,0 cSt"],
            "correctAnswer": "2,8 cSt",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the minimum engine oil kinematic viscosity at 100°C (cSt) in the properties table?",
            "answers": ["2.8 cSt", "1.0 cSt", "5.0 cSt", "10.0 cSt"],
            "correctAnswer": "2.8 cSt",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_oil_initial_boiling_point():
    if LANG == "es":
        return {
            "question": "¿Qué valor se fija como ‘Initial Boiling Point’ mínimo del aceite de motor en la tabla de propiedades?",
            "answers": ["210°C", "150°C", "180°C", "250°C"],
            "correctAnswer": "210°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What value is set as the minimum engine oil Initial Boiling Point in the oil properties table?",
            "answers": ["210°C", "150°C", "180°C", "250°C"],
            "correctAnswer": "210°C",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_oil_low_bp_compounds_limit():
    if LANG == "es":
        return {
            "question": "Si se detectan compuestos en el aceite con punto de ebullición <210°C, ¿cuál es el máximo total permitido de esos componentes (m/m)?",
            "answers": ["0,5% m/m", "2,0% m/m", "0,1% m/m", "5,0% m/m"],
            "correctAnswer": "0,5% m/m",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If compounds with boiling point <210°C are detected in the engine oil, what is the maximum total allowed for those components (m/m)?",
            "answers": ["0.5% m/m", "2.0% m/m", "0.1% m/m", "5.0% m/m"],
            "correctAnswer": "0.5% m/m",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }

def tecnica_oil_no_octane_boosters():
    if LANG == "es":
        return {
            "question": "Desde 2026, ¿qué prohíbe el reglamento sobre la composición del aceite de motor respecto a aditivos metalorgánicos de gasolina (octane boosters)?",
            "answers": [
                "No puede contener aditivos metalorgánicos de gasolina ni otros potenciadores de octanaje de gasolina",
                "Debe contener manganeso para elevar el octanaje bajo carga",
                "Puede contener plomo si el combustible es sin azufre",
                "Solo se prohíben aditivos orgánicos; los metalorgánicos están permitidos"
            ],
            "correctAnswer": "No puede contener aditivos metalorgánicos de gasolina ni otros potenciadores de octanaje de gasolina",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Since 2026, what does the regulation forbid in engine oil composition regarding organometallic petrol additives (octane boosters)?",
            "answers": [
                "It must not contain organometallic petrol additives or other octane boosting petrol additives",
                "It must contain manganese to raise octane under load",
                "It may contain lead if the fuel is sulphur-free",
                "Only organic additives are forbidden; organometallic ones are allowed"
            ],
            "correctAnswer": "It must not contain organometallic petrol additives or other octane boosting petrol additives",
            "knowledgeLevel": 4,
            "category": "Technical",
            "language": LANG
        }



def pregunta_sistema_frontal_de_impacto():
    if LANG == "es":
        return {
            "question": "¿Cuál es la función del sistema de impacto frontal (crash structure) en un monoplaza?",
            "answers": [
                "Absorber energía en caso de colisión",
                "Reducir la velocidad del coche",
                "Mejorar la aerodinámica",
                "Aumentar el peso del coche"
            ],
            "correctAnswer": "Absorber energía en caso de colisión",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the function of the front crash structure in a Formula 1 car?",
            "answers": [
                "Absorb energy in case of collision",
                "Reduce the car's speed",
                "Improve aerodynamics",
                "Increase the car's weight"
            ],
            "correctAnswer": "Absorb energy in case of collision",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def pregunta_sensores_obligatorios():
    if LANG == "es":
        return {
            "question": "¿Qué sensor es obligatorio en todos los monoplazas durante la carrera?",
            "answers": ["Sensor de presión de neumáticos", "Sensor de oxígeno", "Sensor de temperatura de asfalto", "Sensor de humedad del aire"],
            "correctAnswer": "Sensor de presión de neumáticos",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which sensor is mandatory on all cars during the race?",
            "answers": ["Tyre pressure sensor", "Oxygen sensor", "Track temperature sensor", "Air humidity sensor"],
            "correctAnswer": "Tyre pressure sensor",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def pregunta_techo_presupuesto():
    if LANG == "es":
        return {
            "question": "¿Qué implica el incumplimiento del techo presupuestario técnico por parte de un equipo?",
            "answers": [
                "Puede conllevar sanciones deportivas o económicas",
                "Pierde la licencia de competición",
                "Debe correr con especificaciones del año anterior",
                "No puede competir en las carreras nocturnas"
            ],
            "correctAnswer": "Puede conllevar sanciones deportivas o económicas",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a team breaches the technical cost cap?",
            "answers": [
                "They may face sporting or financial penalties",
                "They lose their competition license",
                "They must race with last year’s specs",
                "They are banned from night races"
            ],
            "correctAnswer": "They may face sporting or financial penalties",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_uso_fibra_carbono():
    if LANG == "es":
        return {
            "question": "¿Por qué se utiliza fibra de carbono en la construcción del chasis de los F1?",
            "answers": [
                "Por su alta resistencia y bajo peso",
                "Porque es más barato que el acero",
                "Para cumplir con normas ecológicas",
                "Para mejorar la transmisión"
            ],
            "correctAnswer": "Por su alta resistencia y bajo peso",
            "knowledgeLevel": 1,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why is carbon fiber used in the construction of F1 chassis?",
            "answers": [
                "Because of its high strength and low weight",
                "Because it’s cheaper than steel",
                "To comply with environmental rules",
                "To improve transmission"
            ],
            "correctAnswer": "Because of its high strength and low weight",
            "knowledgeLevel": 1,
            "category": "Technical",
            "language": LANG
        }

def pregunta_modificaciones_piezas_sello():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si se modifica una pieza sellada sin aprobación técnica?",
            "answers": [
                "El coche puede ser excluido del evento",
                "Se aplica una penalización de tiempo",
                "Se permite si se justifica el motivo",
                "El equipo recibe una advertencia"
            ],
            "correctAnswer": "El coche puede ser excluido del evento",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a sealed part is modified without technical approval?",
            "answers": [
                "The car may be excluded from the event",
                "A time penalty is applied",
                "It is allowed if justification is provided",
                "The team receives a warning"
            ],
            "correctAnswer": "The car may be excluded from the event",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def pregunta_estructura_supervivencia():
    if LANG == "es":
        return {
            "question": "¿Qué elemento del coche debe superar las pruebas de choque más estrictas?",
            "answers": [
                "La estructura de supervivencia",
                "El alerón delantero",
                "La suspensión trasera",
                "El difusor"
            ],
            "correctAnswer": "La estructura de supervivencia",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which part of the car must pass the most stringent crash tests?",
            "answers": [
                "The survival cell",
                "The front wing",
                "The rear suspension",
                "The diffuser"
            ],
            "correctAnswer": "The survival cell",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def caso_coche_cruza_linea_boxes_cerrados():
    if LANG == "es":
        return {
            "question": "Durante un periodo de Safety Car, un coche entra a boxes cuando el pit lane está cerrado. ¿Qué sanción se aplica?",
            "answers": [
                "Penalización de 10 segundos o drive-through",
                "Descalificación directa",
                "Reinicio desde el pit lane",
                "Pérdida de puntos en la clasificación"
            ],
            "correctAnswer": "Penalización de 10 segundos o drive-through",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a Safety Car period, a car enters the pit lane while it is closed. What penalty applies?",
            "answers": [
                "10-second penalty or drive-through",
                "Immediate disqualification",
                "Restart from the pit lane",
                "Loss of championship points"
            ],
            "correctAnswer": "10-second penalty or drive-through",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_mecanicos_no_salen_tiempo():
    if LANG == "es":
        return {
            "question": "En la parrilla, los mecánicos no abandonan el coche a tiempo antes de la vuelta de formación. ¿Qué puede suceder?",
            "answers": [
                "El piloto debe iniciar la carrera desde el pit lane",
                "Se cancela la salida y se aplica bandera roja",
                "El piloto pierde posiciones",
                "No hay penalización si el coche arranca"
            ],
            "correctAnswer": "El piloto debe iniciar la carrera desde el pit lane",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "On the grid, mechanics fail to clear the car before the formation lap. What happens?",
            "answers": [
                "The driver must start the race from the pit lane",
                "The start is aborted and red flag shown",
                "The driver loses grid positions",
                "No penalty if the car starts"
            ],
            "correctAnswer": "The driver must start the race from the pit lane",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_sancion_parada_no_cumplida():
    if LANG == "es":
        return {
            "question": "Un piloto recibe una sanción de stop-and-go pero entra a boxes sin cumplirla. ¿Qué ocurre?",
            "answers": [
                "Puede ser descalificado",
                "Se suma el tiempo al final de carrera",
                "No hay efecto si lo notifica al equipo",
                "Pierde automáticamente dos posiciones"
            ],
            "correctAnswer": "Puede ser descalificado",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A driver receives a stop-and-go penalty but pits without serving it. What happens?",
            "answers": [
                "They may be disqualified",
                "The time is added at the end of the race",
                "No effect if reported to the team",
                "They automatically lose two positions"
            ],
            "correctAnswer": "They may be disqualified",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }


def caso_drs_activado_bajo_bandera_amarilla():
    if LANG == "es":
            return {
                "question": "Un piloto intenta usar Override Mode en un sector con bandera amarilla. ¿Qué puede pasar según el reglamento?",
                "answers": [
                    "Dirección de carrera puede deshabilitar el Override Mode en ese sector y el piloto puede ser investigado si lo usa indebidamente",
                    "No hay ninguna restricción: Override Mode siempre está permitido",
                    "Solo se desactiva al frenar, sin consecuencias",
                    "El sistema se activa automáticamente aunque no cumpla condiciones"
                ],
                "correctAnswer": "Dirección de carrera puede deshabilitar el Override Mode en ese sector y el piloto puede ser investigado si lo usa indebidamente",
                "knowledgeLevel": 2,
                "category": "PracticalCase",
                "language": LANG
            }
    elif LANG == "en":
        return {
            "question": "A driver tries to use Override Mode in a yellow-flag sector. What can happen under the regulations?",
            "answers": [
                "Race Control may disable Override Mode in that sector and the driver may be investigated if they misuse it",
                "There is no restriction: Override Mode is always allowed",
                "It only deactivates on braking, with no consequences",
                "The system activates automatically even if conditions are not met"
            ],
            "correctAnswer": "Race Control may disable Override Mode in that sector and the driver may be investigated if they misuse it",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def pregunta_que_es_driver_adjustable_bodywork():
    if LANG == "es":
        return {
            "question": "¿Qué incluye el sistema de aerodinámica activa (Driver Adjustable Bodywork) según el reglamento?",
            "answers": [
                "Ajuste del ala delantera (Front Wing Profiles) y del flap del ala trasera (RW Flap), controlados por la ECU estándar FIA",
                "Solo la apertura de un flap trasero tipo DRS",
                "Solo cambios de altura del coche (suspensión) en recta",
                "Un modo extra de potencia eléctrica (ERS) sin relación aerodinámica"
            ],
            "correctAnswer": "Ajuste del ala delantera (Front Wing Profiles) y del flap del ala trasera (RW Flap), controlados por la ECU estándar FIA",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does Active Aerodynamics (Driver Adjustable Bodywork) include under the regulations?",
            "answers": [
                "Adjustment of the Front Wing Profiles and the Rear Wing flap (RW Flap), controlled by the FIA Standard ECU",
                "Only a rear flap opening like classic DRS",
                "Only ride-height changes on straights",
                "An extra ERS power mode unrelated to aerodynamics"
            ],
            "correctAnswer": "Adjustment of the Front Wing Profiles and the Rear Wing flap (RW Flap), controlled by the FIA Standard ECU",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_modos_aero_activa_full_vs_partial():
    if LANG == "es":
        return {
            "question": "¿Qué diferencia hay entre activación total y parcial de la aerodinámica activa (DAB)?",
            "answers": [
                "Total: ala delantera y flap trasero en modo de baja incidencia; Parcial: solo el ala delantera en baja incidencia y el flap trasero se mantiene en Corner Mode",
                "Total: solo se mueve el flap trasero; Parcial: solo se mueve el difusor",
                "Total: se activa solo con lluvia; Parcial: solo en clasificación",
                "No existe activación parcial en el reglamento"
            ],
            "correctAnswer": "Total: ala delantera y flap trasero en modo de baja incidencia; Parcial: solo el ala delantera en baja incidencia y el flap trasero se mantiene en Corner Mode",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the difference between full and partial activation of Active Aerodynamics (DAB)?",
            "answers": [
                "Full: front wing and rear wing flap in low-incidence straight-line mode; Partial: front wing in straight-line mode while rear flap remains in corner mode",
                "Full: only the rear flap moves; Partial: only the diffuser moves",
                "Full: only in wet conditions; Partial: only in qualifying",
                "Partial activation does not exist in the regulations"
            ],
            "correctAnswer": "Full: front wing and rear wing flap in low-incidence straight-line mode; Partial: front wing in straight-line mode while rear flap remains in corner mode",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_donde_puede_activarse_aero_activa():
    if LANG == "es":
        return {
            "question": "¿Dónde está permitido que el piloto active la aerodinámica activa (DAB)?",
            "answers": [
                "Solo con el coche parado o dentro de una Activation Zone",
                "En cualquier punto del circuito si está a menos de 1s",
                "Solo en la recta principal",
                "Solo durante la primera vuelta"
            ],
            "correctAnswer": "Solo con el coche parado o dentro de una Activation Zone",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Where is the driver allowed to activate Active Aerodynamics (DAB)?",
            "answers": [
                "Only when the car is stationary or within an Activation Zone",
                "Anywhere on track if within one second",
                "Only on the main straight",
                "Only on the first lap"
            ],
            "correctAnswer": "Only when the car is stationary or within an Activation Zone",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_override_mode_condicion_ttcs():
    if LANG == "es":
        return {
            "question": "En una sesión de carrera (TTCS), ¿cuándo puede un piloto usar Override Mode?",
            "answers": [
                "Cuando está habilitado y, al cruzar la Detection Line, estaba a menos del Detection Gap del coche de delante; se activa en la Activation Line",
                "Siempre que el piloto quiera, desde la salida",
                "Solo en clasificación (Q3)",
                "Solo cuando haya Safety Car"
            ],
            "correctAnswer": "Cuando está habilitado y, al cruzar la Detection Line, estaba a menos del Detection Gap del coche de delante; se activa en la Activation Line",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "In a race session (TTCS), when may a driver use Override Mode?",
            "answers": [
                "When it is enabled and the car was within the Detection Gap at the Detection Line; it activates at the Activation Line",
                "Any time the driver wants, from the start",
                "Only in qualifying (Q3)",
                "Only under Safety Car"
            ],
            "correctAnswer": "When it is enabled and the car was within the Detection Gap at the Detection Line; it activates at the Activation Line",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }



def caso_reinicio_safety_car_confuso():
    if LANG == "es":
        return {
            "question": "Tras el reinicio de un Safety Car, un piloto adelanta creyendo que se había dado la señal. ¿Qué ocurre?",
            "answers": [
                "Debe devolver la posición o será penalizado",
                "La maniobra es válida si supera al coche en curva",
                "No hay penalización si recupera su posición",
                "Solo aplica si lo denuncia otro equipo"
            ],
            "correctAnswer": "Debe devolver la posición o será penalizado",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "After a Safety Car restart, a driver overtakes thinking the signal was given. What happens?",
            "answers": [
                "They must return the position or be penalized",
                "It’s valid if the move happens in a corner",
                "No penalty if the driver regains their position",
                "Only enforced if another team complains"
            ],
            "correctAnswer": "They must return the position or be penalized",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_orden_erronea_equipo():
    if LANG == "es":
        return {
            "question": "Un equipo ordena al piloto no cumplir una penalización obligatoria. ¿Cuál puede ser la consecuencia?",
            "answers": [
                "El equipo puede recibir una sanción económica y deportiva",
                "Solo el piloto es sancionado",
                "Se cancela la carrera del piloto afectado",
                "No hay consecuencias si se informa a tiempo"
            ],
            "correctAnswer": "El equipo puede recibir una sanción económica y deportiva",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A team tells the driver to ignore a mandatory penalty. What can happen?",
            "answers": [
                "The team may face financial and sporting sanctions",
                "Only the driver is penalized",
                "The driver’s race is cancelled",
                "No consequence if reported in time"
            ],
            "correctAnswer": "The team may face financial and sporting sanctions",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_salida_anticipada():
    if LANG == "es":
        return {
            "question": "Un coche se mueve antes de que se apaguen las luces del semáforo de salida. ¿Qué implica?",
            "answers": [
                "Penalización por falsa salida",
                "Reinicio de la carrera",
                "Advertencia sin penalización",
                "Pérdida automática de cinco posiciones"
            ],
            "correctAnswer": "Penalización por falsa salida",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car moves before the start lights go out. What does it mean?",
            "answers": [
                "Penalty for jump start",
                "Race is restarted",
                "Warning with no penalty",
                "Automatic five-place grid drop"
            ],
            "correctAnswer": "Penalty for jump start",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_parada_coche_salida_boxes():
    if LANG == "es":
        return {
            "question": "Un coche se detiene al salir del pit lane antes de incorporarse a pista. ¿Qué debe hacer?",
            "answers": [
                "Reanudar la marcha si es seguro o retirarse",
                "Esperar a ser empujado por comisarios",
                "Incorporarse directamente si no ve coches",
                "Volver al box en reversa"
            ],
            "correctAnswer": "Reanudar la marcha si es seguro o retirarse",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car stops at pit exit before joining the track. What must it do?",
            "answers": [
                "Resume safely or retire",
                "Wait for marshals to push",
                "Rejoin directly if no cars are seen",
                "Reverse back to the garage"
            ],
            "correctAnswer": "Resume safely or retire",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_equipo_interviene_muro_prohibido():
    if LANG == "es":
        return {
            "question": "Durante la carrera, un mecánico cruza el muro y toca el coche en pista. ¿Qué sanción aplica?",
            "answers": [
                "El equipo puede ser multado o descalificado",
                "Solo se le retira la superlicencia al piloto",
                "No ocurre nada si es en recta",
                "El coche debe parar en la siguiente vuelta"
            ],
            "correctAnswer": "El equipo puede ser multado o descalificado",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During the race, a mechanic crosses the wall and touches the car on track. What penalty applies?",
            "answers": [
                "The team may be fined or disqualified",
                "Only the driver’s super license is revoked",
                "Nothing if it happens on a straight",
                "The car must pit on the next lap"
            ],
            "correctAnswer": "The team may be fined or disqualified",
            "knowledgeLevel": 2,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_modificacion_parc_ferme_en_sprint():
    if LANG == "es":
        return {
            "question": "Si se modifica el reglaje de suspensión durante parc fermé antes de la Sprint, ¿qué consecuencias se aplican?",
            "answers": [
                "Debe comenzar la Sprint desde el pit lane",
                "Pierde 10 posiciones en la parrilla de la carrera",
                "Solo se aplica una advertencia",
                "El piloto es descalificado del evento"
            ],
            "correctAnswer": "Debe comenzar la Sprint desde el pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If suspension setup is changed during parc fermé before the Sprint, what are the consequences?",
            "answers": [
                "Must start the Sprint from the pit lane",
                "Loses 10 grid positions for the race",
                "Only a warning is issued",
                "The driver is disqualified from the event"
            ],
            "correctAnswer": "Must start the Sprint from the pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_parada_erronea_durante_sancion():
    if LANG == "es":
        return {
            "question": "Un equipo cambia neumáticos durante una sanción de stop-and-go. ¿Qué sanción puede aplicar la FIA?",
            "answers": [
                "El piloto puede ser descalificado por incumplimiento",
                "Se añaden 10 segundos al tiempo final",
                "No se aplica ninguna sanción adicional",
                "El piloto recibe una vuelta de penalización"
            ],
            "correctAnswer": "El piloto puede ser descalificado por incumplimiento",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A team changes tyres during a stop-and-go penalty. What can the FIA impose?",
            "answers": [
                "The driver may be disqualified for non-compliance",
                "10 seconds are added to the final time",
                "No further sanction is applied",
                "The driver receives a one-lap penalty"
            ],
            "correctAnswer": "The driver may be disqualified for non-compliance",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_reinicio_suspendido_lluvia():
    if LANG == "es":
        return {
            "question": "En caso de suspensión del reinicio por condiciones extremas tras Safety Car, ¿qué procedimiento se aplica?",
            "answers": [
                "Todos los coches entran en boxes y se reinicia con salida lanzada",
                "Se detiene la carrera definitivamente",
                "Se reanuda en la vuelta siguiente con bandera verde",
                "Los coches regresan a sus posiciones originales"
            ],
            "correctAnswer": "Todos los coches entran en boxes y se reinicia con salida lanzada",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If the restart is suspended due to extreme weather after a Safety Car period, what procedure applies?",
            "answers": [
                "All cars enter the pit lane and restart with a rolling start",
                "The race is definitively stopped",
                "It resumes on the next lap with green flag",
                "Cars return to their original grid positions"
            ],
            "correctAnswer": "All cars enter the pit lane and restart with a rolling start",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_coche_retirado_posteriormente_inspeccionado():
    if LANG == "es":
        return {
            "question": "Un coche se retira durante la carrera pero es llamado a inspección técnica. ¿Qué debe hacer el equipo?",
            "answers": [
                "Debe poner el coche a disposición de la FIA para parc fermé",
                "No es necesario ya que se retiró",
                "Puede realizar reparaciones si avisa a tiempo",
                "Solo se inspecciona si puntuó"
            ],
            "correctAnswer": "Debe poner el coche a disposición de la FIA para parc fermé",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car retires during the race but is summoned for technical inspection. What must the team do?",
            "answers": [
                "Make the car available for parc fermé to the FIA",
                "No need, as it was retired",
                "Repairs may be done if notice is given",
                "Only inspected if it scored points"
            ],
            "correctAnswer": "Make the car available for parc fermé to the FIA",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_celebracion_riesgosa_postcarrera():
    if LANG == "es":
        return {
            "question": "Si un piloto realiza maniobras peligrosas en su celebración postcarrera, ¿cuál es la consecuencia?",
            "answers": [
                "Puede ser sancionado si se pone en riesgo a otros",
                "No hay sanción por tratarse de una celebración",
                "Pierde los puntos obtenidos",
                "Debe repetir la vuelta final"
            ],
            "correctAnswer": "Puede ser sancionado si se pone en riesgo a otros",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If a driver performs risky maneuvers during post-race celebration, what is the consequence?",
            "answers": [
                "They may be penalized if others are endangered",
                "No penalty as it’s a celebration",
                "They lose all points obtained",
                "They must repeat the final lap"
            ],
            "correctAnswer": "They may be penalized if others are endangered",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_doble_penalizacion_procedimiento():
    if LANG == "es":
        return {
            "question": "Si un piloto debe cumplir dos penalizaciones consecutivas (una de 5s y una de 10s), ¿cómo debe proceder?",
            "answers": [
                "Debe cumplirlas por separado en dos paradas distintas",
                "Puede cumplirlas juntas en una única parada",
                "Solo se aplica la más severa",
                "Se acumulan en tiempo al final de carrera"
            ],
            "correctAnswer": "Debe cumplirlas por separado en dos paradas distintas",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If a driver receives two consecutive penalties (5s and 10s), how must they be served?",
            "answers": [
                "They must be served separately in two different pit stops",
                "They can be served together in one stop",
                "Only the most severe applies",
                "They are added to the final race time"
            ],
            "correctAnswer": "They must be served separately in two different pit stops",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_invasion_pit_lane_carrera():
    if LANG == "es":
        return {
            "question": "Durante una bandera roja, un miembro del equipo entra a la pista sin autorización para revisar el coche. ¿Qué implica esto?",
            "answers": [
                "Posible descalificación o sanción severa al equipo",
                "Advertencia verbal y anotación",
                "Solo penalización económica",
                "Se reinicia el procedimiento desde boxes"
            ],
            "correctAnswer": "Posible descalificación o sanción severa al equipo",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a red flag, a team member enters the track without authorization to inspect the car. What happens?",
            "answers": [
                "Possible disqualification or severe team penalty",
                "Verbal warning and note",
                "Only a financial penalty",
                "Restart from pit lane is triggered"
            ],
            "correctAnswer": "Possible disqualification or severe team penalty",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_incidente_entrada_pit_lane():
    if LANG == "es":
        return {
            "question": "Un piloto se desvía en la entrada del pit lane causando bloqueo parcial. ¿Qué puede determinar Dirección de Carrera?",
            "answers": [
                "Aplicar penalización y cerrar temporalmente la entrada",
                "Solo notificar al equipo contrario",
                "Permitir que los coches esquiven por fuera del carril",
                "No aplicar ninguna medida si no hay contacto"
            ],
            "correctAnswer": "Aplicar penalización y cerrar temporalmente la entrada",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A driver veers into the pit lane entry and partially blocks it. What can Race Control decide?",
            "answers": [
                "Apply a penalty and temporarily close the entry",
                "Only notify the opposing team",
                "Allow cars to bypass outside the lane",
                "Take no action if no contact occurred"
            ],
            "correctAnswer": "Apply a penalty and temporarily close the entry",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_problemas_comunicacion_race_control():
    if LANG == "es":
        return {
            "question": "Durante una sesión, los equipos pierden comunicación con Race Control. ¿Qué norma se aplica?",
            "answers": [
                "La última instrucción oficial sigue vigente hasta nueva comunicación",
                "Se suspende inmediatamente la sesión",
                "Se continúa normalmente sin supervisión",
                "Se debe cambiar a canal de emergencia"
            ],
            "correctAnswer": "La última instrucción oficial sigue vigente hasta nueva comunicación",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a session, teams lose communication with Race Control. What applies?",
            "answers": [
                "The last official instruction remains in effect until new communication",
                "The session is immediately suspended",
                "Normal continuation without supervision",
                "Teams must switch to the emergency channel"
            ],
            "correctAnswer": "The last official instruction remains in effect until new communication",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_cambio_chasis_evento():
    if LANG == "es":
        return {
            "question": "Un equipo solicita cambiar de chasis tras una sesión oficial. ¿Qué debe hacer para evitar sanción?",
            "answers": [
                "Solicitar autorización a los comisarios y salir desde el pit lane",
                "Cambiarlo sin informar y aceptar 5 puestos de penalización",
                "Notificar tras la carrera y pagar multa",
                "Solo registrar el nuevo chasis antes del siguiente GP"
            ],
            "correctAnswer": "Solicitar autorización a los comisarios y salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A team requests to change the chassis after an official session. What must they do to avoid penalty?",
            "answers": [
                "Request stewards' authorization and start from the pit lane",
                "Change it without notice and accept 5 grid penalties",
                "Notify after the race and pay a fine",
                "Only register the new chassis before the next GP"
            ],
            "correctAnswer": "Request stewards' authorization and start from the pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_cambio_motor_bajo_parque_cerrado():
    if LANG == "es":
        return {
            "question": "Un equipo cambia el motor durante el parque cerrado sin aprobación previa. ¿Qué consecuencias aplica el reglamento?",
            "answers": [
                "El coche debe iniciar la carrera desde el pit lane",
                "Recibe una penalización de 10 segundos",
                "Pierde todos los puntos del evento",
                "Queda automáticamente descalificado"
            ],
            "correctAnswer": "El coche debe iniciar la carrera desde el pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A team replaces the engine during parc fermé without prior approval. What are the consequences?",
            "answers": [
                "The car must start the race from the pit lane",
                "A 10-second penalty is applied",
                "All points from the event are lost",
                "The driver is automatically disqualified"
            ],
            "correctAnswer": "The car must start the race from the pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_salida_abortada_multiple():
    if LANG == "es":
        return {
            "question": "Si hay dos salidas abortadas consecutivas, ¿qué procedimiento se aplica en la tercera tentativa?",
            "answers": [
                "Se inicia la carrera con salida lanzada detrás del Safety Car",
                "Los coches deben salir directamente desde boxes",
                "Se pospone la carrera indefinidamente",
                "Se anula la sesión y se reinicia clasificación"
            ],
            "correctAnswer": "Se inicia la carrera con salida lanzada detrás del Safety Car",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If two consecutive starts are aborted, what happens on the third attempt?",
            "answers": [
                "The race begins with a rolling start behind the Safety Car",
                "Cars must start directly from the pit lane",
                "The race is postponed indefinitely",
                "The session is cancelled and qualifying restarted"
            ],
            "correctAnswer": "The race begins with a rolling start behind the Safety Car",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_reinicio_post_vsc_con_incidente():
    if LANG == "es":
        return {
            "question": "Tras terminar un periodo de Virtual Safety Car, ocurre un accidente. ¿Qué puede hacer dirección de carrera?",
            "answers": [
                "Reiniciar inmediatamente con Safety Car físico",
                "Permitir el adelantamiento en la zona afectada",
                "Aplicar penalizaciones retroactivas",
                "Repetir las últimas dos vueltas"
            ],
            "correctAnswer": "Reiniciar inmediatamente con Safety Car físico",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "After a Virtual Safety Car period ends, an accident occurs. What can race control do?",
            "answers": [
                "Immediately restart with a physical Safety Car",
                "Allow overtaking in the affected zone",
                "Apply retroactive penalties",
                "Repeat the last two laps"
            ],
            "correctAnswer": "Immediately restart with a physical Safety Car",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_sello_fia_motor_daño():
    if LANG == "es":
        return {
            "question": "Se detecta que el sello FIA del motor está dañado tras la carrera. ¿Qué implica?",
            "answers": [
                "El motor no podrá volver a usarse sin aprobación de la FIA",
                "Se puede reparar antes del siguiente GP sin restricción",
                "El coche debe cambiar de equipo técnico",
                "El equipo puede sustituirlo sin sanción"
            ],
            "correctAnswer": "El motor no podrá volver a usarse sin aprobación de la FIA",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "The FIA seal on the engine is found damaged after the race. What does this mean?",
            "answers": [
                "The engine cannot be reused without FIA approval",
                "It can be repaired freely before the next GP",
                "The car must change technical team",
                "The team can replace it without penalty"
            ],
            "correctAnswer": "The engine cannot be reused without FIA approval",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_salida_drs_activado_por_error():
    if LANG == "es":
        return {
            "question": "El sistema activa el overtake antes de lo permitido por error. ¿Qué debe hacer el piloto?",
            "answers": [
                "Desactivar el overtake inmediatamente y notificar al equipo",
                "Continuar hasta que reciba orden de dirección de carrera",
                "Aprovecharlo sin riesgo de sanción",
                "Activar y desactivar repetidamente"
            ],
            "correctAnswer": "Desactivar el overtake inmediatamente y notificar al equipo",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "The system mistakenly activates overtake earlier than permitted. What must the driver do?",
            "answers": [
                "Deactivate overtake immediately and notify the team",
                "Continue until receiving instructions from race control",
                "Take advantage of it without risk of penalty",
                "Activate and deactivate it repeatedly"
            ],
            "correctAnswer": "Deactivate overtake immediately and notify the team",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG

        }

def caso_error_panel_safety_car():
    if LANG == "es":
        return {
            "question": "Durante una carrera, un panel electrónico muestra 'SC' por error. ¿Qué deben hacer los pilotos según el reglamento?",
            "answers": [
                "Respetar el panel aunque sea erróneo hasta confirmación oficial",
                "Ignorarlo si los comisarios no lo repiten con bandera",
                "Reducir la velocidad solo si otros coches lo hacen",
                "Esperar confirmación por radio antes de actuar"
            ],
            "correctAnswer": "Respetar el panel aunque sea erróneo hasta confirmación oficial",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a race, an electronic panel mistakenly displays 'SC'. What must drivers do according to the regulations?",
            "answers": [
                "Respect the panel even if mistaken until official confirmation",
                "Ignore it if not repeated by flag marshals",
                "Slow down only if others do",
                "Wait for radio confirmation before reacting"
            ],
            "correctAnswer": "Respect the panel even if mistaken until official confirmation",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_dos_coches_mismo_box_bandera_roja():
    if LANG == "es":
        return {
            "question": "En situación de bandera roja, dos coches del mismo equipo entran a boxes simultáneamente. ¿Qué restricción se aplica?",
            "answers": [
                "Solo puede trabajarse en uno de ellos a la vez",
                "Ambos deben permanecer sin intervención",
                "El segundo coche recibe 5s de penalización",
                "Solo se permite trabajar si están en zonas separadas"
            ],
            "correctAnswer": "Solo puede trabajarse en uno de ellos a la vez",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Under red flag conditions, two cars from the same team pit at the same time. What is the restriction?",
            "answers": [
                "Only one of them can be worked on at a time",
                "Both must remain untouched",
                "The second car receives a 5s penalty",
                "Work is allowed only if they’re in separate zones"
            ],
            "correctAnswer": "Only one of them can be worked on at a time",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_procedimiento_arranque_con_retraso():
    if LANG == "es":
        return {
            "question": "Un coche tiene un retraso en la parrilla al momento del procedimiento de arranque. ¿Qué debe hacer si no logra salir?",
            "answers": [
                "Esperar a que todos salgan y luego ir al pit lane",
                "Solicitar a los comisarios salir detrás del Safety Car",
                "Reincorporarse a la vuelta siguiente en la misma posición",
                "Apagar el motor y esperar rescate"
            ],
            "correctAnswer": "Esperar a que todos salgan y luego ir al pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car is delayed on the grid during the start procedure. What must it do if it cannot start?",
            "answers": [
                "Wait for others to leave and then proceed to pit lane",
                "Request to rejoin behind the Safety Car",
                "Join the next lap in the same position",
                "Shut down the engine and wait for recovery"
            ],
            "correctAnswer": "Wait for others to leave and then proceed to pit lane",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_vehiculo_inmovilizado_despues_salida():
    if LANG == "es":
        return {
            "question": "Un coche queda inmovilizado justo después de la línea de salida. ¿Qué norma de seguridad aplica?",
            "answers": [
                "Se debe mostrar bandera amarilla doble inmediatamente",
                "Se activa automáticamente un VSC",
                "Se muestra bandera blanca hasta su retiro",
                "Solo se actúa si otro coche se aproxima"
            ],
            "correctAnswer": "Se debe mostrar bandera amarilla doble inmediatamente",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "A car is immobilized right after the starting line. What safety rule applies?",
            "answers": [
                "Double yellow flags must be shown immediately",
                "A VSC is automatically activated",
                "White flag is shown until it is cleared",
                "Only acted upon if another car approaches"
            ],
            "correctAnswer": "Double yellow flags must be shown immediately",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def caso_coche_sale_sin_goma_despues_parada():
    if LANG == "es":
        return {
            "question": "Durante una parada en boxes, el coche sale sin una de las ruedas colocadas correctamente. ¿Qué establece el reglamento?",
            "answers": [
                "Puede ser descalificado si el equipo no actúa de inmediato",
                "Se penaliza al piloto con 10 segundos",
                "Se permite regresar a boxes si no provoca incidente",
                "Solo se investiga si lo denuncia otro equipo"
            ],
            "correctAnswer": "Puede ser descalificado si el equipo no actúa de inmediato",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a pit stop, a car exits without a wheel properly attached. What does the regulation say?",
            "answers": [
                "The team may be disqualified if not immediately corrective",
                "A 10-second penalty is applied to the driver",
                "Allowed to return to pits if no incident occurs",
                "Investigated only if reported by another team"
            ],
            "correctAnswer": "The team may be disqualified if not immediately corrective",
            "knowledgeLevel": 3,
            "category": "PracticalCase",
            "language": LANG
        }

def tecnica_tolerancia_flexion_aleron():
    if LANG == "es":
        return {
            "question": "¿Qué implica una flexión del alerón delantero superior al límite permitido durante la inspección técnica?",
            "answers": [
                "Descalificación inmediata por incumplimiento del artículo técnico correspondiente",
                "Reducción de velocidad obligatoria en la siguiente carrera",
                "Penalización de 10 segundos en carrera",
                "Revisión del alerón sin consecuencias deportivas"
            ],
            "correctAnswer": "Descalificación inmediata por incumplimiento del artículo técnico correspondiente",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if the front wing bends beyond the permitted limit during technical inspection?",
            "answers": [
                "Immediate disqualification for breaching the corresponding technical article",
                "Mandatory speed reduction in the next race",
                "10-second race penalty",
                "Wing is reviewed with no sporting consequences"
            ],
            "correctAnswer": "Immediate disqualification for breaching the corresponding technical article",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_refrigeracion_ers_fuera_limite():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si el sistema de refrigeración del ERS no mantiene los límites de temperatura especificados por la FIA?",
            "answers": [
                "Puede llevar a la descalificación por ganancia de rendimiento",
                "Solo se registra como advertencia técnica",
                "Se permite si el motor sigue operativo",
                "Se penaliza solo en clasificación"
            ],
            "correctAnswer": "Puede llevar a la descalificación por ganancia de rendimiento",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if the ERS cooling system does not stay within FIA-specified temperature limits?",
            "answers": [
                "It may lead to disqualification due to performance gain",
                "Only logged as a technical warning",
                "Permitted if the engine remains functional",
                "Penalized only during qualifying"
            ],
            "correctAnswer": "It may lead to disqualification due to performance gain",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_materiales_prohibidos_chasis():
    if LANG == "es":
        return {
            "question": "Si un equipo utiliza un material no permitido en la estructura de supervivencia del chasis, ¿qué establece el reglamento?",
            "answers": [
                "El coche será excluido del evento y sus resultados anulados",
                "Se reduce el límite presupuestario del equipo",
                "Debe reconstruirse antes de la siguiente sesión",
                "Puede seguir compitiendo si no se demuestra ganancia"
            ],
            "correctAnswer": "El coche será excluido del evento y sus resultados anulados",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If a team uses a banned material in the chassis survival cell, what does the regulation state?",
            "answers": [
                "The car will be excluded from the event and results nullified",
                "The team’s budget cap is reduced",
                "Chassis must be rebuilt before the next session",
                "Car may continue if no advantage is proven"
            ],
            "correctAnswer": "The car will be excluded from the event and results nullified",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_supervision_banco_pruebas():
    if LANG == "es":
        return {
            "question": "¿Qué condición se impone sobre el número y uso de bancos de pruebas de ERS durante una temporada?",
            "answers": [
                "Deben declararse a la FIA antes del 1 de diciembre del año anterior",
                "Pueden cambiarse libremente durante el año",
                "Solo se permiten para equipos clientes",
                "No están sujetos a regulación específica"
            ],
            "correctAnswer": "Deben declararse a la FIA antes del 1 de diciembre del año anterior",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What condition applies to the number and use of ERS test benches during a season?",
            "answers": [
                "They must be declared to the FIA before December 1st of the previous year",
                "They can be changed freely throughout the year",
                "They are only allowed for customer teams",
                "They are not subject to specific regulation"
            ],
            "correctAnswer": "They must be declared to the FIA before December 1st of the previous year",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_limite_horas_banco():
    if LANG == "es":
            return {
                "question": "¿Cuál es el número máximo de horas de operación permitidas al año para los bancos de prueba del ERS?",
                "answers": ["110", "210", "480", "1600"],
                "correctAnswer": "110",
                "knowledgeLevel": 3,
                "category": "Technical",
                "language": LANG
            }
        elif LANG == "en":
            return {
                "question": "What is the maximum number of operation hours allowed per year for ERS test benches?",
                "answers": ["110", "210", "480", "1600"],
                "correctAnswer": "110",
                "knowledgeLevel": 3,
                "category": "Technical",
                "language": LANG
            }
def tecnica_inspeccion_postcarrera_inconformidad():
    if LANG == "es":
        return {
            "question": "Si tras una inspección postcarrera el coche no cumple una tolerancia mínima de altura del difusor, ¿qué estipula el reglamento?",
            "answers": [
                "Descalificación del evento salvo prueba clara de fuerza mayor",
                "Advertencia técnica sin consecuencias",
                "Penalización proporcional al incumplimiento",
                "Pérdida de una posición en la clasificación"
            ],
            "correctAnswer": "Descalificación del evento salvo prueba clara de fuerza mayor",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If a car fails the minimum diffuser height tolerance during post-race inspection, what does the regulation state?",
            "answers": [
                "Disqualification from the event unless force majeure is proven",
                "Technical warning with no consequence",
                "Proportional penalty to the infraction",
                "Loss of one position in classification"
            ],
            "correctAnswer": "Disqualification from the event unless force majeure is proven",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def tecnica_uso_software_no_declarado():
    if LANG == "es":
        return {
            "question": "¿Qué sanción contempla la FIA si un equipo utiliza software de gestión electrónica no declarado en la ECU?",
            "answers": [
                "Descalificación inmediata y posible investigación adicional",
                "Advertencia formal y auditoría técnica",
                "Solo pérdida de puntos del piloto",
                "Penalización de tiempo en la carrera siguiente"
            ],
            "correctAnswer": "Descalificación inmediata y posible investigación adicional",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty applies if a team uses undeclared electronic control software in the ECU?",
            "answers": [
                "Immediate disqualification and possible further investigation",
                "Formal warning and technical audit",
                "Only loss of the driver’s points",
                "Time penalty in the next race"
            ],
            "correctAnswer": "Immediate disqualification and possible further investigation",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def tecnica_presion_minima_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si la presión de los neumáticos está por debajo del mínimo exigido en clasificación?",
            "answers": [
                "Los tiempos de vuelta pueden ser anulados",
                "El coche no puede participar en la carrera",
                "Solo se permite con aprobación de Pirelli",
                "Se aplica una multa sin consecuencias deportivas"
            ],
            "correctAnswer": "Los tiempos de vuelta pueden ser anulados",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if tyre pressures are below the minimum during qualifying?",
            "answers": [
                "Lap times may be cancelled",
                "The car is not allowed to race",
                "Permitted only with Pirelli's approval",
                "A fine is issued without sporting consequence"
            ],
            "correctAnswer": "Lap times may be cancelled",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def tecnica_limite_consumo_combustible():
    if LANG == "es":
        return {
            "question": "¿Qué sanción se aplica si un coche excede el flujo máximo de combustible permitido?",
            "answers": [
                "Descalificación por obtener ventaja competitiva",
                "Recorte de potencia en la siguiente sesión",
                "Advertencia por primera infracción",
                "Penalización solo si supera un 10%"
            ],
            "correctAnswer": "Descalificación por obtener ventaja competitiva",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty is applied if a car exceeds the permitted fuel flow rate?",
            "answers": [
                "Disqualification for gaining a competitive advantage",
                "Power reduction in the next session",
                "Warning for first infraction",
                "Penalty only if it exceeds by more than 10%"
            ],
            "correctAnswer": "Disqualification for gaining a competitive advantage",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def tecnica_estructura_impacto_lateral():
    if LANG == "es":
        return {
            "question": "¿Qué debe demostrar la estructura de impacto lateral en las pruebas de homologación según la FIA?",
            "answers": [
                "Absorber energía sin penetración del habitáculo",
                "Resistir deformación con peso máximo",
                "Desviarse hacia el exterior tras el impacto",
                "Permitir ruptura controlada del panel inferior"
            ],
            "correctAnswer": "Absorber energía sin penetración del habitáculo",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must the lateral impact structure demonstrate during FIA homologation testing?",
            "answers": [
                "Absorb energy without intrusion into the cockpit",
                "Resist deformation under maximum weight",
                "Deflect outwards after impact",
                "Allow controlled rupture of lower panel"
            ],
            "correctAnswer": "Absorb energy without intrusion into the cockpit",
            "knowledgeLevel": 2,
            "category": "Technical",
            "language": LANG
        }

def tecnica_limite_bancos_prueba_numero():
    if LANG == "es":
            return {
                "question": "¿Cuál es el número máximo de bancos de prueba de ERS permitidos por fabricante?",
                "answers": ["4", "3", "5", "6"],
                "correctAnswer": "4",
                "knowledgeLevel": 3,
                "category": "Technical",
                "language": LANG
            }
    elif LANG == "en":
        return {
            "question": "What is the maximum number of ERS test benches allowed per manufacturer?",
            "answers": ["4", "3", "5", "6"],
            "correctAnswer": "4",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
def tecnica_max_horas_operacion_anual():
    if LANG == "es":
            return {
                "question": "¿Cuál es el número máximo de horas de operación permitidas al año para los bancos de prueba del ERS?",
                "answers": ["110", "210", "480", "1600"],
                "correctAnswer": "110",
                "knowledgeLevel": 3,
                "category": "Technical",
                "language": LANG
            }
    elif LANG == "en":
        return {
            "question": "What is the maximum number of operation hours allowed per year for ERS test benches?",
            "answers": ["110", "210", "480", "1600"],
            "correctAnswer": "110",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
def tecnica_max_horas_ocupacion_anual():
    if LANG == "es":
            return {
                "question": "¿Cuántas horas máximas de ocupación de banco están permitidas por año para el ERS?",
                "answers": ["480", "880", "1600", "320"],
                "correctAnswer": "480",
                "knowledgeLevel": 3,
                "category": "Technical",
                "language": LANG
            }
    elif LANG == "en":
        return {
            "question": "How many ERS test bench occupancy hours are allowed per year?",
            "answers": ["480", "880", "1600", "320"],
            "correctAnswer": "480",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
def tecnica_valor_amperaje_ers_banco():
    if LANG == "es":
        return {
            "question": "¿A partir de qué valor de corriente se considera activa una sesión en un banco de prueba de ERS?",
            "answers": ["10 Amperios", "50 Amperios", "100 Amperios", "5 Amperios"],
            "correctAnswer": "10 Amperios",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "From what current value is an ERS bench test session considered active?",
            "answers": ["10 Amps", "50 Amps", "100 Amps", "5 Amps"],
            "correctAnswer": "10 Amps",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_max_horas_operacion_periodo():
    if LANG == "es":
        return {
            "question": "¿Cuál es el límite de horas de operación por período de 10 semanas para bancos de prueba del ERS?",
            "answers": ["60", "40", "80", "110"],
            "correctAnswer": "60",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the operation hours limit per 10-week period for ERS test benches?",
            "answers": ["60", "40", "80", "110"],
            "correctAnswer": "60",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
def tecnica_peso_minimo_monoplaza():
    if LANG == "es":
        return {
            "question": "¿Cuál es el peso mínimo permitido para un monoplaza según el reglamento técnico?",
            "answers": ["768 kg", "780 kg", "750 kg", "798 kg"],
            "correctAnswer": "768 kg",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the minimum weight allowed for an F1 car under the technical regulations?",
            "answers": ["768 kg", "780 kg", "750 kg", "798 kg"],
            "correctAnswer": "768 kg",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_capacidad_maxima_bateria():
    if LANG == "es":
        return {
            "question": "¿Cuál es la capacidad máxima permitida para la batería del sistema ERS?",
            "answers": ["9 MJ", "4 MJ", "6 MJ", "12 MJ"],
            "correctAnswer": "9 MJ",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum allowed capacity of the ERS battery?",
            "answers": ["9 MJ", "4 MJ", "6 MJ", "12 MJ"],
            "correctAnswer": "9 MJ",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_velocidad_maxima_mgu():
    if LANG == "es":
        return {
            "question": "¿Cuál es la velocidad máxima operativa permitida para los MGU en banco de pruebas?",
            "answers": ["50000 rpm", "15000 rpm", "12000 rpm", "1000 rpm"],
            "correctAnswer": "50000 rpm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum operating speed permitted for MGUs on test benches?",
            "answers": ["50000 rpm", "15000 rpm", "12000 rpm", "1000 rpm"],
            "correctAnswer": "50000 rpm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_velocidad_maxima_mgu():
    if LANG == "es":
        return {
            "question": "¿Cuál es la velocidad máxima operativa permitida para los MGU en banco de pruebas?",
            "answers": ["50000 rpm", "15000 rpm", "12000 rpm", "1000 rpm"],
            "correctAnswer": "50000 rpm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum operating speed permitted for MGUs on test benches?",
            "answers": ["50000 rpm", "15000 rpm", "12000 rpm", "1000 rpm"],
            "correctAnswer": "50000 rpm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_flujo_combustible_maximo():
    if LANG == "es":
        return {
            "question": "¿Cuál es el límite máximo de flujo energético del combustible permitido durante carrera?",
            "answers": ["3000 MJ/h", "100 kg/h", "2500 MJ/h", "3500 MJ/h"],
            "correctAnswer": "3000 MJ/h",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum allowed fuel energy flow during a race?",
            "answers": ["3000 MJ/h", "100 kg/h", "2500 MJ/h", "3500 MJ/h"],
            "correctAnswer": "3000 MJ/h",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_num_max_ers_elements():
    if LANG == "es":
        return {
            "question": "Según el reglamento técnico actual, ¿cómo se controla el uso de unidades MGU-K por piloto?",
            "answers": [
                "Mediante homologación y límites de coste",
                "Con un máximo fijo por temporada",
                "Por número de Grandes Premios disputados",
                "Con penalización automática tras la cuarta unidad"
            ],
            "correctAnswer": "Mediante homologación y límites de coste",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Under the current technical regulations, how is the use of MGU-K units per driver controlled?",
            "answers": [
                "Through homologation and cost limits",
                "With a fixed seasonal limit",
                "By number of Grands Prix contested",
                "With automatic penalties after the fourth unit"
            ],
            "correctAnswer": "Through homologation and cost limits",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }


def tecnica_velocidad_banco_declarada():
    if LANG == "es":
        return {
            "question": "¿Qué velocidad mínima del MGU activa una sesión de banco de pruebas según la FIA?",
            "answers": ["1000 rpm", "1500 rpm", "500 rpm", "2000 rpm"],
            "correctAnswer": "1000 rpm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What minimum MGU speed activates a test bench session according to FIA?",
            "answers": ["1000 rpm", "1500 rpm", "500 rpm", "2000 rpm"],
            "correctAnswer": "1000 rpm",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_limite_tiempo_periodo_10_semanas():
    if LANG == "es":
        return {
            "question": "¿Cuál es el límite de horas de operación de bancos de pruebas del ERS por período de 10 semanas?",
            "answers": ["60 horas", "40 horas", "80 horas", "110 horas"],
            "correctAnswer": "60 horas",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the operation hour limit for ERS test benches per 10-week period?",
            "answers": ["60 hours", "40 hours", "80 hours", "110 hours"],
            "correctAnswer": "60 hours",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_max_uso_combustible_total():
    if LANG == "es":
        return {
            "question": "¿Cómo limita el reglamento el uso de combustible durante una carrera?",
            "answers": [
                "Mediante un límite de energía del combustible",
                "Mediante un máximo fijo de kg por carrera",
                "Mediante un máximo de litros por stint",
                "No existe limitación, solo pesa el depósito"
            ],
            "correctAnswer": "Mediante un límite de energía del combustible",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How do the regulations limit fuel usage during a race?",
            "answers": [
                "Through a fuel energy limit",
                "Through a fixed maximum kg per race",
                "Through a maximum liters per stint",
                "There is no limit, only tank capacity matters"
            ],
            "correctAnswer": "Through a fuel energy limit",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_max_presion_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Quién establece las presiones mínimas obligatorias de neumáticos para un Gran Premio?",
            "answers": [
                "La FIA junto con el proveedor de neumáticos para ese evento",
                "El equipo, libremente",
                "El piloto durante la vuelta de formación",
                "El promotor del circuito"
            ],
            "correctAnswer": "La FIA junto con el proveedor de neumáticos para ese evento",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Who sets the mandatory minimum tyre pressures for a Grand Prix?",
            "answers": [
                "The FIA together with the tyre supplier for that event",
                "The team, freely",
                "The driver during the formation lap",
                "The circuit promoter"
            ],
            "correctAnswer": "The FIA together with the tyre supplier for that event",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }

def tecnica_ratio_uso_combustible_max():
    if LANG == "es":
        return {
            "question": "¿Qué magnitud usa el reglamento para limitar el aporte del combustible al motor durante la carrera?",
            "answers": [
                "El flujo energético del combustible (Fuel Energy Flow)",
                "El caudal en kg/h en todo momento",
                "El número de inyecciones por segundo",
                "El caudal en litros/min según el piloto"
            ],
            "correctAnswer": "El flujo energético del combustible (Fuel Energy Flow)",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which measure do the regulations use to limit the fuel contribution to the engine during the race?",
            "answers": [
                "Fuel Energy Flow",
                "Fuel mass flow (kg/h) at all times",
                "Number of injections per second",
                "Fuel flow in liters/min depending on the driver"
            ],
            "correctAnswer": "Fuel Energy Flow",
            "knowledgeLevel": 3,
            "category": "Technical",
            "language": LANG
        }


def qualifying_salida_pitlane_durante_q1():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un coche no logra salir del pit lane durante Q1?",
            "answers": [
                "Se considerará en parque cerrado al final de Q1",
                "Puede reincorporarse en Q2 si hay hueco",
                "Debe pedir autorización a Dirección de Carrera",
                "Queda automáticamente descalificado"
            ],
            "correctAnswer": "Se considerará en parque cerrado al final de Q1",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car fails to leave the pit lane during Q1?",
            "answers": [
                "It will be deemed in parc fermé at the end of Q1",
                "It may rejoin Q2 if space allows",
                "It must request Race Director authorization",
                "It is automatically disqualified"
            ],
            "correctAnswer": "It will be deemed in parc fermé at the end of Q1",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_tiempos_eliminados_transicion_q1_q2():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre con los tiempos logrados en Q1 al pasar a Q2?",
            "answers": [
                "Se eliminan y no cuentan más",
                "Se conservan para desempates",
                "Solo el mejor tiempo se transfiere",
                "Se suman a los de Q2 para clasificación"
            ],
            "correctAnswer": "Se eliminan y no cuentan más",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens to lap times set in Q1 when drivers progress to Q2?",
            "answers": [
                "They are deleted and no longer count",
                "They are retained for tiebreaking",
                "Only the best time is transferred",
                "They are summed with Q2 for classification"
            ],
            "correctAnswer": "They are deleted and no longer count",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_bloqueo_castigo():
    if LANG == "es":
        return {
            "question": "¿Qué penalización puede recibir un piloto por bloquear a otro durante clasificación?",
            "answers": [
                "Pérdida de tiempos y posible sanción en parrilla",
                "Solo una advertencia",
                "Multa económica sin impacto deportivo",
                "Penalización solo si es reincidente"
            ],
            "correctAnswer": "Pérdida de tiempos y posible sanción en parrilla",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty can a driver receive for blocking another during qualifying?",
            "answers": [
                "Loss of times and possible grid penalty",
                "Only a warning",
                "Financial fine with no sporting impact",
                "Penalty only if repeated"
            ],
            "correctAnswer": "Loss of times and possible grid penalty",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_reingreso_piloto_sin_tiempo():
    if LANG == "es":
        return {
            "question": "¿Puede un piloto participar en la carrera si no marcó tiempo en clasificación?",
            "answers": [
                "Sí, si demuestra ritmo competitivo en prácticas",
                "No, queda automáticamente fuera",
                "Solo si otro piloto abandona",
                "Sí, pero debe salir desde boxes"
            ],
            "correctAnswer": "Sí, si demuestra ritmo competitivo en prácticas",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver participate in the race without setting a qualifying time?",
            "answers": [
                "Yes, if they showed competitive pace in practice",
                "No, they are automatically excluded",
                "Only if another driver retires",
                "Yes, but must start from the pit lane"
            ],
            "correctAnswer": "Yes, if they showed competitive pace in practice",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_tiempo_107_reglamento():
    if LANG == "es":
        return {
            "question": "¿A qué se refiere la 'regla del 107%' durante clasificación?",
            "answers": [
                "Al límite de tiempo permitido respecto al más rápido",
                "A un porcentaje de potencia del motor",
                "Al uso de neumáticos en Q3",
                "A la distancia mínima de adelantamiento"
            ],
            "correctAnswer": "Al límite de tiempo permitido respecto al más rápido",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the '107% rule' refer to during qualifying?",
            "answers": [
                "The maximum allowed time relative to the fastest lap",
                "A percentage of engine power",
                "Tyre usage regulation in Q3",
                "Minimum overtaking distance"
            ],
            "correctAnswer": "The maximum allowed time relative to the fastest lap",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_neumaticos_q1():
    if LANG == "es":
        return {
            "question": "En clasificación, ¿qué compuestos de neumáticos puede usar un piloto si están disponibles para el evento?",
            "answers": [
                "Cualquiera de los compuestos slick asignados para el evento (salvo restricciones específicas)",
                "Solo duros en Q1 por norma",
                "Solo medios en Q2 por norma",
                "Solo blandos en Q3 por norma"
            ],
            "correctAnswer": "Cualquiera de los compuestos slick asignados para el evento (salvo restricciones específicas)",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "In qualifying, which tyre compounds may a driver use if they are available for the event?",
            "answers": [
                "Any of the event’s allocated slick compounds (unless specific restrictions apply)",
                "Only hard tyres in Q1 by rule",
                "Only medium tyres in Q2 by rule",
                "Only soft tyres in Q3 by rule"
            ],
            "correctAnswer": "Any of the event’s allocated slick compounds (unless specific restrictions apply)",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_tiempo_minimo_retorno_box():
    if LANG == "es":
        return {
            "question": "¿Cuál es el propósito del tiempo mínimo establecido para regresar al box en clasificación?",
            "answers": [
                "Evitar ralentizaciones peligrosas en vuelta lenta",
                "Ahorrar combustible para Q3",
                "Controlar desgaste de neumáticos",
                "Sincronizar cronómetros de los comisarios"
            ],
            "correctAnswer": "Evitar ralentizaciones peligrosas en vuelta lenta",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the purpose of the minimum lap time to return to the pits during qualifying?",
            "answers": [
                "To avoid dangerous slow laps",
                "To save fuel for Q3",
                "To manage tyre degradation",
                "To synchronize stewards’ clocks"
            ],
            "correctAnswer": "To avoid dangerous slow laps",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_banderas_durante_q3():
    if LANG == "es":
        return {
            "question": "¿Qué implica una bandera amarilla durante la sesión Q3?",
            "answers": [
                "Debe levantarse el pie y no se permite mejora de tiempo",
                "Puede ignorarse si no hay comisarios en pista",
                "Solo aplica a coches que aún no marcaron vuelta",
                "Es una advertencia sin restricciones"
            ],
            "correctAnswer": "Debe levantarse el pie y no se permite mejora de tiempo",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a yellow flag mean during Q3?",
            "answers": [
                "Drivers must lift off and cannot improve time",
                "It can be ignored if no marshals are on track",
                "Only applies to drivers who haven’t set a lap",
                "It’s a warning without restrictions"
            ],
            "correctAnswer": "Drivers must lift off and cannot improve time",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_uso_intermedios_q2():
    if LANG == "es":
        return {
            "question": "¿Cuándo se autoriza el uso de neumáticos intermedios durante la Q2?",
            "answers": [
                "Cuando Dirección de Carrera declara pista húmeda",
                "Cuando un equipo lo solicita",
                "Siempre que la temperatura esté por debajo de 20°C",
                "Solo si un piloto ha salido con blandos antes"
            ],
            "correctAnswer": "Cuando Dirección de Carrera declara pista húmeda",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is the use of intermediate tyres allowed during Q2?",
            "answers": [
                "When Race Control declares the track wet",
                "When a team requests it",
                "Whenever temperature drops below 20°C",
                "Only if the driver has already used softs"
            ],
            "correctAnswer": "When Race Control declares the track wet",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_modificacion_reglaje_despues_q3():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si se modifica el reglaje del coche después de Q3 antes de la carrera?",
            "answers": [
                "El coche debe salir desde el pit lane",
                "Solo pierde posiciones en la parrilla",
                "Se aplica sanción económica",
                "Debe repetir la vuelta más rápida"
            ],
            "correctAnswer": "El coche debe salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if the car setup is modified after Q3 before the race?",
            "answers": [
                "The car must start from the pit lane",
                "Only grid positions are lost",
                "A financial fine is issued",
                "The fastest lap must be repeated"
            ],
            "correctAnswer": "The car must start from the pit lane",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_modificacion_setup_post_q3():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si se modifica el setup del coche tras la Q3 sin autorización?",
            "answers": ["El coche debe salir desde el pit lane", "Pierde el tiempo de Q3", "Debe reiniciar la sesión", "Se le resta 10 posiciones"],
            "correctAnswer": "El coche debe salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car's setup is modified after Q3 without authorization?",
            "answers": ["The car must start from the pit lane", "Its Q3 time is deleted", "It must restart the session", "It gets a 10-place grid penalty"],
            "correctAnswer": "The car must start from the pit lane",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_orden_salida_q1():
    if LANG == "es":
        return {
            "question": "¿Cómo se determina el orden de salida en pista para Q1?",
            "answers": ["No está predeterminado, depende del equipo", "Por sorteo previo", "Según los resultados de FP3", "Por clasificación del campeonato"],
            "correctAnswer": "No está predeterminado, depende del equipo",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is the order of entry to the track determined for Q1?",
            "answers": ["It is not predetermined, up to the teams", "By random draw", "Based on FP3 results", "By championship standings"],
            "correctAnswer": "It is not predetermined, up to the teams",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_cambio_motor_post_q3():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si se cambia el motor después de la clasificación?",
            "answers": ["El coche debe salir desde el pit lane", "Pierde solo los tiempos de Q3", "Puede conservar su posición si es por fiabilidad", "Recibe una penalización económica"],
            "correctAnswer": "El coche debe salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if an engine is changed after qualifying?",
            "answers": ["The car must start from the pit lane", "Only Q3 times are lost", "Position may be kept if change is for reliability", "A financial penalty is applied"],
            "correctAnswer": "The car must start from the pit lane",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_neumatico_blando_q3():
    if LANG == "es":
        return {
            "question": "¿Qué compuesto de neumáticos es obligatorio en Q3 si la pista está seca?",
            "answers": ["Blandos", "Medios", "Libres", "Intermedios"],
            "correctAnswer": "Blandos",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which tyre compound is mandatory in Q3 if the track is dry?",
            "answers": ["Soft", "Medium", "Free choice", "Intermediate"],
            "correctAnswer": "Soft",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_reincorporacion_box_en_q():
    if LANG == "es":
        return {
            "question": "¿Puede un coche reincorporarse a pista tras entrar a boxes durante la clasificación?",
            "answers": ["Sí, mientras no se haya finalizado la sesión", "Solo si no ha marcado tiempo", "No, queda excluido", "Debe esperar 5 minutos"],
            "correctAnswer": "Sí, mientras no se haya finalizado la sesión",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a car rejoin the track after entering the pits during qualifying?",
            "answers": ["Yes, as long as the session has not ended", "Only if it hasn’t set a time", "No, it is excluded", "It must wait 5 minutes"],
            "correctAnswer": "Yes, as long as the session has not ended",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_limite_coches_q3():
    if LANG == "es":
        return {
            "question": "¿Cuántos coches avanzan a la Q3 en el formato de clasificación estándar?",
            "answers": ["10", "12", "8", "6"],
            "correctAnswer": "10",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many cars advance to Q3 in the standard qualifying format?",
            "answers": ["10", "12", "8", "6"],
            "correctAnswer": "10",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_penalizacion_trafico_inevitable():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto bloquea involuntariamente a otro por tráfico en clasificación?",
            "answers": [
                "Dirección de carrera puede aplicar sanción si se demuestra perjuicio",
                "Se anula automáticamente el tiempo del piloto bloqueador",
                "No se aplica ninguna sanción en casos no intencionados",
                "Solo se revisa si el equipo presenta apelación"
            ],
            "correctAnswer": "Dirección de carrera puede aplicar sanción si se demuestra perjuicio",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver unintentionally blocks another due to traffic during qualifying?",
            "answers": [
                "Race control may penalize if harm is demonstrated",
                "Blocking driver’s time is automatically deleted",
                "No penalty applies in non-deliberate cases",
                "Only reviewed if the team appeals"
            ],
            "correctAnswer": "Race control may penalize if harm is demonstrated",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_suspension_tras_accidente():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si la sesión de clasificación se suspende por un accidente y no se reanuda?",
            "answers": [
                "Los tiempos más recientes se toman como definitivos",
                "Se repite toda la clasificación desde el inicio",
                "Se utiliza la parrilla del último entrenamiento",
                "Solo clasifican los 10 primeros"
            ],
            "correctAnswer": "Los tiempos más recientes se toman como definitivos",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a qualifying session is suspended due to an accident and not resumed?",
            "answers": [
                "The latest valid times are taken as final",
                "The entire qualifying is restarted",
                "The grid is based on last practice results",
                "Only the top 10 drivers qualify"
            ],
            "correctAnswer": "The latest valid times are taken as final",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_supera_limite_vuelta_reingreso():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto supera los límites de pista en su vuelta rápida de clasificación?",
            "answers": [
                "Su tiempo es anulado automáticamente",
                "Recibe una advertencia oficial",
                "Debe abandonar la sesión",
                "Solo cuenta si ocurre tres veces"
            ],
            "correctAnswer": "Su tiempo es anulado automáticamente",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver exceeds track limits on their qualifying flying lap?",
            "answers": [
                "Their time is automatically deleted",
                "They receive an official warning",
                "They must leave the session",
                "Only applies after three occurrences"
            ],
            "correctAnswer": "Their time is automatically deleted",
            "knowledgeLevel": 2,
            "category": "Qualifying",
            "language": LANG
        }

def qualifying_prohibido_uso_drs():
    if LANG == "es":
            return {
                "question": "¿En qué caso puede Dirección de Carrera deshabilitar la activación de la aerodinámica activa (Driver Adjustable Bodywork) durante clasificación?",
                "answers": [
                    "Si hay bandera amarilla o doble amarilla en una Activation Zone (o condiciones inseguras)",
                    "Cuando hay más de 10 coches en pista",
                    "Durante la vuelta de salida de boxes siempre",
                    "Solo en la Q1"
                ],
                "correctAnswer": "Si hay bandera amarilla o doble amarilla en una Activation Zone (o condiciones inseguras)",
                "knowledgeLevel": 3,
                "category": "Qualifying",
                "language": LANG
            }
    elif LANG == "en":
        return {
            "question": "When can Race Control disable activation of Active Aerodynamics (Driver Adjustable Bodywork) during qualifying?",
            "answers": [
                "If yellow/double yellow flags are shown in an Activation Zone (or unsafe conditions)",
                "When more than 10 cars are on track",
                "Always during the out lap from the pits",
                "Only in Q1"
            ],
            "correctAnswer": "If yellow/double yellow flags are shown in an Activation Zone (or unsafe conditions)",
            "knowledgeLevel": 3,
            "category": "Qualifying",
            "language": LANG
        }

def pregunta_intervalo_safety_car():
    if LANG == "es":
        return {
            "question": "¿Qué distancia máxima debe mantener el líder respecto al coche de seguridad durante su despliegue?",
            "answers": ["10 longitudes de coche", "5 segundos", "20 metros", "100 metros"],
            "correctAnswer": "10 longitudes de coche",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum distance the leader must keep from the safety car while it's deployed?",
            "answers": ["10 car lengths", "5 seconds", "20 meters", "100 meters"],
            "correctAnswer": "10 car lengths",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_overtake_garaje_durante_sc():
    if LANG == "es":
        return {
            "question": "¿Está permitido adelantar a un coche parado en su garaje durante un periodo de Safety Car?",
            "answers": ["Sí", "No", "Solo si lo autoriza el director de carrera", "Solo en clasificación"],
            "correctAnswer": "Sí",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is it allowed to overtake a car stopped at its garage during a Safety Car period?",
            "answers": ["Yes", "No", "Only if race director allows", "Only in qualifying"],
            "correctAnswer": "Yes",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_tiempo_minimo_sector_sc():
    if LANG == "es":
        return {
            "question": "¿Cómo se asegura la FIA de que los pilotos reduzcan suficientemente la velocidad bajo Safety Car?",
            "answers": [
                "Exigiendo tiempos mínimos por sector establecidos por la ECU",
                "Limitando la velocidad máxima global",
                "Bloqueando el uso del acelerador",
                "Ordenando a los pilotos usar marcha fija"
            ],
            "correctAnswer": "Exigiendo tiempos mínimos por sector establecidos por la ECU",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does the FIA ensure drivers slow down enough under Safety Car?",
            "answers": [
                "By enforcing minimum sector times via the ECU",
                "By globally limiting top speed",
                "By disabling throttle use",
                "By instructing drivers to use fixed gear"
            ],
            "correctAnswer": "By enforcing minimum sector times via the ECU",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_pitlane_bloqueado_sc():
    if LANG == "es":
        return {
            "question": "¿Cuándo puede estar prohibido entrar a boxes bajo un periodo de Safety Car?",
            "answers": [
                "Cuando dirección de carrera lo indique por razones de seguridad",
                "Siempre que haya bandera amarilla",
                "Cuando el líder está en vuelta de salida",
                "Nunca está prohibido"
            ],
            "correctAnswer": "Cuando dirección de carrera lo indique por razones de seguridad",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is it forbidden to enter the pits under a Safety Car period?",
            "answers": [
                "When race control mandates it for safety reasons",
                "Always during yellow flag",
                "When the leader is on out lap",
                "It’s never forbidden"
            ],
            "correctAnswer": "When race control mandates it for safety reasons",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_iluminacion_luces_sc():
    if LANG == "es":
        return {
            "question": "¿Qué indica que el Safety Car se retirará al final de la vuelta actual?",
            "answers": [
                "Se apagan las luces naranjas del coche",
                "El coche acelera a fondo",
                "Se encienden las luces azules del SC",
                "Los comisarios agitan bandera blanca"
            ],
            "correctAnswer": "Se apagan las luces naranjas del coche",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What indicates that the Safety Car will return to the pits at the end of the current lap?",
            "answers": [
                "Its orange lights are turned off",
                "The car accelerates at full speed",
                "The SC blue lights turn on",
                "Marshals wave white flags"
            ],
            "correctAnswer": "Its orange lights are turned off",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_condiciones_reinicio_sc():
    if LANG == "es":
        return {
            "question": "¿Qué condiciones deben cumplirse para que se reinicie la carrera tras el retiro del Safety Car?",
            "answers": [
                "La pista debe estar en condiciones seguras y las luces del SC apagadas",
                "Debe completarse al menos el 75% de la carrera",
                "Solo si todos los coches están en la misma vuelta",
                "El director de carrera debe aprobarlo con votación"
            ],
            "correctAnswer": "La pista debe estar en condiciones seguras y las luces del SC apagadas",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What conditions must be met for the race to restart after the Safety Car leaves?",
            "answers": [
                "The track must be safe and SC lights must be off",
                "At least 75% of the race must be completed",
                "All cars must be on the same lap",
                "Race director must approve via vote"
            ],
            "correctAnswer": "The track must be safe and SC lights must be off",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_adelantamiento_rezagados_sc():
    if LANG == "es":
        return {
            "question": "¿En qué momento los coches rezagados pueden adelantar bajo Safety Car?",
            "answers": [
                "Cuando se les indique por radio o paneles luminosos",
                "Siempre que vean bandera verde",
                "Cuando el coche de seguridad entra en boxes",
                "En la última vuelta antes del reinicio"
            ],
            "correctAnswer": "Cuando se les indique por radio o paneles luminosos",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When can lapped cars overtake during a Safety Car period?",
            "answers": [
                "When instructed via radio or light panels",
                "Whenever they see a green flag",
                "Once the Safety Car enters the pits",
                "In the last lap before restart"
            ],
            "correctAnswer": "When instructed via radio or light panels",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_velocidad_durante_safetycar():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer un piloto para mantener el control del coche durante un periodo de Safety Car?",
            "answers": [
                "Mantener una velocidad constante y calentar neumáticos y frenos",
                "Ir en punto muerto para ahorrar combustible",
                "Pisar el freno en cada curva",
                "Mantener la marcha más baja en todo momento"
            ],
            "correctAnswer": "Mantener una velocidad constante y calentar neumáticos y frenos",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What should a driver do to maintain control during a Safety Car period?",
            "answers": [
                "Keep constant speed and warm tyres and brakes",
                "Coast in neutral to save fuel",
                "Brake in every corner",
                "Stay in the lowest gear at all times"
            ],
            "correctAnswer": "Keep constant speed and warm tyres and brakes",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_safety_car_virtual_diferencia():
    if LANG == "es":
        return {
            "question": "¿Cuál es la principal diferencia entre Safety Car y Virtual Safety Car?",
            "answers": [
                "Con VSC no entra ningún coche a pista, solo se limita el tiempo delta",
                "Con VSC se permite adelantar si hay espacio",
                "El SC físico solo se usa bajo lluvia",
                "La VSC solo se aplica en clasificación"
            ],
            "correctAnswer": "Con VSC no entra ningún coche a pista, solo se limita el tiempo delta",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main difference between Safety Car and Virtual Safety Car?",
            "answers": [
                "Under VSC no car enters the track, only delta time is controlled",
                "Under VSC overtaking is allowed if there's space",
                "Physical SC is only used in rain",
                "VSC only applies in qualifying"
            ],
            "correctAnswer": "Under VSC no car enters the track, only delta time is controlled",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_reincorporacion_post_sc():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer un coche que ha sido doblado y reincorporado durante Safety Car?",
            "answers": [
                "Debe alcanzar la cola del grupo lo más rápido posible",
                "Puede quedarse donde esté si está en vuelta del líder",
                "Tiene que entrar a boxes obligatoriamente",
                "Debe mantener una velocidad fija sin adelantar"
            ],
            "correctAnswer": "Debe alcanzar la cola del grupo lo más rápido posible",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a lapped car do after being allowed to un-lap during a Safety Car period?",
            "answers": [
                "It must catch up to the back of the pack as quickly as possible",
                "It may stay where it is if on leader’s lap",
                "It must enter the pits",
                "It must keep constant speed without overtaking"
            ],
            "correctAnswer": "It must catch up to the back of the pack as quickly as possible",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_sc_instruccion_vuelta():
    if LANG == "es":
        return {
            "question": "¿Qué mensaje oficial se muestra cuando el coche de seguridad va a entrar a boxes al final de la vuelta?",
            "answers": ["‘SC IN THIS LAP’", "‘PIT ENTRY OPEN’", "‘SAFETY CAR OFF’", "‘RESUME RACE’"],
            "correctAnswer": "‘SC IN THIS LAP’",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What official message is shown when the safety car will return to the pits at the end of the lap?",
            "answers": ["‘SC IN THIS LAP’", "‘PIT ENTRY OPEN’", "‘SAFETY CAR OFF’", "‘RESUME RACE’"],
            "correctAnswer": "‘SC IN THIS LAP’",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_pitlane_forzoso_sc():
    if LANG == "es":
        return {
            "question": "¿Qué deben hacer los coches si dirección de carrera indica que usen obligatoriamente el pit lane bajo coche de seguridad?",
            "answers": [
                "Entrar por el pit lane sin adelantar y reincorporarse",
                "Pueden evitarlo si no van a cambiar neumáticos",
                "Deben detenerse en la línea de boxes",
                "Se les permite adelantar dentro del pit lane"
            ],
            "correctAnswer": "Entrar por el pit lane sin adelantar y reincorporarse",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must drivers do if race control orders mandatory pit lane use during a safety car?",
            "answers": [
                "Enter the pit lane without overtaking and rejoin the track",
                "May skip if not changing tyres",
                "Must stop at the pit line",
                "May overtake inside the pit lane"
            ],
            "correctAnswer": "Enter the pit lane without overtaking and rejoin the track",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_retraso_reinicio_safetycar():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si un coche no ha alcanzado al grupo cuando se retira el Safety Car?",
            "answers": [
                "Puede reincorporarse sin adelantar al grupo",
                "Debe entrar obligatoriamente a boxes",
                "Puede adelantar para retomar su posición",
                "No puede continuar la carrera"
            ],
            "correctAnswer": "Puede reincorporarse sin adelantar al grupo",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car hasn't caught up to the group when the Safety Car returns to the pits?",
            "answers": [
                "It may rejoin without overtaking the group",
                "It must pit immediately",
                "It may overtake to regain position",
                "It is not allowed to continue the race"
            ],
            "correctAnswer": "It may rejoin without overtaking the group",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_luces_sc_apagadas():
    if LANG == "es":
        return {
            "question": "¿Qué implica que se apaguen las luces del coche de seguridad?",
            "answers": [
                "El líder puede establecer el ritmo para el reinicio",
                "La carrera termina",
                "Se activa bandera azul",
                "Se permite adelantar inmediatamente"
            ],
            "correctAnswer": "El líder puede establecer el ritmo para el reinicio",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does it mean when the Safety Car turns off its lights?",
            "answers": [
                "The leader can set the pace for the restart",
                "The race is ending",
                "Blue flags are shown",
                "Overtaking is immediately allowed"
            ],
            "correctAnswer": "The leader can set the pace for the restart",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_orden_salida_sc_mas_de_una_vuelta():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si el coche de seguridad permanece más de una vuelta al inicio por lluvia?",
            "answers": [
                "El uso de neumáticos de lluvia es obligatorio",
                "Se permite cambiar de compuesto",
                "Los coches pueden entrar en boxes",
                "Se reinicia con bandera roja"
            ],
            "correctAnswer": "El uso de neumáticos de lluvia es obligatorio",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if the Safety Car stays out more than one lap at the start due to rain?",
            "answers": [
                "Wet weather tyres become mandatory",
                "Drivers may change tyre compound",
                "Cars are allowed to pit",
                "A red flag restart is triggered"
            ],
            "correctAnswer": "Wet weather tyres become mandatory",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_prohibido_usar_drs_sc():
    if LANG == "es":
            return {
                "question": "¿Cuándo se vuelve a habilitar la aerodinámica activa (Driver Adjustable Bodywork) después de un Safety Car?",
                "answers": [
                    "Cuando el Safety Car cruza la primera Safety Car Line en la vuelta en la que regresa al pit lane",
                    "En cuanto se apagan las luces del Safety Car",
                    "Dos vueltas después del reinicio",
                    "Solo cuando lo pide el piloto por radio"
                ],
                "correctAnswer": "Cuando el Safety Car cruza la primera Safety Car Line en la vuelta en la que regresa al pit lane",
                "knowledgeLevel": 3,
                "category": "SafetyCar",
                "language": LANG
            }
    elif LANG == "en":
        return {
            "question": "When is Active Aerodynamics (Driver Adjustable Bodywork) re-enabled after a Safety Car?",
            "answers": [
                "When the Safety Car crosses Safety Car Line 1 on the lap it returns to the pit lane",
                "As soon as the Safety Car lights go out",
                "Two laps after the restart",
                "Only when the driver requests it by radio"
            ],
            "correctAnswer": "When the Safety Car crosses Safety Car Line 1 on the lap it returns to the pit lane",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
def pregunta_comportamiento_frenada_reinicio():
    if LANG == "es":
        return {
            "question": "¿Qué está prohibido hacer durante el reinicio tras Safety Car para evitar colisiones?",
            "answers": [
                "Frenazos o cambios de ritmo impredecibles",
                "Aceleración máxima en la recta",
                "Uso del overtake antes del punto activado",
                "Adelantar dentro del pit lane"
            ],
            "correctAnswer": "Frenazos o cambios de ritmo impredecibles",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is prohibited during the Safety Car restart to avoid collisions?",
            "answers": [
                "Sudden braking or unpredictable pace changes",
                "Maximum acceleration on the straight",
                "Using overtake mode before the activation zone",
                "Overtaking inside the pit lane"
            ],
            "correctAnswer": "Sudden braking or unpredictable pace changes",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_tiempo_delta_virtual_sc():
    if LANG == "es":
        return {
            "question": "Durante un periodo de Virtual Safety Car, ¿qué debe respetar cada piloto en cada sector?",
            "answers": [
                "Un tiempo delta mínimo establecido electrónicamente",
                "Una velocidad máxima fija por equipo",
                "Un límite de vueltas por neumático",
                "Una distancia mínima con el coche anterior"
            ],
            "correctAnswer": "Un tiempo delta mínimo establecido electrónicamente",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a Virtual Safety Car period, what must each driver respect in each sector?",
            "answers": [
                "A minimum electronic delta time",
                "A maximum team-set speed",
                "A maximum number of tyre laps",
                "A minimum distance to the car ahead"
            ],
            "correctAnswer": "A minimum electronic delta time",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_safety_car_entrada_box_no_anunciada():
    if LANG == "es":
        return {
            "question": "¿Qué pasa si el Safety Car entra a boxes sin haber apagado sus luces previamente?",
            "answers": [
                "Se considera error operativo y se puede neutralizar de nuevo",
                "No tiene efecto mientras el líder siga el ritmo",
                "Activa automáticamente bandera roja",
                "Los coches deben frenar y esperar bandera verde"
            ],
            "correctAnswer": "Se considera error operativo y se puede neutralizar de nuevo",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if the Safety Car enters the pits without turning off its lights first?",
            "answers": [
                "It is considered an operational error and a new neutralization may follow",
                "No impact as long as the leader sets the pace",
                "Automatically triggers red flag",
                "Drivers must brake and wait for green flag"
            ],
            "correctAnswer": "It is considered an operational error and a new neutralization may follow",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_uso_de_mensajes_sc():
    if LANG == "es":
        return {
            "question": "¿Qué sistema oficial se utiliza para comunicar instrucciones durante un periodo de Safety Car?",
            "answers": [
                "Paneles luminosos LED y mensajes en pantallas FIA",
                "Solo banderas manuales de comisarios",
                "Radio entre pilotos y equipos",
                "Mensajes por pizarra desde el muro"
            ],
            "correctAnswer": "Paneles luminosos LED y mensajes en pantallas FIA",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What official system is used to communicate instructions during a Safety Car period?",
            "answers": [
                "LED light panels and FIA screen messages",
                "Only manual flags from marshals",
                "Radio between drivers and teams",
                "Pit board messages from the wall"
            ],
            "correctAnswer": "LED light panels and FIA screen messages",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_distancia_segura_safetycar():
    if LANG == "es":
        return {
            "question": "¿Qué distancia máxima puede mantener el líder respecto al Safety Car antes del reinicio?",
            "answers": ["10 longitudes de coche", "100 metros", "1 segundo", "No hay límite"],
            "correctAnswer": "10 longitudes de coche",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the maximum distance the leader can keep from the Safety Car before restart?",
            "answers": ["10 car lengths", "100 meters", "1 second", "No limit"],
            "correctAnswer": "10 car lengths",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_delta_minimo_safetycar():
    if LANG == "es":
        return {
            "question": "¿Qué deben respetar los pilotos tras activarse el coche de seguridad para evitar sanciones?",
            "answers": [
                "Un tiempo mínimo por sector definido por la ECU de la FIA",
                "Una velocidad constante en recta",
                "Un número máximo de frenadas por vuelta",
                "La distancia con su compañero de equipo"
            ],
            "correctAnswer": "Un tiempo mínimo por sector definido por la ECU de la FIA",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must drivers respect after the safety car is deployed to avoid penalties?",
            "answers": [
                "A minimum sector time set by the FIA ECU",
                "Constant speed on straights",
                "Maximum braking zones per lap",
                "Gap to their teammate"
            ],
            "correctAnswer": "A minimum sector time set by the FIA ECU",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_orden_direccion_luces_sc():
    if LANG == "es":
        return {
            "question": "¿Qué indica el apagado de las luces del coche de seguridad?",
            "answers": [
                "Que entrará a boxes al final de esa vuelta",
                "Que hay bandera roja",
                "Que los pilotos deben detenerse",
                "Que se va a reiniciar con salida detenida"
            ],
            "correctAnswer": "Que entrará a boxes al final de esa vuelta",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does it mean when the safety car turns off its lights?",
            "answers": [
                "It will enter the pit lane at the end of the lap",
                "A red flag is coming",
                "Drivers must stop",
                "The race will restart with a standing start"
            ],
            "correctAnswer": "It will enter the pit lane at the end of the lap",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_safetycar_lineas_adelantamiento():
    if LANG == "es":
        return {
            "question": "¿A partir de qué línea se permite adelantar tras el Safety Car?",
            "answers": [
                "Línea del coche de seguridad 1 (SC1)",
                "Línea de salida de boxes",
                "Línea de meta",
                "Zona de overtake"
            ],
            "correctAnswer": "Línea del coche de seguridad 1 (SC1)",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "From which line is overtaking allowed after the Safety Car?",
            "answers": [
                "Safety Car Line 1 (SC1)",
                "Pit exit line",
                "Finish line",
                "Overtake zone"
            ],
            "correctAnswer": "Safety Car Line 1 (SC1)",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_maniobras_peligrosas_sc():
    if LANG == "es":
        return {
            "question": "¿Qué maniobra está prohibida durante la presencia del Safety Car?",
            "answers": [
                "Conducción errática o innecesariamente lenta",
                "Usar el limitador de boxes",
                "Reducir presión de frenos",
                "Conducir por la línea del pit stop"
            ],
            "correctAnswer": "Conducción errática o innecesariamente lenta",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What maneuver is prohibited while the Safety Car is deployed?",
            "answers": [
                "Erratic or unnecessarily slow driving",
                "Using the pit limiter",
                "Reducing brake pressure",
                "Driving along the pit lane line"
            ],
            "correctAnswer": "Erratic or unnecessarily slow driving",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_comportamiento_coche_doblado():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer un coche que ha sido doblado si se le permite desdoblarse bajo Safety Car?",
            "answers": [
                "Debe adelantar a todos hasta recuperar su vuelta y reincorporarse al final",
                "Debe abandonar la carrera",
                "Debe mantenerse en su posición hasta el reinicio",
                "Solo puede adelantar al coche inmediatamente delante"
            ],
            "correctAnswer": "Debe adelantar a todos hasta recuperar su vuelta y reincorporarse al final",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a lapped car do if allowed to un-lap itself under Safety Car?",
            "answers": [
                "It must pass all cars to regain its lap and rejoin at the back",
                "It must retire from the race",
                "It must hold position until the restart",
                "It may only overtake the car directly ahead"
            ],
            "correctAnswer": "It must pass all cars to regain its lap and rejoin at the back",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_safetycar_inicio_lluvia():
    if LANG == "es":
        return {
            "question": "En condiciones de visibilidad o agarre muy comprometidos por lluvia, ¿qué puede ordenar Dirección de Carrera para el inicio?",
            "answers": [
                "Una salida detrás del Safety Car hasta que se considere seguro",
                "Una bandera roja automática siempre",
                "La obligación de salir desde boxes",
                "Una salida detenida obligatoria sin excepción"
            ],
            "correctAnswer": "Una salida detrás del Safety Car hasta que se considere seguro",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "In very poor visibility or grip due to heavy rain, what can Race Control order for the start?",
            "answers": [
                "A start behind the Safety Car until it is considered safe",
                "An automatic red flag every time",
                "Mandatory pit lane starts",
                "A mandatory standing start with no exceptions"
            ],
            "correctAnswer": "A start behind the Safety Car until it is considered safe",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_fin_periodo_safetycar():
    if LANG == "es":
        return {
            "question": "¿Cómo se indica oficialmente el fin del periodo de Safety Car?",
            "answers": [
                "Apagado de luces del SC y mensaje 'SC IN THIS LAP'",
                "Bandera verde en todo el circuito",
                "Banderas blancas en la línea de meta",
                "Mensaje de equipo por radio"
            ],
            "correctAnswer": "Apagado de luces del SC y mensaje 'SC IN THIS LAP'",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is the end of a Safety Car period officially indicated?",
            "answers": [
                "SC lights off and 'SC IN THIS LAP' message",
                "Green flags around the track",
                "White flags at the finish line",
                "Team radio message"
            ],
            "correctAnswer": "SC lights off and 'SC IN THIS LAP' message",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_pilotaje_agresivo_reinicio():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de conducción está prohibida antes del reinicio tras el Safety Car?",
            "answers": [
                "Zigzags excesivos o frenadas bruscas para obstaculizar",
                "Cambiar de mapa motor",
                "Activar el modo de clasificación",
                "Reducir la presión de neumáticos"
            ],
            "correctAnswer": "Zigzags excesivos o frenadas bruscas para obstaculizar",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What kind of driving is prohibited before the restart after Safety Car?",
            "answers": [
                "Excessive weaving or braking to obstruct",
                "Switching engine mode",
                "Activating qualifying mode",
                "Reducing tyre pressure"
            ],
            "correctAnswer": "Excessive weaving or braking to obstruct",
            "knowledgeLevel": 3,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_velocidad_segura_pitlane_sc():
    if LANG == "es":
        return {
            "question": "¿Qué velocidad debe respetarse obligatoriamente en el pit lane bajo Safety Car?",
            "answers": ["Depende del evento", "60 km/h", "100 km/h", "70 km/h"],
            "correctAnswer": "Depende del evento",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What speed must be respected in the pit lane during a Safety Car period?",
            "answers": ["It depends on the event", "60 km/h", "100 km/h", "70 km/h"],
            "correctAnswer": "It depends on the event",
            "knowledgeLevel": 2,
            "category": "SafetyCar",
            "language": LANG
        }

def pregunta_uso_anticompuestos_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un equipo usa un compuesto incorrecto en una sesión de clasificación con compuesto obligatorio?",
            "answers": [
                "Los tiempos marcados pueden ser anulados",
                "Se permite si el clima cambia",
                "Solo se penaliza si es reincidente",
                "Se reinicia la sesión"
            ],
            "correctAnswer": "Los tiempos marcados pueden ser anulados",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a team uses the wrong compound in a qualifying session with mandatory tyres?",
            "answers": [
                "Lap times may be deleted",
                "It’s allowed if weather changes",
                "Only penalized if repeated",
                "The session is restarted"
            ],
            "correctAnswer": "Lap times may be deleted",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_uso_neumaticos_bajo_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Está permitido cambiar neumáticos durante una bandera roja?",
            "answers": [
                "Sí, si lo autoriza la FIA",
                "No, está completamente prohibido",
                "Solo si son intermedios",
                "Solo si se hace dentro de los 5 minutos iniciales"
            ],
            "correctAnswer": "Sí, si lo autoriza la FIA",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is tyre change allowed during a red flag?",
            "answers": [
                "Yes, if authorized by the FIA",
                "No, it’s fully prohibited",
                "Only if intermediates are fitted",
                "Only within the first 5 minutes"
            ],
            "correctAnswer": "Yes, if authorized by the FIA",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_penalizacion_incorrecta_asignacion():
    if LANG == "es":
        return {
            "question": "¿Qué sanción puede recibir un equipo por no respetar la asignación obligatoria de neumáticos?",
            "answers": [
                "Descalificación de la sesión o penalización en parrilla",
                "Solo una advertencia",
                "Multa económica",
                "Ninguna, si los compuestos son equivalentes"
            ],
            "correctAnswer": "Descalificación de la sesión o penalización en parrilla",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty can a team receive for not respecting mandatory tyre allocation?",
            "answers": [
                "Session disqualification or grid penalty",
                "Only a warning",
                "Financial fine",
                "None, if the compound is equivalent"
            ],
            "correctAnswer": "Session disqualification or grid penalty",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_uso_full_wet_obligatorio():
    if LANG == "es":
        return {
            "question": "¿Cuándo es obligatorio el uso de neumáticos full wet (azul)?",
            "answers": [
                "Cuando la dirección de carrera lo declara por condiciones extremas",
                "Siempre que haya lluvia visible",
                "Solo en entrenamientos",
                "En los primeros 10 minutos de lluvia"
            ],
            "correctAnswer": "Cuando la dirección de carrera lo declara por condiciones extremas",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is the use of full wet (blue) tyres mandatory?",
            "answers": [
                "When race control declares extreme conditions",
                "Whenever visible rain is present",
                "Only during practice sessions",
                "In the first 10 minutes of rain"
            ],
            "correctAnswer": "When race control declares extreme conditions",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_presion_minima_fia():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un neumático está por debajo de la presión mínima reglamentaria?",
            "answers": [
                "Puede conllevar descalificación o advertencia técnica",
                "Debe cambiarse en la siguiente parada",
                "Solo se registra como anomalía",
                "No hay sanción si no se rompe"
            ],
            "correctAnswer": "Puede conllevar descalificación o advertencia técnica",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a tyre is found below the FIA minimum pressure limit?",
            "answers": [
                "May result in disqualification or technical warning",
                "It must be changed at the next stop",
                "Only recorded as an anomaly",
                "No penalty unless it fails"
            ],
            "correctAnswer": "May result in disqualification or technical warning",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_limite_juegos_entrenamientos():
    if LANG == "es":
        return {
            "question": "¿Cuántos juegos de neumáticos pueden usarse normalmente durante todas las sesiones de entrenamientos libres?",
            "answers": ["6", "5", "4", "7"],
            "correctAnswer": "6",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many tyre sets can normally be used during all free practice sessions?",
            "answers": ["6", "5", "4", "7"],
            "correctAnswer": "6",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_restriccion_reutilizacion_juegos():
    if LANG == "es":
        return {
            "question": "¿Está permitido reutilizar un juego de neumáticos previamente usado en clasificación durante la carrera?",
            "answers": [
                "Sí, siempre que no esté dañado y se respete el reglamento",
                "No, debe descartarse tras Q3",
                "Solo si es del mismo compuesto que los obligatorios",
                "Únicamente si se informa con 24 horas de antelación"
            ],
            "correctAnswer": "Sí, siempre que no esté dañado y se respete el reglamento",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a previously used qualifying tyre set be reused during the race?",
            "answers": [
                "Yes, if not damaged and in compliance with the rules",
                "No, it must be discarded after Q3",
                "Only if same compound as mandatory tyres",
                "Only if notified 24h in advance"
            ],
            "correctAnswer": "Yes, if not damaged and in compliance with the rules",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_diferencia_intermedios_agua():
    if LANG == "es":
        return {
            "question": "¿Cuál es la principal diferencia entre neumáticos intermedios y de lluvia extrema?",
            "answers": [
                "La cantidad de agua que pueden evacuar",
                "El peso total del compuesto",
                "El color del flanco del neumático",
                "La velocidad máxima permitida"
            ],
            "correctAnswer": "La cantidad de agua que pueden evacuar",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main difference between intermediate and full wet tyres?",
            "answers": [
                "The amount of water they can displace",
                "The total compound weight",
                "The colour of the tyre sidewall",
                "The maximum allowed speed"
            ],
            "correctAnswer": "The amount of water they can displace",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_seleccion_asignacion_previa():
    if LANG == "es":
        return {
            "question": "¿Cuándo se debe comunicar a la FIA la elección de juegos de neumáticos para cada piloto?",
            "answers": [
                "Con antelación determinada en el reglamento técnico antes del fin de semana",
                "Durante los primeros entrenamientos libres",
                "Antes de la clasificación",
                "Después de la carrera anterior"
            ],
            "correctAnswer": "Con antelación determinada en el reglamento técnico antes del fin de semana",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When must teams inform the FIA of each driver's tyre set selection?",
            "answers": [
                "Within a deadline specified in the technical regulations before the weekend",
                "During the first free practice session",
                "Before qualifying",
                "After the previous race"
            ],
            "correctAnswer": "Within a deadline specified in the technical regulations before the weekend",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_retencion_juegos_no_usados():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre con los juegos de neumáticos no usados al final del fin de semana de carrera?",
            "answers": [
                "Se devuelven a Pirelli para su análisis o reciclaje",
                "Pueden guardarse para la siguiente carrera",
                "Se permiten en entrenamientos privados",
                "Deben ser destruidos por el equipo"
            ],
            "correctAnswer": "Se devuelven a Pirelli para su análisis o reciclaje",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens to unused tyre sets at the end of the race weekend?",
            "answers": [
                "They are returned to Pirelli for analysis or recycling",
                "They may be kept for the next race",
                "They are allowed in private tests",
                "They must be destroyed by the team"
            ],
            "correctAnswer": "They are returned to Pirelli for analysis or recycling",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_compuestos_c1_c5():
    if LANG == "es":
        return {
            "question": "¿Qué diferencia hay entre los compuestos C1 a C5 proporcionados por Pirelli?",
            "answers": [
                "La dureza del compuesto y su durabilidad",
                "La presión máxima autorizada",
                "El color del neumático",
                "Su tamaño y altura"
            ],
            "correctAnswer": "La dureza del compuesto y su durabilidad",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the difference between the C1 to C5 compounds provided by Pirelli?",
            "answers": [
                "Compound hardness and durability",
                "Maximum authorized pressure",
                "Tyre color",
                "Size and height"
            ],
            "correctAnswer": "Compound hardness and durability",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_liberacion_juegos():
    if LANG == "es":
        return {
            "question": "¿Cómo se libera el uso de los juegos de neumáticos a lo largo del fin de semana?",
            "answers": [
                "Progresivamente, según el programa oficial",
                "Todos los juegos están disponibles desde el inicio",
                "Solo se entregan después de clasificación",
                "Se reparten en el día de la carrera"
            ],
            "correctAnswer": "Progresivamente, según el programa oficial",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How are tyre sets made available during the race weekend?",
            "answers": [
                "Progressively, according to the official schedule",
                "All sets are available from the start",
                "Only after qualifying",
                "They are distributed on race day"
            ],
            "correctAnswer": "Progressively, according to the official schedule",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_clasificacion_lluvia_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Qué pasa si la clasificación se realiza en condiciones de lluvia?",
            "answers": [
                "Se permite el uso de intermedios o full wet sin penalización",
                "Se anulan los compuestos obligatorios por reglamento",
                "Los equipos deben usar blandos de forma obligatoria",
                "Se cambia automáticamente al formato Sprint"
            ],
            "correctAnswer": "Se permite el uso de intermedios o full wet sin penalización",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if qualifying takes place in wet conditions?",
            "answers": [
                "Intermediates or full wets are allowed without penalty",
                "Mandatory compounds are overridden",
                "Soft tyres must be used",
                "It automatically switches to Sprint format"
            ],
            "correctAnswer": "Intermediates or full wets are allowed without penalty",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_procedimiento_informar_uso():
    if LANG == "es":
        return {
            "question": "¿Cómo deben informar los equipos a la FIA del uso de compuestos durante la carrera?",
            "answers": [
                "Mediante sensores electrónicos en las ruedas",
                "Con informe manual tras la carrera",
                "Por radio al director de carrera",
                "Con sistema GPS en el coche"
            ],
            "correctAnswer": "Mediante sensores electrónicos en las ruedas",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How must teams inform the FIA of compound usage during the race?",
            "answers": [
                "Via electronic sensors in the wheels",
                "Manual report after the race",
                "Radio communication to race director",
                "GPS system in the car"
            ],
            "correctAnswer": "Via electronic sensors in the wheels",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_tiempo_montaje_neumatico():
    if LANG == "es":
        return {
            "question": "¿Cuándo pueden los equipos montar neumáticos en los coches antes de la carrera?",
            "answers": [
                "Según ventana horaria definida por la FIA",
                "Desde el día anterior al evento",
                "En cualquier momento tras la Q3",
                "Solo al salir del pit lane"
            ],
            "correctAnswer": "Según ventana horaria definida por la FIA",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When can teams mount tyres on the cars before the race?",
            "answers": [
                "Within a time window defined by the FIA",
                "From the day before the event",
                "Any time after Q3",
                "Only upon pit lane exit"
            ],
            "correctAnswer": "Within a time window defined by the FIA",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_cambio_neumaticos_en_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Está permitido cambiar neumáticos durante el estado de parque cerrado?",
            "answers": [
                "Solo con autorización expresa de los comisarios",
                "Sí, libremente mientras no se cambie el compuesto",
                "No, bajo ninguna circunstancia",
                "Solo si el piloto no participará en la salida"
            ],
            "correctAnswer": "Solo con autorización expresa de los comisarios",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is it allowed to change tyres during parc fermé conditions?",
            "answers": [
                "Only with explicit authorization from the stewards",
                "Yes, freely if the compound stays the same",
                "No, under any circumstance",
                "Only if the driver will not start the race"
            ],
            "correctAnswer": "Only with explicit authorization from the stewards",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_condicion_neumaticos_retirados():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacerse con los neumáticos usados retirados durante un fin de semana de carrera?",
            "answers": [
                "Ser devueltos a Pirelli bajo supervisión de la FIA",
                "Guardarlos para futuras pruebas privadas",
                "Pueden ser revendidos si no están dañados",
                "Deben ser destruidos por el equipo"
            ],
            "correctAnswer": "Ser devueltos a Pirelli bajo supervisión de la FIA",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must be done with used tyres removed during a race weekend?",
            "answers": [
                "Returned to Pirelli under FIA supervision",
                "Stored for future private testing",
                "Can be resold if undamaged",
                "Must be destroyed by the team"
            ],
            "correctAnswer": "Returned to Pirelli under FIA supervision",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_neumaticos_diferentes_entrenamientos():
    if LANG == "es":
        return {
            "question": "¿Se puede usar un tipo de compuesto diferente en cada sesión de entrenamiento libre?",
            "answers": [
                "Sí, no hay restricción en compuestos para prácticas",
                "No, debe usarse el mismo compuesto en todas las prácticas",
                "Solo si es compuesto duro o intermedio",
                "Únicamente con aprobación previa de dirección de carrera"
            ],
            "correctAnswer": "Sí, no hay restricción en compuestos para prácticas",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a different tyre compound be used in each free practice session?",
            "answers": [
                "Yes, there are no compound restrictions during practice",
                "No, the same compound must be used throughout",
                "Only if it's hard or intermediate",
                "Only with prior race direction approval"
            ],
            "correctAnswer": "Yes, there are no compound restrictions during practice",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_obligacion_neumatico_blando_q3():
    if LANG == "es":
        return {
            "question": "¿Qué compuesto deben usar los pilotos que clasifican a Q3 si la pista está seca?",
            "answers": [
                "Neumáticos blandos",
                "Neumáticos intermedios",
                "Neumáticos duros",
                "Cualquier compuesto disponible"
            ],
            "correctAnswer": "Neumáticos blandos",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What compound must drivers use in Q3 if the track is dry?",
            "answers": [
                "Soft tyres",
                "Intermediate tyres",
                "Hard tyres",
                "Any available compound"
            ],
            "correctAnswer": "Soft tyres",
            "knowledgeLevel": 2,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_compuesto_asignado_fuerza_mayor():
    if LANG == "es":
        return {
            "question": "¿Qué puede ocurrir si un equipo no usa los compuestos obligatorios por causa de fuerza mayor?",
            "answers": [
                "La FIA puede eximirlos de penalización",
                "Siempre serán descalificados",
                "Deben empezar la siguiente carrera desde boxes",
                "Reciben una multa económica obligatoria"
            ],
            "correctAnswer": "La FIA puede eximirlos de penalización",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What may happen if a team fails to use the mandatory compounds due to force majeure?",
            "answers": [
                "The FIA may exempt them from penalty",
                "They are always disqualified",
                "They must start the next race from the pit lane",
                "They are fined automatically"
            ],
            "correctAnswer": "The FIA may exempt them from penalty",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_minimo_vueltas_con_neumatico():
    if LANG == "es":
        return {
            "question": "¿Existe un número mínimo de vueltas para que un compuesto cuente como utilizado en carrera?",
            "answers": [
                "No, basta con usarlo en cualquier momento",
                "Sí, al menos 3 vueltas consecutivas",
                "Sí, una vuelta completa cronometrada",
                "Sí, al menos 10% de la distancia total"
            ],
            "correctAnswer": "No, basta con usarlo en cualquier momento",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is there a minimum number of laps for a compound to be considered used in a race?",
            "answers": [
                "No, it just needs to be fitted at any moment",
                "Yes, at least 3 consecutive laps",
                "Yes, one full timed lap",
                "Yes, at least 10% of total distance"
            ],
            "correctAnswer": "No, it just needs to be fitted at any moment",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_fiabilidad_datos_sensores():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si se detecta manipulación o fallo en los sensores de presión y temperatura de los neumáticos?",
            "answers": [
                "El equipo puede ser investigado o sancionado",
                "La FIA reconfigura el sistema en la siguiente carrera",
                "No se toma en cuenta si los datos son parciales",
                "Solo se anula la última vuelta completada"
            ],
            "correctAnswer": "El equipo puede ser investigado o sancionado",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if tampering or failure is detected in tyre pressure and temperature sensors?",
            "answers": [
                "The team may be investigated or penalized",
                "The FIA resets the system for the next race",
                "No action is taken if the data is partial",
                "Only the last completed lap is deleted"
            ],
            "correctAnswer": "The team may be investigated or penalized",
            "knowledgeLevel": 3,
            "category": "Tyres",
            "language": LANG
        }

def pregunta_orden_reinicio_bandera_roja():
    if LANG == "es":
        return {
            "question": "¿Cómo se determina el orden de los coches tras una bandera roja antes del reinicio?",
            "answers": [
                "Según la última línea de cronometraje válida antes de la bandera roja",
                "Según la parrilla original",
                "Por el orden de entrada a boxes",
                "Por orden inverso a la clasificación"
            ],
            "correctAnswer": "Según la última línea de cronometraje válida antes de la bandera roja",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is the order of cars determined before restarting after a red flag?",
            "answers": [
                "According to the last valid timing line before the red flag",
                "Based on original grid order",
                "By pit lane entry order",
                "In reverse qualifying order"
            ],
            "correctAnswer": "According to the last valid timing line before the red flag",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_inicio_formacion_sprint():
    if LANG == "es":
        return {
            "question": "¿Cómo comienza la vuelta de formación en una Sprint?",
            "answers": [
                "Con señal del semáforo y salida desde parrilla",
                "Con coche de seguridad liderando",
                "Desde la línea de boxes",
                "Con bandera verde en la recta principal"
            ],
            "correctAnswer": "Con señal del semáforo y salida desde parrilla",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does the formation lap start in a Sprint?",
            "answers": [
                "With traffic light signal and start from grid",
                "Led by safety car",
                "From the pit lane",
                "With green flag on main straight"
            ],
            "correctAnswer": "With traffic light signal and start from grid",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_reinicio_despues_retraso():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si hay un reinicio tras una interrupción prolongada de carrera?",
            "answers": [
                "Se reinicia con salida detenida o lanzada según lo decida Dirección de Carrera",
                "La carrera continúa sin formación previa",
                "Se reduce automáticamente el número de vueltas",
                "Todos deben salir desde boxes"
            ],
            "correctAnswer": "Se reinicia con salida detenida o lanzada según lo decida Dirección de Carrera",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a race restarts after a prolonged suspension?",
            "answers": [
                "It restarts with standing or rolling start as decided by Race Direction",
                "Race resumes without a formation",
                "Number of laps is automatically reduced",
                "All cars must start from the pit lane"
            ],
            "correctAnswer": "It restarts with standing or rolling start as decided by Race Direction",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_restriccion_personal_cuadro():
    if LANG == "es":
        return {
            "question": "¿Cuándo debe abandonar el personal técnico la parrilla antes de la salida?",
            "answers": [
                "A la señal de 15 segundos",
                "Cuando se apagan las luces",
                "Con la bandera verde",
                "Tras la vuelta de formación"
            ],
            "correctAnswer": "A la señal de 15 segundos",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When must technical personnel leave the grid before the start?",
            "answers": [
                "At the 15-second signal",
                "When the lights go out",
                "With the green flag",
                "After the formation lap"
            ],
            "correctAnswer": "At the 15-second signal",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_parrilla_incompleta():
    if LANG == "es":
        return {
            "question": "¿Qué pasa si un coche no puede ocupar su lugar en la parrilla al inicio?",
            "answers": [
                "Debe salir desde el pit lane",
                "Su lugar queda vacío",
                "Otro piloto puede ocupar ese lugar",
                "Debe colocarse al final de la parrilla"
            ],
            "correctAnswer": "Debe salir desde el pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car cannot take its grid position at the start?",
            "answers": [
                "It must start from the pit lane",
                "Its grid spot remains empty",
                "Another driver may take the spot",
                "It must move to the back of the grid"
            ],
            "correctAnswer": "It must start from the pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_salida_box_vuelta_formacion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un coche sale del pit lane después del cierre de este durante la vuelta de formación?",
            "answers": [
                "Debe comenzar la carrera desde el pit lane tras el paso del pelotón",
                "Puede unirse al pelotón si no ha pasado el coche de seguridad",
                "Debe regresar inmediatamente a boxes",
                "Pierde una vuelta automáticamente"
            ],
            "correctAnswer": "Debe comenzar la carrera desde el pit lane tras el paso del pelotón",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car exits the pit lane after it closes during the formation lap?",
            "answers": [
                "It must start from the pit lane after the pack passes",
                "It may join the pack if the Safety Car hasn't passed",
                "It must immediately return to the pits",
                "It automatically loses one lap"
            ],
            "correctAnswer": "It must start from the pit lane after the pack passes",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_vuelta_formacion_abandono():
    if LANG == "es":
        return {
            "question": "Si un coche se detiene durante la vuelta de formación y no puede reiniciar, ¿qué sucede?",
            "answers": [
                "Debe ser retirado y no puede participar en la salida",
                "Se reincorpora desde la última posición",
                "Puede reiniciar si lo empujan a la parrilla",
                "Debe esperar el permiso del director de carrera"
            ],
            "correctAnswer": "Debe ser retirado y no puede participar en la salida",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If a car stops during the formation lap and can't restart, what happens?",
            "answers": [
                "It must be withdrawn and cannot take the start",
                "It rejoins from the last position",
                "It may restart if pushed to the grid",
                "It must wait for race director approval"
            ],
            "correctAnswer": "It must be withdrawn and cannot take the start",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_indicacion_luz_verde_pre_salida():
    if LANG == "es":
        return {
            "question": "¿Qué indica la luz verde en el pit lane antes del inicio de la carrera?",
            "answers": [
                "Que los coches pueden salir a la pista para la vuelta de formación",
                "Que se ha autorizado la salida",
                "Que los mecánicos deben abandonar la parrilla",
                "Que se cancela la sesión"
            ],
            "correctAnswer": "Que los coches pueden salir a la pista para la vuelta de formación",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the green light in the pit lane indicate before the race start?",
            "answers": [
                "Cars may leave the pits for the formation lap",
                "The start has been authorized",
                "Mechanics must leave the grid",
                "The session is cancelled"
            ],
            "correctAnswer": "Cars may leave the pits for the formation lap",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_informacion_grilla_previa():
    if LANG == "es":
        return {
            "question": "¿Cuándo se publica la parrilla oficial de salida antes de una carrera?",
            "answers": [
                "Tras la validación final de los resultados de clasificación",
                "Al finalizar la última sesión de entrenamientos libres",
                "Justo antes de la vuelta de formación",
                "Después de la ceremonia del himno"
            ],
            "correctAnswer": "Tras la validación final de los resultados de clasificación",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When is the official starting grid published before the race?",
            "answers": [
                "After final validation of qualifying results",
                "At the end of final practice",
                "Just before the formation lap",
                "After the national anthem ceremony"
            ],
            "correctAnswer": "After final validation of qualifying results",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_banderas_durante_formacion():
    if LANG == "es":
        return {
            "question": "¿Qué bandera puede mostrar un comisario durante la vuelta de formación si detecta un coche detenido?",
            "answers": [
                "Bandera amarilla",
                "Bandera roja",
                "Bandera azul",
                "Bandera blanca"
            ],
            "correctAnswer": "Bandera amarilla",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What flag can a marshal display during the formation lap if a car stops?",
            "answers": [
                "Yellow flag",
                "Red flag",
                "Blue flag",
                "White flag"
            ],
            "correctAnswer": "Yellow flag",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_reinicio_despues_parada_total():
    if LANG == "es":
        return {
            "question": "¿Qué condiciones debe verificar dirección de carrera para reiniciar la carrera tras una parada total?",
            "answers": [
                "Que la pista esté segura y todos los coches estén en posición válida",
                "Que haya pasado al menos una hora",
                "Que todos los coches estén en boxes",
                "Que se haya desplegado la bandera verde dos veces"
            ],
            "correctAnswer": "Que la pista esté segura y todos los coches estén en posición válida",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must race control verify to restart the race after a full stop?",
            "answers": [
                "That the track is safe and all cars are in a valid position",
                "That at least one hour has passed",
                "That all cars are in the pits",
                "That the green flag has been shown twice"
            ],
            "correctAnswer": "That the track is safe and all cars are in a valid position",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_entrada_boxes_durante_formacion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un coche entra en boxes durante la vuelta de formación?",
            "answers": [
                "Debe iniciar la carrera desde el pit lane",
                "Puede salir de nuevo si lo hace antes del último coche",
                "Recibe una penalización de 5 segundos",
                "Debe volver a su posición original"
            ],
            "correctAnswer": "Debe iniciar la carrera desde el pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a car enters the pits during the formation lap?",
            "answers": [
                "It must start the race from the pit lane",
                "It may rejoin if it exits before the last car",
                "It receives a 5-second penalty",
                "It must return to its original grid position"
            ],
            "correctAnswer": "It must start the race from the pit lane",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_cancelacion_salida_inminente():
    if LANG == "es":
        return {
            "question": "¿Qué indica una señal de 'START DELAYED' justo antes de la salida?",
            "answers": [
                "Que la salida ha sido cancelada temporalmente y habrá nueva vuelta de formación",
                "Que todos los coches deben apagar motores",
                "Que se reiniciará el procedimiento desde cero",
                "Que se utilizará la parrilla invertida"
            ],
            "correctAnswer": "Que la salida ha sido cancelada temporalmente y habrá nueva vuelta de formación",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a 'START DELAYED' signal just before the start indicate?",
            "answers": [
                "That the start is temporarily aborted and another formation lap will take place",
                "That all cars must shut down their engines",
                "That the whole start procedure will restart",
                "That the grid will be reversed"
            ],
            "correctAnswer": "That the start is temporarily aborted and another formation lap will take place",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_posicion_salida_despues_vuelta_extra():
    if LANG == "es":
        return {
            "question": "Si se realiza una segunda vuelta de formación, ¿qué ocurre con la parrilla?",
            "answers": [
                "Se deja vacía la posición del piloto ausente",
                "Todos avanzan una posición",
                "Se reinicia la clasificación",
                "Los pilotos pueden cambiar de compuesto"
            ],
            "correctAnswer": "Se deja vacía la posición del piloto ausente",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "If a second formation lap is completed, what happens to the grid?",
            "answers": [
                "The missing driver’s grid slot is left empty",
                "All drivers move up one position",
                "Qualifying results are reset",
                "Drivers may change tyre compounds"
            ],
            "correctAnswer": "The missing driver’s grid slot is left empty",
            "knowledgeLevel": 3,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_final_banderazo():
    if LANG == "es":
        return {
            "question": "¿Qué indica el paso por línea de meta tras mostrarse la bandera a cuadros?",
            "answers": [
                "Final oficial de la carrera para ese coche",
                "Inicio de la última vuelta",
                "Reinicio de procedimiento",
                "Confirmación de que está en la vuelta del líder"
            ],
            "correctAnswer": "Final oficial de la carrera para ese coche",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does crossing the finish line after the chequered flag mean?",
            "answers": [
                "Official end of the race for that car",
                "Start of the final lap",
                "Restart of procedure",
                "Confirmation that it is on the lead lap"
            ],
            "correctAnswer": "Official end of the race for that car",
            "knowledgeLevel": 2,
            "category": "Procedures",
            "language": LANG
        }

def pregunta_entrenamiento_obligatorio():
    if LANG == "es":
        return {
            "question": "¿Qué obligación tienen los pilotos titulares respecto a los entrenamientos libres 1 según la FIA?",
            "answers": [
                "Ceder su asiento al menos una vez por temporada a un piloto joven",
                "Participar en todas las sesiones sin excepción",
                "No participar si llueve",
                "Usar neumáticos de lluvia obligatorios"
            ],
            "correctAnswer": "Ceder su asiento al menos una vez por temporada a un piloto joven",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What obligation do regular drivers have for FP1 according to the FIA?",
            "answers": [
                "Give up their seat at least once per season to a young driver",
                "Participate in all sessions without exception",
                "Not participate if it rains",
                "Use mandatory wet tyres"
            ],
            "correctAnswer": "Give up their seat at least once per season to a young driver",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_conducta_pista_reincidencia():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto reincide en conductas antideportivas en pista?",
            "answers": [
                "Puede ser suspendido o perder puntos de la superlicencia",
                "Solo se le amonesta verbalmente",
                "Pierde la sesión de clasificación",
                "Debe cambiar de equipo"
            ],
            "correctAnswer": "Puede ser suspendido o perder puntos de la superlicencia",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver repeatedly engages in unsporting behavior on track?",
            "answers": [
                "They may be suspended or lose super licence points",
                "They only receive a verbal warning",
                "They lose the qualifying session",
                "They must change teams"
            ],
            "correctAnswer": "They may be suspended or lose super licence points",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_piloto_reemplazo_sabado():
    if LANG == "es":
        return {
            "question": "¿Puede un equipo reemplazar a un piloto el sábado del evento?",
            "answers": [
                "Sí, pero requiere aprobación de los comisarios",
                "No, solo es posible antes del viernes",
                "Solo si el piloto original está lesionado",
                "Sí, sin restricciones"
            ],
            "correctAnswer": "Sí, pero requiere aprobación de los comisarios",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a team replace a driver on Saturday of the event?",
            "answers": [
                "Yes, but stewards’ approval is required",
                "No, only before Friday",
                "Only if the original driver is injured",
                "Yes, without restrictions"
            ],
            "correctAnswer": "Yes, but stewards’ approval is required",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_piloto_debe_atender():
    if LANG == "es":
        return {
            "question": "¿A qué eventos debe asistir obligatoriamente un piloto durante un GP?",
            "answers": [
                "Briefings oficiales, ruedas de prensa y ceremonias",
                "Solo a las prácticas",
                "A la reunión del equipo rival",
                "A eventos de entretenimiento"
            ],
            "correctAnswer": "Briefings oficiales, ruedas de prensa y ceremonias",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which events must a driver attend during a GP weekend?",
            "answers": [
                "Official briefings, press conferences and ceremonies",
                "Only practice sessions",
                "The rival team meeting",
                "Entertainment activities"
            ],
            "correctAnswer": "Official briefings, press conferences and ceremonies",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_piloto_drs_incorrecto():
    if LANG == "es":
            return {
                "question": "Si un piloto activa la aerodinámica activa (Driver Adjustable Bodywork) fuera de una Activation Zone estando en pista, ¿qué puede ocurrir?",
                "answers": [
                    "Puede ser investigado y sancionado por los comisarios por uso indebido del sistema",
                    "No pasa nada porque el sistema siempre se permite",
                    "Solo pierde la vuelta rápida automáticamente",
                    "Se le obliga a entrar a boxes inmediatamente"
                ],
                "correctAnswer": "Puede ser investigado y sancionado por los comisarios por uso indebido del sistema",
                "knowledgeLevel": 2,
                "category": "Drivers",
                "language": LANG
            }
    elif LANG == "en":
        return {
            "question": "If a driver activates Active Aerodynamics (Driver Adjustable Bodywork) outside an Activation Zone while on track, what can happen?",
            "answers": [
                "They may be investigated and penalized by the stewards for improper use of the system",
                "Nothing, because it is always allowed",
                "Only the fastest lap is automatically deleted",
                "They must pit immediately"
            ],
            "correctAnswer": "They may be investigated and penalized by the stewards for improper use of the system",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
def pregunta_superlicencia_requisitos():
    if LANG == "es":
        return {
            "question": "¿Cuál de los siguientes requisitos es obligatorio para obtener la superlicencia de la FIA?",
            "answers": [
                "Acumular al menos 40 puntos en campeonatos acreditados",
                "Haber competido en al menos 10 carreras de Fórmula 1",
                "Ser mayor de 25 años",
                "Haber ganado un título mundial"
            ],
            "correctAnswer": "Acumular al menos 40 puntos en campeonatos acreditados",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which of the following is required to obtain an FIA super licence?",
            "answers": [
                "Scoring at least 40 points in accredited championships",
                "Competing in at least 10 F1 races",
                "Being over 25 years old",
                "Winning a world championship"
            ],
            "correctAnswer": "Scoring at least 40 points in accredited championships",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_puntos_superlicencia_sanciones():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si un piloto acumula 12 puntos de sanción en su superlicencia?",
            "answers": [
                "Es suspendido automáticamente por una carrera",
                "Pierde su plaza en el equipo",
                "Solo recibe una advertencia oficial",
                "Debe repetir el examen teórico"
            ],
            "correctAnswer": "Es suspendido automáticamente por una carrera",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver accumulates 12 penalty points on their super licence?",
            "answers": [
                "They are automatically suspended for one race",
                "They lose their seat in the team",
                "They receive an official warning only",
                "They must retake the theory test"
            ],
            "correctAnswer": "They are automatically suspended for one race",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_sustituto_emergencia_sabado():
    if LANG == "es":
        return {
            "question": "¿Puede un equipo inscribir un piloto sustituto el sábado si el titular sufre una lesión?",
            "answers": [
                "Sí, siempre que la FIA apruebe la superlicencia del nuevo piloto",
                "No, los cambios solo están permitidos antes del viernes",
                "Solo si el equipo no ha participado en FP3",
                "Sí, pero debe iniciar desde la pole"
            ],
            "correctAnswer": "Sí, siempre que la FIA apruebe la superlicencia del nuevo piloto",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a team register a substitute driver on Saturday if the main driver is injured?",
            "answers": [
                "Yes, if the FIA approves the new driver’s super licence",
                "No, changes are only allowed before Friday",
                "Only if the team didn’t participate in FP3",
                "Yes, but the driver must start from pole"
            ],
            "correctAnswer": "Yes, if the FIA approves the new driver’s super licence",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_limite_radio_piloto():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de mensajes están restringidos en la comunicación por radio entre equipo y piloto durante la carrera?",
            "answers": [
                "Instrucciones sobre rendimiento del coche o cambios en la configuración",
                "Mensajes de ánimo o felicitación",
                "Información meteorológica",
                "Alertas sobre coches cercanos"
            ],
            "correctAnswer": "Instrucciones sobre rendimiento del coche o cambios en la configuración",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What kind of radio messages are restricted between team and driver during the race?",
            "answers": [
                "Instructions about car performance or setup changes",
                "Motivational or congratulatory messages",
                "Weather updates",
                "Warnings about nearby cars"
            ],
            "correctAnswer": "Instructions about car performance or setup changes",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_comportamiento_fuera_de_pista():
    if LANG == "es":
        return {
            "question": "¿Puede un piloto ser sancionado por conducta fuera de pista durante un evento oficial?",
            "answers": [
                "Sí, si daña la imagen del campeonato o incumple normas de comportamiento",
                "No, solo se sanciona lo ocurrido en pista",
                "Solo si agrede a otro piloto",
                "No, pero se registra en su expediente"
            ],
            "correctAnswer": "Sí, si daña la imagen del campeonato o incumple normas de comportamiento",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver be penalized for off-track behavior during an official event?",
            "answers": [
                "Yes, if they damage the championship’s image or breach conduct rules",
                "No, only on-track behavior is penalized",
                "Only if they assault another driver",
                "No, but it is noted in their record"
            ],
            "correctAnswer": "Yes, if they damage the championship’s image or breach conduct rules",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_briefing_ausencia():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto no asiste al briefing obligatorio de pilotos?",
            "answers": [
                "Puede recibir una sanción de los comisarios",
                "Pierde su posición en la parrilla",
                "Solo debe firmar una excusa",
                "No tiene consecuencias"
            ],
            "correctAnswer": "Puede recibir una sanción de los comisarios",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver misses the mandatory drivers’ briefing?",
            "answers": [
                "They may receive a penalty from the stewards",
                "They lose their grid position",
                "They just need to sign an excuse",
                "There are no consequences"
            ],
            "correctAnswer": "They may receive a penalty from the stewards",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_comunicacion_durante_sancion():
    if LANG == "es":
        return {
            "question": "¿Está permitido que un piloto reciba mensajes estratégicos durante el cumplimiento de una sanción?",
            "answers": [
                "No, las comunicaciones están limitadas a razones de seguridad",
                "Sí, siempre que no se detenga el coche",
                "Solo si se trata de la estrategia de neumáticos",
                "Sí, si la sanción no es superior a 10 segundos"
            ],
            "correctAnswer": "No, las comunicaciones están limitadas a razones de seguridad",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver receive strategic messages during a penalty period?",
            "answers": [
                "No, communications are limited to safety reasons",
                "Yes, as long as the car isn’t stopped",
                "Only tyre strategy is allowed",
                "Yes, if the penalty is under 10 seconds"
            ],
            "correctAnswer": "No, communications are limited to safety reasons",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_ignorar_panel_amarillo():
    if LANG == "es":
        return {
            "question": "¿Qué sanción puede recibir un piloto por ignorar una doble bandera amarilla?",
            "answers": [
                "Penalización de tiempo y posible pérdida de superlicencia",
                "Solo una advertencia",
                "Bandera negra directa",
                "Cambio obligatorio de neumáticos"
            ],
            "correctAnswer": "Penalización de tiempo y posible pérdida de superlicencia",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty can a driver receive for ignoring double yellow flags?",
            "answers": [
                "Time penalty and possible super licence points deduction",
                "Only a warning",
                "Immediate black flag",
                "Mandatory tyre change"
            ],
            "correctAnswer": "Time penalty and possible super licence points deduction",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_limite_edad_minima():
    if LANG == "es":
        return {
            "question": "¿Cuál es el requisito mínimo de edad para obtener una superlicencia de la FIA?",
            "answers": ["18 años", "21 años", "16 años", "No hay mínimo"],
            "correctAnswer": "18 años",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the minimum age requirement to obtain an FIA super licence?",
            "answers": ["18 years", "21 years", "16 years", "No minimum"],
            "correctAnswer": "18 years",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_instrucciones_equipo_conduccion():
    if LANG == "es":
        return {
            "question": "¿Está permitido que el equipo indique al piloto cómo pilotar el coche durante la carrera?",
            "answers": [
                "Solo bajo condiciones de emergencia o seguridad",
                "Sí, sin restricciones",
                "Solo en clasificación",
                "Nunca, se considera asistencia externa"
            ],
            "correctAnswer": "Solo bajo condiciones de emergencia o seguridad",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can the team tell the driver how to drive the car during a race?",
            "answers": [
                "Only under emergency or safety conditions",
                "Yes, with no restrictions",
                "Only during qualifying",
                "Never, it’s considered external assistance"
            ],
            "correctAnswer": "Only under emergency or safety conditions",
            "knowledgeLevel": 3,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_participacion_eventos_fan():
    if LANG == "es":
        return {
            "question": "¿Qué deben hacer los pilotos que no participaron en actividades de fans el primer día de pista?",
            "answers": [
                "Estar disponibles para una sesión adicional de interacción con fans antes de la P3",
                "Asistir a una rueda de prensa extraordinaria",
                "Cumplir con tareas de comisariado",
                "No tienen ninguna obligación adicional"
            ],
            "correctAnswer": "Estar disponibles para una sesión adicional de interacción con fans antes de la P3",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must drivers who didn’t participate in fan activities on day one do?",
            "answers": [
                "Be available for an additional fan session before P3",
                "Attend an extra press conference",
                "Fulfill steward duties",
                "They have no additional obligations"
            ],
            "correctAnswer": "Be available for an additional fan session before P3",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_conducta_entrevista_post_q1_q2():
    if LANG == "es":
        return {
            "question": "¿Qué deben hacer los pilotos eliminados en Q1 o Q2 inmediatamente después?",
            "answers": [
                "Estar disponibles para entrevistas con medios",
                "Ir directamente a reunión técnica",
                "Retirarse a su zona de hospitalidad",
                "Cambiarse de uniforme antes de salir"
            ],
            "correctAnswer": "Estar disponibles para entrevistas con medios",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must drivers eliminated in Q1 or Q2 do immediately after the session?",
            "answers": [
                "Be available for media interviews",
                "Go directly to technical briefing",
                "Return to hospitality",
                "Change uniform before exit"
            ],
            "correctAnswer": "Be available for media interviews",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_indumentaria_entrevistas():
    if LANG == "es":
        return {
            "question": "¿Qué deben usar obligatoriamente los pilotos durante entrevistas oficiales posteriores a clasificación?",
            "answers": [
                "El uniforme del equipo correspondiente",
                "Ropa deportiva neutra",
                "Cualquier prenda personal sin logotipos",
                "Mono ignífugo completo"
            ],
            "correctAnswer": "El uniforme del equipo correspondiente",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must drivers wear during official post-qualifying interviews?",
            "answers": [
                "Their respective team uniforms",
                "Neutral sportswear",
                "Any personal garment without logos",
                "Full fireproof overalls"
            ],
            "correctAnswer": "Their respective team uniforms",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_obligacion_entrevista_post_sprint():
    if LANG == "es":
        return {
            "question": "¿Qué deben hacer los pilotos fuera del top 3 tras una carrera sprint?",
            "answers": [
                "Estar disponibles para entrevistas inmediatamente después",
                "Pueden abandonar sin dar declaraciones",
                "Solo asistir si se les llama por altavoz",
                "Esperar 15 minutos antes de salir"
            ],
            "correctAnswer": "Estar disponibles para entrevistas inmediatamente después",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must drivers outside the top 3 do after a sprint session?",
            "answers": [
                "Be available for interviews immediately after",
                "May leave without speaking",
                "Only attend if called by speaker",
                "Wait 15 minutes before exiting"
            ],
            "correctAnswer": "Be available for interviews immediately after",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_conducta_presentacion_previa():
    if LANG == "es":
        return {
            "question": "¿Cuál es la obligación de los pilotos respecto a la presentación previa a la carrera?",
            "answers": [
                "Participar en una actividad pública 2h10 antes de la vuelta de formación",
                "Firmar autógrafos a solicitud del promotor",
                "Enviar un video promocional el sábado",
                "Asistir a una reunión en el hospitality"
            ],
            "correctAnswer": "Participar en una actividad pública 2h10 antes de la vuelta de formación",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What are drivers required to do regarding the pre-race presentation?",
            "answers": [
                "Attend a public fan activity 2h10 before the formation lap",
                "Sign autographs if requested by promoter",
                "Submit a promo video on Saturday",
                "Attend a hospitality meeting"
            ],
            "correctAnswer": "Attend a public fan activity 2h10 before the formation lap",
            "knowledgeLevel": 2,
            "category": "Drivers",
            "language": LANG
        }

def pregunta_cuando_sirve_penalizacion():
    if LANG == "es":
        return {
            "question": "¿Cuántas veces puede cruzar un piloto la línea de meta antes de entrar a boxes a cumplir una sanción?",
            "answers": ["2 veces como máximo", "1 sola vez", "Ilimitadas", "Hasta que el coche de seguridad se retire"],
            "correctAnswer": "2 veces como máximo",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many times can a driver cross the finish line before serving a penalty?",
            "answers": ["Up to 2 times", "Only once", "Unlimited", "Until the safety car leaves"],
            "correctAnswer": "Up to 2 times",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_penalizacion_con_safetycar():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si se impone una sanción mientras hay coche de seguridad en pista?",
            "answers": [
                "No puede cumplirse hasta que termine el procedimiento del SC",
                "Se descarta automáticamente",
                "Se convierte en una penalización de parrilla",
                "Debe cumplirse inmediatamente"
            ],
            "correctAnswer": "No puede cumplirse hasta que termine el procedimiento del SC",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a penalty is issued during a safety car period?",
            "answers": [
                "It cannot be served until the SC procedure ends",
                "It is automatically cancelled",
                "It becomes a grid penalty",
                "It must be served immediately"
            ],
            "correctAnswer": "It cannot be served until the SC procedure ends",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_sancion_postcarrera():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de penalización puede aplicarse si la infracción ocurre en las últimas tres vueltas?",
            "answers": [
                "Penalización de tiempo añadida al resultado final",
                "Pérdida de puntos en el campeonato",
                "Salida desde el pit lane en la siguiente carrera",
                "Exclusión del resultado de clasificación"
            ],
            "correctAnswer": "Penalización de tiempo añadida al resultado final",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty may be applied if an infraction occurs in the last three laps?",
            "answers": [
                "Time penalty added to the final result",
                "Loss of championship points",
                "Start from the pit lane at next race",
                "Exclusion from qualifying results"
            ],
            "correctAnswer": "Time penalty added to the final result",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_penalizacion_no_completada():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si un piloto no puede cumplir una sanción durante la carrera por retirarse?",
            "answers": [
                "Se le impone una penalización en la parrilla de la siguiente carrera",
                "La sanción queda anulada",
                "Se convierte en sanción económica",
                "No puede competir en la siguiente sesión"
            ],
            "correctAnswer": "Se le impone una penalización en la parrilla de la siguiente carrera",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver retires and cannot serve their penalty?",
            "answers": [
                "A grid penalty is applied for the next race",
                "The penalty is voided",
                "It becomes a financial fine",
                "They are not allowed to compete in the next session"
            ],
            "correctAnswer": "A grid penalty is applied for the next race",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_no_trabajar_durante_penalizacion():
    if LANG == "es":
        return {
            "question": "Durante una penalización en boxes, ¿qué está prohibido hacer al equipo?",
            "answers": [
                "Tocar el coche antes de que pasen los segundos asignados",
                "Hablar por radio al piloto",
                "Cambiar los neumáticos traseros",
                "Colocar ventiladores"
            ],
            "correctAnswer": "Tocar el coche antes de que pasen los segundos asignados",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "During a penalty in the pits, what is the team prohibited from doing?",
            "answers": [
                "Touching the car before the penalty time elapses",
                "Speaking via radio to the driver",
                "Changing rear tyres",
                "Placing cooling fans"
            ],
            "correctAnswer": "Touching the car before the penalty time elapses",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_falso_arranque():
    if LANG == "es":
        return {
            "question": "¿Qué sanción recibe un piloto si realiza una salida anticipada (jump start)?",
            "answers": [
                "Penalización de 10 segundos o drive-through",
                "Penalización económica",
                "Descalificación inmediata",
                "Cambio obligatorio de posición en la parrilla"
            ],
            "correctAnswer": "Penalización de 10 segundos o drive-through",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty is given for a jump start?",
            "answers": [
                "10-second penalty or drive-through",
                "Financial fine",
                "Immediate disqualification",
                "Mandatory grid position drop"
            ],
            "correctAnswer": "10-second penalty or drive-through",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_stop_and_go():
    if LANG == "es":
        return {
            "question": "¿Qué implica una penalización tipo 'Stop and Go'?",
            "answers": [
                "El piloto debe detenerse completamente en boxes durante 10 segundos sin intervención",
                "Solo reduce 5 segundos del tiempo de carrera",
                "Puede cambiar neumáticos mientras cumple la sanción",
                "Se aplica solo al inicio de la carrera"
            ],
            "correctAnswer": "El piloto debe detenerse completamente en boxes durante 10 segundos sin intervención",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a 'Stop and Go' penalty involve?",
            "answers": [
                "The driver must stop completely in the pit box for 10 seconds with no work on the car",
                "Only subtracts 5 seconds from race time",
                "Tyres can be changed while serving it",
                "It only applies at race start"
            ],
            "correctAnswer": "The driver must stop completely in the pit box for 10 seconds with no work on the car",
            "knowledgeLevel": 2,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_sancion_multiple():
    if LANG == "es":
        return {
            "question": "¿Puede un piloto recibir más de una sanción en una misma carrera?",
            "answers": [
                "Sí, y deben cumplirse de forma separada",
                "No, solo una sanción por carrera es permitida",
                "Sí, pero solo si son iguales",
                "Solo si hay intervención del Safety Car"
            ],
            "correctAnswer": "Sí, y deben cumplirse de forma separada",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver receive more than one penalty in the same race?",
            "answers": [
                "Yes, and they must be served separately",
                "No, only one penalty per race is allowed",
                "Yes, but only if they are identical",
                "Only if a Safety Car is deployed"
            ],
            "correctAnswer": "Yes, and they must be served separately",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_no_cumple_stop_go():
    if LANG == "es":
        return {
            "question": "¿Qué pasa si un piloto entra a boxes pero no cumple correctamente una sanción de Stop & Go?",
            "answers": [
                "Puede ser descalificado por incumplimiento",
                "Se le resta un segundo adicional en la próxima vuelta",
                "Recibe una advertencia sin sanción",
                "La penalización se considera cumplida igualmente"
            ],
            "correctAnswer": "Puede ser descalificado por incumplimiento",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver pits but does not correctly serve a Stop & Go penalty?",
            "answers": [
                "They may be disqualified for non-compliance",
                "An extra second is subtracted on the next lap",
                "They only receive a warning",
                "The penalty is still considered served"
            ],
            "correctAnswer": "They may be disqualified for non-compliance",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_penalizacion_pits_anticipado():
    if LANG == "es":
        return {
            "question": "¿Qué pasa si un piloto entra en boxes para cumplir una penalización antes de que se le permita?",
            "answers": [
                "La penalización se considera no cumplida y puede recibir una nueva",
                "Se aplica igual sin consecuencias",
                "Se resta tiempo adicional al final de carrera",
                "Solo se aplica si lo detecta otro equipo"
            ],
            "correctAnswer": "La penalización se considera no cumplida y puede recibir una nueva",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a driver enters the pit to serve a penalty before it is allowed?",
            "answers": [
                "The penalty is considered unserved and may be reissued",
                "It is applied regardless",
                "Additional time is added at race end",
                "Only applied if reported by another team"
            ],
            "correctAnswer": "The penalty is considered unserved and may be reissued",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_falsa_declaracion_equipo():
    if LANG == "es":
        return {
            "question": "¿Qué sanción puede recibir un equipo si se demuestra que proporcionó información falsa para evitar una penalización?",
            "answers": [
                "Multa económica, pérdida de puntos o exclusión del evento",
                "Solo una advertencia pública",
                "Penalización de tiempo en carrera",
                "Suspensión de un miembro del personal técnico"
            ],
            "correctAnswer": "Multa económica, pérdida de puntos o exclusión del evento",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty can a team receive for providing false information to avoid a sanction?",
            "answers": [
                "Fine, loss of points, or event exclusion",
                "Only a public warning",
                "Time penalty during the race",
                "Suspension of a technical staff member"
            ],
            "correctAnswer": "Fine, loss of points, or event exclusion",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_acumulacion_sanciones_evento():
    if LANG == "es":
        return {
            "question": "¿Qué puede decidir Dirección de Carrera si un piloto acumula múltiples infracciones durante un mismo evento?",
            "answers": [
                "Imponer una sanción más severa acumulativa, como descalificación",
                "Reiniciar su contador de superlicencia",
                "Suspender al equipo completo",
                "Anular su clasificación en sesiones anteriores"
            ],
            "correctAnswer": "Imponer una sanción más severa acumulativa, como descalificación",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can Race Direction decide if a driver commits multiple infractions in the same event?",
            "answers": [
                "Apply a more severe cumulative penalty, such as disqualification",
                "Reset their super licence point counter",
                "Suspend the entire team",
                "Cancel their classification in previous sessions"
            ],
            "correctAnswer": "Apply a more severe cumulative penalty, such as disqualification",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_sancion_por_desobedecer_direccion():
    if LANG == "es":
        return {
            "question": "¿Qué puede implicar desobedecer instrucciones del director de carrera?",
            "answers": [
                "Desde una advertencia hasta descalificación, dependiendo de la gravedad",
                "Solo una multa económica",
                "Pérdida automática de 5 posiciones",
                "No tiene consecuencias si ocurre fuera de carrera"
            ],
            "correctAnswer": "Desde una advertencia hasta descalificación, dependiendo de la gravedad",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can happen if a driver disobeys the race director's instructions?",
            "answers": [
                "Anything from a warning to disqualification, depending on severity",
                "Only a financial fine",
                "Automatic 5-place grid drop",
                "No consequences if it happens off track"
            ],
            "correctAnswer": "Anything from a warning to disqualification, depending on severity",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_infraccion_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de penalización se aplica por infracciones en condiciones de parque cerrado?",
            "answers": [
                "Descalificación de la sesión afectada",
                "10 segundos de penalización en carrera",
                "Sanción solo económica",
                "Suspensión del piloto para la próxima sesión"
            ],
            "correctAnswer": "Descalificación de la sesión afectada",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What type of penalty is applied for parc fermé infringements?",
            "answers": [
                "Disqualification from the affected session",
                "10-second race penalty",
                "Only a financial penalty",
                "Driver suspension for the next session"
            ],
            "correctAnswer": "Disqualification from the affected session",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_orden_sancion_directa():
    if LANG == "es":
        return {
            "question": "¿Puede el director de carrera imponer directamente sanciones a los pilotos?",
            "answers": [
                "No, solo los comisarios pueden imponer sanciones",
                "Sí, pero solo durante entrenamientos",
                "Sí, si es por causas de seguridad",
                "Solo en condiciones de bandera roja"
            ],
            "correctAnswer": "No, solo los comisarios pueden imponer sanciones",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can the race director impose penalties directly on drivers?",
            "answers": [
                "No, only the stewards can impose penalties",
                "Yes, but only during practice sessions",
                "Yes, if it's for safety reasons",
                "Only under red flag conditions"
            ],
            "correctAnswer": "No, only the stewards can impose penalties",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_conduccion_peligrosa_sancion():
    if LANG == "es":
        return {
            "question": "¿Qué sanciones puede recibir un piloto por conducción peligrosa?",
            "answers": [
                "Desde advertencia hasta exclusión del evento",
                "Solo una multa y puntos en la superlicencia",
                "Cambio de motor obligatorio",
                "Parada obligatoria en la vuelta siguiente"
            ],
            "correctAnswer": "Desde advertencia hasta exclusión del evento",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalties can a driver receive for dangerous driving?",
            "answers": [
                "Anything from a warning to exclusion from the event",
                "Only a fine and super licence points",
                "Mandatory engine change",
                "Mandatory stop on next lap"
            ],
            "correctAnswer": "Anything from a warning to exclusion from the event",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_infraccion_tecnica_equipo():
    if LANG == "es":
        return {
            "question": "¿Qué sanción puede recibir un equipo si se detecta una infracción técnica en el coche tras la carrera?",
            "answers": [
                "Descalificación o pérdida de puntos",
                "Solo una reprimenda técnica",
                "Sanción aplicada al piloto rival",
                "Revisión del resultado por la FIA sin consecuencias"
            ],
            "correctAnswer": "Descalificación o pérdida de puntos",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What penalty can a team receive for a technical infringement found after the race?",
            "answers": [
                "Disqualification or loss of points",
                "Only a technical reprimand",
                "Penalty applied to rival driver",
                "FIA review without consequences"
            ],
            "correctAnswer": "Disqualification or loss of points",
            "knowledgeLevel": 3,
            "category": "Penalty",
            "language": LANG
        }

def pregunta_vuelta_rapida_puntos():
    if LANG == "es":
        return {
            "question": "¿Qué condición debe cumplirse para otorgar el punto extra por vuelta rápida?",
            "answers": [
                "El piloto debe terminar entre los 10 primeros",
                "Debe hacerse con neumáticos duros",
                "Solo se otorga si es la última vuelta",
                "Debe haber al menos 15 coches en pista"
            ],
            "correctAnswer": "El piloto debe terminar entre los 10 primeros",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What condition must be met to earn the fastest lap bonus point?",
            "answers": [
                "The driver must finish in the top 10",
                "It must be done on hard tyres",
                "Only if set on the final lap",
                "There must be at least 15 cars on track"
            ],
            "correctAnswer": "The driver must finish in the top 10",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_carrera_entre_50_75():
    if LANG == "es":
        return {
            "question": "¿Qué porcentaje de puntos se otorgan si una carrera se completa entre el 50% y el 75% de su distancia?",
            "answers": [
                "75% de los puntos normales",
                "50% de los puntos normales",
                "Puntos completos",
                "25% de los puntos normales"
            ],
            "correctAnswer": "75% de los puntos normales",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What percentage of points are awarded if a race is completed between 50% and 75% of its distance?",
            "answers": [
                "75% of normal points",
                "50% of normal points",
                "Full points",
                "25% of normal points"
            ],
            "correctAnswer": "75% of normal points",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }

def pregunta_empate_puntos_campeonato():
    if LANG == "es":
        return {
            "question": "¿Qué criterio se usa para desempatar si dos pilotos tienen la misma cantidad de puntos?",
            "answers": [
                "Mayor número de victorias",
                "Mejor posición en la última carrera",
                "Menor número de abandonos",
                "Resultado de la clasificación en la última carrera"
            ],
            "correctAnswer": "Mayor número de victorias",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the tiebreaker if two drivers have the same number of points?",
            "answers": [
                "Most wins",
                "Best result in the last race",
                "Fewest retirements",
                "Last qualifying position"
            ],
            "correctAnswer": "Most wins",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_constructores():
    if LANG == "es":
        return {
            "question": "¿Cómo se calcula la puntuación de un equipo para el campeonato de constructores?",
            "answers": [
                "Sumando los puntos de ambos pilotos por carrera",
                "Solo se cuenta el piloto mejor clasificado",
                "Se suman las posiciones en clasificación",
                "Se restan penalizaciones de parc fermé"
            ],
            "correctAnswer": "Sumando los puntos de ambos pilotos por carrera",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How is a team's score calculated in the Constructors' Championship?",
            "answers": [
                "By summing both drivers' points per race",
                "Only the best finishing driver counts",
                "By adding qualifying positions",
                "By subtracting parc fermé penalties"
            ],
            "correctAnswer": "By summing both drivers' points per race",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_piloto_abandono():
    if LANG == "es":
        return {
            "question": "¿Puede un piloto obtener puntos si abandona antes del final de la carrera?",
            "answers": [
                "Sí, si ha completado al menos el 90% de la distancia",
                "No, siempre pierde todos los puntos",
                "Solo si es líder del campeonato",
                "Solo si el abandono ocurre en la última vuelta"
            ],
            "correctAnswer": "Sí, si ha completado al menos el 90% de la distancia",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a driver earn points if they retire before the end of the race?",
            "answers": [
                "Yes, if they completed at least 90% of the distance",
                "No, they always lose all points",
                "Only if they lead the championship",
                "Only if the retirement occurs on the last lap"
            ],
            "correctAnswer": "Yes, if they completed at least 90% of the distance",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }

def pregunta_reparto_puntos_menos_50():
    if LANG == "es":
        return {
            "question": "¿Qué porcentaje de puntos se otorgan si una carrera se detiene antes del 50% de su distancia?",
            "answers": [
                "50% o menos, según el reglamento",
                "Puntos completos",
                "Solo el primer lugar puntúa",
                "No se otorgan puntos en absoluto"
            ],
            "correctAnswer": "50% o menos, según el reglamento",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What percentage of points are awarded if a race is stopped before 50% distance?",
            "answers": [
                "50% or less, according to the rules",
                "Full points",
                "Only first place scores",
                "No points are awarded at all"
            ],
            "correctAnswer": "50% or less, according to the rules",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_por_posicion():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos recibe el piloto que finaliza en tercera posición en una carrera regular?",
            "answers": ["15 puntos", "18 puntos", "20 puntos", "12 puntos"],
            "correctAnswer": "15 puntos",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does the third-place finisher earn in a regular race?",
            "answers": ["15 points", "18 points", "20 points", "12 points"],
            "correctAnswer": "15 points",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_reduccion_pista_insegura():
    if LANG == "es":
        return {
            "question": "¿Qué debe ocurrir para que se otorgue solo la mitad de los puntos en una carrera suspendida?",
            "answers": [
                "Que se complete más del 25% pero menos del 50% de la distancia",
                "Que haya menos de 12 coches en pista",
                "Que haya bandera roja en las dos primeras vueltas",
                "Que la pista esté húmeda pero sin lluvia"
            ],
            "correctAnswer": "Que se complete más del 25% pero menos del 50% de la distancia",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When are half points awarded in a suspended race?",
            "answers": [
                "If more than 25% but less than 50% of the distance is completed",
                "If fewer than 12 cars remain",
                "If red flag is shown in the first two laps",
                "If the track is wet but not raining"
            ],
            "correctAnswer": "If more than 25% but less than 50% of the distance is completed",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_minimos_para_constructor():
    if LANG == "es":
        return {
            "question": "¿Cuál es la cantidad mínima de puntos que puede sumar un equipo en una carrera si solo uno de sus coches puntúa en décima posición?",
            "answers": ["1 punto", "2 puntos", "0.5 puntos", "3 puntos"],
            "correctAnswer": "1 punto",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the minimum number of points a team can score in a race if only one car finishes 10th?",
            "answers": ["1 point", "2 points", "0.5 points", "3 points"],
            "correctAnswer": "1 point",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_noveno_clasificado():
    if LANG == "es":
        return {
            "question": "¿Cuántos puntos obtiene el piloto que termina en novena posición en una carrera normal?",
            "answers": ["2", "1", "4", "0"],
            "correctAnswer": "2",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many points does the driver finishing 9th receive in a regular race?",
            "answers": ["2", "1", "4", "0"],
            "correctAnswer": "2",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_puntos_piloto_fuera_top10():
    if LANG == "es":
        return {
            "question": "¿Recibe puntos un piloto que finaliza fuera del top 10?",
            "answers": ["No, salvo excepciones como vuelta rápida", "Sí, si completa el 100% de la carrera", "Solo si hay bandera roja", "Sí, siempre que no haya sanciones"],
            "correctAnswer": "No, salvo excepciones como vuelta rápida",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Does a driver score points if they finish outside the top 10?",
            "answers": ["No, unless exceptions like fastest lap apply", "Yes, if they complete 100% of the race", "Only if red flag is shown", "Yes, as long as no penalties are given"],
            "correctAnswer": "No, unless exceptions like fastest lap apply",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_criterio_puntos_media_carrera():
    if LANG == "es":
        return {
            "question": "¿Cuál es el criterio mínimo de vueltas para otorgar puntos en una carrera interrumpida?",
            "answers": ["Más del 25% de la distancia total", "Más de 5 vueltas completadas", "Al menos 20 minutos de duración", "Cuando al menos 12 coches siguen en pista"],
            "correctAnswer": "Más del 25% de la distancia total",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the minimum distance for awarding points in an interrupted race?",
            "answers": ["More than 25% of the total race distance", "More than 5 laps completed", "At least 20 minutes duration", "When at least 12 cars are running"],
            "correctAnswer": "More than 25% of the total race distance",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }

def pregunta_reparto_puntos_sprint_top8():
    if LANG == "es":
        return {
            "question": "¿Cuántos pilotos reciben puntos en una carrera sprint?",
            "answers": ["Los 8 primeros", "Solo los 3 primeros", "Los 10 primeros", "Solo el ganador"],
            "correctAnswer": "Los 8 primeros",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many drivers score points in a sprint race?",
            "answers": ["Top 8", "Only top 3", "Top 10", "Only the winner"],
            "correctAnswer": "Top 8",
            "knowledgeLevel": 2,
            "category": "Scores",
            "language": LANG
        }

def pregunta_validez_puntos_tiempo():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si una carrera no alcanza los 2 giros completos cronometrados?",
            "answers": ["No se otorgan puntos", "Se otorgan puntos al top 3", "Solo se da medio punto al ganador", "Todos los equipos reciben 1 punto"],
            "correctAnswer": "No se otorgan puntos",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a race does not reach two full timed laps?",
            "answers": ["No points are awarded", "Top 3 receive points", "Only the winner gets half a point", "All teams get 1 point"],
            "correctAnswer": "No points are awarded",
            "knowledgeLevel": 3,
            "category": "Scores",
            "language": LANG
        }

def pregunta_motivo_penalizacion_pc():
    if LANG == "es":
        return {
            "question": "¿Cuál es la penalización si se rompe el parque cerrado sin autorización?",
            "answers": [
                "El coche debe salir desde el pit lane",
                "Se anula la sesión de clasificación",
                "Se impone una multa económica",
                "Se repite la inspección técnica"
            ],
            "correctAnswer": "El coche debe salir desde el pit lane",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the penalty if parc fermé conditions are broken without permission?",
            "answers": [
                "The car must start from the pit lane",
                "Qualifying results are cancelled",
                "A financial fine is imposed",
                "A new technical inspection is required"
            ],
            "correctAnswer": "The car must start from the pit lane",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_limpieza_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Está permitido limpiar el coche mientras está en parque cerrado?",
            "answers": [
                "Sí, está permitido",
                "No, salvo que lo autorice la FIA",
                "Solo si el coche está dañado",
                "Sí, pero solo con agua"
            ],
            "correctAnswer": "Sí, está permitido",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is it allowed to clean the car while it is under parc fermé?",
            "answers": [
                "Yes, it is allowed",
                "No, unless FIA gives permission",
                "Only if the car is damaged",
                "Yes, but only with water"
            ],
            "correctAnswer": "Yes, it is allowed",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_modificaciones_condiciones_climaticas():
    if LANG == "es":
        return {
            "question": "¿Qué se puede modificar durante parque cerrado si hay cambio climático importante?",
            "answers": [
                "Elementos permitidos por el delegado técnico para adaptación climática",
                "Se permite cambiar toda la suspensión",
                "Solo se permite cambio de alerón trasero",
                "Se puede modificar el motor completamente"
            ],
            "correctAnswer": "Elementos permitidos por el delegado técnico para adaptación climática",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What may be modified under parc fermé if weather conditions change significantly?",
            "answers": [
                "Only components allowed by the FIA delegate for weather adaptation",
                "Entire suspension system",
                "Only the rear wing",
                "The full engine can be replaced"
            ],
            "correctAnswer": "Only components allowed by the FIA delegate for weather adaptation",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_objeto_prohibido_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de asistencia está prohibida en el parque cerrado?",
            "answers": [
                "Toda intervención no autorizada por oficiales designados",
                "Uso de ventiladores de frenos",
                "Revisión del sistema de dirección",
                "Sustitución del combustible"
            ],
            "correctAnswer": "Toda intervención no autorizada por oficiales designados",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What type of work is forbidden under parc fermé?",
            "answers": [
                "Any intervention not authorized by designated officials",
                "Using brake cooling fans",
                "Steering system checks",
                "Refueling the car"
            ],
            "correctAnswer": "Any intervention not authorized by designated officials",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_cantidad_mecanicos_pc():
    if LANG == "es":
        return {
            "question": "¿Cuántos miembros del equipo pueden acceder al coche en parque cerrado?",
            "answers": ["3 por coche", "2 por equipo", "4 por coche", "Solo el delegado técnico"],
            "correctAnswer": "3 por coche",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many team members are allowed access to each car during parc fermé?",
            "answers": ["3 per car", "2 per team", "4 per car", "Only the technical delegate"],
            "correctAnswer": "3 per car",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }


def pregunta_sello_pre_sprint():
    if LANG == "es":
        return {
            "question": "¿Cuándo pueden retirarse los sellos del coche antes de una sesión sprint?",
            "answers": [
                "Tres horas antes de la vuelta de formación",
                "Inmediatamente después de clasificación",
                "Cinco minutos antes de la carrera",
                "Cuando lo indique el piloto"
            ],
            "correctAnswer": "Tres horas antes de la vuelta de formación",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When can car seals be removed before a sprint session?",
            "answers": [
                "Three hours before the formation lap",
                "Right after qualifying",
                "Five minutes before the race",
                "When the driver requests it"
            ],
            "correctAnswer": "Three hours before the formation lap",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_peso_aceite_pc():
    if LANG == "es":
        return {
            "question": "¿Qué información sobre el aceite debe proporcionarse durante parque cerrado?",
            "answers": [
                "La masa de cada tanque de aceite (excepto el principal) una hora antes de la carrera",
                "El tipo de lubricante usado durante la temporada",
                "El proveedor del aceite",
                "La temperatura mínima de arranque"
            ],
            "correctAnswer": "La masa de cada tanque de aceite (excepto el principal) una hora antes de la carrera",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What oil information must teams provide under parc fermé?",
            "answers": [
                "The weight of each oil tank (excluding the main one) one hour before the race",
                "Type of lubricant used during the season",
                "The oil supplier",
                "Minimum engine start temperature"
            ],
            "correctAnswer": "The weight of each oil tank (excluding the main one) one hour before the race",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_entrada_directa_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Qué deben hacer los coches tras recibir la bandera a cuadros?",
            "answers": [
                "Dirigirse directamente al parque cerrado sin retrasos ni asistencia",
                "Pueden detenerse para celebrar",
                "Revisar el coche en boxes primero",
                "Esperar instrucciones de su equipo"
            ],
            "correctAnswer": "Dirigirse directamente al parque cerrado sin retrasos ni asistencia",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must cars do after crossing the finish line?",
            "answers": [
                "Go directly to parc fermé without delay or assistance",
                "Stop to celebrate",
                "First return to the pit box",
                "Wait for team instructions"
            ],
            "correctAnswer": "Go directly to parc fermé without delay or assistance",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_reemplazo_piezas_con_autorizacion():
    if LANG == "es":
        return {
            "question": "¿Puede reemplazarse una pieza durante parque cerrado?",
            "answers": [
                "Sí, solo con acuerdo del delegado técnico",
                "No bajo ninguna circunstancia",
                "Sí, siempre que sea idéntica",
                "Solo si se daña durante la vuelta de formación"
            ],
            "correctAnswer": "Sí, solo con acuerdo del delegado técnico",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a car part be replaced during parc fermé?",
            "answers": [
                "Yes, only with the technical delegate’s approval",
                "No, under any circumstance",
                "Yes, as long as it’s an identical part",
                "Only if damaged during the formation lap"
            ],
            "correctAnswer": "Yes, only with the technical delegate’s approval",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_cobertura_noche_pc():
    if LANG == "es":
        return {
            "question": "¿Qué se permite hacer con los coches mientras están cubiertos durante la noche en parque cerrado?",
            "answers": [
                "Instalar dispositivos de calentamiento",
                "Cambiar neumáticos",
                "Abrir la carrocería para inspección",
                "Ajustar alerones"
            ],
            "correctAnswer": "Instalar dispositivos de calentamiento",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is allowed while the cars are covered overnight in parc fermé?",
            "answers": [
                "Installing heating devices",
                "Changing tyres",
                "Opening the bodywork for inspection",
                "Adjusting the wings"
            ],
            "correctAnswer": "Installing heating devices",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_mecanicos_permitidos_pc():
    if LANG == "es":
        return {
            "question": "¿Cuántos mecánicos por coche pueden acceder al parque cerrado tras una carrera?",
            "answers": ["Máximo 3", "Solo 1", "Ilimitados si hay autorización", "Ninguno hasta pesaje"],
            "correctAnswer": "Máximo 3",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many mechanics per car are allowed into parc fermé after a race?",
            "answers": ["Maximum 3", "Only 1", "Unlimited if authorized", "None until weighing"],
            "correctAnswer": "Maximum 3",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_quien_supervisa_pc():
    if LANG == "es":
        return {
            "question": "¿Quién está autorizado a dar instrucciones dentro del parque cerrado?",
            "answers": ["Solo los oficiales designados", "El jefe de equipo", "El comisario de pista más cercano", "El responsable de prensa"],
            "correctAnswer": "Solo los oficiales designados",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Who is authorized to give instructions inside parc fermé?",
            "answers": ["Only designated officials", "The team principal", "The nearest track marshal", "The press officer"],
            "correctAnswer": "Only designated officials",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_modificacion_suspension_pc():
    if LANG == "es":
        return {
            "question": "¿Está permitido modificar la suspensión del coche durante parque cerrado?",
            "answers": [
                "No, salvo autorización expresa de la FIA",
                "Sí, siempre que no cambie la geometría",
                "Solo si es por razones aerodinámicas",
                "Sí, si el circuito es urbano"
            ],
            "correctAnswer": "No, salvo autorización expresa de la FIA",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Is it allowed to modify the suspension setup during parc fermé?",
            "answers": [
                "No, unless expressly authorized by the FIA",
                "Yes, as long as geometry does not change",
                "Only for aerodynamic reasons",
                "Yes, if the circuit is a street track"
            ],
            "correctAnswer": "No, unless expressly authorized by the FIA",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_cambio_climatico_excepcional():
    if LANG == "es":
        return {
            "question": "¿Qué procedimiento se activa si hay un cambio climático extremo durante parque cerrado?",
            "answers": [
                "La FIA notifica con 'CHANGE IN CLIMATIC CONDITIONS'",
                "Se suspende el parque cerrado automáticamente",
                "Todos los equipos pueden hacer libremente cambios",
                "Se cancela la sesión de clasificación anterior"
            ],
            "correctAnswer": "La FIA notifica con 'CHANGE IN CLIMATIC CONDITIONS'",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What procedure is triggered if extreme weather changes occur during parc fermé?",
            "answers": [
                "FIA sends a 'CHANGE IN CLIMATIC CONDITIONS' message",
                "Parc fermé is automatically suspended",
                "All teams are free to modify their setups",
                "The previous qualifying session is canceled"
            ],
            "correctAnswer": "FIA sends a 'CHANGE IN CLIMATIC CONDITIONS' message",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_seleccion_fia_revision_pc():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre tras clasificación si la FIA selecciona un coche para revisión en parque cerrado?",
            "answers": [
                "Debe dirigirse inmediatamente al parque cerrado",
                "Se puede revisar después de la conferencia de prensa",
                "Se autoriza a los ingenieros a revisarlo antes",
                "Debe ser llevado a boxes para inspección"
            ],
            "correctAnswer": "Debe dirigirse inmediatamente al parque cerrado",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens after qualifying if the FIA selects a car for parc fermé inspection?",
            "answers": [
                "It must proceed immediately to parc fermé",
                "It can be checked after the press conference",
                "Engineers are allowed to check it first",
                "It must be taken to the garage for inspection"
            ],
            "correctAnswer": "It must proceed immediately to parc fermé",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_modificacion_neumaticos_autorizada():
    if LANG == "es":
        return {
            "question": "¿Cuándo puede un equipo cambiar los neumáticos del coche durante parque cerrado?",
            "answers": [
                "Solo si Dirección de Carrera lo autoriza por motivos de seguridad o clima",
                "En cualquier momento antes de la parrilla",
                "Si el piloto lo solicita por radio",
                "Siempre que no cambien el compuesto"
            ],
            "correctAnswer": "Solo si Dirección de Carrera lo autoriza por motivos de seguridad o clima",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When can a team change tyres during parc fermé?",
            "answers": [
                "Only if Race Control authorizes it for safety or weather reasons",
                "At any time before the grid is formed",
                "If the driver requests it by radio",
                "As long as the compound remains the same"
            ],
            "correctAnswer": "Only if Race Control authorizes it for safety or weather reasons",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_cierre_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Cuándo entra en vigor el parque cerrado durante un fin de semana de Gran Premio?",
            "answers": [
                "Desde el inicio de la clasificación",
                "Después de los Libres 3",
                "En cuanto termina la carrera",
                "Al finalizar la vuelta de formación"
            ],
            "correctAnswer": "Desde el inicio de la clasificación",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When does parc fermé come into effect during a Grand Prix weekend?",
            "answers": [
                "From the start of qualifying",
                "After Free Practice 3",
                "As soon as the race ends",
                "At the end of the formation lap"
            ],
            "correctAnswer": "From the start of qualifying",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_piloto_debe_abandonar_pc():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer el piloto tras detenerse en parque cerrado?",
            "answers": [
                "Abandonar el coche sin ayuda externa",
                "Esperar dentro hasta que lo retiren los comisarios",
                "Acompañar al coche al pesaje",
                "Pedir permiso para salir del habitáculo"
            ],
            "correctAnswer": "Abandonar el coche sin ayuda externa",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must the driver do after stopping in parc fermé?",
            "answers": [
                "Exit the car without external assistance",
                "Wait inside until stewards remove the car",
                "Escort the car to weighing",
                "Request permission before exiting the cockpit"
            ],
            "correctAnswer": "Exit the car without external assistance",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_protecciones_parque_cerrado():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de cobertura está permitida sobre los coches en parque cerrado nocturno?",
            "answers": [
                "Una lona ignífuga aprobada por la FIA",
                "Cualquier carpa del equipo",
                "Cubiertas reflectantes para el sol",
                "Plásticos opacos de color negro"
            ],
            "correctAnswer": "Una lona ignífuga aprobada por la FIA",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What kind of cover is allowed on cars overnight in parc fermé?",
            "answers": [
                "A FIA-approved fireproof cover",
                "Any team tent",
                "Reflective sun sheets",
                "Opaque black plastic sheets"
            ],
            "correctAnswer": "A FIA-approved fireproof cover",
            "knowledgeLevel": 2,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_trabajo_pc_por_fallo_tecnico():
    if LANG == "es":
        return {
            "question": "¿Puede un equipo trabajar en el coche durante parque cerrado si se detecta un fallo técnico?",
            "answers": [
                "Sí, si el delegado técnico de la FIA lo aprueba expresamente",
                "Solo si hay bandera roja",
                "No, debe esperar hasta el día siguiente",
                "Sí, con autorización del jefe de equipo"
            ],
            "correctAnswer": "Sí, si el delegado técnico de la FIA lo aprueba expresamente",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Can a team work on the car during parc fermé if a technical issue is found?",
            "answers": [
                "Yes, if expressly approved by the FIA technical delegate",
                "Only if there is a red flag",
                "No, they must wait until the next day",
                "Yes, with team principal approval"
            ],
            "correctAnswer": "Yes, if expressly approved by the FIA technical delegate",
            "knowledgeLevel": 3,
            "category": "ParcFerme",
            "language": LANG
        }

def pregunta_guantes_biometricos():
    if LANG == "es":
        return {
            "question": "¿Cuál es el propósito de los guantes biométricos obligatorios para pilotos?",
            "answers": [
                "Permitir el monitoreo médico en tiempo real",
                "Reducir la sudoración durante la carrera",
                "Evitar ampollas por fricción",
                "Mejorar el agarre del volante"
            ],
            "correctAnswer": "Permitir el monitoreo médico en tiempo real",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the purpose of mandatory biometric gloves for drivers?",
            "answers": [
                "To allow real-time medical monitoring",
                "To reduce sweating during the race",
                "To prevent friction blisters",
                "To improve steering grip"
            ],
            "correctAnswer": "To allow real-time medical monitoring",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_extintor_seguridad():
    if LANG == "es":
        return {
            "question": "¿Cuál es el requisito obligatorio sobre sistemas de extinción en los coches de F1?",
            "answers": [
                "Deben activarse manual y automáticamente",
                "Solo deben activarse desde el cockpit",
                "Pueden ser externos al chasis",
                "Solo son obligatorios si hay fuego"
            ],
            "correctAnswer": "Deben activarse manual y automáticamente",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the mandatory requirement for F1 car fire extinguishing systems?",
            "answers": [
                "They must be activated both manually and automatically",
                "They must only be cockpit-controlled",
                "They can be located outside the chassis",
                "Only required in case of fire"
            ],
            "correctAnswer": "They must be activated both manually and automatically",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_dispositivo_halo():
    if LANG == "es":
        return {
            "question": "¿Cuál es la función principal del sistema de protección 'halo' en F1?",
            "answers": [
                "Proteger la cabeza del piloto ante impactos frontales",
                "Reducir la resistencia aerodinámica",
                "Mejorar la visibilidad lateral",
                "Sujetar la visera del casco"
            ],
            "correctAnswer": "Proteger la cabeza del piloto ante impactos frontales",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main function of the F1 'halo' safety device?",
            "answers": [
                "To protect the driver's head from frontal impacts",
                "To reduce aerodynamic drag",
                "To improve lateral visibility",
                "To support the helmet visor"
            ],
            "correctAnswer": "To protect the driver's head from frontal impacts",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }

def pregunta_apagado_emergencia():
    if LANG == "es":
        return {
            "question": "¿Qué debe poder hacer el sistema eléctrico de un coche en caso de emergencia?",
            "answers": [
                "Ser desconectado desde fuera y dentro del coche",
                "Emitir una señal acústica",
                "Mostrar advertencias visuales en el cockpit",
                "Encender el overtake automáticamente"
            ],
            "correctAnswer": "Ser desconectado desde fuera y dentro del coche",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must the electrical system of an F1 car be able to do in case of emergency?",
            "answers": [
                "Be shut off from both outside and inside the car",
                "Emit an acoustic signal",
                "Display visual warnings on the cockpit",
                "Automatically activate overtake mode"
            ],
            "correctAnswer": "Be shut off from both outside and inside the car",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_indumentaria_resistente_fuego():
    if LANG == "es":
        return {
            "question": "¿Qué característica deben cumplir los trajes, guantes y ropa interior de los pilotos?",
            "answers": [
                "Ser resistentes al fuego certificados por la FIA",
                "Ser fabricados por el equipo",
                "Incluir el logo del patrocinador principal",
                "Tener al menos tres capas de algodón"
            ],
            "correctAnswer": "Ser resistentes al fuego certificados por la FIA",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What requirement must drivers' suits, gloves, and underwear meet?",
            "answers": [
                "They must be fire-resistant and FIA certified",
                "They must be team-manufactured",
                "They must include the main sponsor's logo",
                "They must have at least three cotton layers"
            ],
            "correctAnswer": "They must be fire-resistant and FIA certified",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }

def pregunta_iluminacion_emergencia_pc():
    if LANG == "es":
        return {
            "question": "¿Qué dispositivo luminoso obligatorio indica el estado de un coche híbrido tras un accidente?",
            "answers": [
                "Luz indicadora de estado del sistema de alto voltaje",
                "LED de freno trasero",
                "Faro de activación manual",
                "Intermitente del lado izquierdo"
            ],
            "correctAnswer": "Luz indicadora de estado del sistema de alto voltaje",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What mandatory light device indicates the status of a hybrid car after an accident?",
            "answers": [
                "High-voltage system status indicator light",
                "Rear brake LED",
                "Manually activated headlight",
                "Left side turn signal"
            ],
            "correctAnswer": "High-voltage system status indicator light",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_panel_luz_amarilla_box():
    if LANG == "es":
        return {
            "question": "¿Qué deben hacer los equipos cuando se activa la luz amarilla en el pit wall?",
            "answers": [
                "Evitar el trabajo en el coche hasta recibir autorización",
                "Proceder con revisión de frenos",
                "Cambiar a neumáticos de lluvia",
                "Abandonar el muro temporalmente"
            ],
            "correctAnswer": "Evitar el trabajo en el coche hasta recibir autorización",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must teams do when the yellow light is activated on the pit wall?",
            "answers": [
                "Refrain from working on the car until authorized",
                "Check the brake system",
                "Switch to wet tyres",
                "Temporarily abandon the pit wall"
            ],
            "correctAnswer": "Refrain from working on the car until authorized",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_sensor_inercia_accidente():
    if LANG == "es":
        return {
            "question": "¿Qué sistema obligatorio registra los impactos en caso de accidente?",
            "answers": [
                "Registrador de inercia homologado por FIA",
                "Sensor del alerón delantero",
                "Módulo de telemetría de temperatura",
                "Unidad de control de válvulas"
            ],
            "correctAnswer": "Registrador de inercia homologado por FIA",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What mandatory system records impact data in case of an accident?",
            "answers": [
                "FIA-homologated inertial data recorder",
                "Front wing sensor",
                "Telemetry temperature module",
                "Valve control unit"
            ],
            "correctAnswer": "FIA-homologated inertial data recorder",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_equipo_rescate_box():
    if LANG == "es":
        return {
            "question": "¿Qué debe tener cada equipo disponible en el garaje por razones de seguridad?",
            "answers": [
                "Extintor homologado accesible al personal",
                "Un segundo casco para el piloto",
                "Manual de protocolo digital",
                "Luces LED de emergencia"
            ],
            "correctAnswer": "Extintor homologado accesible al personal",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must each team have available in the garage for safety purposes?",
            "answers": [
                "Homologated fire extinguisher accessible to staff",
                "A second helmet for the driver",
                "Digital protocol handbook",
                "Emergency LED lights"
            ],
            "correctAnswer": "Homologated fire extinguisher accessible to staff",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }

def pregunta_sistema_extraccion():
    if LANG == "es":
        return {
            "question": "¿Qué requisito debe cumplir el diseño del cockpit en términos de evacuación del piloto?",
            "answers": [
                "Permitir la salida del piloto en menos de 10 segundos sin ayuda externa",
                "Incluir una escotilla superior desmontable",
                "Tener sensores de presión bajo el asiento",
                "Incluir sistema de aire autónomo"
            ],
            "correctAnswer": "Permitir la salida del piloto en menos de 10 segundos sin ayuda externa",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What requirement must the cockpit design meet regarding driver evacuation?",
            "answers": [
                "Allow the driver to exit unaided in under 10 seconds",
                "Include a removable top hatch",
                "Have pressure sensors under the seat",
                "Include an autonomous air system"
            ],
            "correctAnswer": "Allow the driver to exit unaided in under 10 seconds",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_iluminacion_lluvia():
    if LANG == "es":
        return {
            "question": "¿Qué luces deben estar encendidas cuando un coche usa neumáticos intermedios o de lluvia?",
            "answers": [
                "Todas las luces traseras, incluyendo la luz central y las laterales",
                "Solo la luz central",
                "Los intermitentes traseros",
                "La luz verde de señalización"
            ],
            "correctAnswer": "Todas las luces traseras, incluyendo la luz central y las laterales",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What lights must be on when a car is using intermediate or wet tyres?",
            "answers": [
                "All rear lights, including central and side lights",
                "Only the central light",
                "Rear turn signals",
                "The green signal light"
            ],
            "correctAnswer": "All rear lights, including central and side lights",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_restriccion_edad_boxes():
    if LANG == "es":
        return {
            "question": "¿Quién no está permitido en el pit lane durante las sesiones oficiales?",
            "answers": [
                "Personas menores de 16 años sin autorización FIA",
                "Mecánicos con chaleco reflectante",
                "Periodistas acreditados",
                "Pilotos suplentes"
            ],
            "correctAnswer": "Personas menores de 16 años sin autorización FIA",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Who is not allowed in the pit lane during official sessions?",
            "answers": [
                "Persons under 16 years old without FIA authorization",
                "Mechanics with reflective vests",
                "Accredited journalists",
                "Reserve drivers"
            ],
            "correctAnswer": "Persons under 16 years old without FIA authorization",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }

def pregunta_medico_post_accidente():
    if LANG == "es":
        return {
            "question": "¿Qué debe hacer un piloto si se activa la luz de impacto tras un accidente?",
            "answers": [
                "Puede ser obligado a someterse a un examen médico inmediato",
                "Debe regresar directamente al hospitality",
                "Debe abandonar el coche sin ayuda",
                "Solo puede seguir si el coche sigue funcionando"
            ],
            "correctAnswer": "Puede ser obligado a someterse a un examen médico inmediato",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must a driver do if the impact warning light is activated after an accident?",
            "answers": [
                "They may be required to undergo immediate medical examination",
                "Return directly to hospitality",
                "Exit the car without help",
                "Continue only if the car is operational"
            ],
            "correctAnswer": "They may be required to undergo immediate medical examination",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_max_personas_muro():
    if LANG == "es":
        return {
            "question": "¿Cuántos miembros del equipo pueden estar en el muro de señalización durante una sesión?",
            "answers": ["12", "10", "15", "8"],
            "correctAnswer": "12",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How many team members are allowed at the signalling wall during a session?",
            "answers": ["12", "10", "15", "8"],
            "correctAnswer": "12",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }

def pregunta_extintores_garaje():
    if LANG == "es":
        return {
            "question": "¿Qué debe tener cada equipo disponible en su garaje según el reglamento de seguridad?",
            "answers": [
                "Dos extintores de 5 kg en correcto funcionamiento",
                "Una ducha de emergencia activada",
                "Ropa ignífuga de repuesto",
                "Detectores de gases"
            ],
            "correctAnswer": "Dos extintores de 5 kg en correcto funcionamiento",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What must each team have available in their garage according to safety regulations?",
            "answers": [
                "Two functioning 5kg fire extinguishers",
                "An active emergency shower",
                "Spare fireproof clothing",
                "Gas detectors"
            ],
            "correctAnswer": "Two functioning 5kg fire extinguishers",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }

def pregunta_proteccion_oidos():
    if LANG == "es":
        return {
            "question": "¿Qué protección auditiva se recomienda al personal que trabaja cerca del coche durante sesiones?",
            "answers": [
                "Tapones o protectores auditivos certificados",
                "Cascos cerrados con micrófono",
                "Gorro térmico ignífugo",
                "No es obligatorio ningún equipo"
            ],
            "correctAnswer": "Tapones o protectores auditivos certificados",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What type of hearing protection is recommended for personnel working near the car during sessions?",
            "answers": [
                "Certified earplugs or hearing protectors",
                "Closed helmets with microphone",
                "Fireproof thermal cap",
                "No protective equipment is required"
            ],
            "correctAnswer": "Certified earplugs or hearing protectors",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }

def pregunta_test_impacto_lateral():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de prueba de seguridad debe superar el chasis para homologación?",
            "answers": [
                "Prueba de impacto lateral controlado",
                "Prueba de fuego directo durante 20 segundos",
                "Ensayo de torsión continua",
                "Compresión de célula de supervivencia"
            ],
            "correctAnswer": "Prueba de impacto lateral controlado",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What safety test must the chassis pass for homologation?",
            "answers": [
                "Controlled lateral impact test",
                "Direct fire exposure test for 20 seconds",
                "Continuous torsion test",
                "Survival cell compression test"
            ],
            "correctAnswer": "Controlled lateral impact test",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_epp_mecanicos():
    if LANG == "es":
        return {
            "question": "¿Qué equipo de protección personal es obligatorio para los mecánicos durante repostajes de líquidos?",
            "answers": [
                "Guantes, visera, mono ignífugo y calzado cerrado",
                "Solo guantes de látex",
                "Gafas de sol y auriculares",
                "Chaleco reflectante y pantalón corto"
            ],
            "correctAnswer": "Guantes, visera, mono ignífugo y calzado cerrado",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What personal protective equipment is mandatory for mechanics during fluid refueling?",
            "answers": [
                "Gloves, visor, fireproof suit and closed shoes",
                "Latex gloves only",
                "Sunglasses and headphones",
                "Reflective vest and shorts"
            ],
            "correctAnswer": "Gloves, visor, fireproof suit and closed shoes",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_luz_peligro_hibrido():
    if LANG == "es":
        return {
            "question": "¿Qué indica una luz roja encendida sobre un monoplaza híbrido detenido en pista?",
            "answers": [
                "Alto riesgo eléctrico, no tocar sin equipo",
                "El piloto ha desactivado el coche manualmente",
                "Está autorizado a ser empujado",
                "El coche está listo para reiniciar"
            ],
            "correctAnswer": "Alto riesgo eléctrico, no tocar sin equipo",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does a red light on a stopped hybrid F1 car indicate?",
            "answers": [
                "High electrical hazard, do not touch without gear",
                "The driver shut down the car manually",
                "It can be pushed safely",
                "The car is ready to restart"
            ],
            "correctAnswer": "High electrical hazard, do not touch without gear",
            "knowledgeLevel": 3,
            "category": "Safety",
            "language": LANG
        }

def pregunta_restriccion_equipo_movil():
    if LANG == "es":
        return {
            "question": "¿Qué restricción se aplica al uso de dispositivos móviles en el pit lane?",
            "answers": [
                "Solo se permite a personal autorizado por la FIA",
                "Se pueden usar libremente si no interfieren",
                "Están prohibidos únicamente durante la carrera",
                "Se permiten siempre si no se transmite video"
            ],
            "correctAnswer": "Solo se permite a personal autorizado por la FIA",
            "knowledgeLevel": 2,
            "category": "Safety",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the restriction on mobile device use in the pit lane?",
            "answers": [
                "Only FIA-authorized personnel may use them",
                "They can be used freely if not interfering",
                "They are banned only during the race",
                "Always allowed if not broadcasting video"
            ],
            "correctAnswer": "Only FIA-authorized personnel may use them",
            "knowledgeLevel": 2,
            "category": "Safety",
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
        pregunta_puntos_sprint,
        pregunta_vuelta_rapida_puntos,
        pregunta_puntos_carrera_entre_50_75,
        pregunta_empate_puntos_campeonato,
        pregunta_puntos_constructores,
        pregunta_puntos_piloto_abandono,
        pregunta_reparto_puntos_menos_50,
        pregunta_puntos_por_posicion,
        pregunta_puntos_reduccion_pista_insegura,
        pregunta_puntos_minimos_para_constructor,
        pregunta_puntos_noveno_clasificado,
        pregunta_puntos_piloto_fuera_top10,
        pregunta_criterio_puntos_media_carrera,
        pregunta_reparto_puntos_sprint_top8,
        pregunta_validez_puntos_tiempo
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
        pregunta_penalizacion_componentes,
        pregunta_cuando_sirve_penalizacion,
        pregunta_penalizacion_con_safetycar,
        pregunta_sancion_postcarrera,
        pregunta_penalizacion_no_completada,
        pregunta_no_trabajar_durante_penalizacion,
        pregunta_falso_arranque,
        pregunta_stop_and_go,
        pregunta_sancion_multiple,
        pregunta_no_cumple_stop_go,
        pregunta_penalizacion_pits_anticipado,
        pregunta_falsa_declaracion_equipo,
        pregunta_acumulacion_sanciones_evento,
        pregunta_sancion_por_desobedecer_direccion,
        pregunta_infraccion_parque_cerrado,
        pregunta_orden_sancion_directa,
        pregunta_conduccion_peligrosa_sancion,
        pregunta_infraccion_tecnica_equipo
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
        pregunta_override_mode_condicion_uso,
        pregunta_override_mode_desactivacion_gap,
        pregunta_override_mode_recharge_harvesting,
        pregunta_override_mode_safety_car,
        pregunta_aerodinamica_activa_definicion,
        pregunta_driver_adjustable_bodywork_definicion,
        pregunta_override_mode_definicion,
        pregunta_recharge_mode_definicion,
        pregunta_vuelta_formacion,
        pregunta_orden_reinicio_bandera_roja,
        pregunta_inicio_formacion_sprint,
        pregunta_reinicio_despues_retraso,
        pregunta_restriccion_personal_cuadro,
        pregunta_parrilla_incompleta,
        pregunta_salida_box_vuelta_formacion,
        pregunta_vuelta_formacion_abandono,
        pregunta_indicacion_luz_verde_pre_salida,
        pregunta_informacion_grilla_previa,
        pregunta_banderas_durante_formacion,
        pregunta_reinicio_despues_parada_total,
        pregunta_entrada_boxes_durante_formacion,
        pregunta_cancelacion_salida_inminente,
        pregunta_posicion_salida_despues_vuelta_extra,
        pregunta_final_banderazo,
        pregunta_que_es_driver_adjustable_bodywork,
        pregunta_modos_aero_activa_full_vs_partial,
        pregunta_donde_puede_activarse_aero_activa,
        pregunta_override_mode_condicion_ttcs
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
        pregunta_fin_parque_cerrado,
        pregunta_reemplazo_componentes_parque_cerrado,
        pregunta_motivo_penalizacion_pc,
        pregunta_limpieza_parque_cerrado,
        pregunta_motivo_penalizacion_pc,
        pregunta_limpieza_parque_cerrado,
        pregunta_modificaciones_condiciones_climaticas,
        pregunta_objeto_prohibido_parque_cerrado,
        pregunta_cantidad_mecanicos_pc,
        pregunta_sello_pre_sprint,
        pregunta_peso_aceite_pc,
        pregunta_entrada_directa_parque_cerrado,
        pregunta_reemplazo_piezas_con_autorizacion,
        pregunta_cobertura_noche_pc,
        pregunta_mecanicos_permitidos_pc,
        pregunta_quien_supervisa_pc,
        pregunta_modificacion_suspension_pc,
        pregunta_cambio_climatico_excepcional,
        pregunta_seleccion_fia_revision_pc,
        pregunta_modificacion_neumaticos_autorizada,
        pregunta_cierre_parque_cerrado,
        pregunta_piloto_debe_abandonar_pc,
        pregunta_protecciones_parque_cerrado,
        pregunta_trabajo_pc_por_fallo_tecnico

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
        pregunta_velocidad_pitlane,
        pregunta_guantes_biometricos,
        pregunta_extintor_seguridad,
        pregunta_dispositivo_halo,
        pregunta_apagado_emergencia,
        pregunta_indumentaria_resistente_fuego,
        pregunta_iluminacion_emergencia_pc,
        pregunta_panel_luz_amarilla_box,
        pregunta_sensor_inercia_accidente,
        pregunta_equipo_rescate_box,
        pregunta_sistema_extraccion,
        pregunta_iluminacion_lluvia,
        pregunta_restriccion_edad_boxes,
        pregunta_medico_post_accidente,
        pregunta_max_personas_muro,
        pregunta_extintores_garaje,
        pregunta_proteccion_oidos,
        pregunta_test_impacto_lateral,
        pregunta_epp_mecanicos,
        pregunta_luz_peligro_hibrido,
        pregunta_restriccion_equipo_movil

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
        pregunta_neumaticos_disponibles,
        pregunta_uso_anticompuestos_clasificacion,
        pregunta_uso_neumaticos_bajo_bandera_roja,
        pregunta_penalizacion_incorrecta_asignacion,
        pregunta_uso_full_wet_obligatorio,
        pregunta_presion_minima_fia,
        pregunta_limite_juegos_entrenamientos,
        pregunta_restriccion_reutilizacion_juegos,
        pregunta_diferencia_intermedios_agua,
        pregunta_seleccion_asignacion_previa,
        pregunta_retencion_juegos_no_usados,
        pregunta_compuestos_c1_c5,
        pregunta_liberacion_juegos,
        pregunta_clasificacion_lluvia_neumaticos,
        pregunta_procedimiento_informar_uso,
        pregunta_tiempo_montaje_neumatico,
        pregunta_cambio_neumaticos_en_parque_cerrado,
        pregunta_condicion_neumaticos_retirados,
        pregunta_neumaticos_diferentes_entrenamientos,
        pregunta_obligacion_neumatico_blando_q3,
        pregunta_compuesto_asignado_fuerza_mayor,
        pregunta_minimo_vueltas_con_neumatico,
        pregunta_fiabilidad_datos_sensores

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
        pregunta_safety_car,
        pregunta_intervalo_safety_car,
        pregunta_overtake_garaje_durante_sc,
        pregunta_tiempo_minimo_sector_sc,
        pregunta_pitlane_bloqueado_sc,
        pregunta_iluminacion_luces_sc,
        pregunta_condiciones_reinicio_sc,
        pregunta_adelantamiento_rezagados_sc,
        pregunta_velocidad_durante_safetycar,
        pregunta_safety_car_virtual_diferencia,
        pregunta_reincorporacion_post_sc,
        pregunta_sc_instruccion_vuelta,
        pregunta_pitlane_forzoso_sc,
        pregunta_retraso_reinicio_safetycar,
        pregunta_luces_sc_apagadas,
        pregunta_orden_salida_sc_mas_de_una_vuelta,
        pregunta_prohibido_usar_drs_sc,
        pregunta_comportamiento_frenada_reinicio,
        pregunta_tiempo_delta_virtual_sc,
        pregunta_safety_car_entrada_box_no_anunciada,
        pregunta_uso_de_mensajes_sc,
        pregunta_distancia_segura_safetycar,
        pregunta_delta_minimo_safetycar,
        pregunta_orden_direccion_luces_sc,
        pregunta_safetycar_lineas_adelantamiento,
        pregunta_maniobras_peligrosas_sc,
        pregunta_comportamiento_coche_doblado,
        pregunta_safetycar_inicio_lluvia,
        pregunta_fin_periodo_safetycar,
        pregunta_pilotaje_agresivo_reinicio,
        pregunta_velocidad_segura_pitlane_sc
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
        pregunta_sesiones_clasificacion,
        qualifying_salida_pitlane_durante_q1,
        qualifying_tiempos_eliminados_transicion_q1_q2,
        qualifying_bloqueo_castigo,
        qualifying_reingreso_piloto_sin_tiempo,
        qualifying_tiempo_107_reglamento,
        qualifying_neumaticos_q1,
        qualifying_tiempo_minimo_retorno_box,
        qualifying_banderas_durante_q3,
        qualifying_uso_intermedios_q2,
        qualifying_modificacion_reglaje_despues_q3,
        qualifying_modificacion_setup_post_q3,
        qualifying_orden_salida_q1,
        qualifying_cambio_motor_post_q3,
        qualifying_neumatico_blando_q3,
        qualifying_reincorporacion_box_en_q,
        qualifying_limite_coches_q3,
        qualifying_penalizacion_trafico_inevitable,
        qualifying_suspension_tras_accidente,
        qualifying_supera_limite_vuelta_reingreso,
        qualifying_prohibido_uso_drs

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
        pregunta_revision_postcarrera,
        pregunta_reemplazo_piloto_despues_clasificacion,
        pregunta_entrenamiento_obligatorio,
        pregunta_conducta_pista_reincidencia,
        pregunta_piloto_reemplazo_sabado,
        pregunta_piloto_debe_atender,
        pregunta_piloto_drs_incorrecto,
        pregunta_superlicencia_requisitos,
        pregunta_puntos_superlicencia_sanciones,
        pregunta_sustituto_emergencia_sabado,
        pregunta_limite_radio_piloto,
        pregunta_comportamiento_fuera_de_pista,
        pregunta_briefing_ausencia,
        pregunta_comunicacion_durante_sancion,
        pregunta_ignorar_panel_amarillo,
        pregunta_limite_edad_minima,
        pregunta_instrucciones_equipo_conduccion,
        pregunta_participacion_eventos_fan,
        pregunta_conducta_entrevista_post_q1_q2,
        pregunta_indumentaria_entrevistas,
        pregunta_obligacion_entrevista_post_sprint,
        pregunta_conducta_presentacion_previa

    ],
    "Technical": [
        pregunta_verificacion_tecnica,
        pregunta_modificaciones_parque_cerrado,
        pregunta_bandera_amarilla_doble,
        pregunta_modificaciones_bandera_roja,
        pregunta_dimensiones_vehiculo,
        pregunta_sistema_frontal_de_impacto,
        pregunta_sensores_obligatorios,
        pregunta_techo_presupuesto,
        pregunta_uso_fibra_carbono,
        pregunta_modificaciones_piezas_sello,
        pregunta_estructura_supervivencia,
        tecnica_tolerancia_flexion_aleron,
        tecnica_refrigeracion_ers_fuera_limite,
        tecnica_materiales_prohibidos_chasis,
        tecnica_supervision_banco_pruebas,
        tecnica_limite_horas_banco,
        tecnica_inspeccion_postcarrera_inconformidad,
        tecnica_uso_software_no_declarado,
        tecnica_presion_minima_neumaticos,
        tecnica_limite_consumo_combustible,
        tecnica_estructura_impacto_lateral,
        tecnica_limite_bancos_prueba,
        tecnica_limite_bancos_prueba_numero,
        tecnica_max_horas_operacion_anual,
        tecnica_max_horas_ocupacion_anual,
        tecnica_valor_amperaje_ers_banco,
        tecnica_max_horas_operacion_periodo,
        tecnica_peso_minimo_monoplaza,
        tecnica_capacidad_maxima_bateria,
        tecnica_velocidad_maxima_mgu,
        tecnica_num_max_ers_elements,
        tecnica_velocidad_banco_declarada,
        tecnica_limite_tiempo_periodo_10_semanas,
        tecnica_max_uso_combustible_total,
        tecnica_max_presion_neumaticos,
        tecnica_ratio_uso_combustible_max,                # ✅ 2026
        pregunta_peso_combustible_postcarrera,          # ✅ 2026
        pregunta_refueling_rate,                        # ✅ 2026 (en garaje)
        pregunta_monoplaza_ers,                         # ✅ 2026 (MGU-K + Energy Store)
        pregunta_mguk_potencia_maxima,                  # ✅ 2026
        pregunta_mguk_velocidad_minima_uso,             # ✅ 2026
        pregunta_mguk_par_maximo,                       # ✅ 2026
        pregunta_mguk_rpm_maximo,                       # ✅ 2026
        pregunta_energia_recuperada_por_vuelta,         # ✅ 2026
        pregunta_flujo_energia_combustible,             # ✅ 2026 (Fuel Energy Flow)
        pregunta_spark_energy_maxima,                   # ✅ 2026
        pregunta_modo_ice_unico,                        # ✅ 2026
        pregunta_numero_depositos_aceite,               # ✅ 2026
        pregunta_valvula_alivio_refrigerante,           # ✅ 2026
        pregunta_combustible_temperatura,               # ✅ 2026
        pregunta_dispositivo_temperatura_combustible,   # ✅ 2026
        pregunta_fuel_bladders_edad,                    # ✅ 2026
        pregunta_fuel_line_cockpit,                     # ✅ 2026
        pregunta_breakaway_valve,                       # ✅ 2026
        pregunta_fuel_cell_presion_max,                 # ✅ 2026
        pregunta_fuel_tank_blader_standard,             # ✅ 2026
        pregunta_oil_tank_sensor,                       # ✅ 2026
        pregunta_materiales_combustible_exotermicos,    # ✅ 2026
        pregunta_oil_propiedades_flashpoint,            # ✅ 2026
        pregunta_voltage_maximo_ers,                    # ✅ 2026
        pregunta_fuel_oxigeno_pct,                      # ✅ 2026
        pregunta_fuel_sulphur_max,                      # ✅ 2026
        pregunta_componentes_combustible_no_sostenibles,# ✅ 2026
        pregunta_aperturas_fuel_blader,                 # ✅ 2026
        pregunta_componentes_mangueras_fuel_sampling,   # ✅ 2026
        pregunta_lubricacion_componentes_pu,            # ✅ 2026
        pregunta_oil_tank_auxiliar_prohibido,           # ✅ 2026
        pregunta_ers_transport_un383,                   # ✅ 2026
        pregunta_principio_cooling_latent_heat,         # ✅ 2026
        pregunta_cooling_sistema_driver_heat_hazard,    # ✅ 2026

        # --- ✅ reemplazos/ajustes 2026 (evita mantener las viejas obsoletas) ---
        tecnica_repostaje_durante_carrera,              # ✅ 2026 (prohibido durante Race)
        tecnica_presion_componentes_fuera_deposito,     # ✅ 2026 (>10 barG fuera del tank)
        tecnica_sensores_obligatorios_fuel_density,     # ✅ 2026 (control densidad)
        tecnica_aceite_un_solo_tipo,                    # ✅ 2026 (aprobación FIA previa)
        tecnica_declaracion_aceite_competicion,         # ✅ 2026
        tecnica_methanol_pct,                           # ✅ 2026
        tecnica_fuel_density_range,                     # ✅ 2026
        tecnica_conductividad_electrica_fuel,           # ✅ 2026
        tecnica_boiling_point_fuel,                     # ✅ 2026
        tecnica_oil_kinematic_viscosity_min,            # ✅ 2026
        tecnica_oil_initial_boiling_point,              # ✅ 2026
        tecnica_oil_low_bp_compounds_limit,             # ✅ 2026
        tecnica_oil_no_octane_boosters                  # ✅ 2026

    ],
    "PracticalCase": [
        caso_reincorporacion_peligrosa,
        caso_bandera_roja_pista_bloqueada,
        caso_exceso_velocidad_pitlane,
        caso_neumatico_incorrecto_clasificacion,
        caso_orden_reinicio_bandera_roja,
        caso_adelantar_tras_safety_car,
        caso_coche_cruza_linea_boxes_cerrados,
        caso_mecanicos_no_salen_tiempo,
        caso_sancion_parada_no_cumplida,
        caso_drs_activado_bajo_bandera_amarilla,
        caso_reinicio_safety_car_confuso,
        caso_orden_erronea_equipo,
        caso_salida_anticipada,
        caso_parada_coche_salida_boxes,
        caso_equipo_interviene_muro_prohibido,
        caso_modificacion_parc_ferme_en_sprint,
        caso_parada_erronea_durante_sancion,
        caso_reinicio_suspendido_lluvia,
        caso_coche_retirado_posteriormente_inspeccionado,
        caso_celebracion_riesgosa_postcarrera,
        caso_doble_penalizacion_procedimiento,
        caso_invasion_pit_lane_carrera,
        caso_incidente_entrada_pit_lane,
        caso_problemas_comunicacion_race_control,
        caso_cambio_chasis_evento,
        caso_cambio_motor_bajo_parque_cerrado,
        caso_cambio_motor_bajo_parque_cerrado,
        caso_salida_abortada_multiple,
        caso_reinicio_post_vsc_con_incidente,
        caso_sello_fia_motor_daño,
        caso_salida_drs_activado_por_error,
        caso_error_panel_safety_car,
        caso_dos_coches_mismo_box_bandera_roja,
        caso_procedimiento_arranque_con_retraso,
        caso_vehiculo_inmovilizado_despues_salida,
        caso_coche_sale_sin_goma_despues_parada

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

def generar_preguntas_reglamento_desde_main(lang='es', category=None):
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


