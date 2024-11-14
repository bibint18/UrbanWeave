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
const CouponRoute = require('../controller/UserCouponController')
const WalletRoute = require('../controller/walletController')
// const paymentController = require('../controller/paymentController')
const jwt = require("jsonwebtoken")
const passport = require('passport')


const {protect} = require('../middleware/authMiddleware')
//RAZORPAY


//
router.get('/payment',userRouter.getPayment)
router.get('/userLogin',userRouter.getUserLogin)
router.get('/home',userRouter.getHome)
router.get('/userSignup',userRouter.getUserSignup)
router.post('/signupSubmit',userRouter.SignToLogin)
router.get('/otp',userRouter.getOtp)
router.post('/otpSubmit',userRouter.otpSubmit)
router.post('/resendOtp',userRouter.resend)
router.post('/userLogin',userRouter.userLogin);
router.post('/logout',userRouter.logout)
router.get('/forgot-password',userRouter.getForgotpassword)
router.get('/reset-password/:token',userRouter.getResetpassword)
router.post('/forgot-password',userRouter.forgot)
router.post('/reset-password/:token',userRouter.Reset)
// router.get('/auth/google',passport.authenticate('google',{scope:['profile','email'],prompt:"select_account"}))
router.get('/auth/google', (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/home');
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/userSignup'}),(req,res) =>{
  res.redirect('/home')
})
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
router.post('/cart/update-quantity',authMiddleware.protect,CartRoute.UpdateQuantity)
//checkout
router.get('/checkout',authMiddleware.protect,CartRoute.getCheckout)
router.get('/checkout/address',authMiddleware.protect,CartRoute.getAddAddress)
router.post('/checkout/address',authMiddleware.protect,CartRoute.checkoutAddAddress)
router.get('/checkout/address/edit',authMiddleware.protect,CartRoute.getEditAddress)
router.post('/checkout/address/edit',authMiddleware.protect,CartRoute.editAddress)
router.post('/placeOrder',authMiddleware.protect,CartRoute.placeOrder)
router.post('/placeOrderCOD',authMiddleware.protect,CartRoute.placeOrderCOD)
//orders
router.get('/orders',authMiddleware.protect,OrderRoute.getOrdersPage)
router.post('/order/cancel/:id/:ProId',authMiddleware.protect,OrderRoute.cancelOrder)
router.post('/orders/return/:id/:ProId',authMiddleware.protect,OrderRoute.ReturnProduct)
router.post('/payment/update/:id',authMiddleware.protect,OrderRoute.UpdatePayStatus)
router.get('/order/:id/invoice',authMiddleware.protect,OrderRoute.Invoice)
router.post('/orders/razorpay/:id',authMiddleware.protect,OrderRoute.UpdateRazOrderId)
//wishlist 
router.get('/wishlist',authMiddleware.protect,WishRoute.getWishlist)
router.post("/wishlist/add",authMiddleware.protect,WishRoute.addWishlist)
router.post('/wishlist/remove/:id',authMiddleware.protect,WishRoute.removeWishlist)
//coupon
router.post('/verifyCoupon',authMiddleware.protect,CouponRoute.VerifyCoupon)
//wallet
router.get('/wallet',authMiddleware.protect,WalletRoute.loadWallet)
router.post('/wallet/add',authMiddleware.protect,WalletRoute.AddMoney)
module.exports = router;
