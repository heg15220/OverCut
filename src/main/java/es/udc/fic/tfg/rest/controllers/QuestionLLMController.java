package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.services.QuestionLLMService;
import es.udc.fic.tfg.rest.dtos.QuestionAI;
import es.udc.fic.tfg.rest.dtos.ValidationRequest;
import es.udc.fic.tfg.rest.dtos.ValidationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/llm")
public class QuestionLLMController {

    @Autowired
    private QuestionLLMService questionLLMService;

    @GetMapping("/questions")
    public ResponseEntity<List<QuestionAI>> generateQuestions() {
        List<QuestionAI> questions = questionLLMService.generateQuestionsAI();
        return ResponseEntity.ok(questions);
    }

    /**
     * Genera preguntas del reglamento deportivo de Fórmula 1 2025.
     *
     * Este endpoint permite obtener preguntas filtradas por categoría y/o nivel de dificultad.
     *
     * Categorías disponibles (valor de 'category'):
     *  - "Puntuación"
     *  - "Sanciones"
     *  - "Procedimientos"
     *  - "Parque Cerrado"
     *  - "Seguridad"
     *  - "Neumáticos"
     *  - "Safety Car"
     *  - "Clasificación"
     *  - "Sprint"
     *  - "Bandera Roja"
     *  - "Pilotos"
     *  - "Técnico"
     *  - "Caso práctico"
     *
     * Niveles disponibles (valor de 'level'):
     *  - 1 → Fácil
     *  - 2 → Medio
     *  - 3 → Difícil
     *
     * @param category (opcional) Categoría de la pregunta.
     * @return Lista de preguntas filtradas en formato JSON.
     */

    @GetMapping("/quiz/reglamento")
    public ResponseEntity<List<QuestionAI>> generateRegulationQuiz(@RequestParam(required = false) String category) {
        List<QuestionAI> preguntas = questionLLMService.generateRegulationQuestions(category);
        return ResponseEntity.ok(preguntas);
    }


    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validateQuestion(@RequestBody ValidationRequest request) {
        String correctAnswer = questionLLMService.validateQuestion(request.getQuestion(), request.getAnswers());
        return ResponseEntity.ok(new ValidationResponse(correctAnswer));
    }

}
