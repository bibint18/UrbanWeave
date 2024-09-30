const express = require('express')
const app = express();
const router = express.Router();
const userRouter = require('../controller/userController')
const authMiddleware= require('../middleware/authMiddleware')
const jwt = require("jsonwebtoken")
router.get('/userLogin',authMiddleware.isLoggedIn,userRouter.getUserLogin)
router.get('/home',authMiddleware.protect,userRouter.getHome)
router.post('/signupSubmit',userRouter.SignToLogin)
router.get('/otp',userRouter.getOtp)
router.post('/otpSubmit',userRouter.otpSubmit)
router.post('/resendOtp',userRouter.resend)
router.post('/userLogin',userRouter.userLogin);
router.post('/logout',userRouter.logout)
// router.post('/forgotPassword',userRouter.forgotPassword)
// router.get('/ResetPassword',userRouter.getPasswordReset)
module.exports = router;
