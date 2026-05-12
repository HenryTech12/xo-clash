package org.techy.xo_clash.mapper;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.dto.UserDTO;
import org.techy.xo_clash.model.User;

import java.util.Objects;

@Service
public class UserMapper {

    @Autowired
    private ModelMapper mapper;

    public User convertToEntity(UserDTO userDTO) {
        if(!Objects.isNull(userDTO))
            return mapper.map(userDTO, User.class);
        else
            throw new IllegalArgumentException("UserDTO cannot be null");
    }

    public UserDTO convertToDTO(User user) {
        if(!Objects.isNull(user))
            return mapper.map(user, UserDTO.class);
        else
            throw new IllegalArgumentException("User cannot be null");
    }
}
