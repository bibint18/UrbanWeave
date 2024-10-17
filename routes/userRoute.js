const express = require('express')
const app = express();
const router = express.Router();
const userRouter = require('../controller/userController')
const authMiddleware= require('../middleware/authMiddleware')
const homePageRoute = require("../controller/homepage")
const HomeRoute = require('../controller/homeController')
const CartRoute = require('../controller/cartController')
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


// Example of revoking access token from Google
// app.get('/revoke', (req, res) => {
//   const accessToken = req.user.accessToken; // Assuming you saved access token
//   const revokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`;

//   axios.post(revokeUrl)
//     .then(() => {
//       req.logout();
//       res.redirect('/');
//     })
//     .catch(err => {
//       console.error(err);
//       res.status(500).send('Error revoking token');
//     });
// });

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
module.exports = router;
