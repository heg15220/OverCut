package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class F1AnagramsAttempt {

    private Long id;
    private F1AnagramsRound round;

    private String guess;
    private int attemptOrder;
    private boolean correct;

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roundId", nullable = false)
    public F1AnagramsRound getRound() { return round; }
    public void setRound(F1AnagramsRound round) { this.round = round; }

    public String getGuess() { return guess; }
    public void setGuess(String guess) { this.guess = guess; }

    public int getAttemptOrder() { return attemptOrder; }
    public void setAttemptOrder(int attemptOrder) { this.attemptOrder = attemptOrder; }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
}
