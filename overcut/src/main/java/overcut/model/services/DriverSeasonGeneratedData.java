package overcut.model.services;


import java.util.List;

public class DriverSeasonGeneratedData {
    public int driverId;
    public String driverName;   // ✅ NUEVO
    public int seasonYear;
    public int maxPosition;
    public List<DriverSeasonGeneratedRound> rounds;
}

