package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.GridGame;
import es.udc.fic.tfg.model.entities.GridGameDao;
import es.udc.fic.tfg.model.entities.GridSlot;
import es.udc.fic.tfg.model.entities.GridSlotDao;
import es.udc.fic.tfg.rest.dtos.DriverInfo;
import es.udc.fic.tfg.rest.dtos.GridValidationResultDto;
import es.udc.fic.tfg.utils.NationalityIsoMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
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

        List<GridSlot> slots = new ArrayList<>();
        int maxPositions = Math.min(drivers.size(), 20); // limitar a 20
        for (int i = 0; i < maxPositions; i++) {
            DriverInfo driver = drivers.get(i);
            GridSlot slot = new GridSlot();
            slot.setGame(game);
            slot.setPositionGame(i + 1);
            slot.setNationalityCode(driver.getNationalityCode());
            slot.setFilledByPilotId(null);
            slots.add(slot);
        }

        game.setGridSlots(slots);
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
            StringBuilder jsonBuilder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuilder.append(line);
            }
            process.waitFor();

            ObjectMapper objectMapper = new ObjectMapper();
            // Convertir el JSON en un Map para extraer "valid"
            var resultMap = objectMapper.readValue(jsonBuilder.toString(), java.util.Map.class);
            return Boolean.TRUE.equals(resultMap.get("valid")); // ✔️ devuelve booleano

        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar script Python: " + e.getMessage(), e);
        }
    }

    private String getNationalityForPilot(String pilotName, int season) {
        try {
            List<String> command = List.of(
                    "python", "src/main/resources/scripts/get_pilot_nationality.py",
                    "--pilot", pilotName,
                    "--season", String.valueOf(season)
            );
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(output.toString(), Map.class);
            return (String) result.get("nationality");

        } catch (Exception e) {
            throw new RuntimeException("Error al obtener nacionalidad del piloto", e);
        }
    }


    @Override
    public GridValidationResultDto validatePilotAcrossGrid(Long gameId, String pilotName) {
        GridGame game = gridGameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Juego no encontrado"));
        int season = game.getSeasonYear();

        boolean valid;
        try {
            List<String> command = List.of(
                    "python", "src/main/resources/scripts/validate_grid_game.py",
                    "--pilot", pilotName,
                    "--season", String.valueOf(season)
            );
            ProcessBuilder pb = new ProcessBuilder(command);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            process.waitFor();

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(output.toString(), Map.class);
            valid = Boolean.TRUE.equals(result.get("valid"));
        } catch (Exception e) {
            throw new RuntimeException("Error al validar piloto", e);
        }

        String pilotNationality = getNationalityForPilot(pilotName, season);

        if (!valid || pilotNationality == null) {
            return new GridValidationResultDto(false, pilotName, pilotNationality, List.of());
        }

        List<GridSlot> slots = gridSlotDao.findByGameId(gameId);

        Optional<GridSlot> firstAvailableSlot = slots.stream()
                .filter(slot -> slot.getFilledByPilotId() == null)
                .filter(slot -> {
                    String slotNat = NationalityIsoMapper.normalizeNationality(slot.getNationalityCode());
                    String pilotNat = NationalityIsoMapper.normalizeNationality(pilotNationality);
                    return slotNat.equalsIgnoreCase(pilotNat);
                })
                .findFirst();

        if (firstAvailableSlot.isPresent()) {
            GridSlot slot = firstAvailableSlot.get();
            slot.setFilledByPilotId(pilotName);
            gridSlotDao.save(slot);
            return new GridValidationResultDto(true, pilotName, pilotNationality, List.of(slot.getPositionGame()));
        } else {
            return new GridValidationResultDto(false, pilotName, pilotNationality, List.of());
        }
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
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "src/main/resources/scripts/autocomplete_grid_pilot.py",
                    "--partial", partial
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
