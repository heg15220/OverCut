package es.udc.fic.tfg.model.services;

import java.util.List;

public interface AutoCompleteService {
    List<String> getSuggestions(String name);
}
