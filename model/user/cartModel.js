const mongoose =require('mongoose')
const prodectModel =  require('../../model/admin/prodectModel')
const cartSchema= new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref:'products', required: true },
  size: { type: String, enum: ['S', 'M', 'L', 'XL'], required: true },
  quantity: { type: Number, required: true, min: 1 },
})

module.exports =  mongoose.model('Cart', cartSchema)
