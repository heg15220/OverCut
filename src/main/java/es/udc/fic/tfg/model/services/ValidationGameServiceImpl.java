package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ValidationGameServiceImpl implements ValidationGameService{

    @Override
    public boolean validatePilot(String rowCriteria, String columnCriteria, String piloto) {
        try {
            List<String> command = List.of(
                    "python",
                    "src/main/resources/scripts/validate_pilot.py",
                    "--row=" + rowCriteria,
                    "--col=" + columnCriteria,
                    "--pilot=" + piloto
            );

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder outputJson = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                outputJson.append(line);
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Error ejecutando script Python: " + outputJson);
            }

            Map<String, Object> result = new ObjectMapper().readValue(outputJson.toString(), Map.class);
            return (Boolean) result.get("is_valid");

        } catch (Exception e) {
            throw new RuntimeException("Error validando piloto: " + e.getMessage(), e);
        }
    }


}
