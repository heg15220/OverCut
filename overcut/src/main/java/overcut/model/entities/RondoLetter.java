package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class RondoLetter {

    private Long id;

    private RondoGame game;
    private char letter;

    @Lob
    private String question;
    private String answer;
    private String status; // UNANSWERED, CORRECT, WRONG, SKIPPED

    public RondoLetter() {
    }

    public RondoLetter(RondoGame game, char letter, String question, String answer, String status) {
        this.game = game;
        this.letter = letter;
        this.question = question;
        this.answer = answer;
        this.status = status;
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
    public RondoGame getGame() {
        return game;
    }

    public void setGame(RondoGame game) {
        this.game = game;
    }

    public char getLetter() {
        return letter;
    }

    public void setLetter(char letter) {
        this.letter = letter;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
