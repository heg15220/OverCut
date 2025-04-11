package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Map;

@Service
public class ValidationGameServiceImpl implements ValidationGameService{

    @Override
    public boolean validatePilot(String rowCriteria, String columnCriteria, String piloto) {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/validate_pilot.py");
            Process process = pb.start();

            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            String inputJson = new ObjectMapper().writeValueAsString(
                    Map.of("row_criteria_code", rowCriteria, "column_criteria_code", columnCriteria, "piloto", piloto)
            );

            writer.write(inputJson);
            writer.newLine();
            writer.flush();

            // TIMEOUT -> 5 segundos máximo para validar
            boolean finished = process.waitFor(30, java.util.concurrent.TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("Timeout validando piloto: demasiado lento");
            }

            StringBuilder outputJsonBuilder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                outputJsonBuilder.append(line);
            }

            String outputJson = outputJsonBuilder.toString().trim(); // evita espacios raros

            if (outputJson.isBlank()) {
                throw new RuntimeException("Respuesta vacía desde Python");
            }


            Map<String, Object> result = new ObjectMapper().readValue(outputJson, Map.class);
            return (Boolean) result.get("is_valid");

        } catch (Exception e) {
            throw new RuntimeException("Error validando piloto: " + e.getMessage(), e);
        }
    }

}
