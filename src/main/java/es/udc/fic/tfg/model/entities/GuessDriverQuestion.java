package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class GuessDriverQuestion {

    private Long id;

    private GuessDriverGame game;

    private String category;

    private String valueUser;

    private boolean isCorrect;

    private LocalDateTime createdAt = LocalDateTime.now();

    private String question;

    public GuessDriverQuestion() {
    }

    public GuessDriverQuestion(GuessDriverGame game, String category, String valueUser,
                               boolean isCorrect, LocalDateTime createdAt, String question) {
        this.game = game;
        this.category = category;
        this.valueUser = valueUser;
        this.isCorrect = isCorrect;
        this.createdAt = createdAt;
        this.question = question;
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
    public GuessDriverGame getGame() {
        return game;
    }

    public void setGame(GuessDriverGame game) {
        this.game = game;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getValueUser() {
        return valueUser;
    }

    public void setValueUser(String valueUser) {
        this.valueUser = valueUser;
    }

    @Column(name = "isCorrect", nullable = false)
    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    @Column(name = "createAt", nullable = false)
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Column(name = "question", columnDefinition = "TEXT")
    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
