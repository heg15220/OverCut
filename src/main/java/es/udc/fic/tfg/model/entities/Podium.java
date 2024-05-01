package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class Podium {
    private Long id;
    private String winner;
    private String teamWinner;
    private String secondPlace;
    private String thirdPlace;
    @Lob
    private byte[] image;
    private Circuit circuit;

    public Podium(){

    }
    public Podium(String winner, String teamWinner, String secondPlace, String thirdPlace, byte[] image, Circuit circuit) {
        this.winner = winner;
        this.teamWinner = teamWinner;
        this.secondPlace = secondPlace;
        this.thirdPlace = thirdPlace;
        this.image = image;
        this.circuit = circuit;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getWinner() {
        return winner;
    }

    public void setWinner(String winner) {
        this.winner = winner;
    }

    public String getTeamWinner() {
        return teamWinner;
    }

    public void setTeamWinner(String teamWinner) {
        this.teamWinner = teamWinner;
    }

    public String getSecondPlace() {
        return secondPlace;
    }

    public void setSecondPlace(String secondPlace) {
        this.secondPlace = secondPlace;
    }

    public String getThirdPlace() {
        return thirdPlace;
    }

    public void setThirdPlace(String thirdPlace) {
        this.thirdPlace = thirdPlace;
    }

    public byte[] getImage() {
        return image;
    }

    public void setImage(byte[] image) {
        this.image = image;
    }

    @ManyToOne
    @JoinColumn(name = "circuitId")
    public Circuit getCircuit() {
        return circuit;
    }

    public void setCircuit(Circuit circuit) {
        this.circuit = circuit;
    }
}
