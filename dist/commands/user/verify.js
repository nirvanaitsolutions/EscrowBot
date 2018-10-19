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

class VerifyCommand extends _discord.Command {
  constructor(client) {
    super(client, {
      name: 'verify',
      group: 'user',
      memberName: 'verify',
      description: 'Verify user registration.',
      examples: ['verify reazuliqbal'],
      throttling: {
        usages: 2,
        duration: 10
      },
      guildOnly: true,
      args: [{
        key: 'username',
        label: 'STEEM USERNAME',
        prompt: 'Please enter your STEEM username.',
        type: 'string'
      }],
      argsPromptLimit: 0
    });
  }

  async run(message, { username }) {
    const user = await _models.User.findOne({ discordId: message.author.id, username });

    if (!user) {
      message.reply('Your account is not linked to any STEEM account.');
    } else if (user.verified) {
      // Verified and adding role
      const registerdRole = message.guild.roles.find('name', _config2.default.USER_ROLE);
      if (registerdRole) {
        message.member.addRole(registerdRole);
      }

      message.reply('Your are already a verified user.');
    } else {
      const history = await _steem2.default.api.getAccountHistoryAsync(username, -1, 100);

      // Checking if the user sent micro transfer with correct memo
      if (history.some(res => res[1].op[0] === 'transfer' && res[1].op[1].to === _config2.default.STEEM_ACCOUNT && res[1].op[1].memo.trim() === user.code)) {
        await _models.User.updateOne({ discordId: message.author.id }, { $set: { verified: true } }).then(() => {
          // Giving role
          const registerdRole = message.guild.roles.find('name', _config2.default.USER_ROLE);
          if (registerdRole) {
            message.member.addRole(registerdRole);
          }

          message.reply('Your registration has been successful.');
        }).catch(err => console.log(err));
      } else {
        message.reply('We could not verify your registration at this moment.');
      }
    }
  }
}
exports.default = VerifyCommand;