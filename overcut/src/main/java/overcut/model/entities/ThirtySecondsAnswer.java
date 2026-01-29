package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class ThirtySecondsAnswer {

    private Long id;
    private ThirtySecondsGame game;

    private String answerText;
    private boolean correct;
    private int answerOrder;

    public ThirtySecondsAnswer() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne
    @JoinColumn(name = "gameId")
    public ThirtySecondsGame getGame() { return game; }
    public void setGame(ThirtySecondsGame game) { this.game = game; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public int getAnswerOrder() { return answerOrder; }
    public void setAnswerOrder(int answerOrder) { this.answerOrder = answerOrder; }
}
