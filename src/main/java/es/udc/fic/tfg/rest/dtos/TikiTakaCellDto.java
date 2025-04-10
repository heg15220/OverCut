package es.udc.fic.tfg.rest.dtos;

public class TikiTakaCellDto {

    private int row;
    private int column;
    private String filledBy;
    private String piloto;
    private boolean isValid;

    public TikiTakaCellDto(int row, int column, String filledBy, String piloto, boolean isValid) {
        this.row = row;
        this.column = column;
        this.filledBy = filledBy;
        this.piloto = piloto;
        this.isValid = isValid;
    }

    public int getRow() {
        return row;
    }

    public void setRow(int row) {
        this.row = row;
    }

    public int getColumn() {
        return column;
    }

    public void setColumn(int column) {
        this.column = column;
    }

    public String getFilledBy() {
        return filledBy;
    }

    public void setFilledBy(String filledBy) {
        this.filledBy = filledBy;
    }

    public String getPiloto() {
        return piloto;
    }

    public void setPiloto(String piloto) {
        this.piloto = piloto;
    }

    public boolean isValid() {
        return isValid;
    }

    public void setValid(boolean valid) {
        isValid = valid;
    }
}
