const logger = require('./winston');
const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: Joi.number()
    .default(4040),
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  JWT_SECRET: Joi.string().required()
    .description('JWT Secret required to sign'),
  MONGO_HOST: Joi.string().required()
    .description('Mongo DB host url'),
  MONGO_PORT: Joi.number()
    .default(27017)
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  admin: {
    userId: '57c087895c0f110799b4c82e'
  },
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  inviteAmount: parseFloat(envVars.INVITE_AMOUNT),
  smsCharges: parseFloat(envVars.SMS_CHARGE),
  fcmKey: envVars.FCM_KEY,
  webrtc: 'https://apprtc.co',
  ussd: {
    code: '*347*006',
    otp: '*347*006*5#'
  },
  mongo: {
    host: envVars.MONGO_HOST,
    port: envVars.MONGO_PORT
  },
  seedDB: envVars.SEED_DB,
  expiry: {
    forgotToken: envVars.EXP_FORGOT_TOKEN
  },
  mailOptions: {
    from: envVars.MAIL_USER_FROM,
    host: envVars.MAIL_HOST,
    hostPort: envVars.MAIL_PORT,
    user: envVars.MAIL_USER,
    pass: envVars.MAIL_PASS
  },
  appURL: envVars.APP_URL,
  cron: {
    forgot: envVars.FORGOT_CRON,
    notification: envVars.NOTIFICATION_CRON
  },
  sms: {
    username: envVars.SMS_USERNAME,
    apiKey: envVars.SMS_API_KEY,
    senderId: envVars.SMS_SENDER_ID
  },
  interswitch: {
    env: envVars.INTERSWITCH_ENV,
    gateway: envVars.INTERSWITCH_GATEWAY,
    redirectURL: envVars.INTERSWITCH_REDIRECT_URL,
    requestURL: envVars.INTERSWITCH_REQUEST_URL,
    queryURL: envVars.INTERSWITCH_QUERY_URL,
    baseURL: envVars.INTERSWITCH_BASE_URL,
    clientSecret: envVars.INTERSWITCH_clientSecret,
    clientId: envVars.INTERSWITCH_clientId,
    terminalId: envVars.INTERSWITCH_TERMINAL_ID,
    prefix: envVars.INTERSWITCH_PREFIX,
    commission: parseFloat(envVars.COMMISSION),
    withdrawCommission: parseFloat(envVars.WDRAW_COMMISSION),
  },
  rubie: {
    url: envVars.RUBIE_URL,
    key: envVars.RUBIES_LIVE_SKEY,
    commission: parseFloat(envVars.RUBIES_COMMISSION)
  },
  paystack: {
    url: envVars.PAYSTACK_URL,
    skey: envVars.PAYSTACK_LIVE_SKEY,
    skeyDev: envVars.PAYSTACK_TEST_SKEY,
    pkey: envVars.PAYSTACK_TEST_PKEY
  },
  chat: {
    message: 0,
    audio: 1,
    video: 2,
    payment: 3
  },
};

module.exports = config;
