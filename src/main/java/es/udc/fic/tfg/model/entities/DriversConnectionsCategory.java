package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class DriversConnectionsCategory {


    private Long id;

    private String categoryCode;
    private String categoryDescription;


    private DriversConnectionsGame game;

    private List<DriversConnectionsPilot> pilots = new ArrayList<>();

    public DriversConnectionsCategory() {
    }

    public DriversConnectionsCategory(String categoryCode, String categoryDescription, DriversConnectionsGame game,
                                      List<DriversConnectionsPilot> pilots) {
        this.categoryCode = categoryCode;
        this.categoryDescription = categoryDescription;
        this.game = game;
        this.pilots = pilots;
    }


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public String getCategoryDescription() {
        return categoryDescription;
    }

    public void setCategoryDescription(String categoryDescription) {
        this.categoryDescription = categoryDescription;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public DriversConnectionsGame getGame() {
        return game;
    }

    public void setGame(DriversConnectionsGame game) {
        this.game = game;
    }


    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<DriversConnectionsPilot> getPilots() {
        return pilots;
    }

    public void setPilots(List<DriversConnectionsPilot> pilots) {
        this.pilots = pilots;
    }
}
