'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _steem = require('steem');

var _steem2 = _interopRequireDefault(_steem);

var _generate = require('nanoid/generate');

var _generate2 = _interopRequireDefault(_generate);

var _discord = require('discord.js-commando');

var _models = require('../../models');

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

class RegisterCommand extends _discord.Command {
  constructor(client) {
    super(client, {
      name: 'register',
      group: 'user',
      memberName: 'register',
      description: 'Registers new user.',
      examples: ['register reazuliqbal'],
      throttling: {
        usages: 2,
        duration: 10
      },
      guildOnly: true,
      args: [{
        key: 'username',
        label: 'STEEM USERNAME',
        prompt: 'Please enter your STEEM username.',
        type: 'string',
        validate: async user => {
          const [account] = await _steem2.default.api.getAccountsAsync([user]);

          if (account === undefined) {
            return false;
          }
          return true;
        }
      }],
      argsPromptLimit: 0
    });
  }

  async run(message, { username }) {
    const user = await _models.User.findOne({ discordId: message.author.id });

    if (!user) {
      // User not found so must be a new user
      // Generating verification code
      const code = (0, _generate2.default)(alphabet, 16);

      // Inserting user data to database
      await _models.User.create({
        discordId: message.author.id,
        serverId: message.guild.id,
        username,
        code
      }).then(() => {
        message.channel.send(`To register **${username}** with <@${message.author.id}>, please send 0.001 SBD to **\`${_config2.default.STEEM_ACCOUNT}\`** with **\`${code}\`** as memo. After transferring please type \`${_config2.default.COMMAND_PREFIX}verify ${username}\` to verify your registration.`);
      }).catch(err => console.log(err));
    } else if (user.username !== username && !user.verified) {
      // New username also not verified
      const code = (0, _generate2.default)(alphabet, 16);

      // Update username and new verification code
      _models.User.updateOne({ discordId: message.author.id }, { $set: { username, code } }).then(() => {
        message.channel.send(`To register **${username}** with <@${message.author.id}>, please send 0.001 SBD to **\`${_config2.default.STEEM_ACCOUNT}\`** with **\`${code}\`** as memo. After transferring please type \`${_config2.default.COMMAND_PREFIX}verify ${username}\` to verify your registration.`);
      }).catch(err => console.log(err.message));
    } else if (!user.verified) {
      // Registared but not verified
      message.reply(`To confirm your registration please send 0.001 SBD to **\`${_config2.default.STEEM_ACCOUNT}\`** with **\`${user.code}\`** as memo from **${user.username}**. After transferring please type \`${_config2.default.COMMAND_PREFIX}verify ${user.username}\` to verify your registration.`);
    } else {
      // Finding role and adding role to registered user
      const registerdRole = message.guild.roles.find('name', _config2.default.USER_ROLE);
      if (registerdRole) {
        message.member.addRole(registerdRole);
      }

      message.reply(`You are already registered with **${user.username}**.`);
    }
  }
}
exports.default = RegisterCommand;