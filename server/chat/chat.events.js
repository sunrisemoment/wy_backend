const EventEmitter = require('events').EventEmitter;
const Chat = require('./chat.model');
const eventEmitter = new EventEmitter();

eventEmitter.setMaxListeners(0);

// Model events
const events = {
  save: 'save',
  update: 'update',
  remove: 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
  Chat.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function (doc) {
    eventEmitter.emit(`${event}:${doc._id}`, doc);
    eventEmitter.emit(event, doc);
  };
}

console.log(eventEmitter);

module.exports = { eventEmitter };
