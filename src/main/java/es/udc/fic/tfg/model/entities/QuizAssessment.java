package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class QuizAssessment {

    private Long id;


    private Quiz quiz;
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "assessmentId", referencedColumnName = "id")
    private Assessment assessment;

    public QuizAssessment() {
    }
    public QuizAssessment(Quiz quiz, Assessment assessment) {
        this.quiz = quiz;        this.assessment = assessment;
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

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }
}
