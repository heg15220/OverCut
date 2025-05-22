package overcut.rest.controllers;


import overcut.rest.dtos.OrderDriverGameConversor;
import overcut.model.entities.OrderDriverGame;
import overcut.model.services.OrderDriverGameService;
import overcut.rest.dtos.OrderDriverGameDto;
import overcut.rest.dtos.OrderSubmissionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orderDriver")
public class OrderDriverGameController {

    @Autowired
    private OrderDriverGameService orderService;

    @PostMapping("/start")
    public OrderDriverGameDto startGame(@RequestParam(defaultValue = "es") String lang) {
        OrderDriverGame game = orderService.startGame(lang);
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
