package overcut.rest.dtos;

public class QualiSlotDto {
    private Integer position;
    private String nationalityCode;
    private String filledByPilotId; // mismo naming que usas en board
    private String qualiTime;

    public QualiSlotDto(Integer position, String nationalityCode, String filledByPilotId, String qualiTime) {
        this.position = position;
        this.nationalityCode = nationalityCode;
        this.filledByPilotId = filledByPilotId;
        this.qualiTime = qualiTime;
    }

    public Integer getPosition() { return position; }
    public String getNationalityCode() { return nationalityCode; }
    public String getFilledByPilotId() { return filledByPilotId; }
    public String getQualiTime() { return qualiTime; }

    public void setPosition(Integer position) { this.position = position; }
    public void setNationalityCode(String nationalityCode) { this.nationalityCode = nationalityCode; }
    public void setFilledByPilotId(String filledByPilotId) { this.filledByPilotId = filledByPilotId; }
    public void setQualiTime(String qualiTime) { this.qualiTime = qualiTime; }
}
