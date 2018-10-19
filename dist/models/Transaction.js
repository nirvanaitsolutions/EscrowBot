'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TransactionSchema = new _mongoose2.default.Schema({
  escrowId: Number,
  seller: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'user' },
  buyer: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'user' },
  serverId: String,
  amount: Number,
  currency: String,
  buyerApproved: {
    type: Boolean,
    default: false
  },
  agentApproved: {
    type: Boolean,
    default: false
  },
  disputed: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  initiated: {
    type: Boolean,
    default: false
  },
  ratificationDeadline: Date,
  escrowExpiration: Date
}, { timestamps: true });

TransactionSchema.statics = {
  getUncompleted() {
    return this.find({ completed: false, disputed: false });
  },

  getUninitiated() {
    return this.find({ completed: false, disputed: false, initiated: false });
  },

  updateTrx(trxId, data) {
    return this.updateOne({ _id: trxId }, { $set: data }).exec();
  }
};

const Transaction = _mongoose2.default.model('transaction', TransactionSchema);

exports.default = Transaction;