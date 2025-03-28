
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
        "category": "Puntuación"
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
        "category": "Sanciones"
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
        "category": "Procedimientos"
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
        "category": "Parque Cerrado"
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
        "category": "Procedimiento"
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
        "category": "Seguridad"
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
        "category": "Neumáticos"
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
        "category": "Safety Car"
    }

def pregunta_sesiones_clasificacion():
    return {
        "question": "¿Cuántas sesiones componen la clasificación normal del sábado en Fórmula 1?",
        "answers": ["3", "2", "4", "1"],
        "correctAnswer": "3",
        "knowledgeLevel": 1,
        "category": "Clasificación"
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
        "category": "Bandera Roja"
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
        "category": "Pilotos"
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
        "category": "Técnico"
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
        "category": "Caso práctico"
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
        "category": "Caso práctico"
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
        "category": "Caso práctico"
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
        "category": "Caso práctico"
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
        "category": "Caso práctico"
    }

def pregunta_puntuacion_diez_puntos():
    return {
        "question": "¿Cuántos puntos obtiene el piloto que finaliza en décima posición?",
        "answers": ["1", "2", "0", "3"],
        "correctAnswer": "1",
        "knowledgeLevel": 1,
        "category": "Puntuación"
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
        "category": "Sanciones"
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
        "category": "Procedimientos"
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
        "category": "Parque Cerrado"
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
        "category": "Seguridad"
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
        "category": "Neumáticos"
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
        "category": "Safety Car"
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
        "category": "Clasificación"
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
        "category": "Bandera Roja"
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
        "category": "Pilotos"
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
        "category": "Técnico"
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
        "category": "Caso práctico"
    }


def generar_preguntas_reglamento():
    generadores = [
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
        pregunta_verificacion_tecnica
    ]
    preguntas = []
    while len(preguntas) < 5:
        gen = random.choice(generadores)
        q = gen()
        if q not in preguntas:
            preguntas.append(q)
    return preguntas


def generar_preguntas_filtradas(categoria=None, nivel=None):
    generadores = [
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
        pregunta_verificacion_tecnica,
        caso_bandera_roja_pista_bloqueada,
        caso_exceso_velocidad_pitlane,
        caso_neumatico_incorrecto_clasificacion,
        caso_orden_reinicio_bandera_roja,
        caso_adelantar_tras_safety_car
    ]
    preguntas = []
    for gen in generadores:
        p = gen()
        if categoria and p["category"].lower() != categoria.lower():
            continue
        if nivel and p["knowledgeLevel"] != nivel:
            continue
        preguntas.append(p)
    return preguntas



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, help="Filtrar por categoría (opcional)", default=None)
    parser.add_argument("--level", type=int, help="Filtrar por nivel de conocimiento (opcional)", default=None)
    args = parser.parse_args()

    if args.category or args.level:
        preguntas = generar_preguntas_filtradas(categoria=args.category, nivel=args.level)
    else:
        preguntas = generar_preguntas_reglamento()

    print(json.dumps(preguntas, ensure_ascii=False))
