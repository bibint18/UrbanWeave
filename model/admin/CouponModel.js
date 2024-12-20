const mongoose = require('mongoose')

const CouponSchema = new mongoose.Schema({
  code:{
    type:String,
    required:true,
    unique:true
  },
  startDate:{
    type:Date,
    required:true,
  },
  endDate:{
    type:Date,
    required:true,
  },
  minimum:{
    type:Number,
    required:true
  },
  maximum:{
    type:Number,
    required:true
  },
  discount:{
    type:Number,
    required:true 
  },
  maximumDiscount:{
    type:Number, 
  },
  status:{
    type:String,
    enum: ["active", "inactive"],
    default:"active"
  },
  isDeleted:{
    type:Boolean,
    default:false
  }
})

module.exports = mongoose.model('Coupon',CouponSchema)