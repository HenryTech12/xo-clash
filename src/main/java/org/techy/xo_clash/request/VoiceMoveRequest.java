package org.techy.xo_clash.request;

import lombok.Data;

@Data
public class VoiceMoveRequest {
    private String command;
    private String player;
    private String sessionId;
}
