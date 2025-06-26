import random
import json
import sys
import argparse


def pregunta_efecto_suelo():
    if LANG == "es":
        return {
            "question": "¿Qué principio físico permite que el efecto suelo incremente la carga aerodinámica?",
            "answers": [
                "Efecto Venturi",
                "Ley de Boyle",
                "Ley de Ohm",
                "Efecto Doppler"
            ],
            "correctAnswer": "Efecto Venturi",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which physical principle allows ground effect to increase downforce?",
            "answers": [
                "Venturi effect",
                "Boyle’s law",
                "Ohm’s law",
                "Doppler effect"
            ],
            "correctAnswer": "Venturi effect",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_transferencia_peso_frenada():
    if LANG == "es":
        return {
            "question": "¿Qué sucede con el reparto de peso durante una frenada fuerte en un coche de F1?",
            "answers": [
                "El peso se transfiere hacia el eje delantero",
                "El peso se transfiere hacia el eje trasero",
                "Se distribuye equitativamente entre las ruedas",
                "Se reduce la masa del coche"
            ],
            "correctAnswer": "El peso se transfiere hacia el eje delantero",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens to weight distribution during heavy braking in an F1 car?",
            "answers": [
                "Weight transfers to the front axle",
                "Weight transfers to the rear axle",
                "It balances equally between all wheels",
                "Car mass decreases"
            ],
            "correctAnswer": "Weight transfers to the front axle",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_temperatura_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Por qué es importante que los neumáticos de F1 estén en su temperatura óptima de funcionamiento?",
            "answers": [
                "Para maximizar agarre y minimizar desgaste",
                "Para reducir el peso del coche",
                "Para cumplir con normas de emisiones",
                "Para evitar la vibración del volante"
            ],
            "correctAnswer": "Para maximizar agarre y minimizar desgaste",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why is it important for F1 tyres to be at optimal operating temperature?",
            "answers": [
                "To maximize grip and minimize wear",
                "To reduce car weight",
                "To meet emission standards",
                "To avoid steering wheel vibration"
            ],
            "correctAnswer": "To maximize grip and minimize wear",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_resistencia_aire():
    if LANG == "es":
        return {
            "question": "¿Qué efecto tiene el aumento del coeficiente de arrastre (drag) en un coche de F1?",
            "answers": [
                "Disminuye la velocidad punta",
                "Aumenta la aceleración en curvas",
                "Reduce el consumo de combustible",
                "Mejora la carga aerodinámica trasera"
            ],
            "correctAnswer": "Disminuye la velocidad punta",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What effect does increased aerodynamic drag have on an F1 car?",
            "answers": [
                "Reduces top speed",
                "Increases cornering acceleration",
                "Improves fuel economy",
                "Improves rear downforce"
            ],
            "correctAnswer": "Reduces top speed",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_mgu_k():
    if LANG == "es":
        return {
            "question": "¿Qué función tiene el MGU-K en un coche de Fórmula 1?",
            "answers": [
                "Recuperar energía cinética en frenada",
                "Refrigerar el sistema de batería",
                "Calentar los neumáticos traseros",
                "Controlar el diferencial trasero"
            ],
            "correctAnswer": "Recuperar energía cinética en frenada",
            "knowledgeLevel": 4,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the purpose of the MGU-K in a Formula 1 car?",
            "answers": [
                "Recover kinetic energy under braking",
                "Cool the battery system",
                "Heat rear tyres",
                "Control the rear differential"
            ],
            "correctAnswer": "Recover kinetic energy under braking",
            "knowledgeLevel": 4,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_aceleracion_recta():
    if LANG == "es":
        return {
            "question": "¿Qué variable física se incrementa cuando un coche de F1 acelera en una recta?",
            "answers": [
                "Velocidad",
                "Fricción",
                "Presión atmosférica",
                "Temperatura ambiente"
            ],
            "correctAnswer": "Velocidad",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which physical quantity increases when an F1 car accelerates on a straight?",
            "answers": [
                "Speed",
                "Friction",
                "Atmospheric pressure",
                "Ambient temperature"
            ],
            "correctAnswer": "Speed",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_fuerza_giro():
    if LANG == "es":
        return {
            "question": "¿Qué fuerza mantiene a un coche de F1 en trayectoria al tomar una curva?",
            "answers": [
                "Fuerza centrípeta",
                "Fuerza gravitacional",
                "Fuerza de empuje",
                "Fuerza magnética"
            ],
            "correctAnswer": "Fuerza centrípeta",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which force keeps an F1 car on track when cornering?",
            "answers": [
                "Centripetal force",
                "Gravitational force",
                "Thrust force",
                "Magnetic force"
            ],
            "correctAnswer": "Centripetal force",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_gravedad_bajada():
    if LANG == "es":
        return {
            "question": "¿Qué efecto tiene la gravedad en una bajada dentro de un circuito?",
            "answers": [
                "Aumenta la aceleración natural del coche",
                "Reduce la masa del coche",
                "Desactiva el ERS",
                "Enfría los frenos"
            ],
            "correctAnswer": "Aumenta la aceleración natural del coche",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the effect of gravity on a downhill section of a circuit?",
            "answers": [
                "Increases the car's natural acceleration",
                "Reduces the car's mass",
                "Deactivates ERS",
                "Cools the brakes"
            ],
            "correctAnswer": "Increases the car's natural acceleration",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_friccion_neumatico_pista():
    if LANG == "es":
        return {
            "question": "¿Qué determina principalmente el agarre entre el neumático y la pista?",
            "answers": [
                "Coeficiente de fricción",
                "Presión atmosférica",
                "Velocidad del viento",
                "Distancia entre ejes"
            ],
            "correctAnswer": "Coeficiente de fricción",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What mainly determines the grip between the tyre and the track?",
            "answers": [
                "Coefficient of friction",
                "Atmospheric pressure",
                "Wind speed",
                "Wheelbase"
            ],
            "correctAnswer": "Coefficient of friction",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_calor_disco_freno():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de transferencia de energía ocurre en los frenos de un coche de F1?",
            "answers": [
                "De energía cinética a térmica",
                "De energía potencial a eléctrica",
                "De térmica a química",
                "De magnética a cinética"
            ],
            "correctAnswer": "De energía cinética a térmica",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What type of energy transfer occurs in F1 car brakes?",
            "answers": [
                "From kinetic to thermal energy",
                "From potential to electrical energy",
                "From thermal to chemical energy",
                "From magnetic to kinetic energy"
            ],
            "correctAnswer": "From kinetic to thermal energy",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_downforce_vs_drag():
    if LANG == "es":
        return {
            "question": "¿Cuál es la relación principal entre la carga aerodinámica (downforce) y la resistencia al avance (drag)?",
            "answers": [
                "Aumentar downforce suele aumentar el drag",
                "Menos drag implica más agarre",
                "Ambas disminuyen juntas con más velocidad",
                "No hay relación directa entre ellas"
            ],
            "correctAnswer": "Aumentar downforce suele aumentar el drag",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main relationship between downforce and aerodynamic drag?",
            "answers": [
                "Increasing downforce usually increases drag",
                "Less drag means more grip",
                "Both decrease with more speed",
                "There is no direct relationship"
            ],
            "correctAnswer": "Increasing downforce usually increases drag",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_transferencia_peso_aceleracion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre con el reparto de peso al acelerar bruscamente?",
            "answers": [
                "El peso se transfiere al eje trasero",
                "El coche pierde masa",
                "Se genera más carga aerodinámica delantera",
                "El centro de gravedad baja"
            ],
            "correctAnswer": "El peso se transfiere al eje trasero",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens to weight distribution under hard acceleration?",
            "answers": [
                "Weight transfers to the rear axle",
                "Car loses mass",
                "Front downforce increases",
                "Center of gravity lowers"
            ],
            "correctAnswer": "Weight transfers to the rear axle",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_resistencia_neumaticos():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de fuerza se opone al movimiento debido al contacto del neumático con el asfalto?",
            "answers": [
                "Resistencia a la rodadura",
                "Resistencia magnética",
                "Resistencia centrífuga",
                "Presión hidrodinámica"
            ],
            "correctAnswer": "Resistencia a la rodadura",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which type of force resists motion due to tyre-road contact?",
            "answers": [
                "Rolling resistance",
                "Magnetic resistance",
                "Centrifugal resistance",
                "Hydrodynamic pressure"
            ],
            "correctAnswer": "Rolling resistance",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_densidad_aire():
    if LANG == "es":
        return {
            "question": "¿Qué efecto tiene la densidad del aire en la aerodinámica de un F1?",
            "answers": [
                "Mayor densidad incrementa tanto el drag como la carga aerodinámica",
                "Mayor densidad reduce el drag",
                "La densidad no influye en F1",
                "Densidad alta solo afecta a los frenos"
            ],
            "correctAnswer": "Mayor densidad incrementa tanto el drag como la carga aerodinámica",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What effect does air density have on F1 car aerodynamics?",
            "answers": [
                "Higher density increases both drag and downforce",
                "Higher density reduces drag",
                "Density has no effect in F1",
                "High density only affects brakes"
            ],
            "correctAnswer": "Higher density increases both drag and downforce",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_masa_vs_peso():
    if LANG == "es":
        return {
            "question": "¿Cuál es la diferencia entre masa y peso en el contexto de un coche de F1?",
            "answers": [
                "La masa es constante, el peso depende de la gravedad",
                "Ambos cambian en cada curva",
                "El peso es siempre menor que la masa",
                "No existe diferencia física entre ellos"
            ],
            "correctAnswer": "La masa es constante, el peso depende de la gravedad",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What's the difference between mass and weight for an F1 car?",
            "answers": [
                "Mass is constant, weight depends on gravity",
                "Both change in every corner",
                "Weight is always lower than mass",
                "There's no physical difference"
            ],
            "correctAnswer": "Mass is constant, weight depends on gravity",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }



def pregunta_momento_inercia():
    if LANG == "es":
        return {
            "question": "¿Qué describe el momento de inercia en un monoplaza de F1?",
            "answers": [
                "La resistencia del coche a cambiar su rotación",
                "La masa total del coche",
                "La fuerza centrípeta en una curva",
                "El coeficiente aerodinámico del alerón"
            ],
            "correctAnswer": "La resistencia del coche a cambiar su rotación",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the moment of inertia describe in an F1 car?",
            "answers": [
                "The car’s resistance to change in rotation",
                "The car’s total mass",
                "The centripetal force in a corner",
                "The aerodynamic coefficient of the wing"
            ],
            "correctAnswer": "The car’s resistance to change in rotation",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_compresion_suspension():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre con la suspensión delantera al frenar con fuerza?",
            "answers": [
                "Se comprime debido a la transferencia de peso",
                "Se expande por la inercia del aire",
                "No varía en frenada",
                "Actúa el diferencial"
            ],
            "correctAnswer": "Se comprime debido a la transferencia de peso",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens to the front suspension during heavy braking?",
            "answers": [
                "It compresses due to weight transfer",
                "It extends due to air inertia",
                "It remains unchanged",
                "The differential acts"
            ],
            "correctAnswer": "It compresses due to weight transfer",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_energia_pendiente():
    if LANG == "es":
        return {
            "question": "Cuando un coche sube una pendiente, ¿qué tipo de energía se acumula?",
            "answers": [
                "Energía potencial",
                "Energía térmica",
                "Energía cinética",
                "Energía mecánica negativa"
            ],
            "correctAnswer": "Energía potencial",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "When a car climbs a hill, what kind of energy is stored?",
            "answers": [
                "Potential energy",
                "Thermal energy",
                "Kinetic energy",
                "Negative mechanical energy"
            ],
            "correctAnswer": "Potential energy",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_flexion_alas():
    if LANG == "es":
        return {
            "question": "¿Qué consecuencia física tiene la flexión de los alerones en alta velocidad?",
            "answers": [
                "Reduce el drag en recta y aumenta eficiencia aerodinámica",
                "Aumenta el downforce al frenar",
                "Genera más carga lateral en curvas lentas",
                "Produce desgaste irregular de neumáticos"
            ],
            "correctAnswer": "Reduce el drag en recta y aumenta eficiencia aerodinámica",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the aerodynamic effect of wing flexion at high speed?",
            "answers": [
                "Reduces drag on straights and improves aero efficiency",
                "Increases downforce under braking",
                "Generates more lateral load in slow corners",
                "Causes irregular tyre wear"
            ],
            "correctAnswer": "Reduces drag on straights and improves aero efficiency",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_eficiencia_frenado():
    if LANG == "es":
        return {
            "question": "¿Qué condición mejora la eficiencia del frenado en F1?",
            "answers": [
                "Temperatura óptima de discos y pastillas",
                "Mayor velocidad del viento",
                "Uso de neumáticos duros",
                "Baja presión de combustible"
            ],
            "correctAnswer": "Temperatura óptima de discos y pastillas",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What improves braking efficiency in F1?",
            "answers": [
                "Optimal temperature of discs and pads",
                "Higher wind speed",
                "Use of hard tyres",
                "Low fuel pressure"
            ],
            "correctAnswer": "Optimal temperature of discs and pads",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }



def pregunta_transferencia_lateral_curva():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre con el peso del coche al tomar una curva rápida hacia la izquierda?",
            "answers": [
                "Se transfiere hacia el lado derecho",
                "Se transfiere hacia el lado izquierdo",
                "Aumenta en el eje delantero",
                "Disminuye la masa total"
            ],
            "correctAnswer": "Se transfiere hacia el lado derecho",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens to the car’s weight when cornering fast to the left?",
            "answers": [
                "It transfers to the right side",
                "It transfers to the left side",
                "It increases on the front axle",
                "Total mass decreases"
            ],
            "correctAnswer": "It transfers to the right side",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_densidad_altitud():
    if LANG == "es":
        return {
            "question": "¿Cómo afecta una mayor altitud (menos densidad del aire) a un coche de F1?",
            "answers": [
                "Reduce la carga aerodinámica y el drag",
                "Aumenta la adherencia",
                "Incrementa la resistencia térmica",
                "No tiene efecto alguno"
            ],
            "correctAnswer": "Reduce la carga aerodinámica y el drag",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does higher altitude (lower air density) affect an F1 car?",
            "answers": [
                "Reduces both downforce and drag",
                "Increases grip",
                "Increases thermal resistance",
                "Has no effect"
            ],
            "correctAnswer": "Reduces both downforce and drag",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_tamano_ruedas():
    if LANG == "es":
        return {
            "question": "¿Qué ventaja ofrece un mayor diámetro de rueda en términos de física del vehículo?",
            "answers": [
                "Mejor estabilidad lineal y menor deformación del neumático",
                "Mayor resistencia al aire",
                "Menor velocidad de rotación del motor",
                "Incremento de masa suspendida"
            ],
            "correctAnswer": "Mejor estabilidad lineal y menor deformación del neumático",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What advantage does a larger wheel diameter provide in vehicle physics?",
            "answers": [
                "Better linear stability and less tyre deformation",
                "More air resistance",
                "Lower engine RPM",
                "Increased unsprung mass"
            ],
            "correctAnswer": "Better linear stability and less tyre deformation",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_masa_vs_aceleracion():
    if LANG == "es":
        return {
            "question": "Según la segunda ley de Newton, ¿qué efecto tiene un aumento de masa sobre la aceleración si la fuerza se mantiene constante?",
            "answers": [
                "La aceleración disminuye",
                "La aceleración aumenta",
                "No cambia",
                "La aceleración se vuelve negativa"
            ],
            "correctAnswer": "La aceleración disminuye",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "According to Newton’s second law, what happens to acceleration if mass increases but force stays constant?",
            "answers": [
                "Acceleration decreases",
                "Acceleration increases",
                "It stays the same",
                "Acceleration becomes negative"
            ],
            "correctAnswer": "Acceleration decreases",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_gases_escape():
    if LANG == "es":
        return {
            "question": "¿Qué efecto físico pueden generar los gases de escape en la aerodinámica trasera?",
            "answers": [
                "Aumentar el flujo y mejorar la adherencia en el difusor",
                "Reducir la presión de los neumáticos",
                "Elevar el centro de masa del coche",
                "Disminuir la fricción con el asfalto"
            ],
            "correctAnswer": "Aumentar el flujo y mejorar la adherencia en el difusor",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical effect can exhaust gases have on rear aerodynamics?",
            "answers": [
                "Increase airflow and improve diffuser grip",
                "Lower tyre pressure",
                "Raise the car’s center of mass",
                "Reduce friction with asphalt"
            ],
            "correctAnswer": "Increase airflow and improve diffuser grip",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_energia_disipacion_curva():
    if LANG == "es":
        return {
            "question": "¿Dónde se disipa principalmente la energía durante una curva de alta velocidad?",
            "answers": [
                "En los neumáticos debido a la fricción y deformación",
                "En el chasis por compresión lateral",
                "En el sistema de escape",
                "En el volante por resistencia mecánica"
            ],
            "correctAnswer": "En los neumáticos debido a la fricción y deformación",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Where is energy mainly dissipated during a high-speed corner?",
            "answers": [
                "In the tyres due to friction and deformation",
                "In the chassis from lateral compression",
                "In the exhaust system",
                "In the steering wheel from mechanical resistance"
            ],
            "correctAnswer": "In the tyres due to friction and deformation",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_fuerza_lateral_vs_velocidad():
    if LANG == "es":
        return {
            "question": "¿Cómo varía la fuerza lateral necesaria para tomar una curva si se duplica la velocidad?",
            "answers": [
                "Se cuadruplica",
                "Se mantiene igual",
                "Se duplica",
                "Se reduce a la mitad"
            ],
            "correctAnswer": "Se cuadruplica",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does lateral force needed for cornering change if speed doubles?",
            "answers": [
                "It quadruples",
                "It stays the same",
                "It doubles",
                "It halves"
            ],
            "correctAnswer": "It quadruples",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_compresion_neumatica():
    if LANG == "es":
        return {
            "question": "¿Por qué se usa aire o gas comprimido en los sistemas de válvulas de motores F1?",
            "answers": [
                "Permite actuar válvulas a muy altas revoluciones sin fallos mecánicos",
                "Reduce la masa del bloque motor",
                "Mejora la eficiencia térmica del escape",
                "Disminuye la temperatura de los pistones"
            ],
            "correctAnswer": "Permite actuar válvulas a muy altas revoluciones sin fallos mecánicos",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why is compressed air/gas used in F1 engine valve systems?",
            "answers": [
                "It allows valves to operate at very high RPM without mechanical failure",
                "It reduces the engine block’s mass",
                "It improves exhaust thermal efficiency",
                "It lowers piston temperature"
            ],
            "correctAnswer": "It allows valves to operate at very high RPM without mechanical failure",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_rotacion_rueda_vs_traccion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si la velocidad de rotación del neumático excede la tracción disponible?",
            "answers": [
                "Se produce deslizamiento o 'wheelspin'",
                "El coche se vuelve más estable",
                "El alerón trasero pierde carga",
                "La suspensión se expande"
            ],
            "correctAnswer": "Se produce deslizamiento o 'wheelspin'",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a tyre rotates faster than available traction?",
            "answers": [
                "Wheelspin occurs",
                "Car becomes more stable",
                "Rear wing loses downforce",
                "Suspension expands"
            ],
            "correctAnswer": "Wheelspin occurs",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_interaccion_diferencial():
    if LANG == "es":
        return {
            "question": "¿Cómo influye el diferencial en la física del paso por curva en un F1?",
            "answers": [
                "Modula la entrega de par a cada rueda trasera según el ángulo y tracción",
                "Controla la inclinación de la carrocería",
                "Determina la distribución de freno delantera",
                "Activa el sistema híbrido"
            ],
            "correctAnswer": "Modula la entrega de par a cada rueda trasera según el ángulo y tracción",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does the differential affect cornering physics in an F1 car?",
            "answers": [
                "It modulates torque delivery to each rear wheel based on angle and traction",
                "It controls body roll",
                "It determines front brake balance",
                "It activates the hybrid system"
            ],
            "correctAnswer": "It modulates torque delivery to each rear wheel based on angle and traction",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_energia_disipacion_curva():
    if LANG == "es":
        return {
            "question": "¿Dónde se disipa principalmente la energía durante una curva de alta velocidad?",
            "answers": [
                "En los neumáticos debido a la fricción y deformación",
                "En el chasis por compresión lateral",
                "En el sistema de escape",
                "En el volante por resistencia mecánica"
            ],
            "correctAnswer": "En los neumáticos debido a la fricción y deformación",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Where is energy mainly dissipated during a high-speed corner?",
            "answers": [
                "In the tyres due to friction and deformation",
                "In the chassis from lateral compression",
                "In the exhaust system",
                "In the steering wheel from mechanical resistance"
            ],
            "correctAnswer": "In the tyres due to friction and deformation",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_fuerza_lateral_vs_velocidad():
    if LANG == "es":
        return {
            "question": "¿Cómo varía la fuerza lateral necesaria para tomar una curva si se duplica la velocidad?",
            "answers": [
                "Se cuadruplica",
                "Se mantiene igual",
                "Se duplica",
                "Se reduce a la mitad"
            ],
            "correctAnswer": "Se cuadruplica",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does lateral force needed for cornering change if speed doubles?",
            "answers": [
                "It quadruples",
                "It stays the same",
                "It doubles",
                "It halves"
            ],
            "correctAnswer": "It quadruples",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_compresion_neumatica():
    if LANG == "es":
        return {
            "question": "¿Por qué se usa aire o gas comprimido en los sistemas de válvulas de motores F1?",
            "answers": [
                "Permite actuar válvulas a muy altas revoluciones sin fallos mecánicos",
                "Reduce la masa del bloque motor",
                "Mejora la eficiencia térmica del escape",
                "Disminuye la temperatura de los pistones"
            ],
            "correctAnswer": "Permite actuar válvulas a muy altas revoluciones sin fallos mecánicos",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why is compressed air/gas used in F1 engine valve systems?",
            "answers": [
                "It allows valves to operate at very high RPM without mechanical failure",
                "It reduces the engine block’s mass",
                "It improves exhaust thermal efficiency",
                "It lowers piston temperature"
            ],
            "correctAnswer": "It allows valves to operate at very high RPM without mechanical failure",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_rotacion_rueda_vs_traccion():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si la velocidad de rotación del neumático excede la tracción disponible?",
            "answers": [
                "Se produce deslizamiento o 'wheelspin'",
                "El coche se vuelve más estable",
                "El alerón trasero pierde carga",
                "La suspensión se expande"
            ],
            "correctAnswer": "Se produce deslizamiento o 'wheelspin'",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if a tyre rotates faster than available traction?",
            "answers": [
                "Wheelspin occurs",
                "Car becomes more stable",
                "Rear wing loses downforce",
                "Suspension expands"
            ],
            "correctAnswer": "Wheelspin occurs",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_interaccion_diferencial():
    if LANG == "es":
        return {
            "question": "¿Cómo influye el diferencial en la física del paso por curva en un F1?",
            "answers": [
                "Modula la entrega de par a cada rueda trasera según el ángulo y tracción",
                "Controla la inclinación de la carrocería",
                "Determina la distribución de freno delantera",
                "Activa el sistema híbrido"
            ],
            "correctAnswer": "Modula la entrega de par a cada rueda trasera según el ángulo y tracción",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does the differential affect cornering physics in an F1 car?",
            "answers": [
                "It modulates torque delivery to each rear wheel based on angle and traction",
                "It controls body roll",
                "It determines front brake balance",
                "It activates the hybrid system"
            ],
            "correctAnswer": "It modulates torque delivery to each rear wheel based on angle and traction",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_transferencia_calor_frenado():
    if LANG == "es":
        return {
            "question": "¿Cuál es el principal mecanismo de transferencia de calor en los discos de freno de F1?",
            "answers": [
                "Conducción y convección",
                "Radiación térmica directa",
                "Evaporación del líquido de frenos",
                "Compresión de gases"
            ],
            "correctAnswer": "Conducción y convección",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main heat transfer mechanism in F1 brake discs?",
            "answers": [
                "Conduction and convection",
                "Direct thermal radiation",
                "Brake fluid evaporation",
                "Gas compression"
            ],
            "correctAnswer": "Conduction and convection",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_neumaticos_temperatura_distribucion():
    if LANG == "es":
        return {
            "question": "¿Qué efecto tiene una distribución desigual de temperatura en los neumáticos?",
            "answers": [
                "Reduce el agarre y genera desgaste irregular",
                "Mejora el paso por curva",
                "Aumenta el drag aerodinámico",
                "Incrementa la carga vertical"
            ],
            "correctAnswer": "Reduce el agarre y genera desgaste irregular",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the effect of uneven tyre temperature distribution?",
            "answers": [
                "Reduces grip and causes irregular wear",
                "Improves cornering",
                "Increases aerodynamic drag",
                "Increases vertical load"
            ],
            "correctAnswer": "Reduces grip and causes irregular wear",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_rigidez_torsional_chasis():
    if LANG == "es":
        return {
            "question": "¿Por qué es importante la rigidez torsional del chasis en un coche de F1?",
            "answers": [
                "Permite que la suspensión funcione con precisión sin deformaciones estructurales",
                "Incrementa la masa total del coche",
                "Reduce el rozamiento interno del motor",
                "Aumenta la altura del coche"
            ],
            "correctAnswer": "Permite que la suspensión funcione con precisión sin deformaciones estructurales",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why is chassis torsional stiffness important in an F1 car?",
            "answers": [
                "It allows the suspension to operate precisely without structural flex",
                "It increases the car's total mass",
                "It reduces engine internal friction",
                "It increases the car's ride height"
            ],
            "correctAnswer": "It allows the suspension to operate precisely without structural flex",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_valvula_descarga_turbo():
    if LANG == "es":
        return {
            "question": "¿Qué función cumple la válvula de descarga (wastegate) en un sistema turbo?",
            "answers": [
                "Regula la presión de sobrealimentación evitando exceso de presión",
                "Aumenta el sonido del motor",
                "Mantiene el flujo de aceite al turbo",
                "Desvía aire a los frenos"
            ],
            "correctAnswer": "Regula la presión de sobrealimentación evitando exceso de presión",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the purpose of the wastegate valve in a turbo system?",
            "answers": [
                "It regulates boost pressure and prevents overpressure",
                "It increases engine sound",
                "It keeps oil flow to the turbo",
                "It channels air to the brakes"
            ],
            "correctAnswer": "It regulates boost pressure and prevents overpressure",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_pendulo_invertido():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre si el centro de gravedad de un coche de F1 está demasiado alto?",
            "answers": [
                "Aumenta la inestabilidad en cambios de dirección",
                "Mejora la aceleración en recta",
                "Reduce la temperatura de los frenos",
                "Aumenta el flujo por el difusor"
            ],
            "correctAnswer": "Aumenta la inestabilidad en cambios de dirección",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if an F1 car's center of gravity is too high?",
            "answers": [
                "It increases instability during direction changes",
                "It improves straight-line acceleration",
                "It lowers brake temperature",
                "It increases diffuser airflow"
            ],
            "correctAnswer": "It increases instability during direction changes",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_giro_volante_vs_rotacion():
    if LANG == "es":
        return {
            "question": "¿Qué sucede si el piloto gira el volante más de lo que permite la adherencia disponible?",
            "answers": [
                "Se genera subviraje por pérdida de agarre frontal",
                "Se produce sobreviraje inmediato",
                "El coche frena automáticamente",
                "Se activa el sistema DRS"
            ],
            "correctAnswer": "Se genera subviraje por pérdida de agarre frontal",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens if the driver turns the steering wheel beyond available grip?",
            "answers": [
                "Understeer occurs due to front grip loss",
                "Oversteer immediately happens",
                "Car brakes automatically",
                "DRS is activated"
            ],
            "correctAnswer": "Understeer occurs due to front grip loss",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_mguh_funcion():
    if LANG == "es":
        return {
            "question": "¿Qué función física realiza el MGU-H en la unidad de potencia de F1?",
            "answers": [
                "Convierte energía térmica de los gases de escape en energía eléctrica",
                "Convierte el giro del cigüeñal en fuerza de tracción directa",
                "Regula la presión del turbo",
                "Disipa el calor del motor"
            ],
            "correctAnswer": "Convierte energía térmica de los gases de escape en energía eléctrica",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical role does the MGU-H play in the F1 power unit?",
            "answers": [
                "It converts thermal energy from exhaust gases into electrical energy",
                "It converts crankshaft rotation into direct traction",
                "It regulates turbo pressure",
                "It dissipates engine heat"
            ],
            "correctAnswer": "It converts thermal energy from exhaust gases into electrical energy",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_suspension_antidive():
    if LANG == "es":
        return {
            "question": "¿Qué logra un sistema de suspensión con geometría anti-dive en F1?",
            "answers": [
                "Reduce el hundimiento del morro al frenar",
                "Aumenta el rebote sobre pianos",
                "Permite frenar solo con el eje trasero",
                "Evita el uso de alerones móviles"
            ],
            "correctAnswer": "Reduce el hundimiento del morro al frenar",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does an anti-dive suspension geometry achieve in F1?",
            "answers": [
                "It reduces front-end dive under braking",
                "It increases bounce over kerbs",
                "It allows rear-only braking",
                "It disables movable aero"
            ],
            "correctAnswer": "It reduces front-end dive under braking",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_coeficiente_aerodinamico():
    if LANG == "es":
        return {
            "question": "¿Qué indica el coeficiente aerodinámico (Cd) de un coche de F1?",
            "answers": [
                "El grado de resistencia del coche al aire",
                "La cantidad de carga generada por el difusor",
                "La eficiencia térmica del motor",
                "El balance de frenos entre ejes"
            ],
            "correctAnswer": "El grado de resistencia del coche al aire",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the aerodynamic coefficient (Cd) of an F1 car indicate?",
            "answers": [
                "The degree of the car's resistance to air",
                "The downforce from the diffuser",
                "The engine's thermal efficiency",
                "The brake balance between axles"
            ],
            "correctAnswer": "The degree of the car's resistance to air",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_velocidad_entrada_curva():
    if LANG == "es":
        return {
            "question": "¿Qué parámetro físico condiciona principalmente la velocidad de entrada en curva?",
            "answers": [
                "La adherencia disponible en el eje delantero",
                "La rigidez torsional del volante",
                "La presión de combustible",
                "El tipo de diferencial usado"
            ],
            "correctAnswer": "La adherencia disponible en el eje delantero",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical parameter mainly limits entry speed into a corner?",
            "answers": [
                "Available grip on the front axle",
                "Torsional stiffness of the steering wheel",
                "Fuel pressure",
                "Differential type used"
            ],
            "correctAnswer": "Available grip on the front axle",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_calculo_downforce_area_velocidad():
    if LANG == "es":
        return {
            "question": "¿Qué ocurre con la carga aerodinámica si se duplica la velocidad manteniendo constante el área frontal?",
            "answers": [
                "Se cuadruplica",
                "Se mantiene igual",
                "Se reduce a la mitad",
                "Se duplica"
            ],
            "correctAnswer": "Se cuadruplica",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What happens to aerodynamic downforce if speed doubles and frontal area remains constant?",
            "answers": [
                "It quadruples",
                "It stays the same",
                "It halves",
                "It doubles"
            ],
            "correctAnswer": "It quadruples",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_resonancia_suspension():
    if LANG == "es":
        return {
            "question": "¿Qué puede causar un fenómeno de resonancia en la suspensión de un coche de F1?",
            "answers": [
                "Fuerzas oscilantes a frecuencias cercanas a la frecuencia natural del sistema",
                "Cambios bruscos en la relación de marchas",
                "Exceso de temperatura en el diferencial",
                "Frenado con carga lateral"
            ],
            "correctAnswer": "Fuerzas oscilantes a frecuencias cercanas a la frecuencia natural del sistema",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can cause a resonance phenomenon in an F1 suspension system?",
            "answers": [
                "Oscillating forces near the system’s natural frequency",
                "Sudden gear changes",
                "Excess temperature in the differential",
                "Braking under lateral load"
            ],
            "correctAnswer": "Oscillating forces near the system’s natural frequency",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_forma_difusor_presion():
    if LANG == "es":
        return {
            "question": "¿Cómo afecta el diseño del difusor trasero a la presión del flujo de aire bajo el coche?",
            "answers": [
                "Disminuye la presión, generando más carga aerodinámica",
                "Aumenta la presión para mayor refrigeración",
                "Estabiliza el flujo por encima del alerón",
                "No tiene efecto directo en la presión"
            ],
            "correctAnswer": "Disminuye la presión, generando más carga aerodinámica",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does the rear diffuser design affect air pressure beneath an F1 car?",
            "answers": [
                "It decreases pressure, generating more downforce",
                "It increases pressure for better cooling",
                "It stabilizes flow above the rear wing",
                "It has no direct pressure effect"
            ],
            "correctAnswer": "It decreases pressure, generating more downforce",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_masa_no_suspendida():
    if LANG == "es":
        return {
            "question": "¿Cómo afecta un aumento en la masa no suspendida al comportamiento dinámico del coche?",
            "answers": [
                "Reduce la capacidad de respuesta de la suspensión",
                "Mejora la tracción en línea recta",
                "Aumenta el balanceo del chasis",
                "Reduce la rigidez estructural del alerón"
            ],
            "correctAnswer": "Reduce la capacidad de respuesta de la suspensión",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does increased unsprung mass affect vehicle dynamics?",
            "answers": [
                "It reduces suspension responsiveness",
                "It improves straight-line traction",
                "It increases chassis roll",
                "It weakens rear wing stiffness"
            ],
            "correctAnswer": "It reduces suspension responsiveness",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_energia_kinetica_colision():
    if LANG == "es":
        return {
            "question": "¿Qué forma de energía disipa un coche en una colisión a alta velocidad?",
            "answers": [
                "Energía cinética convertida en calor, deformación y sonido",
                "Energía potencial en forma de rebote",
                "Energía eléctrica almacenada en el MGU-K",
                "Energía rotacional del volante"
            ],
            "correctAnswer": "Energía cinética convertida en calor, deformación y sonido",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What form of energy is dissipated in a high-speed F1 crash?",
            "answers": [
                "Kinetic energy converted into heat, deformation and sound",
                "Potential energy as rebound",
                "Electric energy stored in MGU-K",
                "Rotational energy from steering"
            ],
            "correctAnswer": "Kinetic energy converted into heat, deformation and sound",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_galeria_venturi_cuello():
    if LANG == "es":
        return {
            "question": "¿Cuál es el propósito del estrechamiento (cuello) en una galería Venturi bajo el suelo del coche?",
            "answers": [
                "Aumentar la velocidad del flujo y reducir la presión",
                "Disminuir la velocidad del aire y generar carga frontal",
                "Reducir el drag aerodinámico de la parte trasera",
                "Evitar la cavitación en el difusor"
            ],
            "correctAnswer": "Aumentar la velocidad del flujo y reducir la presión",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the purpose of the throat in a Venturi tunnel under the F1 floor?",
            "answers": [
                "To increase airflow speed and reduce pressure",
                "To slow down air for front downforce",
                "To reduce rear aerodynamic drag",
                "To prevent diffuser cavitation"
            ],
            "correctAnswer": "To increase airflow speed and reduce pressure",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_interferencia_turbulencia_ruedas():
    if LANG == "es":
        return {
            "question": "¿Qué provoca la turbulencia generada por las ruedas delanteras?",
            "answers": [
                "Afecta negativamente al flujo aerodinámico hacia el suelo y el difusor",
                "Mejora la eficiencia del DRS",
                "Aumenta el rendimiento del ERS",
                "Genera fuerza centrífuga útil en curva"
            ],
            "correctAnswer": "Afecta negativamente al flujo aerodinámico hacia el suelo y el difusor",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What effect does turbulence from front wheels have?",
            "answers": [
                "It negatively affects airflow to the floor and diffuser",
                "It improves DRS efficiency",
                "It boosts ERS performance",
                "It generates useful cornering centrifugal force"
            ],
            "correctAnswer": "It negatively affects airflow to the floor and diffuser",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_resistencia_cinetica_lineal():
    if LANG == "es":
        return {
            "question": "¿Cuál de estos factores no contribuye directamente a la resistencia cinética de un coche en recta?",
            "answers": [
                "Altura del centro de masas",
                "Coeficiente de drag",
                "Área frontal",
                "Densidad del aire"
            ],
            "correctAnswer": "Altura del centro de masas",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which factor does not directly affect the kinetic resistance of a car in a straight line?",
            "answers": [
                "Height of center of mass",
                "Drag coefficient",
                "Frontal area",
                "Air density"
            ],
            "correctAnswer": "Height of center of mass",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_paso_piano_alto():
    if LANG == "es":
        return {
            "question": "¿Qué impacto físico tiene pasar sobre un piano alto a alta velocidad?",
            "answers": [
                "Desestabiliza el coche por liberación momentánea de carga aerodinámica",
                "Aumenta la tracción por compresión de la suspensión",
                "Activa el sistema de recuperación de energía",
                "Reduce la presión en el difusor"
            ],
            "correctAnswer": "Desestabiliza el coche por liberación momentánea de carga aerodinámica",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the physical effect of running over a high kerb at speed?",
            "answers": [
                "It destabilizes the car by momentarily releasing aerodynamic load",
                "It increases traction by compressing suspension",
                "It activates the energy recovery system",
                "It reduces diffuser pressure"
            ],
            "correctAnswer": "It destabilizes the car by momentarily releasing aerodynamic load",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_interaccion_ers_traccion():
    if LANG == "es":
        return {
            "question": "¿Cómo puede afectar una entrega excesiva del MGU-K a la tracción del coche?",
            "answers": [
                "Puede provocar pérdida de adherencia trasera y sobreviraje",
                "Mejora la carga en el eje delantero",
                "Activa el DRS en curva",
                "Recalienta los frenos delanteros"
            ],
            "correctAnswer": "Puede provocar pérdida de adherencia trasera y sobreviraje",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How can excessive MGU-K deployment affect traction?",
            "answers": [
                "It may cause rear grip loss and oversteer",
                "It improves front axle load",
                "It activates DRS mid-corner",
                "It overheats front brakes"
            ],
            "correctAnswer": "It may cause rear grip loss and oversteer",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_microoscillaciones_drs():
    if LANG == "es":
        return {
            "question": "¿Qué efecto negativo pueden tener microoscilaciones del alerón trasero cuando el DRS está abierto?",
            "answers": [
                "Generar flujo turbulento y reducir estabilidad a alta velocidad",
                "Aumentar la presión sobre el eje delantero",
                "Reducir la eficiencia térmica del motor",
                "Bloquear el flujo de gases del escape"
            ],
            "correctAnswer": "Generar flujo turbulento y reducir estabilidad a alta velocidad",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What negative effect can micro-oscillations of the rear wing have with DRS open?",
            "answers": [
                "Generate turbulent airflow and reduce high-speed stability",
                "Increase pressure on the front axle",
                "Lower the engine’s thermal efficiency",
                "Block exhaust airflow"
            ],
            "correctAnswer": "Generate turbulent airflow and reduce high-speed stability",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_distribucion_masas_lateral():
    if LANG == "es":
        return {
            "question": "¿Por qué es importante la simetría en la distribución de masas izquierda-derecha en F1?",
            "answers": [
                "Evita desequilibrio de fuerzas centrífugas en curva",
                "Mejora la aceleración en rectas",
                "Evita el bloqueo del diferencial",
                "Optimiza la presión aerodinámica del alerón trasero"
            ],
            "correctAnswer": "Evita desequilibrio de fuerzas centrífugas en curva",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why is left-right mass distribution symmetry important in F1?",
            "answers": [
                "It prevents imbalance of centrifugal forces in corners",
                "It improves straight-line acceleration",
                "It prevents differential lock",
                "It optimizes rear wing downforce"
            ],
            "correctAnswer": "It prevents imbalance of centrifugal forces in corners",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_asimetria_temperatura_frenos():
    if LANG == "es":
        return {
            "question": "¿Qué podría indicar una diferencia persistente de temperatura entre frenos delanteros?",
            "answers": [
                "Desbalance de distribución de frenado o conducción asimétrica",
                "Exceso de carga aerodinámica frontal",
                "Pérdida de presión de aceite",
                "Fallo en el diferencial trasero"
            ],
            "correctAnswer": "Desbalance de distribución de frenado o conducción asimétrica",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What could a persistent temperature difference between front brakes indicate?",
            "answers": [
                "Brake bias imbalance or asymmetrical driving",
                "Excess front aerodynamic load",
                "Oil pressure loss",
                "Rear differential failure"
            ],
            "correctAnswer": "Brake bias imbalance or asymmetrical driving",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_direccionalidad_neumatico():
    if LANG == "es":
        return {
            "question": "¿Cómo influye el diseño direccional del dibujo del neumático intermedio o de lluvia?",
            "answers": [
                "Canaliza el agua hacia fuera para mantener contacto con el asfalto",
                "Reduce el desgaste interno del compuesto",
                "Aumenta la carga aerodinámica generada por el coche",
                "Evita el efecto suelo en frenada"
            ],
            "correctAnswer": "Canaliza el agua hacia fuera para mantener contacto con el asfalto",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does directional tread design affect intermediate or wet tyres?",
            "answers": [
                "It channels water outward to maintain contact with asphalt",
                "It reduces internal compound wear",
                "It increases the car’s aerodynamic load",
                "It avoids ground effect during braking"
            ],
            "correctAnswer": "It channels water outward to maintain contact with asphalt",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_energia_vibraciones_motor():
    if LANG == "es":
        return {
            "question": "¿Qué consecuencia física puede tener la vibración armónica del cigüeñal a altas RPM?",
            "answers": [
                "Fatiga estructural del motor y riesgo de rotura",
                "Desalineación de los ejes de transmisión",
                "Sobrecalentamiento de los frenos",
                "Activación del sistema ERS"
            ],
            "correctAnswer": "Fatiga estructural del motor y riesgo de rotura",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical effect can harmonic crankshaft vibration cause at high RPM?",
            "answers": [
                "Structural engine fatigue and risk of failure",
                "Transmission shaft misalignment",
                "Brake overheating",
                "ERS activation"
            ],
            "correctAnswer": "Structural engine fatigue and risk of failure",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_expansion_neumatica_frenado():
    if LANG == "es":
        return {
            "question": "¿Qué fenómeno físico puede causar la expansión del neumático durante una frenada intensa?",
            "answers": [
                "Aumento de temperatura y presión interna",
                "Contracción del compuesto por fuerzas centrífugas",
                "Reducción de la rigidez del asfalto",
                "Descompresión del sistema hidráulico"
            ],
            "correctAnswer": "Aumento de temperatura y presión interna",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical phenomenon can cause tyre expansion during heavy braking?",
            "answers": [
                "Increase in temperature and internal pressure",
                "Compound contraction due to centrifugal forces",
                "Reduced asphalt stiffness",
                "Hydraulic system decompression"
            ],
            "correctAnswer": "Increase in temperature and internal pressure",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_velocidad_corte_frenado():
    if LANG == "es":
        return {
            "question": "¿Qué define la velocidad límite para evitar el bloqueo al frenar sin ABS?",
            "answers": [
                "Coeficiente de fricción entre neumático y asfalto",
                "Presión del circuito de frenos",
                "Altura del centro de masas",
                "Presión aerodinámica generada por el alerón delantero"
            ],
            "correctAnswer": "Coeficiente de fricción entre neumático y asfalto",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What defines the threshold speed to avoid locking up when braking without ABS?",
            "answers": [
                "Friction coefficient between tyre and asphalt",
                "Brake system pressure",
                "Center of mass height",
                "Downforce from front wing"
            ],
            "correctAnswer": "Friction coefficient between tyre and asphalt",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_efecto_lift_off():
    if LANG == "es":
        return {
            "question": "¿Qué efecto físico genera el 'lift-off oversteer' en un F1?",
            "answers": [
                "Transferencia brusca de peso al eje delantero que provoca pérdida de adherencia trasera",
                "Reducción de la compresión de los neumáticos delanteros",
                "Desactivación del ERS en curva",
                "Mejora de la tracción al soltar gas"
            ],
            "correctAnswer": "Transferencia brusca de peso al eje delantero que provoca pérdida de adherencia trasera",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical effect causes 'lift-off oversteer' in an F1 car?",
            "answers": [
                "Sudden weight transfer to front axle causing rear grip loss",
                "Reduction in front tyre compression",
                "ERS deactivation mid-corner",
                "Improved traction on throttle lift"
            ],
            "correctAnswer": "Sudden weight transfer to front axle causing rear grip loss",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_asimetria_alerones():
    if LANG == "es":
        return {
            "question": "¿Qué podría justificar un alerón trasero con carga asimétrica entre lados izquierdo y derecho?",
            "answers": [
                "Compensar asimetría de curvas predominantes en un circuito",
                "Disminuir la velocidad punta en recta",
                "Mejorar la refrigeración de los frenos delanteros",
                "Estabilizar el centro de gravedad longitudinal"
            ],
            "correctAnswer": "Compensar asimetría de curvas predominantes en un circuito",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What might justify a rear wing with asymmetric downforce between left and right?",
            "answers": [
                "To compensate for dominant corner direction on the circuit",
                "To reduce top speed on straights",
                "To improve front brake cooling",
                "To stabilize longitudinal center of gravity"
            ],
            "correctAnswer": "To compensate for dominant corner direction on the circuit",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_poder_reflexivo_asfalto():
    if LANG == "es":
        return {
            "question": "¿Qué propiedad física del asfalto puede afectar la temperatura de los neumáticos?",
            "answers": [
                "Su poder absorbente o reflexivo frente a la radiación solar",
                "Su contenido de humedad residual",
                "La elasticidad estructural del alquitrán",
                "La conductividad magnética del sustrato"
            ],
            "correctAnswer": "Su poder absorbente o reflexivo frente a la radiación solar",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical property of asphalt can affect tyre temperature?",
            "answers": [
                "Its absorbent or reflective power to solar radiation",
                "Its residual moisture content",
                "The structural elasticity of tar",
                "The magnetic conductivity of the substrate"
            ],
            "correctAnswer": "Its absorbent or reflective power to solar radiation",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_graining_definicion():
    if LANG == "es":
        return {
            "question": "¿Qué es el 'graining' en un neumático de F1?",
            "answers": [
                "Acumulación de goma que reduce el contacto con la pista",
                "Rotura total del neumático por sobrecalentamiento",
                "Desgaste uniforme del flanco interno",
                "Fallo estructural en la carcasa"
            ],
            "correctAnswer": "Acumulación de goma que reduce el contacto con la pista",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is 'graining' in an F1 tyre?",
            "answers": [
                "Rubber build-up that reduces contact with the track",
                "Complete tyre failure due to overheating",
                "Uniform wear of the inner sidewall",
                "Structural failure in the casing"
            ],
            "correctAnswer": "Rubber build-up that reduces contact with the track",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_blasting_neumatico():
    if LANG == "es":
        return {
            "question": "¿Qué fenómeno ocurre cuando el neumático entra en 'blistering'?",
            "answers": [
                "Se generan burbujas internas por exceso de temperatura",
                "Se desgasta irregularmente por exceso de carga lateral",
                "Se agrieta el flanco exterior por envejecimiento",
                "Se produce una pérdida inmediata de presión"
            ],
            "correctAnswer": "Se generan burbujas internas por exceso de temperatura",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What occurs when an F1 tyre suffers 'blistering'?",
            "answers": [
                "Internal bubbles form due to overheating",
                "Irregular wear from excessive lateral load",
                "Outer sidewall cracking from aging",
                "Immediate pressure loss"
            ],
            "correctAnswer": "Internal bubbles form due to overheating",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_impacto_pinchazo_velocidad():
    if LANG == "es":
        return {
            "question": "¿Cuál es el principal riesgo de un pinchazo a alta velocidad en F1?",
            "answers": [
                "Pérdida inmediata de apoyo aerodinámico y estabilidad",
                "Reducción progresiva del efecto suelo",
                "Desactivación del sistema híbrido",
                "Aumento del drag frontal"
            ],
            "correctAnswer": "Pérdida inmediata de apoyo aerodinámico y estabilidad",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main risk of a high-speed puncture in F1?",
            "answers": [
                "Immediate loss of aerodynamic support and stability",
                "Gradual reduction of ground effect",
                "Hybrid system deactivation",
                "Increase in frontal drag"
            ],
            "correctAnswer": "Immediate loss of aerodynamic support and stability",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_desgaste_neumatico_traccion():
    if LANG == "es":
        return {
            "question": "¿Qué causa un mayor desgaste de los neumáticos traseros en tracción?",
            "answers": [
                "Exceso de par al salir de curva",
                "Subviraje constante",
                "Frenadas largas con transferencia frontal",
                "Mayor presión en neumáticos delanteros"
            ],
            "correctAnswer": "Exceso de par al salir de curva",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What causes increased rear tyre wear under traction?",
            "answers": [
                "Excess torque when exiting corners",
                "Constant understeer",
                "Long braking with front weight transfer",
                "Higher pressure in front tyres"
            ],
            "correctAnswer": "Excess torque when exiting corners",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_funcion_difusor():
    if LANG == "es":
        return {
            "question": "¿Cuál es la función del difusor trasero en un coche de F1?",
            "answers": [
                "Acelerar el flujo de aire y generar carga aerodinámica reduciendo presión",
                "Aumentar la resistencia al avance para mayor frenado",
                "Distribuir aire caliente de los frenos",
                "Reducir el coeficiente de rozamiento de los neumáticos"
            ],
            "correctAnswer": "Acelerar el flujo de aire y generar carga aerodinámica reduciendo presión",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the function of the rear diffuser in an F1 car?",
            "answers": [
                "Accelerate airflow and generate downforce by reducing pressure",
                "Increase drag to improve braking",
                "Distribute hot brake air",
                "Reduce tyre friction coefficient"
            ],
            "correctAnswer": "Accelerate airflow and generate downforce by reducing pressure",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_efecto_danio_aleron_trasero():
    if LANG == "es":
        return {
            "question": "¿Qué efecto físico puede tener un alerón trasero dañado en plena carrera?",
            "answers": [
                "Pérdida significativa de carga aerodinámica y sobreviraje en recta",
                "Incremento de temperatura en los neumáticos delanteros",
                "Reducción del drag y aumento de la velocidad punta",
                "Compensación con mayor fuerza del DRS"
            ],
            "correctAnswer": "Pérdida significativa de carga aerodinámica y sobreviraje en recta",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What physical effect can a damaged rear wing have during a race?",
            "answers": [
                "Significant loss of downforce and oversteer on straights",
                "Increased front tyre temperature",
                "Drag reduction and higher top speed",
                "Compensation via DRS boost"
            ],
            "correctAnswer": "Significant loss of downforce and oversteer on straights",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_objetivo_aleron_delantero():
    if LANG == "es":
        return {
            "question": "¿Cuál es el principal objetivo aerodinámico del alerón delantero?",
            "answers": [
                "Dirigir el flujo hacia los elementos aerodinámicos posteriores",
                "Frenar el coche en recta",
                "Reducir el efecto del MGU-K",
                "Refrigerar el sistema hidráulico"
            ],
            "correctAnswer": "Dirigir el flujo hacia los elementos aerodinámicos posteriores",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main aerodynamic purpose of the front wing?",
            "answers": [
                "To direct airflow toward downstream aero elements",
                "To slow the car down on straights",
                "To reduce MGU-K efficiency",
                "To cool the hydraulic system"
            ],
            "correctAnswer": "To direct airflow toward downstream aero elements",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_dano_lateral_neumatico():
    if LANG == "es":
        return {
            "question": "¿Qué puede causar un corte lateral en un neumático de F1?",
            "answers": [
                "Contacto con bordes de pianos agresivos o restos en pista",
                "Temperatura demasiado alta en los frenos",
                "Reducción del coeficiente de fricción longitudinal",
                "Fallo en el sistema de refrigeración"
            ],
            "correctAnswer": "Contacto con bordes de pianos agresivos o restos en pista",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can cause a sidewall cut in an F1 tyre?",
            "answers": [
                "Contact with aggressive kerbs or track debris",
                "Overheating brakes",
                "Reduced longitudinal friction",
                "Cooling system failure"
            ],
            "correctAnswer": "Contact with aggressive kerbs or track debris",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_presion_neumaticos_pinchar():
    if LANG == "es":
        return {
            "question": "¿Qué riesgo conlleva una presión de neumáticos demasiado baja en F1?",
            "answers": [
                "Mayor probabilidad de pinchazo y sobrecalentamiento",
                "Reducción de agarre en línea recta",
                "Aumento de la carga aerodinámica",
                "Actuación incorrecta del DRS"
            ],
            "correctAnswer": "Mayor probabilidad de pinchazo y sobrecalentamiento",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the risk of running tyre pressure too low in F1?",
            "answers": [
                "Higher risk of punctures and overheating",
                "Reduced straight-line grip",
                "Increased aerodynamic downforce",
                "Improper DRS activation"
            ],
            "correctAnswer": "Higher risk of punctures and overheating",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_desgaste_neumatico_curva():
    if LANG == "es":
        return {
            "question": "¿Qué parte del neumático se desgasta más en curvas de alta velocidad sostenida?",
            "answers": [
                "Flanco externo del neumático exterior",
                "Zona central del neumático interior",
                "Talón del neumático trasero",
                "Zona de contacto del eje delantero"
            ],
            "correctAnswer": "Flanco externo del neumático exterior",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which part of the tyre wears most in sustained high-speed corners?",
            "answers": [
                "Outer sidewall of the outside tyre",
                "Center zone of the inside tyre",
                "Rear tyre bead",
                "Front axle contact patch"
            ],
            "correctAnswer": "Outer sidewall of the outside tyre",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_caja_cambios_velocidad():
    if LANG == "es":
        return {
            "question": "¿Qué función tiene la caja de cambios en un coche de F1?",
            "answers": [
                "Adaptar la entrega de potencia del motor a distintas velocidades",
                "Refrigerar el sistema híbrido",
                "Regular la presión de los neumáticos",
                "Controlar el flujo aerodinámico de los pontones"
            ],
            "correctAnswer": "Adaptar la entrega de potencia del motor a distintas velocidades",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the function of the gearbox in an F1 car?",
            "answers": [
                "To adapt engine power delivery at different speeds",
                "To cool the hybrid system",
                "To regulate tyre pressure",
                "To control pontoon aerodynamic flow"
            ],
            "correctAnswer": "To adapt engine power delivery at different speeds",
            "knowledgeLevel": 1,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_piston_motor_funcion():
    if LANG == "es":
        return {
            "question": "¿Cuál es la función principal de un pistón en el motor de un F1?",
            "answers": [
                "Convertir presión de combustión en movimiento lineal",
                "Generar la chispa de encendido",
                "Reducir la temperatura del aceite",
                "Regular la entrada de aire al turbo"
            ],
            "correctAnswer": "Convertir presión de combustión en movimiento lineal",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the primary function of a piston in an F1 engine?",
            "answers": [
                "To convert combustion pressure into linear motion",
                "To generate ignition spark",
                "To reduce oil temperature",
                "To regulate air intake to the turbo"
            ],
            "correctAnswer": "To convert combustion pressure into linear motion",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_componentes_motor_principales():
    if LANG == "es":
        return {
            "question": "¿Qué conjunto de componentes forman parte del sistema híbrido de potencia en F1?",
            "answers": [
                "MGU-K, MGU-H, batería y unidad de control electrónico",
                "Turbo, caja de cambios, radiador y escape",
                "Difusor, alerón delantero, pontones y fondo plano",
                "Compresor, pistones, árbol de levas y ERS"
            ],
            "correctAnswer": "MGU-K, MGU-H, batería y unidad de control electrónico",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which set of components are part of the F1 hybrid power unit?",
            "answers": [
                "MGU-K, MGU-H, battery and electronic control unit",
                "Turbo, gearbox, radiator and exhaust",
                "Diffuser, front wing, sidepods and floor",
                "Compressor, pistons, camshaft and ERS"
            ],
            "correctAnswer": "MGU-K, MGU-H, battery and electronic control unit",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_funcion_pontones():
    if LANG == "es":
        return {
            "question": "¿Cuál es el objetivo principal de los pontones laterales en un F1?",
            "answers": [
                "Canalizar el flujo de aire para refrigerar los radiadores",
                "Generar sustentación y elevar el coche",
                "Aumentar la rigidez estructural del alerón trasero",
                "Reducir la vibración del volante"
            ],
            "correctAnswer": "Canalizar el flujo de aire para refrigerar los radiadores",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main purpose of the sidepods in an F1 car?",
            "answers": [
                "To channel airflow to cool the radiators",
                "To generate lift and raise the car",
                "To increase rear wing structural rigidity",
                "To reduce steering wheel vibration"
            ],
            "correctAnswer": "To channel airflow to cool the radiators",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_grip_mecanico():
    if LANG == "es":
        return {
            "question": "¿Qué se entiende por 'grip mecánico' en F1?",
            "answers": [
                "Adherencia generada por la suspensión y neumáticos, no por aerodinámica",
                "Fuerza vertical del alerón trasero",
                "Control electrónico del diferencial",
                "Nivel de resistencia al avance en recta"
            ],
            "correctAnswer": "Adherencia generada por la suspensión y neumáticos, no por aerodinámica",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is 'mechanical grip' in F1?",
            "answers": [
                "Grip generated by suspension and tyres, not by aero",
                "Vertical force from the rear wing",
                "Electronic control of the differential",
                "Straight-line drag level"
            ],
            "correctAnswer": "Grip generated by suspension and tyres, not by aero",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_suspension_objetivo():
    if LANG == "es":
        return {
            "question": "¿Cuál es uno de los objetivos clave del sistema de suspensión en un coche de F1?",
            "answers": [
                "Mantener el máximo contacto del neumático con el asfalto",
                "Reducir la presión del sistema de frenos",
                "Aumentar el rebote del coche en pianos",
                "Disminuir el efecto del DRS"
            ],
            "correctAnswer": "Mantener el máximo contacto del neumático con el asfalto",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is a key objective of the suspension system in an F1 car?",
            "answers": [
                "Maintain maximum tyre contact with the asphalt",
                "Reduce brake system pressure",
                "Increase car bounce over kerbs",
                "Decrease DRS effectiveness"
            ],
            "correctAnswer": "Maintain maximum tyre contact with the asphalt",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_drs_funcion():
    if LANG == "es":
        return {
            "question": "¿Cuál es el propósito del DRS en un coche de F1?",
            "answers": [
                "Reducir la resistencia aerodinámica para facilitar adelantamientos",
                "Aumentar la carga aerodinámica en curva",
                "Mejorar la tracción al salir de curva",
                "Enfriar los neumáticos en rectas"
            ],
            "correctAnswer": "Reducir la resistencia aerodinámica para facilitar adelantamientos",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the purpose of DRS in an F1 car?",
            "answers": [
                "Reduce aerodynamic drag to aid overtaking",
                "Increase downforce in corners",
                "Improve traction on corner exit",
                "Cool the tyres on straights"
            ],
            "correctAnswer": "Reduce aerodynamic drag to aid overtaking",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_diferencia_blandos_medios_duros():
    if LANG == "es":
        return {
            "question": "¿Qué diferencia física principal existe entre neumáticos blandos, medios y duros?",
            "answers": [
                "El nivel de agarre y la velocidad de degradación del compuesto",
                "La presión mínima obligatoria",
                "La forma del dibujo de la banda",
                "El peso total del neumático"
            ],
            "correctAnswer": "El nivel de agarre y la velocidad de degradación del compuesto",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main physical difference between soft, medium and hard tyres?",
            "answers": [
                "Grip level and compound degradation rate",
                "Minimum mandatory pressure",
                "Tread pattern shape",
                "Total tyre weight"
            ],
            "correctAnswer": "Grip level and compound degradation rate",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_blandos_agarre():
    if LANG == "es":
        return {
            "question": "¿Por qué un neumático blando ofrece más agarre que uno duro?",
            "answers": [
                "El compuesto más blando se adapta mejor a las irregularidades del asfalto",
                "Tiene más superficie de contacto real",
                "Tiene menor diámetro de rodadura",
                "Se infla a mayor presión"
            ],
            "correctAnswer": "El compuesto más blando se adapta mejor a las irregularidades del asfalto",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why does a soft tyre provide more grip than a hard one?",
            "answers": [
                "Softer compound adapts better to surface imperfections",
                "It has greater real contact surface",
                "It has smaller rolling diameter",
                "It is inflated to higher pressure"
            ],
            "correctAnswer": "Softer compound adapts better to surface imperfections",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_duros_ventaja():
    if LANG == "es":
        return {
            "question": "¿Cuál es la principal ventaja de un neumático duro frente a uno blando?",
            "answers": [
                "Menor degradación a lo largo de más vueltas",
                "Mayor capacidad de refrigeración",
                "Mejor rendimiento en lluvia",
                "Mayor velocidad punta"
            ],
            "correctAnswer": "Menor degradación a lo largo de más vueltas",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main advantage of a hard tyre over a soft one?",
            "answers": [
                "Lower degradation over more laps",
                "Better cooling capacity",
                "Better wet performance",
                "Higher top speed"
            ],
            "correctAnswer": "Lower degradation over more laps",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_estructura_monocasco():
    if LANG == "es":
        return {
            "question": "¿Cuál es la función estructural del monocasco en un monoplaza de F1?",
            "answers": [
                "Proteger al piloto y ser la base estructural del coche",
                "Refrigerar el motor y la transmisión",
                "Aumentar la carga aerodinámica",
                "Reducir el peso de los alerones"
            ],
            "correctAnswer": "Proteger al piloto y ser la base estructural del coche",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the structural function of the monocoque in an F1 car?",
            "answers": [
                "Protect the driver and serve as the structural base of the car",
                "Cool the engine and transmission",
                "Increase aerodynamic downforce",
                "Reduce wing weight"
            ],
            "correctAnswer": "Protect the driver and serve as the structural base of the car",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_volante_multifuncion():
    if LANG == "es":
        return {
            "question": "¿Qué permite el volante multifunción de un coche de F1?",
            "answers": [
                "Controlar parámetros como diferencial, mezcla de combustible y despliegue del ERS",
                "Ajustar la presión de los neumáticos en carrera",
                "Modificar el diseño de los pontones",
                "Cambiar la relación de compresión del motor"
            ],
            "correctAnswer": "Controlar parámetros como diferencial, mezcla de combustible y despliegue del ERS",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can the multifunction steering wheel of an F1 car control?",
            "answers": [
                "Differential, fuel mixture and ERS deployment settings",
                "Tyre pressure during a race",
                "Sidepod geometry",
                "Engine compression ratio"
            ],
            "correctAnswer": "Differential, fuel mixture and ERS deployment settings",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_camara_onboard():
    if LANG == "es":
        return {
            "question": "¿Cuál es el propósito físico de la posición elevada de la cámara onboard en F1?",
            "answers": [
                "Ofrecer visibilidad alineada al centro de masas y aerodinámicamente neutra",
                "Controlar el ángulo del DRS en curva",
                "Reducir el centro de gravedad del chasis",
                "Aumentar el flujo de aire al difusor"
            ],
            "correctAnswer": "Ofrecer visibilidad alineada al centro de masas y aerodinámicamente neutra",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the physical purpose of the high onboard camera position in F1?",
            "answers": [
                "To provide view aligned with center of mass and aerodynamic neutrality",
                "To control DRS angle in corners",
                "To lower chassis center of gravity",
                "To increase airflow to the diffuser"
            ],
            "correctAnswer": "To provide view aligned with center of mass and aerodynamic neutrality",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_sistema_frenado_dos_circuitos():
    if LANG == "es":
        return {
            "question": "¿Por qué un coche de F1 utiliza un sistema de frenos de doble circuito?",
            "answers": [
                "Para mantener frenado parcial si falla un eje",
                "Para enfriar los discos traseros",
                "Para alinear la dirección en rectas",
                "Para aumentar el torque en curvas"
            ],
            "correctAnswer": "Para mantener frenado parcial si falla un eje",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why does an F1 car use a dual-circuit brake system?",
            "answers": [
                "To maintain partial braking if one axle fails",
                "To cool the rear discs",
                "To align steering on straights",
                "To increase torque in corners"
            ],
            "correctAnswer": "To maintain partial braking if one axle fails",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_estructura_crashbox():
    if LANG == "es":
        return {
            "question": "¿Cuál es la función de la estructura 'crashbox' delantera?",
            "answers": [
                "Absorber la energía de impacto y proteger el monocasco",
                "Aumentar la rigidez del eje delantero",
                "Reflejar el aire hacia los frenos",
                "Sujetar el sistema DRS"
            ],
            "correctAnswer": "Absorber la energía de impacto y proteger el monocasco",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the function of the front crashbox structure?",
            "answers": [
                "Absorb impact energy and protect the monocoque",
                "Increase front axle rigidity",
                "Redirect air to the brakes",
                "Hold the DRS system"
            ],
            "correctAnswer": "Absorb impact energy and protect the monocoque",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_refrigeracion_intercooler():
    if LANG == "es":
        return {
            "question": "¿Cuál es la función del intercooler en un coche de F1?",
            "answers": [
                "Reducir la temperatura del aire comprimido antes de entrar al motor",
                "Enfriar los neumáticos traseros en condiciones de lluvia",
                "Regular el flujo de aceite del sistema hidráulico",
                "Evitar la vibración del cigüeñal"
            ],
            "correctAnswer": "Reducir la temperatura del aire comprimido antes de entrar al motor",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the function of the intercooler in an F1 car?",
            "answers": [
                "To reduce the temperature of compressed air before it enters the engine",
                "To cool the rear tyres in wet conditions",
                "To regulate oil flow in the hydraulic system",
                "To prevent crankshaft vibration"
            ],
            "correctAnswer": "To reduce the temperature of compressed air before it enters the engine",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_sistema_extractor_fondo():
    if LANG == "es":
        return {
            "question": "¿Qué genera el sistema de extractores en el fondo plano del coche?",
            "answers": [
                "Aumento de efecto suelo mediante aceleración del flujo de aire bajo el coche",
                "Reducción del centro de gravedad",
                "Freno aerodinámico en curvas lentas",
                "Presión positiva sobre el eje trasero"
            ],
            "correctAnswer": "Aumento de efecto suelo mediante aceleración del flujo de aire bajo el coche",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the extractor system in the car’s floor generate?",
            "answers": [
                "Increased ground effect by accelerating airflow beneath the car",
                "Lower center of gravity",
                "Aerodynamic braking in slow corners",
                "Positive pressure on the rear axle"
            ],
            "correctAnswer": "Increased ground effect by accelerating airflow beneath the car",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_antivuelco_estructura():
    if LANG == "es":
        return {
            "question": "¿Cuál es la finalidad de la estructura antivuelco en un monoplaza?",
            "answers": [
                "Proteger la cabeza del piloto en caso de accidente",
                "Soportar el alerón delantero en colisiones",
                "Reforzar la caja de cambios",
                "Evitar la pérdida del DRS"
            ],
            "correctAnswer": "Proteger la cabeza del piloto en caso de accidente",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the purpose of the roll structure in a single-seater?",
            "answers": [
                "To protect the driver's head in the event of a crash",
                "To support the front wing in collisions",
                "To reinforce the gearbox",
                "To prevent DRS failure"
            ],
            "correctAnswer": "To protect the driver's head in the event of a crash",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_refrigeracion_frenos():
    if LANG == "es":
        return {
            "question": "¿Cómo se enfrían los discos de freno en un F1?",
            "answers": [
                "Mediante canalizaciones de aire específicas dirigidas a los discos",
                "Gracias al flujo de líquido hidráulico",
                "Con ventiladores eléctricos frontales",
                "A través del intercooler"
            ],
            "correctAnswer": "Mediante canalizaciones de aire específicas dirigidas a los discos",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How are brake discs cooled in an F1 car?",
            "answers": [
                "Via dedicated air ducts directed at the discs",
                "Thanks to hydraulic fluid flow",
                "With front-mounted electric fans",
                "Through the intercooler"
            ],
            "correctAnswer": "Via dedicated air ducts directed at the discs",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_sensor_gps():
    if LANG == "es":
        return {
            "question": "¿Para qué se utiliza el GPS integrado en los monoplazas de F1?",
            "answers": [
                "Medir posición y comparar rendimiento en pista en tiempo real",
                "Controlar la altitud del sistema de suspensión",
                "Emitir señal para el DRS",
                "Reemplazar el sensor de par"
            ],
            "correctAnswer": "Medir posición y comparar rendimiento en pista en tiempo real",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the GPS used for in F1 cars?",
            "answers": [
                "To measure position and compare performance on track in real-time",
                "To control suspension ride height",
                "To trigger DRS signal",
                "To replace the torque sensor"
            ],
            "correctAnswer": "To measure position and compare performance on track in real-time",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_lift_and_coast_objetivo():
    if LANG == "es":
        return {
            "question": "¿Cuál es el propósito principal de la técnica 'lift and coast' en F1?",
            "answers": [
                "Reducir el consumo de combustible y temperatura de frenos",
                "Aumentar la presión del sistema hidráulico",
                "Mejorar el agarre mecánico en tracción",
                "Estabilizar el sistema DRS en frenada"
            ],
            "correctAnswer": "Reducir el consumo de combustible y temperatura de frenos",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the main purpose of the 'lift and coast' technique in F1?",
            "answers": [
                "To reduce fuel consumption and brake temperature",
                "To increase hydraulic system pressure",
                "To improve mechanical traction grip",
                "To stabilize DRS during braking"
            ],
            "correctAnswer": "To reduce fuel consumption and brake temperature",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_mapas_motor():
    if LANG == "es":
        return {
            "question": "¿Qué permite modificar un mapa motor en un coche de F1?",
            "answers": [
                "La entrega de potencia, el consumo de combustible y el freno motor",
                "El funcionamiento del DRS y el ángulo del alerón delantero",
                "La distribución de pesos y el reparto de frenada",
                "El tipo de compuesto usado en los neumáticos"
            ],
            "correctAnswer": "La entrega de potencia, el consumo de combustible y el freno motor",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does an engine map allow to modify in an F1 car?",
            "answers": [
                "Power delivery, fuel consumption and engine braking",
                "DRS function and front wing angle",
                "Weight distribution and brake balance",
                "Tyre compound type"
            ],
            "correctAnswer": "Power delivery, fuel consumption and engine braking",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_funcion_sistema_hidraulico():
    if LANG == "es":
        return {
            "question": "¿Qué controla el sistema hidráulico en un monoplaza de F1?",
            "answers": [
                "Dirección, embrague, cambio de marchas y DRS",
                "Distribución aerodinámica activa",
                "Gestión térmica de la unidad de potencia",
                "Rendimiento del diferencial electrónico"
            ],
            "correctAnswer": "Dirección, embrague, cambio de marchas y DRS",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does the hydraulic system control in an F1 car?",
            "answers": [
                "Steering, clutch, gear shifting and DRS",
                "Active aero distribution",
                "Thermal management of the power unit",
                "Performance of the electronic differential"
            ],
            "correctAnswer": "Steering, clutch, gear shifting and DRS",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_tunel_viento_funcion():
    if LANG == "es":
        return {
            "question": "¿Para qué se utiliza el túnel de viento en el desarrollo de un F1?",
            "answers": [
                "Simular y medir el comportamiento aerodinámico del coche a distintas velocidades",
                "Calibrar sensores de suspensión en curva",
                "Analizar el rendimiento del sistema híbrido",
                "Medir la temperatura interna del combustible"
            ],
            "correctAnswer": "Simular y medir el comportamiento aerodinámico del coche a distintas velocidades",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the wind tunnel used for in F1 car development?",
            "answers": [
                "To simulate and measure the car's aerodynamic behavior at different speeds",
                "To calibrate suspension sensors in corners",
                "To analyze hybrid system performance",
                "To measure internal fuel temperature"
            ],
            "correctAnswer": "To simulate and measure the car's aerodynamic behavior at different speeds",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_limite_tunel_viento():
    if LANG == "es":
        return {
            "question": "¿Qué restricción impone la normativa FIA sobre túneles de viento?",
            "answers": [
                "Tiempo máximo de uso mensual según clasificación en el campeonato",
                "Presión mínima de aire usada en el simulador",
                "Tamaño del difusor de prueba",
                "Cantidad de combustible usado en las pruebas"
            ],
            "correctAnswer": "Tiempo máximo de uso mensual según clasificación en el campeonato",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What restriction does FIA impose on wind tunnel use?",
            "answers": [
                "Maximum monthly usage time based on championship ranking",
                "Minimum air pressure used in the simulator",
                "Size of the test diffuser",
                "Amount of fuel used in tests"
            ],
            "correctAnswer": "Maximum monthly usage time based on championship ranking",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_efecto_lift_and_coast_rendimiento():
    if LANG == "es":
        return {
            "question": "¿Qué efecto tiene el 'lift and coast' sobre el rendimiento del coche en carrera?",
            "answers": [
                "Reduce el ritmo pero mejora la eficiencia general del monoplaza",
                "Aumenta la degradación de neumáticos",
                "Cierra el DRS automáticamente",
                "Aumenta el subviraje en rectas"
            ],
            "correctAnswer": "Reduce el ritmo pero mejora la eficiencia general del monoplaza",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the effect of lift and coast on race car performance?",
            "answers": [
                "It reduces pace but improves overall efficiency",
                "It increases tyre degradation",
                "It automatically closes the DRS",
                "It increases understeer on straights"
            ],
            "correctAnswer": "It reduces pace but improves overall efficiency",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_mapas_motor_en_clasificacion():
    if LANG == "es":
        return {
            "question": "¿Qué característica tiene un mapa motor de clasificación en F1?",
            "answers": [
                "Prioriza potencia máxima sobre fiabilidad y consumo",
                "Minimiza el par motor para evitar graining",
                "Aumenta la presión de los frenos traseros",
                "Refrigera el alerón trasero mediante ERS"
            ],
            "correctAnswer": "Prioriza potencia máxima sobre fiabilidad y consumo",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is characteristic of a qualifying engine map in F1?",
            "answers": [
                "It prioritizes maximum power over reliability and fuel use",
                "It minimizes torque to avoid graining",
                "It increases rear brake pressure",
                "It cools the rear wing via ERS"
            ],
            "correctAnswer": "It prioritizes maximum power over reliability and fuel use",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_presion_hidraulica_fallo():
    if LANG == "es":
        return {
            "question": "¿Qué puede ocurrir si falla la presión del sistema hidráulico en plena carrera?",
            "answers": [
                "El piloto puede perder el cambio de marchas y la asistencia de dirección",
                "Se bloquea el sistema de suspensión delantera",
                "Se activa el modo lluvia automáticamente",
                "Se cierran las válvulas de escape del motor"
            ],
            "correctAnswer": "El piloto puede perder el cambio de marchas y la asistencia de dirección",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can happen if the hydraulic pressure fails during a race?",
            "answers": [
                "The driver may lose gear shifting and steering assistance",
                "The front suspension system locks",
                "Rain mode activates automatically",
                "Engine exhaust valves close"
            ],
            "correctAnswer": "The driver may lose gear shifting and steering assistance",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_simulador_vs_tunel_viento():
    if LANG == "es":
        return {
            "question": "¿Qué ventaja ofrece el simulador CFD frente al túnel de viento en F1?",
            "answers": [
                "Permite pruebas aerodinámicas virtuales sin restricciones físicas",
                "Reproduce mejor el comportamiento de los frenos",
                "Simula temperatura real de los neumáticos",
                "Mide con precisión la masa suspendida"
            ],
            "correctAnswer": "Permite pruebas aerodinámicas virtuales sin restricciones físicas",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is an advantage of CFD simulation over the wind tunnel in F1?",
            "answers": [
                "It allows virtual aerodynamic testing without physical limits",
                "It replicates brake behavior better",
                "It simulates real tyre temperatures",
                "It accurately measures sprung mass"
            ],
            "correctAnswer": "It allows virtual aerodynamic testing without physical limits",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_lift_and_coast_vs_braking():
    if LANG == "es":
        return {
            "question": "¿Cómo afecta el 'lift and coast' a la frenada posterior?",
            "answers": [
                "Reduce la exigencia de los frenos al disminuir la velocidad antes del punto de frenado",
                "Aumenta la presión sobre el eje trasero",
                "Desactiva el mapa motor de regeneración",
                "Incrementa la temperatura de los discos"
            ],
            "correctAnswer": "Reduce la exigencia de los frenos al disminuir la velocidad antes del punto de frenado",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "How does lift and coast affect braking?",
            "answers": [
                "It reduces brake load by lowering speed before the braking point",
                "It increases pressure on the rear axle",
                "It deactivates regeneration engine map",
                "It increases disc temperature"
            ],
            "correctAnswer": "It reduces brake load by lowering speed before the braking point",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_trazada_cuerva_lenta():
    if LANG == "es":
        return {
            "question": "¿Cuál es la trazada más eficiente en una curva lenta de 90 grados?",
            "answers": [
                "Entrada abierta, vértice tardío y salida amplia",
                "Trazada en línea recta por el interior",
                "Frenada brusca en medio y salida cerrada",
                "Mantenerse en el exterior durante toda la curva"
            ],
            "correctAnswer": "Entrada abierta, vértice tardío y salida amplia",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What is the most efficient line in a slow 90-degree corner?",
            "answers": [
                "Wide entry, late apex, wide exit",
                "Straight line through the inside",
                "Sharp braking in the middle and tight exit",
                "Stay outside through the whole corner"
            ],
            "correctAnswer": "Wide entry, late apex, wide exit",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_frenada_recta_vs_curva():
    if LANG == "es":
        return {
            "question": "¿Por qué es más eficiente frenar en línea recta antes de girar?",
            "answers": [
                "Permite usar toda la adherencia del neumático en frenada sin perder tracción lateral",
                "Reduce el desgaste del alerón trasero",
                "Aumenta el par motor en aceleración",
                "Evita el uso del freno regenerativo"
            ],
            "correctAnswer": "Permite usar toda la adherencia del neumático en frenada sin perder tracción lateral",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why is it more efficient to brake in a straight line before turning?",
            "answers": [
                "It allows using full tyre grip for braking without losing lateral traction",
                "It reduces rear wing wear",
                "It increases engine torque on acceleration",
                "It avoids using regenerative braking"
            ],
            "correctAnswer": "It allows using full tyre grip for braking without losing lateral traction",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_subviraje_estilo_conduccion():
    if LANG == "es":
        return {
            "question": "¿Qué estilo de conducción puede provocar subviraje en entrada de curva?",
            "answers": [
                "Entrada rápida y giro temprano sin frenar lo suficiente",
                "Frenada prolongada hasta el vértice",
                "Trazada cerrada desde el exterior",
                "Aceleración temprana con volante recto"
            ],
            "correctAnswer": "Entrada rápida y giro temprano sin frenar lo suficiente",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What driving style can cause understeer at corner entry?",
            "answers": [
                "Fast entry and early turn-in without enough braking",
                "Long braking into the apex",
                "Tight line from the outside",
                "Early throttle with straight steering"
            ],
            "correctAnswer": "Fast entry and early turn-in without enough braking",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_sobreviraje_estilo_conduccion():
    if LANG == "es":
        return {
            "question": "¿Qué acción puede causar sobreviraje en curva de media velocidad?",
            "answers": [
                "Acelerar agresivamente antes de enderezar el volante",
                "Frenar en línea recta sin soltar el gas",
                "Reducir marcha sin usar embrague",
                "Frenar completamente antes de girar"
            ],
            "correctAnswer": "Acelerar agresivamente antes de enderezar el volante",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What can cause oversteer in a medium-speed corner?",
            "answers": [
                "Aggressive throttle before straightening the steering",
                "Braking in a straight line without lifting",
                "Downshifting without clutch use",
                "Fully braking before turning"
            ],
            "correctAnswer": "Aggressive throttle before straightening the steering",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_estilo_conduccion_conservador():
    if LANG == "es":
        return {
            "question": "¿Cuál es una característica del estilo de conducción conservador?",
            "answers": [
                "Entrada más lenta, menor estrés en neumáticos y menor desgaste",
                "Trazadas agresivas y vértice temprano",
                "Frenadas tardías y aceleración a fondo en curva",
                "Sobreviraje controlado para generar temperatura"
            ],
            "correctAnswer": "Entrada más lenta, menor estrés en neumáticos y menor desgaste",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What characterizes a conservative driving style?",
            "answers": [
                "Slower entry, less tyre stress and lower wear",
                "Aggressive lines and early apex",
                "Late braking and full throttle through corners",
                "Controlled oversteer to generate heat"
            ],
            "correctAnswer": "Slower entry, less tyre stress and lower wear",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }


def pregunta_trazada_curva_rapida():
    if LANG == "es":
        return {
            "question": "¿Qué tipo de trazada se busca en curvas rápidas para mantener velocidad?",
            "answers": [
                "Línea suave y constante que maximice el radio de giro",
                "Entrada cerrada con frenada larga",
                "Corte brusco hacia el vértice temprano",
                "Recta interna con ángulo agudo de salida"
            ],
            "correctAnswer": "Línea suave y constante que maximice el radio de giro",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What kind of line is optimal in fast corners to maintain speed?",
            "answers": [
                "Smooth and consistent line maximizing corner radius",
                "Tight entry with extended braking",
                "Sharp cut to early apex",
                "Inside straight with sharp exit angle"
            ],
            "correctAnswer": "Smooth and consistent line maximizing corner radius",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_modulacion_acelerador():
    if LANG == "es":
        return {
            "question": "¿Qué permite la modulación progresiva del acelerador al salir de curva?",
            "answers": [
                "Evitar pérdida de tracción y desgaste excesivo de neumáticos",
                "Cargar la suspensión trasera para mayor estabilidad",
                "Reducir el drag aerodinámico",
                "Activar el DRS antes del punto de detección"
            ],
            "correctAnswer": "Evitar pérdida de tracción y desgaste excesivo de neumáticos",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What does progressive throttle modulation do when exiting a corner?",
            "answers": [
                "Prevents loss of traction and excess tyre wear",
                "Loads rear suspension for better stability",
                "Reduces aerodynamic drag",
                "Activates DRS before detection point"
            ],
            "correctAnswer": "Prevents loss of traction and excess tyre wear",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_frenada_trail_braking():
    if LANG == "es":
        return {
            "question": "¿Qué caracteriza la técnica de 'trail braking'?",
            "answers": [
                "Frenar progresivamente hasta bien entrada la curva",
                "Frenar solo en línea recta y luego girar",
                "Acelerar ligeramente mientras se frena",
                "Usar el motor para frenar únicamente"
            ],
            "correctAnswer": "Frenar progresivamente hasta bien entrada la curva",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What defines the 'trail braking' technique?",
            "answers": [
                "Braking progressively deep into the corner",
                "Braking only in a straight line before turning",
                "Accelerating slightly while braking",
                "Using engine braking only"
            ],
            "correctAnswer": "Braking progressively deep into the corner",
            "knowledgeLevel": 3,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_estilo_agresivo():
    if LANG == "es":
        return {
            "question": "¿Qué efecto puede tener un estilo de conducción agresivo?",
            "answers": [
                "Mayor temperatura y desgaste en neumáticos y frenos",
                "Mayor conservación de energía y ERS",
                "Reducción del drag frontal",
                "Mejor eficiencia de combustible"
            ],
            "correctAnswer": "Mayor temperatura y desgaste en neumáticos y frenos",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "What effect can an aggressive driving style have?",
            "answers": [
                "Higher tyre and brake temperature and wear",
                "Better energy and ERS conservation",
                "Lower frontal drag",
                "Improved fuel efficiency"
            ],
            "correctAnswer": "Higher tyre and brake temperature and wear",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }

def pregunta_frenada_punto_referencia():
    if LANG == "es":
        return {
            "question": "¿Qué importancia tienen los puntos de referencia en la frenada?",
            "answers": [
                "Permiten consistencia y precisión en cada vuelta",
                "Reducen la vibración del volante",
                "Mejoran la distribución del diferencial",
                "Aumentan la presión aerodinámica en recta"
            ],
            "correctAnswer": "Permiten consistencia y precisión en cada vuelta",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Why are braking reference points important?",
            "answers": [
                "They allow consistency and precision lap after lap",
                "They reduce steering vibration",
                "They improve differential distribution",
                "They increase aerodynamic pressure on straights"
            ],
            "correctAnswer": "They allow consistency and precision lap after lap",
            "knowledgeLevel": 2,
            "category": "F1Physics",
            "language": LANG
        }



generadores_por_categoria = {
    "F1Physics": [
        pregunta_efecto_suelo,
        pregunta_transferencia_peso_frenada,
        pregunta_temperatura_neumaticos,
        pregunta_resistencia_aire,
        pregunta_mgu_k,
        pregunta_aceleracion_recta,
        pregunta_fuerza_giro,
        pregunta_gravedad_bajada,
        pregunta_friccion_neumatico_pista,
        pregunta_calor_disco_freno,
        pregunta_downforce_vs_drag,
        pregunta_transferencia_peso_aceleracion,
        pregunta_resistencia_neumaticos,
        pregunta_densidad_aire,
        pregunta_masa_vs_peso,
        pregunta_momento_inercia,
        pregunta_compresion_suspension,
        pregunta_energia_pendiente,
        pregunta_flexion_alas,
        pregunta_eficiencia_frenado,
        pregunta_transferencia_lateral_curva,
        pregunta_densidad_altitud,
        pregunta_tamano_ruedas,
        pregunta_masa_vs_aceleracion,
        pregunta_gases_escape,
        pregunta_energia_disipacion_curva,
        pregunta_fuerza_lateral_vs_velocidad,
        pregunta_compresion_neumatica,
        pregunta_rotacion_rueda_vs_traccion,
        pregunta_interaccion_diferencial,
        pregunta_energia_disipacion_curva,
        pregunta_fuerza_lateral_vs_velocidad,
        pregunta_compresion_neumatica,
        pregunta_rotacion_rueda_vs_traccion,
        pregunta_interaccion_diferencial,
        pregunta_transferencia_calor_frenado,
        pregunta_neumaticos_temperatura_distribucion,
        pregunta_rigidez_torsional_chasis,
        pregunta_valvula_descarga_turbo,
        pregunta_pendulo_invertido,
        pregunta_giro_volante_vs_rotacion,
        pregunta_mguh_funcion,
        pregunta_suspension_antidive,
        pregunta_coeficiente_aerodinamico,
        pregunta_velocidad_entrada_curva,
        pregunta_calculo_downforce_area_velocidad,
        pregunta_resonancia_suspension,
        pregunta_forma_difusor_presion,
        pregunta_masa_no_suspendida,
        pregunta_energia_kinetica_colision,
        pregunta_galeria_venturi_cuello,
        pregunta_interferencia_turbulencia_ruedas,
        pregunta_resistencia_cinetica_lineal,
        pregunta_paso_piano_alto,
        pregunta_interaccion_ers_traccion,
        pregunta_microoscillaciones_drs,
        pregunta_distribucion_masas_lateral,
        pregunta_asimetria_temperatura_frenos,
        pregunta_direccionalidad_neumatico,
        pregunta_energia_vibraciones_motor,
        pregunta_expansion_neumatica_frenado,
        pregunta_velocidad_corte_frenado,
        pregunta_efecto_lift_off,
        pregunta_asimetria_alerones,
        pregunta_poder_reflexivo_asfalto,
        pregunta_graining_definicion,
        pregunta_blasting_neumatico,
        pregunta_impacto_pinchazo_velocidad,
        pregunta_desgaste_neumatico_traccion,
        pregunta_funcion_difusor,
        pregunta_efecto_danio_aleron_trasero,
        pregunta_objetivo_aleron_delantero,
        pregunta_dano_lateral_neumatico,
        pregunta_presion_neumaticos_pinchar,
        pregunta_desgaste_neumatico_curva,
        pregunta_caja_cambios_velocidad,
        pregunta_piston_motor_funcion,
        pregunta_componentes_motor_principales,
        pregunta_funcion_pontones,
        pregunta_grip_mecanico,
        pregunta_suspension_objetivo,
        pregunta_drs_funcion,
        pregunta_diferencia_blandos_medios_duros,
        pregunta_blandos_agarre,
        pregunta_duros_ventaja,
        pregunta_estructura_monocasco,
        pregunta_volante_multifuncion,
        pregunta_camara_onboard,
        pregunta_sistema_frenado_dos_circuitos,
        pregunta_estructura_crashbox,
        pregunta_refrigeracion_intercooler,
        pregunta_sistema_extractor_fondo,
        pregunta_antivuelco_estructura,
        pregunta_refrigeracion_frenos,
        pregunta_sensor_gps,
        pregunta_lift_and_coast_objetivo,
        pregunta_mapas_motor,
        pregunta_funcion_sistema_hidraulico,
        pregunta_tunel_viento_funcion,
        pregunta_limite_tunel_viento,
        pregunta_efecto_lift_and_coast_rendimiento,
        pregunta_mapas_motor_en_clasificacion,
        pregunta_presion_hidraulica_fallo,
        pregunta_simulador_vs_tunel_viento,
        pregunta_lift_and_coast_vs_braking,
        pregunta_trazada_cuerva_lenta,
        pregunta_frenada_recta_vs_curva,
        pregunta_subviraje_estilo_conduccion,
        pregunta_sobreviraje_estilo_conduccion,
        pregunta_estilo_conduccion_conservador,
        pregunta_trazada_curva_rapida,
        pregunta_modulacion_acelerador,
        pregunta_frenada_trail_braking,
        pregunta_estilo_agresivo,
        pregunta_frenada_punto_referencia

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

def generar_preguntas_fisica_desde_main(lang='es', category=None):
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
