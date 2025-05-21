package es.udc.fic.tfg.rest.dtos;

public class WordSearchWordDto {
    private String surname;
    private Long driverId;
    private int startRow;
    private int startCol;
    private String direction;
    private boolean revealed;  // Nuevo campo

    public WordSearchWordDto() {}

    public WordSearchWordDto(String surname, Long driverId,
                             int startRow, int startCol, String direction, boolean revealed) {
        this.surname = surname;
        this.driverId = driverId;
        this.startRow = startRow;
        this.startCol = startCol;
        this.direction = direction;
        this.revealed = revealed;  // Asignamos el valor del campo "revealed"
    }

    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public int getStartRow() { return startRow; }
    public void setStartRow(int startRow) { this.startRow = startRow; }

    public int getStartCol() { return startCol; }
    public void setStartCol(int startCol) { this.startCol = startCol; }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }

    public boolean isRevealed() { return revealed; }  // Getter para "revealed"
    public void setRevealed(boolean revealed) { this.revealed = revealed; }  // Setter para "revealed"
}
