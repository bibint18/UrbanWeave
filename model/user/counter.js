const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  sequenceValue: { type: Number, default: 10000 } // Starting value for order ID
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;