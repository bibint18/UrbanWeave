const express = require('express')
const app = express();
const router = express.Router();
const userRouter = require('../controller/userController')
const authMiddleware= require('../middleware/authMiddleware')
const homePageRoute = require("../controller/homepage")
const HomeRoute = require('../controller/homeController')
const jwt = require("jsonwebtoken")
const passport = require('passport')
router.get('/userLogin',userRouter.getUserLogin)
router.get('/home',userRouter.getHome)
router.get('/userSignup',userRouter.getUserSignup)
router.post('/signupSubmit',userRouter.SignToLogin)
router.get('/otp',userRouter.getOtp)
router.post('/otpSubmit',userRouter.otpSubmit)
router.post('/resendOtp',userRouter.resend)
router.post('/userLogin',userRouter.userLogin);
router.post('/logout',userRouter.logout)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/userSignup'}),(req,res) =>{
  res.redirect('/home')
})

// router.post('/forgotPassword',userRouter.forgotPassword)
// router.get('/ResetPassword',userRouter.getPasswordReset)
router.get("/products/details/:id",userRouter.getProductDetails)

//inside home

router.get('/shop',HomeRoute.ShopPage)

module.exports = router;
