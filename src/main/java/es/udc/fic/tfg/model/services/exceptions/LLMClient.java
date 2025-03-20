package es.udc.fic.tfg.model.services.exceptions;

import es.udc.fic.tfg.model.entities.Answer;
import es.udc.fic.tfg.model.entities.Question;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.json.JSONObject;
import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class LLMClient {

    private final Random random = new Random();
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String ERGAST_API_URL = "https://ergast.com/api/f1";
    private static final String[] ENDPOINTS = {
            "/current/driverStandings.json", "/current/constructorStandings.json", "/current/circuits.json", "/current/last/results.json",
            "/{year}/driverStandings.json", "/{year}/constructorStandings.json", "/{year}/circuits.json", "/{year}/results.json",
            "/drivers.json", "/constructors.json", "/circuits.json", "/seasons.json", "/races.json",
            "/{year}/{round}/qualifying.json"
    };

    private String createComplexQuestion(String selectedData) {
        if (selectedData.contains("Posición")) {
            String[] parts = selectedData.split(" - ");
            String name = parts[0];
            String position = parts[2].split(": ")[1];
            String points = parts[3].split(": ")[1];
            return "¿Cuántos puntos ha acumulado " + name + " para alcanzar la posición " + position + " en la clasificación general?";
        } else if (selectedData.contains("Ubicación")) {
            String[] parts = selectedData.split(" - ");
            String circuit = parts[0];
            return "¿En qué país se encuentra el circuito de " + circuit + "?";
        } else if (selectedData.contains("Carrera")) {
            String[] parts = selectedData.split(" - ");
            String driver = parts[0];
            String race = parts[2].split(": ")[1];
            String position = parts[4].split(": ")[1];
            String constructor = parts[5].split(": ")[1];
            return "¿Con qué constructor " + driver + " logró la posición " + position + " en la carrera " + race + "?";
        } else if (selectedData.contains("Clasificación")) {
            String[] parts = selectedData.split(" - ");
            String driver = parts[0];
            String race = parts[2].split(": ")[1];
            String position = parts[3].split(": ")[1];
            return "¿En qué posición clasificó " + driver + " para la carrera " + race + "?";
        } else if (selectedData.contains("Campeonato")) {
            return "¿Quién ganó el campeonato mundial de Fórmula 1 en " + selectedData.split(" - ")[1] + "?";
        } else if (selectedData.contains("Comparación")) {
            return "¿Qué piloto tiene más victorias en " + selectedData.split(" - ")[1] + "?";
        }
        return "¿Qué sabes sobre " + selectedData + "?";
    }

    public Question generateQuestion() {
        List<String> dataPoints = fetchDataFromErgastAPI();
        if (dataPoints.isEmpty()) return null;

        String selectedData = dataPoints.get(random.nextInt(dataPoints.size()));

        String questionText = createComplexQuestion(selectedData);

        Question question = new Question(questionText,null,2);

        List<String> answers = generateAnswers(selectedData, dataPoints,question);

        List<Answer> answerList = new ArrayList<>();
        if (answers.isEmpty()) return null;

        Question generatedQuestion = new Question(questionText,null,2);
        char option = 'a';

        int correctIndex = random.nextInt(4);
        String correctAnswer = answers.remove(0);
        answers.add(correctIndex, correctAnswer);

        Answer trueAnswer = new Answer(correctAnswer,true,generatedQuestion);
        answerList.add(trueAnswer);
        for(String answer: answers){
            Answer answer1 = new Answer(answer,false,generatedQuestion);
            answerList.add(answer1);
        }

        generatedQuestion.setAnswers(answerList);

        return generatedQuestion;
    }

    private List<String> generateAnswers(String selectedData, List<String> dataPoints, Question question) {
        List<String> answers = new ArrayList<>();
        if (selectedData.contains("Posición")) {
            answers.add(selectedData.split(" - ")[3].split(": ")[1] + " puntos.");
        } else if (selectedData.contains("Ubicación")) {
            answers.add(selectedData.split(" - ")[1].split(": ")[1]);
        } else if (selectedData.contains("Carrera")) {
            answers.add(selectedData.split(" - ")[5].split(": ")[1]);
        } else if (selectedData.contains("Clasificación")) {
            answers.add(selectedData.split(" - ")[3].split(": ")[1]);
        } else if (selectedData.contains("Campeonato")) {
            answers.add("Respuesta correcta: " + selectedData.split(" - ")[0]);
        } else if (selectedData.contains("Comparación")) {
            answers.add("Respuesta correcta: " + selectedData.split(" - ")[0]);
        } else {
            answers.add("Respuesta correcta relacionada con " + selectedData);
        }

        for (int i = 1; i <= 3; i++) {
            String wrongAnswer = dataPoints.get(random.nextInt(dataPoints.size()));
            if (!wrongAnswer.equals(selectedData)) {
                answers.add("Respuesta incorrecta plausible: " + wrongAnswer);
            }
        }

        return answers;
    }

    private List<String> fetchDataFromErgastAPI() {
        List<String> dataPoints = new ArrayList<>();
        try {
            String endpoint = ENDPOINTS[random.nextInt(ENDPOINTS.length)];

            if (endpoint.contains("{year}")) {
                int year = random.nextInt(2023 - 1950 + 1) + 1950;
                endpoint = endpoint.replace("{year}", String.valueOf(year));
            }

            if (endpoint.contains("{round}")) {
                int round = random.nextInt(23) + 1;
                endpoint = endpoint.replace("{round}", String.valueOf(round));
            }

            String url = ERGAST_API_URL + endpoint;
            String response = restTemplate.getForObject(url, String.class);

            JSONObject jsonResponse = new JSONObject(response);
            extractDataPoints(jsonResponse, dataPoints);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return dataPoints;
    }

    private void extractStandings(JSONObject mrData, List<String> dataPoints) {
        if (mrData.has("StandingsTable")) {
            JSONArray standingsLists = mrData.getJSONObject("StandingsTable").getJSONArray("StandingsLists");

            if (standingsLists.length() > 0) {
                JSONObject standingsList = standingsLists.getJSONObject(0);

                if (standingsList.has("DriverStandings")) {
                    JSONArray driverStandings = standingsList.getJSONArray("DriverStandings");
                    for (int i = 0; i < driverStandings.length(); i++) {
                        JSONObject driver = driverStandings.getJSONObject(i).getJSONObject("Driver");
                        String driverName = driver.getString("givenName") + " " + driver.getString("familyName");
                        dataPoints.add(driverName);
                    }
                }

                if (standingsList.has("ConstructorStandings")) {
                    JSONArray constructorStandings = standingsList.getJSONArray("ConstructorStandings");
                    for (int i = 0; i < constructorStandings.length(); i++) {
                        JSONObject constructor = constructorStandings.getJSONObject(i).getJSONObject("Constructor");
                        String constructorName = constructor.getString("name");
                        dataPoints.add(constructorName);
                    }
                }
            }
        }
    }
    private void extractRaceResults(JSONObject mrData, List<String> dataPoints) {
        if (mrData.has("RaceTable")) {
            JSONArray races = mrData.getJSONObject("RaceTable").getJSONArray("Races");

            for (int i = 0; i < races.length(); i++) {
                JSONObject race = races.getJSONObject(i);

                if (race.has("Results")) {  // Procesar resultados de carrera
                    JSONArray results = race.getJSONArray("Results");
                    for (int j = 0; j < results.length(); j++) {
                        JSONObject result = results.getJSONObject(j).getJSONObject("Driver");
                        String driverName = result.getString("givenName") + " " + result.getString("familyName");
                        dataPoints.add(driverName);
                    }
                }

                if (race.has("QualifyingResults")) {  // Procesar resultados de clasificación
                    JSONArray qualifyingResults = race.getJSONArray("QualifyingResults");
                    for (int j = 0; j < qualifyingResults.length(); j++) {
                        JSONObject qualifyingResult = qualifyingResults.getJSONObject(j).getJSONObject("Driver");
                        String driverName = qualifyingResult.getString("givenName") + " " + qualifyingResult.getString("familyName");
                        dataPoints.add(driverName);
                    }
                }
            }
        }
    }

    private void extractDataPoints(JSONObject jsonResponse, List<String> dataPoints) {
        if (jsonResponse.has("MRData")) {
            JSONObject mrData = jsonResponse.getJSONObject("MRData");

            if (mrData.has("StandingsTable")) {
                extractStandings(mrData, dataPoints);
            } else if (mrData.has("CircuitTable")) {
                extractCircuits(mrData, dataPoints);
            } else if (mrData.has("RaceTable")) {
                extractRaceResults(mrData, dataPoints);
            }
        }
    }

    private void extractCircuits(JSONObject mrData, List<String> dataPoints) {
        if (mrData.has("CircuitTable")) {
            JSONArray circuits = mrData.getJSONObject("CircuitTable").getJSONArray("Circuits");
            for (int i = 0; i < circuits.length(); i++) {
                JSONObject circuit = circuits.getJSONObject(i);
                String circuitName = circuit.getString("circuitName");
                String location = circuit.getJSONObject("Location").getString("locality") + ", " +
                        circuit.getJSONObject("Location").getString("country");
                dataPoints.add(circuitName + " - Ubicación: " + location);
            }
        }
    }
}
