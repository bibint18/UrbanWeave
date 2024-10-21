const Order = require('../model/user/orderModel')
const Product= require('../model/admin/prodectModel')

exports.getOrderPage = async (req,res) => {
  try {
    const  orders = await Order.find().populate('products.product')
    console.log(orders);
    
    return res.render('admin/orderManage',{orders})
  } catch (error) {
    console.log(error); 
   return res.send(error) 
  }
}