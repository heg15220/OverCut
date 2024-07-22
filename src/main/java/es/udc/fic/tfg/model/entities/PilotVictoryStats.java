package es.udc.fic.tfg.model.entities;

import java.io.Serializable;

public class PilotVictoryStats implements Serializable {
    private Long circuitId;
    private String pilotName;
    private Long victories;

    public PilotVictoryStats(Long circuitId,String pilotName, Long victories) {
        this.circuitId = circuitId;
        this.pilotName = pilotName;
        this.victories = victories;
    }

    public Long getCircuitId() {
        return circuitId;
    }

    public void setCircuitId(Long circuitId) {
        this.circuitId = circuitId;
    }

    public String getPilotName() {
        return pilotName;
    }

    public void setPilotName(String pilotName) {
        this.pilotName = pilotName;
    }

    public Long getVictories() {
        return victories;
    }

    public void setVictories(Long victories) {
        this.victories = victories;
    }
}
