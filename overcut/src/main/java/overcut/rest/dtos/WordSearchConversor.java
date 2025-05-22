package overcut.rest.dtos;

import overcut.model.entities.WordSearchGame;

import java.util.List;
import java.util.stream.Collectors;

public class WordSearchConversor {

    private WordSearchConversor() {}

    public static WordSearchGameDto toDto(WordSearchGame game) {
        List<WordSearchCellDto> cells = game.getCells().stream()
                .map(cell -> new WordSearchCellDto(
                        cell.getRowIndex(),
                        cell.getColIndex(),
                        cell.getLetter(),
                        cell.isRevealed()
                ))
                .collect(Collectors.toList());

        List<WordSearchWordDto> words = game.getWords().stream()
                .map(word -> new WordSearchWordDto(
                        word.getSurname(), word.getDriverId(),
                        word.getStartRow(), word.getStartCol(),
                        word.getDirection(), word.isRevealed()  // Pasamos "revealed" también
                ))
                .collect(Collectors.toList());

        return new WordSearchGameDto(
                game.getId(), game.getTheme(), cells, words,
                game.isFinished(), game.getSuccessful()
        );
    }
}
