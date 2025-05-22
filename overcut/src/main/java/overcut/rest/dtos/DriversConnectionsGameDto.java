package overcut.rest.dtos;


import java.time.LocalDateTime;
import java.util.List;

public class DriversConnectionsGameDto {
    private Long id;
    private LocalDateTime createdAt;
    private boolean finished;
    private List<DriversConnectionsCategoryDto> categories;

    public DriversConnectionsGameDto() {}

    public DriversConnectionsGameDto(Long id, LocalDateTime createdAt, boolean finished,
                                     List<DriversConnectionsCategoryDto> categories) {
        this.id = id;
        this.createdAt = createdAt;
        this.finished = finished;
        this.categories = categories;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public List<DriversConnectionsCategoryDto> getCategories() {
        return categories;
    }

    public void setCategories(List<DriversConnectionsCategoryDto> categories) {
        this.categories = categories;
    }
}

