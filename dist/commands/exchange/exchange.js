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

var _models = require('../../models');

var _modules = require('../../modules');

var _modules2 = _interopRequireDefault(_modules);

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const bitly = new _bitly.BitlyClient(_config2.default.BITLY_TOKEN, {});

class ExchangeCommand extends _discord3.Command {
  constructor(client) {
    super(client, {
      name: 'exchange',
      group: 'exchange',
      memberName: 'exchange',
      description: 'Generate SteemConnect link for escrow transaction',
      examples: ['exchange 10 STEEM @reazuliqbal#1149'],
      throttling: {
        usages: 2,
        duration: 10
      },
      guildOnly: true,
      args: [{
        key: 'amount',
        label: 'AMOUNT',
        prompt: 'Please enter the amount you want to exchange.',
        type: 'float',
        min: _config2.default.MIN_AMOUNT
      }, {
        key: 'currency',
        label: 'STEEM or SBD',
        prompt: 'Please enter a currency, can be SBD or STEEM.',
        type: 'string',
        parse: symbols => symbols.toUpperCase()
      }, {
        key: 'beneficiary',
        label: 'RECEIVER',
        prompt: 'Please mention the user who will receive the fund.',
        type: 'member'
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

  async run(message, { amount, currency, beneficiary }) {
    const chainProps = await _steem2.default.api.getDynamicGlobalPropertiesAsync();
    const chainTime = new Date(`${chainProps.time}Z`);
    const ratificationDeadline = new Date(chainTime.getTime() + 86400 * 1000 * 1);
    const escrowExpiration = new Date(chainTime.getTime() + 86400 * 1000 * 30);

    const escrowId = parseInt(Math.random() * (99999999 - 10000000) + 10000000, 10);
    let sbdAmount = '0.000 SBD';
    let steemAmount = '0.000 STEEM';

    if (currency === 'SBD') {
      sbdAmount = `${parseFloat(amount).toFixed(3)} SBD`;
    } else {
      steemAmount = `${parseFloat(amount).toFixed(3)} STEEM`;
    }

    const jsonMeta = {
      app: message.client.user.username
    };

    await _models.User.findParties(message.author.id, beneficiary.user.id).then(async result => {
      if (!result.seller || !result.buyer) {
        return message.reply('There was an error. We could not find at least one of you in our database.');
      }

      // Determining and formating fee based on configuration
      const fee = `${parseFloat(amount * _config2.default.ESCROW_FEE).toFixed(3)} ${currency}`;

      // Generating SteemConnect hot sign link for initiating escrow
      let signUrl = _modules2.default.sign('escrow_transfer', {
        from: result.seller.username,
        to: result.buyer.username,
        agent: _config2.default.STEEM_ACCOUNT,
        escrow_id: escrowId,
        sbd_amount: sbdAmount,
        steem_amount: steemAmount,
        fee,
        ratification_deadline: ratificationDeadline.toISOString().slice(0, -5),
        escrow_expiration: escrowExpiration.toISOString().slice(0, -5),
        json_meta: JSON.stringify(jsonMeta)
      }, '');

      signUrl = await bitly.shorten(signUrl);

      // Generating SteemConnect hot sign link for approving escrow
      let approveUrl = _modules2.default.sign('escrow_approve', {
        from: result.seller.username,
        to: result.buyer.username,
        agent: _config2.default.STEEM_ACCOUNT,
        who: result.buyer.username,
        escrow_id: escrowId,
        approve: 1
      }, '');

      approveUrl = await bitly.shorten(approveUrl);

      // Saving to internal database
      _models.Transaction.create({
        escrowId,
        seller: result.seller._id,
        buyer: result.buyer._id,
        amount: parseFloat(amount).toFixed(3),
        currency,
        serverId: message.guild.id,
        ratificationDeadline,
        escrowExpiration
      });

      const RichEmbed = new _discord2.default.RichEmbed().setTitle('Escrow Transaction').setColor(0xe74c3c).addField('Escrow ID', escrowId).addField('STEEM', steemAmount, true).addField('SBD', sbdAmount, true).addField('Fee', fee, true).addField('Seller', result.seller.username, true).addField('Buyer', result.buyer.username, true).addBlankField(true).addField('Deadline', ratificationDeadline, true).addField('Expiration', escrowExpiration, true);

      // Sending DM to initiator
      message.author.send(`Please hot sign the transaction on SteemConnect ${signUrl.url}, then type **\`${_config2.default.COMMAND_PREFIX}status ${escrowId}\`**`, RichEmbed.setURL(signUrl.url));

      // Sending DM to receiver
      return beneficiary.send(`Congratulations, You are the benificiary of an escrow transaction. Please type **\`${_config2.default.COMMAND_PREFIX}status ${escrowId}\`** to check and then click ${approveUrl.url} to approve using SteemConnect.`, RichEmbed.setURL(approveUrl.url));
    }).catch(err => console.log(err));
  }
}
exports.default = ExchangeCommand;