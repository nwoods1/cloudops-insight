package com.cloudops.backend.controller;

import com.cloudops.backend.model.ChatRequest;
import com.cloudops.backend.model.ChatResponse;
import com.cloudops.backend.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        String answer = chatService.askQuestion(request.getQuestion());
        return ResponseEntity.ok(new ChatResponse(answer));
    }
}