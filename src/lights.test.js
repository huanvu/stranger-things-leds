const { Lights } = require('./lights');
const {Observable} = require('rx');
const chai = require('chai');
const {assert, expect} = chai;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const winston = require('winston');
chai.should();
chai.use(sinonChai);

describe('lights', () => {
  winston.level = 'warn';
  let lights = new Lights();

  describe('blinkString', () => {
    let blinkCharStub, animateOnStub, animateOffStub;

    beforeEach(() => {
      animateOnStub = sinon.stub(lights, 'animateOn')
        .callsFake(Observable.just);
      animateOffStub = sinon.stub(lights, 'animateOff')
        .callsFake(Observable.just);
    });

    afterEach(() => {
      if (!!blinkCharStub) blinkCharStub.restore();
      animateOnStub.restore();
      animateOffStub.restore();
    });

    it('should call blinkChar correct number of times', done => {
      blinkCharStub = sinon.stub(lights, 'blinkChar').callsFake((char) => {
        return Observable.just();
      })

      lights.blinkMessage('test 1 2 3')
        .subscribe(() => {
          expect(blinkCharStub).to.have.callCount(10);
          expect(blinkCharStub).to.have.been.calledWith('t');
          expect(blinkCharStub).to.have.been.calledWith('e');
          expect(blinkCharStub).to.have.been.calledWith('s');
          expect(blinkCharStub).to.have.been.calledWith('t');
          expect(blinkCharStub).to.have.been.calledWith(' ');
          expect(blinkCharStub).to.have.been.calledWith('1');
          expect(blinkCharStub).to.have.been.calledWith(' ');
          expect(blinkCharStub).to.have.been.calledWith('2');
          expect(blinkCharStub).to.have.been.calledWith(' ');
          expect(blinkCharStub).to.have.been.calledWith('3');
          done();
        }, err => {
          winston.error(err);
          expect(true).to.be.not.ok
          done();
        });
    });

    it('should throw an error given a non string', done => {
      lights.blinkMessage([])
        .subscribe(() => {
          expect(true).to.be.not.ok
        }, err => {
          expect(err).to.exist;
          done();
        }, () => done());
    });
  })

  describe('blinkChar', () => {
    it('should be ok given a character', done => {
      lights.blinkChar('a')
        .subscribe(() => {}, 
        err => {
          winston.error(err);
          expect(true).to.be.not.ok
          done();
        }, () => done());
    }).timeout(5000);

    it('should throw an error given a non string', done => {
      lights.blinkChar([])
        .subscribe(() => {
          expect(true).to.be.not.ok
        }, err => {
          expect(err).to.exist;
          done();
        }, () => done());
    });

    it('should throw an error given more than one character', done => {
      lights.blinkChar('error')
        .subscribe(() => {
          expect(true).to.be.not.ok
        }, err => {
          expect(err).to.exist;
          done();
        }, () => done());
    });
  })
})