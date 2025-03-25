package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.rest.dtos.QuestionAI;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class QuestionLLMServiceImpl implements QuestionLLMService {

    @Override
    public List<QuestionAI> generateQuestionsAI() {
        List<QuestionAI> questions = new ArrayList<>();

        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/generate_questions.py");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Leer la salida JSON
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder jsonOutput = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonOutput.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                ObjectMapper mapper = new ObjectMapper();
                QuestionAI[] preguntas = mapper.readValue(jsonOutput.toString(), QuestionAI[].class);
                questions = Arrays.asList(preguntas);
            } else {
                throw new RuntimeException("Error ejecutando el script: código " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
            // puedes lanzar excepción personalizada si quieres
        }

        return questions;
    }

}
