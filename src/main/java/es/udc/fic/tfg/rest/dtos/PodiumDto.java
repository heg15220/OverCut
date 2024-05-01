package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Circuit;
import jakarta.persistence.Lob;

public class PodiumDto {
    private Long id;
    private String winner;
    private String teamWinner;
    private String secondPlace;
    private String thirdPlace;
    @Lob
    private byte[] image;
    private Long circuitId;

    public PodiumDto(Long id, String winner, String teamWinner, String secondPlace, String thirdPlace, byte[] image,
                     Long circuitId) {
        this.id = id;
        this.winner = winner;
        this.teamWinner = teamWinner;
        this.secondPlace = secondPlace;
        this.thirdPlace = thirdPlace;
        this.image = image;
        this.circuitId = circuitId;
    }

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

    public Long getCircuitId() {
        return circuitId;
    }

    public void setCircuitId(Long circuitId) {
        this.circuitId = circuitId;
    }
}

