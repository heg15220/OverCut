package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.GuessDriverGame;
import es.udc.fic.tfg.model.entities.GuessDriverQuestion;

import java.util.List;
import java.util.stream.Collectors;

public class GuessDriverGameConversor {

    private GuessDriverGameConversor(){

    }
    public static GuessDriverGameDto toDto(GuessDriverGame game) {
        GuessDriverGameDto dto = new GuessDriverGameDto();
        dto.setId(game.getId());
        dto.setDriverId(game.getDriverId());
        dto.setDriverName(game.getDriverName());
        dto.setCreatedAt(game.getCreatedAt());
        dto.setQuestionCount(game.getQuestionCount());
        dto.setFinished(game.isFinished());
        dto.setSuccessful(game.getSuccessful());
        dto.setQuestions(game.getQuestions().stream()
                .map(GuessDriverQuestionConversor::toDto)
                .collect(Collectors.toList()));
        return dto;
    }
}