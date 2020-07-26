const mongoose = require('mongoose');
const request = require('supertest-as-promised');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const expect = chai.expect;
const app = require('../../index');
const config = require('../../config/config');

chai.config.includeStack = true;

const Role = require('../role/role.model');

let role = {};
let user = {};

let jwtToken;

let validUserCredentials = {};

before(() => {
  Role.findOne({ roleName: 'Dealer' }).exec().then((_role) => {
    role = _role;
  });


  /**
   * root level hooks
   */
  after((done) => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.connection.close();
    done();
  });

  describe('## User APIs', () => {
    describe('# POST /api/users', () => {
      it('should create a new user', (done) => {
        user = {
          userName: `superuser_${Date.now()}`,
          name: 'Super User',
          address: 'M93',
          country: 'India',
          phone: '9968302319',
          email: `test_${Date.now()}@super.com`,
          role: role._id,
          password: '123456',
          isActive: true,
          type: role.userType,
          company: 'STAD',
          gstin: '1234567'
        };
        request(app)
          .post('/api/users')
          .send(user)
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body.message).to.equal('User created. Please check email to verify email');
            done();
          })
          .catch(done);
      });
    });

    describe('# POST /api/auth/login for Dealer', () => {
      it('should get valid JWT token', (done) => {
        validUserCredentials = {
          identifier: user.email,
          password: user.password
        };

        request(app)
          .post('/api/auth/login')
          .set('content-type', 'application/json')
          .send(validUserCredentials)
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.have.property('token');
            jwt.verify(res.body.token, config.jwtSecret, (err) => {
              expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
              jwtToken = `Bearer ${res.body.token}`;
              user._id = res.body._id;
              done();
            });
          })
          .catch(done);
      });
    });


    describe('# GET /api/auth/me', () => {
      it('should get user details or Please verify EmailId to continue', (done) => {
        request(app)
          .get('/api/auth/me')
          .set('Authorization', jwtToken)
          .expect(httpStatus.NOT_ACCEPTABLE)
          .then((res) => {
            expect(res.body.message).to.equal('Please verify EmailId to continue');

            done();
          })
          .catch(done);
      });

      it('should report error with message - Not found, when user does not exists', (done) => {
        request(app)
          .get('/api/users/56c787ccc67fc16ccc1a5e92')
          .then((res) => {
            expect(res.body.message).to.equal('No such user exists!');
            done();
          })
          .catch(done);
      });
    });

    describe('# PUT /api/users/:userId', () => {
      it('should update user details or Please verify EmailId to continue', (done) => {
        user.userName = 'KK';
        request(app)
          .put(`/api/users/${user._id}`)
          .send(user)
          .set('Authorization', jwtToken)
          .expect(httpStatus.NOT_ACCEPTABLE)
          .then((res) => {
            expect(res.body.message).to.equal('Please verify EmailId to continue');
            done();
          })
          .catch(done);
      });
    });

    describe('# GET /api/users/', () => {
      it('should get all users', (done) => {
        request(app)
          .get('/api/users')
          .set('Authorization', jwtToken)
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.be.an('array');
            done();
          })
          .catch(done);
      });

      it('should get all users (with limit and skip)', (done) => {
        request(app)
          .get('/api/users')
          .query({ limit: 10, skip: 1 })
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.be.an('array');
            done();
          })
          .catch(done);
      });
    });

    describe('# DELETE /api/users/', () => {
      it('should delete user or give Please verify EmailId to continue', (done) => {
        request(app)
          .delete(`/api/users/${user._id}`)
          .set('Authorization', jwtToken)
          .expect(httpStatus.NOT_ACCEPTABLE)
          .then((res) => {
            expect(res.body.message).to.equal('Please verify EmailId to continue');
            done();
          })
          .catch(done);
      });
    });
  });
});
