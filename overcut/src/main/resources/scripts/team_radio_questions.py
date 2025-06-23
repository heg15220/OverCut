import json
import random
import argparse
import sys

LANG = "es"

def pregunta_radio_faster_than_you():
    if LANG == "es":
        return {
            "question": "¿Quién recibió el famoso mensaje de radio: 'Fernando is faster than you'?",
            "answers": [
                "Felipe Massa",
                "Mark Webber",
                "Sebastian Vettel",
                "Valtteri Bottas"
            ],
            "correctAnswer": "Felipe Massa",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Who received the famous radio message: 'Fernando is faster than you'?",
            "answers": [
                "Felipe Massa",
                "Mark Webber",
                "Sebastian Vettel",
                "Valtteri Bottas"
            ],
            "correctAnswer": "Felipe Massa",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_leave_me_alone():
    if LANG == "es":
        return {
            "question": "¿Qué piloto dijo por radio: 'Déjame en paz, sé lo que estoy haciendo'?",
            "answers": [
                "Kimi Räikkönen",
                "Lewis Hamilton",
                "Fernando Alonso",
                "Max Verstappen"
            ],
            "correctAnswer": "Kimi Räikkönen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which driver said on the radio: 'Leave me alone, I know what I’m doing'?",
            "answers": [
                "Kimi Räikkönen",
                "Lewis Hamilton",
                "Fernando Alonso",
                "Max Verstappen"
            ],
            "correctAnswer": "Kimi Räikkönen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_multi_21():
    if LANG == "es":
        return {
            "question": "¿Qué mensaje de radio causó tensión entre Vettel y Webber en Malasia 2013?",
            "answers": [
                "'Multi 21, Seb'",
                "'Engine mode 5, confirm'",
                "'Box, box, box'",
                "'Don’t hold him up'"
            ],
            "correctAnswer": "'Multi 21, Seb'",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which radio message caused tension between Vettel and Webber in Malaysia 2013?",
            "answers": [
                "'Multi 21, Seb'",
                "'Engine mode 5, confirm'",
                "'Box, box, box'",
                "'Don’t hold him up'"
            ],
            "correctAnswer": "'Multi 21, Seb'",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_no_mikey():
    if LANG == "es":
        return {
            "question": "¿Quién dijo por radio: 'No, Mikey! No, no, Mikey! That was so not right!'?",
            "answers": [
                "Toto Wolff",
                "Christian Horner",
                "Lewis Hamilton",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Toto Wolff",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Who said on the radio: 'No, Mikey! No, no, Mikey! That was so not right!'?",
            "answers": [
                "Toto Wolff",
                "Christian Horner",
                "Lewis Hamilton",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Toto Wolff",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_engine_engine():
    if LANG == "es":
        return {
            "question": "¿Qué piloto dijo por radio: 'GP2 engine, GP2!'?",
            "answers": [
                "Fernando Alonso",
                "Sergio Pérez",
                "Esteban Ocon",
                "Jenson Button"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which driver said on the radio: 'GP2 engine, GP2!'?",
            "answers": [
                "Fernando Alonso",
                "Sergio Pérez",
                "Esteban Ocon",
                "Jenson Button"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_momento_fernando_is_faster():
    if LANG == "es":
        return {
            "question": "¿Cuándo fue la primera vez que se dijo el famoso mensaje de radio: Fernando is faster than you?",
            "answers": [
                "Alemania 2010",
                "Brasil 2012",
                "Japón 2013",
                "Australia 2010"
            ],
            "correctAnswer": "Australia 2010",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "When was the famous radio message 'Fernando is faster than you' first said?",
            "answers": [
                "Germany 2010",
                "Brazil 2012",
                "Japan 2013",
                "Australia 2010"
            ],
            "correctAnswer": "Australia 2010",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_baku_2021_tyres():
    if LANG == "es":
        return {
            "question": "¿Qué piloto gritó 'F***ing tyre!' tras un reventón en Bakú 2021?",
            "answers": [
                "Lance Stroll",
                "Max Verstappen",
                "Lewis Hamilton",
                "George Russell"
            ],
            "correctAnswer": "Max Verstappen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which driver shouted 'F***ing tyre!' after a blowout in Baku 2021?",
            "answers": [
                "Lance Stroll",
                "Max Verstappen",
                "Lewis Hamilton",
                "George Russell"
            ],
            "correctAnswer": "Max Verstappen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }



def pregunta_radio_seb_blue_flags():
    if LANG == "es":
        return {
            "question": "¿Qué piloto dijo repetidamente 'Blue flags! Blue flags!' por radio en 2016?",
            "answers": [
                "Sebastian Vettel",
                "Daniel Ricciardo",
                "Fernando Alonso",
                "Nico Hülkenberg"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which driver repeatedly shouted 'Blue flags! Blue flags!' on the radio in 2016?",
            "answers": [
                "Sebastian Vettel",
                "Daniel Ricciardo",
                "Fernando Alonso",
                "Nico Hülkenberg"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_hamilton_abudhabi2021():
    if LANG == "es":
        return {
            "question": "¿Qué dijo Hamilton por radio después de perder el título en Abu Dabi 2021?",
            "answers": [
                "'This has been manipulated, man'",
                "'I can’t believe it, man'",
                "'They stole the race'",
                "'Mikey, you need to fix this'"
            ],
            "correctAnswer": "'This has been manipulated, man'",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "What did Hamilton say on the radio after losing the 2021 title in Abu Dhabi?",
            "answers": [
                "'This has been manipulated, man'",
                "'I can’t believe it, man'",
                "'They stole the race'",
                "'Mikey, you need to fix this'"
            ],
            "correctAnswer": "'This has been manipulated, man'",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_hockenheim_rain_2018():
    if LANG == "es":
        return {
            "question": "En qué carrera se dijo esta radio: 'STAY OUT, STAY OUT, IN IN IN IN IN IN IN. Im sory mate. Just go go '",
            "answers": [
                "Gran Bretaña 2024",
                "Turquía 2020",
                "Alemania 2018",
                "Malasia 2015"
            ],
            "correctAnswer": "Alemania 2018",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was this radio message said: 'STAY OUT, STAY OUT, IN IN IN IN IN IN IN. I’m sorry mate. Just go go'",
            "answers": [
                "Great Britain 2024",
                "Turkey 2020",
                "Germany 2018",
                "Malaysia 2015"
            ],
            "correctAnswer": "Germany 2018",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_silverstone_british_flag():
    if LANG == "es":
        return {
            "question": "¿Qué dijo Vettel por radio tras chocar con Hamilton en Azerbaiyán 2017?",
            "answers": [
                "'He brake-tested me!'",
                "'Maybe he likes the British flag too much'",
                "'He turned into me!'",
                "'This is ridiculous!'"
            ],
            "correctAnswer": "'He brake-tested me!'",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "What did Vettel say on the radio after colliding with Hamilton in Azerbaiyan 2017?",
            "answers": [
                "'He brake-tested me!'",
                "'Maybe he likes the British flag too much'",
                "'He turned into me!'",
                "'This is ridiculous!'"
            ],
            "correctAnswer": "'Maybe he likes the British flag too much'",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_vettel_turquia():
    if LANG == "es":
        return {
            "question": "¿En qué carrera dijo Vettel por radio: 'What a stupid action! Im going home!'?",
            "answers": [
                "Azerbaiyan 2017",
                "Mexico 2016",
                "Malasia 2013",
                "Turquía 2010"
            ],
            "correctAnswer": "Turquía 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race did Vettel say on the radio: 'What a stupid action! I’m going home!'?",
            "answers": [
                "Azerbaijan 2017",
                "Mexico 2016",
                "Malaysia 2013",
                "Turkey 2010"
            ],
            "correctAnswer": "Turkey 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_ferrari_austria():
    if LANG == "es":
        return {
            "question": "¿En qué carrera Ferrari le dijo a Barrichello: 'Let Michael pass for the championship, Rubens please'",
            "answers": [
                "Austria 2002",
                "Austria 2001",
                "Italy 2003",
                "Brazil 2001"
            ],
            "correctAnswer": "Austria 2001",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race did Ferrari say to Barrichello: 'Let Michael pass for the championship, Rubens please'?",
            "answers": [
                "Austria 2002",
                "Austria 2001",
                "Italy 2003",
                "Brazil 2001"
            ],
            "correctAnswer": "Austria 2001",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_vettel_mexico():
    if LANG == "es":
        return {
            "question": "Qué piloto fue el protagonista de esta radio: 'Here is a message to Charlie: F*** off, honestly f*** off'",
            "answers": [
                "Max Verstappen",
                "Sebastian Vettel",
                "Fernando Alonso",
                "Kimi Raikkonen"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver was the protagonist of this radio message: 'Here is a message to Charlie: F*** off, honestly f*** off'?",
            "answers": [
                "Max Verstappen",
                "Sebastian Vettel",
                "Fernando Alonso",
                "Kimi Raikkonen"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_kimi_abu_dhabi():
    if LANG == "es":
        return {
            "question": "¿En qué carrera Kimi dijo: 'Leave me alone, I know what to do'?",
            "answers": [
                "Hungría 2013",
                "Abu Dabi 2012",
                "China 2011",
                "Bélgica 2012"
            ],
            "correctAnswer": "Abu Dabi 2012",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race did Kimi say: 'Leave me alone, I know what to do?",
            "answers": [
                "Hungary 2013",
                "Abu Dhabi 2012",
                "China 2011",
                "Belgium 2012"
            ],
            "correctAnswer": "Abu Dhabi 2012",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_alonso_gp2_japon():
    if LANG == "es":
        return {
            "question": "¿En qué carrera Alonso gritó: 'GP2 engine! GP2!'?",
            "answers": [
                "Japón 2015",
                "Hungría 2016",
                "Austria 2014",
                "Italia 2015"
            ],
            "correctAnswer": "Japón 2015",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race did Alonso shout: 'GP2 engine! GP2!'?",
            "answers": [
                "Japan 2015",
                "Hungary 2016",
                "Austria 2014",
                "Italy 2015"
            ],
            "correctAnswer": "Japan 2015",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_leclerc_baku():
    if LANG == "es":
        return {
            "question": "¿En qué carrera Leclerc dijo: 'I am stupid! I am stupid!'?",
            "answers": [
                "Azerbaiyán 2019",
                "Mónaco 2021",
                "Italia 2020",
                "España 2019"
            ],
            "correctAnswer": "Azerbaiyán 2019",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race did Leclerc say: 'I am stupid! I am stupid!'?",
            "answers": [
                "Azerbaijan 2019",
                "Monaco 2021",
                "Italy 2020",
                "Spain 2019"
            ],
            "correctAnswer": "Azerbaijan 2019",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_bottas_australia():
    if LANG == "es":
        return {
            "question": "¿Qué piloto dijo: 'To whom it may concern, f*** you' tras ganar una carrera?",
            "answers": [
                "Valtteri Bottas",
                "Lewis Hamilton",
                "Daniel Ricciardo",
                "Kimi Räikkönen"
            ],
            "correctAnswer": "Valtteri Bottas",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver said: 'To whom it may concern, f*** you' after winning a race?",
            "answers": [
                "Valtteri Bottas",
                "Lewis Hamilton",
                "Daniel Ricciardo",
                "Kimi Räikkönen"
            ],
            "correctAnswer": "Valtteri Bottas",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_ricciardo_monaco():
    if LANG == "es":
        return {
            "question": "¿Qué piloto celebró con 'Redemption, haha!' tras ganar en Mónaco?",
            "answers": [
                "Daniel Ricciardo",
                "Sergio Pérez",
                "Carlos Sainz",
                "Lewis Hamilton"
            ],
            "correctAnswer": "Daniel Ricciardo",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver celebrated with 'Redemption, haha!' after winning in Monaco?",
            "answers": [
                "Daniel Ricciardo",
                "Sergio Pérez",
                "Carlos Sainz",
                "Lewis Hamilton"
            ],
            "correctAnswer": "Daniel Ricciardo",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_alonso_now_we_can_fight():
    if LANG == "es":
        return {
            "question": "¿Qué piloto dijo 'Now we can fight' tras adelantar con McLaren en Australia 2018?",
            "answers": [
                "Fernando Alonso",
                "Carlos Sainz",
                "Esteban Ocon",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which driver said 'Now we can fight' after overtaking in Australia 2018 with McLaren?",
            "answers": [
                "Fernando Alonso",
                "Carlos Sainz",
                "Esteban Ocon",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_montoya_raikkonen():
    if LANG == "es":
        return {
            "question": "Quién dijo esta frase: 'F***ing, f***ing Raikkonen! What a f***ing idiot!'",
            "answers": [
                "Michael Schumacher",
                "David Coulthard",
                "Jarno Trulli",
                "Juan Pablo Montoya"
            ],
            "correctAnswer": "Juan Pablo Montoya",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    elif LANG == "en":
        return {
            "question": "Which driver said 'F***ing, f***ing Raikkonen! What a f***ing idiot!'",
            "answers": [
                "Michael Schumacher",
                "David Coulthard",
                "Jarno Trulli",
                "Juan Pablo Montoya"
            ],
            "correctAnswer": "Juan Pablo Montoya",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_lotus_raikkonen():
    if LANG == "es":
        return {
            "question": "Cuándo se dijo esta radio: 'Kimi, get out of the f***ing way!'",
            "answers": [
                "India 2013",
                "Brasil 2012",
                "Abu dhabi 2013",
                "Italia 2008"
            ],
            "correctAnswer": "India 2013",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "When was this radio message said: 'Kimi, get out of the f***ing way!'",
            "answers": [
                "India 2013",
                "Brazil 2012",
                "Abu Dhabi 2013",
                "Italy 2008"
            ],
            "correctAnswer": "India 2013",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_bottas_james():
    if LANG == "es":
        return {
            "question": "Cuándo se dijo esta radio: 'Valtteri its James, please hold position. Sorry'",
            "answers": [
                "Rusia 2018",
                "Alemania 2018",
                "Abu dhabi 2017",
                "Brasil 2021"
            ],
            "correctAnswer": "Alemania 2018",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "When was this radio message said: 'Valtteri, it's James. Please hold position. Sorry'",
            "answers": [
                "Russia 2018",
                "Germany 2018",
                "Abu Dhabi 2017",
                "Brazil 2021"
            ],
            "correctAnswer": "Germany 2018",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_vettel_multi21():
    if LANG == "es":
        return {
            "question": "¿En qué carrera se dijo la polémica radio: 'Multi 21, Seb'?",
            "answers": [
                "Malasia 2013",
                "Hungría 2012",
                "Alemania 2013",
                "Australia 2014"
            ],
            "correctAnswer": "Malasia 2013",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was the controversial radio 'Multi 21, Seb' said?",
            "answers": [
                "Malaysia 2013",
                "Hungary 2012",
                "Germany 2013",
                "Australia 2014"
            ],
            "correctAnswer": "Malaysia 2013",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_kimi_yes_yes():
    if LANG == "es":
        return {
            "question": "¿Qué piloto dijo por radio: 'Yes, yes, yes, I'm doing it all the time, you don't have to remind me every second'?",
            "answers": [
                "Kimi Räikkönen",
                "Fernando Alonso",
                "Lewis Hamilton",
                "Nico Rosberg"
            ],
            "correctAnswer": "Kimi Räikkönen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver said: 'Yes, yes, yes, I'm doing it all the time, you don't have to remind me every second'?",
            "answers": [
                "Kimi Räikkönen",
                "Fernando Alonso",
                "Lewis Hamilton",
                "Nico Rosberg"
            ],
            "correctAnswer": "Kimi Räikkönen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_perez_monaco():
    if LANG == "es":
        return {
            "question": "¿Qué piloto gritó 'Guys, guys guys. This is us! Come on! Vamos!' por radio tras ganar en Mónaco?",
            "answers": [
                "Sergio Pérez",
                "Carlos Sainz",
                "Charles Leclerc",
                "Lando Norris"
            ],
            "correctAnswer": "Sergio Pérez",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver shouted 'Guys, guys guys. This is us! Come on! Vamos!' on the radio after winning in Monaco?",
            "answers": [
                "Sergio Pérez",
                "Carlos Sainz",
                "Charles Leclerc",
                "Lando Norris"
            ],
            "correctAnswer": "Sergio Pérez",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_verstappen_brazil_2022():
    if LANG == "es":
        return {
            "question": "¿Quién dijo: 'I gave my reasons and I stand by it' tras negarse a dejar pasar a su compañero en Brasil 2022?",
            "answers": [
                "Max Verstappen",
                "Lewis Hamilton",
                "Sergio Pérez",
                "George Russell"
            ],
            "correctAnswer": "Max Verstappen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Who said: 'I gave my reasons and I stand by it' after refusing team orders in Brazil 2022?",
            "answers": [
                "Max Verstappen",
                "Lewis Hamilton",
                "Sergio Pérez",
                "George Russell"
            ],
            "correctAnswer": "Max Verstappen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_leclerc_monaco_2022():
    if LANG == "es":
        return {
            "question": "¿Qué piloto gritó: '¡¿Por qué?! ¡¿Qué estáis haciendo?!' al ser llamado dos veces seguidas a boxes en Mónaco 2022?",
            "answers": [
                "Charles Leclerc",
                "Carlos Sainz",
                "Sergio Pérez",
                "George Russell"
            ],
            "correctAnswer": "Charles Leclerc",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver yelled: 'Why? What are you doing?!' after being double-stacked in the pits at Monaco 2022?",
            "answers": [
                "Charles Leclerc",
                "Carlos Sainz",
                "Sergio Pérez",
                "George Russell"
            ],
            "correctAnswer": "Charles Leclerc",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_alonso_corea():
    if LANG == "es":
        return {
            "question": "¿En qué carrera se escuchó la radio: Avanti Fer, Avanti!?",
            "answers": [
                "Gran Bretaña 2011",
                "Corea 2010",
                "Malasia 2012",
                "España 2013"
            ],
            "correctAnswer": "Corea 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was the radio message 'Avanti Fer, Avanti!' heard?",
            "answers": [
                "Great Britain 2011",
                "Korea 2010",
                "Malaysia 2012",
                "Spain 2013"
            ],
            "correctAnswer": "Korea 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_sainz_radio():
    if LANG == "es":
        return {
            "question": "Quién dijo esta radio: 'Did I go for it? Did I send it or did I dont didnt send it? Ah, send it!'",
            "answers": [
                "Carlos Sainz",
                "Nico Hulkenberg",
                "Max Verstappen",
                "Sergio Perez"
            ],
            "correctAnswer": "Nico Hulkenberg",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Who said this radio message: 'Did I go for it? Did I send it or did I don't... didn't send it? Ah, send it!'?",
            "answers": [
                "Carlos Sainz",
                "Nico Hulkenberg",
                "Max Verstappen",
                "Sergio Perez"
            ],
            "correctAnswer": "Nico Hulkenberg",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_button_radio():
    if LANG == "es":
        return {
            "question": "Quién dijo esta radio: 'Weee are the champions, my frieeend! Woo-hoo ho!'",
            "answers": [
                "Jenson Button",
                "Lewis Hamilton",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Jenson Button",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Who said this radio message: 'Weee are the champions, my frieeend! Woo-hoo ho!'?",
            "answers": [
                "Jenson Button",
                "Lewis Hamilton",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Jenson Button",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_india_vettel():
    if LANG == "es":
        return {
            "question": "En qué carrera se dijo esta frase: You are a 4 times world champion. Great, great drive! You have joined the greats!'",
            "answers": [
                "India 2013",
                "Las Vegas 2024",
                "Brasil 2012",
                "Mexico 2017"
            ],
            "correctAnswer": "India 2013",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was this phrase said: 'You are a 4 times world champion. Great, great drive! You have joined the greats!'?",
            "answers": [
                "India 2013",
                "Las Vegas 2024",
                "Brazil 2012",
                "Mexico 2017"
            ],
            "correctAnswer": "India 2013",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_verstappen_2021():
    if LANG == "es":
        return {
            "question": "En qué carrera se dijo esta frase: 'Oh my Lord Max!!!'",
            "answers": [
                "Abu Dhabi 2021",
                "Mónaco 2023",
                "España 2016",
                "Mexico 2017"
            ],
            "correctAnswer": "Abu Dhabi 2021",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was this phrase said: 'Oh my Lord Max!!!'?",
            "answers": [
                "Abu Dhabi 2021",
                "Monaco 2023",
                "Spain 2016",
                "Mexico 2017"
            ],
            "correctAnswer": "Abu Dhabi 2021",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_sainz_radio_smooth():
    if LANG == "es":
        return {
            "question": "Qué piloto dice repetidas veces esto por la radio: 'Smoooth Operatorrr'",
            "answers": [
                "Lando Norris",
                "Carlos Sainz",
                "Max Verstappen",
                "Charles Leclerc"
            ],
            "correctAnswer": "Carlos Sainz",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver repeatedly says this on the radio: 'Smoooth Operatorrr'?",
            "answers": [
                "Lando Norris",
                "Carlos Sainz",
                "Max Verstappen",
                "Charles Leclerc"
            ],
            "correctAnswer": "Carlos Sainz",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_max_radio_simply():
    if LANG == "es":
        return {
            "question": "Qué piloto dice repetidas veces esto por la radio: 'Simply lovely!'",
            "answers": [
                "Lando Norris",
                "Carlos Sainz",
                "Max Verstappen",
                "Charles Leclerc"
            ],
            "correctAnswer": "Max Verstappen",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver repeatedly says this on the radio: 'Smoooth Operatorrr'?",
            "answers": [
                "Lando Norris",
                "Carlos Sainz",
                "Max Verstappen",
                "Charles Leclerc"
            ],
            "correctAnswer": "Max Verstappen",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_alonso_space():
    if LANG == "es":
        return {
            "question": "Qué piloto dijo esto por la radio: 'All the time you have to leave space!'",
            "answers": [
                "Lewis Hamilton",
                "Sebastian Vettel",
                "Max Verstappen",
                "Fernando Alonso"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver said this on the radio: 'All the time you have to leave space!'?",
            "answers": [
                "Lewis Hamilton",
                "Sebastian Vettel",
                "Max Verstappen",
                "Fernando Alonso"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_hamilton_turquia():
    if LANG == "es":
        return {
            "question": "Qué piloto dijo esto por la radio: 'That´s for all the kids out there who dream the impossible. You can do it too man!'",
            "answers": [
                "Lewis Hamilton",
                "Sebastian Vettel",
                "Max Verstappen",
                "Fernando Alonso"
            ],
            "correctAnswer": "Lewis Hamilton",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver said this on the radio: 'That´s for all the kids out there who dream the impossible. You can do it too man!'?",
            "answers": [
                "Lewis Hamilton",
                "Sebastian Vettel",
                "Max Verstappen",
                "Fernando Alonso"
            ],
            "correctAnswer": "Lewis Hamilton",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_vettel_spain():
    if LANG == "es":
        return {
            "question": "Qué piloto dijo esto por la radio: 'Yabba DABA Dooooo Ringdigidingdingding'",
            "answers": [
                "Mark Webber",
                "Sebastian Vettel",
                "Max Verstappen",
                "Fernando Alonso"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver said this on the radio: 'Yabba DABA Dooooo Ringdigidingdingding'?",
            "answers": [
                "Mark Webber",
                "Sebastian Vettel",
                "Max Verstappen",
                "Fernando Alonso"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_webber_england():
    if LANG == "es":
        return {
            "question": "En qué carrera dijo Mark Webber esto por la radio: 'Not bad for a number 2 driver. Cheers'",
            "answers": [
                "Gran Bretaña 2010",
                "Brasil 2011",
                "Hungría 2010",
                "Mónaco 2012"
            ],
            "correctAnswer": "Gran Bretaña 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race did Mark Webber say on the radio: 'Not bad for a number 2 driver. Cheers'?",
            "answers": [
                "Great Britain 2010",
                "Brazil 2011",
                "Hungary 2010",
                "Monaco 2012"
            ],
            "correctAnswer": "Great Britain 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_vettel_spain_ping_pong():
    if LANG == "es":
        return {
            "question": "Qué piloto dijo esto por la radio: 'We are racing or ping pong?'",
            "answers": [
                "Mark Webber",
                "Sebastian Vettel",
                "Max Verstappen",
                "Kimi Raikkonen"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver said this on the radio: 'We are racing or ping pong?'",
            "answers": [
                "Mark Webber",
                "Sebastian Vettel",
                "Max Verstappen",
                "Fernando Alonso"
            ],
            "correctAnswer": "Sebastian Vettel",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_hammer_time():
    if LANG == "es":
        return {
            "question": "¿Qué quería decir el equipo Mercedes cuando le decía a Lewis Hamilton: 'It's hammer time'?",
            "answers": [
                "Que debía empujar al máximo y marcar vueltas rápidas",
                "Que tenía que entrar en boxes en esa vuelta",
                "Que debía ahorrar neumáticos y energía",
                "Que tenía un problema técnico urgente"
            ],
            "correctAnswer": "Que debía empujar al máximo y marcar vueltas rápidas",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

    if LANG == "en":
        return {
            "question": "What did Mercedes mean when they told Lewis Hamilton: 'It's hammer time' on the radio?",
            "answers": [
                "That he should push to the limit and set fast laps",
                "That he should pit on that lap",
                "That he needed to save tyres and energy",
                "That there was a critical technical issue"
            ],
            "correctAnswer": "That he should push to the limit and set fast laps",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_opposite():
    if LANG == "es":
        return {
            "question": "¿Qué significa cuando un equipo le dice a su piloto por radio: 'Opposite a [nombre del piloto]'?",
            "answers": [
                "Que debe hacer lo contrario a lo que haga ese piloto en la estrategia",
                "Que debe defender posición frente a ese piloto",
                "Que debe dejar pasar a ese piloto",
                "Que debe copiar la estrategia de ese piloto"
            ],
            "correctAnswer": "Que debe hacer lo contrario a lo que haga ese piloto en la estrategia",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

    if LANG == "en":
        return {
            "question": "What does it mean when a team tells their driver: 'Opposite to [driver name]' on the radio?",
            "answers": [
                "That they should do the opposite strategy to that driver",
                "That they should defend position against that driver",
                "That they should let that driver pass",
                "That they should copy that driver’s pit stop"
            ],
            "correctAnswer": "That they should do the opposite strategy to that driver",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_box_to_overtake():
    if LANG == "es":
        return {
            "question": "¿Qué significa cuando el ingeniero le dice a un piloto: 'Box to overtake'?",
            "answers": [
                "Que parando en boxes puede ganar posición sobre otro piloto",
                "Que debe hacer un adelantamiento arriesgado justo antes del pit stop",
                "Que va a ser adelantado si entra a boxes",
                "Que debe parar en boxes si el rival se queda en pista"
            ],
            "correctAnswer": "Que debe parar en boxes si el rival se queda en pista",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

    if LANG == "en":
        return {
            "question": "What does it mean when the engineer tells a driver: 'Box to overtake'?",
            "answers": [
                "That by pitting they can gain position over another driver",
                "That they should attempt a risky overtake just before the pit stop",
                "That they will be overtaken if they pit",
                "That they should pit if the rival stays out"
            ],
            "correctAnswer": "That they should pit if the rival stays out",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_push_mode():
    if LANG == "es":
        return {
            "question": "¿Qué significa cuando un ingeniero dice por radio: 'Mode push'?",
            "answers": [
                "Que debe cambiar el modo del coche para atacar al máximo",
                "Que debe mantener su ritmo actual sin cambiar estrategia",
                "Que debe ahorrar energía del motor híbrido",
                "Que debe cambiar a neumáticos más blandos"
            ],
            "correctAnswer": "Que debe cambiar el modo del coche para atacar al máximo",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


    if LANG == "en":
        return {
            "question": "What does it mean when an engineer says: 'Mode push' on the radio?",
            "answers": [
                "That the driver should change the car mode to push at maximum pace",
                "That the driver should maintain current pace and not attack",
                "That the driver must save hybrid energy",
                "That the driver should switch to softer tyres"
            ],
            "correctAnswer": "That the driver should change the car mode to push at maximum pace",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_use_strat_5():
    if LANG == "es":
        return {
            "question": "¿Qué indica la radio 'Use Strat 5'?",
            "answers": [
                "Que debe cambiar a una configuración específica del coche ya predefinida",
                "Que debe activar DRS manualmente",
                "Que tiene que adelantar al coche de delante en la siguiente curva",
                "Que debe copiar la estrategia de su compañero de equipo"
            ],
            "correctAnswer": "Que debe cambiar a una configuración específica del coche ya predefinida",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "What does the radio message 'Use Strat 5' mean?",
            "answers": [
                "That the driver must switch to a pre-configured car setting",
                "That the driver should activate DRS manually",
                "That the driver must overtake the car ahead at the next corner",
                "That the driver should copy their teammate’s strategy"
            ],
            "correctAnswer": "That the driver must switch to a pre-configured car setting",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_lift_and_coast():
    if LANG == "es":
        return {
            "question": "¿Qué significa cuando un ingeniero dice 'Lift and coast' por radio?",
            "answers": [
                "Que debe levantar el pie del acelerador antes de frenar para ahorrar combustible o temperatura",
                "Que debe acelerar más para calentar neumáticos",
                "Que debe mantener la velocidad media sin cambios",
                "Que debe mantenerse detrás del coche de delante"
            ],
            "correctAnswer": "Que debe levantar el pie del acelerador antes de frenar para ahorrar combustible o temperatura",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "What does 'Lift and coast' mean when said on the radio?",
            "answers": [
                "That the driver should lift off the throttle before braking to save fuel or temperature",
                "That the driver should push more to heat up the tyres",
                "That the driver must maintain average speed with no changes",
                "That the driver should stay behind the car ahead"
            ],
            "correctAnswer": "That the driver should lift off the throttle before braking to save fuel or temperature",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_fail_84_fail():
    if LANG == "es":
        return {
            "question": "¿Qué indica una radio tipo 'Fail 84 fail'?",
            "answers": [
                "Que el piloto debe cambiar un ajuste del sistema del coche manualmente",
                "Que debe abandonar por un fallo mecánico",
                "Que no se ha detectado correctamente el sensor de la línea de meta",
                "Que debe cambiar de modo motor a uno más agresivo"
            ],
            "correctAnswer": "Que el piloto debe cambiar un ajuste del sistema del coche manualmente",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "What does a message like 'Fail 84 fail' indicate on the radio?",
            "answers": [
                "That the driver must manually adjust a system setting in the car",
                "That the driver must retire due to mechanical failure",
                "That the finish line sensor was not detected properly",
                "That the engine mode must be switched to a more aggressive setting"
            ],
            "correctAnswer": "That the driver must manually adjust a system setting in the car",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_box_box():
    if LANG == "es":
        return {
            "question": "¿Qué indica el mensaje por radio 'Box, box'?",
            "answers": [
                "Que debe entrar inmediatamente en boxes",
                "Que el coche de seguridad está entrando",
                "Que debe evitar entrar a boxes",
                "Que se ha producido una bandera roja"
            ],
            "correctAnswer": "Que debe entrar inmediatamente en boxes",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "What does the radio message 'Box, box' mean?",
            "answers": [
                "That the driver must pit immediately",
                "That the safety car is coming in",
                "That the driver must stay out and not pit",
                "That a red flag has been issued"
            ],
            "correctAnswer": "That the driver must pit immediately",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_alonso_abu_dhabi():
    if LANG == "es":
        return {
            "question": "A qué piloto se le dijo esto por la radio: 'Use the best of your talent. We know how big it is, use it.'",
            "answers": [
                "Lewis Hamilton",
                "Michael Schumacher",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver was told on the radio: 'Use the best of your talent. We know how big it is, use it.'",
            "answers": [
                "Lewis Hamilton",
                "Michael Schumacher",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_raikkonen_brazil():
    if LANG == "es":
        return {
            "question": "A qué piloto se le dijo esto por la radio: 'Its over, its over, Hamilton 7th. By my calculations we win the championship by 1 point!'",
            "answers": [
                "Nico Rosberg",
                "Kimi Raikkonen",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Kimi Raikkonen",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver was told on the radio: 'It's over, it's over, Hamilton 7th. By my calculations we win the championship by 1 point!'",
            "answers": [
                "Nico Rosberg",
                "Kimi Raikkonen",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Kimi Raikkonen",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }



def pregunta_raikkonen_brazil():
    if LANG == "es":
        return {
            "question": "A qué piloto se le dijo esto por la radio: 'Its over, its over, Hamilton 7th. By my calculations we win the championship by 1 point!'",
            "answers": [
                "Nico Rosberg",
                "Kimi Raikkonen",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Kimi Raikkonen",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "Which driver was told on the radio: 'It's over, it's over, Hamilton 7th. By my calculations we win the championship by 1 point!'",
            "answers": [
                "Nico Rosberg",
                "Kimi Raikkonen",
                "Sebastian Vettel",
                "Fernando Alonso"
            ],
            "correctAnswer": "Kimi Raikkonen",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_vettel_abuDhabi():
    if LANG == "es":
        return {
            "question": "En qué carrera se dijo esto por la radio: 'You just wait sunshine, you just wait. Kubica P5. DU BIST WELTMEISTER!'",
            "answers": [
                "Abu Dhabi 2010",
                "Abu Dhabi 2021",
                "Brasil 2012",
                "Japón 2003"
            ],
            "correctAnswer": "Abu Dhabi 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was this radio message said: 'You just wait sunshine, you just wait. Kubica P5. DU BIST WELTMEISTER!'",
            "answers": [
                "Abu Dhabi 2010",
                "Abu Dhabi 2021",
                "Brazil 2012",
                "Japan 2003"
            ],
            "correctAnswer": "Abu Dhabi 2010",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_verstappen_spain():
    if LANG == "es":
        return {
            "question": "En qué carrera se dijo esto por la radio: 'Max Verstappen, you are a race winner! Fantastic, what a debut!'",
            "answers": [
                "Malasia 2017",
                "Brasil 2016",
                "Mexico 2017",
                "España 2016"
            ],
            "correctAnswer": "España 2016",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was this radio message said: 'Max Verstappen, you are a race winner! Fantastic, what a debut!'",
            "answers": [
                "Malaysia 2017",
                "Brazil 2016",
                "Mexico 2017",
                "Spain 2016"
            ],
            "correctAnswer": "Spain 2016",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_verstappen_monza():
    if LANG == "es":
        return {
            "question": "En qué carrera se dijo esto por la radio: 'That´s what you get when you don´t leave the space! *****!'",
            "answers": [
                "Gran Bretaña 2021",
                "Brasil 2022",
                "Brasil 2021",
                "Italia 2021"
            ],
            "correctAnswer": "Italia 2021",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    if LANG == "en":
        return {
            "question": "In which race was this radio message said: 'That's what you get when you don't leave the space! *****!'",
            "answers": [
                "Great Britain 2021",
                "Brazil 2022",
                "Brazil 2021",
                "Italy 2021"
            ],
            "correctAnswer": "Italy 2021",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_sainz_stop_inventing():
    if LANG == "es":
        return {
            "question": "¿Qué piloto respondió por radio con un tajante 'Stop inventing!' al recibir instrucciones estratégicas?",
            "answers": [
                "Fernando Alonso",
                "Charles Leclerc",
                "Carlos Sainz",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Carlos Sainz",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which driver replied on the radio with a sharp 'Stop inventing!' after receiving strategy instructions?",
            "answers": [
                "Fernando Alonso",
                "Charles Leclerc",
                "Carlos Sainz",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Carlos Sainz",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_bonnington_get_in_there():
    if LANG == "es":
        return {
            "question": "¿Qué ingeniero popularizó la frase: 'Get in there, Lewis!' tras cada victoria?",
            "answers": [
                "Peter Bonnington",
                "Gianpiero Lambiase",
                "Riccardo Adami",
                "Tom Stallard"
            ],
            "correctAnswer": "Peter Bonnington",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which race engineer popularized the phrase: 'Get in there, Lewis!' after every win?",
            "answers": [
                "Peter Bonnington",
                "Gianpiero Lambiase",
                "Riccardo Adami",
                "Tom Stallard"
            ],
            "correctAnswer": "Peter Bonnington",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_toto_mikey_abudhabi():
    if LANG == "es":
        return {
            "question": "¿Quién dijo por radio: 'No Mikey, no, no Mikey! That was so not right!' en Abu Dhabi 2021?",
            "answers": [
                "Lewis Hamilton",
                "Toto Wolff",
                "Christian Horner",
                "Peter Bonnington"
            ],
            "correctAnswer": "Toto Wolff",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Who said on the radio: 'No Mikey, no, no Mikey! That was so not right!' in Abu Dhabi 2021?",
            "answers": [
                "Lewis Hamilton",
                "Toto Wolff",
                "Christian Horner",
                "Peter Bonnington"
            ],
            "correctAnswer": "Toto Wolff",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }



def pregunta_alonso_now_we_can_fight():
    if LANG == "es":
        return {
            "question": "¿Qué piloto dijo 'Now we can fight!' por radio tras terminar la carrera de Australia 2018?",
            "answers": [
                "Fernando Alonso",
                "Carlos Sainz",
                "Esteban Ocon",
                "Lando Norris"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which driver said 'Now we can fight!' on the radio after overtaking with McLaren-Renault after finishing Australia 2018 race?",
            "answers": [
                "Fernando Alonso",
                "Carlos Sainz",
                "Esteban Ocon",
                "Lando Norris"
            ],
            "correctAnswer": "Fernando Alonso",
            "knowledgeLevel": 1,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_masi_motor_race():
    if LANG == "es":
        return {
            "question": "¿Quién dijo por radio: 'It’s called a motor race, Toto. We went car racing.' en Abu Dhabi 2021?",
            "answers": [
                "Michael Masi",
                "Toto Wolff",
                "Christian Horner",
                "Lewis Hamilton"
            ],
            "correctAnswer": "Michael Masi",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Who said on the radio: 'It’s called a motor race, Toto. We went car racing.' in Abu Dhabi 2021?",
            "answers": [
                "Michael Masi",
                "Toto Wolff",
                "Christian Horner",
                "Lewis Hamilton"
            ],
            "correctAnswer": "Michael Masi",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }

def pregunta_kimi_toilet():
    if LANG == "es":
        return {
            "question": "¿Qué piloto justificó su ausencia en el podio diciendo: 'I was having a s***'?",
            "answers": [
                "Mark Webber",
                "Lewis Hamilton",
                "Kimi Räikkönen",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Kimi Räikkönen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Which driver explained missing the podium by saying: 'I was having a s***'?",
            "answers": [
                "Mark Webber",
                "Lewis Hamilton",
                "Kimi Räikkönen",
                "Sebastian Vettel"
            ],
            "correctAnswer": "Kimi Räikkönen",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_masi_motor_race():
    if LANG == "es":
        return {
            "question": "Quién dijo por radio: 'It’s friday theeen. Saturday, Sunday what?.'",
            "answers": [
                "Carlos Sainz",
                "Toto Wolff",
                "Christian Horner",
                "Lewis Hamilton"
            ],
            "correctAnswer": "Michael Masi",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "Who said on the radio: 'It’s called a motor race, Toto. We went car racing.' in Abu Dhabi 2021?",
            "answers": [
                "Michael Masi",
                "Toto Wolff",
                "Christian Horner",
                "Lewis Hamilton"
            ],
            "correctAnswer": "Michael Masi",
            "knowledgeLevel": 3,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }


def pregunta_vettel_brazil_2012():
    if LANG == "es":
        return {
            "question": "¿Qué dijo Vettel tras el contacto con Senna en la primera vuelta de Brasil 2012?",
            "answers": [
                "'I think my car is damaged!'",
                "'Someone hit me!'",
                "'I’ve been spun, car is okay!'",
                "'Check the car! I got hit!'"
            ],
            "correctAnswer": "'I think my car is damaged!'",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }
    else:
        return {
            "question": "What did Vettel say after contact with Senna in the opening lap of Brazil 2012?",
            "answers": [
                "'I think my car is damaged!'",
                "'Someone hit me!'",
                "'I’ve been spun, car is okay!'",
                "'Check the car! I got hit!'"
            ],
            "correctAnswer": "'I think my car is damaged!'",
            "knowledgeLevel": 2,
            "category": "LegendaryTeamRadios",
            "language": LANG
        }



# Lista de generadores de preguntas
generadores_radios = [
    pregunta_radio_faster_than_you,
    pregunta_leave_me_alone,
    pregunta_multi_21,
    pregunta_no_mikey,
    pregunta_engine_engine,
    pregunta_momento_fernando_is_faster,
    pregunta_baku_2021_tyres,
    pregunta_radio_seb_blue_flags,
    pregunta_hamilton_abudhabi2021,
    pregunta_hockenheim_rain_2018,
    pregunta_silverstone_british_flag,
    pregunta_vettel_turquia,
    pregunta_ferrari_austria,
    pregunta_vettel_mexico,
    pregunta_kimi_abu_dhabi,
    pregunta_alonso_gp2_japon,
    pregunta_leclerc_baku,
    pregunta_bottas_australia,
    pregunta_ricciardo_monaco,
    pregunta_montoya_raikkonen,
    pregunta_lotus_raikkonen,
    pregunta_bottas_james,
    pregunta_vettel_multi21,
    pregunta_kimi_yes_yes,
    pregunta_perez_monaco,
    pregunta_verstappen_brazil_2022,
    pregunta_leclerc_monaco_2022,
    pregunta_alonso_corea,
    pregunta_sainz_radio,
    pregunta_button_radio,
    pregunta_india_vettel,
    pregunta_verstappen_2021,
    pregunta_sainz_radio_smooth,
    pregunta_max_radio_simply,
    pregunta_alonso_space,
    pregunta_hamilton_turquia,
    pregunta_vettel_spain,
    pregunta_webber_england,
    pregunta_vettel_spain_ping_pong,
    pregunta_hammer_time,
    pregunta_opposite,
    pregunta_box_to_overtake,
    pregunta_push_mode,
    pregunta_use_strat_5,
    pregunta_lift_and_coast,
    pregunta_fail_84_fail,
    pregunta_box_box,
    pregunta_alonso_abu_dhabi,
    pregunta_vettel_abuDhabi,
    pregunta_verstappen_spain,
    pregunta_verstappen_monza,
    pregunta_sainz_stop_inventing,
    pregunta_bonnington_get_in_there,
    pregunta_toto_mikey_abudhabi,
    pregunta_alonso_now_we_can_fight,
    pregunta_masi_motor_race,
    pregunta_kimi_toilet,
    pregunta_vettel_brazil_2012
]

# Barajar respuestas si es necesario (mantiene la correcta)
def barajar_respuestas(pregunta):
    respuestas = pregunta["answers"]
    correcta = pregunta["correctAnswer"]
    random.shuffle(respuestas)
    if correcta not in respuestas:
        respuestas[random.randint(0, len(respuestas)-1)] = correcta
    pregunta["answers"] = respuestas
    return pregunta

# Ejecutar
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, default="LegendaryTeamRadios")
    parser.add_argument("--lang", type=str, default="es")
    args = parser.parse_args()

    LANG = args.lang.lower()

    preguntas = []
    generadores_seleccionados = random.sample(generadores_radios, min(5, len(generadores_radios)))
    for gen in generadores_seleccionados:
        p = gen()
        p = barajar_respuestas(p)
        preguntas.append(p)

    print(json.dumps(preguntas, ensure_ascii=False))
