package com.overcut.f1hub.model.entities;

public interface RaceLeaderCountView {
    Long getRaceId();
    String getRaceName();
    Integer getYear();
    Long getDistinctLeaderCount();
}
