const Cart = require("../model/user/cartModel");
const Product = require("../model/admin/prodectModel");
const User = require("../model/user/userModel");
const Order = require('../model/user/orderModel')
const Coupon = require('../model/admin/CouponModel')
const{getNextOrderId} = require('../utils/orderUtils')

// Function to get the next unique order ID





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
      return {
        ...item.toObject(),
        total,
      };
    });

    const items = await Cart.find({ user: userId }).populate("product");
    let GrandTotal =0;
    if(cartItems.length >0){
    GrandTotal = items.reduce(
      (acc, curr) => acc + curr.quantity * curr.product.salePrice,
      0
    );
  }
  if (!cartItems || cartItems.length == 0) {
    return res.render("user/cart", {
      cartItems: [],
      message: "Cart is empty",
      GrandTotal,user
    });
  }
    console.log("grand", GrandTotal);
    return res.render("user/cart", { cartItems: itemsWithTotal, GrandTotal,user });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "error" });
  }
};

exports.AddCart = async (req, res) => {
  try {
    // console.log("req,",req.user)
    const userId = req.user.id;
    const { size, productId, quantity } = req.body;
    const requestedQuantity = parseInt(quantity, 10);

    const product = await Product.findById(productId);
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
    // console.log(user);
    const addresses = users.address;
    const cartItem = await Cart.find({ user: userId }).populate("product");
    let totalProduct = 0;
    cartItem.forEach((item) => {
      totalProduct += item.quantity;
    });
    console.log("pro", totalProduct);
    const total = cartItem.reduce(
      (acc, curr) => acc + curr.quantity * curr.product.salePrice,
      0
    );
    console.log("total", total);

    return res.render("user/checkout", { addresses, totalProduct, total ,user,coupons});
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
    const {address,totalToPay} = req.body;
    console.log("add: ",address)
    console.log('PAy: ',totalToPay)
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId }).populate('product');
    console.log(cartItems)
    const user=await User.findById(userId).lean()
    console.log("user:   ",user);
    
    const selectedIndex = user.address.findIndex(addr => addr._id.toString() ===address)

    console.log("seletected: ",selectedIndex);
    const  selectedAddress = user.address[selectedIndex];
    console.log("sesese",selectedAddress);
    

    
    if(!selectedAddress){
      return res.status(400).json({ success: false, message: 'Invalid address selected' });
    }
    
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items in cart" });
    }

    let totalAmount = 0;
    let totalQuantity = 0;
    const products = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      const sizeStock = product.sizes.find(s => s.size === item.size);
      if (!sizeStock || sizeStock.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `${product.ProductName} (${item.size}) has insufficient stock. Only ${sizeStock ? sizeStock.stock : 0} left.` 
        });
      }

      // Add to total amount and quantity if stock is sufficient
      totalAmount += item.quantity * product.salePrice;
      totalQuantity += item.quantity;
      products.push({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        price: product.salePrice
      });
    }

    const orderId = await getNextOrderId();

    // Proceed with placing order
    const newOrder = new Order({
      user: userId,
      oid: orderId,
      products: products,
      totalAmount:totalToPay ,
      
      status: 'Processing',
      totalQuantity: totalQuantity,
      address: {
        fullName:selectedAddress.fullName,
        addressLine1:selectedAddress.addressLine1,
        addressLine2:selectedAddress.addressLine2,
        phone: selectedAddress.phone,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        addType: selectedAddress.addType
      }
    });
    await newOrder.save();

    // Update stock levels
    for (const item of products) {
      const product = await Product.findById(item.product);
      const sizeStock = product.sizes.find(s => s.size === item.size);
      if (sizeStock) {
        sizeStock.stock -= item.quantity;
      }
      await product.save();
    }

    // Clear cart after order
    await Cart.deleteMany({ user: userId });
    res.json({ success: true, message: 'Order placed successfully!' });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Something went wrong!' });
  }
};
