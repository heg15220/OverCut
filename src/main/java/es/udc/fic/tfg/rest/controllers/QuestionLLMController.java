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

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validateQuestion(@RequestBody ValidationRequest request) {
        String correctAnswer = questionLLMService.validateQuestion(request.getQuestion(), request.getAnswers());
        return ResponseEntity.ok(new ValidationResponse(correctAnswer));
    }

}
