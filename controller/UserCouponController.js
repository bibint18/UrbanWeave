const Coupon = require("../model/admin/CouponModel");
const Cart = require("../model/user/cartModel");
const Order = require("../model/user/orderModel");
const User = require("../model/user/userModel");
const jwt = require("jsonwebtoken")

// let sessionCoupons = {};
exports.VerifyCoupon = async (req, res) => {
  const userId = req.user._id;

  const { couponCode, totalAmount ,YouSaved} = req.body;
  console.log("from front: ", couponCode, totalAmount,YouSaved);
  let Saved = parseFloat(YouSaved.match(/[\d.]+/)[0]); 
  console.log("saveeeeeeeeeeeeeed: ",Saved)
  const coupon = await Coupon.findOne({ code: couponCode, status: "active" });
  console.log(coupon);

  if (!coupon) {
    return res.json({ success: false, message: "Invalid or expired coupon." });
  }
  if(coupon.endDate < Date.now()){
    return res.json({ success: false, message: "Coupon has expired." });
  }
  const user = await User.findById(userId);
  console.log(user)
  const AlreadyClaimed = await User.findOne({_id:userId,usedCoupons:{$in:[couponCode]}})
  console.log("already: ",AlreadyClaimed);
  
  if(AlreadyClaimed){
    return res.status(400).json({success:false,message:"Coupon aalready claimed once!"})
  }
  const minimumSpend = coupon.minimum;
  if (minimumSpend > totalAmount) {
    return res.json({
      success: false,
      message: `Minimum spend of ₹${minimumSpend} required.`,
    });
  }
  console.log(totalAmount, "totalAmount");
  console.log(coupon.discount, "coupon.discount");
  const discountAmount = Math.min(
    totalAmount * (coupon.discount / 100),
    coupon.maximumDiscount
  ).toFixed(2)
  console.log(discountAmount, "disco ");

  const newTotal = (totalAmount - discountAmount).toFixed(2);
  console.log("newtotal: ", newTotal);
  const AmountSaved = (Saved + parseFloat( discountAmount)).toFixed(2)
  console.log("final savig: ",AmountSaved);
  
  console.log(req.user)
  return res.status(200).json({
    success: true,
    message: "Coupon applied",
    discountAmount,
    newTotal,
    AmountSaved
  });
};

