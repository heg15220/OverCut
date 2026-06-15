package overcut.rest.controllers;

import overcut.model.entities.CareerModeSave;
import overcut.model.services.CareerModeSaveService;
import overcut.rest.dtos.CareerModeSaveRequestDto;
import overcut.rest.dtos.CareerModeSaveResponseDto;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/careerMode/saves")
public class CareerModeSaveController {

    private final CareerModeSaveService saveService;

    public CareerModeSaveController(CareerModeSaveService saveService) {
        this.saveService = saveService;
    }

    @PostMapping
    public CareerModeSaveResponseDto save(@RequestBody CareerModeSaveRequestDto request) {
        CareerModeSave saved = saveService.save(request.getCode(), request.getState());
        return new CareerModeSaveResponseDto(saved.getExportCode(), null);
    }

    @GetMapping("/{code}")
    public CareerModeSaveResponseDto load(@PathVariable String code) {
        CareerModeSave save = saveService.get(code);
        return new CareerModeSaveResponseDto(save.getExportCode(), saveService.readState(save));
    }
}
