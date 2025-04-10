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

            String outputJson = reader.readLine();
            process.waitFor();

            Map<String, Object> result = new ObjectMapper().readValue(outputJson, Map.class);
            return (Boolean) result.get("is_valid");

        } catch (Exception e) {
            throw new RuntimeException("Error validating pilot", e);
        }
    }
}
