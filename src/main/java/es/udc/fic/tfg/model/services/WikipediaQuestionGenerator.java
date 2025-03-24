package es.udc.fic.tfg.model.services;

import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.mistralai.MistralAiChatOptions;
import org.springframework.ai.mistralai.api.MistralAiApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WikipediaQuestionGenerator {

    @Autowired
    private CustomChatModel chatModel;

    public String generateQuestion(String topic) {
        String prompt = "Genera una pregunta sobre " + topic + " usando información de Wikipedia. " +
                "Devuélvela en el siguiente formato:\n" +
                "Pregunta: [Aquí va la pregunta]\n" +
                "Opciones:\n" +
                "1. [Opción incorrecta]\n" +
                "2. [Opción incorrecta]\n" +
                "3. [Opción correcta] (Correcta)\n" +
                "4. [Opción incorrecta]\n";

        var options = MistralAiChatOptions.builder()
                .model(MistralAiApi.ChatModel.LARGE.getValue())
                .temperature(0.7)
                .build();

        ChatResponse response = chatModel.call(
                new Prompt(new UserMessage(prompt), options)
        );

        return response.getResult().getOutput().getText();
    }
}