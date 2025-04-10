package es.udc.fic.tfg.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class TikiTakaGameBoardDto {

    private Long id;
    private String playerX;
    private String playerO;
    private String currentTurn;
    private String status;
    private LocalDateTime createdAt;
    private List<TikiTakaCellDto> cells;
    private List<TikiTakaCriteriaDto> rowCriteria;
    private List<TikiTakaCriteriaDto> columnCriteria;

    public TikiTakaGameBoardDto(Long id, String playerX, String playerO, String currentTurn,
                                String status, LocalDateTime createdAt, List<TikiTakaCellDto> cells,
                                List<TikiTakaCriteriaDto> rowCriteria, List<TikiTakaCriteriaDto> columnCriteria) {
        this.id = id;
        this.playerX = playerX;
        this.playerO = playerO;
        this.currentTurn = currentTurn;
        this.status = status;
        this.createdAt = createdAt;
        this.cells = cells;
        this.rowCriteria = rowCriteria;
        this.columnCriteria = columnCriteria;
    }

    public Long getId() { return id; }
    public String getPlayerX() { return playerX; }
    public String getPlayerO() { return playerO; }
    public String getCurrentTurn() { return currentTurn; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<TikiTakaCellDto> getCells() { return cells; }
    public List<TikiTakaCriteriaDto> getRowCriteria() { return rowCriteria; }
    public List<TikiTakaCriteriaDto> getColumnCriteria() { return columnCriteria; }
}
