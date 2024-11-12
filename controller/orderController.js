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
    let quantity = product.quantity
    let salePrice = product.price * quantity 
    let couponCode = orders.usedCoupons[0]
    let CatOffer = product.categoryOffer 
    let SaleAfterCat = salePrice - CatOffer
    let couponMinimum =0
    const coupon = await Coupon.findOne({code:couponCode})
    if(coupon){
    couponMinimum = coupon.minimum
    } 
    console.log("Coooo: ",couponMinimum)
    console.log("Catoffer: ",CatOffer)
    console.log("saleaftercat: ",SaleAfterCat)
    let reducedTotal = paid - SaleAfterCat
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
    // log('')
    if(product.ProductStatus =='Processing' || product.ProductStatus =='Shipped'){
      let amountToWallet;
      
      if(reducedTotal < couponMinimum){
        amountToWallet = SaleAfterCat - CouponOffer;
        orders.CouponDiscount = 0
      }else{
        amountToWallet = SaleAfterCat;
      }
      if(orders.paymentStatus ==='Paid'){
      wallet.balance += amountToWallet;
      wallet.transactions.push({
        amount: amountToWallet,
        type: 'credit',
        description: `Wallet credited with ${amountToWallet} rupees for order cancellation.`
      });
      await wallet.save();
    }
      orders.totalQuantity -= quantity;
      orders.AmountPaid -= amountToWallet;
      orders.totalAmount -= salePrice;
      orders.CategoryOffer -=CatOffer
      // product.categoryOffer =0
      product.ProductStatus = 'Cancelled'; 
      await orders.save();
      // await product.save()
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
  const {couponCode}=req.body 
  console.log("CoCo: ",couponCode)
  console.log(id,"from the update")
  const order = await Order.findByIdAndUpdate(id,{paymentStatus:"Paid", $push: { usedCoupons: couponCode } })
  const UserCoupon = await User.findByIdAndUpdate(user,{$push: { usedCoupons: couponCode }},{new:true})
  return res.status(200).json({success:true,message:"Payment succcessfull"})
  }catch(error){
    console.log(error)
    return res.status(400).json({success:false,message:"error"})
  }
}

