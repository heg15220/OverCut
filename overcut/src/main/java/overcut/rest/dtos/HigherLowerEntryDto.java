package overcut.rest.dtos;

public class HigherLowerEntryDto {
    private int positionIndex;
    private String pilotName;
    private double statValue;

    public HigherLowerEntryDto() {}

    public HigherLowerEntryDto(int positionIndex, String pilotName, double statValue) {
        this.positionIndex = positionIndex;
        this.pilotName = pilotName;
        this.statValue = statValue;
    }

    public int getPositionIndex() { return positionIndex; }
    public void setPositionIndex(int positionIndex) { this.positionIndex = positionIndex; }

    public String getPilotName() { return pilotName; }
    public void setPilotName(String pilotName) { this.pilotName = pilotName; }

    public double getStatValue() { return statValue; }
    public void setStatValue(double statValue) { this.statValue = statValue; }
}
