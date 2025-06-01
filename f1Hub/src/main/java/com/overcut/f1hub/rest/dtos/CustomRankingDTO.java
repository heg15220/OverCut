package com.overcut.f1hub.rest.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CustomRankingDTO {
    private String label;
    private int count;
}
