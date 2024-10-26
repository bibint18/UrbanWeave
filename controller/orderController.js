const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')
const Order = require('../model/user/orderModel')
const User = require('../model/user/userModel')


exports.getOrdersPage =async (req,res) => {
  try {
    const user = req.user
    const userId = req.user._id 
    console.log(userId);
    const { sort, page = 1, limit = 3} = req.query;
    const skip = (page - 1) * limit;
    let sortOptions ={}

    if (sort) {
      sortOptions = {
        products: { $elemMatch: { ProductStatus: sort } },
      };
      console.log(sortOptions)
    }
    console.log(sortOptions)
    const totalOrders = await Order.countDocuments({ user: userId, ...sortOptions });
    const totalPages = Math.ceil(totalOrders / limit);
    let orders = await Order.find({user:userId,...sortOptions}).populate('products.product').sort({ orderDate: -1 }).skip(skip).limit(limit).exec()
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
    return res.render('user/orders',{orders,sort,user, currentPage: parseInt(page, 10),
      totalPages,})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:error})
  }
}

exports.cancelOrder =async (req,res) => {
  try {
    const {id,ProId} = req.params
    // const {ProductId} = req.body
    console.log("idPro ",ProId);
    
    console.log(id,"id");
    const orders = await Order.findById(id)
    console.log("can: ",orders);
    if(!orders){
      return res.json({success:false,message:"No order"})
    }
    
    const product = orders.products.find(p => p.product.toString() == ProId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found in the order" });
    }

    if(product.ProductStatus =='Processing' || product.ProductStatus =='Shipped'){
      product.ProductStatus =  'Cancelled'
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

