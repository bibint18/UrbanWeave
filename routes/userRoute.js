const express = require('express')
const app = express();
const router = express.Router();
const userRouter = require('../controller/userController')
const authMiddleware= require('../middleware/authMiddleware')
// const homePageRoute = require("../controller/homepage")
const HomeRoute = require('../controller/homeController')
const CartRoute = require('../controller/cartController')
const OrderRoute = require('../controller/orderController')
const WishRoute = require('../controller/wishlistController')
const jwt = require("jsonwebtoken")
const passport = require('passport')


const {protect} = require('../middleware/authMiddleware')
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

//userProfile

router.get('/userProfile',authMiddleware.protect,HomeRoute.userProfile)
router.post('/userProfile',authMiddleware.protect,HomeRoute.EditUserProfile)
router.get('/address',authMiddleware.protect,HomeRoute.userAddress)
router.get('/manageAddress',authMiddleware.protect,HomeRoute.manageAddress)
router.post('/address/add',authMiddleware.protect,HomeRoute.addAddress)
router.get('/address/edit',authMiddleware.protect,HomeRoute.getEditAddress)
router.post('/address/edit',authMiddleware.protect,HomeRoute.editAddress)
router.post('/address/delete',authMiddleware.protect,HomeRoute.deleteAddress)

//cart

router.get('/cart',authMiddleware.protect,CartRoute.getCart)
router.post('/cart/add',authMiddleware.protect,CartRoute.AddCart)
router.delete('/cart/delete/:id',authMiddleware.protect,CartRoute.deleteCart)
//checkout
router.get('/checkout',authMiddleware.protect,CartRoute.getCheckout)
router.get('/checkout/address',authMiddleware.protect,CartRoute.getAddAddress)
router.post('/checkout/address',authMiddleware.protect,CartRoute.checkoutAddAddress)
router.get('/checkout/address/edit',authMiddleware.protect,CartRoute.getEditAddress)
router.post('/checkout/address/edit',authMiddleware.protect,CartRoute.editAddress)
router.post('/placeOrder',authMiddleware.protect,CartRoute.placeOrder)
//orders
router.get('/orders',authMiddleware.protect,OrderRoute.getOrdersPage)
router.post('/order/cancel/:id/:ProId',authMiddleware.protect,OrderRoute.cancelOrder)
router.post('/orders/return/:id/:ProId',authMiddleware.protect,OrderRoute.ReturnProduct)
//wishlist 
router.get('/wishlist',authMiddleware.protect,WishRoute.getWishlist)
router.post("/wishlist/add",authMiddleware.protect,WishRoute.addWishlist)
router.post('/wishlist/remove/:id',authMiddleware.protect,WishRoute.removeWishlist)
module.exports = router;
