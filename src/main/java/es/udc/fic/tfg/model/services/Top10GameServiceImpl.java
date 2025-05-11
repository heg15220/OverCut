package es.udc.fic.tfg.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.Top10Game;
import es.udc.fic.tfg.model.entities.Top10GameDao;
import es.udc.fic.tfg.model.entities.Top10Slot;
import es.udc.fic.tfg.model.entities.Top10SlotDao;
import es.udc.fic.tfg.rest.dtos.GridSlotReveal;
import es.udc.fic.tfg.rest.dtos.GridValidationResultDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class Top10GameServiceImpl implements Top10GameService {

    @Autowired
    private Top10GameDao top10GameDao;

    @Autowired
    private Top10SlotDao top10SlotDao;

    @Override
    public Top10Game createGame(String lang) {
        try {
            ProcessBuilder pb = new ProcessBuilder("python", "src/main/resources/scripts/generate_top10_game.py");
            pb.redirectErrorStream(true);

            // ⬅️ Pasar el idioma al entorno del script
            pb.environment().put("LANG", lang);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder json = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) json.append(line);

            process.waitFor();
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> data = mapper.readValue(json.toString(), Map.class);

            Top10Game game = new Top10Game();
            game.setSeasonYear((Integer) data.get("seasonYear"));
            game.setRaceId((Integer) data.get("raceId"));
            game.setRaceName((String) data.get("raceName"));

            List<Map<String, String>> top10 = (List<Map<String, String>>) data.get("top10");
            List<Top10Slot> slots = new ArrayList<>();
            for (int i = 0; i < top10.size(); i++) {
                Map<String, String> pilot = top10.get(i);
                Top10Slot slot = new Top10Slot();
                slot.setPositionGame(i + 1);
                slot.setCorrectPilotName(pilot.get("name"));
                slot.setNationalityCode(pilot.get("nationality"));
                slot.setFilledByPilotName(null);
                slot.setGame(game);
                slots.add(slot);
            }

            game.setSlots(slots);
            return top10GameDao.save(game);

        } catch (Exception e) {
            throw new RuntimeException("Error al generar juego Top10", e);
        }
    }



    @Override
    public List<Top10Slot> getGrid(Long gameId) {
        return top10SlotDao.findByGameId(gameId);
    }


    @Override
    public GridValidationResultDto validatePilot(Long gameId, String pilotName) {
        Top10Game game = top10GameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Juego no encontrado"));

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "python", "src/main/resources/scripts/validate_top10_pilot.py",
                    "--pilot", pilotName,
                    "--raceId", String.valueOf(game.getRaceId())
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder json = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) json.append(line);

            process.waitFor();
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(json.toString(), Map.class);

            boolean valid = Boolean.TRUE.equals(result.get("valid"));
            Integer position = (Integer) result.get("position");

            if (valid && position != null) {
                Top10Slot slot = top10SlotDao.findByGameId(gameId).stream()
                        .filter(s -> s.getPositionGame().equals(position))
                        .findFirst().orElseThrow();

                if (slot.getFilledByPilotName() == null) {
                    slot.setFilledByPilotName(pilotName);
                    top10SlotDao.save(slot);
                }

                return new GridValidationResultDto(
                        true,
                        pilotName,
                        slot.getNationalityCode(), // ✅ ahora sí se devuelve la nacionalidad correcta
                        List.of(position)
                );
            } else {
                return new GridValidationResultDto(false, pilotName, null, List.of());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error validando piloto", e);
        }
    }


    @Override
    public List<GridSlotReveal> revealAllAnswers(Long gameId) {
        Top10Game game = top10GameDao.findById(gameId).orElseThrow();
        List<Top10Slot> slots = top10SlotDao.findByGameId(gameId);

        for (Top10Slot slot : slots) {
            if (slot.getFilledByPilotName() == null) {
                slot.setFilledByPilotName(slot.getCorrectPilotName());
            }
        }

        top10SlotDao.saveAll(slots);

        return slots.stream()
                .map(slot -> new GridSlotReveal(
                        slot.getPositionGame(), null, slot.getFilledByPilotName()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<String> autocompletePilots(Long gameId, String query) {
        try {
            List<String> command = List.of(
                    "python",
                    "src/main/resources/scripts/autocomplete_grid_pilot.py",
                    "--partial", query
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
            return Arrays.asList(mapper.readValue(output.toString(), String[].class));

        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar script de autocompletado", e);
        }
    }



}
