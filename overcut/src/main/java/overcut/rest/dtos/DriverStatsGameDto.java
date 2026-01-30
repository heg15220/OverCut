package overcut.rest.dtos;

import java.util.List;

public class DriverStatsGameDto {
    private Long id;
    private String driverName;
    private boolean finished;
    private Integer correctCount; // cuando finished
    private java.util.List<DriverStatsDetailDto> details; // opcional

    // getters/setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer correctCount) {
        this.correctCount = correctCount;
    }

    public List<DriverStatsDetailDto> getDetails() {
        return details;
    }

    public void setDetails(List<DriverStatsDetailDto> details) {
        this.details = details;
    }
}
