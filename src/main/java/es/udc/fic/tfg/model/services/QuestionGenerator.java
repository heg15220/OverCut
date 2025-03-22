package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.Question;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;

import java.util.Map;

public interface QuestionGenerator {
        /**
         * Genera una pregunta nueva basada en el nivel de dificultad y la fuente de datos
         * @param difficulty Nivel de dificultad (1: básico, 2: medio, 3: avanzado)
         * @param source Fuente de datos (ej: "ergast", "llm", etc.)
         * @return Pregunta generada
         * @throws QuestionGeneratorException si hay un error en la generación
         */
        Question generateQuestion(int difficulty, String source) throws QuestionGeneratorException;



}
