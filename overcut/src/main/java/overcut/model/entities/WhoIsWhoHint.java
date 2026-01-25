package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class WhoIsWhoHint {

    private Long id;
    private int hintOrder;
    private String hintText;

    private WhoIsWhoGame game;

    public WhoIsWhoHint() {}

    public WhoIsWhoHint(int hintOrder, String hintText, WhoIsWhoGame game) {
        this.hintOrder = hintOrder;
        this.hintText = hintText;
        this.game = game;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getHintOrder() { return hintOrder; }
    public void setHintOrder(int hintOrder) { this.hintOrder = hintOrder; }

    public String getHintText() { return hintText; }
    public void setHintText(String hintText) { this.hintText = hintText; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public WhoIsWhoGame getGame() { return game; }
    public void setGame(WhoIsWhoGame game) { this.game = game; }
}
