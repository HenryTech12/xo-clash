package org.techy.xo_clash.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.request.GameMoveRequest;
import org.techy.xo_clash.request.VoiceMoveRequest;
import org.techy.xo_clash.response.VoiceMoveResponse;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class AiService {
    private final ChatClient chatClient;

    @Autowired
    private ObjectMapper objectMapper;

    public AiService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public GameMoveRequest processTextToHandleMove(VoiceMoveRequest voiceMoveRequest) {
        String systemPrompt = """
        Convert the following sentence into a Tic Tac Toe move.

        Rules:
        - Board is 3x3
        - Rows and columns are 0 to 2
        - Return ONLY JSON like:
          {"row": 1, "col": 2}

        Sentence: "%s"
        """.formatted(voiceMoveRequest.getCommand());
        
        SystemMessage systemMessage = new SystemMessage(systemPrompt);
        Prompt prompt = new Prompt(systemMessage);
        
        try {
            // Add a timeout of 10 seconds to AI calls to prevent system hanging
            return CompletableFuture.supplyAsync(() -> {
                String response = chatClient.prompt(prompt).call().chatResponse()
                        .getResult().getOutput().getText();
                try {
                    String jsonPart = response.substring(response.indexOf("{"), response.lastIndexOf("}") + 1);
                    VoiceMoveResponse voiceMoveResponse = objectMapper.readValue(jsonPart, VoiceMoveResponse.class);
                    return new GameMoveRequest(voiceMoveRequest.getSessionId(), voiceMoveResponse.getRow(), voiceMoveResponse.getCol(), voiceMoveRequest.getPlayer());
                } catch (Exception e) {
                    log.error("Failed to parse AI response: {}", response, e);
                    return null;
                }
            }).get(10, java.util.concurrent.TimeUnit.SECONDS);
        } catch (java.util.concurrent.TimeoutException e) {
            log.error("AI service timed out for command: {}", voiceMoveRequest.getCommand());
            return null;
        } catch (Exception e) {
            log.error("AI service error for command: {}", voiceMoveRequest.getCommand(), e);
            return null;
        }
    }
}
