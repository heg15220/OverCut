package overcutdebate.model.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import overcutdebate.model.daos.DebateOpinionDao;
import overcutdebate.model.entities.DebateOpinion;
import overcutdebate.model.entities.DebateScope;
import overcutdebate.model.services.exceptions.ApiException;
import overcutdebate.rest.dtos.CreateOpinionRequestDto;
import overcutdebate.rest.dtos.OpinionDto;
import overcutdebate.rest.overcut.OvercutUserClient;

import java.time.LocalDate;

@Service
@Transactional
public class DebateOpinionServiceImpl implements DebateOpinionService {

    private final DebateOpinionDao opinionDao;
    private final OvercutUserClient overcutUserClient;
    private final DebateClock clock;

    // ✅ DEV flag: si true, no-admin puede “reescribir” su opinión (UPDATE)
    @Value("${overcut.debate.allowMultipleOpinions:false}")
    private boolean allowMultipleOpinions;

    public DebateOpinionServiceImpl(DebateOpinionDao opinionDao,
                                    OvercutUserClient overcutUserClient,
                                    DebateClock clock) {
        this.opinionDao = opinionDao;
        this.overcutUserClient = overcutUserClient;
        this.clock = clock;
    }

    @Override
    public OpinionDto submitOpinion(Long userId, String authHeader, boolean isAdmin, CreateOpinionRequestDto req) {
        if (req == null || req.scope == null || req.text == null) {
            throw new ApiException(400, "Missing scope/text");
        }

        DebateScope scope;
        try {
            scope = DebateScope.valueOf(req.scope);
        } catch (Exception e) {
            throw new ApiException(400, "Invalid scope");
        }

        String text = req.text.trim();
        if (text.isEmpty() || text.length() > 500) {
            throw new ApiException(400, "Text must be 1..500 chars");
        }

        LocalDate day = clock.today();

        var existingOpt = opinionDao.findByDebateDayAndUserIdAndScope(day, userId, scope);
        if (existingOpt.isPresent()) {
            DebateOpinion existing = existingOpt.get();

            // ✅ admin siempre puede reescribir
            if (isAdmin) {
                existing.setText(text);
                existing.setCreatedAt(clock.nowInstant());
                opinionDao.save(existing);
                return toDto(existing);
            }

            // ✅ DEV: permitir “más de una” = permitir reescribir (UPDATE), sin romper UNIQUE
            if (allowMultipleOpinions) {
                existing.setText(text);
                existing.setCreatedAt(clock.nowInstant());
                opinionDao.save(existing);
                return toDto(existing);
            }

            // ✅ PROD: bloquear
            throw new ApiException(409, "You already submitted an opinion today for this scope");
        }

        // ✅ Nuevo INSERT si no existía
        String userName = overcutUserClient.fetchUserNameFromServiceToken(authHeader);
        if (userName == null || userName.isBlank()) userName = "user" + userId;

        DebateOpinion o = new DebateOpinion();
        o.setScope(scope);
        o.setDebateDay(day);
        o.setUserId(userId);
        o.setUserName(userName);
        o.setText(text);
        o.setCreatedAt(clock.nowInstant());

        opinionDao.save(o);
        return toDto(o);
    }

    @Override
    @Transactional(readOnly = true)
    public OpinionDto getMyTodayOpinion(Long userId, String scopeStr) {
        DebateScope scope;
        try {
            scope = DebateScope.valueOf(scopeStr);
        } catch (Exception e) {
            throw new ApiException(400, "Invalid scope");
        }

        LocalDate day = clock.today();
        return opinionDao
                .findTopByDebateDayAndUserIdAndScopeOrderByCreatedAtDesc(day, userId, scope)
                .map(this::toDto)
                .orElse(null);
    }

    private OpinionDto toDto(DebateOpinion o) {
        OpinionDto dto = new OpinionDto();
        dto.id = o.getId();
        dto.scope = o.getScope().name();
        dto.day = o.getDebateDay().toString();
        dto.userId = o.getUserId();
        dto.userName = o.getUserName();
        dto.text = o.getText();
        return dto;
    }
}
