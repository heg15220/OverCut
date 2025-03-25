package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.services.QuestionLLMService;
import es.udc.fic.tfg.rest.dtos.QuestionAI;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
