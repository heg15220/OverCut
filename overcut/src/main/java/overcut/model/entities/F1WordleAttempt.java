package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class F1WordleAttempt {

    private Long id;

    private F1WordleGame game;

    private String guess;
    private int attemptOrder;
    private String feedback; // e.g. "g_y__" (g = green, y = yellow, _ = gray)

    public F1WordleAttempt() {
    }

    public F1WordleAttempt(Long id, F1WordleGame game, String guess, int attemptOrder, String feedback) {
        this.id = id;
        this.game = game;
        this.guess = guess;
        this.attemptOrder = attemptOrder;
        this.feedback = feedback;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public F1WordleGame getGame() {
        return game;
    }

    public void setGame(F1WordleGame game) {
        this.game = game;
    }

    public String getGuess() {
        return guess;
    }

    public void setGuess(String guess) {
        this.guess = guess;
    }

    public int getAttemptOrder() {
        return attemptOrder;
    }

    public void setAttemptOrder(int attemptOrder) {
        this.attemptOrder = attemptOrder;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
