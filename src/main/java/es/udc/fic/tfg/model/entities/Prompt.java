package es.udc.fic.tfg.model.entities;

import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.model.ModelOptions;
import org.springframework.ai.model.ModelRequest;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Prompt implements ModelRequest<List<Message>> {
    private final List<Message> messages;
    private ChatOptions chatOptions;

    public Prompt() {
        this.messages = new ArrayList<>();
        this.chatOptions = ChatOptions.builder().build();
    }

    // Constructor para crear un prompt con mensajes específicos
    public Prompt(List<Message> messages) {
        this.messages = Collections.unmodifiableList(messages);
        this.chatOptions = ChatOptions.builder().build();
    }

    // Método para agregar un mensaje del sistema
    public void addSystemMessage(String text) {
        SystemMessage systemMessage = new SystemMessage(text);
        messages.add(systemMessage);
    }

    // Método para agregar un mensaje de usuario
    public void addUserMessage(String text) {
        UserMessage userMessage = new UserMessage(text);
        messages.add(userMessage);
    }

    @Override
    public List<Message> getInstructions() {
        return Collections.unmodifiableList(messages);
    }

    @Override
    public ModelOptions getOptions() {
        return chatOptions;
    }
}