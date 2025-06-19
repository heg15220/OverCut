package com.overcut.f1hub.rest.controllers;


import com.overcut.f1hub.model.service.AdvancedStatsService;
import com.overcut.f1hub.model.service.StatisticsService;
import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
import com.overcut.f1hub.rest.dtos.DriverRankingDTO;
import com.overcut.f1hub.rest.dtos.DriverStandingDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:8083")
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @Autowired
    private AdvancedStatsService advancedStatsService;

    @GetMapping("/drivers/year/{year}")
    public List<DriverStandingDTO> getDriverStandings(@PathVariable int year) {
        return statisticsService.getDriverStandings(year);
    }

    @GetMapping("/constructors/year/{year}")
    public List<ConstructorStandingDTO> getConstructorStandings(@PathVariable int year) {
        return statisticsService.getConstructorStandings(year);
    }

    @GetMapping("/drivers/wins")
    public List<DriverRankingDTO> getDriverWinRanking() {
        return statisticsService.getDriverWinRanking();
    }

    @GetMapping("/drivers/podiums")
    public List<DriverRankingDTO> getDriverPodiumRanking() {
        return statisticsService.getDriverPodiumRanking();
    }

    @GetMapping("/drivers/poles")
    public List<DriverRankingDTO> getDriverPoleRanking() {
        return statisticsService.getDriverPoleRanking();
    }

    @GetMapping("/drivers/grand-chelems")
    public List<DriverRankingDTO> getDriverGrandChelemRanking() {
        return statisticsService.getDriverGrandChelemRanking();
    }

    @GetMapping("/drivers/wins/team/{constructorRef}")
    public List<DriverRankingDTO> getDriverWinsByTeam(@PathVariable String constructorRef) {
        return statisticsService.getDriverWinsByTeam(constructorRef);
    }

    @GetMapping("/drivers/podiums/team/{constructorRef}")
    public List<DriverRankingDTO> getDriverPodiumsByTeam(@PathVariable String constructorRef) {
        return statisticsService.getDriverPodiumsByTeam(constructorRef);
    }

    @GetMapping("/drivers/poles/team/{constructorRef}")
    public List<DriverRankingDTO> getDriverPolesByTeamSince2003(@PathVariable String constructorRef) {
        return statisticsService.getDriverPolesByTeamSince2003(constructorRef);
    }

    @GetMapping("/drivers/championships/by-count")
    public List<DriverRankingDTO> getWorldChampionsByTitleCount() {
        return statisticsService.getWorldChampionsByTitleCount();
    }

    @GetMapping("/drivers/championships/chronological")
    public List<DriverRankingDTO> getWorldChampionsChronologically() {
        return statisticsService.getWorldChampionsChronologically();
    }

    @GetMapping("/drivers/championships/by-age")
    public List<DriverRankingDTO> getChampionsByYoungestAge() {
        return statisticsService.getChampionsByYoungestAge();
    }

    @GetMapping("/drivers/championships/consecutive")
    public List<DriverRankingDTO> getConsecutiveTitles() {
        return statisticsService.getConsecutiveTitles();
    }

    @GetMapping("/drivers/championships/longest-gap")
    public List<DriverRankingDTO> getLongestIntervalBetweenTitles() {
        return statisticsService.getLongestIntervalBetweenTitles();
    }

    @GetMapping("/drivers/championships/gps-before-title")
    public List<DriverRankingDTO> getGpCountBeforeFirstTitle() {
        return statisticsService.getGpCountBeforeFirstTitle();
    }

    @GetMapping("/drivers/championships/by-constructors")
    public List<DriverRankingDTO> getChampionsByConstructorVariety() {
        return statisticsService.getTitleCountByDriverAndConstructorVariety();
    }

    // VICTORIES

    @GetMapping("/victories/by-driver/chronology")
    public List<DriverRankingDTO> getDriverWinsChronologically() {
        return statisticsService.getDriverWinsChronologically();
    }

    @GetMapping("/victories/by-team/chronology")
    public List<DriverRankingDTO> getTeamWinsChronologically() {
        return statisticsService.getTeamWinsChronologically();
    }

    @GetMapping("/victories/youngest")
    public List<DriverRankingDTO> getYoungestDriversAtFirstWin() {
        return statisticsService.getYoungestDriversAtFirstWin();
    }

    @GetMapping("/victories/oldest")
    public List<DriverRankingDTO> getOldestDriversToWin() {
        return statisticsService.getOldestDriversToWin();
    }

    @GetMapping("/victories/on-birthday")
    public List<DriverRankingDTO> getWinsOnBirthday() {
        return statisticsService.getWinsOnBirthday();
    }

    // RECORDS – VICTORIES: Rachas y temporadas

    @GetMapping("/victories/streaks/consecutive")
    public List<DriverRankingDTO> getLongestConsecutiveWinStreaks() {
        return statisticsService.getLongestConsecutiveWinStreaks();
    }

    @GetMapping("/victories/streaks/start-season")
    public List<DriverRankingDTO> getLongestSeasonStartWinStreaks() {
        return statisticsService.getLongestSeasonStartWinStreaks();
    }

    @GetMapping("/victories/last")
    public List<DriverRankingDTO> getLastCareerWinPerDriver() {
        return statisticsService.getLastCareerWinPerDriver();
    }

    @GetMapping("/victories/gap-between-wins")
    public List<DriverRankingDTO> getBiggestGapBetweenWins() {
        return statisticsService.getBiggestGapBetweenWins();
    }

    @GetMapping("/victories/gap-first-last")
    public List<DriverRankingDTO> getGapBetweenFirstAndLastWin() {
        return statisticsService.getGapBetweenFirstAndLastWin();
    }

    @GetMapping("/victories/most-in-single-year")
    public List<DriverRankingDTO> getMostWinsInSingleYear() {
        return statisticsService.getMostWinsInSingleYear();
    }

    @GetMapping("/victories/most-winning-years")
    public List<DriverRankingDTO> getMostYearsWithWins() {
        return statisticsService.getMostYearsWithWins();
    }

    @GetMapping("/victories/most-consecutive-winning-years")
    public List<DriverRankingDTO> getMostConsecutiveWinningYears() {
        return statisticsService.getMostConsecutiveWinningYears();
    }

    @GetMapping("/victories/gps-before-first-win")
    public List<DriverRankingDTO> getGpCountBeforeFirstWin() {
        return statisticsService.getGpCountBeforeFirstWin();
    }

    @GetMapping("/wins/most-by-same-constructor")
    public List<DriverRankingDTO> getDriversWithMostWinsSameConstructor() {
        return statisticsService.getDriversWithMostWinsSameConstructor();
    }

    @GetMapping("/wins/most-constructors-with-wins")
    public List<DriverRankingDTO> getDriversWithMostConstructorsWithWins() {
        return statisticsService.getDriversWithMostConstructorsWithWins();
    }

    @GetMapping("/wins/by-grand-prix")
    public List<DriverRankingDTO> getWinsByGrandPrix() {
        return statisticsService.getWinsByGrandPrix();
    }

    @GetMapping("/wins/consecutive-by-grand-prix")
    public List<DriverRankingDTO> getConsecutiveWinsByGrandPrix() {
        return statisticsService.getConsecutiveWinsByGrandPrix();
    }

    @GetMapping("/wins/most-different-gps")
    public List<DriverRankingDTO> getDriversWithMostDifferentGPsWon() {
        return statisticsService.getDriversWithMostDifferentGPsWon();
    }

    @GetMapping("/wins/most-circuit-wins")
    public List<DriverRankingDTO> getDriversWithMostCircuitWins() {
        return statisticsService.getDriversWithMostCircuitWins();
    }

    @GetMapping("/wins/most-different-circuit-wins")
    public List<DriverRankingDTO> getDriversWithMostDifferentCircuitWins() {
        return statisticsService.getDriversWithMostDifferentCircuitWins();
    }

    @GetMapping("/wins/by-grid-position")
    public List<DriverRankingDTO> getWinsByStartingGridPosition() {
        return statisticsService.getWinsByStartingGridPosition();
    }

    @GetMapping("/wins/by-grid-variation")
    public List<DriverRankingDTO> getDriversWithMostGridPositionsWithWins() {
        return statisticsService.getDriversWithMostGridPositionsWithWins();
    }

    @GetMapping("/wins/home-gp")
    public List<DriverRankingDTO> getDriversWithHomeGPWins() {
        return statisticsService.getDriversWithHomeGPWins();
    }

    @GetMapping("/wins/no-laps-led")
    public List<DriverRankingDTO> getWinsWithoutLeadingAnyLap() {
        return statisticsService.getWinsWithoutLeadingAnyLap();
    }

    @GetMapping("/wins/without-pole")
    public List<DriverRankingDTO> getWinsWithoutPolePosition() {
        return statisticsService.getWinsWithoutPolePosition();
    }

    @GetMapping("/wins/with-fastest-lap")
    public List<DriverRankingDTO> getWinsWithFastestLap() {
        return statisticsService.getWinsWithFastestLap();
    }

    @GetMapping("/second-place")
    public List<DriverRankingDTO> getSecondPlacePodiums() {
        return statisticsService.getSecondPlacePodiums();
    }

    @GetMapping("/third-place")
    public List<DriverRankingDTO> getThirdPlacePodiums() {
        return statisticsService.getThirdPlacePodiums();
    }

    @GetMapping("/second-and-third-place")
    public List<DriverRankingDTO> getSecondAndThirdPlacePodiums() {
        return statisticsService.getSecondAndThirdPlacePodiums();
    }

    @GetMapping("/chronology")
    public List<DriverRankingDTO> getPodiumChronology() {
        return statisticsService.getPodiumChronology();
    }

    @GetMapping("/team-chronology")
    public List<DriverRankingDTO> getTeamPodiumChronology() {
        return statisticsService.getTeamPodiumChronology();
    }

    @GetMapping("/youngest")
    public List<DriverRankingDTO> getYoungestPodiumDrivers() {
        return statisticsService.getYoungestPodiumDrivers();
    }

    @GetMapping("/on-birthday")
    public List<DriverRankingDTO> getPodiumsOnBirthday() {
        return statisticsService.getPodiumsOnBirthday();
    }

    @GetMapping("/oldest-by-nationality")
    public List<DriverRankingDTO> getOldestPodiumDriversByNationality() {
        return statisticsService.getOldestPodiumDriversByNationality();
    }


    // Pódiums – Secuencias y frecuencia
    @GetMapping("/streaks")
    public List<DriverRankingDTO> getLongestPodiumStreaks() {
        return statisticsService.getLongestPodiumStreaks();
    }

    @GetMapping("/streaks/season-start")
    public List<DriverRankingDTO> getSeasonStartPodiumStreaks() {
        return statisticsService.getSeasonStartPodiumStreaks();
    }

    @GetMapping("/last")
    public List<DriverRankingDTO> getLastPodiumPerDriver() {
        return statisticsService.getLastPodiumPerDriver();
    }

    @GetMapping("/gap-between")
    public List<DriverRankingDTO> getBiggestGapBetweenPodiums() {
        return statisticsService.getBiggestGapBetweenPodiums();
    }

    @GetMapping("/gap-first-last")
    public List<DriverRankingDTO> getGapBetweenFirstAndLastPodium() {
        return statisticsService.getGapBetweenFirstAndLastPodium();
    }

    @GetMapping("/most-in-single-year")
    public List<DriverRankingDTO> getMostPodiumsInSingleYear() {
        return statisticsService.getMostPodiumsInSingleYear();
    }

    @GetMapping("/years-count")
    public List<DriverRankingDTO> getPodiumYearsCount() {
        return statisticsService.getPodiumYearsCount();
    }

    @GetMapping("/consecutive-years")
    public List<DriverRankingDTO> getConsecutivePodiumYears() {
        return statisticsService.getConsecutivePodiumYears();
    }

    @GetMapping("/gps-before-first")
    public List<DriverRankingDTO> getGpCountBeforeFirstPodium() {
        return statisticsService.getGpCountBeforeFirstPodium();
    }

    @GetMapping("/before-win")
    public List<DriverRankingDTO> getPodiumsBeforeFirstWin() {
        return statisticsService.getPodiumsBeforeFirstWin();
    }

    // Pódiums – Constructores
    @GetMapping("/single-constructor")
    public List<DriverRankingDTO> getPodiumsWithSingleConstructor() {
        return statisticsService.getPodiumsWithSingleConstructor();
    }

    @GetMapping("/no-wins")
    public List<DriverRankingDTO> getPodiumsWithNoWins() {
        return statisticsService.getPodiumsWithNoWins();
    }

    @GetMapping("/most-constructors")
    public List<DriverRankingDTO> getPodiumsWithMostConstructors() {
        return statisticsService.getPodiumsWithMostConstructors();
    }

    // Pódiums – GPs y Circuitos
    @GetMapping("/by-grand-prix")
    public List<DriverRankingDTO> getPodiumsByGrandPrix() {
        return statisticsService.getPodiumsByGrandPrix();
    }

    @GetMapping("/different-grand-prix")
    public List<DriverRankingDTO> getDriversWithMostDifferentGPsWithPodium() {
        return statisticsService.getDriversWithMostDifferentGPsWithPodium();
    }

    @GetMapping("/different-circuits")
    public List<DriverRankingDTO> getDriversWithMostDifferentCircuitsWithPodium() {
        return statisticsService.getDriversWithMostDifferentCircuitsWithPodium();
    }

    @GetMapping("/home-gp")
    public List<DriverRankingDTO> getPodiumsAtHomeGP() {
        return statisticsService.getPodiumsAtHomeGP();
    }


    @GetMapping("/repeated-identical")
    public List<DriverRankingDTO> getRepeatedIdenticalPodiums() {
        return statisticsService.getRepeatedIdenticalPodiums();
    }

    @GetMapping("/most-frequent-trios")
    public List<DriverRankingDTO> getMostFrequentPodiumTrios() {
        return statisticsService.getMostFrequentPodiumTrios();
    }

    @GetMapping("/most-frequent-pairs")
    public List<DriverRankingDTO> getMostFrequentPodiumPairs() {
        return statisticsService.getMostFrequentPodiumPairs();
    }

    @GetMapping("/most-common-first-second")
    public List<DriverRankingDTO> getMostCommonFirstSecondPairs() {
        return statisticsService.getMostCommonFirstSecondPairs();
    }


    // Puntos – Totales y cronología
    @GetMapping("/points/total")
    public List<DriverRankingDTO> getDriversWithMostPoints() {
        return statisticsService.getDriversWithMostPoints();
    }

    @GetMapping("/points/chronology")
    public List<DriverRankingDTO> getDriversToScorePointsChronologically() {
        return statisticsService.getDriversToScorePointsChronologically();
    }

    @GetMapping("/points/last")
    public List<DriverRankingDTO> getLastPointsPerDriver() {
        return statisticsService.getLastPointsPerDriver();
    }

    // Puntos – Edad al puntuar
    @GetMapping("/points/youngest")
    public List<DriverRankingDTO> getYoungestDriversToScorePoints() {
        return statisticsService.getYoungestDriversToScorePoints();
    }

    @GetMapping("/points/oldest")
    public List<DriverRankingDTO> getOldestDriversToScorePoints() {
        return statisticsService.getOldestDriversToScorePoints();
    }

    @GetMapping("/points/youngest-by-nationality")
    public List<DriverRankingDTO> getYoungestDriversToScorePointsByNationality() {
        return statisticsService.getYoungestDriversToScorePointsByNationality();
    }

    @GetMapping("/points/oldest-by-nationality")
    public List<DriverRankingDTO> getOldestDriversToScorePointsByNationality() {
        return statisticsService.getOldestDriversToScorePointsByNationality();
    }

    // Puntos – Rachas y extremos
    @GetMapping("/points/streaks")
    public List<DriverRankingDTO> getLongestConsecutivePointsStreaks() {
        return statisticsService.getLongestConsecutivePointsStreaks();
    }

    @GetMapping("/points/streaks/no-sprints")
    public List<DriverRankingDTO> getLongestConsecutivePointsStreaksWithoutSprints() {
        return statisticsService.getLongestConsecutivePointsStreaksWithoutSprints();
    }

    @GetMapping("/points/gap-between")
    public List<DriverRankingDTO> getLongestGapBetweenPoints() {
        return statisticsService.getLongestGapBetweenPoints();
    }

    @GetMapping("/points/gap-first-last")
    public List<DriverRankingDTO> getGapBetweenFirstAndLastPoints() {
        return statisticsService.getGapBetweenFirstAndLastPoints();
    }

    // Puntos – Temporadas y promedios
    @GetMapping("/points/most-in-single-year")
    public List<DriverRankingDTO> getMostPointsInSingleYear() {
        return statisticsService.getMostPointsInSingleYear();
    }



    @GetMapping("/points/years-scoring")
    public List<DriverRankingDTO> getMostYearsScoringPoints() {
        return statisticsService.getMostYearsScoringPoints();
    }

    @GetMapping("/points/consecutive-seasons")
    public List<DriverRankingDTO> getMostConsecutiveSeasonsWithPoints() {
        return statisticsService.getMostConsecutiveSeasonsWithPoints();
    }

    // Puntos – Casos especiales
    @GetMapping("/points/no-wins")
    public List<DriverRankingDTO> getDriversWithPointsButNoWins() {
        return statisticsService.getDriversWithPointsButNoWins();
    }

    @GetMapping("/points/no-podiums")
    public List<DriverRankingDTO> getDriversWithPointsButNoPodiums() {
        return statisticsService.getDriversWithPointsButNoPodiums();
    }

    @GetMapping("/points/most-constructors")
    public List<DriverRankingDTO> getDriversWithMostConstructorsWithPoints() {
        return statisticsService.getDriversWithMostConstructorsWithPoints();
    }


    @GetMapping("/points/gps-before-first")
    public List<DriverRankingDTO> getGpCountBeforeFirstPoints() {
        return statisticsService.getGpCountBeforeFirstPoints();
    }

    @GetMapping("/points/gps-scored")
    public List<DriverRankingDTO> getGpCountWhereDriverScoredPoints() {
        return statisticsService.getGpCountWhereDriverScoredPoints();
    }


    @GetMapping("/grands-prix/most")
    public List<DriverRankingDTO> getDriversWithMostGrandsPrix() {
        return statisticsService.getDriversWithMostGrandsPrix();
    }

    @GetMapping("/grands-prix/debut-chronology")
    public List<DriverRankingDTO> getDriverGpDebutChronology() {
        return statisticsService.getDriverGpDebutChronology();
    }

    @GetMapping("/grands-prix/debut-chronology/by-constructor")
    public List<DriverRankingDTO> getGpDebutChronologyByConstructor() {
        return statisticsService.getGpDebutChronologyByConstructor();
    }



    @GetMapping("/grands-prix/streaks")
    public List<DriverRankingDTO> getLongestGpStreaks() {
        return statisticsService.getLongestGpStreaks();
    }

    @GetMapping("/grands-prix/gap-days")
    public List<DriverRankingDTO> getBiggestGapBetweenGrandsPrix() {
        return statisticsService.getBiggestGapBetweenGrandsPrix();
    }

    @GetMapping("/grands-prix/gap-years")
    public List<DriverRankingDTO> getGapBetweenFirstAndLastGp() {
        return statisticsService.getGapBetweenFirstAndLastGp();
    }

    // Acumulados físicos
    @GetMapping("/grands-prix/laps")
    public List<DriverRankingDTO> getDriversByTotalLapsCompleted() {
        return statisticsService.getDriversByTotalLapsCompleted();
    }

    // Relaciones con campeonatos y compañeros
    @GetMapping("/grands-prix/with-world-champions")
    public List<DriverRankingDTO> getDriversWithGpsWithWorldChampions() {
        return statisticsService.getDriversWithGpsWithWorldChampions();
    }

    @GetMapping("/grands-prix/with-race-winners")
    public List<DriverRankingDTO> getDriversWithGpsWithRaceWinner() {
        return statisticsService.getDriversWithGpsWithRaceWinner();
    }

    @GetMapping("/grands-prix/most-with-same-constructor")
    public List<DriverRankingDTO> getDriversWithMostGpsWithSameConstructor() {
        return statisticsService.getDriversWithMostGpsWithSameConstructor();
    }

    @GetMapping("/grands-prix/most-constructors")
    public List<DriverRankingDTO> getDriversWithMostConstructorsInGps() {
        return statisticsService.getDriversWithMostConstructorsInGps();
    }

    @GetMapping("/grands-prix/most-with-same-engine")
    public List<DriverRankingDTO> getDriversWithMostGpsWithSameEngine() {
        return statisticsService.getDriversWithMostGpsWithSameEngine();
    }

    @GetMapping("/grands-prix/most-engines")
    public List<DriverRankingDTO> getDriversWithMostEnginesInGps() {
        return statisticsService.getDriversWithMostEnginesInGps();
    }

    @GetMapping("/grands-prix/most-with-same-teammate")
    public List<DriverRankingDTO> getDriversWithMostGpsWithSameTeammate() {
        return statisticsService.getDriversWithMostGpsWithSameTeammate();
    }

    // Edad

    @GetMapping("/grands-prix/age/by-nationality")
    public List<DriverRankingDTO> getDriversGpAgeByNationality() {
        return statisticsService.getDriversGpAgeByNationality();
    }

    @GetMapping("/grands-prix/age/oldest")
    public List<DriverRankingDTO> getOldestDriversAtGp() {
        return statisticsService.getOldestDriversAtGp();
    }

    @GetMapping("/grands-prix/age/average")
    public List<DriverRankingDTO> getAverageDriverAgePerGp() {
        return statisticsService.getAverageDriverAgePerGp();
    }

    // Sin eventos clave
    @GetMapping("/grands-prix/no-win")
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutWin() {
        return statisticsService.getDriversWithMostGpsWithoutWin();
    }

    @GetMapping("/grands-prix/no-pole")
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutPole() {
        return statisticsService.getDriversWithMostGpsWithoutPole();
    }

    @GetMapping("/grands-prix/no-fastest-lap")
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutFastestLap() {
        return statisticsService.getDriversWithMostGpsWithoutFastestLap();
    }

    @GetMapping("/grands-prix/no-points")
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutPoints() {
        return statisticsService.getDriversWithMostGpsWithoutPoints();
    }

    @GetMapping("/grands-prix/no-podium")
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutPodium() {
        return statisticsService.getDriversWithMostGpsWithoutPodium();
    }

    @GetMapping("/grands-prix/no-lead-lap")
    public List<DriverRankingDTO> getDriversWithMostGpsWithoutLeadingLap() {
        return statisticsService.getDriversWithMostGpsWithoutLeadingLap();
    }

    @GetMapping("/grands-prix/no-win-pole-fastest")
    public List<DriverRankingDTO> getDriversWithGpsWithoutWinPoleOrFastestLap() {
        return statisticsService.getDriversWithGpsWithoutWinPoleOrFastestLap();
    }

    // Temporadas
    @GetMapping("/grands-prix/seasons/total")
    public List<DriverRankingDTO> getDriversWithMostSeasons() {
        return statisticsService.getDriversWithMostSeasons();
    }

    @GetMapping("/grands-prix/seasons/consecutive")
    public List<DriverRankingDTO> getDriversWithMostConsecutiveSeasons() {
        return statisticsService.getDriversWithMostConsecutiveSeasons();
    }


    @GetMapping("/varios/seasons")
    public List<DriverRankingDTO> getDriverSeasonCount() {
        return statisticsService.getDriverSeasonCount();
    }

    @GetMapping("/varios/seasons-streak")
    public List<DriverRankingDTO> getDriverSeasonParticipationStreaks() {
        return statisticsService.getDriverSeasonParticipationStreaks();
    }

    @GetMapping("/varios/hat-tricks")
    public List<DriverRankingDTO> getDriverHatTrickCount() {
        return statisticsService.getDriverHatTrickCount();
    }

    @GetMapping("/varios/grand-slams")
    public List<DriverRankingDTO> getDriverGrandSlamCount() {
        return statisticsService.getDriverGrandSlamCount();
    }

    @GetMapping("/varios/front-row-starts")
    public List<DriverRankingDTO> getDriverFrontRowStarts() {
        return statisticsService.getDriverFrontRowStarts();
    }

    @GetMapping("/varios/front-row-duos")
    public List<DriverRankingDTO> getMostFrequentFrontRowDuos() {
        return statisticsService.getMostFrequentFrontRowDuos();
    }

    @GetMapping("/varios/front-row-youngest")
    public List<DriverRankingDTO> getYoungestDriversAtFrontRow() {
        return statisticsService.getYoungestDriversAtFrontRow();
    }

    @GetMapping("/varios/front-row-streaks")
    public List<DriverRankingDTO> getLongestFrontRowStreaks() {
        return statisticsService.getLongestFrontRowStreaks();
    }

    @GetMapping("/varios/grid-average")
    public List<DriverRankingDTO> getAverageGridPosition() {
        return statisticsService.getAverageGridPosition();
    }

    @GetMapping("/varios/qualifying-fastest")
    public List<DriverRankingDTO> getFastestQualifyingLaps() {
        return statisticsService.getFastestQualifyingLaps();
    }

    @GetMapping("/varios/finishes")
    public List<DriverRankingDTO> getRaceFinishesCount() {
        return statisticsService.getRaceFinishesCount();
    }

    @GetMapping("/varios/finishes-streak")
    public List<DriverRankingDTO> getConsecutiveRaceFinishes() {
        return statisticsService.getConsecutiveRaceFinishes();
    }

    @GetMapping("/varios/classified")
    public List<DriverRankingDTO> getClassifiedFinishesCount() {
        return statisticsService.getClassifiedFinishesCount();
    }

    @GetMapping("/varios/longest-without-dnf")
    public List<DriverRankingDTO> getLongestStreakWithoutDNF() {
        return statisticsService.getLongestStreakWithoutDNF();
    }

    @GetMapping("/varios/dnfs")
    public List<DriverRankingDTO> getDNFCount() {
        return statisticsService.getDNFCount();
    }

    @GetMapping("/varios/dnfs-streak")
    public List<DriverRankingDTO> getConsecutiveDNFs() {
        return statisticsService.getConsecutiveDNFs();
    }

    @GetMapping("/varios/first-lap-dnfs")
    public List<DriverRankingDTO> getFirstLapDNFs() {
        return statisticsService.getFirstLapDNFs();
    }

    @GetMapping("/varios/on-leader-lap")
    public List<DriverRankingDTO> getDriversOnLeaderLapMostOften() {
        return statisticsService.getDriversOnLeaderLapMostOften();
    }

    @GetMapping("/varios/finish-position-average")
    public List<DriverRankingDTO> getAverageFinishPosition() {
        return statisticsService.getAverageFinishPosition();
    }

    @GetMapping("/varios/position-gains-average")
    public List<DriverRankingDTO> getBestAveragePositionGains() {
        return statisticsService.getBestAveragePositionGains();
    }

    @GetMapping("/varios/debut-grid")
    public List<DriverRankingDTO> getStartingGridAtDebut() {
        return statisticsService.getStartingGridAtDebut();
    }

    @GetMapping("/varios/debut-qualifying")
    public List<DriverRankingDTO> getQualifyingAtDebut() {
        return statisticsService.getQualifyingAtDebut();
    }

    @GetMapping("/varios/last-qualifying")
    public List<DriverRankingDTO> getQualifyingAtLastRace() {
        return statisticsService.getQualifyingAtLastRace();
    }

    @GetMapping("/varios/never-qualified")
    public List<DriverRankingDTO> getDriversNeverQualified() {
        return statisticsService.getDriversNeverQualified();
    }

    @GetMapping("/varios/disqualifications")
    public List<DriverRankingDTO> getDisqualificationCount() {
        return statisticsService.getDisqualificationCount();
    }





    @GetMapping("/constructor-options")
    public List<StatisticsService.ConstructorOption> getAllConstructors() {
        return statisticsService.getAllConstructors();
    }




}
