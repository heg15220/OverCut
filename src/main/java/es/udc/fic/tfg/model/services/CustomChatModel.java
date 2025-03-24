package es.udc.fic.tfg.model.services;

import org.hibernate.validator.constraints.CodePointLength;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.mistralai.MistralAiChatModel;
import org.springframework.ai.model.Model;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.Arrays;
import java.util.List;

@Component
public class CustomChatModel implements ChatModel {
    private final MistralAiChatModel mistralAiChatModel;

    public CustomChatModel(MistralAiChatModel mistralAiChatModel) {
        this.mistralAiChatModel = mistralAiChatModel;
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        try {
            ChatResponse response = mistralAiChatModel.call(prompt);
            return new ChatResponse((List<Generation>) response.getResult());
        } catch (Exception e) {
            throw new RuntimeException("Error en el modelo de chat: " + e.getMessage(), e);
        }
    }

    @Override
    public String call(String message) {
        Prompt prompt = new Prompt(new UserMessage(message));
        ChatResponse response = call(prompt);
        return response.getResult().getOutput().getText();
    }

    @Override
    public String call(Message... messages) {
        Prompt prompt = new Prompt(Arrays.asList(messages));
        ChatResponse response = call(prompt);
        return response.getResult().getOutput().getText();
    }

    @Override
    public ChatOptions getDefaultOptions() {
        return ChatOptions.builder()
                .model("gpt-3.5-turbo")
                .temperature(0.7)
                .maxTokens(2048)
                .build();
    }

    @Override
    public Flux<ChatResponse> stream(Prompt prompt) {
        return Flux.just(call(prompt));
    }
}
