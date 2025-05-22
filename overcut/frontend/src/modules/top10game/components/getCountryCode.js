

const ISO_MAPPING = {
  british: "gb", german: "de", italian: "it", french: "fr", spanish: "es", dutch: "nl",
  finnish: "fi", brazilian: "br", argentinean: "ar", mexican: "mx", canadian: "ca",
  austrian: "at", australian: "au", swiss: "ch", belgian: "be", swedish: "se",
  portuguese: "pt", chilean: "cl", american: "us", "new zealander": "nz", irish: "ie",
  "south african": "za", japanese: "jp", russian: "ru", polish: "pl", venezuelan: "ve",
  colombian: "co", czech: "cz", hungarian: "hu", monegasque: "mc", monacan: "mc",
  thai: "th", chinese: "cn", indian: "in", malaysian: "my", indonesian: "id",
  dane: "dk", danish: "dk", estonian: "ee", latvian: "lv", uruguayan: "uy"
};

export const getFlagCode = (nationalityRaw) => {
  if (!nationalityRaw) return "un";
  const key = nationalityRaw.trim().toLowerCase();
  return ISO_MAPPING[key] || "un";
};

