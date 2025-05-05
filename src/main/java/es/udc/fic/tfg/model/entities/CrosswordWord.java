package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.util.Collections;
import java.util.List;

@Entity
public class CrosswordWord {

    private Long id;

    private CrosswordGame game;

    private String word;        // Solución (ej: "ALONSO")
    private String clue;        // Pista (ej: "Campeón español de F1")
    private int rowIndex;            // Fila de inicio (0-indexed)
    private int col;            // Columna de inicio (0-indexed)

    private Direction direction;

    private List<CrosswordCellWordLink> cellLinks;

    public CrosswordWord() {
    }

    public CrosswordWord(CrosswordGame game, String word, String clue, int row, int col, Direction direction) {
        this.game = game;
        this.word = word;
        this.clue = clue;
        this.rowIndex  = row;
        this.col = col;
        this.direction = direction;
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
    @JoinColumn(name = "gameId", nullable = false)
    public CrosswordGame getGame() {
        return game;
    }

    public void setGame(CrosswordGame game) {
        this.game = game;
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

    public int getRowIndex() {
        return rowIndex;
    }

    public void setRowIndex(int rowIndex) {
        this.rowIndex = rowIndex;
    }

    public int getCol() {
        return col;
    }

    public void setCol(int col) {
        this.col = col;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }

    @OneToMany(mappedBy = "word", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<CrosswordCellWordLink> getCellLinks() {
        return cellLinks;
    }

    public void setCellLinks(List<CrosswordCellWordLink> cellLinks) {
        this.cellLinks = cellLinks;
    }

    @Transient
    public List<CrosswordCell> getCrosswordCellsFromLinks() {
        if (cellLinks == null) return Collections.emptyList();
        return cellLinks.stream()
                .map(CrosswordCellWordLink::getCell)
                .toList();
    }

}
