package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class Podium {
    private Long id;
    private String winner;
    private String date;
    private String teamWinner;
    private String secondPlace;
    private String thirdPlace;
    private String image;
    private Circuit circuit;

    public Podium(){

    }

    public Podium(String winner, String date, String teamWinner,
                  String secondPlace, String thirdPlace, String image, Circuit circuit) {
        this.winner = winner;
        this.date = date;
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

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
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
