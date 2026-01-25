package overcut.rest.dtos;

import overcut.model.entities.MemoryCard;
import overcut.model.entities.MemoryGame;

import java.util.List;
import java.util.stream.Collectors;

public class MemoryGameConversor {

    private MemoryGameConversor() {}

    public static MemoryGameDto toDto(MemoryGame game) {
        MemoryGameDto dto = new MemoryGameDto();
        dto.setId(game.getId());
        dto.setRows(game.getRows());
        dto.setCols(game.getCols());
        dto.setMode(game.getMode());
        dto.setAttemptsLeft(game.getAttemptsLeft());
        dto.setFinished(game.isFinished());
        dto.setSuccessful(game.getSuccessful());

        List<MemoryCardDto> cards = game.getCards().stream().map(MemoryGameConversor::toCardDto).collect(Collectors.toList());
        dto.setCards(cards);

        return dto;
    }

    private static MemoryCardDto toCardDto(MemoryCard c) {
        MemoryCardDto dto = new MemoryCardDto();
        dto.setId(c.getId());
        dto.setPositionIndex(c.getPositionIndex());
        dto.setCardType(c.getCardType());
        dto.setLabel(c.getLabel());
        dto.setMatched(c.isMatched());
        return dto;
    }
}
