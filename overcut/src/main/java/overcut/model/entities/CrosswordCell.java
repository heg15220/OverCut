package overcut.model.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
public class CrosswordCell {

    private Long id;

    private char letter;             // Letra correcta de la solución
    private int positionCell;        // Posición dentro de la palabra (0-indexed)

    private boolean filled = false;  // ¿El usuario ya la ha rellenado?
    private Character userInput;     // Letra introducida por el usuario (puede ser null)

    private boolean modifiedByUser;

    private List<CrosswordCellWordLink> wordLinks;

    public CrosswordCell() {
    }

    public CrosswordCell(char letter, int positionCell, boolean filled,
                         Character userInput, boolean modifiedByUser) {
        this.letter = letter;
        this.positionCell = positionCell;
        this.filled = filled;
        this.userInput = userInput;
        this.modifiedByUser = modifiedByUser;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public char getLetter() {
        return letter;
    }

    public void setLetter(char letter) {
        this.letter = letter;
    }

    public int getPositionCell() {
        return positionCell;
    }

    public void setPositionCell(int positionCell) {
        this.positionCell = positionCell;
    }

    public boolean isFilled() {
        return filled;
    }

    public void setFilled(boolean filled) {
        this.filled = filled;
    }

    public Character getUserInput() {
        return userInput;
    }

    public void setUserInput(Character userInput) {
        this.userInput = userInput;
    }

    public boolean isModifiedByUser() {
        return modifiedByUser;
    }

    public void setModifiedByUser(boolean modifiedByUser) {
        this.modifiedByUser = modifiedByUser;
    }

    @OneToMany(mappedBy = "cell", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<CrosswordCellWordLink> getWordLinks() {
        return wordLinks;
    }

    public void setWordLinks(List<CrosswordCellWordLink> wordLinks) {
        this.wordLinks = wordLinks;
    }
}
