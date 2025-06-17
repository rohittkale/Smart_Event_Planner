// models/Event.js
class Event {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.location = data.location;
    this.date = data.date;
    this.eventType = data.eventType;
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.weatherAnalysis = data.weatherAnalysis || null;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  update(data) {
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        this[key] = data[key];
      }
    });
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Event;