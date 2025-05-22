package overcut.rest.dtos;

import overcut.model.entities.TikiTakaGame;

import java.util.List;
import java.util.stream.Collectors;

public class TikiTakaGameDtoConversor {

    private TikiTakaGameDtoConversor(){

    }

    public static final TikiTakaGameDto toTikiTakaGameDto(TikiTakaGame tikiTakaGame) {
        return new TikiTakaGameDto(tikiTakaGame.getId(), tikiTakaGame.getPlayerX(), tikiTakaGame.getPlayerO(),
                tikiTakaGame.getCurrentTurn(), tikiTakaGame.getStatus(), tikiTakaGame.getCreatedAt());
    }

    public static final List<TikiTakaGameDto> toTikiTakaGameDtos(List<TikiTakaGame> tikiTakaGames) {
        return tikiTakaGames.stream().map(TikiTakaGameDtoConversor::toTikiTakaGameDto).collect(Collectors.toList());
    }
}
