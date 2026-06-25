const EventEmitter = require('events');

module.exports = function createEventBus() {
  const emitter = new EventEmitter();

  return {
    emit: function (eventName, payload) {
      emitter.emit(eventName, payload);
    },
    on: function (eventName, handler) {
      emitter.on(eventName, handler);
      return function unsubscribe() {
        emitter.off(eventName, handler);
      };
    }
  };
};
