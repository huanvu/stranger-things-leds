const { Controller } = require('./controller');
const { Lights } = require('./lights');
const Fixtures = require('./fixtures');
const {Observable} = require('rx');
const chai = require('chai');
const {assert, expect} = chai;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const winston = require('winston');
chai.should();
chai.use(sinonChai);

describe('controller', () => {
  winston.level = 'warn';

  let controller, lights;
    
  beforeEach(() => {
    lights = new Lights();
    controller = new Controller(lights);
  });

  describe('clearQueue', () => {
    let processQueueStub;

    beforeEach(() => {
      processQueueStub = sinon.stub(controller, 'processQueue');
    });

    afterEach(() => {
      processQueueStub.restore();
    });

    it('should stop whatevers going on and clear the queue', () => {
      controller.queueMessage(Fixtures.SOME_STRING);
      controller.clearQueue();
      expect(controller.queue).to.be.empty;
    });
  });

  describe('queueMessage', () => {
    let processQueueSpy;

    beforeEach(() => {
      processQueueSpy = sinon.spy(controller, 'processQueue');
    });

    afterEach(() => {
      processQueueSpy.restore();
    });

    it('should queue message and only call process queue once', () => {
      controller.queueMessage(Fixtures.SOME_STRING());
      controller.queueMessage(Fixtures.SOME_OTHER_STRING());
      // first call to processQueue 
      expect(controller.queue).to.have.lengthOf(1);
      expect(processQueueSpy).to.have.callCount(1);
    });
  });

  describe('processQueue', () => {
    let blinkMessageStub;

    beforeEach(() => {
      blinkMessageStub = sinon.stub(lights, 'blinkMessage')
        .callsFake(Observable.just);
    });

    afterEach(() => {
      blinkMessageStub.restore();
    });

    it('should fully process the queue', () => {
      let queue = [Fixtures.SOME_STRING(), Fixtures.SOME_OTHER_STRING()]
      controller.processQueue(queue);
      expect(controller.queue).to.be.empty;
      expect(controller.isBusy).to.be.false;
      expect(blinkMessageStub).to.have.callCount(2);
    });
  });

  describe('playRandomMessages', () => {
    let blinkMessageStub,
        pickRandomMessageStub;

    beforeEach(() => {
      blinkMessageStub = sinon.stub(lights, 'blinkMessage')
        .callsFake(Observable.just);
      pickRandomMessageStub = sinon.stub(controller, 'pickRandomMessage')
        .returns(Fixtures.SOME_STRING());
    });

    afterEach(() => {
      blinkMessageStub.restore();
      pickRandomMessageStub.restore();
    });

    it('should call blink', () => {
      let messages = [Fixtures.SOME_STRING(), Fixtures.SOME_OTHER_STRING()]
      controller.startRandomSequence();
      controller.cancelRandomSequence();
     
      expect(controller.randomSequenceDisposable).to.not.exist;
      /*
      expect(pickRandomMessageStub).should.have.been.calledWith(messages);
      expect(blinkMessageStub).should.have.been.calledWith(Fixtures.SOME_STRING());*/
    });
  });
})