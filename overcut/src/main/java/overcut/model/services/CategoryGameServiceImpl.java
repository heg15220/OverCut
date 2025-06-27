package overcut.model.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import overcut.model.entities.*;
import overcut.model.services.exceptions.CategoryGameGenerationException;
import overcut.model.services.exceptions.CooldownException;
import overcut.utils.CategoryLetterCacheLoader;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryGameServiceImpl implements CategoryGameService {

    @Autowired
    private CategoryGameDao categoryGameDao;

    @Autowired
    private CategorySlotDao categorySlotDao;

    @Autowired
    private CategoryLetterCacheLoader cacheLoader;


    @Autowired
    private CooldownService cooldownService;

    @Autowired
    private UserDao userDao; // si aún no está

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public CategoryGame startGame(String lang, Long userId) {
        if (!cooldownService.canPlay("CategoryGame", userId)) {
            long wait = cooldownService.secondsUntilNextPlay("CategoryGame", userId);
            throw new CooldownException("WAIT", wait);
        }



        Map<String, Map<String, Boolean>> cache = cacheLoader.getCache(lang);
        List<String> letters = new ArrayList<>(cache.keySet());
        Collections.shuffle(letters);

        for (String letter : letters) {
            Map<String, Boolean> catMap = cache.get(letter);
            List<String> validCategories = catMap.entrySet().stream()
                    .filter(Map.Entry::getValue)
                    .map(Map.Entry::getKey)
                    .toList();

            if (!validCategories.isEmpty()) {
                List<String> selected = new ArrayList<>(validCategories);
                Collections.shuffle(selected);
                List<String> selected5 = selected.subList(0, Math.min(5, selected.size()));

                CategoryGame game = new CategoryGame();
                game.setLetter(letter.charAt(0));

                for (String category : selected5) {
                    CategorySlot slot = new CategorySlot();
                    slot.setGame(game);
                    slot.setCategory(category);
                    slot.setAnswer(null);
                    slot.setValid(null);
                    game.getSlots().add(slot);
                }

                CategoryGame categoryGame = categoryGameDao.save(game);
                cooldownService.registerPlay("CategoryGame", userId);
                return categoryGame;
            }
        }

        throw new CategoryGameGenerationException("NO_VALID_LETTER_FOUND", "Todas las letras tienen 0 categorías viables");
    }

    @Override
    public CategoryGame submitAnswers(Long gameId, Map<String, String> answers, String lang) {
        CategoryGame game = categoryGameDao.findById(gameId).orElseThrow();
        game.setFinished(true);
        char letter = game.getLetter();

        for (CategorySlot slot : game.getSlots()) {
            String category = slot.getCategory();
            String userAnswer = answers.getOrDefault(category, "").trim();

            slot.setAnswer(userAnswer);

            if (userAnswer.isEmpty()) {
                slot.setValid(false);
                continue;
            }

            try {
                String baseUrl = "http://localhost:8000/validate-category";
                String query = String.format(
                        "%s?category=%s&answer=%s&letter=%s&lang=%s",
                        baseUrl,
                        URLEncoder.encode(category, StandardCharsets.UTF_8),
                        URLEncoder.encode(userAnswer, StandardCharsets.UTF_8),
                        URLEncoder.encode(String.valueOf(letter), StandardCharsets.UTF_8),
                        URLEncoder.encode(lang, StandardCharsets.UTF_8)
                );

                HttpURLConnection connection = (HttpURLConnection) new URL(query).openConnection();
                connection.setRequestMethod("GET");

                try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    String json = in.lines().collect(Collectors.joining());
                    JsonNode result = mapper.readTree(json);
                    boolean isValid = result.get("valid").asBoolean(false);
                    slot.setValid(isValid);
                }

            } catch (Exception e) {
                slot.setValid(false); // fallback
                System.err.println("Error validando categoría: " + category + ", respuesta: " + userAnswer);
                e.printStackTrace();
            }
        }

        categoryGameDao.save(game);
        categorySlotDao.flush();
        return categoryGameDao.findById(gameId).orElseThrow();
    }



    @Override
    public CategoryGame getGameStatus(Long gameId) {
        return categoryGameDao.findById(gameId).orElseThrow();
    }
}