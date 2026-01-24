package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class TimelineEvent {

    private Long id;

    private String eventCode;
    private String eventText;

    private LocalDate eventDate;
    private Integer hintYear;

    private TimelineGame game;

    public TimelineEvent() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventCode() { return eventCode; }
    public void setEventCode(String eventCode) { this.eventCode = eventCode; }

    public String getEventText() { return eventText; }
    public void setEventText(String eventText) { this.eventText = eventText; }

    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

    public Integer getHintYear() { return hintYear; }
    public void setHintYear(Integer hintYear) { this.hintYear = hintYear; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public TimelineGame getGame() { return game; }
    public void setGame(TimelineGame game) { this.game = game; }
}
