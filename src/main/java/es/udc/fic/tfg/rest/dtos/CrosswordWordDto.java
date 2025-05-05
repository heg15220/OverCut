package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.CrosswordCell;
import es.udc.fic.tfg.model.entities.CrosswordGame;
import es.udc.fic.tfg.model.entities.Direction;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.util.List;

public class CrosswordWordDto {
    private Long id;

    private Long gameId;

    private String word;        // Solución (ej: "ALONSO")
    private String clue;        // Pista (ej: "Campeón español de F1")
    private int row;            // Fila de inicio (0-indexed)
    private int col;            // Columna de inicio (0-indexed)

    private Direction direction;


    private List<CrosswordCellWordLinkDto> cellLinks;

    public CrosswordWordDto() {
    }

    public CrosswordWordDto(Long id, Long gameId, String word, String clue, int row, int col,
                            Direction direction, List<CrosswordCellWordLinkDto> cellLinks) {
        this.id = id;
        this.gameId = gameId;
        this.word = word;
        this.clue = clue;
        this.row = row;
        this.col = col;
        this.direction = direction;
        this.cellLinks = cellLinks;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getClue() {
        return clue;
    }

    public void setClue(String clue) {
        this.clue = clue;
    }

    public int getRow() {
        return row;
    }

    public void setRow(int row) {
        this.row = row;
    }

    public int getCol() {
        return col;
    }

    public void setCol(int col) {
        this.col = col;
    }

    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }

    public List<CrosswordCellWordLinkDto> getCellLinks() {
        return cellLinks;
    }

    public void setCellLinks(List<CrosswordCellWordLinkDto> cellLinks) {
        this.cellLinks = cellLinks;
    }
}
