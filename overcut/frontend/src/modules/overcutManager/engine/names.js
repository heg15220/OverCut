/**
 * Invented people.
 *
 * The drivers of every real season are real. The engineers, the strategists and
 * the kids coming up through the junior categories in a future nobody has raced
 * yet are not, and they must not borrow a real person's name: these pools are
 * mixed so that no combination is meant to be anyone.
 */

const POOLS = {
  gb: { first: ["Oliver", "Harry", "James", "Callum", "Tom", "Jack", "Rhys", "Ewan", "Alfie", "Archie"], last: ["Ashdown", "Pembury", "Thornley", "Calloway", "Redfern", "Whitcombe", "Harlow", "Kingsley", "Brookes", "Fenwick"] },
  it: { first: ["Matteo", "Lorenzo", "Davide", "Giacomo", "Pietro", "Tommaso", "Andrea", "Riccardo", "Filippo", "Marco"], last: ["Bellandi", "Corsetti", "Donnarumi", "Ferraresi", "Galvano", "Mancinelli", "Orsatti", "Rinaldo", "Santangeli", "Valenzi"] },
  de: { first: ["Lukas", "Jonas", "Felix", "Moritz", "Niklas", "Tobias", "Jannik", "Paul", "Henrik", "Max"], last: ["Achterberg", "Brenninger", "Dahlmann", "Eckhardt", "Falkner", "Grünwald", "Hollmann", "Kessler", "Lindauer", "Wendling"] },
  fr: { first: ["Théo", "Hugo", "Lucas", "Mathis", "Antoine", "Bastien", "Clément", "Julien", "Romain", "Victor"], last: ["Aubertin", "Beaulieu", "Charvet", "Delorme", "Fontanel", "Gaudin", "Lacombe", "Marchal", "Peyrot", "Rouvière"] },
  es: { first: ["Pablo", "Álvaro", "Hugo", "Marcos", "Javier", "Sergio", "Iker", "Daniel", "Adrián", "Rubén"], last: ["Arrieta", "Benavente", "Cifuentes", "Echevarría", "Galarza", "Lozano", "Montoya", "Olmedo", "Peñalver", "Urrutia"] },
  br: { first: ["Thiago", "Rafael", "Gustavo", "Caio", "Enzo", "Bruno", "Leonardo", "Felipe", "Vinícius", "Rodrigo"], last: ["Almeida", "Bastos", "Cavalcanti", "Drummond", "Esteves", "Fagundes", "Guimarães", "Lacerda", "Monteiro", "Sampaio"] },
  jp: { first: ["Haruto", "Ren", "Sota", "Yuto", "Kaito", "Riku", "Daiki", "Takumi", "Shun", "Kenta"], last: ["Arakawa", "Fujimori", "Hayashida", "Ichikawa", "Kurosawa", "Matsuda", "Nishimura", "Okabe", "Shimizu", "Tanabe"] },
  us: { first: ["Mason", "Logan", "Carter", "Wyatt", "Hunter", "Colton", "Brady", "Tyler", "Austin", "Grant"], last: ["Ashford", "Brennan", "Caldwell", "Donovan", "Ellison", "Garrity", "Holloway", "McAllister", "Prescott", "Whitaker"] },
  nl: { first: ["Daan", "Sem", "Bram", "Lars", "Thijs", "Jesse", "Ruben", "Stijn", "Joris", "Niels"], last: ["Achterhof", "Brinkman", "de Groot", "Hoekstra", "Kuipers", "Meijerink", "Oosterveld", "Smit", "van Dam", "Wolters"] },
  au: { first: ["Cooper", "Lachlan", "Hamish", "Riley", "Bailey", "Jarrah", "Kai", "Flynn", "Jett", "Harvey"], last: ["Ainslie", "Blackwood", "Coburn", "Dunmore", "Fairweather", "Gallagher", "Harcourt", "McInnes", "Rowntree", "Stanwell"] },
  fi: { first: ["Eero", "Juho", "Lauri", "Oskari", "Aleksi", "Joonas", "Ville", "Teemu", "Niko", "Sami"], last: ["Aaltonen", "Heikkilä", "Järvenpää", "Kivelä", "Laaksonen", "Mäkelä", "Niskanen", "Rautio", "Salonen", "Vuorinen"] },
  mx: { first: ["Diego", "Emiliano", "Santiago", "Iván", "Rodrigo", "Andrés", "Mateo", "Leonel", "Alonso", "Gael"], last: ["Arriaga", "Bustamante", "Cárdenas", "Elizondo", "Garza", "Ibarra", "Landeros", "Montemayor", "Quintanilla", "Villarreal"] },
};

export const NAME_COUNTRIES = Object.keys(POOLS);

/** A believable invented name from one of the pools. */
export const inventName = (stream, country) => {
  const pool = POOLS[country] || POOLS[stream.pick(NAME_COUNTRIES)];
  return `${stream.pick(pool.first)} ${stream.pick(pool.last)}`;
};

export const inventPerson = (stream, preferred) => {
  const country = preferred && POOLS[preferred] && stream.chance(0.55) ? preferred : stream.pick(NAME_COUNTRIES);
  return { name: inventName(stream, country), nat: country };
};
