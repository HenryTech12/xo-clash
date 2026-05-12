package org.techy.xo_clash.mapper;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.dto.PlaysDTO;
import org.techy.xo_clash.dto.UserDTO;
import org.techy.xo_clash.model.Plays;
import org.techy.xo_clash.model.User;

import java.util.Objects;

@Service
public class PlaysMapper {

    @Autowired
    private ModelMapper mapper;

    public Plays convertToEntity(PlaysDTO playsDTO) {
       Plays plays = new Plays();
       plays.setDraw(playsDTO.isDraw());
       plays.setWin(playsDTO.isWin());
       plays.setSessionId(playsDTO.getSessionId());
       plays.setAgainstPlayerId(playsDTO.getAgainstPlayerId());
       plays.setPlayerId(playsDTO.getPlayerId());

       return plays;
    }

    public PlaysDTO convertToDTO(Plays plays) {
       PlaysDTO playsDTO = new PlaysDTO();
       playsDTO.setDraw(plays.isDraw());
       playsDTO.setWin(plays.isWin());
       playsDTO.setSessionId(plays.getSessionId());
       playsDTO.setAgainstPlayerId(plays.getAgainstPlayerId());
       playsDTO.setPlayerId(plays.getPlayerId());

       return playsDTO;
    }
}
