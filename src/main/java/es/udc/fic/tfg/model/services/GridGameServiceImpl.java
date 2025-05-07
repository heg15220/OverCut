package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.GridGame;
import es.udc.fic.tfg.model.entities.GridGameDao;
import es.udc.fic.tfg.model.entities.GridSlot;
import es.udc.fic.tfg.model.entities.GridSlotDao;
import es.udc.fic.tfg.rest.dtos.DriverInfo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@Transactional
public class GridGameServiceImpl implements GridGameService{

    @Autowired
    private GridGameDao gridGameDao;

    @Autowired
    private GridSlotDao gridSlotDao;



    private List<DriverInfo> getDriversForSeason(int season) {
        String scriptPath = "src/main/resources/scripts/get_drivers_for_season.py";
        ProcessBuilder pb = new ProcessBuilder("python", scriptPath, "--season", String.valueOf(season));
        pb.redirectErrorStream(true);

        try {
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("Script Python terminó con error, código: " + exitCode);
            }

            ObjectMapper objectMapper = new ObjectMapper();
            DriverInfo[] driversArray = objectMapper.readValue(output.toString(), DriverInfo[].class);
            return Arrays.asList(driversArray);

        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar script get_drivers_for_season.py", e);
        }
    }

    @Override
    public GridGame createRandomGame() {
        int randomSeason = getRandomSeasonYear();
        GridGame game = new GridGame(randomSeason);

        List<DriverInfo> drivers = getDriversForSeason(randomSeason);
        Collections.shuffle(drivers);

        int maxPositions = Math.min(drivers.size(), 20); // limitar a 20
        for (int i = 0; i < maxPositions; i++) {
            DriverInfo driver = drivers.get(i);
            GridSlot slot = new GridSlot();
            slot.setGame(game);
            slot.setPositionGame(i + 1);
            slot.setNationalityCode(driver.getNationalityCode());
            game.getGridSlots().add(slot);
        }

        return gridGameDao.save(game);
    }

    @Override
    public List<GridSlot> getGrid(Long gameId) {
        return gridSlotDao.findByGameId(gameId);
    }

    private boolean runPythonValidationScript(Long gameId, String nationalityCode, String pilotName, int seasonYear) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "python", "src/main/resources/scripts/validate_grid_game.py",
                    "--nationality", nationalityCode,
                    "--pilot", pilotName,
                    "--season", String.valueOf(seasonYear)
            );
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String output = reader.readLine();
            process.waitFor();

            return output != null && output.contains("\"valid\": true");
        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar script Python: " + e.getMessage(), e);
        }
    }
    @Override
    public boolean validateSlot(Long gameId, int position, String pilotName) {
        GridSlot slot = gridSlotDao.findByGameId(gameId).stream()
                .filter(s -> s.getPositionGame() == position)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Slot no encontrado"));

        boolean valid = runPythonValidationScript(
                gameId, slot.getNationalityCode(), pilotName, slot.getGame().getSeasonYear()
        );

        if (valid) {
            slot.setFilledByPilotId(pilotName); // aquí puedes usar un ID si lo tienes
        }

        return valid;
    }


    private int getRandomSeasonYear() {
        // Aquí puede usarse directamente la base de datos (f1db) o una lista fija
        List<Integer> seasons = IntStream.rangeClosed(1950, 2024)
                .boxed()
                .collect(Collectors.toList());

        return seasons.get(new Random().nextInt(seasons.size()));
    }

    @Override
    public List<String> autocompletePilots(Long gameId, String partial) {
        GridGame game = gridGameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partida no encontrada: " + gameId));
        int season = game.getSeasonYear();

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "scripts/autocomplete_grid_pilot.py",
                    "--partial", partial,
                    "--season", String.valueOf(season)
            );
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder jsonBuilder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuilder.append(line);
            }
            process.waitFor();

            ObjectMapper objectMapper = new ObjectMapper();
            return Arrays.asList(objectMapper.readValue(jsonBuilder.toString(), String[].class));

        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar script de autocomplete: " + e.getMessage(), e);
        }
    }



}
