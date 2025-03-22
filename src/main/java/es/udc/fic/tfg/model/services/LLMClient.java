package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.OpenAIPrompt;
import es.udc.fic.tfg.model.entities.OpenAIResponse;
import es.udc.fic.tfg.model.services.exceptions.QuestionGeneratorException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;


@Service
public class LLMClient {
    private final String apiKey;
    private final String model;
    private final String openAiUrl;
    private final RestTemplate restTemplate;

    @Autowired
    public LLMClient(
            @Value("${llm.api.key}") String apiKey,
            @Value("${llm.model}") String model,
            @Value("${llm.openai.url}") String openAiUrl,
            RestTemplate restTemplate
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.openAiUrl = openAiUrl;
        this.restTemplate = restTemplate;
    }

    public String generateQuestion(String prompt) throws QuestionGeneratorException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        String url = openAiUrl + "/chat/completions";

        OpenAIPrompt request = new OpenAIPrompt();
        request.setModel(model);
        request.setPrompt(prompt);
        request.setMaxTokens(100);
        request.setTemperature(0.7);

        HttpEntity<OpenAIPrompt> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<OpenAIResponse> response = restTemplate.postForEntity(url, entity, OpenAIResponse.class);
            return response.getBody().getChoices().get(0).getText();
        } catch (RestClientException e) {
           new QuestionGeneratorException("Error al llamar a OpenAI: ");
            throw new QuestionGeneratorException("Error al generar la pregunta");
        }
    }

    public boolean validateAnswer(String prompt) throws QuestionGeneratorException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        String url = openAiUrl + "/chat/completions";

        OpenAIPrompt request = new OpenAIPrompt();
        request.setModel(model);
        request.setPrompt(prompt);
        request.setMaxTokens(100);
        request.setTemperature(0.7);

        HttpEntity<OpenAIPrompt> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<OpenAIResponse> response = restTemplate.postForEntity(url, entity, OpenAIResponse.class);
            return Boolean.parseBoolean(response.getBody().getChoices().get(0).getText());
        } catch (RestClientException e) {
            new QuestionGeneratorException("Error al validar respuesta: ");
            throw new QuestionGeneratorException("Error al validar la respuesta");
        }
    }


}