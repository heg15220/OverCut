package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class HigherLowerEntry {

    private Long id;
    private HigherLowerGame game;

    private int positionIndex;
    private String pilotName;
    private double statValue;

    public HigherLowerEntry() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public HigherLowerGame getGame() { return game; }
    public void setGame(HigherLowerGame game) { this.game = game; }

    public int getPositionIndex() { return positionIndex; }
    public void setPositionIndex(int positionIndex) { this.positionIndex = positionIndex; }

    public String getPilotName() { return pilotName; }
    public void setPilotName(String pilotName) { this.pilotName = pilotName; }

    public double getStatValue() { return statValue; }
    public void setStatValue(double statValue) { this.statValue = statValue; }
}
