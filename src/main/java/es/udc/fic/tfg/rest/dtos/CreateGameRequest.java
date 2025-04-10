package es.udc.fic.tfg.rest.dtos;

public class CreateGameRequest {
    private String playerX;
    private String playerO;
    private boolean randomCriteria;
    private boolean useDynamicCriteria; // true → dinámico | false → clásico


    public CreateGameRequest(String playerX, String playerO, boolean randomCriteria, boolean useDynamicCriteria) {
        this.playerX = playerX;
        this.playerO = playerO;
        this.randomCriteria = randomCriteria;
        this.useDynamicCriteria = useDynamicCriteria;
    }

    public String getPlayerX() {
        return playerX;
    }

    public void setPlayerX(String playerX) {
        this.playerX = playerX;
    }

    public String getPlayerO() {
        return playerO;
    }

    public void setPlayerO(String playerO) {
        this.playerO = playerO;
    }

    public boolean isRandomCriteria() {
        return randomCriteria;
    }

    public void setRandomCriteria(boolean randomCriteria) {
        this.randomCriteria = randomCriteria;
    }

    public boolean isUseDynamicCriteria() {
        return useDynamicCriteria;
    }

    public void setUseDynamicCriteria(boolean useDynamicCriteria) {
        this.useDynamicCriteria = useDynamicCriteria;
    }
}
