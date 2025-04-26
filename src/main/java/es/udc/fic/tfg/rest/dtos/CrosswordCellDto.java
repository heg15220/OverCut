package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.CrosswordWord;

public class CrosswordCellDto {

    private Long id;

    private Long wordId;

    private char letter;             // Letra correcta de la solución
    private int positionCell;        // Posición dentro de la palabra (0-indexed)

    private boolean filled = false;  // ¿El usuario ya la ha rellenado?
    private Character userInput;     // Letra introducida por el usuario (puede ser null)



    public CrosswordCellDto() {
    }

    public CrosswordCellDto(Long id, Long wordId, char letter, int positionCell, boolean filled, Character userInput) {
        this.id = id;
        this.wordId = wordId;
        this.letter = letter;
        this.positionCell = positionCell;
        this.filled = filled;
        this.userInput = userInput;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWordId() {
        return wordId;
    }

    public void setWordId(Long wordId) {
        this.wordId = wordId;
    }

    public char getLetter() {
        return letter;
    }

    public void setLetter(char letter) {
        this.letter = letter;
    }

    public int getPositionCell() {
        return positionCell;
    }

    public void setPositionCell(int positionCell) {
        this.positionCell = positionCell;
    }

    public boolean isFilled() {
        return filled;
    }

    public void setFilled(boolean filled) {
        this.filled = filled;
    }

    public Character getUserInput() {
        return userInput;
    }

    public void setUserInput(Character userInput) {
        this.userInput = userInput;
    }
}
