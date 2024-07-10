package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
public class Circuit {
    private Long id;
    private String name;

    private Long distance;

    private Long numberLaps;

    private String teamSuccess;


    private String image;

    private Category category;


    private List<Podium> podiums;

    public Circuit(){

    }

    public Circuit(Long distance, Long numberLaps, String teamSuccess, String image, Category category) {
        this.distance = distance;
        this.numberLaps = numberLaps;
        this.teamSuccess = teamSuccess;
        this.image = image;
        this.category = category;
    }

    public Circuit(String name,Long distance, Long numberLaps, String teamSuccess, String image, Category category) {
        this.name = name;
        this.distance = distance;
        this.numberLaps = numberLaps;
        this.teamSuccess = teamSuccess;
        this.image = image;
        this.category = category;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getDistance() {
        return distance;
    }

    public void setDistance(Long distance) {
        this.distance = distance;
    }

    public Long getNumberLaps() {
        return numberLaps;
    }

    public void setNumberLaps(Long numberLaps) {
        this.numberLaps = numberLaps;
    }

    public String getTeamSuccess() {
        return teamSuccess;
    }

    public void setTeamSuccess(String teamSuccess) {
        this.teamSuccess = teamSuccess;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    @ManyToOne
    @JoinColumn(name = "categoryId")
    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }


    @OneToMany(mappedBy = "circuit")
    public List<Podium> getPodiums() {
        return podiums;
    }

    public void setPodiums(List<Podium> podiums) {
        this.podiums = podiums;
    }
}
