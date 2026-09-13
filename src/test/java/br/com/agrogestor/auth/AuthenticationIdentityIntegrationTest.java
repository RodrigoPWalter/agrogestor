package br.com.agrogestor.auth;

import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.repository.PropertyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:identity-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "agrogestor.security.jwt-secret=test-secret-with-at-least-32-characters",
        "agrogestor.security.cors-allowed-origins=http://localhost:5173",
        "agrogestor.security.bootstrap-admin.enabled=false"
})
@AutoConfigureMockMvc
@Transactional
class AuthenticationIdentityIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository users;
    @Autowired private PropertyRepository properties;
    @Autowired private PasswordEncoder passwords;

    @Test
    void loginAndProfileKeepOriginalIdentityWhenAnEmailIsReused() throws Exception {
        Property property = properties.save(new Property("Propriedade original"));
        Usuario original = users.saveAndFlush(new Usuario(
                property, "Produtor", "antigo@agro.test",
                passwords.encode("senha-de-teste"), UsuarioRole.USER));

        var login = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "email", "antigo@agro.test", "password", "senha-de-teste"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(original.getId().toString()))
                .andReturn();
        String token = json.readTree(login.getResponse().getContentAsString())
                .get("accessToken").asText();

        mvc.perform(put("/api/v1/auth/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "nome", "Produtor", "email", "novo@agro.test",
                                "senhaAtual", "senha-de-teste"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.propertyId").value(property.getId().toString()));
        users.flush();

        users.saveAndFlush(new Usuario(
                properties.save(new Property("Outra propriedade")),
                "Outra pessoa", "antigo@agro.test", passwords.encode("outra-senha"), UsuarioRole.ADMIN));

        mvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/auth/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "nome", "Produtor atualizado", "email", "novo@agro.test",
                                "senhaAtual", "senha-de-teste"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(original.getId().toString()))
                .andExpect(jsonPath("$.user.propertyId").value(property.getId().toString()))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }
}
