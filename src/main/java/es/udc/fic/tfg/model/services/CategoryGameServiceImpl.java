package es.udc.fic.tfg.model.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.udc.fic.tfg.model.entities.CategoryGame;
import es.udc.fic.tfg.model.entities.CategoryGameDao;
import es.udc.fic.tfg.model.entities.CategorySlot;
import es.udc.fic.tfg.model.entities.CategorySlotDao;
import es.udc.fic.tfg.model.services.exceptions.CategoryGameGenerationException;
import es.udc.fic.tfg.utils.CategoryLetterCacheLoader;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
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


    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public CategoryGame startGame(String lang) {
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

                return categoryGameDao.save(game);
            }
        }

        throw new CategoryGameGenerationException("NO_VALID_LETTER_FOUND", "Todas las letras tienen 0 categorías viables");
    }

    @Override
    public CategoryGame submitAnswers(Long gameId, Map<String, String> answers) {
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
                ProcessBuilder pb = new ProcessBuilder("python",
                        "src/main/resources/scripts/validate_category_answer.py",
                        "--category", category,
                        "--answer", userAnswer,
                        "--letter", String.valueOf(letter),
                        "--lang", "es"
                );

                Process process = pb.start();
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String jsonOutput = reader.lines().collect(Collectors.joining());
                process.waitFor();

                JsonNode result = mapper.readTree(jsonOutput);
                boolean isValid = result.get("valid").asBoolean(false);
                slot.setValid(isValid);

            } catch (Exception e) {
                slot.setValid(false); // fallback
                System.err.println("Error validando categoría: " + category + ", respuesta: " + userAnswer);
                e.printStackTrace();
            }
        }

        // 💡 Forzar persistencia y recarga de los datos actualizados
        categoryGameDao.save(game);
        categorySlotDao.flush(); // Forzar escritura en DB
        return categoryGameDao.findById(gameId).orElseThrow(); // Volver a cargar
    }


    @Override
    public CategoryGame getGameStatus(Long gameId) {
        return categoryGameDao.findById(gameId).orElseThrow();
    }
}
