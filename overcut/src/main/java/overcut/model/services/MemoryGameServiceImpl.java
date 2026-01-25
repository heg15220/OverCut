package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.ValidateMemoryPairResponseDto;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
@Transactional
public class MemoryGameServiceImpl implements MemoryGameService {

    @Autowired
    private MemoryGameDao gameDao;

    @Autowired
    private MemoryCardDao cardDao;

    @Autowired
    private CooldownService cooldownService;

    @Override
    public MemoryGame startGame(String lang, Long userId, int rows, int cols, String mode) {
        try {
           /* if (!cooldownService.canPlay("Memory", userId)) {
                long wait = cooldownService.secondsUntilNextPlay("Memory", userId);
                throw new CooldownException("WAIT", wait);
            }
*/
            HttpClient client = HttpClient.newHttpClient();
            String url = "http://localhost:8000/generate-memory-game?lang=" + lang
                    + "&rows=" + rows + "&cols=" + cols + "&mode=" + mode;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI error: " + response.body());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.body());

            MemoryGame game = new MemoryGame();
            game.setRows(root.get("rows").asInt());
            game.setCols(root.get("cols").asInt());
            game.setMode(root.get("mode").asText());
            game.setAttemptsLeft(root.get("attemptsLeft").asInt());
            game.setFinished(false);
            game.setSuccessful(null);

            for (JsonNode cardNode : root.get("cards")) {
                MemoryCard c = new MemoryCard();
                c.setGame(game);
                c.setPositionIndex(cardNode.get("positionIndex").asInt());
                c.setPairKey(cardNode.get("pairKey").asText());
                c.setCardType(cardNode.get("cardType").asText());
                c.setLabel(cardNode.get("label").asText());
                c.setMatched(false);

                if (cardNode.hasNonNull("driverId")) c.setDriverId(cardNode.get("driverId").asLong());
                if (cardNode.hasNonNull("constructorId")) c.setConstructorId(cardNode.get("constructorId").asLong());

                game.getCards().add(c);
            }

            MemoryGame saved = gameDao.save(game);
           // cooldownService.registerPlay("Memory", userId);
            return saved;

        } catch (CooldownException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error starting Memory game", e);
        }
    }

    @Override
    public ValidateMemoryPairResponseDto validatePair(Long gameId, Long firstCardId, Long secondCardId) {
        MemoryGame game = gameDao.findById(gameId).orElseThrow();

        ValidateMemoryPairResponseDto res = new ValidateMemoryPairResponseDto();

        if (game.isFinished() || game.getAttemptsLeft() <= 0) {
            res.setMatch(false);
            res.setAttemptsLeft(game.getAttemptsLeft());
            res.setFinished(true);
            res.setSuccessful(game.getSuccessful());
            res.setMatchedCardIds(List.of());
            return res;
        }

        MemoryCard a = cardDao.findById(firstCardId).orElseThrow();
        MemoryCard b = cardDao.findById(secondCardId).orElseThrow();

        if (!a.getGame().getId().equals(gameId) || !b.getGame().getId().equals(gameId)) {
            throw new IllegalArgumentException("Cards do not belong to this game");
        }

        if (a.isMatched() || b.isMatched() || a.getId().equals(b.getId())) {
            res.setMatch(false);
            res.setAttemptsLeft(game.getAttemptsLeft());
            res.setFinished(game.isFinished());
            res.setSuccessful(game.getSuccessful());
            res.setMatchedCardIds(List.of());
            return res;
        }

        boolean match = a.getPairKey().equals(b.getPairKey());

        if (match) {
            a.setMatched(true);
            b.setMatched(true);
            cardDao.save(a);
            cardDao.save(b);

            res.setMatchedCardIds(List.of(a.getId(), b.getId()));
        } else {
            game.setAttemptsLeft(game.getAttemptsLeft() - 1);
            res.setMatchedCardIds(List.of());
        }

        // ¿terminado?
        boolean allMatched = game.getCards().stream().allMatch(MemoryCard::isMatched);
        if (allMatched) {
            game.setFinished(true);
            game.setSuccessful(true);
        } else if (game.getAttemptsLeft() <= 0) {
            game.setFinished(true);
            game.setSuccessful(false);
        }

        gameDao.save(game);

        res.setMatch(match);
        res.setAttemptsLeft(game.getAttemptsLeft());
        res.setFinished(game.isFinished());
        res.setSuccessful(game.getSuccessful());
        return res;
    }
}
