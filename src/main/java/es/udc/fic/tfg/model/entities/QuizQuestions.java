package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class QuizQuestions {

    private Long id;

    private Quiz quiz;

    private Question question;

    public QuizQuestions() {
    }

    public QuizQuestions(Quiz quiz, Question question) {
        this.quiz = quiz;
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

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "quizId")
    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "questionId")
    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }
}
