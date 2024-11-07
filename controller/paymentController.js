// paymentController.js
const Order = require('../model/user/orderModel')
const Razorpay = require('razorpay');
require('dotenv').config()
// Initialize Razorpay with API credentials
const razorpay = new Razorpay({
  key_id: process.env.YOUR_KEY_ID,
  
  key_secret: process.env.YOUR_KEY_SECRET ,
});



exports.createOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const options = {
      amount: amount * 100 , // 
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`, 
      payment_capture: 1 
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id ,amount:amount,key: process.env.YOUR_KEY_ID });
    console.log("passed")
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: 'Something went wrong in creating the order' });
  }
};

exports.verifyPayment = async(req, res) => {
  try{
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature ,orderId} = req.body;
  console.log(razorpay_order_id, razorpay_payment_id, razorpay_signature ,orderId)
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", process.env.YOUR_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");
  console.log("gene: ",generatedSignature)

  if (generatedSignature === razorpay_signature) {
    // await Order.findByIdAndUpdate(orderId, { status: "Processing", PaymentMethod: "ONLINE PAYMENT (RAZORPAY)" });
    res.json({success:true,message: "Payment verified successfully"});
  } else {
    res.status(400).json({ success:false, message: "Payment verification failed" });
  }
}catch(error){
  console.log(error)
  return res.status(400).json({success:false,message:"Payment Failed"})
}
};


exports.retry = async (req, res) => {
  try{
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  console.log(order)
  if (!order) {
      return res.status(404).json({ error: "Order not found" });
  }
  const razorpayOrder = await razorpay.orders.create({
      amount: order.AmountPaid * 100,
      currency: "INR",
      receipt: `retry_order_${order._id}`
  });
  res.json({
      orderId: razorpayOrder.id,
      amount: order.AmountPaid,
      key: process.env.YOUR_KEY_ID
  });
}catch(error){
  console.log(error)
}
};