package overcutdebate.model.services;

import overcutdebate.rest.dtos.CreateOpinionRequestDto;
import overcutdebate.rest.dtos.OpinionDto;

public interface DebateOpinionService {

    OpinionDto submitOpinion(Long userId, String authHeader, boolean isAdmin, CreateOpinionRequestDto req);

    OpinionDto getMyTodayOpinion(Long userId, String scopeStr);
}
