package overcut.model.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CooldownException;
import overcut.utils.NationalityIsoMapper;
import overcut.rest.dtos.DriverInfo;
import overcut.rest.dtos.GridSlotReveal;
import overcut.rest.dtos.GridValidationResultDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class GridGameServiceImpl implements GridGameService{

    @Autowired
    private GridGameDao gridGameDao;

    @Autowired
    private GridSlotDao gridSlotDao;

    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao;


    private final Map<Integer, List<DriverInfo>> seasonCache = new HashMap<>();

    private List<DriverInfo> getDriversForSeason(int season) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8000/get-drivers-for-season?season=" + season))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200)
                throw new RuntimeException("FastAPI error: " + response.body());

            ObjectMapper mapper = new ObjectMapper();
            return Arrays.asList(mapper.readValue(response.body(), DriverInfo[].class));
        } catch (Exception e) {
            throw new RuntimeException("Error obteniendo pilotos de la temporada", e);
        }
    }

    private boolean runPythonValidationScript(Long gameId, String nationalityCode, String pilotName, int seasonYear) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            String url = String.format("http://localhost:8000/validate-grid-pilot?pilot=%s&season=%d",
                    URLEncoder.encode(pilotName, StandardCharsets.UTF_8), seasonYear);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(response.body(), Map.class);
            return Boolean.TRUE.equals(result.get("valid"));
        } catch (Exception e) {
            throw new RuntimeException("Error al validar piloto", e);
        }
    }

    private String getNationalityForPilot(String pilotName, int season) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            String url = String.format("http://localhost:8000/get-pilot-nationality?pilot=%s&season=%d",
                    URLEncoder.encode(pilotName, StandardCharsets.UTF_8), season);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> result = mapper.readValue(response.body(), Map.class);
            return (String) result.get("nationality");
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener nacionalidad del piloto", e);
        }
    }

    @Override
    public GridGame createRandomGame(Long userId) {

        if (!cooldownService.canPlay("GridGame", userId)) {
            long wait = cooldownService.secondsUntilNextPlay("GridGame", userId);
            throw new CooldownException("WAIT", wait);
        }

        int randomSeason = getRandomSeasonYear();
        GridGame game = new GridGame(randomSeason);

        List<DriverInfo> drivers = getDriversForSeason(randomSeason);
        Collections.shuffle(drivers);

        List<GridSlot> slots = new ArrayList<>();
        int maxPositions = drivers.size();
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
        GridGame gridGameSaved = gridGameDao.save(game);
        cooldownService.registerPlay("GridGame", userId);
        return gridGameSaved;
    }

    @Override
    public List<GridSlot> getGrid(Long gameId) {
        return gridSlotDao.findByGameId(gameId);
    }

    @Override
    public GridValidationResultDto validatePilotAcrossGrid(Long gameId, String pilotName) {
        GridGame game = gridGameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Juego no encontrado"));
        int season = game.getSeasonYear();

        boolean valid = runPythonValidationScript(gameId, null, pilotName, season);
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
        List<Integer> seasons = IntStream.rangeClosed(1950, 2024).boxed().collect(Collectors.toList());
        return seasons.get(new Random().nextInt(seasons.size()));
    }

    @Override
    public List<String> autocompletePilots(Long gameId, String partial) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            String url = "http://localhost:8000/autocomplete-grid-pilot?partial=" + URLEncoder.encode(partial, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            ObjectMapper objectMapper = new ObjectMapper();
            return Arrays.asList(objectMapper.readValue(response.body(), String[].class));
        } catch (Exception e) {
            throw new RuntimeException("Error en autocomplete", e);
        }
    }

    @Override
    public List<GridSlotReveal> revealAllAnswers(Long gameId) {
        GridGame game = gridGameDao.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Juego no encontrado"));

        int season = game.getSeasonYear();
        List<GridSlot> slots = gridSlotDao.findByGameId(gameId);

        Set<String> alreadyUsedPilots = slots.stream()
                .map(GridSlot::getFilledByPilotId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (GridSlot slot : slots) {
            if (slot.getFilledByPilotId() == null) {
                String targetNationality = NationalityIsoMapper.normalizeNationality(slot.getNationalityCode());

                String pilot = getAnyValidPilotForSlot(targetNationality, season, alreadyUsedPilots);
                if (pilot != null) {
                    slot.setFilledByPilotId(pilot);
                    alreadyUsedPilots.add(pilot);
                }
            }
        }

        List<GridSlot> updated = gridSlotDao.saveAll(slots);

        return updated.stream()
                .map(slot -> new GridSlotReveal(
                        slot.getPositionGame(),
                        slot.getNationalityCode(),
                        slot.getFilledByPilotId()
                ))
                .collect(Collectors.toList());
    }

    private List<DriverInfo> getCachedDriversForSeason(int season) {
        return seasonCache.computeIfAbsent(season, this::getDriversForSeason);
    }

    private String getAnyValidPilotForSlot(String targetNationality, int season, Set<String> alreadyUsed) {
        List<DriverInfo> drivers = getCachedDriversForSeason(season);

        for (DriverInfo driver : drivers) {
            String normalized = NationalityIsoMapper.normalizeNationality(driver.getNationalityCode());
            if (normalized.equalsIgnoreCase(targetNationality) && !alreadyUsed.contains(driver.getName())) {
                return driver.getName();
            }
        }
        return null;
    }
}
