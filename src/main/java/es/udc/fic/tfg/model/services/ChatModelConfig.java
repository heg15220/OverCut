package es.udc.fic.tfg.model.services;

import org.springframework.ai.mistralai.MistralAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatModelConfig {
    @Bean
    public CustomChatModel customChatModel(MistralAiChatModel mistralAiChatModel) {
        return new CustomChatModel(mistralAiChatModel);
    }
}
