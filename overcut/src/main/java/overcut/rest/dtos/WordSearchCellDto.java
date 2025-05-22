package overcut.rest.dtos;


public class WordSearchCellDto {
    private int rowIndex;
    private int colIndex;
    private char letter;

    private boolean revealed;

    public WordSearchCellDto() {}

    public WordSearchCellDto(int rowIndex, int colIndex, char letter, boolean revealed) {
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.letter = letter;
        this.revealed = revealed;
    }

    public int getRowIndex() { return rowIndex; }
    public void setRowIndex(int rowIndex) { this.rowIndex = rowIndex; }

    public int getColIndex() { return colIndex; }
    public void setColIndex(int colIndex) { this.colIndex = colIndex; }

    public char getLetter() { return letter; }
    public void setLetter(char letter) { this.letter = letter; }

    public boolean isRevealed() {
        return revealed;
    }

    public void setRevealed(boolean revealed) {
        this.revealed = revealed;
    }
}

