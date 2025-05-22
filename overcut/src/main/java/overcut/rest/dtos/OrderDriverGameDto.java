package overcut.rest.dtos;


import java.time.LocalDateTime;
import java.util.List;

public class OrderDriverGameDto {

    private Long id;
    private String topic;
    private LocalDateTime createdAt;
    private boolean finished;
    private Boolean successful;
    private List<OrderDriverSlotDto> slots;

    public OrderDriverGameDto() {}

    public OrderDriverGameDto(Long id, String topic, LocalDateTime createdAt,
                              boolean finished, Boolean successful, List<OrderDriverSlotDto> slots) {
        this.id = id;
        this.topic = topic;
        this.createdAt = createdAt;
        this.finished = finished;
        this.successful = successful;
        this.slots = slots;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getSuccessful() { return successful; }
    public void setSuccessful(Boolean successful) { this.successful = successful; }

    public List<OrderDriverSlotDto> getSlots() { return slots; }
    public void setSlots(List<OrderDriverSlotDto> slots) { this.slots = slots; }
}
