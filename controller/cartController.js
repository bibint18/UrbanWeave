const Cart = require("../model/user/cartModel");
const Product = require("../model/admin/prodectModel");
const User = require("../model/user/userModel");
const Order = require("../model/user/orderModel");
const Coupon = require("../model/admin/CouponModel");
const CategoryOffer = require("../model/admin/CategoryOfferModel");
const Wallet = require("../model/user/WalletModel");
const { getNextOrderId } = require("../utils/orderUtils");

exports.getCart = async (req, res) => {
  try {
    const user = req.user;
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
    let GrandTotal = 0;
    let MFtotal = 0;
    if (cartItems.length > 0) {
      GrandTotal = items.reduce(
        (acc, curr) => acc + curr.quantity * curr.product.salePrice,
        0
      );
      MFtotal = items.reduce(
        (acc, curr) => acc + curr.quantity * curr.product.regularPrice,
        0
      );
    }
    if (!cartItems || cartItems.length == 0) {
      return res.render("user/cart", {
        cartItems: [],
        message: "Cart is empty",
        GrandTotal,
        user,
        MFtotal,
      });
    }
    return res.render("user/cart", {
      cartItems: itemsWithTotal,
      GrandTotal,
      user,
      MFtotal,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "error" });
  }
};

exports.AddCart = async (req, res) => {
  try {
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
    return res.status(200).json({ success: true, message: "added" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: "error" });
  }
};

exports.UpdateQuantity = async (req, res) => {
  try {
    const { cartId, productId, size, newQuantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const sizeStock = product.sizes.find((s) => s.size === size);
    if (!sizeStock || newQuantity > sizeStock.stock) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock available" });
    }
    if (newQuantity > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum quantity is 5" });
    }
    let cartItem = await Cart.findById(cartId);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }
    cartItem.quantity = newQuantity;
    await cartItem.save();
    res.status(200).json({ success: true, message: "Quantity updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    const id = req.params.id;
    const deleteItem = await Cart.findByIdAndDelete(id);
    if (!deleteItem) {
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
    const user = req.user;
    const userId = req.user.id;
    const users = await User.findById(userId);
    const coupons = await Coupon.find({ endDate: { $gte: new Date() },isDeleted:false });
    const addresses = users.address;
    const wallet = await Wallet.findOne({ user: userId });
    const walletBalance = wallet ? wallet.balance :0;
    const cartItem = await Cart.find({ user: userId }).populate("product");
    let totalProduct = 0;
    let deliveryFee = 40;
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

    let totalOfferAmount = 0;
    let discountedTotalAmount = 0;
    let totalAmount = 0;
    let finalPrice = 0;
    let saved = 0;
    for (const items of cartItem) {
      const product = items.product;
      const salePrice = product.salePrice;
      const quantity = items.quantity;
      const categoryOffer = await CategoryOffer.findOne({
        category: product.category._id,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });
      let categoryDiscountAmount = 0;
      let productDiscountAmount = 0;
      if (categoryOffer) {
        categoryDiscountAmount =
          salePrice * (categoryOffer.discountPercentage / 100);
      }
      if (product.productOffer) {
        productDiscountAmount = salePrice * (product.productOffer / 100);
      }
      let discountAmount = Math.max(
        categoryDiscountAmount,
        productDiscountAmount
      );
      totalOfferAmount += discountAmount * quantity;
      finalPrice = salePrice - discountAmount;
      discountedTotalAmount += finalPrice * quantity;
    }
    discountedTotalAmount += deliveryFee;
    const OriginalTotal = cartItem.reduce(
      (acc, curr) => acc + curr.quantity * curr.product.regularPrice,
      0
    );
    saved = (OriginalTotal - discountedTotalAmount).toFixed(2);
    return res.render("user/checkout", {
      addresses,
      totalProduct,
      total: discountedTotalAmount,
      user,
      coupons,
      OriginalTotal,
      OfferAmount: totalOfferAmount,
      saved,
      RegularTotal,
      deliveryFee,
      walletBalance,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error });
  }
};

exports.getAddAddress = async (req, res) => {
  try {
    const addresses = await User.findById(req.user.id);
    res.render("user/checkoutAddaddress", { addresses });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error });
  }
};

exports.checkoutAddAddress = async (req, res) => {
  try {
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

exports.getEditAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const userAddress = await User.findOne(
      { "address._id": id },
      { "address.$": 1 }
    );
    const user = userAddress.address[0];
    res.render("user/checkoutEditAddress", { address: user });
  } catch (error) {
    console.log(error);
  }
};

exports.editAddress = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id, "got from edit");
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

    const updatedAddress = await User.findOneAndUpdate(
      { "address._id": id },
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
      { new: true }
    );
    return res.redirect("/checkout");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};
