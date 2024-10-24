const Order = require('../model/user/orderModel')
const Product= require('../model/admin/prodectModel')
const { loginSubmit } = require('./adminController')

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
    // console.log("dt:",id);
    
    const orders = await Order.findById(id).populate('products.product').populate('user')
    // console.log(orders);
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

exports.ChangeOrder = async (req,res) => {
  try{
  // const {orderId} = req.params
  // console.log("id:  ",orderId);
  let {productId ,newStatus,orderId} = req.body
  console.log("ids got: ",productId,newStatus);
  const order = await Order.findById(orderId)
  console.log('order: ',order);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  const product = order.products.find(p => p.product.toString() === productId);
  if (product) {
    product.ProductStatus = newStatus;

    // If all products are cancelled, cancel the whole order
    const allCancelled = order.products.every(p => p.ProductStatus === 'Cancelled');
    if (allCancelled) {
      order.status = 'Cancelled';
    }

    await order.save();
    return res.json({ success: true, message: 'Product status updated' });
  } else {
    return res.status(404).json({ success: false, message: 'Product not found in order' });
  }
}catch(error){
  console.log(error);
  return res.send(error)
  
}
}