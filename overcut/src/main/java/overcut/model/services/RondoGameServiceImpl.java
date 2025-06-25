package overcut.model.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.RondoGame;
import overcut.model.entities.RondoGameDao;
import overcut.model.entities.RondoLetter;
import overcut.model.entities.RondoLetterDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Timestamp;
import java.util.*;

@Service
public class RondoGameServiceImpl implements RondoGameService {

    @Autowired
    private RondoGameDao gameDao;

    @Autowired
    private RondoLetterDao letterDao;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SCRIPT_PATH = "src/main/resources/scripts/generate_rondo.py";

    private String runPythonScript(String... commandParts) {
        try {
            List<String> command = new ArrayList<>();
            command.add("python");
            for (String part : commandParts) {
                command.add(part);
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("Script exited with code " + exitCode);
            }

            return output.toString();

        } catch (Exception e) {
            throw new RuntimeException("Failed to execute script", e);
        }
    }
    @Override
    public RondoGame createGame(String language) {
        try {
            // Leer archivo de caché con roscos pre-generados
            String cachePath = "src/main/resources/scripts/rosco_cache_" + language + ".json";
            ObjectMapper mapper = new ObjectMapper();
            List<List<Map<String, Object>>> todosLosRoscos;

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(cachePath), "UTF-8"))) {
                todosLosRoscos = mapper.readValue(reader, new TypeReference<>() {});
            }

            // Elegir uno aleatorio
            List<Map<String, Object>> rosco = todosLosRoscos.get(new Random().nextInt(todosLosRoscos.size()));

            // Crear entidad del juego
            RondoGame game = new RondoGame();
            game.setStartTime(new Timestamp(System.currentTimeMillis()));
            game.setStatus("IN_PROGRESS");
            game.setScore(0);
            game.setLanguage(language);
            gameDao.save(game);

            // Crear letras asociadas
            List<RondoLetter> letters = new ArrayList<>();
            for (Map<String, Object> entry : rosco) {
                RondoLetter letter = new RondoLetter();
                letter.setGame(game);
                letter.setLetter(entry.get("letter").toString().charAt(0));
                letter.setQuestion(entry.get("question").toString());

                // Guardamos la lista de respuestas como JSON plano
                String jsonAnswers = mapper.writeValueAsString(entry.get("answers"));
                letter.setAnswer(jsonAnswers);

                letter.setStatus("UNANSWERED");
                letters.add(letter);
            }

            letterDao.saveAll(letters);
            game.setPasaPalabraLetterList(letters);

            return game;

        } catch (IOException e) {
            throw new RuntimeException("Error loading rosco from cache: " + e.getMessage(), e);
        }
    }


    @Override
    public RondoGame getGame(Long gameId) throws InstanceNotFoundException {
        RondoGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new InstanceNotFoundException("RondoGame", gameId));

        List<RondoLetter> letters = letterDao.findByGameIdOrderByLetterAsc(gameId);
        game.setPasaPalabraLetterList(letters);
        return game;
    }

    @Override
    public RondoLetter answerLetter(Long gameId, char letter, String userAnswer) throws InstanceNotFoundException {
        RondoLetter letterEntity = letterDao.findByGameIdAndLetter(gameId, letter)
                .orElseThrow(() -> new InstanceNotFoundException("RondoLetter", letter));

        if (letterEntity.getStatus().equals("CORRECT") || letterEntity.getStatus().equals("WRONG")) {
            return letterEntity;
        }

        try {
            String question = letterEntity.getQuestion();
            String url = String.format("http://localhost:8000/validate-rondo-answer?letter=%s&question=%s&answer=%s",
                    URLEncoder.encode(String.valueOf(letter), "UTF-8"),
                    URLEncoder.encode(question, "UTF-8"),
                    URLEncoder.encode(userAnswer, "UTF-8"));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI validation error: " + response.body());
            }

            Map<String, Object> result = mapper.readValue(response.body(), new TypeReference<>() {});
            boolean isCorrect = (Boolean) result.get("valid");

            if (isCorrect) {
                letterEntity.setStatus("CORRECT");
                RondoGame game = letterEntity.getGame();
                game.setScore(game.getScore() + 1);
                gameDao.save(game);
            } else {
                letterEntity.setStatus("WRONG");
            }

            letterDao.save(letterEntity);
            return letterEntity;

        } catch (Exception e) {
            throw new RuntimeException("Error validating Rondo answer via FastAPI", e);
        }
    }

    @Override
    public void skipLetter(Long gameId, char letter) throws InstanceNotFoundException {
        RondoLetter letterEntity = letterDao.findByGameIdAndLetter(gameId, letter)
                .orElseThrow(() -> new InstanceNotFoundException("RondoLetter", letter));
        if (letterEntity.getStatus().equals("UNANSWERED")) {
            letterEntity.setStatus("SKIPPED");
            letterDao.save(letterEntity);
        }
    }

    @Override
    public void completeGame(Long gameId) throws InstanceNotFoundException {
        RondoGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new InstanceNotFoundException("RondoGame", gameId));
        game.setEndTime(new Timestamp(System.currentTimeMillis()));
        game.setStatus("COMPLETED");
        gameDao.save(game);
    }
}
