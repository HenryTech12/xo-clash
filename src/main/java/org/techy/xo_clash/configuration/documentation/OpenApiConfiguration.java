package org.techy.xo_clash.configuration.documentation;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
        info = @Info(
                title = "XO Clash API Documentation",
                version = "1.0",
                description = "API documentation for the LifeLink application",
                contact = @Contact(
                        name = "Fakorode Henry",
                        email = "fakorodehenry@gmail.com",
                        url = "https://henry-portfolio-rosy.vercel.app/"
                ),
                license = @License(
                        name = "Henry License"
                ),
                termsOfService = "Terms Of Service for XO-Clash API"
        ),
        servers = {
                @Server(
                        url = "http://localhost:8080",
                        description = "Local development server"
                ),
                @Server(
                        url = "https://xoclash.onrender.com",
                        description = "Production development server"
                )
        }
        ,
        security = @SecurityRequirement(name = "XO Auth")
)
@SecurityScheme(
        name = "XO Auth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "jwt",
        in = SecuritySchemeIn.HEADER,
        description = "XOClash JWT Authentication"
)
public class OpenApiConfiguration {
}
