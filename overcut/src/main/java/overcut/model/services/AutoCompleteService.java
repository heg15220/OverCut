package overcut.model.services;

import java.util.List;

public interface AutoCompleteService {
    List<String> getSuggestions(String name);
}
