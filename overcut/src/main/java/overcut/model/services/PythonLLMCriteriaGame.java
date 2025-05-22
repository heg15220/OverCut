package overcut.model.services;

import java.io.*;

public class PythonLLMCriteriaGame {


    public static String executePythonScript(String scriptPath) throws IOException, InterruptedException {

        ProcessBuilder pb = new ProcessBuilder("python", scriptPath);
        pb.redirectErrorStream(true); // junta stdout + stderr
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
        }

        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Error ejecutando script Python (" + scriptPath + "): " + output);
        }

        return output.toString();
    }

    public static String executePythonScriptValidation(String scriptPath, String inputJson) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder("python", scriptPath);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
             BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {

            writer.write(inputJson);
            writer.newLine();
            writer.flush();

            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Error ejecutando script Python (" + scriptPath + "): " + output);
            }

            return output.toString();
        }
    }
}
