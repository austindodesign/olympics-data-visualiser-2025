// DataHandler.js — Load all Olympic CSVs

function parseSafeNum(val) {
  if (val === "n/a" || val === "") return null;
  const n = parseFloat(val);
  if (isNaN(n)) console.warn("❌ parseSafeNum failed on:", val);
  return n;
}

function loadCountryAliases() {
  for (let row of aliasTable.rows) {
    let noc = row.getString("NOC");
    let team = row.getString("olympic_team");
    let cname = row.getString("country_name");
    let region = row.getString("region");

    let cd = new CountryData(noc, team, cname, region);
    cd.otherAlias = row.getString("other_allias");
    cd.historicAlias = row.getString("historic_name");
    countryMap[noc] = cd;
  }
}

function loadCountryStats() {
  if (!statsTable) {
    console.warn("statsTable is not loaded");
    return;
  }

  for (let row of statsTable.rows) {
    const cname = row.getString("country");
    const land = parseSafeNum(row.getString("land_area"));

    for (let key in countryMap) {
      const cd = countryMap[key];
      if (cd.matchesName(cname)) {
        cd.landArea = land;
        break;
      }
    }
  }
}

function loadWorldPop() {
  if (!popTable) {
    console.warn("popTable is not loaded");
    return;
  }

  for (let row of popTable.rows) {
    const cname = row.getString("country");

    for (let key in countryMap) {
      const cd = countryMap[key];
      if (cd.matchesName(cname)) {
        for (let col of popTable.columns) {
          if (col === "country") continue;
          const year = parseInt(col);
          const val = parseSafeNum(row.getString(col));
          if (!isNaN(year)) {
            cd.populationByYear[year] = val;
          }
        }
        break;
      }
    }
  }
}

function loadOlympicParticipation() {
  if (!aliasTable) {
    console.warn("aliasTable is not loaded for participation");
    return;
  }

  for (let row of aliasTable.rows) {
    const noc = row.getString("NOC");
    const start = parseSafeNum(row.getString("start_year"));
    const end = parseSafeNum(row.getString("end_year"));
    const cd = countryMap[noc];

    if (!cd || isNaN(start) || isNaN(end)) continue;

    for (let y = start; y <= end; y++) {
      cd.validYears.add(y);
    }
  }
}

function loadOlympicsData() {
  if (!olympicsTable) {
    console.warn("olympicsTable is not loaded");
    return;
  }

  for (let row of olympicsTable.rows) {
    const noc = row.getString("NOC");
    const cd = countryMap[noc];
    if (!cd) continue;

    const year = parseSafeNum(row.getString("Year"));
    const season = row.getString("Season");
    const medal = row.getString("Medal");
    if (!year || !season) continue;

    const ys = new YearSeason(year, season);

    if (medal && medal !== "") {
      cd.addMedal(ys, medal);
    }

    const a = new Athlete(
      row.getString("Name"),
      row.getString("Sex"),
      parseSafeNum(row.getString("Age")),
      parseSafeNum(row.getString("Height")),
      parseSafeNum(row.getString("Weight")),
      row.getString("Sport")
    );

    a.addMedal(medal);
    a.addEvent(row.getString("Event"));
    cd.addAthlete(ys, a);
  }

  for (let key in countryMap) {
    countryMap[key].computeYearSeasonAggregates();
  }
}

function buildYearSeasonList() {
  let set = new Set();
  for (let key in countryMap) {
    let cd = countryMap[key];
    for (let ys of cd.getAllYearSeasons()) {
      set.add(ys.toString());
    }
  }

  let ysList = Array.from(set).map(str => YearSeason.fromString(str));
  ysList.sort((a, b) => a.compareTo(b));
  yearSeasonList = ysList;
}

function computeSliderPositions() {
  let n = yearSeasonList.length;
  if (n === 0) return;
  for (let i = 0; i < n; i++) {
    let ys = yearSeasonList[i];
    let x = int(map(i, 0, n - 1, CHART_LEFT, CHART_RIGHT));
    yearXpos[ys.toString()] = x;
  }
}
