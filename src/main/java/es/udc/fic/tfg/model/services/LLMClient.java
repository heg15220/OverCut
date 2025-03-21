package es.udc.fic.tfg.model.services;

import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LLMClient {
    @Autowired
    private OllamaChatModel ollamaChatModel;

    public String generateQuestion(String prompt) {
        ChatResponse response = ollamaChatModel.call(
                new Prompt(prompt)
        );
        return response.getResult().getOutput().getText();
    }
}