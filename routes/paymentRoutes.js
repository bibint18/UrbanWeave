const express = require("express")
const app = express()
const router = express.Router()
const paymentController = require('../controller/paymentController')

router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);

module.exports=router