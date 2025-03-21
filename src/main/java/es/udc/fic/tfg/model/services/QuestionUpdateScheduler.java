package es.udc.fic.tfg.model.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class QuestionUpdateScheduler {
    @Autowired
    private QuestionGenerationService questionGeneratorService;

    private static final Logger logger = LoggerFactory.getLogger(QuestionUpdateScheduler.class);

    @Scheduled(fixedDelay = 86400000) // Cada 24 horas
    public void updateQuestions(String f1Api) {
        try {
            // Generar preguntas para cada nivel de dificultad
            for (int level = 1; level <= 3; level++) {
                questionGeneratorService.generateQuestion(level, f1Api);
            }
        } catch (QuestionGeneratorException e) {
            // Loggear el error y continuar
            logger.error("Error generando preguntas", e);
        }
    }
}