// Athlete.js — Holds athlete data: name, sex, age, physicals, sport, events, medal counts

class Athlete {
  constructor(name, sex, age, height, weight, sport) {
    this.name = name;
    this.sex = sex;
    this.age = age;
    this.height = height;
    this.weight = weight;
    this.sport = sport;

    this.eventList = [];
    this.gold = 0;
    this.silver = 0;
    this.bronze = 0;
  }

  addMedal(m) {
    if (!m) return;
    if (m.toLowerCase() === "gold") this.gold++;
    if (m.toLowerCase() === "silver") this.silver++;
    if (m.toLowerCase() === "bronze") this.bronze++;
  }

  addEvent(e) {
    if (e && !this.eventList.includes(e)) {
      this.eventList.push(e);
    }
  }

  eventCount() {
    return this.eventList.length;
  }
}
