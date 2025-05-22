package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class CrosswordCellWordLink {


    private Long id;


    private CrosswordCell cell;


    private CrosswordWord word;

    private int positionCell; // posición relativa dentro de la palabra


    public CrosswordCellWordLink() {
    }

    public CrosswordCellWordLink(CrosswordCell cell, CrosswordWord word, int positionCell) {
        this.cell = cell;
        this.word = word;
        this.positionCell = positionCell;
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
    @JoinColumn(name = "cellId")
    public CrosswordCell getCell() {
        return cell;
    }

    public void setCell(CrosswordCell cell) {
        this.cell = cell;
    }

    @ManyToOne
    @JoinColumn(name = "wordId")
    public CrosswordWord getWord() {
        return word;
    }

    public void setWord(CrosswordWord word) {
        this.word = word;
    }

    public int getPositionCell() {
        return positionCell;
    }

    public void setPositionCell(int positionCell) {
        this.positionCell = positionCell;
    }
}
