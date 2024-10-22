const Order = require('../model/user/orderModel')
const Product= require('../model/admin/prodectModel')

exports.getOrderPage = async (req,res) => {
  try {
    const  orders = await Order.find().populate('products.product').populate('user')
    return res.render('admin/orderListing',{orders})
  } catch (error) {
    console.log(error); 
   return res.send(error) 
  }
}

exports.getOrderDetails = async (req,res) => {
  try {
    const id = req.params.id
    console.log("dt:",id);
    
    const orders = await Order.findById(id).populate('products.product').populate('user')
    console.log(orders);
    return res.render('admin/orderDetails',{orders})
    
  } catch (error) {
    console.log(error);
    return res.send(error)
  }
}

// exports.getOrderPage = async (req,res) => {
//   try {
//     const  orders = await Order.find().populate('products.product')
//     console.log(orders);
    
//     return res.render('admin/orderListing')
//   } catch (error) {
//     console.log(error); 
//    return res.send(error) 
//   }
// }