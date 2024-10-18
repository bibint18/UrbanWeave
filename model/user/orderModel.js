const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      size: { type: String, required: true },  // Size chosen by user
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, // Price at the time of order
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  // address: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Address',
  //   required: true
  // },
  address: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    addType: { type: String, enum: ['office', 'home'], required: false }
  },
  
  status: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing'
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
