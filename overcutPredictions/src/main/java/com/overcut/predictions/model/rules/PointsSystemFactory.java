package com.overcut.predictions.model.rules;

import java.util.Map;

public final class PointsSystemFactory {

    private PointsSystemFactory() {}

    public static PointsSystem forSeason(int season) {

        // 2010 → actual (25-18-15...)
        if (season >= 2010) {
            return new PointsSystem(Map.of(
                    1, 25,
                    2, 18,
                    3, 15,
                    4, 12,
                    5, 10,
                    6, 8,
                    7, 6,
                    8, 4,
                    9, 2,
                    10, 1
            ));
        }

        // 2003–2009
        if (season >= 2003) {
            return new PointsSystem(Map.of(
                    1, 10,
                    2, 8,
                    3, 6,
                    4, 5,
                    5, 4,
                    6, 3,
                    7, 2,
                    8, 1
            ));
        }

        // 1991–2002
        if (season >= 1991) {
            return new PointsSystem(Map.of(
                    1, 10,
                    2, 6,
                    3, 4,
                    4, 3,
                    5, 2,
                    6, 1
            ));
        }

        // 1961–1990
        if (season >= 1961) {
            return new PointsSystem(Map.of(
                    1, 9,
                    2, 6,
                    3, 4,
                    4, 3,
                    5, 2,
                    6, 1
            ));
        }

        // 1950–1960
        return new PointsSystem(Map.of(
                1, 8,
                2, 6,
                3, 4,
                4, 3,
                5, 2,
                6, 1
        ));
    }
}
