const express = require('express')
const app = express();
const router = express.Router();
const userRouter = require('../controller/userController')
const authMiddleware= require('../middleware/authMiddleware')
const homePageRoute = require("../controller/homepage")
const jwt = require("jsonwebtoken")
router.get('/userLogin',userRouter.getUserLogin)
router.get('/home',userRouter.getHome)
router.get('/userSignup',userRouter.getUserSignup)
router.post('/signupSubmit',userRouter.SignToLogin)
router.get('/otp',userRouter.getOtp)
router.post('/otpSubmit',userRouter.otpSubmit)
router.post('/resendOtp',userRouter.resend)
router.post('/userLogin',userRouter.userLogin);
router.post('/logout',userRouter.logout)
// router.post('/forgotPassword',userRouter.forgotPassword)
// router.get('/ResetPassword',userRouter.getPasswordReset)
router.get("/products/details/:id",userRouter.getProductDetails)
module.exports = router;
