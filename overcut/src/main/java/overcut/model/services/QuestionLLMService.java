package overcut.model.services;

import overcut.rest.dtos.QuestionAI;

import java.util.List;

public interface QuestionLLMService {
    List<QuestionAI> generateQuestionsAI(String language, String category);
    List<QuestionAI> generateRegulationQuestions(String language, String category);
    List<QuestionAI> generateStrategyQuestions(String language, String category);
    List<QuestionAI> generatePhysicsQuestions(String language, String category);
    String validateQuestion(String question, List<String> answers);
    List<QuestionAI> generateTeamRadioQuestions(String language, String category);
    List<QuestionAI> generateGenericStatsQuestions(String language);



}
