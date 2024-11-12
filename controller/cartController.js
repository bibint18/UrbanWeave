const Cart = require("../model/user/cartModel");
const Product = require("../model/admin/prodectModel");
const User = require("../model/user/userModel");
const Order = require('../model/user/orderModel')
const Coupon = require('../model/admin/CouponModel')
const CategoryOffer = require('../model/admin/CategoryOfferModel')
const{getNextOrderId} = require('../utils/orderUtils')

exports.getCart = async (req, res) => {
  try {
    const user = req.user
    console.log("cartuser: ",user);
    
    const userId = req.user.id;
    const cartItems = await Cart.find({ user: userId })
      .populate("product")
      .exec();
   
    const itemsWithTotal = cartItems.map((item) => {
      const total = item.quantity * item.product.salePrice;
      // const MFTotal = item.quantity * item.product.regularPrice
      return {
        ...item.toObject(),
        total,
        
      };
    });
    const items = await Cart.find({ user: userId }).populate("product");
    let GrandTotal =0;
    let MFtotal =0
    if(cartItems.length >0){
    GrandTotal = items.reduce(
      (acc, curr) => acc + curr.quantity * curr.product.salePrice,
      0
    );
    MFtotal = items.reduce((acc,curr) => acc + curr.quantity * curr.product.regularPrice,0)
  }
  if (!cartItems || cartItems.length == 0) {
    return res.render("user/cart", {
      cartItems: [],
      message: "Cart is empty",
      GrandTotal,user,MFtotal
    });
  }
    return res.render("user/cart", { cartItems: itemsWithTotal, GrandTotal,user ,MFtotal});
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "error" });
  }
};

exports.AddCart = async (req, res) => {
  try {
    // console.log("req,",req.user)
    console.log("inside add cart: ")
    const userId = req.user.id;
    const { size, productId, quantity } = req.body;
    const requestedQuantity = parseInt(quantity, 10);
    console.log("proId : ",productId)
    const product = await Product.findById(productId);
    console.log(product)
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "product not found" });
    }

    const sizeStock = product.sizes.find((s) => s.size === size);
    if (!sizeStock) {
      return res
        .status(400)
        .json({ success: false, message: "size not found" });
    }
    if (requestedQuantity > sizeStock.stock) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock available" });
    }
    if (requestedQuantity > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum quantity is 5" });
    }

    let cartItem = await Cart.findOne({
      user: userId,
      product: productId,
      size: size,
    });
    if (cartItem) {
      // cartItem.quantity += parseInt(quantity,10)
      const newQuantity = cartItem.quantity + requestedQuantity;
      if (newQuantity > sizeStock.stock || newQuantity > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Exceeds stock or max limit" });
      }
      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      cartItem = new Cart({
        user: userId,
        product: productId,
        quantity: parseInt(quantity, 10),
        size: size,
        
      });
      await cartItem.save();
    }
    // sizeStock.stock -= requestedQuantity;
    // await product.save();

    return res.status(200).json({ success: true, message: "added" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: "error" });
  }
};


exports.UpdateQuantity = async(req,res) => {
  try {
    const { cartId, productId, size, newQuantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const sizeStock = product.sizes.find(s => s.size === size);
    if (!sizeStock || newQuantity > sizeStock.stock) {
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }
    if (newQuantity > 5) {
      return res.status(400).json({ success: false, message: 'Maximum quantity is 5' });
    }

    let cartItem = await Cart.findById(cartId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    cartItem.quantity = newQuantity;
    await cartItem.save();

    res.status(200).json({ success: true, message: 'Quantity updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

exports.deleteCart = async (req, res) => {
  try {
    const id = req.params.id;
    const deleteItem = await Cart.findByIdAndDelete(id);
    if (!deleteItem) {
      console.log("no item");
      return res
        .status(400)
        .json({ success: false, message: "item not found" });
    }
    return res.status(200).json({ success: true, message: "deleted" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error });
  }
};

exports.getCheckout = async (req, res) => {
  try {
    const user = req.user
    const userId = req.user.id;
    console.log("usr: ", userId);
    const users = await User.findById(userId);
    const coupons = await Coupon.find()
    const addresses = users.address;
    const cartItem = await Cart.find({ user: userId }).populate("product");
    let totalProduct = 0;
    cartItem.forEach((item) => {
      totalProduct += item.quantity;
    });
    const RegularTotal = cartItem.reduce(
      (acc, curr) => acc + curr.quantity * curr.product.salePrice,
      0
    );
    const total = cartItem.reduce(
      (acc, curr) => acc + curr.quantity * curr.product.salePrice,
      0
    );
    
    let totalOfferAmount =0
      let discountedTotalAmount =0
      let totalAmount=0
      let finalPrice=0
      let saved=0
    for(const items of cartItem){
      const product = items.product;
      console.log("product: ",product)
      const salePrice =product.salePrice
      console.log("salePrice: ",salePrice)
      const quantity = items.quantity
      const categoryOffer = await CategoryOffer.findOne({
        category:product.category._id,
        isActive:true,
        startDate:{$lte:new Date()},
        endDate:{$gte: new Date()}
      })
      // let discountAmount =0;
      let categoryDiscountAmount=0;
      let productDiscountAmount =0
      console.log("category offer: ",categoryOffer)
      // if(categoryOffer){
      //   discountAmount = salePrice * (categoryOffer.discountPercentage / 100)
      //   console.log("discountedAmpunt: ",discountAmount)
      //   totalOfferAmount += discountAmount * quantity
      //   console.log("totalOfferAmoiunt: ",totalOfferAmount)
      // }
      if(categoryOffer){
        categoryDiscountAmount = salePrice *(categoryOffer.discountPercentage / 100)
        console.log("categoryDiscountAmount: ", categoryDiscountAmount);
      }
      if(product.productOffer){
        productDiscountAmount = salePrice * (product.productOffer / 100)
        console.log("productDiscountAmount: ", productDiscountAmount);
      }
      let discountAmount = Math.max(categoryDiscountAmount, productDiscountAmount);
      console.log("Chosen discountAmount: ", discountAmount);
      totalOfferAmount += discountAmount * quantity;
      finalPrice = salePrice - discountAmount;
      console.log('finalPrice: ',finalPrice)
      // totalAmount += salePrice * quantity;
      // console.log('totalAmount: ',totalAmount)
      discountedTotalAmount += finalPrice * quantity
      console.log("discountedTotalAmouny: ",discountedTotalAmount)
    }
    console.log('finalPrice: ',finalPrice)
    console.log("discountedTotalAmount: ",totalOfferAmount)
    console.log('totalAmount: ',totalAmount)
    // console.log("finalPrie: ",saved);
    const OriginalTotal = cartItem.reduce((acc,curr) => acc + curr.quantity * curr.product.regularPrice,0)
    console.log(OriginalTotal)
    saved =(OriginalTotal - discountedTotalAmount).toFixed(2)
    console.log("saved: ",saved)
    return res.render("user/checkout", { addresses, totalProduct,total:discountedTotalAmount ,user,coupons,OriginalTotal,OfferAmount:totalOfferAmount,saved,RegularTotal});
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error });
  }
};

exports.getAddAddress = async (req, res) => {
  try {
    const addresses = await User.findById(req.user.id);
    // console.log("rendering ", addresses);
    res.render("user/checkoutAddAddress", { addresses });
  } catch (error) {
    console.log(error);
    return res.status(400).json({success:false,message:error})
  }
};

exports.checkoutAddAddress = async (req, res) => {
  try {
    // console.log(req.user);
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addType,
    } = req.body;
    const user = await User.findById(req.user.id);
    const newAddress = {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addType,
    };
    user.address.push(newAddress);
    await user.save();
    return res.redirect("/checkout");
  } catch (err) {
    console.log(err);
  }
};

exports.getEditAddress = async (req,res) => {
  try {
    const id = req.query.id
    const userAddress = await User.findOne({"address._id":id},{"address.$":1})
    const user =userAddress.address[0]
    // console.log("aaddress:",user)
    res.render('user/checkoutEditAddress',{address:user})
  } catch (error) {
    console.log(error)
  }
}

exports.editAddress =async (req,res) => {
  try {
    console.log("req:",req.query)
     const id = req.query.id
     console.log(id,"got from edit")
  const {fullName,phone,addressLine1,addressLine2,city,state,postalCode,country,addType} = req.body
     console.log("post from body: ",fullName,phone,addressLine1,addressLine2,city,state,postalCode,country,addType)
    const updatedAddress = await  User.findOneAndUpdate({"address._id":id},
      {
        $set: {
          "address.$.fullName": fullName,
          "address.$.phone": phone,
          "address.$.addressLine1": addressLine1,
          "address.$.addressLine2": addressLine2,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.postalCode": postalCode,
          "address.$.country": country,
          "address.$.addType": addType,
        },
      },
      { new: true },
    )
    console.log("updated",updatedAddress)
    // res.send("done")
    return res.redirect('/checkout')
} catch (error) {
  console.log(error)
  res.send(error)
}
}




exports.placeOrder = async (req, res) => {
  try {
    const {address,totalToPay,PayMethod,DiscountAmount,Subtotal,CouponCode,OriginalTotal,CatOffer,Quantity} = req.body;
    let categoryOfferWhole = Number(CatOffer)
    let originalTotal = Number(OriginalTotal)
    let totalQuantity = Number(Quantity)
    console.log("from here",Quantity,typeof(Quantity))
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId }).populate('product');
    console.log(cartItems)
    const user=await User.findById(userId).lean()
    const selectedIndex = user.address.findIndex(addr => addr._id.toString() ===address)
    const  selectedAddress = user.address[selectedIndex];
    if(!selectedAddress){
      return res.status(400).json({ success: false, message: 'Invalid address selected' });
    }
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items in cart" });
    }
    const products = [];
    
    for (const item of cartItems) {
      let categoryOfferAmount=0
      const productz = item.product;
      const salePrice =productz.salePrice
      const quantity = item.quantity
      // let categoryOffer = await CategoryOffer.findOne({
      //   category:productz.category._id,
      //   isActive:true,
      //   startDate:{$lte:new Date()},
      //   endDate:{$gte: new Date()}
      // })
      const categoryOffer = await CategoryOffer.findOne({
        category:productz.category._id,
        isActive:true,
        startDate:{$lte:new Date()},
        endDate:{$gte: new Date()}
      })
      if(categoryOffer){
        categoryOfferAmount = salePrice * (categoryOffer.discountPercentage / 100)
      }
      const product = await Product.findById(item.product._id);
      const sizeStock = product.sizes.find(s => s.size === item.size);
      if (!sizeStock || sizeStock.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `${product.ProductName} (${item.size}) has insufficient stock. Only ${sizeStock ? sizeStock.stock : 0} left.` 
        });
      }
      products.push({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        price: product.salePrice,
        categoryOffer: categoryOfferAmount.toFixed(2)
      });
      console.log("till here");
      // totalPrice += product.salePrice * product.quantity;
      // console.log("totalPrice: ",totalPrice)
      // discountTotalAmount += finalPrice * product.quantity
    }
    // const productzz = await 
    // console.log("finallyy : ",discountTotalAmount);
    // console.log(OriginalTotal)
    
    const orderId = await getNextOrderId();
    const newOrder = new Order({
      user: userId,
      oid: orderId,
      products: products,
      totalAmount:Subtotal ,
      status: 'Processing',
      totalQuantity: totalQuantity,  //backend
      PaymentMethod:PayMethod,     
      CouponDiscount:DiscountAmount,
      AmountPaid:totalToPay,
      OriginalTotal:originalTotal,
      usedCoupons:CouponCode,
      CategoryOffer: categoryOfferWhole,
      address: {
        fullName:selectedAddress.fullName,
        addressLine1:selectedAddress.addressLine1,
        addressLine2:selectedAddress.addressLine2,
        phone: selectedAddress.phone,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        addType: selectedAddress.addType,
      }
    });
    await newOrder.save();
    const coupon = await Coupon.findOne({code:CouponCode})
    if(coupon){
      const user = await User.findById(userId);
  // Check if the coupon code is already used by the user
  if (!user.usedCoupons.includes(CouponCode)) {
    user.usedCoupons.push(CouponCode);
    await user.save();
    console.log(`Coupon ${CouponCode} added to user's usedCoupons array`);
  } else {
    console.log(`Coupon ${CouponCode} was already used by the user`);
  }
    }
    for (const item of products) {
      const product = await Product.findById(item.product);
      const sizeStock = product.sizes.find(s => s.size === item.size);
      if (sizeStock) {
        sizeStock.stock -= item.quantity;
      }
      await product.save();
    }
    await Cart.deleteMany({ user: userId });
    res.json({ success: true, message: 'Order placed successfully!',orderId : newOrder._id });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Something went wrong!' });
  }
};
