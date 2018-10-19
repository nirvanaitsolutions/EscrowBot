'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _steem = require('steem');

var _steem2 = _interopRequireDefault(_steem);

var _discord = require('discord.js-commando');

var _models = require('../../models');

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AgentReleaseCommand extends _discord.Command {
  constructor(client) {
    super(client, {
      name: 'agent-release',
      group: 'exchange',
      memberName: 'agent-release',
      description: 'Release escrowed fund to specific user after dispute.',
      examples: ['agent-release 33899032 @reazuliqbal#1149'],
      throttling: {
        usages: 2,
        duration: 10
      },
      args: [{
        key: 'escrowId',
        label: 'Escrow ID',
        prompt: 'Please enter your escrow ID.',
        type: 'integer',
        parse: escrowid => escrowid.trim()
      }, {
        key: 'beneficiary',
        label: 'RECEIVER',
        prompt: 'Please mention the user you are releasing funds to.',
        type: 'member'
      }],
      argsPromptLimit: 0
    });
  }

  hasPermission(message) {
    if (!message.member.roles.some(role => [_config2.default.HANDLER_ROLE].includes(role.name))) {
      return 'you do not have required permission to use this command!';
    }
    return true;
  }

  async run(message, { escrowId, beneficiary }) {
    const trx = await _models.Transaction.findOne({ escrowId }).populate('buyer seller', 'username');

    const releaseTo = await _models.User.findOne({ discordId: beneficiary.user.id });

    if (!trx) {
      return message.reply('We could not find this transaction.');
    }

    if (trx.serverId !== message.guild.id) {
      return message.reply('You can not release transaction initiated from another server.');
    }

    if (![trx.buyer.username, trx.seller.username].includes(releaseTo.username)) {
      return message.say('You can not release to this user.');
    }

    return _steem2.default.api.getEscrowAsync(trx.seller.username, escrowId).then(async result => {
      if (result === null) {
        return message.reply('We could not find this transaction.');
      }

      if (!result.disputed) {
        return message.reply('This transaction was not disputed, hence can not be released.');
      }

      return _steem2.default.broadcast.escrowReleaseAsync(_config2.default.ACTIVE_KEY, result.from, result.to, _config2.default.STEEM_ACCOUNT, _config2.default.STEEM_ACCOUNT, releaseTo.username, parseInt(escrowId, 10), result.sbd_balance, result.steem_balance).then(async () => {
        await _models.Transaction.updateTrx(trx._id, { completed: true });

        message.channel.send(`Escrowed funds has been release to ${beneficiary} (${releaseTo.username})`);
      }).catch(err => console.log(err));
    }).catch(err => console.log(err));
  }
}
exports.default = AgentReleaseCommand;