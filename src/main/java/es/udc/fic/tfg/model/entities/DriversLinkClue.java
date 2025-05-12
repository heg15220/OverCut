package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class DriversLinkClue {

    private Long id;

    private DriversLinkGame game;

    private String teammateName;
    private Long teammateDriverId;
    private int clueOrder;

    public DriversLinkClue() {
    }

    public DriversLinkClue(Long id, DriversLinkGame game, String teammateName, Long teammateDriverId, int clueOrder) {
        this.id = id;
        this.game = game;
        this.teammateName = teammateName;
        this.teammateDriverId = teammateDriverId;
        this.clueOrder = clueOrder;
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
    public DriversLinkGame getGame() {
        return game;
    }

    public void setGame(DriversLinkGame game) {
        this.game = game;
    }

    public String getTeammateName() {
        return teammateName;
    }

    public void setTeammateName(String teammateName) {
        this.teammateName = teammateName;
    }

    public Long getTeammateDriverId() {
        return teammateDriverId;
    }

    public void setTeammateDriverId(Long teammateDriverId) {
        this.teammateDriverId = teammateDriverId;
    }

    public int getClueOrder() {
        return clueOrder;
    }

    public void setClueOrder(int clueOrder) {
        this.clueOrder = clueOrder;
    }
}
