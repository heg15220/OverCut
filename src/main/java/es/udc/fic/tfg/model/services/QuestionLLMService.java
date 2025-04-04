package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.rest.dtos.QuestionAI;

import java.util.List;

public interface QuestionLLMService {
    List<QuestionAI> generateQuestionsAI(String language, String category);
    List<QuestionAI> generateRegulationQuestions(String language, String category);

    String validateQuestion(String question, List<String> answers);

}
