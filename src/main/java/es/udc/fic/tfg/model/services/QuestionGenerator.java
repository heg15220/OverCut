package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.Question;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;

import java.util.List;
import java.util.Map;

public interface QuestionGenerator {

        List<Question> generateQuestions(int count) throws QuestionGeneratorException;


}
