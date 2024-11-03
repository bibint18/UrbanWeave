const Coupon = require("../model/admin/CouponModel");
const Cart = require("../model/user/cartModel");
const Order = require("../model/user/orderModel");
const User = require("../model/user/userModel");
const jwt = require("jsonwebtoken")

// let sessionCoupons = {};
exports.VerifyCoupon = async (req, res) => {
  const userId = req.user._id;

  const { couponCode, totalAmount } = req.body;
  console.log("from front: ", couponCode, totalAmount);
  // if (sessionCoupons[userId] && sessionCoupons[userId].includes(couponCode)) {
  //   return res.status(400).json({ success: false, message: "Coupon already applied in this session!" });
  // }
  const coupon = await Coupon.findOne({ code: couponCode, status: "active" });
  console.log(coupon);
  if (!coupon) {
    return res.json({ success: false, message: "Invalid or expired coupon." });
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
  );
  console.log(discountAmount, "disco ");

  const newTotal = totalAmount - discountAmount;
  console.log("newtotal: ", newTotal);
  // sessionCoupons[userId] = sessionCoupons[userId] || [];
  // sessionCoupons[userId].push(couponCode);
  // const newToken = generateToken(req.user);
  console.log(req.user)
  return res.status(200).json({
    success: true,
    message: "Coupon applied",
    discountAmount,
    newTotal,
    
  });
};

// const generateToken = (user) => {
//   return jwt.sign(
//     { id: user._id, appliedCoupons: user.appliedCoupons }, // Include appliedCoupons
//     process.env.JWT_SECRET,
//     { expiresIn: '1h' } // Adjust as needed
//   );
// };

// signToken=((user) => {
//   return jwt.sign(
//     {id:user._id,email:user.email},
//     process.env.JWT_SECRET,
//     {expiresIn:'1hr'}
//   )
// })