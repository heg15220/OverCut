package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class GridSlot {


    private Long id;

    private Integer positionGame;

    private String nationalityCode;

    private String filledByPilotId; // ID del piloto en la base F1


    private GridGame game;

    public GridSlot() {
    }

    public GridSlot(Integer position, String nationalityCode, String filledByPilotId, GridGame game) {
        this.positionGame = position;
        this.nationalityCode = nationalityCode;
        this.filledByPilotId = filledByPilotId;
        this.game = game;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getPositionGame() {
        return positionGame;
    }

    public void setPositionGame(Integer positionGame) {
        this.positionGame = positionGame;
    }

    public String getNationalityCode() {
        return nationalityCode;
    }

    public void setNationalityCode(String nationalityCode) {
        this.nationalityCode = nationalityCode;
    }

    public String getFilledByPilotId() {
        return filledByPilotId;
    }

    public void setFilledByPilotId(String filledByPilotId) {
        this.filledByPilotId = filledByPilotId;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public GridGame getGame() {
        return game;
    }

    public void setGame(GridGame game) {
        this.game = game;
    }
}
