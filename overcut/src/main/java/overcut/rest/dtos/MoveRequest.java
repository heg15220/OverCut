package overcut.rest.dtos;

public class MoveRequest {
    private int row;
    private int column;
    private String piloto;

    public MoveRequest(int row, int column, String piloto) {
        this.row = row;
        this.column = column;
        this.piloto = piloto;
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

    public String getPiloto() {
        return piloto;
    }

    public void setPiloto(String piloto) {
        this.piloto = piloto;
    }
}
