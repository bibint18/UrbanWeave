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
    const coupons = await Coupon.find({ endDate: { $gte: new Date() } });
    const addresses = users.address;
    const wallet = await Wallet.findOne({ user: userId });
    const walletBalance = wallet.balance;
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
    res.render("user/checkoutAddAddress", { addresses });
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

exports.placeOrder = async (req, res) => {
  try {
    const {
      address,
      totalToPay,
      PayMethod,
      DiscountAmount,
      Subtotal,
      CouponCode,
      OriginalTotal,
      CatOffer,
      Quantity,
    } = req.body;
    console.log(
      address,
      totalToPay,
      PayMethod,
      DiscountAmount,
      Subtotal,
      CouponCode,
      OriginalTotal,
      CatOffer,
      Quantity
    );
    let TotalToPay = Number(totalToPay);
    if (PayMethod === "ONLINE PAYMENT (RAZORPAY)") {
      TotalToPay += DiscountAmount;
    }
    console.log("tooo: ", TotalToPay);
    let categoryOfferWhole = Number(CatOffer);
    let originalTotal = Number(OriginalTotal);
    let totalQuantity = Number(Quantity);
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId }).populate("product");
    const user = await User.findById(userId).lean();
    const selectedIndex = user.address.findIndex(
      (addr) => addr._id.toString() === address
    );
    const selectedAddress = user.address[selectedIndex];
    if (!selectedAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid address selected" });
    }
    if (cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items in cart" });
    }
    const products = [];
    for (const item of cartItems) {
      let categoryOfferAmount = 0;
      const productz = item.product;
      const salePrice = productz.salePrice;
      const quantity = item.quantity;
      const categoryOffer = await CategoryOffer.findOne({
        category: productz.category._id,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });
      if (categoryOffer) {
        categoryOfferAmount =
          salePrice * (categoryOffer.discountPercentage / 100);
      }
      const product = await Product.findById(item.product._id);
      const sizeStock = product.sizes.find((s) => s.size === item.size);
      if (!sizeStock || sizeStock.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.ProductName} (${
            item.size
          }) has insufficient stock. Only ${
            sizeStock ? sizeStock.stock : 0
          } left.`,
        });
      }
      products.push({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        price: product.salePrice,
        categoryOffer: categoryOfferAmount.toFixed(2),
      });
    }
    const orderId = await getNextOrderId();
    const newOrder = new Order({
      user: userId,
      oid: orderId,
      products: products,
      totalAmount: Subtotal,
      status: "Processing",
      totalQuantity: totalQuantity, //backend
      PaymentMethod: PayMethod,
      CouponDiscount: 0,
      AmountPaid: TotalToPay,
      OriginalTotal: originalTotal,
      usedCoupons: CouponCode,
      tempCouponAmount: DiscountAmount,
      CategoryOffer: categoryOfferWhole,
      razorpayOrderId: 0,
      address: {
        fullName: selectedAddress.fullName,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2,
        phone: selectedAddress.phone,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        addType: selectedAddress.addType,
      },
    });
    await newOrder.save();
    res.json({
      success: true,
      message: "Order placed successfully!",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Something went wrong!" });
  }
};

exports.placeOrderCOD = async (req, res) => {
  try {
    const {
      address,
      totalToPay,
      PayMethod,
      DiscountAmount,
      Subtotal,
      CouponCode,
      OriginalTotal,
      CatOffer,
      Quantity,
    } = req.body;
    console.log(
      address,
      totalToPay,
      PayMethod,
      DiscountAmount,
      Subtotal,
      CouponCode,
      OriginalTotal,
      CatOffer,
      Quantity
    );
    let TotalToPay = Number(totalToPay);
    let categoryOfferWhole = Number(CatOffer);
    let originalTotal = Number(OriginalTotal);
    let totalQuantity = Number(Quantity);
    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    const cartItems = await Cart.find({ user: userId }).populate("product");
    const user = await User.findById(userId).lean();
    const selectedIndex = user.address.findIndex(
      (addr) => addr._id.toString() === address
    );
    const selectedAddress = user.address[selectedIndex];
    console.log("add: ", selectedAddress);
    if (!selectedAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid address selected" });
    }
    if (cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items in cart" });
    }
    const products = [];
    for (const item of cartItems) {
      let categoryOfferAmount = 0;
      const productz = item.product;
      const salePrice = productz.salePrice;
      const quantity = item.quantity;
      const categoryOffer = await CategoryOffer.findOne({
        category: productz.category._id,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });
      if (categoryOffer) {
        categoryOfferAmount =
          salePrice * (categoryOffer.discountPercentage / 100);
      }
      const product = await Product.findById(item.product._id);
      const sizeStock = product.sizes.find((s) => s.size === item.size);
      if (!sizeStock || sizeStock.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.ProductName} (${
            item.size
          }) has insufficient stock. Only ${
            sizeStock ? sizeStock.stock : 0
          } left.`,
        });
      }
      products.push({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        price: product.salePrice,
        categoryOffer: categoryOfferAmount.toFixed(2),
      });
    }
    const orderId = await getNextOrderId();
    const newOrder = new Order({
      user: userId,
      oid: orderId,
      products: products,
      totalAmount: Subtotal,
      status: "Processing",
      totalQuantity: totalQuantity, //backend
      PaymentMethod: PayMethod,
      CouponDiscount: DiscountAmount,
      AmountPaid: TotalToPay,
      OriginalTotal: originalTotal,
      usedCoupons: CouponCode,
      tempCouponAmount: 0,
      CategoryOffer: categoryOfferWhole,
      address: {
        fullName: selectedAddress.fullName,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2,
        phone: selectedAddress.phone,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        addType: selectedAddress.addType,
      },
    });
    if (PayMethod == "WALLET") {
      if (wallet.balance < TotalToPay) {
        return res
          .status(400)
          .json({ success: false, message: "Not enough balance in wallet" });
      }
      wallet.balance -= TotalToPay;
      wallet.transactions.push({
        type: "debit",
        amount: TotalToPay,
        description: `Payment for order ${orderId} debited ${TotalToPay} rs`,
        date: Date.now(),
      });
      await wallet.save();
      newOrder.paymentStatus = "Paid";
      await newOrder.save();
    } else if (PayMethod === "CASH ON DELIVERY") {
      if (TotalToPay > 1000) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Cash on delivery is not available for rs above 1000",
          });
      }
      await newOrder.save();
    }
    const coupon = await Coupon.findOne({ code: CouponCode });
    if (coupon) {
      const user = await User.findById(userId);
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
      const sizeStock = product.sizes.find((s) => s.size === item.size);
      if (sizeStock) {
        sizeStock.stock -= item.quantity;
      }
      await product.save();
    }
    await Cart.deleteMany({ user: userId });
    res.json({
      success: true,
      message: "Order placed successfully!",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Something went wrong!" });
  }
};
