package es.udc.fic.tfg.rest.dtos;

import java.io.Serializable;

public class PilotVIctoryStatsDto  implements Serializable {
    private static final long serialVersionUID = -1L;

    private Long circuitId;
    private String pilotName;
    private Long victories;

    public PilotVIctoryStatsDto() {
    }

    public PilotVIctoryStatsDto(Long circuitId,String pilotName, Long victories) {
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
