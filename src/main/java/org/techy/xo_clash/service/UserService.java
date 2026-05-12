package org.techy.xo_clash.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.dto.UserDTO;
import org.techy.xo_clash.dto.UserRole;
import org.techy.xo_clash.handler.UserNotFoundException;
import org.techy.xo_clash.mapper.UserMapper;
import org.techy.xo_clash.model.User;
import org.techy.xo_clash.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Cacheable(value = "users", key="#username")
    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));
        return userMapper.convertToDTO(user);
    }

    @Cacheable(value = "userlog", key="#username")
    public User fetchByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));
    }

    @CachePut(value = "users", key = "#result.username")
    public UserDTO createUser(UserDTO userDTO) {
        User user = userMapper.convertToEntity(userDTO);
        user.setJoined(LocalDateTime.now());
        user.setRole(UserRole.USER.name());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        try {
            userRepository.save(user);
            log.info("user data saved to database....");
        }
        catch(DataIntegrityViolationException dataIntegrityViolationException) {}
        return userMapper.convertToDTO(user);
    }


    @CacheEvict(key = "#username")
    public void deleteUser(String username) {
        userRepository.deleteByUsername(username);
    }

    @CachePut(value = "users", key = "#result.username")
    public UserDTO updateUser(String username, UserDTO userDTO) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        User newUser = userMapper.convertToEntity(userDTO);
        newUser.setId(user.getId());
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));

        userRepository.save(newUser);
        return userMapper.convertToDTO(newUser);
    }

    @Async
    public void updateLastActive(String username) {
        userRepository.updateLastActiveByUsername(username, LocalDateTime.now());
    }
}
