const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')
const Order = require('../model/user/orderModel')
const User = require('../model/user/userModel')


exports.getOrdersPage =async (req,res) => {
  try {
    const user = req.user
    const userId = req.user._id 
    console.log(userId);
    const {sort} =req.query
    console.log("query: ",sort);
    let sortOptions ={}

    if (sort) {
      // Use $elemMatch to filter orders where any product has the specified ProductStatus
      sortOptions = {
        products: { $elemMatch: { ProductStatus: sort } },
      };
      console.log(sortOptions)
    }
    console.log(sortOptions)
    let orders = await Order.find({user:userId,...sortOptions}).populate('products.product').sort({ orderDate: -1 }) .exec()
    console.log("or: ",orders);

    if (sort) {
       orders = orders.map(order => {
        const filteredProducts = order.products.filter(
          product => product.ProductStatus === sort
        );
        console.log("fill: ",filteredProducts)
        return { ...order.toObject(), products: filteredProducts };
      });
    }
    return res.render('user/orders',{orders,sort,user})
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