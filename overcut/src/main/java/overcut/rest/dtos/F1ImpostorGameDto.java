package overcut.rest.dtos;


import java.util.List;

public class F1ImpostorGameDto {

    private Long id;
    private String category;
    private String themeDescription;
    private boolean finished;
    private Boolean won;
    private List<F1ImpostorPilotDto> pilots;

    public F1ImpostorGameDto() {}

    public F1ImpostorGameDto(Long id, String category, String themeDescription,
                             boolean finished, Boolean won, List<F1ImpostorPilotDto> pilots) {
        this.id = id;
        this.category = category;
        this.themeDescription = themeDescription;
        this.finished = finished;
        this.won = won;
        this.pilots = pilots;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getThemeDescription() {
        return themeDescription;
    }

    public void setThemeDescription(String themeDescription) {
        this.themeDescription = themeDescription;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public Boolean getWon() {
        return won;
    }

    public void setWon(Boolean won) {
        this.won = won;
    }

    public List<F1ImpostorPilotDto> getPilots() {
        return pilots;
    }

    public void setPilots(List<F1ImpostorPilotDto> pilots) {
        this.pilots = pilots;
    }
}
