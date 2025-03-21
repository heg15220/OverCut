package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.Answer;
import es.udc.fic.tfg.model.entities.F1Data;
import es.udc.fic.tfg.model.entities.Question;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;

import java.util.List;

public interface QuestionGenerationService {

    Question generateQuestion(int difficultyLevel, String f1Api) throws QuestionGeneratorException;

}
