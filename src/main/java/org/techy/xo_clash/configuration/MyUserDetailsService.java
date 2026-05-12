package org.techy.xo_clash.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.configuration.principal.UserPrincipal;
import org.techy.xo_clash.repository.UserRepository;
import org.techy.xo_clash.service.UserService;

@Service
public class MyUserDetailsService implements UserDetailsService  {


    @Autowired
    private UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return new UserPrincipal(userService.fetchByUsername(username));
    }
}
