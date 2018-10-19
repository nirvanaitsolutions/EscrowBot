'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const UserSchema = new _mongoose2.default.Schema({
  username: String,
  discordId: {
    type: String,
    unique: true,
    dropDups: true
  },
  serverId: String,
  code: String,
  verified: {
    type: Boolean,
    default: false
  },
  banned: {
    type: Boolean,
    default: false
  },
  transactions: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'transaction' }]
}, { timestamps: true });

UserSchema.statics = {
  // Finding buyer and seller via discord id
  async findParties(seller, buyer) {
    const users = await this.find({
      discordId: { $in: [seller, buyer] },
      verified: true
    });
    return users.reduce((obj, item) => {
      const parties = obj;
      if (item.discordId === seller) {
        parties.seller = item;
      } else {
        parties.buyer = item;
      }
      return parties;
    }, {});
  }
};

const User = _mongoose2.default.model('user', UserSchema);

exports.default = User;