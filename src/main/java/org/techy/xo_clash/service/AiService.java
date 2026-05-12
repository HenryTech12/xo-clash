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

@Service
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
        String response = chatClient.prompt(prompt).call().chatResponse().
                getResult().getOutput().getText();
        try {
            VoiceMoveResponse voiceMoveResponse = objectMapper.readValue(response, VoiceMoveResponse.class);
            return new GameMoveRequest(voiceMoveRequest.getSessionId(),voiceMoveResponse.getRow(), voiceMoveResponse.getCol(), voiceMoveRequest.getPlayer());
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
