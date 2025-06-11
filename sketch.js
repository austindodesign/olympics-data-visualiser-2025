// sketch.js — Main Olympic Data Visualiser (p5.js version)

// Fonts
let oswaldExtraLight, oswaldBold, oswaldSemiBold, oswaldRegular;
let urbanistExtraLight, urbanistLight, urbanistMedium, urbanistBlack, urbanistBold, urbanistExtraBold;

// Constants
const SKETCH_W = 1280;
const SKETCH_H = 720;
const CHART_LEFT = 80;
const CHART_RIGHT = 1200;
const CHART_TOP = 80;
const CHART_BOTTOM = 580;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const CHART_H = CHART_BOTTOM - CHART_TOP;
const PANEL_W = Math.floor(SKETCH_W * 0.30);
const PANEL_H = SKETCH_H;
const DROPDOWN_W = 160;
const DROPDOWN_H = 20;
const NUM_VISIBLE_TICKS = 10;
const TICK_SPACING = 80;
const SLIDER_WIDTH = NUM_VISIBLE_TICKS * TICK_SPACING;
const SLIDER_X = (SKETCH_W - SLIDER_WIDTH) / 2;
const SLIDER_Y = CHART_BOTTOM + 80;
const RESET_BTN_W = 150;
const RESET_BTN_H = 30;
const RESET_BTN_Y = 80;
const CHART_MARGIN_RATIO = 0.05;
const EASE = 0.1;

// Colours
const HOST_NATION = "#00CB50";
const NO_MEDAL = "#B4B4B4";
const TIER_S1_MEDAL = "#ff555f";
const TIER_S2_MEDAL = "#ff833a";
const TIER_S3_MEDAL = "#ffb114";
const TIER_S4_MEDAL = "#ffce19";
const TIER_W1_MEDAL = "#0078d0";
const TIER_W2_MEDAL = "#00e2de";
const TIER_W3_MEDAL = "#00dd81";
const TIER_W4_MEDAL = "#80d237";
const SCREEN_BG = "#E5E5E5";
const BUTTON_UNSELECTED = "#969696";
const BUTTON_SELECTED = "#000000";
const BUTTON_HOVER = "#FF555F";
const LABEL_AND_LINE = "#5A5A5A";
const SLIDER_ANCHOR = "#FF555F";
const TEXT_COLOUR = "#000000";

// Globals
let RESET_BTN_X;
let selectedX = "Athlete Count";
let selectedY = "Total Medals";
let axisOptions = ["Athlete Count", "Population", "Land Area"];
let xDropdownOpen = false;
let yDropdownOpen = false;
let dropdownItemHeight = 20;
let X_DROPDOWN_X, X_DROPDOWN_Y = CHART_BOTTOM + 10;
let countryMap = {};
let yearSeasonList = [];
let yearXpos = {};
let flagMap = {};
let hoveredNOC = "";
let clickedNOC = "";
let panelOpen = false;
let hoverStartTime = 0;
let clickStartTime = 0;
let currentYearSeason;
let isPanning = false;
let panStartMouse, panStartOffset;
let targetZoom = 0.9;
let currentZoom = 5.0;
let dragStartIndex = 0;
let sliderOffset = 0;
let targetSliderOffset = 0;
let draggingSlider = false;
let dragStartX = 0;
let dragStartOffset = 0;
let currentSliderIndex = 0;
let medalIcon;
let currentPan, targetPan;
let currentOffset, targetOffset;

let aliasTable;
let statsTable;
let popTable;
let olympicsTable;


function preload() {
  oswaldExtraLight   = loadFont("fonts/Oswald-ExtraLight.ttf");
  oswaldBold         = loadFont("fonts/Oswald-Bold.ttf");
  oswaldSemiBold     = loadFont("fonts/Oswald-SemiBold.ttf");
  oswaldRegular      = loadFont("fonts/Oswald-Regular.ttf");
  urbanistExtraLight = loadFont("fonts/Urbanist-ExtraLight.ttf");
  urbanistLight      = loadFont("fonts/Urbanist-Light.ttf");
  urbanistMedium     = loadFont("fonts/Urbanist-Medium.ttf");
  urbanistBlack      = loadFont("fonts/Urbanist-Black.ttf");
  urbanistBold       = loadFont("fonts/Urbanist-Bold.ttf");
  urbanistExtraBold  = loadFont("fonts/Urbanist-ExtraBold.ttf");
  medalIcon = loadImage("img/totalMedal.png");

  aliasTable = loadTable("sources/country_code_alias.csv", "header");
  statsTable = loadTable("sources/country_stats_2023.csv", "header");
  popTable = loadTable("sources/worldpop.csv", "header");
  olympicsTable = loadTable("sources/olympic.csv", "header");
}


function setup() {
  createCanvas(SKETCH_W, SKETCH_H);
  textAlign(LEFT, CENTER);
  smooth();
  RESET_BTN_X = SKETCH_W - RESET_BTN_W - 20;
  currentOffset = createVector(0, 0);
  targetOffset = createVector(0, 0);
  currentPan = createVector(0, 0);
  targetPan = createVector(0, 0);
  loadCountryAliases();
  loadCountryStats();
  loadWorldPop();
  loadOlympicParticipation();
  loadOlympicsData();

  console.log("countries loaded:", Object.keys(countryMap).length);


  buildYearSeasonList();
  computeSliderPositions();
  if (yearSeasonList.length > 0) {
    currentSliderIndex = 27;
    currentYearSeason = yearSeasonList[currentSliderIndex];
    targetSliderOffset = currentSliderIndex * TICK_SPACING - SLIDER_WIDTH / 2;
    sliderOffset = targetSliderOffset;
  }
  for (let noc in countryMap) {
    let path = "flags/" + noc + ".png";
    loadImage(path, img => flagMap[noc] = img);
  }
}


function draw() {
  background(SCREEN_BG);
  currentZoom = lerp(currentZoom, targetZoom, EASE);
  currentPan.x = lerp(currentPan.x, targetPan.x, EASE);
  currentPan.y = lerp(currentPan.y, targetPan.y, EASE);
  drawSlider();
  drawDropdowns();
  drawAxes();
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(CHART_LEFT + 1, CHART_TOP + 1, CHART_W, CHART_H);
  drawingContext.clip();
  drawAllCountryCircles();
  drawingContext.restore();
  pop();
  let resetHover = isMouseOver(RESET_BTN_X, RESET_BTN_Y, RESET_BTN_W, RESET_BTN_H);
  fill(resetHover ? BUTTON_HOVER : BUTTON_SELECTED);
  rect(RESET_BTN_X, RESET_BTN_Y, RESET_BTN_W, RESET_BTN_H);
  fill(255);
  textAlign(CENTER, CENTER);
  textFont(urbanistMedium, 14);
  text("RESET VIEW", RESET_BTN_X + RESET_BTN_W / 2 - 28, RESET_BTN_Y + RESET_BTN_H / 2);
  textFont(oswaldBold, 30);
  fill(TEXT_COLOUR);
  textAlign(RIGHT, TOP);
  text("OLYMPIC GAMES STATS VISUALISER", CHART_RIGHT, CHART_TOP - 32);
}

function resetView() {
  clickedNOC = "";
  targetZoom = 0.9;
  targetPan = createVector(0, 0);
  for (let key in countryMap) {
    let cd = countryMap[key];
    cd.hasPopped = false;
    cd.popStartTime = millis() + int(random(0, 500));
  }
}

function isMouseOver(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function drawSlider() {
  sliderOffset = lerp(sliderOffset, targetSliderOffset, 0.1);
  let anchorX = SLIDER_X + SLIDER_WIDTH / 2;
  let alignedIndex = round((sliderOffset + anchorX - SLIDER_X) / TICK_SPACING);
  alignedIndex = constrain(alignedIndex, 0, yearSeasonList.length - 1);
  fill(SLIDER_ANCHOR);
  noStroke();
  let triangleY = SLIDER_Y + 8;
  triangle(anchorX - 6, triangleY + 6, anchorX + 6, triangleY + 6, anchorX, triangleY);
  for (let i = 0; i < yearSeasonList.length; i++) {
    let ys = yearSeasonList[i];
    let x = SLIDER_X + i * TICK_SPACING - sliderOffset;
    if (x < SLIDER_X - TICK_SPACING || x > SLIDER_X + SLIDER_WIDTH + TICK_SPACING) continue;
    stroke(LABEL_AND_LINE);
    line(x, SLIDER_Y - 5, x, SLIDER_Y + 5);
    fill(TEXT_COLOUR);
    textAlign(CENTER, BOTTOM);
    textFont(i === alignedIndex ? urbanistBlack : urbanistMedium, 14);
    text(ys.label(), x, SLIDER_Y - 8);
  }
}

function drawDropdowns() {
  X_DROPDOWN_X = (CHART_LEFT + CHART_RIGHT) / 2 - DROPDOWN_W / 2;
  let xHover = isMouseOver(X_DROPDOWN_X, X_DROPDOWN_Y, DROPDOWN_W, DROPDOWN_H);
  fill(xHover || xDropdownOpen ? BUTTON_HOVER : BUTTON_SELECTED);
  rect(X_DROPDOWN_X, X_DROPDOWN_Y, DROPDOWN_W, DROPDOWN_H);
  textFont(urbanistMedium, 16);
  fill(xDropdownOpen ? TEXT_COLOUR : 255);
  textAlign(CENTER, CENTER);
  text(selectedX.toUpperCase(), X_DROPDOWN_X + DROPDOWN_W / 2, X_DROPDOWN_Y + DROPDOWN_H / 2);
  if (xDropdownOpen) {
    for (let i = 0; i < axisOptions.length; i++) {
      let val = axisOptions[i];
      if (val === "Total Medals") continue;
      let itemY = X_DROPDOWN_Y + DROPDOWN_H + i * dropdownItemHeight;
      let isHover = mouseX >= X_DROPDOWN_X && mouseX <= X_DROPDOWN_X + DROPDOWN_W &&
                    mouseY >= itemY && mouseY <= itemY + dropdownItemHeight;
      fill(isHover ? BUTTON_HOVER : BUTTON_UNSELECTED);
      rect(X_DROPDOWN_X, itemY, DROPDOWN_W, dropdownItemHeight);
      fill(TEXT_COLOUR);
      text(val.toUpperCase(), X_DROPDOWN_X + DROPDOWN_W / 2, itemY + dropdownItemHeight / 2);
    }
  }
  fill(TEXT_COLOUR);
  textAlign(CENTER, CENTER);
  textFont(urbanistMedium, 16);
  push();
  translate(CHART_LEFT - 15, (CHART_TOP + CHART_BOTTOM) / 2);
  rotate(-HALF_PI);
  text("TOTAL MEDALS", 0, 0);
  pop();
}

function handleDropdownClicks() {
  if (isMouseOver(X_DROPDOWN_X, X_DROPDOWN_Y, DROPDOWN_W, DROPDOWN_H)) {
    xDropdownOpen = !xDropdownOpen;
    yDropdownOpen = false;
    return;
  }
  if (xDropdownOpen) {
    for (let i = 0; i < axisOptions.length; i++) {
      let itemY = X_DROPDOWN_Y + DROPDOWN_H + i * dropdownItemHeight;
      if (isMouseOver(X_DROPDOWN_X, itemY, DROPDOWN_W, dropdownItemHeight)) {
        let val = axisOptions[i];
        if (val !== "Total Medals") {
          selectedX = val;
          resetView();
        }
        xDropdownOpen = false;
        return;
      }
    }
  }
  xDropdownOpen = false;
}

function mousePressed() {
  handleDropdownClicks();
  if (mouseY >= SLIDER_Y - 20 && mouseY <= SLIDER_Y + 20) {
    draggingSlider = true;
    dragStartX = mouseX;
    dragStartOffset = targetSliderOffset;
  }
  if (isMouseOver(RESET_BTN_X, RESET_BTN_Y, RESET_BTN_W, RESET_BTN_H)) {
    resetView();
    return;
  }
  for (let key in countryMap) {
    let cd = countryMap[key];
    if (!cd.participatedIn(currentYearSeason)) continue;
    let dx = mouseX - cd.adjustedPos.x;
    let dy = mouseY - cd.adjustedPos.y;
    if (sqrt(dx * dx + dy * dy) < cd.screenR) {
      clickedNOC = cd.NOC;
      clickStartTime = millis();
      return;
    }
  }
  if (mouseX >= CHART_LEFT && mouseX <= CHART_RIGHT && mouseY >= CHART_TOP && mouseY <= CHART_BOTTOM) {
    isPanning = true;
    panStartMouse = createVector(mouseX, mouseY);
    panStartOffset = targetPan.copy();
  }
  if (clickedNOC !== "") {
    let cd = countryMap[clickedNOC];
    if (cd) {
      let dx = mouseX - cd.adjustedPos.x;
      let dy = mouseY - cd.adjustedPos.y;
      if (sqrt(dx * dx + dy * dy) >= cd.screenR) {
        clickedNOC = "";
        panelOpen = false;
      }
    }
  }
}

function mouseDragged() {
  if (draggingSlider) {
    targetSliderOffset = dragStartOffset - (mouseX - dragStartX);
  }
  if (isPanning) {
    let dx = (mouseX - pmouseX) * getMaxValueForYearSeason(selectedX, currentYearSeason) / CHART_W / currentZoom;
    let dy = (mouseY - pmouseY) * getMaxValueForYearSeason(selectedY, currentYearSeason) / CHART_H / currentZoom;
    targetPan.x -= dx;
    targetPan.y += dy;
  }
}

function mouseReleased() {
  if (draggingSlider) {
    draggingSlider = false;
    let anchorX = SLIDER_X + SLIDER_WIDTH / 2;
    let exactIndex = (targetSliderOffset + anchorX - SLIDER_X) / TICK_SPACING;
    currentSliderIndex = round(exactIndex);
    currentSliderIndex = constrain(currentSliderIndex, 0, yearSeasonList.length - 1);
    currentYearSeason = yearSeasonList[currentSliderIndex];
    targetSliderOffset = currentSliderIndex * TICK_SPACING - SLIDER_WIDTH / 2;
    resetView();
  }
  isPanning = false;
  if (clickedNOC !== "") {
    let cd = countryMap[clickedNOC];
    if (cd && cd.participatedIn(currentYearSeason)) {
      let maxDataX = getMaxValueForYearSeason(selectedX, currentYearSeason);
      let maxDataY = getMaxValueForYearSeason(selectedY, currentYearSeason);
      let marginX = maxDataX * CHART_MARGIN_RATIO;
      let marginY = maxDataY * CHART_MARGIN_RATIO + 10;
      let dataX = cd.getValue(selectedX, currentYearSeason);
      let dataY = cd.getValue(selectedY, currentYearSeason);
      let screenCX = (CHART_LEFT + CHART_RIGHT) / 2;
      let screenCY = (CHART_TOP + CHART_BOTTOM) / 2;
      let targetDataX = map(screenCX, CHART_LEFT, CHART_RIGHT, -marginX, maxDataX + marginX) / currentZoom + currentPan.x;
      let targetDataY = map(screenCY, CHART_BOTTOM, CHART_TOP, -marginY, maxDataY + marginY) / currentZoom + currentPan.y;
      targetPan.x = dataX - (targetDataX - currentPan.x);
      targetPan.y = dataY - (targetDataY - currentPan.y);
    }
  }
}

function mouseMoved() {
  if (!panelOpen && clickedNOC === "") {
    hoveredNOC = "";
    for (let key in countryMap) {
      let cd = countryMap[key];
      if (!cd.participatedIn(currentYearSeason)) continue;
      let dx = mouseX - cd.adjustedPos.x;
      let dy = mouseY - cd.adjustedPos.y;
      if (sqrt(dx * dx + dy * dy) < cd.screenR) {
        hoveredNOC = cd.NOC;
        hoverStartTime = millis();
        return;
      }
    }
  }
}

function mouseWheel(event) {
  let zoomChange = 1 - event.delta * 0.001;
  let maxDataX = getMaxValueForYearSeason(selectedX, currentYearSeason);
  let maxDataY = getMaxValueForYearSeason(selectedY, currentYearSeason);
  let dataXUnderMouse = (mouseX - CHART_LEFT) / CHART_W * maxDataX / currentZoom + currentPan.x;
  let dataYUnderMouse = (CHART_BOTTOM - mouseY) / CHART_H * maxDataY / currentZoom + currentPan.y;
  targetZoom *= zoomChange;
  targetZoom = constrain(targetZoom, 0.8, 50.0);
  let newDataXUnderMouse = (mouseX - CHART_LEFT) / CHART_W * maxDataX / targetZoom + targetPan.x;
  let newDataYUnderMouse = (CHART_BOTTOM - mouseY) / CHART_H * maxDataY / targetZoom + targetPan.y;
  targetPan.x += (dataXUnderMouse - newDataXUnderMouse);
  targetPan.y += (dataYUnderMouse - newDataYUnderMouse);
}
