package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class Top10Slot {

    private Long id;

    private Integer positionGame;

    private String filledByPilotName;

    private String correctPilotName;

    private String nationalityCode;

    private Top10Game game;

    public Top10Slot() {
    }

    public Top10Slot(Integer positionGame, String filledByPilotName, String correctPilotName,
                     String nationalityCode, Top10Game game) {
        this.positionGame = positionGame;
        this.filledByPilotName = filledByPilotName;
        this.correctPilotName = correctPilotName;
        this.nationalityCode = nationalityCode;
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

    public String getFilledByPilotName() {
        return filledByPilotName;
    }

    public void setFilledByPilotName(String filledByPilotName) {
        this.filledByPilotName = filledByPilotName;
    }

    public String getCorrectPilotName() {
        return correctPilotName;
    }

    public void setCorrectPilotName(String correctPilotName) {
        this.correctPilotName = correctPilotName;
    }

    public String getNationalityCode() {
        return nationalityCode;
    }

    public void setNationalityCode(String nationalityCode) {
        this.nationalityCode = nationalityCode;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public Top10Game getGame() {
        return game;
    }

    public void setGame(Top10Game game) {
        this.game = game;
    }

}

