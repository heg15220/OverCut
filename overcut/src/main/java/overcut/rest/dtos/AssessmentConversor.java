package overcut.rest.dtos;

import overcut.model.entities.Assessment;

import java.util.List;
import java.util.stream.Collectors;

public class AssessmentConversor {
    /**
     * Instantiates a new assessment conversor
     */
    private AssessmentConversor() {
    }

    /**
     * To assessment dto.
     *
     * @param assessment the assessment
     * @return the assessment dto
     */

    public static final AssessmentDto toAssessmentDto(Assessment assessment) {
        return new AssessmentDto(assessment.getId(), assessment.getPoints(), assessment.getUser().getId(),
                assessment.getQuiz().getId());
    }

    /**
     * To quiz dtos
     *
     * @param assessments all assessments
     * @return the post
     */
    public static final List<AssessmentDto> toAssessmentDtos(List<Assessment> assessments) {
        return assessments.stream().map(AssessmentConversor::toAssessmentDto).collect(Collectors.toList());

    }
}
