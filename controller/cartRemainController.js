const Cart = require("../model/user/cartModel");
const Product = require("../model/admin/prodectModel");
const User = require("../model/user/userModel");
const Order = require("../model/user/orderModel");
const Coupon = require("../model/admin/CouponModel");
const CategoryOffer = require("../model/admin/CategoryOfferModel");
const Wallet = require("../model/user/WalletModel");
const { getNextOrderId } = require("../utils/orderUtils");

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
      totalQuantity: totalQuantity, 
      PaymentMethod: PayMethod,
      CouponDiscount: 0,
      AmountPaid: TotalToPay,
      OriginalTotal: originalTotal,
      usedCoupons: CouponCode,
      tempCouponAmount: DiscountAmount,
      CategoryOffer: categoryOfferWhole,
      razorpayOrderId: 0,
      OrdOriginalTotal:originalTotal,
      OrdSubTotal:Subtotal,
      OrdCouponDiscount:0,
      OrdOfferAmount:categoryOfferWhole,
      SummaryTotal:totalToPay,
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
      totalQuantity: totalQuantity, 
      PaymentMethod: PayMethod,
      CouponDiscount: DiscountAmount,
      AmountPaid: TotalToPay,
      OriginalTotal: originalTotal,
      usedCoupons: CouponCode,
      tempCouponAmount: 0,
      CategoryOffer: categoryOfferWhole,
      OrdOriginalTotal:originalTotal,
      OrdSubTotal:Subtotal,
      OrdCouponDiscount:DiscountAmount,
      OrdOfferAmount:categoryOfferWhole,
      SummaryTotal:totalToPay,
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
