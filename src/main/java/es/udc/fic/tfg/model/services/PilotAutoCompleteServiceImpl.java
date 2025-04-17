package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;

@Service
public class PilotAutoCompleteServiceImpl implements AutoCompleteService{

    @Override
    public List<String> getSuggestions(String name) {
        try {
            ProcessBuilder pb = new ProcessBuilder("python",
                    "src/main/resources/scripts/autocomplete_pilot.py",
                    "--name=" + name);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            process.waitFor();
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(output.toString(), List.class);

        } catch (Exception e) {
            throw new RuntimeException("Error ejecutando script de autocompletado: " + e.getMessage(), e);
        }
    }
}
