'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _discord = require('discord.js');

var _discord2 = _interopRequireDefault(_discord);

var _discord3 = require('discord.js-commando');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ServersCommand extends _discord3.Command {
  constructor(client) {
    super(client, {
      name: 'servers',
      group: 'admin',
      memberName: 'servers',
      description: 'Generate a list of servers which are using the bot.',
      examples: ['servers'],
      throttling: {
        usages: 2,
        duration: 10
      },
      ownerOnly: true
    });
  }

  async run(message) {
    const server = [];
    const owner = [];
    const ownerId = [];

    await message.client.guilds.forEach(guild => {
      server.push(guild.name);
      owner.push(guild.owner.user.username);
      ownerId.push(guild.owner.id);
    });

    const richEmbed = new _discord2.default.RichEmbed().setTitle('List of Guilds').setColor(0x00AE86).addField('Server', server.join('\n'), true).addField('Owner', owner.join('\n'), true).addField('Owner ID', ownerId.join('\n'), true);

    return message.channel.send(richEmbed);
  }
}
exports.default = ServersCommand;