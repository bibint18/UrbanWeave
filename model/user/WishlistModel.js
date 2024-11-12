const mongoose = require('mongoose')

const WishlistSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
    required: true
  },
  Product :{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Product',
    required:true
  },
  size:{
    type:String,
    required:false
  }
})

module.exports = mongoose.model("Wishlist",WishlistSchema)