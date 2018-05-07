const lights = require('./lights');
const {Observable} = require('rx');
const chai = require('chai');
const {assert, expect} = chai;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

describe('lights', () => {
  beforeEach(done => {
    done();
  });

  afterEach(done => {
    done();
  });

  describe('blinkPhrase', () => {
    let blinkCharStub;

    afterEach(() => {
      if (!!blinkCharStub) blinkCharStub.restore();
    });

    it('should call blinkChar correct number of times', done => {
      blinkCharStub = sinon.stub(lights, 'blinkChar').callsFake((char) => {
        return Observable.just();
      })

      lights.blinkPhrase('test 1 2 3')
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
          expect(true).to.be.not.ok
          done();
        });
    });

    it('should throw an error given a non string', done => {
      lights.blinkPhrase([])
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
          expect(true).to.be.not.ok
          done();
        }, () => done());
    });

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