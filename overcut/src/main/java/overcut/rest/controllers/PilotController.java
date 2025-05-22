package overcut.rest.controllers;

import overcut.model.services.AutoCompleteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pilots")
public class PilotController {

    @Autowired
    private AutoCompleteService autocompleteService;

    @GetMapping("/autocomplete")
    public List<String> autocompletePilots(@RequestParam String name) {
        return autocompleteService.getSuggestions(name);
    }
}
