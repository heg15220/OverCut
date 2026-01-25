package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class MemoryCard {

    private Long id;

    private MemoryGame game;

    private int positionIndex;

    private String pairKey;

    private String cardType;

    private String label;

    private Long driverId;

    private Long constructorId;

    private boolean matched;

    public MemoryCard() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public MemoryGame getGame() { return game; }

    public void setGame(MemoryGame game) { this.game = game; }

    public int getPositionIndex() { return positionIndex; }

    public void setPositionIndex(int positionIndex) { this.positionIndex = positionIndex; }

    public String getPairKey() { return pairKey; }

    public void setPairKey(String pairKey) { this.pairKey = pairKey; }

    public String getCardType() { return cardType; }

    public void setCardType(String cardType) { this.cardType = cardType; }

    public String getLabel() { return label; }

    public void setLabel(String label) { this.label = label; }

    public Long getDriverId() { return driverId; }

    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Long getConstructorId() { return constructorId; }

    public void setConstructorId(Long constructorId) { this.constructorId = constructorId; }

    public boolean isMatched() { return matched; }

    public void setMatched(boolean matched) { this.matched = matched; }
}
