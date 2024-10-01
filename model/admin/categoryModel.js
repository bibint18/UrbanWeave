const mongoose = require("mongoose")
const CategorySchema = new mongoose.Schema({
  categoryName:{
    type:String,
    required:true,
  },
  description:{
    type:String,
    required:true
  },
  isDeleted:{
    type:Boolean,
    default:false
  },
},{timestamps:true})
module.exports = mongoose.model("category",CategorySchema)