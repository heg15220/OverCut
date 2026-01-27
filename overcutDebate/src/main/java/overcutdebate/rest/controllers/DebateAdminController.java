package overcutdebate.rest.controllers;

import org.springframework.web.bind.annotation.*;
import overcutdebate.model.services.DebateRoomService;
import overcutdebate.rest.dtos.CreateRoomRequestDto;
import overcutdebate.rest.dtos.RoomDetailDto;

@RestController
@RequestMapping("/api/debate/admin")
public class DebateAdminController {

    private final DebateRoomService service;

    public DebateAdminController(DebateRoomService service) {
        this.service = service;
    }

    @PostMapping("/rooms")
    public RoomDetailDto create(@RequestBody CreateRoomRequestDto req) {
        return service.createRoom(req.scope, req.topic, req.joinSeconds);
    }
}
