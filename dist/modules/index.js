'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sc2Sdk = require('sc2-sdk');

var _sc2Sdk2 = _interopRequireDefault(_sc2Sdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const SC2 = _sc2Sdk2.default.Initialize({
  app: 'micro.app'
});

exports.default = SC2;