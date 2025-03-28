package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.rest.dtos.QuestionAI;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.*;

@Service
public class QuestionLLMServiceImpl implements QuestionLLMService {


    @Override
    public List<QuestionAI> generateQuestionsAI() {
        List<QuestionAI> questions = new ArrayList<>();

        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/generate_questions.py");

            pb.redirectErrorStream(true);
            Process process = pb.start();

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
        }

        return questions;
    }
    @Override
    public List<QuestionAI> generateRegulationQuestions(String category, Integer level) {
        List<QuestionAI> questions = new ArrayList<>();
        try {
            List<String> command = new ArrayList<>();
            command.add("python");
            command.add("src/main/resources/scripts/regulation_questions.py");

            // Añadir argumentos si están presentes
            if (category != null && !category.isEmpty()) {
                command.add("--category=" + category);
            }
            if (level != null) {
                command.add("--level=" + level);
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

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
        }

        return questions;
    }


    @Override
    public String validateQuestion(String question, List<String> answers) {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/validate_question.py");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Enviar datos al script
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
            ObjectMapper mapper = new ObjectMapper();
            writer.write(mapper.writeValueAsString(Map.of(
                    "question", question,
                    "answers", answers
            )));
            writer.flush();
            writer.close();

            // Leer resultado
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder jsonOutput = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonOutput.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                Map<?, ?> response = mapper.readValue(jsonOutput.toString(), Map.class);
                return (String) response.get("correctAnswer");
            } else {
                throw new RuntimeException("Error al ejecutar el validador, código: " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }



}
