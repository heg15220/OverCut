package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class F1ImpostorPilot {
    private Long id;
    private F1ImpostorGame game;
    private String pilotName;

    private boolean valid; // 🔁 renombrado

    private boolean selectedByUser;

    public F1ImpostorPilot() {}

    public F1ImpostorPilot(F1ImpostorGame game, String pilotName, boolean valid, boolean selectedByUser) {
        this.game = game;
        this.pilotName = pilotName;
        this.valid = valid;
        this.selectedByUser = selectedByUser;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public F1ImpostorGame getGame() { return game; }

    public void setGame(F1ImpostorGame game) { this.game = game; }

    public String getPilotName() { return pilotName; }

    public void setPilotName(String pilotName) { this.pilotName = pilotName; }

    public boolean isValid() { return valid; }

    public void setValid(boolean valid) { this.valid = valid; }

    public boolean isSelectedByUser() { return selectedByUser; }

    public void setSelectedByUser(boolean selectedByUser) { this.selectedByUser = selectedByUser; }
}
