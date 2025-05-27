package com.overcut.f1hub.model.entities;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QualifyingDao extends JpaRepository<Qualifying, Long> {
    List<Qualifying> findByRaceRaceIdOrderByPositionAsc(Long raceId);
    boolean existsByRaceRaceId(Long raceId);

    @Query("SELECT COUNT(q) > 0 FROM Qualifying q WHERE q.race.raceId = :raceId")
    boolean existsQualifyingForRace(@Param("raceId") Long raceId);

    @Query("""
        SELECT COUNT(q)
        FROM Qualifying q
        JOIN q.race r
        JOIN q.driver d
        WHERE r.year = :year
          AND d.forename = :forename
          AND d.surname = :surname
          AND q.q3 IS NOT NULL
    """)
    long countQ3ByDriverInYear(@Param("forename") String forename,
                               @Param("surname") String surname,
                               @Param("year") int year);


    // Q3 counts para todos los pilotos de un equipo en un año (agrupados)
    @Query("""
        SELECT d.forename, d.surname, COUNT(q)
        FROM Qualifying q
        JOIN q.race r
        JOIN q.driver d
        JOIN q.constructor c
        WHERE r.year = :year
          AND c.constructorRef = :constructorRef
          AND q.q3 IS NOT NULL
        GROUP BY d.driverId
    """)
    List<Object[]> countQ3ByConstructorInYear(@Param("constructorRef") String constructorRef,
                                              @Param("year") int year);

    @Query("""
    SELECT COUNT(q)
    FROM Qualifying q
    JOIN q.race r
    JOIN q.driver d
    WHERE r.year = :year
      AND d.forename = :forename
      AND d.surname = :surname
      AND q.q1 IS NOT NULL
""")
    long countByDriverAndQ1NotNull(@Param("forename") String forename,
                                   @Param("surname") String surname,
                                   @Param("year") int year);

    @Query("""
    SELECT COUNT(q)
    FROM Qualifying q
    JOIN q.race r
    JOIN q.constructor c
    WHERE r.year = :year
      AND c.constructorRef = :constructorRef
      AND q.q1 IS NOT NULL
""")
    long countByConstructorAndQ1NotNull(@Param("constructorRef") String constructorRef,
                                        @Param("year") int year);


}
