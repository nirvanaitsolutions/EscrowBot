'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _discord = require('discord.js-commando');

class InviteCommand extends _discord.Command {
  constructor(client) {
    super(client, {
      name: 'invite',
      group: 'admin',
      memberName: 'invite',
      description: 'Generate invite link for the bot.',
      examples: ['invite'],
      throttling: {
        usages: 2,
        duration: 10
      },
      ownerOnly: true
    });
  }

  async run(message) {
    message.client.generateInvite(['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES']).then(link => message.say(`Share this link to add the the bot in any server: ${link}`)).catch(err => console.log(err));
  }
}
exports.default = InviteCommand;