package overcut.rest.dtos;

public class AbbreviationsAnswerDto {
    private String abbr;
    private boolean solved;
    private String revealedName; // null si no solved
    private int answerOrder;

    public String getAbbr() { return abbr; }
    public void setAbbr(String abbr) { this.abbr = abbr; }

    public boolean isSolved() { return solved; }
    public void setSolved(boolean solved) { this.solved = solved; }

    public String getRevealedName() { return revealedName; }
    public void setRevealedName(String revealedName) { this.revealedName = revealedName; }

    public int getAnswerOrder() { return answerOrder; }
    public void setAnswerOrder(int answerOrder) { this.answerOrder = answerOrder; }
}
