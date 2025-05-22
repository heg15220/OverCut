package overcut.rest.dtos;

import java.time.LocalDateTime;

public class TikiTakaGameDto {
    private Long id;

    private String playerX;
    private String playerO;
    private String currentTurn; // "X" o "O"
    private String status; // "IN_PROGRESS", "X_WINS", "O_WINS", "DRAW"

    private LocalDateTime createdAt;

    public TikiTakaGameDto(Long id, String playerX, String playerO, String currentTurn, String status,
                           LocalDateTime createdAt) {
        this.id = id;
        this.playerX = playerX;
        this.playerO = playerO;
        this.currentTurn = currentTurn;
        this.status = status;
        this.createdAt = createdAt;
    }

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
}
