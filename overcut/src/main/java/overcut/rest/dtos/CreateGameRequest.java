package overcut.rest.dtos;

public class CreateGameRequest {
    private String playerX;
    private String playerO;
    private boolean randomCriteria;
    private boolean useDynamicCriteria; // true → dinámico clásico (1980–1999)
    private boolean modo2000Plus;       // true → dinámico desde 2000 en adelante
    private boolean historicRangeMode;       // true → filtrar sólo entre 1980–1999
    private boolean vsBot;
    private boolean gridMode;


    public CreateGameRequest() {
    }

    public CreateGameRequest(String playerX, String playerO, boolean randomCriteria, boolean useDynamicCriteria,
                             boolean modo2000Plus, boolean historicRangeMode, boolean vsBot) {
        this.playerX = playerX;
        this.playerO = playerO;
        this.randomCriteria = randomCriteria;
        this.useDynamicCriteria = useDynamicCriteria;
        this.modo2000Plus = modo2000Plus;
        this.historicRangeMode = historicRangeMode;
        this.vsBot = vsBot;
    }

    // getters & setters

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

    public boolean isModo2000Plus() {
        return modo2000Plus;
    }
    public void setModo2000Plus(boolean modo2000Plus) {
        this.modo2000Plus = modo2000Plus;
    }

    public boolean isHistoricRangeMode() {
        return historicRangeMode;
    }
    public void setHistoricRangeMode(boolean historicMode) {
        this.historicRangeMode = historicMode;
    }

    public boolean isVsBot() {
        return vsBot;
    }

    public void setVsBot(boolean vsBot) {
        this.vsBot = vsBot;
    }

    public boolean isGridMode() {
        return gridMode;
    }

    public void setGridMode(boolean gridMode) {
        this.gridMode = gridMode;
    }
}
