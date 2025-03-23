package es.udc.fic.tfg.model.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.ai.openai.api.*;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Service
public class WikipediaQuestionGenerator {
    private final OpenAiApi openAI;

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    public WikipediaQuestionGenerator(OpenAiApi openAI) {
        this.openAI = openAI;
    }

    public String generateQuestion(String topic) {
        String prompt = "Genera una pregunta sobre " + topic + " usando información de Wikipedia. " +
                "Devuélvela en el siguiente formato:\n" +
                "Pregunta: [Aquí va la pregunta]\n" +
                "Opciones:\n" +
                "1. [Opción incorrecta]\n" +
                "2. [Opción incorrecta]\n" +
                "3. [Opción correcta] (Correcta)\n" +
                "4. [Opción incorrecta]\n";

        OpenAiApi.ChatCompletionRequest request = new OpenAiApi.ChatCompletionRequest(
                List.of(new OpenAiApi.ChatCompletionMessage(prompt, OpenAiApi.ChatCompletionMessage.Role.USER)),
                "gpt-4",
                0.7,
                false
        );

        ResponseEntity<OpenAiApi.ChatCompletion> response = openAI.chatCompletionEntity(request);
        return response.getBody().choices().get(0).message().content();
    }
}