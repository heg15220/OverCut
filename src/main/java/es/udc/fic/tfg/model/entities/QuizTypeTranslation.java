package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "QuizTypeTranslation", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"quizType_id", "language"})
})
public class QuizTypeTranslation {

    private Long id;


    private QuizType quizType;

    private String language;

    private String name;

    // Getters and setters

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne(optional = false)
    @JoinColumn(name = "quizType_id", nullable = false)
    public QuizType getQuizType() {
        return quizType;
    }

    public void setQuizType(QuizType quizType) {
        this.quizType = quizType;
    }

    @Column(length = 5, nullable = false)
    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @Column(length = 100, nullable = false)
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

}
