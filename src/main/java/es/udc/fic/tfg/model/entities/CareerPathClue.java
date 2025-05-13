package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class CareerPathClue {

    private Long id;
    private CareerPathGame game;
    private String teamName;
    private int clueOrder;

    public CareerPathClue() {}

    public CareerPathClue(Long id, CareerPathGame game, String teamName, int clueOrder) {
        this.id = id;
        this.game = game;
        this.teamName = teamName;
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
    public CareerPathGame getGame() {
        return game;
    }

    public void setGame(CareerPathGame game) {
        this.game = game;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public int getClueOrder() {
        return clueOrder;
    }

    public void setClueOrder(int clueOrder) {
        this.clueOrder = clueOrder;
    }
}
