import * as actionTypes from "./actionTypes";

const initialState = {
  driverStandings: [],
  constructorStandings: [],
  driverWins: [],
  driverPodiums: [],
  driverPoles: [],
  driverGrandChelems: [],
  driverWinsByTeam: [],
  driverPodiumsByTeam: [],
  driverPolesByTeam: [],
  years: [],
  constructors: [],
  championsByTitleCount: [],
  championsChronologically: [],
  championsByAge: [],
  consecutiveTitles: [],
  longestGapBetweenTitles: [],
  gpCountBeforeTitle: [],
  championsByConstructorVariety: [],
  driverWinsChronologically: [],
  teamWinsChronologically: [],
  youngestWinDrivers: [],
  oldestWinDrivers: [],
  winsOnBirthday: [],
  longestConsecutiveWinStreaks: [],
  seasonStartWinStreaks: [],
  lastCareerWins: [],
  biggestWinGaps: [],
  firstLastWinGaps: [],
  mostWinsSingleYear: [],
  mostYearsWithWins: [],
  mostConsecutiveWinningYears: [],
  gpCountBeforeFirstWin: [],
  driversWithMostWinsSameConstructor: [],
  driversWithMostConstructorsWithWins: [],
  winsByGrandPrix: [],
  consecutiveWinsByGrandPrix: [],
  mostDifferentGPsWon: [],
  mostCircuitWins: [],
  mostDifferentCircuitWins: [],
  winsByGridPosition: [],
  gridPositionsWithWins: [],
  homeGPWins: [],
  winsWithoutLeadingLap: [],
  winsWithoutPole: [],
  winsWithFastestLap: [],
  secondPlacePodiums: [],
  thirdPlacePodiums: [],
  secondThirdPlacePodiums: [],
  podiumChronology: [],
  teamPodiumChronology: [],
  youngestPodiumDrivers: [],
  podiumsOnBirthday: [],
  oldestPodiumDriversByNationality: []


};


export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_DRIVER_STANDINGS_COMPLETED:
      return { ...state, driverStandings: action.standings };
    case actionTypes.FETCH_CONSTRUCTOR_STANDINGS_COMPLETED:
      return { ...state, constructorStandings: action.standings };
    case actionTypes.FETCH_DRIVER_WINS_COMPLETED:
      return { ...state, driverWins: action.ranking };
    case actionTypes.FETCH_DRIVER_PODIUMS_COMPLETED:
      return { ...state, driverPodiums: action.ranking };
    case actionTypes.FETCH_DRIVER_POLES_COMPLETED:
      return { ...state, driverPoles: action.ranking };
    case actionTypes.FETCH_DRIVER_GRAND_CHELEMS_COMPLETED:
      return { ...state, driverGrandChelems: action.ranking };
    case actionTypes.FETCH_DRIVER_WINS_BY_TEAM_COMPLETED:
      return { ...state, driverWinsByTeam: action.ranking };
    case actionTypes.FETCH_DRIVER_PODIUMS_BY_TEAM_COMPLETED:
      return { ...state, driverPodiumsByTeam: action.ranking };
    case actionTypes.FETCH_DRIVER_POLES_BY_TEAM_COMPLETED:
      return { ...state, driverPolesByTeam: action.ranking };
    case actionTypes.FETCH_CONSTRUCTORS_COMPLETED:
      return { ...state, constructors: action.list };

    case actionTypes.FETCH_CHAMPIONS_BY_TITLE_COUNT_COMPLETED:
      return { ...state, championsByTitleCount: action.data };
    case actionTypes.FETCH_CHAMPIONS_CHRONOLOGICALLY_COMPLETED:
      return { ...state, championsChronologically: action.data };
    case actionTypes.FETCH_CHAMPIONS_BY_AGE_COMPLETED:
      return { ...state, championsByAge: action.data };
    case actionTypes.FETCH_CONSECUTIVE_TITLES_COMPLETED:
      return { ...state, consecutiveTitles: action.data };
    case actionTypes.FETCH_LONGEST_GAP_TITLES_COMPLETED:
      return { ...state, longestGapBetweenTitles: action.data };
    case actionTypes.FETCH_GP_COUNT_BEFORE_TITLE_COMPLETED:
      return { ...state, gpCountBeforeTitle: action.data };
    case actionTypes.FETCH_CHAMPIONS_BY_CONSTRUCTOR_VARIETY_COMPLETED:
      return { ...state, championsByConstructorVariety: action.data };


    case actionTypes.FETCH_DRIVER_WINS_CHRONOLOGICALLY_COMPLETED:
      return { ...state, driverWinsChronologically: action.data };
    case actionTypes.FETCH_TEAM_WINS_CHRONOLOGICALLY_COMPLETED:
      return { ...state, teamWinsChronologically: action.data };
    case actionTypes.FETCH_YOUNGEST_WINNERS_COMPLETED:
      return { ...state, youngestWinDrivers: action.data };
    case actionTypes.FETCH_OLDEST_WINNERS_COMPLETED:
      return { ...state, oldestWinDrivers: action.data };
    case actionTypes.FETCH_WINS_ON_BIRTHDAY_COMPLETED:
      return { ...state, winsOnBirthday: action.data };


    case actionTypes.FETCH_CONSECUTIVE_WIN_STREAKS_COMPLETED:
      return { ...state, longestConsecutiveWinStreaks: action.data };
    case actionTypes.FETCH_SEASON_START_WIN_STREAKS_COMPLETED:
      return { ...state, seasonStartWinStreaks: action.data };
    case actionTypes.FETCH_LAST_CAREER_WIN_COMPLETED:
      return { ...state, lastCareerWins: action.data };
    case actionTypes.FETCH_GAP_BETWEEN_WINS_COMPLETED:
      return { ...state, biggestWinGaps: action.data };
    case actionTypes.FETCH_GAP_FIRST_LAST_WIN_COMPLETED:
      return { ...state, firstLastWinGaps: action.data };
    case actionTypes.FETCH_MOST_WINS_SINGLE_YEAR_COMPLETED:
      return { ...state, mostWinsSingleYear: action.data };
    case actionTypes.FETCH_MOST_YEARS_WITH_WINS_COMPLETED:
      return { ...state, mostYearsWithWins: action.data };
    case actionTypes.FETCH_CONSECUTIVE_WINNING_YEARS_COMPLETED:
      return { ...state, mostConsecutiveWinningYears: action.data };
    case actionTypes.FETCH_GPS_BEFORE_FIRST_WIN_COMPLETED:
      return { ...state, gpCountBeforeFirstWin: action.data };


    case actionTypes.FETCH_MOST_WINS_SAME_CONSTRUCTOR_COMPLETED:
      return { ...state, driversWithMostWinsSameConstructor: action.data };
    case actionTypes.FETCH_MOST_CONSTRUCTORS_WITH_WINS_COMPLETED:
      return { ...state, driversWithMostConstructorsWithWins: action.data };
    case actionTypes.FETCH_WINS_BY_GP_COMPLETED:
      return { ...state, winsByGrandPrix: action.data };
    case actionTypes.FETCH_CONSECUTIVE_WINS_BY_GP_COMPLETED:
      return { ...state, consecutiveWinsByGrandPrix: action.data };
    case actionTypes.FETCH_MOST_DIFFERENT_GPS_WON_COMPLETED:
      return { ...state, mostDifferentGPsWon: action.data };
    case actionTypes.FETCH_MOST_CIRCUIT_WINS_COMPLETED:
      return { ...state, mostCircuitWins: action.data };
    case actionTypes.FETCH_MOST_DIFFERENT_CIRCUIT_WINS_COMPLETED:
      return { ...state, mostDifferentCircuitWins: action.data };
    case actionTypes.FETCH_WINS_BY_GRID_POSITION_COMPLETED:
      return { ...state, winsByGridPosition: action.data };
    case actionTypes.FETCH_MOST_GRID_POSITIONS_WITH_WINS_COMPLETED:
      return { ...state, gridPositionsWithWins: action.data };
    case actionTypes.FETCH_HOME_GP_WINS_COMPLETED:
      return { ...state, homeGPWins: action.data };
    case actionTypes.FETCH_WINS_NO_LAPS_LED_COMPLETED:
      return { ...state, winsWithoutLeadingLap: action.data };
    case actionTypes.FETCH_WINS_WITHOUT_POLE_COMPLETED:
      return { ...state, winsWithoutPole: action.data };
    case actionTypes.FETCH_WINS_WITH_FASTEST_LAP_COMPLETED:
      return { ...state, winsWithFastestLap: action.data };


    case actionTypes.FETCH_PODIUMS_SECOND_PLACE_COMPLETED:
      return { ...state, secondPlacePodiums: action.data };
    case actionTypes.FETCH_PODIUMS_THIRD_PLACE_COMPLETED:
      return { ...state, thirdPlacePodiums: action.data };
    case actionTypes.FETCH_PODIUMS_SECOND_THIRD_PLACE_COMPLETED:
      return { ...state, secondThirdPlacePodiums: action.data };
    case actionTypes.FETCH_PODIUMS_CHRONOLOGY_COMPLETED:
      return { ...state, podiumChronology: action.data };
    case actionTypes.FETCH_PODIUMS_TEAM_CHRONOLOGY_COMPLETED:
      return { ...state, teamPodiumChronology: action.data };
    case actionTypes.FETCH_PODIUMS_YOUNGEST_COMPLETED:
      return { ...state, youngestPodiumDrivers: action.data };
    case actionTypes.FETCH_PODIUMS_ON_BIRTHDAY_COMPLETED:
      return { ...state, podiumsOnBirthday: action.data };
    case actionTypes.FETCH_PODIUMS_OLDEST_BY_NATIONALITY_COMPLETED:
      return { ...state, oldestPodiumDriversByNationality: action.data };



    default:
      return state;
  }
}
