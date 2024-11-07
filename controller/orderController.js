const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')
const Order = require('../model/user/orderModel')
const User = require('../model/user/userModel')
const Coupon = require('../model/admin/CouponModel')
const Wallet = require('../model/user/WalletModel')
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
    const user = req.user._id
    const {id,ProId} = req.params
    console.log("idPro ",ProId);
    console.log(id,"id");
    const orders = await Order.findById(id)
    console.log("can: ",orders);
    if(!orders){
      return res.json({success:false,message:"No order"})
    }
    const paid = orders.AmountPaid
    const CouponOffer = orders.CouponDiscount
    const product = orders.products.find(p => p.product.toString() == ProId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found in the order" });
    }
    console.log("products: ",product)
    const quantity = product.quantity
    const salePrice = product.price * quantity
    const couponCode = orders.usedCoupons[0]
    const coupon = await Coupon.findOne({code:couponCode})
    const couponMinimum = coupon.minimum
    console.log("Coooo: ",couponMinimum)
    let reducedTotal = paid - salePrice
    console.log("reduced: ",reducedTotal)
    let wallet = await Wallet.findOne({user:user})
    console.log("wallet: ",wallet)
    if(!wallet){
      wallet = new Wallet({
        user: user,
        balance: 0,
        transactions:[]
      })
      await wallet.save();
    }
    
    if(product.ProductStatus =='Processing' || product.ProductStatus =='Shipped'){
      // product.ProductStatus =  'Cancelled'
      if(reducedTotal < couponMinimum){
        let amountToWallet = salePrice - CouponOffer
        console.log("amountTowallet",amountToWallet)
        wallet.balance += amountToWallet
        await wallet.save()
        orders.totalQuantity -= quantity
        orders.CouponDiscount =0;
        orders.AmountPaid -= amountToWallet
        await orders.save();
    // log('')
      }
      
      else{
        console.log("can be cancelled")
        
    // log('')
      }
      
    // log('')
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

exports.ReturnProduct = async (req,res) => {
  try {
    const {id,ProId} = req.params
    console.log("id: ",id,"Po: ",ProId)

    const orders = await Order.findById(id)
    console.log("can: ",orders); 
    if(!orders){
      return res.json({success:false,message:"No order"})
    } 
    const product = orders.products.find(p => p.product.toString() == ProId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found in the order" });
    }
    if(product.ProductStatus =='Delivered'){
      product.ProductStatus =  'Returned'
      await orders.save()
      return res.status(200).json({success:true,message:"Product Returned"})
    }else{
      return res.status(400).json({success:false,message:" cannot return the Product"})
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({success:false,message:"cant return the product"})
  
  }
}

exports.UpdatePayStatus = async(req,res) => {
  try{
    console.log("inside update")
  const user = req.user._id
  const id = req.params.id
  console.log(id,"from the update")
  const order = await Order.findByIdAndUpdate(id,{paymentStatus:"Paid"})
  return res.status(200).json({success:true,message:"Payment succcessfull"})
  }catch(error){
    console.log(error)
    return res.status(400).json({success:false,message:"error"})
  }
}

