package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.UserAnswer;
import es.udc.fic.tfg.model.entities.UserAward;

import java.util.List;
import java.util.stream.Collectors;

public class UserAwardConversor {

    private UserAwardConversor() {
    }


    public static final UserAwardDto toUserAwardDto(UserAward userAward) {
        return new UserAwardDto(userAward.getId(),userAward.getUser(),userAward.getAward());
    }

    public static final List<UserAwardDto> toUserAwardDtos(List<UserAward> userAwards) {
        return userAwards.stream().map(UserAwardConversor::toUserAwardDto).collect(Collectors.toList());
    }

}
