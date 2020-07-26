const winston = require('winston');
// var config = require('./config');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      json: true,
      colorize: true
    })
  ],
  exitOnError: false,
});

// if (config.env === "development") {
//   logger.transports.push(new (winston.transports.File)({
//     filename: 'error.log', level: 'error'
//   }));

//   logger.transports.push(new (winston.transports.File)({
//     filename: 'combined.log'
//   }));
// }

module.exports = logger;
