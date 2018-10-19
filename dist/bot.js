'use strict';

var _discord = require('discord.js-commando');

var _discord2 = _interopRequireDefault(_discord);

var _steem = require('steem');

var _steem2 = _interopRequireDefault(_steem);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _commandoProviderMongo = require('commando-provider-mongo');

var _commandoProviderMongo2 = _interopRequireDefault(_commandoProviderMongo);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _models = require('./models');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// MongoDB connection
_mongoose2.default.connect(process.env.MONGODB);

// Get Mongoose to use the global promise library
_mongoose2.default.Promise = global.Promise;

// Initializing Discord Commando client
const client = new _discord2.default.Client({
  owner: _config2.default.OWNER_ID,
  commandPrefix: _config2.default.COMMAND_PREFIX,
  disableEveryone: true,
  unknownCommandResponse: false,
  commandEditableDuration: 0,
  nonCommandEditable: false
});

// Finding and auto approving transaction
async function manageTrxs() {
  const uncompleted = await _models.Transaction.getUncompleted().populate('seller', 'username');

  if (uncompleted.length > 0) {
    uncompleted.forEach(trx => {
      _steem2.default.api.getEscrow(trx.seller.username, trx.escrowId, async (err, result) => {
        if (!err) {
          if (result !== null) {
            if (result.to_approved && !result.agent_approved) {
              // Agent approving escrow
              await _steem2.default.broadcast.escrowApproveAsync(_config2.default.ACTIVE_KEY, result.from, result.to, _config2.default.STEEM_ACCOUNT, _config2.default.STEEM_ACCOUNT, trx.escrowId, true);
            }

            // Updating transaction status on database
            await _models.Transaction.updateTrx(trx._id, {
              initiated: true,
              buyerApproved: result.to_approved,
              agentApproved: result.agent_approved,
              disputed: result.disputed
            });
          }
        } else {
          console.log(err);
        }
      });
    });
  }
}

setInterval(manageTrxs, 60000); // Running every minute

// Setting bot's settings provider to MongoDB
client.setProvider(_mongoose2.default.connection.then(db => new _commandoProviderMongo2.default(db))).catch(console.error);

// Registering all commands
client.registry.registerGroups([['exchange', 'STEEM/SBD exchange related commands'], ['user', 'User management related commands'], ['admin', 'Administrative commands']]).registerDefaults().registerCommandsIn(_path2.default.join(__dirname, 'commands'));

client.on('ready', () => {
  console.log(`${new Date()}: ${client.user.username} bot is ready.`);
});

// When bot is added to a new server
client.on('guildCreate', guild => {
  // Creating user role if not found
  if (!guild.roles.find('name', _config2.default.USER_ROLE)) {
    guild.createRole({
      name: _config2.default.USER_ROLE,
      mentionable: true
    }).catch(e => console.log(e));
  }

  // Creating handler role if not found
  if (!guild.roles.find('name', _config2.default.HANDLER_ROLE)) {
    guild.createRole({
      name: _config2.default.HANDLER_ROLE,
      mentionable: true
    }).then(role => {
      guild.owner.addRole(role);
    }).catch(e => console.log(e));
  }
});

client.login(_config2.default.BOT_TOKEN);