// Country.js — CountryData and YearSeason classes

class CountryData {
  constructor(noc, team, cname, region) {
    this.NOC = noc;
    this.olympicTeam = team;
    this.countryName = cname;
    this.region = region;

    this.otherAlias = "";
    this.historicAlias = "";
    this.landArea = 0;

    this.populationByYear = {};              // year → population
    this.validYears = new Set();             // years of participation
    this.medalCount = {};                    // YearSeason string → count
    this.athleteCount = {};                  // YearSeason string → count
    this.athleteListMap = {};                // YearSeason string → list of Athlete

    this.worldX = 0;
    this.worldY = 0;
    this.screenX = 0;
    this.screenY = 0;
    this.screenR = 0;
    this.adjustedPos = createVector();

    this.popStartTime = 0;
    this.hasPopped = false;
  }

  matchesName(s) {
    if (!s) return false;
    s = s.toLowerCase();
    return (
      s === this.countryName.toLowerCase() ||
      s === this.olympicTeam.toLowerCase() ||
      s === this.otherAlias.toLowerCase() ||
      s === this.historicAlias.toLowerCase()
    );
  }

  addMedal(ys, medal) {
    let key = ys.toString();
    if (!this.medalCount[key]) this.medalCount[key] = 0;
    if (medal && ["gold", "silver", "bronze"].includes(medal.toLowerCase())) {
      this.medalCount[key]++;
    }
  }

  addAthlete(ys, athlete) {
    let key = ys.toString();
    if (!this.athleteListMap[key]) this.athleteListMap[key] = [];
    this.athleteListMap[key].push(athlete);
  }

  computeYearSeasonAggregates() {
    for (let key in this.athleteListMap) {
      let list = this.athleteListMap[key];
      let ids = new Set();
      for (let a of list) {
        ids.add(`${a.name}-${JSON.stringify(a.eventList)}`);
      }
      this.athleteCount[key] = ids.size;

      let uniqueMedals = new Set();
      for (let a of list) {
        for (let ev of a.eventList) {
          if (a.gold > 0) uniqueMedals.add(ev + "|Gold");
          if (a.silver > 0) uniqueMedals.add(ev + "|Silver");
          if (a.bronze > 0) uniqueMedals.add(ev + "|Bronze");
        }
      }
      this.medalCount[key] = uniqueMedals.size;
    }
  }

participatedIn(ys) {
  if (!ys || typeof ys.toString !== "function") return false;
  return this.medalCount[ys.toString()] !== undefined ||
         this.athleteListMap[ys.toString()] !== undefined;
}


  getValue(varName, ys) {
    let key = ys.toString();
    if (varName === "Total Medals") return this.medalCount[key] || 0;
    if (varName === "Athlete Count") return this.athleteCount[key] || 0;
    if (varName === "Population") return this.populationByYear[ys.year] || 0;
    if (varName === "Land Area") return this.landArea;
    return 0;
  }

  getAthletes(ys) {
    return this.athleteListMap[ys.toString()] || [];
  }

  getAllYearSeasons() {
    let set = new Set();
    Object.keys(this.medalCount).forEach(str => set.add(str));
    Object.keys(this.athleteListMap).forEach(str => set.add(str));
    return Array.from(set).map(YearSeason.fromString);
  }
}

class YearSeason {
  constructor(year, season) {
    this.year = parseInt(year);
    this.season = season.toLowerCase().startsWith("w") ? "W" : "S";
  }

  toString() {
    return `${this.year}${this.season}`;
  }

  label() {
    return `${this.year} ${this.season}`;
  }

  compareTo(other) {
    if (this.year !== other.year) return this.year - other.year;
    return this.season.localeCompare(other.season); // W < S
  }

  equals(other) {
    return this.year === other.year && this.season === other.season;
  }

  static fromString(s) {
    let year = parseInt(s.slice(0, -1));
    let season = s.slice(-1);
    return new YearSeason(year, season);
  }
}
