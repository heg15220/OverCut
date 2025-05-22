package overcut.rest.dtos;

import java.util.List;

public class WordSearchGameDto {
    private Long id;
    private String theme;
    private List<WordSearchCellDto> grid;
    private List<WordSearchWordDto> words;
    private boolean finished;
    private Boolean successful;

    public WordSearchGameDto() {}

    public WordSearchGameDto(Long id, String theme,
                             List<WordSearchCellDto> grid,
                             List<WordSearchWordDto> words,
                             boolean finished, Boolean successful) {
        this.id = id;
        this.theme = theme;
        this.grid = grid;
        this.words = words;
        this.finished = finished;
        this.successful = successful;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public List<WordSearchCellDto> getGrid() { return grid; }
    public void setGrid(List<WordSearchCellDto> grid) { this.grid = grid; }

    public List<WordSearchWordDto> getWords() { return words; }
    public void setWords(List<WordSearchWordDto> words) { this.words = words; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getSuccessful() { return successful; }
    public void setSuccessful(Boolean successful) { this.successful = successful; }
}
