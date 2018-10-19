'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _steem = require('steem');

var _steem2 = _interopRequireDefault(_steem);

var _discord = require('discord.js');

var _discord2 = _interopRequireDefault(_discord);

var _discord3 = require('discord.js-commando');

var _bitly = require('bitly');

var _modules = require('../../modules');

var _modules2 = _interopRequireDefault(_modules);

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

var _models = require('../../models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const bitly = new _bitly.BitlyClient(_config2.default.BITLY_TOKEN, {});

class DisputeCommand extends _discord3.Command {
  constructor(client) {
    super(client, {
      name: 'dispute',
      group: 'exchange',
      memberName: 'dispute',
      description: 'Generate SteemConnect link for disputing transaction.',
      examples: ['dispute 33899032'],
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
      }],
      argsPromptLimit: 0
    });
  }

  hasPermission(message) {
    if (!message.member.roles.some(role => [_config2.default.USER_ROLE].includes(role.name))) {
      return 'Please register to use this command.';
    }
    return true;
  }

  async run(message, { escrowId }) {
    const trx = await _models.Transaction.findOne({ escrowId }).populate('buyer seller', 'username');

    const user = await _models.User.findOne({ discordId: message.author.id });

    if (!trx) {
      return message.reply('We could not find this transaction.');
    }

    if (![trx.buyer.username, trx.seller.username].includes(user.username)) {
      return message.say('You can not dispute this transaction.');
    }

    return _steem2.default.api.getEscrowAsync(trx.seller.username, escrowId).then(async result => {
      if (result === null) {
        return message.reply('We could not find this transaction.');
      }

      if (result.disputed) return message.reply('This transaction has already been disputed.');

      // Generating SteemConnect hot sign link
      let signUrl = _modules2.default.sign('escrow_dispute', {
        from: trx.seller.username,
        to: trx.buyer.username,
        agent: _config2.default.STEEM_ACCOUNT,
        who: user.username,
        escrow_id: escrowId
      }, '');

      signUrl = await bitly.shorten(signUrl);

      await _models.Transaction.updateTrx(trx._id, { disputed: true });

      const richEmbed = new _discord2.default.RichEmbed().setTitle('Transaction Status').setColor(0x00AE86).addField('Escrow ID', result.escrow_id, true).addField('STEEM', result.steem_balance, true).addField('SBD', result.sbd_balance, true).addField('Sender', result.from, true).addField('Receiver', result.to, true).addBlankField(true).addField('Deadline', result.ratification_deadline, true).addField('Expiration', result.escrow_expiration, true).addBlankField(true).addField('Receiver Approved', result.to_approved ? 'Yes' : 'No', true).addField('Agent Approved', result.agent_approved ? 'Yes' : 'No', true).addField('Disputed', result.disputed ? 'Yes' : 'No', true);

      return message.channel.send(`To dispute please hot sign the transaction on SteemConnect ${signUrl.url}.`, richEmbed);
    }).catch(err => console.error(err));
  }
}
exports.default = DisputeCommand;