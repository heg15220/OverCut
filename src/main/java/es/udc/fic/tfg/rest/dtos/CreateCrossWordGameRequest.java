package es.udc.fic.tfg.rest.dtos;

public class CreateCrossWordGameRequest {
    private int rows;
    private int cols;
    private String language; // "es" o "en"


    // Getters y setters
    public int getRows() { return rows; }
    public void setRows(int rows) { this.rows = rows; }
    public int getCols() { return cols; }
    public void setCols(int cols) { this.cols = cols; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
