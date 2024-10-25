const Order = require('../model/user/orderModel')
const Product= require('../model/admin/prodectModel')
const { loginSubmit } = require('./adminController')

exports.getOrderPage = async (req,res) => {
  try {
    
    const page =  req.query.page || 1
    const limit = 7
    const skip =  (page -1 )* limit
    const  orders = await Order.find().populate('products.product').populate('user').skip(skip).limit(limit)

const totalOrder = await Order.countDocuments()
const totalPages = Math.ceil(totalOrder / limit)
     return res.render('admin/orderListing',{orders,currentPage:page,totalPages})
    
    // statusCounts: {
    //   processing: totalProcessing,
    //   shipped: totalShipped,
    //   delivered: totalDelivered,
    //   cancelled: totalCancelled,
    //   returned: totalReturned,
    // }})
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
  let {productId ,newStatus,orderId,size} = req.body
  console.log("ids got: ",productId,newStatus,size);
  const order = await Order.findById(orderId)
  console.log('order: ',order);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  const product = order.products.find(p => p.product.toString() === productId && p.size ===size);
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


exports.CancelProduct = async (req,res) => {
  try{
  const {OrderID,ProductID,ProductSize} = req.body
  console.log('frrrrrr: ',OrderID,ProductID,ProductSize)
  const order = await Order.findById(OrderID)
  console.log("order: ",order);
  if(!order){
    return res.status(404).json({success:false,message:'Order not found'})
  }
  const product = order.products.find(p => p.product.toString() === ProductID && p.size ===ProductSize)
  console.log("prooo: ",product);
  
  if(product){
    if(product.ProductStatus =='Delivered' || product.ProductStatus == 'Returned'  ){
      return res.status(400).json({success:false,message:'Product is not allowed to Cancel'})
    }
    if(product.ProductStatus =='Cancelled'){
      return res.status(400).json({success:false,message:'Product already cancelled'})
    }
    if(product.ProductStatus =='Processing' || product.ProductStatus =='Shipped' ){
      product.ProductStatus =  'Cancelled' 
      await order.save()
  }
}
let total = Order.find({"products.Productstatus":'Processing'}).count()
  console.log(total);
  res.status(200).json({success:true,message:" Product cancelled"})
  }catch(error){
    console.log(error);
    return res.status(400).json({success:false,message:error})
  }
  let TotalCancel = 0;
  let TotalDelivered = 0;
  let TotalReturned = 0;
  let TotalShipped = 0;
  let TotalProcessing = 0;
  
  
}