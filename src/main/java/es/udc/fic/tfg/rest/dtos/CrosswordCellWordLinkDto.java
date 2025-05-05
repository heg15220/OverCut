package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.CrosswordCell;
import es.udc.fic.tfg.model.entities.CrosswordWord;

public class CrosswordCellWordLinkDto {

    private Long id;


    private Long cellId;


    private Long wordId;

    private int positionCell; // posición relativa dentro de la palabra

    public CrosswordCellWordLinkDto(Long id, Long cellId, Long wordId, int positionCell) {
        this.id = id;
        this.cellId = cellId;
        this.wordId = wordId;
        this.positionCell = positionCell;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCellId() {
        return cellId;
    }

    public void setCellId(Long cellId) {
        this.cellId = cellId;
    }

    public Long getWordId() {
        return wordId;
    }

    public void setWordId(Long wordId) {
        this.wordId = wordId;
    }

    public int getPositionCell() {
        return positionCell;
    }

    public void setPositionCell(int positionCell) {
        this.positionCell = positionCell;
    }
}
