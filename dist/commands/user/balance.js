'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _discord = require('discord.js');

var _discord2 = _interopRequireDefault(_discord);

var _steem = require('steem');

var _steem2 = _interopRequireDefault(_steem);

var _discord3 = require('discord.js-commando');

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class BalanceCommand extends _discord3.Command {
  constructor(client) {
    super(client, {
      name: 'balance',
      group: 'user',
      memberName: 'balance',
      description: 'Shows the current balance of a user',
      examples: ['balance reazuliqbal'],
      throttling: {
        usages: 2,
        duration: 10
      },
      args: [{
        key: 'user',
        label: 'STEEM USER',
        prompt: 'Please enter a valid STEEM username.',
        type: 'string',
        default: _config2.default.STEEM_ACCOUNT
      }],
      argsPromptLimit: 0
    });
  }

  async run(message, { user }) {
    return _steem2.default.api.getAccountsAsync([user]).then(([result]) => {
      if (result === undefined) {
        message.reply('We could not find this user on STEEM Blockchain.');
      } else {
        const richEmbed = new _discord2.default.RichEmbed().setTitle('User Balance').setColor(0x00AE86).addField('Username', result.name, true).addField('STEEM', result.balance, true).addField('SBD', result.sbd_balance, true);

        message.channel.send(richEmbed);
      }
    }).catch(err => console.log(err));
  }
}
exports.default = BalanceCommand;