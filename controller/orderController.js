const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')
const Order = require('../model/user/orderModel')
const User = require('../model/user/userModel')

exports.getOrdersPage =async (req,res) => {
  try {
    const userId = req.user._id 
    console.log(userId);
    const {sort} =req.query
    console.log("query: ",sort);
    let sortOptions ={};
    switch(sort){
      case "Processing":
        sortOptions={Status:'Processing'}
        break;
      case 'Shipped':
        sortOptions={status:'Shipped'}
        break;
      case  'Delivered':
        sortOptions={status:'Delivered'}
        break;
      case 'Cancelled':
        sortOptions={status:'Cancelled'}
        break;
      default:
        sortOptions={};
    }
    const orders = await Order.find({user:userId,...sortOptions}).populate('products.product').exec()
    console.log("or: ",orders);
    return res.render('user/orders',{orders,sort})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:error})
  }
}

exports.cancelOrder =async (req,res) => {
  try {
    const id = req.params.id
    console.log(id,"id");
    const orders = await Order.findById(id)
    console.log("can: ",orders);
    
    if(orders.status =='Processing' || orders.status =='Shipped'){
      orders.status =  'Cancelled'
      await orders.save()
      
      return res.json({success:true,message:"order cancelled succesfully",orderId:id})
    }else{
      return res.json({success:false,message:"cant cancel  the order"})
    }
    
  } catch (error) {
    console.log(error);
    return res.status(400).json({success:false,message:error})
    
  }
}