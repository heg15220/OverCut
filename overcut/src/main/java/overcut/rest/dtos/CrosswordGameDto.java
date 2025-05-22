package overcut.rest.dtos;

import java.util.List;

public class CrosswordGameDto {
    private Long id;
    private int rows;
    private int cols;
    private List<CrosswordWordDto> words;

    public CrosswordGameDto() {
    }

    public CrosswordGameDto(Long id, int rows, int cols, List<CrosswordWordDto> words) {
        this.id = id;
        this.rows = rows;
        this.cols = cols;
        this.words = words;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getRows() {
        return rows;
    }

    public void setRows(int rows) {
        this.rows = rows;
    }

    public int getCols() {
        return cols;
    }

    public void setCols(int cols) {
        this.cols = cols;
    }


    public List<CrosswordWordDto> getWords() {
        return words;
    }

    public void setWords(List<CrosswordWordDto> words) {
        this.words = words;
    }
}
