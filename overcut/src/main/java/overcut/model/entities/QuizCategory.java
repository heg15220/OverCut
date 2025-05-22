package overcut.model.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "QuizCategory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"quizTypeId", "code"})
})
public class QuizCategory {

    private Long id;


    private QuizCategoryCode code;


    private QuizType quizType;

    private List<QuizCategoryTranslation> translations;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public QuizCategoryCode getCode() {
        return code;
    }

    public void setCode(QuizCategoryCode code) {
        this.code = code;
    }

    @ManyToOne(optional = false)
    @JoinColumn(name = "quizTypeId")
    public QuizType getQuizType() {
        return quizType;
    }

    public void setQuizType(QuizType quizType) {
        this.quizType = quizType;
    }


    @OneToMany(mappedBy = "quizCategory", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<QuizCategoryTranslation> getTranslations() {
        return translations;
    }

    public void setTranslations(List<QuizCategoryTranslation> translations) {
        this.translations = translations;
    }


}
