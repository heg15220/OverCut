package overcut.rest.dtos;

import java.util.List;

public class BingoGameDto {

    private Long id;
    private boolean finished;
    private int durationSeconds;

    private List<BingoCellDto> cells;
    private List<BingoDriverDto> driversQueue;
    private List<BingoSelectionDto> selections;

    public BingoGameDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public List<BingoCellDto> getCells() { return cells; }
    public void setCells(List<BingoCellDto> cells) { this.cells = cells; }

    public List<BingoDriverDto> getDriversQueue() { return driversQueue; }
    public void setDriversQueue(List<BingoDriverDto> driversQueue) { this.driversQueue = driversQueue; }

    public List<BingoSelectionDto> getSelections() { return selections; }
    public void setSelections(List<BingoSelectionDto> selections) { this.selections = selections; }
}
