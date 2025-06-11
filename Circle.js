// Circle.js — draws all country bubbles and axes

function drawAllCountryCircles() {


  
  const maxDataX = getMaxValueForYearSeason(selectedX, currentYearSeason);
  const maxDataY = getMaxValueForYearSeason(selectedY, currentYearSeason);
  const marginX = maxDataX * CHART_MARGIN_RATIO;
  const marginY = maxDataY * CHART_MARGIN_RATIO + 10;

  // Map raw data values to screen positions
  for (let key in countryMap) {
    let c = countryMap[key];
    if (!c.participatedIn(currentYearSeason)) continue;

    let dataX = c.getValue(selectedX, currentYearSeason);
    let dataY = c.getValue(selectedY, currentYearSeason);

    c.adjustedPos.x = map((dataX - currentPan.x) * currentZoom, -marginX, maxDataX + marginX, CHART_LEFT, CHART_RIGHT);
    c.adjustedPos.y = map((dataY - currentPan.y) * currentZoom, -marginY, maxDataY + marginY, CHART_BOTTOM, CHART_TOP);
  }

  // Circle repulsion
  const visibleCountries = Object.values(countryMap).filter(c => c.participatedIn(currentYearSeason));
  for (let i = 0; i < visibleCountries.length; i++) {
    const a = visibleCountries[i];
    for (let j = i + 1; j < visibleCountries.length; j++) {
      const b = visibleCountries[j];
      const dx = b.adjustedPos.x - a.adjustedPos.x;
      const dy = b.adjustedPos.y - a.adjustedPos.y;
      const distSq = dx * dx + dy * dy;
      const minDist = a.screenR + b.screenR + 1;

      if (distSq < minDist * minDist) {
        const aBig = a.screenR >= 20;
        const bBig = b.screenR >= 20;
        if (aBig || bBig || currentZoom >= 2) {
          let dist = sqrt(distSq);
          if (dist === 0) dist = 0.01;
          const overlap = (minDist - dist) * 0.5;
          const ux = dx / dist;
          const uy = dy / dist;
          a.adjustedPos.x -= ux * overlap;
          a.adjustedPos.y -= uy * overlap;
          b.adjustedPos.x += ux * overlap;
          b.adjustedPos.y += uy * overlap;
        }
      }
    }
  }

  // Draw each circle
  for (let key in countryMap) {
    const cd = countryMap[key];
    if (!cd.participatedIn(currentYearSeason)) continue;

    const dataY = cd.getValue(selectedY, currentYearSeason);
    let baseR = (dataY > 0) ? map(dataY, 1, maxDataY, 15, 70) : 15;
    if (baseR >= 20) baseR *= currentZoom;
    let actualR = baseR;

    // Pop animation
    let popT = 1;
    if (!cd.hasPopped) {
      popT = constrain((millis() - cd.popStartTime) / 300.0, 0, 1);
      actualR = lerp(0, baseR, popT);
      if (popT >= 1) cd.hasPopped = true;
    }

    if (popT < 0.1) continue;

    // Hover or click animation
    if (cd.NOC === hoveredNOC && clickedNOC === "") {
      let t = constrain((millis() - hoverStartTime) / 200.0, 0, 1);
      actualR = lerp(baseR, baseR + 15, t);
    }

    if (cd.NOC === clickedNOC) {
      let t = constrain((millis() - clickStartTime) / 200.0, 0, 1);
      actualR = lerp(baseR, 100, t);
    }

    cd.screenR = actualR;

    // Scatter small circles
    if (cd.screenR < 20) {
      let scatterStrength = 200;
      let seed = hashString(cd.countryName) * 0.001;
      cd.adjustedPos.x += (noise(seed, 0) - 0.5) * scatterStrength;
      cd.adjustedPos.y += (noise(seed, 100) - 0.5) * scatterStrength;
    }

    // Fill color
    let c = tierColor(dataY, maxDataY);
    if (clickedNOC !== "" && cd.NOC !== clickedNOC) {
      c.setAlpha(127);
    }

    noStroke();
    fill(c);
    ellipse(cd.adjustedPos.x, cd.adjustedPos.y, actualR * 2, actualR * 2);

    // Labels
    fill(TEXT_COLOUR);
    textAlign(CENTER, CENTER);

    if (cd.NOC === clickedNOC && actualR >= 40) {
      const region = cd.region;
      const medalStr = nf(int(cd.getValue("Total Medals", currentYearSeason)));
      let extraStat = "";
      let showIcon = false;

      if (selectedX === "Athlete Count") {
        showIcon = true;
        extraStat = "Total Athlete: " + int(cd.getValue("Athlete Count", currentYearSeason));
      } else if (selectedX === "Population") {
        const pop = cd.getValue("Population", currentYearSeason);
        showIcon = true;
        extraStat = pop === 0 ? "Historic state / No data" : "Population: " + nfc(int(pop));
      } else if (selectedX === "Land Area") {
        const land = cd.getValue("Land Area", currentYearSeason);
        showIcon = true;
        extraStat = land === 0 ? "Historic state / No data" : "Area: " + nfc(int(land)) + " km²";
      }

      const y = cd.adjustedPos.y;
      textFont(oswaldBold, 24 * popT);
      text(cd.countryName, cd.adjustedPos.x, y - 42);
      textFont(urbanistBold, 14);
      text(region, cd.adjustedPos.x, y - 18);
      textFont(urbanistBlack, 32);
      text(medalStr, cd.adjustedPos.x, y + 8);

      if (showIcon) {
        imageMode(CORNER);
        const medalW = textWidth(medalStr);
        const iconSize = 24;
        const iconX = cd.adjustedPos.x - medalW / 2 + medalW + 6;
        const iconY = y + 8 - iconSize / 2;
        image(medalIcon, iconX, iconY, iconSize, iconSize);
      }

      textFont(oswaldSemiBold, 16);
      text(extraStat, cd.adjustedPos.x, y + 34);
    } else {
      textFont(oswaldSemiBold, 12);
      text(cd.NOC, cd.adjustedPos.x, cd.adjustedPos.y);
    }
  }
}

// Tier-based color logic
function tierColor(val, maxVal) {
  if (val <= 0 || maxVal <= 0) return color(NO_MEDAL);
  const p = val / maxVal;
  const s = currentYearSeason.season;
  if (s === "S") {
    if (p <= 0.25) return color(TIER_S1_MEDAL);
    if (p <= 0.50) return color(TIER_S2_MEDAL);
    if (p <= 0.75) return color(TIER_S3_MEDAL);
    return color(TIER_S4_MEDAL);
  } else {
    if (p <= 0.25) return color(TIER_W1_MEDAL);
    if (p <= 0.50) return color(TIER_W2_MEDAL);
    if (p <= 0.75) return color(TIER_W3_MEDAL);
    return color(TIER_W4_MEDAL);
  }
}

// Get max value for an axis variable
function getMaxValueForYearSeason(varName, ys) {
  let maxV = 0;
  for (let key in countryMap) {
    const cd = countryMap[key];
    if (!cd.participatedIn(ys)) continue;
    let v = cd.getValue(varName, ys);
    if (v > maxV) maxV = v;
  }
  return maxV;
}

// Draw X/Y axes
function drawAxes() {
  stroke(LABEL_AND_LINE);
  strokeWeight(1);

  // Y-axis
  line(CHART_LEFT, CHART_TOP, CHART_LEFT, CHART_BOTTOM);
  line(CHART_LEFT, CHART_TOP, CHART_LEFT - 3, CHART_TOP + 5);
  line(CHART_LEFT, CHART_TOP, CHART_LEFT + 3, CHART_TOP + 5);

  // X-axis
  line(CHART_LEFT, CHART_BOTTOM, CHART_RIGHT, CHART_BOTTOM);
  line(CHART_RIGHT, CHART_BOTTOM, CHART_RIGHT - 5, CHART_BOTTOM - 3);
  line(CHART_RIGHT, CHART_BOTTOM, CHART_RIGHT - 5, CHART_BOTTOM + 3);
}

// Optional: constrainOffset if needed in future
function constrainOffset() {
  const maxPanX = (CHART_W * targetScale - CHART_W) / targetScale + 50 / targetScale;
  const maxPanY = (CHART_H * targetScale - CHART_H) / targetScale + 50 / targetScale;
  targetOffset.x = constrain(targetOffset.x, -maxPanX, 50 / targetScale);
  targetOffset.y = constrain(targetOffset.y, -50 / targetScale, maxPanY);
}

// Custom hash for stable scatter
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash;
  }
  return abs(hash);
}
