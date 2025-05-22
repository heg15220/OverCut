package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class TikiTakaCell {

    private Long id;

    private TikiTakaGame game;

    private int rowGame;
    private int columnGame;
    private String filledBy; // "X", "O" o null
    private String piloto;
    private boolean isValid;

    public TikiTakaCell() {
    }

    public TikiTakaCell(TikiTakaGame game, int row, int column, String filledBy, String piloto, boolean isValid) {
        this.game = game;
        this.rowGame = row;
        this.columnGame = column;
        this.filledBy = filledBy;
        this.piloto = piloto;
        this.isValid = isValid;
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
    @JoinColumn(name = "gameId")
    public TikiTakaGame getGame() {
        return game;
    }

    public void setGame(TikiTakaGame game) {
        this.game = game;
    }

    public int getRowGame() {
        return rowGame;
    }

    public void setRowGame(int rowGame) {
        this.rowGame = rowGame;
    }

    public int getColumnGame() {
        return columnGame;
    }

    public void setColumnGame(int columnGame) {
        this.columnGame = columnGame;
    }

    public String getFilledBy() {
        return filledBy;
    }

    public void setFilledBy(String filledBy) {
        this.filledBy = filledBy;
    }

    public String getPiloto() {
        return piloto;
    }

    public void setPiloto(String piloto) {
        this.piloto = piloto;
    }

    @Column(name = "isValid")
    public boolean isValid() {
        return isValid;
    }

    public void setValid(boolean valid) {
        isValid = valid;
    }
}
