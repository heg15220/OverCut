package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public class TikiTakaGame {

    private Long id;

    private String playerX;
    private String playerO;
    private String currentTurn; // "X" o "O"
    private String status; // "IN_PROGRESS", "X_WINS", "O_WINS", "DRAW"

    private LocalDateTime createdAt;

    private Integer sinceYear;
    private Integer endYear;

    private List<TikiTakaCell> cells;

    public TikiTakaGame() {
    }

    public TikiTakaGame(String playerX, String playerO, String currentTurn, String status, LocalDateTime createdAt,List<TikiTakaCell> cells) {
        this.playerX = playerX;
        this.playerO = playerO;
        this.currentTurn = currentTurn;
        this.status = status;
        this.createdAt = createdAt;
        this.cells = cells;
    }

    public TikiTakaGame(String playerX, String playerO, String currentTurn, String status,
                        LocalDateTime createdAt, Integer sinceYear, Integer endYear, List<TikiTakaCell> cells) {
        this.playerX = playerX;
        this.playerO = playerO;
        this.currentTurn = currentTurn;
        this.status = status;
        this.createdAt = createdAt;
        this.sinceYear = sinceYear;
        this.endYear = endYear;
        this.cells = cells;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPlayerX() {
        return playerX;
    }

    public void setPlayerX(String playerX) {
        this.playerX = playerX;
    }

    public String getPlayerO() {
        return playerO;
    }

    public void setPlayerO(String playerO) {
        this.playerO = playerO;
    }

    public String getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(String currentTurn) {
        this.currentTurn = currentTurn;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getSinceYear() {
        return sinceYear;
    }

    public void setSinceYear(Integer sinceYear) {
        this.sinceYear = sinceYear;
    }

    public Integer getEndYear() {
        return endYear;
    }

    public void setEndYear(Integer endYear) {
        this.endYear = endYear;
    }


    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    public List<TikiTakaCell> getCells() {
        return cells;
    }

    public void setCells(List<TikiTakaCell> cells) {
        this.cells = cells;
    }
}
