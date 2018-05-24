'use strict';
const {Observable} = require('rx');
const winston = require('winston');
const nodemailer = require('nodemailer');
const os = require('os');

function Controller(lights, messages, config) {
  this.lights = lights;
  this.messages = messages;
  this.config = config;
  this.queue = [];
  this.isBusy = false;
  this.randomSequenceCanceled = false;
  this.sentAlert = false;
  this.currentIp = null;
};

Controller.prototype = {
  constructor: Controller,

  checkForHostChange: function() {
    winston.debug('checkForHostChange');

    let ip = this.getIp();

    // if we found more than one ip, we need help.
    if (!(typeof ip === 'string' || ip instanceof String)) {
      winston.error(`Need help figuring the correct network interface: `, ip);
      return;
    }

    // if the ip hasn't changed and we already sent the alert, we don't need 
    // to do anything
    if (ip == this.currentIp && this.sentAlert) {
      return;
    } 

    if (ip != this.currentIp) {
      this.currentIp = ip;
      this.sentAlert = false;
    }

    let recipients = this.config.alertRecipients || [];
    if (!recipients.length) {
      winston.debug(`No recipients to alert`);
      return;
    }

    this.sendNewHostAlert(ip, recipients, {
      host: this.config.emailHost,
      port: this.config.emailPort,
      secure: this.config.emailSecure,
      auth: {
          user: this.config.emailUser,
          pass: this.config.emailPassword
      }  
    }).subscribe(() => {
        winston.info(`Sent IP change alert to: ${recipients}`);
        this.sentAlert = true;
      },
      err => logger.error("Unable to send IP change alert", err));
  }, 

  sendNewHostAlert: function(ip, recipients, config) {
    // Validate config
    if (!config.host || !config.auth || !config.auth.user || !config.auth.pass) {
      return Observable.error(new Error('Incomplete email configuration'));
    }

    // Set default options
    config.port = config.port || 587
    config.secure = !!config.secure || false;

    let mailOptions = {
        from: `"Stranger Things LED" <${config.auth.user}>`, 
        to: recipients, 
        subject: 'Stranger Things LED Link Has Changed', 
        text: `The new link is: http://${ip}:3000`, 
        html: `The new link is: <a href="http://${ip}:3000">http://${ip}:3000</a>`
    };

    winston.debug(`Sending email`, mailOptions);
    winston.debug('With config', config);

    // send mail
    let transporter = nodemailer.createTransport(config);
    let sendMail = Observable.fromCallback(transporter.sendMail, transporter);

    return sendMail(mailOptions);
  },

  getIp: function() {
    let hosts = {};
    let host;
    let hostCount = 0;
    let ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach((ifname) => {
      var alias = 0;
    
      ifaces[ifname].forEach((iface) => {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        if ('IPv4' !== iface.family || iface.internal !== false) return;
    
        if (!hosts[ifname]) hosts[ifname] = [];
        hosts[ifname].push(iface.address);
        host = iface.address
        hostCount++;
      });
    });

    if (hostCount > 1) return hosts;
    return host;
  },

  start: function() {
    this.lights.turnOn()
      .subscribe(() => {
          this.startRandomSequence();
        },
        err => winston.error(`Unable to start controller`, err));

    if (this.config.emailHost) {
      this.checkForHostChange();
      this.checkHostTimer = setInterval(() => {
        this.checkForHostChange();
      }, 60000);
    }

    winston.info("Controller started")
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
    this.currentMessage = null;
    this.isBusy = false;

    this.lights.turnOn()
      .subscribe(() => {},
        err => winston.error(`Unable to turn on lights`, err));
  },

  queueMessage: function(message) {
    winston.info(`Queuing message: ${message}`);
    this.cancelRandomSequence();
    this.queue.push(message);
    if (!this.isBusy) this.processQueue(this.queue);
  },

  getStatus: function() {
    return {
      blinking: this.currentMessage,
      queue: this.queue
    };
  },

  processQueue: function(queue) {
    if (this.isBusy) return;

    this.currentMessage = queue.shift();
    if (!this.currentMessage) {
      winston.debug(`Processing queue done`)
      this.isBusy = false;
      this.startRandomSequence();
      return;
    }

    winston.debug(`Processing message: ${this.currentMessage}`)
    this.isBusy = true;
    this.queuedSubscription = this.lights.blinkMessage(this.currentMessage)
      .subscribe(() => {
          winston.debug(`Done processing message: ${this.currentMessage}`);
          this.isBusy = false;
          return this.processQueue(queue);
        },
        err => winston.error(`Error processing message`, err));
  },

  startRandomSequence: function() {
    winston.info("Starting random sequence");

    if (!this.messages || !this.messages.length) return;
    
    this.randomSequenceCanceled = false;
    this.randomSequenceDisposable = Observable.while(
      () => !this.randomSequenceCanceled,
      // otherwise the same message will always play
      Observable.defer(() => {
        return this.lights.blinkMessage(this.pickRandomMessage(this.messages))
          .delay(5000);
      })
    )
    .subscribe(() => winston.debug("startRandomSequence next"),
        err => winston.error("startRandomSequence err", err),
        () => winston.debug("startRandomSequence done"))
  },

  cancelRandomSequence: function() {
    winston.info("Canceling random sequence");
    this.randomSequenceCanceled = true;
    if (!!this.randomSequenceDisposable) {
      this.randomSequenceDisposable.dispose();
      this.randomSequenceDisposable = null;
    }
  },

  pickRandomMessage: function(messages) {
    let randomIndex = Math.round(Math.random() * (messages.length - 1));
    return messages[randomIndex];
  }
};

module.exports = Controller;