package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class Top10QualiSlot {

    private Long id;

    private Integer positionGame;      // 1..10
    private String qualiTime;          // pista
    private String filledByPilotName;
    private String correctPilotName;
    private String nationalityCode;

    private Top10QualiGame game;

    public Top10QualiSlot() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getPositionGame() { return positionGame; }
    public void setPositionGame(Integer positionGame) { this.positionGame = positionGame; }

    public String getQualiTime() { return qualiTime; }
    public void setQualiTime(String qualiTime) { this.qualiTime = qualiTime; }

    public String getFilledByPilotName() { return filledByPilotName; }
    public void setFilledByPilotName(String filledByPilotName) { this.filledByPilotName = filledByPilotName; }

    public String getCorrectPilotName() { return correctPilotName; }
    public void setCorrectPilotName(String correctPilotName) { this.correctPilotName = correctPilotName; }

    public String getNationalityCode() { return nationalityCode; }
    public void setNationalityCode(String nationalityCode) { this.nationalityCode = nationalityCode; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public Top10QualiGame getGame() { return game; }
    public void setGame(Top10QualiGame game) { this.game = game; }
}
