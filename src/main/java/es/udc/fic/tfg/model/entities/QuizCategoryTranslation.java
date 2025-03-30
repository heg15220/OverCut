package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "QuizCategoryTranslation", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"quizCategory_id", "language"})
})
public class QuizCategoryTranslation {

    private Long id;


    private QuizCategory quizCategory;

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
    @JoinColumn(name = "quizCategory_id")
    public QuizCategory getQuizCategory() {
        return quizCategory;
    }

    public void setQuizCategory(QuizCategory quizCategory) {
        this.quizCategory = quizCategory;
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
