package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import overcut.model.entities.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.services.exceptions.CooldownException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class WordSearchServiceImpl implements WordSearchService {

    @Autowired
    private WordSearchGameDao gameDao;

    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao;

    @Value("${fastapi.base-url:http://fastapi:8000}")
    private String fastapiBaseUrl;

    @Override
    public WordSearchGame startGame(Long userId) {
        try {
            if (!cooldownService.canPlay("WordSearch", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("WordSearch", userId);
                throw new CooldownException("WAIT", wait);
            }

            String url = fastapiBaseUrl + "/generate-wordsearch";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode node = new ObjectMapper().readTree(response.body());
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

            WordSearchGame wordSearchGame = gameDao.save(game);
            cooldownService.registerPlay("WordSearch", userId);
            return wordSearchGame;

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

        String normalized = attemptedSurname.toUpperCase();
        for (WordSearchWord word : game.getWords()) {
            if (word.getSurname().toUpperCase().equals(normalized) && !word.isRevealed()) {
                word.setRevealed(true);

                Map<String, WordSearchCell> cellMap = game.getCells().stream()
                        .collect(Collectors.toMap(
                                c -> c.getRowIndex() + "," + c.getColIndex(),
                                c -> c
                        ));

                String[] dir = word.getDirection().split(",");
                int dr = Integer.parseInt(dir[0]);
                int dc = Integer.parseInt(dir[1]);
                int len = word.getSurname().length();

                for (int i = 0; i < len; i++) {
                    int r = word.getStartRow() + i * dr;
                    int c = word.getStartCol() + i * dc;
                    WordSearchCell cell = cellMap.get(r + "," + c);
                    if (cell != null) {
                        cell.setRevealed(true);
                    }
                }

                gameDao.save(game); // Guarda los cambios
                return true;
            }
        }

        return false;
    }

    public WordSearchGame revealWords(Long gameId) {
        WordSearchGame game = getGame(gameId);

        // Crear una matriz de acceso rápido a las celdas por coordenadas
        Map<String, WordSearchCell> cellMap = game.getCells().stream()
                .collect(Collectors.toMap(
                        c -> c.getRowIndex() + "," + c.getColIndex(),
                        c -> c
                ));

        // Marcar palabras reveladas y sus celdas
        game.getWords().forEach(word -> {
            word.setRevealed(true);

            String[] dir = word.getDirection().split(",");
            int dr = Integer.parseInt(dir[0]);
            int dc = Integer.parseInt(dir[1]);
            int len = word.getSurname().length();

            for (int i = 0; i < len; i++) {
                int row = word.getStartRow() + i * dr;
                int col = word.getStartCol() + i * dc;
                WordSearchCell cell = cellMap.get(row + "," + col);
                if (cell != null) cell.setRevealed(true);
            }
        });

        game.setFinished(true);
        game.setSuccessful(false);
        return gameDao.save(game);
    }



}
