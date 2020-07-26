var mongoose = require('mongoose');
var util = require('util');

// config should be imported before importing any other file
var config = require('./config/config');
var app = require('./config/express');

var debug = require('debug')('servicerequestapi:index');

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// connect to mongo db
var mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

// print mongoose logs in dev env
if (config.mongooseDebug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
    console.log(`${collectionName}.${method}`, JSON.stringify(query));
  });
}


var http = require('http');
var server = http.createServer(app);

var socketio = require('socket.io')(server);
require('./config/socketio')._sockets(socketio);

//server.listen(process.env.PORT || config.port);
// Populate databases with sample data
(config.seedDB) ? require('./config/seed') : false;

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.port
  server.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
  });
}


Array.prototype.forEachAsync = async function (fn) {
  for (let t of this) { await fn(t) }
}

Array.prototype.forEachAsyncParallel = async function (fn) {
  await Promise.all(this.map(fn));
}

module.exports = app;
