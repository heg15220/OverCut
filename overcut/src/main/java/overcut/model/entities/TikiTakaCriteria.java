package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class TikiTakaCriteria {

    private Long id;

    private TikiTakaGame game;
    private String axis; // "row" o "column"
    private int positionGame; // posición 1,2,3
    private String description; // Texto visible
    private String code; // Código
    private String imageUrl;

    public TikiTakaCriteria() {
    }

    public TikiTakaCriteria(TikiTakaGame game, String axis, int positionGame, String description,
                            String code, String imageUrl) {
        this.game = game;
        this.axis = axis;
        this.positionGame = positionGame;
        this.description = description;
        this.code = code;
        this.imageUrl = imageUrl;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne
    @JoinColumn(name = "gameId")
    public TikiTakaGame getGame() {
        return game;
    }

    public void setGame(TikiTakaGame game) {
        this.game = game;
    }

    public String getAxis() {
        return axis;
    }

    public void setAxis(String axis) {
        this.axis = axis;
    }

    public int getPositionGame() {
        return positionGame;
    }

    public void setPositionGame(int positionGame) {
        this.positionGame = positionGame;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
