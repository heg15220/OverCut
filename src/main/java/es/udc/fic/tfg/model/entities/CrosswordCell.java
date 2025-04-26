package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class CrosswordCell {

    private Long id;

    private CrosswordWord word;

    private char letter;             // Letra correcta de la solución
    private int positionCell;        // Posición dentro de la palabra (0-indexed)

    private boolean filled = false;  // ¿El usuario ya la ha rellenado?
    private Character userInput;     // Letra introducida por el usuario (puede ser null)

    public CrosswordCell() {
    }

    public CrosswordCell(CrosswordWord word, char letter, int positionCell, boolean filled, Character userInput) {
        this.word = word;
        this.letter = letter;
        this.positionCell = positionCell;
        this.filled = filled;
        this.userInput = userInput;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wordId", nullable = false)
    public CrosswordWord getWord() {
        return word;
    }

    public void setWord(CrosswordWord word) {
        this.word = word;
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
