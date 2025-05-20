package es.udc.fic.tfg.rest.controllers;


import es.udc.fic.tfg.model.entities.OrderDriverGame;
import es.udc.fic.tfg.model.services.OrderDriverGameService;
import es.udc.fic.tfg.rest.dtos.OrderDriverGameConversor;
import es.udc.fic.tfg.rest.dtos.OrderDriverGameDto;
import es.udc.fic.tfg.rest.dtos.OrderSubmissionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orderDriver")
public class OrderDriverGameController {

    @Autowired
    private OrderDriverGameService orderService;

    @PostMapping("/start")
    public OrderDriverGameDto startGame() {
        OrderDriverGame game = orderService.startGame();
        return OrderDriverGameConversor.toDto(game);
    }

    @PostMapping("/submit")
    public OrderDriverGameDto submitOrder(@RequestBody OrderSubmissionDto submission) {
        OrderDriverGame game = orderService.validateSubmission(submission);
        return OrderDriverGameConversor.toDto(game);
    }

    @GetMapping("/{gameId}")
    public OrderDriverGameDto getGame(@PathVariable Long gameId) {
        OrderDriverGame game = orderService.getGame(gameId);
        return OrderDriverGameConversor.toDto(game);
    }
}
