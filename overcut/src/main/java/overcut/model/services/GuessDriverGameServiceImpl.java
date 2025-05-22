package overcut.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.GuessDriverGame;
import overcut.model.entities.GuessDriverGameDao;
import overcut.model.entities.GuessDriverQuestion;
import overcut.model.entities.GuessDriverQuestionDao;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

@Service
@Transactional
public class GuessDriverGameServiceImpl implements GuessDriverGameService {

    @Autowired
    private GuessDriverGameDao gameDao;

    @Autowired
    private GuessDriverQuestionDao questionDao;


    @Override
    public GuessDriverGame startGame() {
        try {
            List<String> command = List.of(
                    "python", "src/main/resources/scripts/select_random_driver.py"
            );

            ProcessBuilder pb = new ProcessBuilder(command);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(output.toString(), Map.class);

            Long driverId = ((Number) result.get("driverId")).longValue();
            String driverName = (String) result.get("name");

            GuessDriverGame game = new GuessDriverGame();
            game.setDriverId(driverId);
            game.setDriverName(driverName);
            // game.setDriverName(driverName); // si quieres guardar también el nombre
            return gameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar partida Guess the Driver", e);
        }
    }

    @Override
    public GuessDriverQuestion askQuestion(Long gameId, String category, String value, String lang) {
        GuessDriverGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (game.isFinished()) {
            throw new IllegalStateException("Game is already finished");
        }

        try {
            List<String> command = new ArrayList<>();
            command.add("python");
            command.add("src/main/resources/scripts/validate_guess_driver_question.py");
            command.add(String.valueOf(game.getDriverId()));
            command.add(category);
            if (value != null) {
                command.add(value);
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.environment().put("LANG", lang);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(output.toString(), Map.class);

            boolean isCorrect = (Boolean) result.get("isCorrect");
            String questionText = (String) result.get("question");

            GuessDriverQuestion question = new GuessDriverQuestion();
            question.setGame(game);
            question.setCategory(category);
            question.setValueUser(value);
            question.setCorrect(isCorrect);
            question.setQuestion(questionText);
            questionDao.save(question);

            game.getQuestions().add(question);
            game.setQuestionCount(game.getQuestionCount() + 1);

            if (game.getQuestionCount() >= 10) {
                game.setFinished(true);
                game.setSuccessful(false);
            }

            gameDao.save(game);

            return question;

        } catch (Exception e) {
            throw new RuntimeException("Error al validar pregunta con script Python", e);
        }
    }


    @Override
    public GuessDriverGame guessPilot(Long gameId, String guessedName) {
        GuessDriverGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        // ✅ Permitir adivinar incluso si está finished, pero solo si aún no ha acertado
        if (game.isFinished() && game.getSuccessful() != null && game.getSuccessful()) {
            throw new IllegalStateException("Game is already finished and successful");
        }

        String realName = game.getDriverName();
        boolean isSuccess = guessedName.trim().equalsIgnoreCase(realName.trim());

        game.setFinished(true);
        game.setSuccessful(isSuccess);

        return gameDao.save(game);
    }


    @Override
    public GuessDriverGame getGameStatus(Long gameId) {
        return gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));
    }

    @Override
    public List<String> getRecommendations(String category, String lang)
    {
        try {
            List<String> command = List.of(
                    "python",
                    "src/main/resources/scripts/get_recommendations.py",
                    "--category", category
            );

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            pb.environment().put("LANG", lang); // ← añadir esta línea
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            return Arrays.asList(mapper.readValue(output.toString(), String[].class));

        } catch (Exception e) {
            throw new RuntimeException("Error al obtener recomendaciones para categoría: " + category, e);
        }
    }

    @Override
    public List<String> autocompletePilotNames(String partial) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "src/main/resources/scripts/recommend_pilots.py",
                    "--partial", partial
            );
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder jsonBuilder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuilder.append(line);
            }
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            return Arrays.asList(mapper.readValue(jsonBuilder.toString(), String[].class));
        } catch (Exception e) {
            throw new RuntimeException("Error en recomendación de pilotos: " + e.getMessage(), e);
        }
    }


}
