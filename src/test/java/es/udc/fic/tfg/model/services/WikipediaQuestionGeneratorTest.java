package es.udc.fic.tfg.model.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@SpringBootTest
@SpringJUnitConfig
public class WikipediaQuestionGeneratorTest {

    @MockBean
    private OpenAiApi openAI;

    private WikipediaQuestionGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new WikipediaQuestionGenerator(openAI);
    }

    @Test
    void testGenerateQuestion() {
        // Configurar el mock
        String responseContent = "Pregunta: ¿Cuál es la capital de España?\n" +
                "Opciones:\n" +
                "1. Barcelona\n" +
                "2. Valencia\n" +
                "3. Madrid (Correcta)\n" +
                "4. Sevilla";

        when(openAI.chatCompletionEntity(any()))
                .thenReturn(ResponseEntity.ok(new OpenAiApi.ChatCompletion(
                        "chat-completion-id",
                        List.of(new OpenAiApi.ChatCompletion.Choice(
                                OpenAiApi.ChatCompletionFinishReason.STOP,
                                1,
                                new OpenAiApi.ChatCompletionMessage(responseContent, null),
                                null
                        )),
                        null,
                        null,
                        null,
                        null,
                        null,null
                )));

        // Ejecutar el test
        String result = generator.generateQuestion("España");

        // Verificar el resultado
        assertNotNull(result);
        assertTrue(result.contains("Pregunta:"));
        assertTrue(result.contains("Opciones:"));
    }
}