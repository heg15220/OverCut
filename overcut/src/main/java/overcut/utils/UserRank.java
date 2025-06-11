package overcut.utils;

public enum UserRank {
    F4, F3, F2, F1;

    public static UserRank fromPoints(int points) {
        if (points >= 1000) return F1;
        if (points >= 500) return F2;
        if (points >= 150) return F3;
        return F4;
    }

    public String getDisplayName() {
        return switch (this) {
            case F1 -> "Legend";
            case F2 -> "Pro";
            case F3 -> "Semi-Pro";
            case F4 -> "Rookie";
        };
    }
}
