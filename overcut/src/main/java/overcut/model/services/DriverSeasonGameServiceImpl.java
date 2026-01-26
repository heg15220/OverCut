package overcut.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import overcut.model.entities.DriverSeasonGame;
import overcut.model.entities.DriverSeasonGameDao;
import overcut.model.entities.DriverSeasonRound;
import overcut.model.entities.DriverSeasonRoundDao;
import overcut.model.services.exceptions.CooldownException;
import overcut.rest.dtos.DriverSeasonConversor;
import overcut.rest.dtos.DriverSeasonGameDto;
import overcut.rest.dtos.ValidateDriverSeasonGuessRequest;
import overcut.rest.dtos.ValidateDriverSeasonGuessResponse;

import java.util.List;

@Service
@Transactional
public class DriverSeasonGameServiceImpl implements DriverSeasonGameService {

    private static final String COOLDOWN_KEY = "DriverSeasonGame";

    @Autowired
    private DriverSeasonGameDao gameDao;

    @Autowired
    private DriverSeasonRoundDao roundDao;

    @Autowired
    private CooldownService cooldownService;

    // Adaptador que llama a FastAPI
    private final DriverSeasonPythonAdapter pythonAdapter;

    public DriverSeasonGameServiceImpl(DriverSeasonPythonAdapter pythonAdapter) {
        this.pythonAdapter = pythonAdapter;
    }

    @Override
    public DriverSeasonGameDto startGame(String lang, Long userId) {
        // ✅ COOLDOWN: antes de crear partida
       if (!cooldownService.canPlay(COOLDOWN_KEY, userId)) {
            long wait = cooldownService.secondsUntilNextPlay(COOLDOWN_KEY, userId);
            throw new CooldownException("WAIT", wait);
        }

        DriverSeasonGeneratedData data = pythonAdapter.generate(lang);

        DriverSeasonGame game = new DriverSeasonGame();
        game.setDriverId(data.driverId);
        game.setDriverName(data.driverName);
        game.setSeasonYear(data.seasonYear);
        game.setLang(lang);
        game.setMaxPosition(data.maxPosition);
        game.setRevealed(false);
        game.setCompleted(false);
        game = gameDao.save(game);

        for (DriverSeasonGeneratedRound gr : data.rounds) {
            DriverSeasonRound r = new DriverSeasonRound();
            r.setGame(game);
            r.setRaceId(gr.raceId);
            r.setRoundNumber(gr.roundNumber);
            r.setCountry(gr.country);
            r.setRaceNameEn(gr.raceNameEn);
            r.setRaceNameEs(gr.raceNameEs);
            r.setFinishingPosition(gr.finishingPosition);
            // estado inicial
            r.setUserGuess(null);
            r.setIsCorrect(null);
            roundDao.save(r);
        }

        // ✅ registra play SOLO cuando ya se creó correctamente
        cooldownService.registerPlay(COOLDOWN_KEY, userId);

        List<DriverSeasonRound> rounds =
                roundDao.findByGame_GameIdOrderByRoundNumberAsc(game.getGameId());

        return DriverSeasonConversor.toGameDto(game, rounds, game.getDriverName());
    }

    @Override
    @Transactional(readOnly = true)
    public DriverSeasonGameDto getGame(Long gameId) {
        DriverSeasonGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("DriverSeasonGame not found: " + gameId));

        List<DriverSeasonRound> rounds =
                roundDao.findByGame_GameIdOrderByRoundNumberAsc(gameId);

        String driverName = game.isRevealed() ? game.getDriverName() : null;
        return DriverSeasonConversor.toGameDto(game, rounds, driverName);
    }

    @Override
    public ValidateDriverSeasonGuessResponse validateGuess(ValidateDriverSeasonGuessRequest req) {
        DriverSeasonGame game = gameDao.findById(req.gameId)
                .orElseThrow(() -> new RuntimeException("Game not found: " + req.gameId));

        DriverSeasonRound round = roundDao.findByGame_GameIdAndRaceId(req.gameId, req.raceId)
                .orElseThrow(() -> new RuntimeException("Round not found for raceId: " + req.raceId));

        // Si ya estaba respondida, devolvemos el estado actual
        if (round.getIsCorrect() != null) {
            return buildValidateResponse(game, round);
        }

        round.setUserGuess(req.guessPosition);

        boolean correct = req.guessPosition != null
                && req.guessPosition.equals(round.getFinishingPosition());

        round.setIsCorrect(correct);
        roundDao.save(round);

        // ¿completado?
        long total = roundDao.countByGame_GameId(game.getGameId());
        long answered = roundDao.findByGame_GameIdOrderByRoundNumberAsc(game.getGameId())
                .stream()
                .filter(r -> r.getIsCorrect() != null)
                .count();

        if (answered == total) {
            game.setCompleted(true);
            gameDao.save(game);
        }

        return buildValidateResponse(game, round);
    }

    private ValidateDriverSeasonGuessResponse buildValidateResponse(DriverSeasonGame game, DriverSeasonRound round) {
        ValidateDriverSeasonGuessResponse res = new ValidateDriverSeasonGuessResponse();
        res.valid = true;
        res.correct = Boolean.TRUE.equals(round.getIsCorrect());
        res.completed = game.isCompleted();
        return res;
    }

    @Override
    public DriverSeasonGameDto reveal(Long gameId) {
        DriverSeasonGame game = gameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found: " + gameId));

        game.setRevealed(true);
        gameDao.save(game);

        return getGame(gameId);
    }
}
