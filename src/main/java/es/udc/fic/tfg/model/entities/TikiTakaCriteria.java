package es.udc.fic.tfg.model.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class TikiTakaCriteria {

    private Long id;

    private String axis; // "row" o "column"
    private int positionGame; // posición 1,2,3
    private String description; // Texto visible
    private String code; // Código

    public TikiTakaCriteria() {
    }

    public TikiTakaCriteria(String axis, int positionGame, String description, String code) {
        this.axis = axis;
        this.positionGame = positionGame;
        this.description = description;
        this.code = code;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
