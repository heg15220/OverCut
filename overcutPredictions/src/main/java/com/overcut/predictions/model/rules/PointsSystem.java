package com.overcut.predictions.model.rules;

import java.util.Map;

public class PointsSystem {

    private final Map<Integer, Integer> pointsByPosition;

    public PointsSystem(Map<Integer, Integer> pointsByPosition) {
        this.pointsByPosition = pointsByPosition;
    }

    public int pointsForPosition(Integer position) {
        if (position == null) return 0;
        return pointsByPosition.getOrDefault(position, 0);
    }
}
