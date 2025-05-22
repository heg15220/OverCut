package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class OrderDriverGame {
    private Long id;
    private String topic;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean finished = false;
    private Boolean successful;
    private List<OrderDriverSlot> slots = new ArrayList<>();

    public OrderDriverGame() {
    }

    public OrderDriverGame(String topic, LocalDateTime createdAt, boolean finished, Boolean successful,
                           List<OrderDriverSlot> slots) {
        this.topic = topic;
        this.createdAt = createdAt;
        this.finished = finished;
        this.successful = successful;
        this.slots = slots;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<OrderDriverSlot> getSlots() { return slots; }
    public void setSlots(List<OrderDriverSlot> slots) { this.slots = slots; }
}

