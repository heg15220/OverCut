package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Question;

public class QuestionConversor {
    private QuestionConversor() {
        // Constructor privado para evitar instanciación
    }

    /**
     * Convierte un objeto Question en un objeto QuestionDto.
     *
     * @param question el objeto Question a convertir
     * @return el objeto QuestionDto resultante
     */
    public static QuestionDto convertToQuestionDto(Question question) {
        // Extraer los datos necesarios del objeto Question
        Long id = question.getId();
        String name = question.getName();
        byte[] imagePath = question.getImagePath();
        int knowledgequestionlevel = question.getKnowledgequestionlevel();
        Long quizId = question.getQuiz().getId(); // Asumiendo que quiz no es null

        // Crear y devolver el objeto QuestionDto
        return new QuestionDto(id, name, imagePath, knowledgequestionlevel, quizId);
    }

}
