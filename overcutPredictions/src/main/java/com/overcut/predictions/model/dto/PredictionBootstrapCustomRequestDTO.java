package com.overcut.predictions.model.dto;

import java.util.List;
import java.util.Map;

public class PredictionBootstrapCustomRequestDTO {

    private Integer season;
    private Integer fromRound;

    // ✅ Datos custom para completar temporadas vacías/incompletas
    private List<CustomRaceDTO> customRaces;
    private List<CustomDriverDTO> customDrivers;
    private List<CustomConstructorDTO> customConstructors;

    // driverId -> constructorId (custom)
    private Map<Long, Long> customDriverToConstructor;

    public Integer getSeason() { return season; }
    public void setSeason(Integer season) { this.season = season; }

    public Integer getFromRound() { return fromRound; }
    public void setFromRound(Integer fromRound) { this.fromRound = fromRound; }

    public List<CustomRaceDTO> getCustomRaces() { return customRaces; }
    public void setCustomRaces(List<CustomRaceDTO> customRaces) { this.customRaces = customRaces; }

    public List<CustomDriverDTO> getCustomDrivers() { return customDrivers; }
    public void setCustomDrivers(List<CustomDriverDTO> customDrivers) { this.customDrivers = customDrivers; }

    public List<CustomConstructorDTO> getCustomConstructors() { return customConstructors; }
    public void setCustomConstructors(List<CustomConstructorDTO> customConstructors) { this.customConstructors = customConstructors; }

    public Map<Long, Long> getCustomDriverToConstructor() { return customDriverToConstructor; }
    public void setCustomDriverToConstructor(Map<Long, Long> customDriverToConstructor) { this.customDriverToConstructor = customDriverToConstructor; }
}
