package es.udc.fic.tfg.model.entities;


import java.io.Serializable;

public class VictoryStats implements Serializable {
    private Long circuitId;
    private String circuitName; // Nuevo campo para el nombre del circuito
    private String teamWinner;
    private long victories; // Cambiado de int a long

    public VictoryStats() {
    }

    public VictoryStats(Long circuitId, String circuitName, String teamWinner, long victories) {
        this.circuitId = circuitId;
        this.circuitName = circuitName;
        this.teamWinner = teamWinner;
        this.victories = victories;
    }

    // Getters y setters
    public Long getCircuitId() {
        return circuitId;
    }

    public void setCircuitId(Long circuitId) {
        this.circuitId = circuitId;
    }

    public String getCircuitName() {
        return circuitName;
    }

    public void setCircuitName(String circuitName) {
        this.circuitName = circuitName;
    }

    public String getTeamWinner() {
        return teamWinner;
    }

    public void setTeamWinner(String teamWinner) {
        this.teamWinner = teamWinner;
    }

    public long getVictories() { // Getter cambiado a long
        return victories;
    }

    public void setVictories(long victories) { // Setter cambiado a long
        this.victories = victories;
    }
}
