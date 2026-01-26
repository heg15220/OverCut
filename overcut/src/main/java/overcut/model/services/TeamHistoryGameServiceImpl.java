package overcut.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import overcut.model.entities.TeamHistoryGame;
import overcut.model.entities.TeamHistoryGameDao;
import overcut.model.entities.TeamHistorySeason;
import overcut.model.entities.TeamHistorySeasonDao;
import overcut.model.services.exceptions.CooldownException;

import overcut.rest.dtos.TeamHistoryConversor;
import overcut.rest.dtos.TeamHistoryGameDto;
import overcut.rest.dtos.ValidateTeamHistoryGuessRequest;
import overcut.rest.dtos.ValidateTeamHistoryGuessResponse;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
@Transactional
public class TeamHistoryGameServiceImpl implements TeamHistoryGameService {

    @Autowired private TeamHistoryGameDao gameDao;
    @Autowired private TeamHistorySeasonDao seasonDao;
    @Autowired private CooldownService cooldownService;

    private static final String COOLDOWN_KEY = "TeamHistoryGame";

    @Override
    public TeamHistoryGameDto startGame(String lang, Long userId) {
        try {
            // ✅ cooldown (idéntico a DriversConnections)
            if (!cooldownService.canPlay(COOLDOWN_KEY, userId)) {
                long wait = cooldownService.secondsUntilNextPlay(COOLDOWN_KEY, userId);
                throw new CooldownException("WAIT", wait);
            }

            // ✅ llamada FastAPI (idéntico esquema)
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/generate-team-history-game?lang=" + lang))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("FastAPI server error: " + response.body());
            }

            // ✅ parse JSON (idéntico esquema)
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.body());

            int constructorId = root.get("constructorId").asInt();
            String constructorName = root.get("constructorName").asText();
            int maxPosition = root.get("maxPosition").asInt();

            TeamHistoryGame game = new TeamHistoryGame();
            game.setConstructorId(constructorId);
            game.setConstructorName(constructorName);
            game.setLang(lang);
            game.setMaxPosition(maxPosition);
            game.setRevealed(false);
            game.setCompleted(false);

            game = gameDao.save(game);

            // seasons: [{seasonYear, finishingPosition}, ...]
            JsonNode seasonsNode = root.get("seasons");
            if (seasonsNode == null || !seasonsNode.isArray() || seasonsNode.isEmpty()) {
                throw new RuntimeException("FastAPI returned empty seasons for TeamHistoryGame");
            }

            for (JsonNode sNode : seasonsNode) {
                TeamHistorySeason s = new TeamHistorySeason();
                s.setGame(game);
                s.setSeasonYear(sNode.get("seasonYear").asInt());
                s.setFinishingPosition(sNode.get("finishingPosition").asInt());
                s.setUserGuess(null);
                s.setIsCorrect(null);
                seasonDao.save(s);
            }

          cooldownService.registerPlay(COOLDOWN_KEY, userId);

            List<TeamHistorySeason> seasons =
                    seasonDao.findByGame_GameIdOrderBySeasonYearAsc(game.getGameId());

            return TeamHistoryConversor.toGameDto(game, seasons, game.getConstructorName());

        } catch (CooldownException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error calling FastAPI TeamHistory generator", e);
        }
    }

    @Override
    @Transactional
    public TeamHistoryGameDto getGame(Long gameId) {
        TeamHistoryGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("TeamHistoryGame not found: " + gameId));

        List<TeamHistorySeason> seasons = seasonDao.findByGame_GameIdOrderBySeasonYearAsc(gameId);
        String name = game.isRevealed() ? game.getConstructorName() : null;

        return TeamHistoryConversor.toGameDto(game, seasons, name);
    }

    @Override
    public ValidateTeamHistoryGuessResponse validateGuess(ValidateTeamHistoryGuessRequest req) {
        TeamHistoryGame game = gameDao.findById(req.gameId)
                .orElseThrow(() -> new RuntimeException("Game not found: " + req.gameId));

        TeamHistorySeason season = seasonDao.findByGame_GameIdAndSeasonYear(req.gameId, req.seasonYear)
                .orElseThrow(() -> new RuntimeException("Season not found for year: " + req.seasonYear));

        if (season.getIsCorrect() != null) {
            return buildValidateResponse(game, season);
        }

        season.setUserGuess(req.guessPosition);

        boolean correct = req.guessPosition != null
                && req.guessPosition.equals(season.getFinishingPosition());

        season.setIsCorrect(correct);
        seasonDao.save(season);

        long total = seasonDao.countByGame_GameId(game.getGameId());
        long answered = seasonDao.findByGame_GameIdOrderBySeasonYearAsc(game.getGameId())
                .stream().filter(s -> s.getIsCorrect() != null).count();

        if (answered == total) {
            game.setCompleted(true);
            gameDao.save(game);
        }

        return buildValidateResponse(game, season);
    }

    private ValidateTeamHistoryGuessResponse buildValidateResponse(TeamHistoryGame game, TeamHistorySeason season) {
        ValidateTeamHistoryGuessResponse res = new ValidateTeamHistoryGuessResponse();
        res.valid = true;
        res.correct = Boolean.TRUE.equals(season.getIsCorrect());
        res.completed = game.isCompleted();
        return res;
    }

    @Override
    public TeamHistoryGameDto reveal(Long gameId) {
        TeamHistoryGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found: " + gameId));

        game.setRevealed(true);
        gameDao.save(game);
        return getGame(gameId);
    }
}
