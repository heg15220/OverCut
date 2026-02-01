package overcut.rest.dtos;

import overcut.model.entities.TeamNationalityAnswer;
import overcut.model.entities.TeamNationalityGame;

import java.util.Comparator;

public class TeamNationalityGameConversor {
    public static TeamNationalityGameDto toDto(TeamNationalityGame g) {
        TeamNationalityGameDto dto = new TeamNationalityGameDto();
        dto.setId(g.getId());
        dto.setCreatedAt(g.getCreatedAt());
        dto.setTeamName(g.getTeamName());
        dto.setNationality(g.getNationality());
        dto.setCountryCode(g.getCountryCode());
        dto.setFinished(g.isFinished());
        dto.setCorrectAnswers(g.getCorrectAnswers());
        dto.setTotalSubmitted(g.getTotalSubmitted());
        dto.setMaxAnswers(g.getMaxAnswers());

        dto.setAnswers(
                g.getAnswers().stream()
                        .sorted(Comparator.comparingInt(TeamNationalityAnswer::getAnswerOrder))
                        .map(a -> {
                            TeamNationalityAnswerDto ad = new TeamNationalityAnswerDto();
                            ad.setDriverId(a.getDriverId());
                            ad.setDriverName(a.getDriverName());
                            ad.setAnswerOrder(a.getAnswerOrder());
                            return ad;
                        })
                        .toList()
        );

        return dto;
    }
}
