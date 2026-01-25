package overcut.rest.dtos;

import java.util.List;

public class HigherLowerGameDto {
    private Long id;
    private String statCode;
    private String themeDescription;
    private boolean finished;
    private Boolean won;
    private int currentIndex;
    private int score;
    private List<HigherLowerEntryDto> entries;

    public HigherLowerGameDto() {}

    public HigherLowerGameDto(Long id, String statCode, String themeDescription, boolean finished, Boolean won,
                              int currentIndex, int score, List<HigherLowerEntryDto> entries) {
        this.id = id;
        this.statCode = statCode;
        this.themeDescription = themeDescription;
        this.finished = finished;
        this.won = won;
        this.currentIndex = currentIndex;
        this.score = score;
        this.entries = entries;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStatCode() { return statCode; }
    public void setStatCode(String statCode) { this.statCode = statCode; }

    public String getThemeDescription() { return themeDescription; }
    public void setThemeDescription(String themeDescription) { this.themeDescription = themeDescription; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getWon() { return won; }
    public void setWon(Boolean won) { this.won = won; }

    public int getCurrentIndex() { return currentIndex; }
    public void setCurrentIndex(int currentIndex) { this.currentIndex = currentIndex; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public List<HigherLowerEntryDto> getEntries() { return entries; }
    public void setEntries(List<HigherLowerEntryDto> entries) { this.entries = entries; }
}
