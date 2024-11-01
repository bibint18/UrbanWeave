const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  oid:{
    type: String,
    required: false,
    unique:true
  },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      size: { type: String, required: true },  // Size chosen by user
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, // Price at the time of order,
      ProductStatus:{type:String,required:false,enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled','Returned'],
        default: 'Processing'},
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  totalAfterOffer:{
    type: Number, 
  },
  OfferApplied:{
    type:Number
  },
  totalQuantity:{
    type:Number,
    required:false
  },
  // address: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Address',
  //   required: true
  // },
  address: {
    fullName: { type: String, required: false },
    phone: { type: String, required: false },
    addressLine1: { type: String, required: false },
    addressLine2: { type: String },
    city: { type: String, required: false },
    state: { type: String, required: false },
    postalCode: { type: String, required: false },
    country: { type: String, required: false },
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
