package overcut.model.entities;

import jakarta.persistence.*;

import java.sql.Timestamp;
import java.util.List;

@Entity
public class RondoGame {

    private Long id;
    private Timestamp startTime;
    private Timestamp endTime;
    private Integer score;
    private String status; // IN_PROGRESS, COMPLETED, TIMEOUT
    private String language;

    private List<RondoLetter> pasaPalabraLetterList;

    public RondoGame() {
    }

    public RondoGame(Timestamp startTime, Timestamp endTime, Integer score, String status, String language) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.score = score;
        this.status = status;
        this.language = language;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Timestamp getStartTime() {
        return startTime;
    }

    public void setStartTime(Timestamp startTime) {
        this.startTime = startTime;
    }

    public Timestamp getEndTime() {
        return endTime;
    }

    public void setEndTime(Timestamp endTime) {
        this.endTime = endTime;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<RondoLetter> getPasaPalabraLetterList() {
        return pasaPalabraLetterList;
    }

    public void setPasaPalabraLetterList(List<RondoLetter> pasaPalabraLetterList) {
        this.pasaPalabraLetterList = pasaPalabraLetterList;
    }
}
