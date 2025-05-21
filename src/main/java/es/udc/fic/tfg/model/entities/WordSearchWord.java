package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class WordSearchWord {

    private Long id;


    private WordSearchGame game;

    private Long driverId;
    private String surname;
    private int startRow;
    private int startCol;
    private String direction; // "RIGHT", "LEFT", "UP", "DOWN", "DIAG_UP", etc.
    private boolean revealed;

    public WordSearchWord() {
    }

    public WordSearchWord(WordSearchGame game, Long driverId, String surname, int startRow, int startCol,
                          String direction, boolean revealed) {
        this.game = game;
        this.driverId = driverId;
        this.surname = surname;
        this.startRow = startRow;
        this.startCol = startCol;
        this.direction = direction;
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

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public int getStartRow() {
        return startRow;
    }

    public void setStartRow(int startRow) {
        this.startRow = startRow;
    }

    public int getStartCol() {
        return startCol;
    }

    public void setStartCol(int startCol) {
        this.startCol = startCol;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public boolean isRevealed() {
        return revealed;
    }

    public void setRevealed(boolean revealed) {
        this.revealed = revealed;
    }
}
