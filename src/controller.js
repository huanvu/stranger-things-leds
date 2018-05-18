'use strict';
const {Observable} = require('rx');
const winston = require('winston');

function Controller(lights) {
  this.lights = lights;
  this.queue = [];
  this.messages = [];
  this.isBusy = false;
  this.randomSequenceCanceled = false;
};

Controller.prototype = {
  constructor: Controller,

  start: function() {
    this.lights.turnOn()
      .subscribe(() => winston.info("Controller started"),
          err => winston.error(`Unable to start controller`, err));
  },

  stop: function() {
    this.lights.turnOff()
      .subscribe(() => winston.info("Controller stopped"),
        err => winston.error(`Unable to stop controller`, err));
  },

  clearQueue: function() {
    winston.info("Clearing queue")
    this.queue.length = 0;
    if (!!this.queuedSubscription) {
      this.queuedSubscription.dispose();
      this.queuedSubscription = null;
    }
    this.isBusy = false;

    this.lights.turnOn()
      .subscribe(() => {},
        err => winston.error(`Unable to turn on lights`, err));
  },

  queueMessage: function(message) {
    winston.info(`Queuing message: ${message}`);
    this.queue.push(message);
    if (!this.isBusy) this.processQueue(this.queue);
  },

  processQueue: function(queue) {
    if (this.isBusy) return;

    let message = queue.shift();
    if (!message) {
      winston.debug(`Processing queue done`)
      this.isBusy = false;
      return;
    }

    winston.info(`Processing message: ${message}`)
    this.isBusy = true;
    this.queuedSubscription = this.lights.blinkMessage(message)
      .subscribe(() => {
          winston.info(`Done processing message: ${message}`);
          this.isBusy = false;
          return this.processQueue(queue);
        },
        err => winston.error(`Error processing message`, err));
  },

  startRandomSequence: function() {
    winston.debug("startRandomSequence");
    let i = 0;
    this.randomSequenceDisposable = Observable.while(
      () => !this.randomSequenceCanceled && i < 100,
      Observable.defer(() => {
        i++;
        return Observable.just(i).delay(1000);
      })
    )
    .map(count => console.log(count))
    .subscribe(() => winston.debug("startRandomSequence next"),
        err => winston.error("startRandomSequence err", err),
        () => winston.debug("startRandomSequence done"))
  },

  cancelRandomSequence: function() {
    winston.debug("cancelRandomSequence");
    this.randomSequenceCanceled = true;
    if (!!this.randomSequenceDisposable) {
      this.randomSequenceDisposable.dispose();
      this.randomSequenceDisposable = null;
    }
  },

  /*
  playRandomMessages: function(messages) {
    console.log('playRandomMessages')
    this.randomMessagesCancelled = false;

    // if we don't have messages to play, return
    if (!messages.length) return;
    // if there's already a random message playing, return
    if (!!this.playRandomSubscription) return;

    let i = 0;
    this.playRandomSubscription = Observable.while(
        () => {
          console.log('randomMessagesCancelled', this.randomMessagesCancelled);
          return !this.randomMessagesCancelled && i < 100;
        }, 
        Observable.just(this.pickRandomMessage(messages))
            .flatMap(message => this.lights.blinkMessage(message)))
      .subscribe(() => {
            winston.error("Played random message", i);
          },
          err => {
            winston.error("Unable to blink message", err);
          },
          () => {
            winston.error("playRandomMessages stopped");
          })
  },

  stopRandomMessages: function() {
    console.log('stopRandomMessages')
    this.randomMessagesCancelled = true;
    //if (this.playRandomSubscription) this.playRandomSubscription.dispose();
  },
  */

  pickRandomMessage: function(messages) {
    let randomIndex = Math.round(Math.random() * messages.length);
    return messages[randomIndex];
  }
};

module.exports = {
  Controller
};