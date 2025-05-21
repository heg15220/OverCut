package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.WordSearchCell;
import es.udc.fic.tfg.model.entities.WordSearchGame;
import es.udc.fic.tfg.model.entities.WordSearchGameDao;
import es.udc.fic.tfg.model.entities.WordSearchWord;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WordSearchServiceImpl implements WordSearchService {

    @Autowired
    private WordSearchGameDao gameDao;

    @Override
    public WordSearchGame startGame() {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/generate_wordsearch.py");
            Process process = pb.start();
            String json = new BufferedReader(new InputStreamReader(process.getInputStream()))
                    .lines().collect(Collectors.joining());
            process.waitFor();

            JsonNode node = new ObjectMapper().readTree(json);
            WordSearchGame game = new WordSearchGame();
            game.setTheme(node.get("theme").asText());

            for (JsonNode cell : node.get("grid")) {
                WordSearchCell c = new WordSearchCell();
                c.setRowIndex(cell.get("row").asInt());
                c.setColIndex(cell.get("col").asInt());
                c.setLetter(cell.get("letter").asText().charAt(0));
                c.setGame(game);
                game.getCells().add(c);
            }

            for (JsonNode word : node.get("words")) {
                WordSearchWord w = new WordSearchWord();
                w.setSurname(word.get("surname").asText());
                w.setDriverId(word.get("driverId").asLong());
                w.setStartRow(word.get("startRow").asInt());
                w.setStartCol(word.get("startCol").asInt());
                w.setDirection(word.get("direction").asText());
                w.setGame(game);
                game.getWords().add(w);
            }

            return gameDao.save(game);
        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar WordSearch", e);
        }

    }
    @Override
    public WordSearchGame getGame(Long gameId) {
        return gameDao.findById(gameId).orElseThrow(() -> new EntityNotFoundException("Game not found"));
    }

    @Override
    public WordSearchGame submitSolution(Long gameId, List<String> foundSurnames) {
        WordSearchGame game = getGame(gameId);
        List<String> correct = game.getWords().stream()
                .map(WordSearchWord::getSurname)
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        boolean allFound = correct.stream().allMatch(w -> foundSurnames.contains(w.toUpperCase()));
        game.setFinished(true);
        game.setSuccessful(allFound);
        return gameDao.save(game);
    }

    @Override
    public boolean validateWord(Long gameId, String attemptedSurname) {
        WordSearchGame game = getGame(gameId);

        return game.getWords().stream()
                .map(WordSearchWord::getSurname)
                .map(String::toUpperCase)
                .anyMatch(word -> word.equals(attemptedSurname.toUpperCase()));
    }
    @Override
    public WordSearchGame revealWords(Long gameId) {
        WordSearchGame game = getGame(gameId);

        // Se marcan todas las palabras encontradas
        game.getWords().forEach(word -> {
            word.setRevealed(true); // Asume que has agregado un campo "revealed" en la entidad WordSearchWord
        });

        game.setFinished(true);  // Marcamos el juego como terminado
        game.setSuccessful(false); // El jugador se rinde, por lo tanto, no es un éxito

        return gameDao.save(game); // Guardamos los cambios
    }


}
