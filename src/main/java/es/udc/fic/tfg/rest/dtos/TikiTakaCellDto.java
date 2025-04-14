package es.udc.fic.tfg.rest.dtos;

public class TikiTakaCellDto {

    private Long id;
    private int rowGame;
    private int columnGame;
    private String filledBy; // "X" | "O" | null
    private String piloto;   // Nombre del piloto si existe
    private boolean valid;   // Si cumplió criterios

    public TikiTakaCellDto(Long id, int rowGame, int columnGame, String filledBy, String piloto, boolean valid) {
        this.id = id;
        this.rowGame = rowGame;
        this.columnGame = columnGame;
        this.filledBy = filledBy;
        this.piloto = piloto;
        this.valid = valid;
    }

    public Long getId() {
        return id;
    }

    public int getRowGame() {
        return rowGame;
    }

    public int getColumnGame() {
        return columnGame;
    }

    public String getFilledBy() {
        return filledBy;
    }

    public String getPiloto() {
        return piloto;
    }

    public boolean isValid() {
        return valid;
    }
}
