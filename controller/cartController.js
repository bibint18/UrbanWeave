const Cart = require("../model/user/cartModel");
const Product = require("../model/admin/prodectModel");
const User = require("../model/user/userModel");
const Order = require('../model/user/orderModel')
exports.getCart = async (req, res) => {
  try {
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
      GrandTotal
    });
  }
    console.log("grand", GrandTotal);
    return res.render("user/cart", { cartItems: itemsWithTotal, GrandTotal });
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

    const sizeStock = await product.sizes.find((s) => s.size === size);
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
    sizeStock.stock -= requestedQuantity;
    await product.save();

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
    const userId = req.user.id;
    console.log("usr: ", userId);
    const user = await User.findById(userId);
    // console.log(user);
    const addresses = user.address;
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

    return res.render("user/checkout", { addresses, totalProduct, total });
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

exports.placeOrder = async (req,res) => {
  try {
    const address = req.body;
    console.log("add: ",address)

    const userId = req.user._id
    console.log(userId);
    const user = await User.findById(userId)
    console.log("user: ",user);
    // const selectedAddress = user.address.id(address)
    // const selectedAddress = user.address.find((addr) => addr._id.toString() === address);
    // const selectedAddress = await User.findOne({"address._id":address},{"address.$":1})
    // console.log("whole: ",selectedAddress);
    
    const cartItems = await Cart.find({user:userId}).populate('product')
    if(cartItems.length ==0){
      return res.status(400).json({success:false,message:"No items in cart"})
    }
    let totalAmount=0;
    const products = cartItems.map((item) =>{
      totalAmount += item.quantity * item.product.salePrice;
      return{
        product:item.product._id,
        quantity:item.quantity,
        size:item.size,
        price:item.product.salePrice
      }
    })
    const newOrder = new Order({
      user:userId,
      products:products,
      totalAmount:totalAmount,
      address:req.body.address,
      status:'Processing'
    })
    console.log("ors: ",newOrder);
    
    await newOrder.save()
    console.log("saved: ",newOrder);

    await Cart.deleteMany({user:userId})
    res.json({ success: true, message: 'Order placed successfully!' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'something went wrong!'});
  }
}