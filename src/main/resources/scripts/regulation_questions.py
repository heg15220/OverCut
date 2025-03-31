
import random
import json
import sys
import argparse


def pregunta_puntos_sprint():
    return {
        "question": "¿Cuántos puntos obtiene el piloto que gana una carrera sprint?",
        "answers": ["8", "10", "6", "5"],
        "correctAnswer": "8",
        "knowledgeLevel": 1,
        "category": "Scores"
    }

def pregunta_penalizacion_componentes():
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
        "category": "Penalty"
    }

def pregunta_bandera_roja():
    return {
        "question": "En caso de suspensión de la carrera por bandera roja, ¿qué sucede con los coches?",
        "answers": [
            "Deben dirigirse al pit lane y detenerse en el orden de carrera",
            "Regresan a boxes y pueden cambiar neumáticos sin restricción",
            "Continúan circulando detrás del coche de seguridad",
            "Se detienen en la línea de salida en el orden original de la parrilla"
        ],
        "correctAnswer": "Deben dirigirse al pit lane y detenerse en el orden de carrera",
        "knowledgeLevel": 3,
        "category": "Procedures"
    }

def pregunta_modificaciones_parque_cerrado():
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
        "category": "ParcFerme"
    }

def pregunta_vuelta_formacion():
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
        "category": "Procedures"
    }

def pregunta_velocidad_pitlane():
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
        "category": "Safety"
    }

def pregunta_neumaticos_disponibles():
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
        "category": "Tyres"
    }

def pregunta_safety_car():
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
        "category": "SafetyCar"
    }

def pregunta_sesiones_clasificacion():
    return {
        "question": "¿Cuántas sesiones componen la clasificación normal del sábado en Fórmula 1?",
        "answers": ["3", "2", "4", "1"],
        "correctAnswer": "3",
        "knowledgeLevel": 1,
        "category": "Qualifying"
    }

def pregunta_orden_salida_sprint():
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
        "category": "Sprint"
    }

def pregunta_bandera_roja_suspension():
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
        "category": "RedFlag"
    }

def pregunta_cambio_piloto():
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
        "category": "Drivers"
    }

def pregunta_verificacion_tecnica():
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
        "category": "Technical"
    }


def caso_bandera_roja_pista_bloqueada():
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
        "category": "PracticalCase"
    }

def caso_exceso_velocidad_pitlane():
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
        "category": "PracticalCase"
    }

def caso_neumatico_incorrecto_clasificacion():
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
        "category": "PracticalCase"
    }

def caso_orden_reinicio_bandera_roja():
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
        "category": "PracticalCase"
    }

def caso_adelantar_tras_safety_car():
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
        "category": "PracticalCase"
    }

def pregunta_puntuacion_diez_puntos():
    return {
        "question": "¿Cuántos puntos obtiene el piloto que finaliza en décima posición?",
        "answers": ["1", "2", "0", "3"],
        "correctAnswer": "1",
        "knowledgeLevel": 1,
        "category": "Scores"
    }

def pregunta_licencia_12_puntos():
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
        "category": "Penalty"
    }

def pregunta_activacion_drs():
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
        "category": "Procedures"
    }

def pregunta_fin_parque_cerrado():
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
        "category": "ParcFerme"
    }

def pregunta_bandera_amarilla_doble():
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
        "category": "Safety"
    }

def pregunta_neumaticos_compuestos():
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
        "category": "Tyres"
    }

def pregunta_vsc_significado():
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
        "category": "SafetyCar"
    }

def pregunta_regla_107_por_ciento():
    return {
        "question": "¿Qué sucede si un piloto no marca un tiempo dentro del 107% respecto al mejor tiempo en Q1?",
        "answers": [
            "Puede no ser autorizado a participar en la carrera",
            "Comienza desde el pit lane por defecto",
            "Tiene una vuelta adicional",
            "No hay consecuencias si es piloto local"
        ],
        "correctAnswer": "Puede no ser autorizado a participar en la carrera",
        "knowledgeLevel": 3,
        "category": "Qualifying"
    }

def pregunta_dia_sprint_shootout():
    return {
        "question": "¿Qué día se celebra la Sprint Shootout durante un fin de semana con formato sprint?",
        "answers": ["Sábado", "Domingo", "Viernes", "Depende del circuito"],
        "correctAnswer": "Sábado",
        "knowledgeLevel": 1,
        "category": "Sprint"
    }

def pregunta_modificaciones_bandera_roja():
    return {
        "question": "¿Qué se permite hacer en los coches durante una bandera roja?",
        "answers": [
            "Se pueden realizar reparaciones bajo supervisión",
            "Se puede cambiar cualquier pieza libremente",
            "Solo se permite repostar combustible",
            "No está permitido tocar el coche bajo ninguna circunstancia"
        ],
        "correctAnswer": "Se pueden realizar reparaciones bajo supervisión",
        "knowledgeLevel": 2,
        "category": "RedFlag"
    }

def pregunta_reemplazo_piloto():
    return {
        "question": "¿Qué debe hacer un equipo si un piloto no puede competir tras iniciado el evento?",
        "answers": [
            "Solicitar autorización para sustituirlo",
            "Abandonar la competición",
            "Pedir reemplazo de equipo también",
            "Nada, se omite su participación"
        ],
        "correctAnswer": "Solicitar autorización para sustituirlo",
        "knowledgeLevel": 2,
        "category": "Drivers"
    }

def pregunta_revision_postcarrera():
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
        "category": "Technical"
    }

def caso_reincorporacion_peligrosa():
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
        "category": "PracticalCase"
    }

# Categoría: Puntuaciones
def pregunta_puntuacion_segundo_clasificado():
    return {
        "question": "¿Cuántos puntos obtiene el segundo clasificado en una carrera normal?",
        "answers": ["18", "15", "20", "25"],
        "correctAnswer": "18",
        "knowledgeLevel": 1,
        "category": "Scores"
    }

def pregunta_puntuacion_quinto_clasificado():
    return {
        "question": "¿Qué puntuación recibe el piloto en 5º lugar?",
        "answers": ["10", "12", "8", "6"],
        "correctAnswer": "10",
        "knowledgeLevel": 1,
        "category": "Scores"
    }

def pregunta_puntos_reducidos_condiciones():
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
        "category": "Scores"
    }

def pregunta_puntos_mitad_carrera():
    return {
        "question": "¿Cuántos puntos se otorgan si se completa menos del 50% de la carrera?",
        "answers": ["50% de los puntos normales", "25% de los puntos normales", "No se otorgan puntos", "Puntos completos"],
        "correctAnswer": "50% de los puntos normales",
        "knowledgeLevel": 2,
        "category": "Scores"
    }


def pregunta_puntos_victoria_sprint():
    return {
        "question": "¿Cuántos puntos otorga una victoria en una carrera sprint?",
        "answers": ["8", "6", "10", "5"],
        "correctAnswer": "8",
        "knowledgeLevel": 2,
        "category": "Scores"
    }

def pregunta_equipo_1y2():
    return {
        "question": "¿Cuál es la puntuación total para el equipo ganador si sus dos pilotos acaban 1º y 2º?",
        "answers": ["43", "45", "40", "38"],
        "correctAnswer": "43",
        "knowledgeLevel": 3,
        "category": "Scores"
    }

def pregunta_puntos_octavo_sprint():
    return {
        "question": "¿Cuántos puntos otorga el 8º puesto en una sprint?",
        "answers": ["1", "0", "2", "3"],
        "correctAnswer": "1",
        "knowledgeLevel": 2,
        "category": "Scores"
    }

def pregunta_puntos_bandera_roja():
    return {
        "question": "¿Se otorgan puntos si una carrera termina bajo bandera roja sin alcanzar el 25%?",
        "answers": ["No se otorgan puntos", "Sí, puntos completos", "Se otorgan puntos reducidos", "Solo medio punto al primero"],
        "correctAnswer": "No se otorgan puntos",
        "knowledgeLevel": 2,
        "category": "Scores"
    }

# Categoría: Sanciones

def pregunta_sancion_pit_lane():
    return {
        "question": "¿Qué sanción puede recibir un piloto por exceso de velocidad en el pit lane?",
        "answers": ["Multa económica o penalización en carrera", "Bandera negra", "Reprimenda", "Descalificación inmediata"],
        "correctAnswer": "Multa económica o penalización en carrera",
        "knowledgeLevel": 2,
        "category": "Penalty"
    }

def pregunta_penalizacion_5_segundos():
    return {
        "question": "¿Qué implica una penalización de 5 segundos?",
        "answers": ["El piloto debe parar en boxes y esperar 5 segundos sin trabajar en el coche", "El piloto recibe 5 segundos extra en su tiempo final", "El piloto debe ceder posición", "No puede adelantar en 5 vueltas"],
        "correctAnswer": "El piloto recibe 5 segundos extra en su tiempo final",
        "knowledgeLevel": 2,
        "category": "Penalty"
    }

def pregunta_penalizacion_10_segundos():
    return {
        "question": "¿Cuándo se impone una penalización de 10 segundos?",
        "answers": ["Por infracciones graves en pista", "Por exceder límites de pista tres veces", "Por adelantamiento en bandera amarilla", "Por saltarse la salida"],
        "correctAnswer": "Por infracciones graves en pista",
        "knowledgeLevel": 3,
        "category": "Penalty"
    }

def pregunta_parque_cerrado_infraccion():
    return {
        "question": "¿Qué ocurre si un equipo trabaja en el coche en parque cerrado sin autorización?",
        "answers": ["Puede ser descalificado de la sesión", "Recibe una multa", "Pierde 5 posiciones", "No puede competir en la carrera"],
        "correctAnswer": "Puede ser descalificado de la sesión",
        "knowledgeLevel": 3,
        "category": "Penalty"
    }

def pregunta_drive_through():
    return {
        "question": "¿Cuándo se aplica la sanción de ‘drive-through’?",
        "answers": ["Cuando el piloto comete una infracción en carrera", "Por exceso de velocidad en clasificación", "Cuando se cambia motor sin permiso", "Por no presentarse al pesaje"],
        "correctAnswer": "Cuando el piloto comete una infracción en carrera",
        "knowledgeLevel": 2,
        "category": "Penalty"
    }

def pregunta_stop_and_go():
    return {
        "question": "¿Qué implica una sanción de ‘stop and go’ de 10 segundos?",
        "answers": ["El piloto debe detenerse 10 segundos sin que el equipo trabaje en el coche", "El piloto debe detenerse 10 segundos con cambio de neumáticos obligatorio", "El piloto pierde 10 segundos en clasificación", "El piloto debe ceder una posición"],
        "correctAnswer": "El piloto debe detenerse 10 segundos sin que el equipo trabaje en el coche",
        "knowledgeLevel": 3,
        "category": "Penalty"
    }

def pregunta_peso_minimo():
    return {
        "question": "¿Qué ocurre si un coche no cumple con el peso mínimo tras la carrera?",
        "answers": ["Puede ser descalificado de la carrera", "Recibe una reprimenda", "Pierde 5 posiciones en la parrilla siguiente", "Debe pagar una multa"],
        "correctAnswer": "Puede ser descalificado de la carrera",
        "knowledgeLevel": 3,
        "category": "Penalty"
    }

def pregunta_aleron_ilegal():
    return {
        "question": "¿Qué pasa si se utiliza un alerón ilegal?",
        "answers": ["Puede ser motivo de descalificación", "Se pierde una sesión de clasificación", "Solo se aplica una multa", "El coche no puede salir del parque cerrado"],
        "correctAnswer": "Puede ser motivo de descalificación",
        "knowledgeLevel": 3,
        "category": "Penalty"
    }

def pregunta_bandera_azul():
    return {
        "question": "¿Qué sucede si un piloto ignora una bandera azul?",
        "answers": ["Puede recibir una sanción por bloquear a otro coche", "Pierde automáticamente una vuelta", "Se le ordena abandonar la carrera", "Debe dejar de usar DRS"],
        "correctAnswer": "Puede recibir una sanción por bloquear a otro coche",
        "knowledgeLevel": 2,
        "category": "Penalty"
    }

def pregunta_repostaje_irregular():
    return {
        "question": "¿Qué sanción recibe un equipo por repostar en condiciones no permitidas?",
        "answers": ["Descalificación inmediata", "Solo una advertencia", "Penalización de tiempo", "Pérdida de puntos del campeonato"],
        "correctAnswer": "Descalificación inmediata",
        "knowledgeLevel": 2,
        "category": "Penalty"
    }
# Categoría: Procedimientos
def pregunta_final_vuelta_formacion():
    return {
        "question": "¿Qué debe hacer un piloto al final de la vuelta de formación?",
        "answers": ["Detenerse en su posición de parrilla", "Entrar a boxes", "Activar el DRS", "Cambiar neumáticos"],
        "correctAnswer": "Detenerse en su posición de parrilla",
        "knowledgeLevel": 2,
        "category": "Procedures"
    }

def pregunta_no_arranca_parrilla():
    return {
        "question": "¿Qué ocurre si un piloto no puede arrancar desde la parrilla?",
        "answers": ["Debe salir desde el pit lane", "Queda descalificado", "Debe abandonar la carrera", "Sale al final del grupo"],
        "correctAnswer": "Debe salir desde el pit lane",
        "knowledgeLevel": 2,
        "category": "Procedures"
    }

def pregunta_segunda_vuelta_formacion():
    return {
        "question": "¿Cuándo se cancela una salida y se realiza una segunda vuelta de formación?",
        "answers": ["Si un coche se queda parado en parrilla", "Cuando hay lluvia", "Si un piloto tiene un fallo mecánico previo", "Por orden del director de carrera sin razón"],
        "correctAnswer": "Si un coche se queda parado en parrilla",
        "knowledgeLevel": 3,
        "category": "Procedures"
    }

def pregunta_coche_detiene_parrilla():
    return {
        "question": "¿Qué ocurre si un coche se detiene en la parrilla antes de la salida?",
        "answers": ["Puede empujarse a boxes y salir desde el pit lane", "Debe abandonar la carrera", "No puede ser tocado por los mecánicos", "Recibe una sanción automática"],
        "correctAnswer": "Puede empujarse a boxes y salir desde el pit lane",
        "knowledgeLevel": 3,
        "category": "Procedures"
    }

def pregunta_salida_abortada():
    return {
        "question": "¿Cuál es el procedimiento si la salida se aborta?",
        "answers": ["Se inicia una vuelta de formación adicional", "Los coches deben detenerse en pista", "Se muestra bandera negra a todos", "Todos deben regresar a boxes"],
        "correctAnswer": "Se inicia una vuelta de formación adicional",
        "knowledgeLevel": 3,
        "category": "Procedures"
    }

def pregunta_inicio_carrera():
    return {
        "question": "¿En qué momento se considera que la carrera ha comenzado?",
        "answers": ["Cuando se apagan las luces del semáforo", "Cuando se inicia la vuelta de formación", "Cuando el primer coche cruza la línea de salida", "Cuando se muestra la bandera verde"],
        "correctAnswer": "Cuando se apagan las luces del semáforo",
        "knowledgeLevel": 2,
        "category": "Procedures"
    }

def pregunta_salida_pitlane_parrilla():
    return {
        "question": "¿Cuándo pueden los coches salir del pit lane hacia la parrilla?",
        "answers": ["Cuando se muestra la luz verde al final del pit lane", "Cuando el equipo lo indique", "Cuando termina la bandera roja", "Siempre que haya pista libre"],
        "correctAnswer": "Cuando se muestra la luz verde al final del pit lane",
        "knowledgeLevel": 2,
        "category": "Procedures"
    }

def pregunta_cierre_pitlane():
    return {
        "question": "¿Cuánto tiempo antes de la salida se cierra el pit lane?",
        "answers": ["20 minutos", "10 minutos", "5 minutos", "15 minutos"],
        "correctAnswer": "10 minutos",
        "knowledgeLevel": 3,
        "category": "Procedures"
    }

def pregunta_boxes_vuelta_formacion():
    return {
        "question": "¿Qué sucede si un coche entra a boxes durante la vuelta de formación?",
        "answers": ["Debe iniciar la carrera desde el pit lane", "Debe regresar a su posición en la parrilla", "Recibe una sanción de tiempo", "Pierde su vuelta de formación"],
        "correctAnswer": "Debe iniciar la carrera desde el pit lane",
        "knowledgeLevel": 2,
        "category": "Procedures"
    }

def pregunta_luces_salida():
    return {
        "question": "¿Qué señales indican que la salida se realizará normalmente?",
        "answers": ["Encendido progresivo de luces rojas y su apagado", "Bandera verde ondeando", "Semáforo verde intermitente", "Luz azul en la línea de salida"],
        "correctAnswer": "Encendido progresivo de luces rojas y su apagado",
        "knowledgeLevel": 2,
        "category": "Procedures"
    }

# Categoría: Parque Cerrado
def pregunta_inicio_parque_cerrado():
    return {
        "question": "¿Cuándo comienza el estado de parque cerrado en un evento?",
        "answers": ["Al final de la sesión de clasificación", "Antes del inicio de la Q1", "Después del briefing de pilotos", "Cuando los coches llegan al circuito"],
        "correctAnswer": "Al final de la sesión de clasificación",
        "knowledgeLevel": 2,
        "category": "ParcFerme"
    }

def pregunta_final_parque_cerrado():
    return {
        "question": "¿Cuándo finaliza el estado de parque cerrado en un evento?",
        "answers": ["Cuando comienza la carrera", "Al terminar el procedimiento de salida", "Cuando se apagan las luces del semáforo", "Después del pesaje obligatorio"],
        "correctAnswer": "Cuando comienza la carrera",
        "knowledgeLevel": 2,
        "category": "ParcFerme"
    }

def pregunta_autorizacion_modificaciones():
    return {
        "question": "¿Qué se necesita para realizar modificaciones en el coche durante parque cerrado?",
        "answers": ["Autorización del delegado técnico", "Permiso del jefe de equipo", "Aviso al piloto", "Informe a los comisarios"],
        "correctAnswer": "Autorización del delegado técnico",
        "knowledgeLevel": 3,
        "category": "ParcFerme"
    }

def pregunta_motivo_sancion_pc():
    return {
        "question": "¿Qué sucede si un equipo rompe el parque cerrado sin permiso?",
        "answers": ["El coche sale desde el pit lane", "Recibe una multa", "Pierde 5 posiciones en parrilla", "Debe repetir clasificación"],
        "correctAnswer": "El coche sale desde el pit lane",
        "knowledgeLevel": 3,
        "category": "ParcFerme"
    }

def pregunta_tipo_modificaciones_permitidas():
    return {
        "question": "¿Qué tipo de modificaciones están permitidas durante parque cerrado sin autorización?",
        "answers": ["Ninguna modificación", "Cambio de neumáticos por razones de seguridad", "Cambio de combustible", "Cambio de piloto"],
        "correctAnswer": "Ninguna modificación",
        "knowledgeLevel": 2,
        "category": "ParcFerme"
    }

def pregunta_sustitucion_componentes_pc():
    return {
        "question": "¿Qué sucede si se sustituye un componente clave durante parque cerrado?",
        "answers": ["El coche puede ser descalificado o salir desde el pit lane", "Debe reiniciar la clasificación", "Pierde puntos del campeonato", "Recibe una advertencia"],
        "correctAnswer": "El coche puede ser descalificado o salir desde el pit lane",
        "knowledgeLevel": 3,
        "category": "ParcFerme"
    }

def pregunta_reparaciones_durante_pc():
    return {
        "question": "¿Cuándo pueden realizarse reparaciones al coche en parque cerrado?",
        "answers": ["Con autorización de la FIA", "Durante el pesaje", "En todo momento", "Solo en condiciones de lluvia"],
        "correctAnswer": "Con autorización de la FIA",
        "knowledgeLevel": 2,
        "category": "ParcFerme"
    }

def pregunta_objetivo_parque_cerrado():
    return {
        "question": "¿Cuál es el objetivo principal del parque cerrado?",
        "answers": ["Evitar cambios en el coche después de clasificación", "Permitir revisión técnica rápida", "Reducir costes de operación", "Evitar conflictos entre equipos"],
        "correctAnswer": "Evitar cambios en el coche después de clasificación",
        "knowledgeLevel": 1,
        "category": "ParcFerme"
    }

def pregunta_parque_cerrado_despues_sprint():
    return {
        "question": "¿Se aplica el parque cerrado después de una carrera sprint?",
        "answers": ["Sí, hasta la parrilla de la carrera principal", "No, solo tras clasificación", "Solo si llueve", "Sí, pero solo en la Q3"],
        "correctAnswer": "Sí, hasta la parrilla de la carrera principal",
        "knowledgeLevel": 2,
        "category": "ParcFerme"
    }

def pregunta_comunicacion_violacion_pc():
    return {
        "question": "¿Quién comunica una violación del parque cerrado?",
        "answers": ["El delegado técnico a los comisarios", "El jefe de equipo al director de carrera", "El piloto a la FIA", "El mecánico principal al director de seguridad"],
        "correctAnswer": "El delegado técnico a los comisarios",
        "knowledgeLevel": 3,
        "category": "ParcFerme"
    }
# Categoría: Seguridad
def pregunta_doble_bandera_amarilla():
    return {
        "question": "¿Qué significa una doble bandera amarilla?",
        "answers": ["Precaución extrema, posible coche o comisario en pista", "Adelantar permitido con precaución", "Zona resbaladiza, pero sin detenerse", "Safety Car en pista"],
        "correctAnswer": "Precaución extrema, posible coche o comisario en pista",
        "knowledgeLevel": 1,
        "category": "Safety"
    }

def pregunta_bandera_roja_seguridad():
    return {
        "question": "¿Qué implica una bandera roja durante la carrera?",
        "answers": ["La carrera se detiene inmediatamente", "Solo se reduce la velocidad", "Se permite repostar", "Cambio de neumáticos obligatorio"],
        "correctAnswer": "La carrera se detiene inmediatamente",
        "knowledgeLevel": 1,
        "category": "Safety"
    }

def pregunta_bandera_amarilla_simple():
    return {
        "question": "¿Qué indica una bandera amarilla simple?",
        "answers": ["Peligro en pista, no adelantar", "Coche de seguridad en pista", "Pista libre", "Condiciones húmedas"],
        "correctAnswer": "Peligro en pista, no adelantar",
        "knowledgeLevel": 1,
        "category": "Safety"
    }

def pregunta_bandera_azul_significado():
    return {
        "question": "¿Qué indica la bandera azul en carrera?",
        "answers": ["Un coche más rápido se aproxima, dejar pasar", "Zona de boxes abierta", "Lluvia en el sector siguiente", "Salida del pit lane habilitada"],
        "correctAnswer": "Un coche más rápido se aproxima, dejar pasar",
        "knowledgeLevel": 1,
        "category": "Safety"
    }

def pregunta_bandera_blanca():
    return {
        "question": "¿Qué significa la bandera blanca ondeando?",
        "answers": ["Vehículo lento en pista adelante", "Inicio de última vuelta", "Parada obligatoria", "Coche averiado fuera de pista"],
        "correctAnswer": "Vehículo lento en pista adelante",
        "knowledgeLevel": 1,
        "category": "Safety"
    }

def pregunta_bandera_negra():
    return {
        "question": "¿Qué implica la bandera negra con número?",
        "answers": ["El piloto indicado debe retirarse de la carrera", "Debe entrar a boxes a reparar", "Penalización de tiempo", "Cambio de neumáticos obligatorio"],
        "correctAnswer": "El piloto indicado debe retirarse de la carrera",
        "knowledgeLevel": 2,
        "category": "Safety"
    }

def pregunta_luces_pit_lane():
    return {
        "question": "¿Qué indica la luz roja al final del pit lane?",
        "answers": ["Prohibido salir del pit lane", "Autorizado el ingreso a boxes", "Activación de bandera azul", "Zona peligrosa"],
        "correctAnswer": "Prohibido salir del pit lane",
        "knowledgeLevel": 2,
        "category": "Safety"
    }

def pregunta_bandera_a_cuadros():
    return {
        "question": "¿Qué indica la bandera a cuadros?",
        "answers": ["Fin de la carrera o sesión", "Inicio de carrera", "Zona de adelantamiento", "Neutralización de la prueba"],
        "correctAnswer": "Fin de la carrera o sesión",
        "knowledgeLevel": 1,
        "category": "Safety"
    }

def pregunta_bandera_negra_naranja():
    return {
        "question": "¿Qué indica una bandera negra con círculo naranja?",
        "answers": ["El coche tiene un problema mecánico y debe entrar a boxes", "Condiciones peligrosas en pista", "Parada por condiciones meteorológicas", "Penalización pendiente"],
        "correctAnswer": "El coche tiene un problema mecánico y debe entrar a boxes",
        "knowledgeLevel": 2,
        "category": "Safety"
    }

def pregunta_bandera_verde():
    return {
        "question": "¿Qué indica la bandera verde?",
        "answers": ["Pista libre de peligros", "Fin de carrera", "Zona de boxes abierta", "Adelantamiento prohibido"],
        "correctAnswer": "Pista libre de peligros",
        "knowledgeLevel": 1,
        "category": "Safety"
    }

# Categoría: Neumáticos
def pregunta_uso_dos_compuestos():
    return {
        "question": "¿Qué ocurre si un equipo no utiliza al menos dos compuestos de neumáticos secos en carrera?",
        "answers": ["Puede ser descalificado o sancionado", "Debe abandonar la carrera", "Recibe una advertencia", "Pierde posiciones en clasificación"],
        "correctAnswer": "Puede ser descalificado o sancionado",
        "knowledgeLevel": 2,
        "category": "Tyres"
    }

def pregunta_tipo_compuestos_drs():
    return {
        "question": "¿Cuántos tipos de compuestos de neumáticos secos están disponibles por evento?",
        "answers": ["Tres", "Dos", "Cinco", "Cuatro"],
        "correctAnswer": "Tres",
        "knowledgeLevel": 1,
        "category": "Tyres"
    }

def pregunta_neumaticos_clasificacion():
    return {
        "question": "¿Qué neumáticos deben usarse obligatoriamente en Q1 y Q2 cuando aplica el reglamento específico?",
        "answers": ["Duro en Q1 y Medio en Q2", "Blando en ambas", "Cualquiera disponible", "Intermedio en Q1 y Blando en Q2"],
        "correctAnswer": "Duro en Q1 y Medio en Q2",
        "knowledgeLevel": 2,
        "category": "Tyres"
    }

def pregunta_compuestos_lluvia():
    return {
        "question": "¿Qué tipo de neumáticos se utilizan en condiciones de lluvia intensa?",
        "answers": ["Full Wet (azul)", "Intermedios (verde)", "Blandos (rojo)", "Medios (amarillo)"],
        "correctAnswer": "Full Wet (azul)",
        "knowledgeLevel": 1,
        "category": "Tyres"
    }

def pregunta_uso_intermedios():
    return {
        "question": "¿Qué condiciones justifican el uso de neumáticos intermedios?",
        "answers": ["Pista húmeda pero sin acumulación de agua", "Asfalto seco", "Temperatura alta", "Pista completamente inundada"],
        "correctAnswer": "Pista húmeda pero sin acumulación de agua",
        "knowledgeLevel": 1,
        "category": "Tyres"
    }

def pregunta_restriccion_uso_neumaticos():
    return {
        "question": "¿Existe una cantidad limitada de neumáticos por fin de semana?",
        "answers": ["Sí, regulado por la FIA", "No, cada equipo decide", "Solo en clasificación", "Solo para sprint"],
        "correctAnswer": "Sí, regulado por la FIA",
        "knowledgeLevel": 2,
        "category": "Tyres"
    }

def pregunta_asignacion_neumaticos():
    return {
        "question": "¿Cómo se determina la asignación de neumáticos a los equipos?",
        "answers": ["Especificada por Pirelli y la FIA", "Cada equipo elige libremente", "Según sorteo previo", "Depende del clima"],
        "correctAnswer": "Especificada por Pirelli y la FIA",
        "knowledgeLevel": 2,
        "category": "Tyres"
    }

def pregunta_pit_stop_neumaticos():
    return {
        "question": "¿En qué momento deben cambiar neumáticos los equipos en carrera?",
        "answers": ["Cuando el compuesto actual no es válido o por estrategia", "Cada 10 vueltas", "Solo si hay bandera amarilla", "Después de la vuelta 10"],
        "correctAnswer": "Cuando el compuesto actual no es válido o por estrategia",
        "knowledgeLevel": 2,
        "category": "Tyres"
    }

def pregunta_neumaticos_sprint():
    return {
        "question": "¿Se requiere el uso de dos compuestos distintos en carrera sprint?",
        "answers": ["No, no es obligatorio", "Sí, siempre", "Solo si llueve", "Solo si dura más de 20 vueltas"],
        "correctAnswer": "No, no es obligatorio",
        "knowledgeLevel": 1,
        "category": "Tyres"
    }

def pregunta_marca_colores_neumaticos():
    return {
        "question": "¿Qué color identifica al neumático más blando disponible?",
        "answers": ["Rojo", "Amarillo", "Blanco", "Verde"],
        "correctAnswer": "Rojo",
        "knowledgeLevel": 1,
        "category": "Tyres"
    }

# Categoría: Safety Car

def pregunta_salida_safety_car():
    return {
        "question": "¿En qué casos se activa el coche de seguridad?",
        "answers": ["Cuando hay un peligro que requiere neutralizar la carrera", "Cuando termina la clasificación", "Cada vez que llueve", "Cuando un piloto cambia de neumáticos"],
        "correctAnswer": "Cuando hay un peligro que requiere neutralizar la carrera",
        "knowledgeLevel": 1,
        "category": "SafetyCar"
    }

def pregunta_regreso_boxes_safety_car():
    return {
        "question": "¿Qué indica que el coche de seguridad regresará a boxes esta vuelta?",
        "answers": ["Luce el mensaje ‘SC in this lap’", "Se encienden las luces azules", "Los coches lo adelantan", "El director de carrera usa bandera verde"],
        "correctAnswer": "Luce el mensaje ‘SC in this lap’",
        "knowledgeLevel": 1,
        "category": "SafetyCar"
    }

def pregunta_condiciones_vsc():
    return {
        "question": "¿Qué condiciones deben cumplirse durante VSC?",
        "answers": ["Velocidad reducida sin adelantamientos", "Cambio obligatorio de neumáticos", "Bandera azul activa", "Posibilidad de recuperar vueltas"],
        "correctAnswer": "Velocidad reducida sin adelantamientos",
        "knowledgeLevel": 2,
        "category": "SafetyCar"
    }

def pregunta_adelantamientos_safety_car():
    return {
        "question": "¿Está permitido adelantar durante el coche de seguridad?",
        "answers": ["Solo cuando se indica específicamente", "Siempre que se mantenga distancia", "Durante todo el periodo", "Solo entre compañeros de equipo"],
        "correctAnswer": "Solo cuando se indica específicamente",
        "knowledgeLevel": 2,
        "category": "SafetyCar"
    }

def pregunta_salida_safety_car_linea():
    return {
        "question": "¿Qué línea debe cruzar un coche para poder adelantar tras el safety car?",
        "answers": ["Línea de Safety Car 1", "Línea de boxes", "Línea de meta", "Línea de clasificación"],
        "correctAnswer": "Línea de Safety Car 1",
        "knowledgeLevel": 2,
        "category": "SafetyCar"
    }

def pregunta_tiempos_vsc():
    return {
        "question": "¿Cómo se controlan los tiempos de los pilotos bajo VSC?",
        "answers": ["Mediante sectores de referencia por la FIA", "Con sensores en los neumáticos", "Por GPS en el volante", "Por aviso de los comisarios"],
        "correctAnswer": "Mediante sectores de referencia por la FIA",
        "knowledgeLevel": 3,
        "category": "SafetyCar"
    }

def pregunta_vuelta_lanzada():
    return {
        "question": "¿Qué tipo de relanzamiento realiza el líder tras el Safety Car?",
        "answers": ["Vuelta lanzada con ritmo libre desde la última curva", "Relanzamiento desde pit lane", "Salida detenida", "No hay relanzamiento, se retira y continúa la carrera"],
        "correctAnswer": "Vuelta lanzada con ritmo libre desde la última curva",
        "knowledgeLevel": 2,
        "category": "SafetyCar"
    }

def pregunta_coche_doblado_safety_car():
    return {
        "question": "¿Qué pueden hacer los coches doblados durante un Safety Car?",
        "answers": ["Adelantar para recuperar vuelta si se autoriza", "Permanecer en posición siempre", "Detenerse en boxes", "Salir del trazado y reincorporarse"],
        "correctAnswer": "Adelantar para recuperar vuelta si se autoriza",
        "knowledgeLevel": 3,
        "category": "SafetyCar"
    }

def pregunta_bandera_verde_post_sc():
    return {
        "question": "¿Qué bandera se muestra cuando se termina el periodo de coche de seguridad?",
        "answers": ["Bandera verde", "Bandera azul", "Bandera blanca", "Bandera amarilla"],
        "correctAnswer": "Bandera verde",
        "knowledgeLevel": 1,
        "category": "SafetyCar"
    }
# Categoría: Clasificación

def pregunta_formato_clasificacion():
    return {
        "question": "¿Cuántas sesiones tiene la clasificación habitual?",
        "answers": ["Tres (Q1, Q2 y Q3)", "Dos (Q1 y Q2)", "Una única tanda de 60 minutos", "Cinco rondas eliminatorias"],
        "correctAnswer": "Tres (Q1, Q2 y Q3)",
        "knowledgeLevel": 1,
        "category": "Qualifying"
    }

def pregunta_duracion_q3():
    return {
        "question": "¿Cuál es la duración de la sesión Q3?",
        "answers": ["12 minutos", "15 minutos", "10 minutos", "20 minutos"],
        "correctAnswer": "12 minutos",
        "knowledgeLevel": 1,
        "category": "Qualifying"
    }

def pregunta_orden_salida_clasificacion():
    return {
        "question": "¿Cómo se determina el orden de salida en la clasificación?",
        "answers": ["Libre durante la sesión", "Según resultados de prácticas", "Por sorteo", "Por orden de llegada al pit lane"],
        "correctAnswer": "Libre durante la sesión",
        "knowledgeLevel": 2,
        "category": "Qualifying"
    }

def pregunta_tiempos_q1_eliminacion():
    return {
        "question": "¿Cuántos pilotos son eliminados al final de Q1?",
        "answers": ["5", "3", "6", "4"],
        "correctAnswer": "5",
        "knowledgeLevel": 1,
        "category": "Qualifying"
    }

def pregunta_prohibiciones_clasificacion():
    return {
        "question": "¿Qué está prohibido durante una vuelta rápida en clasificación?",
        "answers": ["Obstaculizar a otro piloto", "Usar DRS", "Cambiar de compuesto", "Pasar por boxes"],
        "correctAnswer": "Obstaculizar a otro piloto",
        "knowledgeLevel": 2,
        "category": "Qualifying"
    }

def pregunta_autorizacion_participacion_fuera_107():
    return {
        "question": "¿Quién puede autorizar a un piloto a correr si no cumple el 107%?",
        "answers": ["Los comisarios", "El director de equipo", "El director de carrera", "El delegado técnico"],
        "correctAnswer": "Los comisarios",
        "knowledgeLevel": 3,
        "category": "Qualifying"
    }

def pregunta_influencia_sanciones_clasificacion():
    return {
        "question": "¿Pueden las sanciones cambiar el orden de parrilla después de la clasificación?",
        "answers": ["Sí, afectan la posición de salida", "No, la clasificación es definitiva", "Solo si es por neumáticos", "Depende del circuito"],
        "correctAnswer": "Sí, afectan la posición de salida",
        "knowledgeLevel": 2,
        "category": "Qualifying"
    }

def pregunta_mas_de_un_tiempo():
    return {
        "question": "¿Puede un piloto marcar más de un tiempo por sesión?",
        "answers": ["Sí, puede hacer varias vueltas rápidas", "No, solo una vuelta rápida por sesión", "Solo si no ha usado DRS", "Depende del compuesto usado"],
        "correctAnswer": "Sí, puede hacer varias vueltas rápidas",
        "knowledgeLevel": 1,
        "category": "Qualifying"
    }

def pregunta_uso_neumaticos_q3():
    return {
        "question": "¿Qué tipo de neumáticos suelen usarse en Q3?",
        "answers": ["Los más blandos disponibles", "Intermedios por normativa", "Duro obligatorio", "Cualquiera, según decisión del piloto"],
        "correctAnswer": "Los más blandos disponibles",
        "knowledgeLevel": 1,
        "category": "Qualifying"
    }


# Categoría: Sprint
def pregunta_dia_sprint_shootout():
    return {
        "question": "¿Qué día se celebra la Sprint Shootout en un formato sprint weekend?",
        "answers": ["Sábado", "Viernes", "Domingo", "Depende del circuito"],
        "correctAnswer": "Sábado",
        "knowledgeLevel": 1,
        "category": "Sprint"
    }

def pregunta_duracion_sprint():
    return {
        "question": "¿Cuál es la duración máxima de una carrera Sprint?",
        "answers": ["100 km o 30 minutos", "200 km o 45 minutos", "50 km o 20 minutos", "150 km o 60 minutos"],
        "correctAnswer": "100 km o 30 minutos",
        "knowledgeLevel": 2,
        "category": "Sprint"
    }

def pregunta_objetivo_sprint():
    return {
        "question": "¿Cuál es el propósito principal de la carrera Sprint?",
        "answers": ["Determinar el orden de salida del Gran Premio", "Reemplazar la clasificación", "Reducir el número de prácticas", "Asignar neumáticos"],
        "correctAnswer": "Determinar el orden de salida del Gran Premio",
        "knowledgeLevel": 1,
        "category": "Sprint"
    }

def pregunta_orden_salida_sprint():
    return {
        "question": "¿Cómo se determina el orden de salida de la Sprint?",
        "answers": ["Según el resultado de la Sprint Shootout", "Por orden del campeonato", "Por sorteo", "Con base en prácticas libres 1"],
        "correctAnswer": "Según el resultado de la Sprint Shootout",
        "knowledgeLevel": 2,
        "category": "Sprint"
    }

def pregunta_compuestos_sprint():
    return {
        "question": "¿Es obligatorio usar diferentes compuestos de neumáticos en la Sprint?",
        "answers": ["No", "Sí, al menos dos", "Solo si llueve", "Depende del clima"],
        "correctAnswer": "No",
        "knowledgeLevel": 1,
        "category": "Sprint"
    }

def pregunta_parrilla_gp():
    return {
        "question": "¿Cómo se define la parrilla del Gran Premio en fin de semana Sprint?",
        "answers": ["Según la clasificación del viernes", "Según el resultado de la Sprint", "Por orden inverso a la Sprint", "Por puntos en el campeonato"],
        "correctAnswer": "Según la clasificación del viernes",
        "knowledgeLevel": 2,
        "category": "Sprint"
    }

def pregunta_neumaticos_ss():
    return {
        "question": "¿Qué neumáticos deben usarse en la Sprint Shootout?",
        "answers": ["Medios en Q1 y Q2, blandos en Q3", "Libres en todas las sesiones", "Solo duros en Q1 y Q2", "Intermedios obligatorios"],
        "correctAnswer": "Medios en Q1 y Q2, blandos en Q3",
        "knowledgeLevel": 2,
        "category": "Sprint"
    }

def pregunta_vuelta_lanzada_sprint():
    return {
        "question": "¿Cómo inicia la Sprint?",
        "answers": ["Con salida detenida desde parrilla", "Lanzada tras Safety Car", "Desde boxes", "Con semáforo verde en curva 1"],
        "correctAnswer": "Con salida detenida desde parrilla",
        "knowledgeLevel": 1,
        "category": "Sprint"
    }

def pregunta_penalizaciones_sprint():
    return {
        "question": "¿Pueden aplicarse penalizaciones tras la Sprint?",
        "answers": ["Sí, y afectar la parrilla del GP", "No, solo durante la Sprint", "Sí, pero solo en puntos", "Solo si son sanciones monetarias"],
        "correctAnswer": "Sí, y afectar la parrilla del GP",
        "knowledgeLevel": 2,
        "category": "Sprint"
    }

# Categoría: Bandera Roja
def pregunta_modificaciones_bandera_roja():
    return {
        "question": "¿Qué está permitido hacer en el coche durante una bandera roja?",
        "answers": ["Reparaciones y cambios autorizados por la FIA", "Nada, el coche debe permanecer intacto", "Solo cambio de neumáticos", "Repostar combustible"],
        "correctAnswer": "Reparaciones y cambios autorizados por la FIA",
        "knowledgeLevel": 2,
        "category": "RedFlag"
    }

def pregunta_fin_bandera_roja():
    return {
        "question": "¿Cómo se reanuda una carrera tras una bandera roja?",
        "answers": ["Con salida detenida o lanzada, según decisión del director de carrera", "Siempre con salida desde boxes", "Se reinicia con bandera verde en pista", "Por orden inverso al anterior"],
        "correctAnswer": "Con salida detenida o lanzada, según decisión del director de carrera",
        "knowledgeLevel": 2,
        "category": "RedFlag"
    }

def pregunta_duracion_maxima_suspension():
    return {
        "question": "¿Cuál es la duración máxima permitida para una suspensión por bandera roja?",
        "answers": ["3 horas de duración total del evento", "1 hora desde interrupción", "30 minutos exactos", "Sin límite"],
        "correctAnswer": "3 horas de duración total del evento",
        "knowledgeLevel": 3,
        "category": "RedFlag"
    }

def pregunta_motivo_bandera_roja():
    return {
        "question": "¿Qué tipo de situaciones justifican una bandera roja?",
        "answers": ["Condiciones peligrosas o accidente grave", "Adelantamientos múltiples", "Fin de sesión", "Bandera azul ignorada"],
        "correctAnswer": "Condiciones peligrosas o accidente grave",
        "knowledgeLevel": 1,
        "category": "RedFlag"
    }

def pregunta_posiciones_bandera_roja():
    return {
        "question": "¿Cómo se determinan las posiciones cuando se suspende una carrera con bandera roja?",
        "answers": ["Con el orden al final de la última vuelta completa válida", "Con el orden de la clasificación", "Según tiempo de reacción", "Por decisión de los comisarios"],
        "correctAnswer": "Con el orden al final de la última vuelta completa válida",
        "knowledgeLevel": 2,
        "category": "RedFlag"
    }

def pregunta_pitlane_durante_roja():
    return {
        "question": "¿Está permitido entrar al pit lane durante una bandera roja?",
        "answers": ["Sí, pero bajo condiciones específicas", "No bajo ninguna circunstancia", "Solo para repostar", "Sí, siempre que sea urgente"],
        "correctAnswer": "Sí, pero bajo condiciones específicas",
        "knowledgeLevel": 2,
        "category": "RedFlag"
    }

def pregunta_pilotos_vehiculos_roja():
    return {
        "question": "¿Qué deben hacer los pilotos durante una bandera roja?",
        "answers": ["Conducir lentamente hasta el pit lane", "Detenerse en pista", "Seguir compitiendo con precaución", "Esperar instrucciones de comisarios en la pista"],
        "correctAnswer": "Conducir lentamente hasta el pit lane",
        "knowledgeLevel": 1,
        "category": "RedFlag"
    }

def pregunta_comunicacion_bandera_roja():
    return {
        "question": "¿Cómo se comunica oficialmente la bandera roja a los equipos?",
        "answers": ["Mediante paneles luminosos y mensaje oficial en cronometraje", "Por señal acústica en boxes", "Por radio entre comisarios", "Por luces intermitentes azules"],
        "correctAnswer": "Mediante paneles luminosos y mensaje oficial en cronometraje",
        "knowledgeLevel": 2,
        "category": "RedFlag"
    }

def pregunta_obligaciones_durante_roja():
    return {
        "question": "¿Qué está prohibido hacer al personal del equipo durante una bandera roja?",
        "answers": ["Trabajar en el coche sin autorización", "Salir del garaje", "Comunicarse con el piloto", "Entrar a boxes"],
        "correctAnswer": "Trabajar en el coche sin autorización",
        "knowledgeLevel": 3,
        "category": "RedFlag"
    }

def pregunta_modificacion_setup_roja():
    return {
        "question": "¿Puede modificarse el setup del coche durante una bandera roja?",
        "answers": ["Solo con autorización de la FIA", "Sí, libremente", "No, nunca", "Solo si hay lluvia"],
        "correctAnswer": "Solo con autorización de la FIA",
        "knowledgeLevel": 3,
        "category": "RedFlag"
    }

# Categoría: Pilotos
def pregunta_reemplazo_piloto():
    return {
        "question": "¿Qué debe hacer un equipo si un piloto no puede competir tras el inicio del evento?",
        "answers": ["Solicitar aprobación de los comisarios para un reemplazo", "Nada, solo se corre con un coche", "Reclamar puntos automáticamente", "Cambiar de piloto sin avisar"],
        "correctAnswer": "Solicitar aprobación de los comisarios para un reemplazo",
        "knowledgeLevel": 2,
        "category": "Drivers"
    }

def pregunta_minimo_edad_piloto():
    return {
        "question": "¿Cuál es la edad mínima para competir en Fórmula 1?",
        "answers": ["18 años", "16 años", "21 años", "No hay límite"],
        "correctAnswer": "18 años",
        "knowledgeLevel": 1,
        "category": "Drivers"
    }

def pregunta_superlicencia():
    return {
        "question": "¿Qué documento necesita un piloto para competir en F1?",
        "answers": ["Superlicencia otorgada por la FIA", "Carnet de conducir internacional", "Licencia nacional", "Certificado de equipo"],
        "correctAnswer": "Superlicencia otorgada por la FIA",
        "knowledgeLevel": 1,
        "category": "Drivers"
    }

def pregunta_puntos_superlicencia():
    return {
        "question": "¿Qué ocurre si un piloto acumula 12 puntos en su superlicencia en 12 meses?",
        "answers": ["Es suspendido por una carrera", "Pierde 10 posiciones en parrilla", "Debe pagar una multa", "Es excluido de la temporada"],
        "correctAnswer": "Es suspendido por una carrera",
        "knowledgeLevel": 3,
        "category": "Drivers"
    }

def pregunta_cambio_numero():
    return {
        "question": "¿Puede un piloto cambiar su número durante la temporada?",
        "answers": ["No, debe mantenerlo todo el año", "Sí, si cambia de equipo", "Solo una vez", "Solo con aprobación de los comisarios"],
        "correctAnswer": "No, debe mantenerlo todo el año",
        "knowledgeLevel": 2,
        "category": "Drivers"
    }

def pregunta_duracion_contrato():
    return {
        "question": "¿Quién regula la duración del contrato de un piloto?",
        "answers": ["Es una cuestión entre equipo y piloto", "La FIA", "El promotor del campeonato", "El director de carrera"],
        "correctAnswer": "Es una cuestión entre equipo y piloto",
        "knowledgeLevel": 2,
        "category": "Drivers"
    }

def pregunta_uso_mismo_coche():
    return {
        "question": "¿Puede un segundo piloto usar el coche de otro piloto en el mismo evento?",
        "answers": ["No, salvo autorización expresa de los comisarios", "Sí, siempre que esté libre", "Solo si el otro piloto abandona", "Sí, en la última sesión"],
        "correctAnswer": "No, salvo autorización expresa de los comisarios",
        "knowledgeLevel": 3,
        "category": "Drivers"
    }

def pregunta_test_jovenes():
    return {
        "question": "¿Qué es un test de jóvenes pilotos?",
        "answers": ["Una sesión oficial para pilotos con poca experiencia en F1", "Un test libre para cualquier piloto", "Un simulacro de carrera en lluvia", "Una prueba de seguridad"],
        "correctAnswer": "Una sesión oficial para pilotos con poca experiencia en F1",
        "knowledgeLevel": 2,
        "category": "Drivers"
    }

def pregunta_sustitucion_urgente():
    return {
        "question": "¿Qué ocurre si un piloto debe ser sustituido de forma urgente?",
        "answers": ["El equipo puede proponer un piloto con autorización de la FIA", "Debe competir un solo coche", "Se anula la inscripción", "El evento se suspende"],
        "correctAnswer": "El equipo puede proponer un piloto con autorización de la FIA",
        "knowledgeLevel": 2,
        "category": "Drivers"
    }

def pregunta_debut_f1():
    return {
        "question": "¿Qué debe cumplir un piloto para debutar en F1?",
        "answers": ["Tener superlicencia y experiencia previa en categorías menores", "Participar en tres sesiones de práctica", "Haber ganado un campeonato regional", "Contar con aprobación de equipo rival"],
        "correctAnswer": "Tener superlicencia y experiencia previa en categorías menores",
        "knowledgeLevel": 2,
        "category": "Drivers"
    }



def generar_preguntas_reglamento():
    generadores = [
        pregunta_puntuacion_diez_puntos,
        pregunta_licencia_12_puntos,
        pregunta_superlicencia,
        pregunta_puntos_superlicencia,
        pregunta_cambio_numero,
        pregunta_duracion_contrato,
        pregunta_uso_mismo_coche,
        pregunta_test_jovenes,
        pregunta_sustitucion_urgente,
        pregunta_debut_f1,
        pregunta_activacion_drs,
        pregunta_fin_parque_cerrado,
        pregunta_doble_bandera_amarilla,
        pregunta_neumaticos_compuestos,
        pregunta_vsc_significado,
        pregunta_condiciones_vsc,
        pregunta_tiempos_vsc,
        pregunta_regla_107_por_ciento,
        pregunta_dia_sprint_shootout,
        pregunta_bandera_roja,
        pregunta_verificacion_tecnica,
        caso_reincorporacion_peligrosa,
        pregunta_puntos_sprint,
        pregunta_penalizacion_componentes,
        pregunta_bandera_roja,
        pregunta_modificaciones_parque_cerrado,
        pregunta_vuelta_formacion,
        pregunta_velocidad_pitlane,
        pregunta_neumaticos_disponibles,
        pregunta_safety_car,
        pregunta_sesiones_clasificacion,
        pregunta_orden_salida_sprint,
        pregunta_bandera_roja_suspension,
        pregunta_cambio_piloto
    ]
    preguntas = []
    while len(preguntas) < 10:
        gen = random.choice(generadores)
        q = gen()
        if q not in preguntas:
            preguntas.append(q)
    return preguntas



def generar_preguntas_filtradas(categoria):
    generadores = [
        pregunta_puntuacion_diez_puntos,
        pregunta_licencia_12_puntos,
        pregunta_superlicencia,
        pregunta_puntos_superlicencia,
        pregunta_cambio_numero,
        pregunta_duracion_contrato,
        pregunta_uso_mismo_coche,
        pregunta_test_jovenes,
        pregunta_sustitucion_urgente,
        pregunta_debut_f1,
        pregunta_activacion_drs,
        pregunta_fin_parque_cerrado,
        pregunta_doble_bandera_amarilla,
        pregunta_neumaticos_compuestos,
        pregunta_vsc_significado,
        pregunta_condiciones_vsc,
        pregunta_tiempos_vsc,
        pregunta_regla_107_por_ciento,
        pregunta_dia_sprint_shootout,
        pregunta_bandera_roja,
        pregunta_verificacion_tecnica,
        caso_reincorporacion_peligrosa,
        pregunta_puntos_sprint,
        pregunta_penalizacion_componentes,
        pregunta_bandera_roja,
        pregunta_modificaciones_parque_cerrado,
        pregunta_vuelta_formacion,
        pregunta_velocidad_pitlane,
        pregunta_neumaticos_disponibles,
        pregunta_safety_car,
        pregunta_sesiones_clasificacion,
        pregunta_orden_salida_sprint,
        pregunta_bandera_roja_suspension,
        pregunta_cambio_piloto,
        caso_bandera_roja_pista_bloqueada,
        caso_exceso_velocidad_pitlane,
        caso_neumatico_incorrecto_clasificacion,
        caso_orden_reinicio_bandera_roja,
        caso_adelantar_tras_safety_car,
        #Sección: Puntuaciones
        pregunta_puntuacion_segundo_clasificado,
        pregunta_puntuacion_quinto_clasificado,
        pregunta_puntos_reducidos_condiciones,
        pregunta_puntos_mitad_carrera,
        pregunta_puntos_victoria_sprint,
        pregunta_equipo_1y2,
        pregunta_puntos_octavo_sprint,
        pregunta_puntos_bandera_roja,
        # Sección: Sanciones
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

    ]
    preguntas = []
    for gen in generadores:
        p = gen()
        if categoria and p["category"].lower() != categoria.lower():
            continue
        preguntas.append(p)
    return preguntas



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, help="Filtrar por categoría (opcional)", default=None)
    args = parser.parse_args()

    categoria_normalizada = args.category.lower() if args.category else None
    preguntas = generar_preguntas_filtradas(categoria=categoria_normalizada) \
        if categoria_normalizada else generar_preguntas_reglamento()

    if not preguntas:
        print(f"[ERROR] No se encontraron preguntas para la categoría: {args.category}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(preguntas, ensure_ascii=False))


