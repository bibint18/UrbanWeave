// paymentController.js
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
      amount: amount , // Convert amount to the smallest currency unit (e.g., paise for INR)
      currency: currency || 'INR',
      receipt: 'order_rcptid_11', // Unique receipt ID for the order
      payment_capture: 1 // Automatic capture
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id ,amount:amount});
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: 'Something went wrong in creating the order' });
  }
};

exports.verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const crypto = require("crypto");

  const hmac = crypto.createHmac("sha256", "YOUR_KEY_SECRET");
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    res.json({ status: "success" });
  } else {
    res.status(400).json({ status: "failure", message: "Payment verification failed" });
  }
};
