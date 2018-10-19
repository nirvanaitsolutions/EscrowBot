'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _steem = require('steem');

var _steem2 = _interopRequireDefault(_steem);

var _discord = require('discord.js-commando');

var _bitly = require('bitly');

var _models = require('../../models');

var _modules = require('../../modules');

var _modules2 = _interopRequireDefault(_modules);

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const bitly = new _bitly.BitlyClient(_config2.default.BITLY_TOKEN, {});

class ReleaseCommand extends _discord.Command {
  constructor(client) {
    super(client, {
      name: 'release',
      group: 'exchange',
      memberName: 'release',
      description: 'Generate SteemConnect link for releasing escrow.',
      examples: ['release 33899032'],
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
      return message.say('You can not release this transaction.');
    }

    return _steem2.default.api.getEscrowAsync(trx.seller.username, escrowId).then(async result => {
      if (result === null) {
        return message.reply('We could not find this transaction.');
      }

      let releaseTo = '';

      if (user.username === result.from) {
        releaseTo = result.to;
      } else {
        releaseTo = result.from;
      }

      await _models.Transaction.updateTrx(trx._id, { completed: true });

      // Generating SteemConnect hot sign link
      let signUrl = _modules2.default.sign('escrow_release', {
        from: result.from,
        to: result.to,
        agent: _config2.default.STEEM_ACCOUNT,
        who: user.username,
        receiver: releaseTo,
        escrow_id: escrowId,
        sbd_amount: result.sbd_balance,
        steem_amount: result.steem_balance
      }, '');

      signUrl = await bitly.shorten(signUrl);

      return message.channel.send(`You are about to release escrowed balance for transaction ID: **${escrowId}**. Please click this ${signUrl.url} to release the fund to **${releaseTo}**`);
    }).catch(err => console.error(err));
  }
}
exports.default = ReleaseCommand;