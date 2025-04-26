package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.*;

@Component
public class CrosswordGeneratorPythonAdapter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Ejecuta el script Python y devuelve la estructura de datos generada.
     * @param rows filas del crucigrama
     * @param cols columnas del crucigrama
     * @param language idioma ("es" o "en")
     * @return lista de palabras con posiciones, pistas y sentido
     */
    public List<CrosswordWordData> generateCrossword(int rows, int cols, String language) throws IOException {
        String scriptPath = "src/main/resources/scripts/generate_crossword.py";
        ProcessBuilder pb = new ProcessBuilder("python", scriptPath, String.valueOf(rows), String.valueOf(cols), language);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Leer la salida JSON del script Python
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
        }

        // Esperar a que termine
        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("Script Python terminó con error, código: " + exitCode);
            }
        } catch (InterruptedException e) {
            throw new IOException("Error esperando al script Python", e);
        }

        // Parsear JSON
        List<CrosswordWordData> result = new ArrayList<>();
        JsonNode root = objectMapper.readTree(output.toString());
        for (JsonNode wordNode : root.get("words")) {
            CrosswordWordData wordData = new CrosswordWordData();
            wordData.word = wordNode.get("word").asText();
            wordData.clue = wordNode.get("clue").asText();
            wordData.row = wordNode.get("row").asInt();
            wordData.col = wordNode.get("col").asInt();
            wordData.direction = wordNode.get("direction").asText();
            result.add(wordData);
        }
        return result;
    }

    // Clase interna para transferir los datos
    public static class CrosswordWordData {
        public String word;
        public String clue;
        public int row;
        public int col;
        public String direction;
    }
}
