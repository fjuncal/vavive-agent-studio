package br.com.vavive.gptmaker.repository;

import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "franchise")
    @Query("select u from User u where lower(u.email) = lower(:email)")
    Optional<User> findByEmailIgnoreCaseWithFranchise(@Param("email") String email);

    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findFirstByFranchiseIdAndRole(UUID franchiseId, UserRole role);
}
