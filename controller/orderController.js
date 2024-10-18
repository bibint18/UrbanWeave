const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')
const Order = require('../model/user/orderModel')
const User = require('../model/user/userModel')

exports.getOrdersPage =async (req,res) => {
  try {
    const userId = req.user._id 
    console.log(userId);
    
    const orders = await Order.find({user:userId}).populate('products.product').exec()
    console.log("or: ",orders);
    return res.render('user/orders',{orders})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:error})
  }
}