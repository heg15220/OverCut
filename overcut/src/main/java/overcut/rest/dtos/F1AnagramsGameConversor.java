package overcut.rest.dtos;

import overcut.model.entities.F1AnagramsGame;
import overcut.model.entities.F1AnagramsRound;

import java.util.Comparator;
import java.util.stream.Collectors;
public class F1AnagramsGameConversor {

    public static F1AnagramsGameDto toDto(F1AnagramsGame game) {
        F1AnagramsGameDto dto = new F1AnagramsGameDto();
        dto.setId(game.getId());
        dto.setFinished(game.isFinished());
        dto.setSuccessful(game.getSuccessful());
        dto.setCurrentRound(game.getCurrentRound());
        dto.setTotalRounds(6);

        dto.setRounds(
                game.getRounds().stream()
                        .sorted(Comparator.comparingInt(F1AnagramsRound::getRoundOrder))
                        .map(r -> {
                            F1AnagramsRoundDto rdto = new F1AnagramsRoundDto();
                            rdto.setRoundOrder(r.getRoundOrder());
                            rdto.setFinished(r.isFinished());
                            rdto.setSuccessful(r.getSuccessful());
                            rdto.setScrambled(r.getScrambled());
                            rdto.setLength(r.getScrambled() != null ? r.getScrambled().length() : 0);

                            // ✅ no spoiler: surname solo si esa ronda terminó
                            rdto.setSurname(r.isFinished() ? r.getSurname() : null);

                            rdto.setAttempts(
                                    r.getAttempts().stream()
                                            .map(a -> new F1AnagramsAttemptDto(a.getGuess(), a.getAttemptOrder(), a.isCorrect()))
                                            .sorted(Comparator.comparingInt(F1AnagramsAttemptDto::getAttemptOrder))
                                            .collect(Collectors.toList())
                            );

                            return rdto;
                        })
                        .collect(Collectors.toList())
        );

        return dto;
    }
}
