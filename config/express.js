const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const httpStatus = require('http-status');
const expressWinston = require('express-winston');
const expressValidation = require('express-validation');
const helmet = require('helmet');
const winstonInstance = require('./winston');
const routes = require('../index.route');
const config = require('./config');
const APIError = require('../server/helpers/APIError');
const Email = require('../server/helpers/email');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const mongoose = require('mongoose');
const cron = require('../server/helpers/CronService');
const fileUpload = require('express-fileupload');
const app = express();


const options = {
  swaggerDefinition: {
    info: {
      description: 'API Req Response for Service Request by @Saurabh Chhabra',
      title: 'Service Request',
      version: '0.0.0',
    },
    host: 'localhost:4040',
    basePath: '/api',
    produces: [
      'application/json',
      'application/xml'
    ],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Enter Auth with Beraer {token}',
        scheme: 'bearer',
        value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1N2MwODc4OTVjMGYxMTA3OTliNGM4MmUiLCJpYXQiOjE1NzkwOTQwOTd9.uWS628qpXhlraSllx1_BBhHa70zQ8yUmy-H4nt2bOSc'
      }
    }
  },
  basedir: __dirname, // app absolute path
  files: ['./**/*controller.js'], // Path to the API handle folder
  apis: ['./**/*.route.js', './**/*.routes.js'] // Path to the API handle folder
};
// expressSwagger(options)

const swaggerSpec = swaggerJSDoc(options);

if (config.env === 'development') {
  app.use(logger('dev'));
}

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/node_modules`));
app.use(express.static('public'));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// app detection disable
app.disable('x-powered-by');

// enable CORS - Cross Origin Resource Sharing
app.use('*', cors());

// app.use(cors({ origin: true, credentials: true }));
// app.options('*', cors());

// enable file upload
app.use(fileUpload());

// enable detailed API logging in dev env
if (config.env === 'development') {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');
  app.use(expressWinston.logger({
    winstonInstance,
    meta: true, // optional: log meta data about request (defaults to true)
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
  }));
}

// mount all routes on /api path
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    const apiError = new APIError('Your session has been timed out. Please login again to continue', err.status, err.isPublic);
    return next(apiError);
  }

  if (err instanceof expressValidation.ValidationError) {
    if (err instanceof Error) {
      if (err.errors.length > 0) {
        let unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
        unifiedErrorMessage = unifiedErrorMessage.replace(/\//g, '').replace(/"/g, '');
        const apiError = new APIError(unifiedErrorMessage, httpStatus.BAD_REQUEST, err.isPublic);
        return next(apiError);
      }
      const apiError = new APIError(err, httpStatus.BAD_REQUEST, err.isPublic);
      return next(apiError);
    }
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (err instanceof mongoose.Error) {
    const apiError = new APIError(err, httpStatus.UNPROCESSABLE_ENTITY, err.isPublic);
    return next(apiError);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});


// catch 404 and forward to error handler
// app.use((req, res, next) => {
//   var err = new APIError('API not found', httpStatus.NOT_FOUND);
//   return next(err);
// });

// log error in winston transports except when executing test suite
if (config.env !== 'test') {
  app.use(expressWinston.errorLogger({
    winstonInstance
  }));
}

// error handler, send stacktrace only during development
app.use((err, req, res, next) => {
 // eslint-disable-line no-unused-vars

  // Email.systemError(err.stack);

  res.status(httpStatus.OK).json({
    status: err.status,
    response: false,
    data: null,
    message: null,
    errorMessage: err.isPublic ? err.message : httpStatus[err.status],
    //stack: config.env === 'development' ? err.stack : {}
  });
});


// insta post get
app.get('/posts/:postId', (req, res) => {
  res.sendFile('public/posts/post.html');
});

// profile image
app.get('/profile/*', (req, res) => {
  res.sendFile('public/profile/default.png');
  res.status(httpStatus.NOT_FOUND);
});

// post image
app.get('/post/*', (req, res) => {
  res.sendFile('public/post/default.png');
  res.status(httpStatus.NOT_FOUND);
});

// qrcode image
// app.get('/qrcode/*', (req, res) => {
//   res.sendFile('public/post/default.png');
//   res.status(httpStatus.NOT_FOUND);
// });

// chat image
app.get('/chat/*', (req, res) => {
  res.sendFile('public/post/default.png');
  res.status(httpStatus.NOT_FOUND);
});

// qrCodeScanner image
// app.get('/qrCodeScanner/*', (req, res) => {
//   res.sendFile('public/post/default.png');
//   res.status(httpStatus.NOT_FOUND);
// });

// download QR code scanner image
// app.get('/download/:fileName', (req, res) => {
//   const file = `${process.cwd()}/public/qrCodeScanner/${req.params.fileName}`;
//   res.download(file);
// });

winstonInstance.log({
  level: 'info',
  message: `Cron Service & ${cron}`
});

module.exports = app;
