package es.udc.fic.tfg.rest.dtos;

public class TikiTakaCriteriaDto {
    private Long id;

    private String axis; // "row" o "column"
    private int positionGame; // posición 1,2,3
    private String description; // Texto visible
    private String code; // Código

    public TikiTakaCriteriaDto(Long id, String axis, int positionGame, String description, String code) {
        this.id = id;
        this.axis = axis;
        this.positionGame = positionGame;
        this.description = description;
        this.code = code;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAxis() {
        return axis;
    }

    public void setAxis(String axis) {
        this.axis = axis;
    }

    public int getPositionGame() {
        return positionGame;
    }

    public void setPositionGame(int positionGame) {
        this.positionGame = positionGame;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
