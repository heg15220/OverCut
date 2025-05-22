package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class CategorySlot {

    private Long id;
    private CategoryGame game;
    private String category;
    private String answer;
    private Boolean valid;

    public CategorySlot() {
    }

    public CategorySlot(CategoryGame game, String category, String answer, Boolean valid) {
        this.game = game;
        this.category = category;
        this.answer = answer;
        this.valid = valid;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }

    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public CategoryGame getGame() { return game; }

    public void setGame(CategoryGame game) { this.game = game; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public Boolean getValid() { return valid; }
    public void setValid(Boolean valid) { this.valid = valid; }
}
