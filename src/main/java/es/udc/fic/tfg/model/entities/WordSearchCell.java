package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class WordSearchCell {

    private Long id;


    private WordSearchGame game;

    private int rowIndex;
    private int colIndex;
    private char letter;

    private boolean revealed;

    public WordSearchCell() {
    }

    public WordSearchCell(WordSearchGame game, int rowIndex, int colIndex, char letter, boolean revealed) {
        this.game = game;
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.letter = letter;
        this.revealed = revealed;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne
    @JoinColumn(name = "gameId", nullable = false)
    public WordSearchGame getGame() {
        return game;
    }

    public void setGame(WordSearchGame game) {
        this.game = game;
    }

    public int getRowIndex() {
        return rowIndex;
    }

    public void setRowIndex(int rowIndex) {
        this.rowIndex = rowIndex;
    }

    public int getColIndex() {
        return colIndex;
    }

    public void setColIndex(int colIndex) {
        this.colIndex = colIndex;
    }

    public char getLetter() {
        return letter;
    }

    public void setLetter(char letter) {
        this.letter = letter;
    }

    public boolean isRevealed() {
        return revealed;
    }

    public void setRevealed(boolean revealed) {
        this.revealed = revealed;
    }
}
