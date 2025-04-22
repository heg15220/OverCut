package es.udc.fic.tfg.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

public class BotUtils {

    public static List<String> getValidPilots(String rowCrit, String colCrit, Integer since, Integer until) {
        try {
            List<String> command = new ArrayList<>(List.of(
                    "python", "src/main/resources/scripts/get_valid_pilots.py",
                    "--row", rowCrit,
                    "--col", colCrit
            ));
            if (since != null) {
                command.add("--since");
                command.add(String.valueOf(since));
            }
            if (until != null) {
                command.add("--until");
                command.add(String.valueOf(until));
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            String output = new String(p.getInputStream().readAllBytes());
            int exitCode = p.waitFor();
            if (exitCode != 0) return List.of();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(output);
            JsonNode array = json.get("valid_pilots");

            List<String> result = new ArrayList<>();
            if (array != null && array.isArray()) {
                for (JsonNode node : array) {
                    result.add(node.asText());
                }
            }
            return result;

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
}
