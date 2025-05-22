package overcut.model.services;

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

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
        }

        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("Script Python terminó con error, código: " + exitCode);
            }
        } catch (InterruptedException e) {
            throw new IOException("Error esperando al script Python", e);
        }

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

    /**
     * Valida que la palabra y la pista estén relacionadas de forma básica.
     */
    public boolean validateWordClueRelation(String word, String clue) {
        if (word == null || clue == null) return false;
        String sanitizedWord = word.trim().toLowerCase();
        String sanitizedClue = clue.trim().toLowerCase();
        if (sanitizedClue.contains(sanitizedWord)) return true;
        if (sanitizedWord.length() <= 3) return true;
        String partialWord = sanitizedWord.substring(0, Math.min(3, sanitizedWord.length()));
        return sanitizedClue.contains(partialWord);
    }

    /**
     * Valida palabra y pista usando script Python (llamado solo cuando el usuario valida una palabra).
     * @param userInput palabra escrita por el usuario
     * @param clue pista que se quiere verificar
     * @param language idioma "es" o "en"
     * @return true si es válida según datos reales
     */
    public boolean validateUserAnswerWithDatabase(String userInput, String clue, String language) throws IOException {
        String scriptPath = "src/main/resources/scripts/validate_crossword_word.py";
        ProcessBuilder pb = new ProcessBuilder("python", scriptPath, userInput, clue, language);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
        }

        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("Script Python terminó con error, código: " + exitCode);
            }
        } catch (InterruptedException e) {
            throw new IOException("Error esperando al script Python", e);
        }

        return output.toString().trim().equalsIgnoreCase("true");
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