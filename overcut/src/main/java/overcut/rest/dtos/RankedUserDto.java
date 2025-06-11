package overcut.rest.dtos;

public class RankedUserDto {
    private String userName;
    private int points;
    private String rank;

    public RankedUserDto(String userName, int points, String rank) {
        this.userName = userName;
        this.points = points;
        this.rank = rank;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public String getRank() {
        return rank;
    }

    public void setRank(String rank) {
        this.rank = rank;
    }
}
