package overcut.model.entities;

import jakarta.persistence.*;
/**
 * The Class Assessment (valoración).
 */
@Entity
public class Assessment {
    private Long id;

    private int points;
    private User user;

    private Quiz quiz;


    public Assessment() {
    }

    public Assessment(int points, User user, Quiz quiz) {
        this.points = points;
        this.user = user;
        this.quiz = quiz;
    }


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @OneToOne(mappedBy = "assessment",optional = false,fetch = FetchType.LAZY)
    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }
}
