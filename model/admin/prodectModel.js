const mongoose = require("mongoose")
const { validate } = require("./adminModel")
const categoryModel = require("./categoryModel")
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  brand: {
    type: String,
    required: true, 
  },
  images:{
    type:[String],
    required:true,
    validate:[arrayLimit,'{PATH} must have at least 3 images']
  },
  stock: {
    type: Number,
    required: false,
  },
  category:{
    type:mongoose.Schema.Types.ObjectId,
    ref:categoryModel,
    required:true
  },
  isDeleted:{
    type:Boolean,
    required:false
  }
},{timestamps:true})
function arrayLimit(val){
  return val.length>=3
}
module.exports = mongoose.model("products",ProductSchema)