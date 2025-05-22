package overcut.model.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
public class QuizType {

    private Long id;

    private QuizTypeCode code;

    private String imagePath;

    private List<QuizTypeTranslation> translations;

    // Getters and setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    public QuizTypeCode getCode() {
        return code;
    }

    public void setCode(QuizTypeCode code) {
        this.code = code;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    @OneToMany(mappedBy = "quizType", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<QuizTypeTranslation> getTranslations() {
        return translations;
    }

    public void setTranslations(List<QuizTypeTranslation> translations) {
        this.translations = translations;
    }
}
