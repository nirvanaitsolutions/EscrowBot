'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv2.default.config();

const config = {
  OWNER_ID: '372663611098660864', // Discord user ID of owner
  STEEM_ACCOUNT: process.env.STEEM_ACCOUNT,
  ACTIVE_KEY: process.env.ACTIVE_KEY,
  BOT_TOKEN: process.env.BOT_TOKEN,
  BITLY_TOKEN: process.env.BITLY_TOKEN,
  PROJECT_ROOT: _path2.default.dirname(__dirname),
  COMMAND_PREFIX: '..',
  MIN_AMOUNT: 0.10,
  ESCROW_FEE: 0.01, // In percentage
  USER_ROLE: 'BDX User',
  HANDLER_ROLE: 'Dispute Handler'
};

exports.default = config;