package overcut.model.entities;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class BingoCell {

    private Long id;
    private int cellIndex;                 // 0..8
    private String themeCode;
    private String themeDescription;
    private String themeImage;             // "Benetton.svg" opcional

    private BingoGame game;
    private List<BingoCellPilot> validPilots = new ArrayList<>();

    public BingoCell() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getCellIndex() { return cellIndex; }
    public void setCellIndex(int cellIndex) { this.cellIndex = cellIndex; }

    public String getThemeCode() { return themeCode; }
    public void setThemeCode(String themeCode) { this.themeCode = themeCode; }

    public String getThemeDescription() { return themeDescription; }
    public void setThemeDescription(String themeDescription) { this.themeDescription = themeDescription; }

    public String getThemeImage() { return themeImage; }
    public void setThemeImage(String themeImage) { this.themeImage = themeImage; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public BingoGame getGame() { return game; }
    public void setGame(BingoGame game) { this.game = game; }

    @OneToMany(mappedBy = "cell", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<BingoCellPilot> getValidPilots() { return validPilots; }
    public void setValidPilots(List<BingoCellPilot> validPilots) { this.validPilots = validPilots; }
}
