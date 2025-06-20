const express= require('express')
const adminRoute = require('../controller/adminController');
const categoryRoute = require("../controller/category")
const productRoute = require("../controller/productController")
const productManage = require("../middleware/productmanage")
const deletedRoute = require("../controller/deleted")
const ProduRoute = require('../controller/proController')
const OrderRoute = require('../controller/adminOrder')
const CouponRoute = require('../controller/couponController')
const OfferRoute = require('../controller/AdminOfferController')
const SalesRoute = require('../controller/SalesController')
const router = express.Router();
const  multer = require('multer');
const storage = require('../helpers/multer')
const  upload = multer({ storage: storage })

const { protectAdmin } = require('../middleware/authMiddleware');
const {AdminLoggedIn} = require('../middleware/authMiddleware')


router.get('/login',AdminLoggedIn,adminRoute.getAdminLogin)
router.get('/dashboard',protectAdmin, adminRoute.getDashboard)
router.post('/loginSubmit',adminRoute.loginSubmit)
router.post('/logout',protectAdmin,adminRoute.logout)
//user management
router.get("/users",protectAdmin,adminRoute.ListUsers)
router.patch("/user/block/:id",protectAdmin,adminRoute.blockUser)
router.patch("/user/unblock/:id",protectAdmin,adminRoute.unblockUser)
router.get("/user/search",protectAdmin,adminRoute.searchUser)
// category managament
router.get("/category",protectAdmin,categoryRoute.listCategory)
router.post('/category/add',protectAdmin,categoryRoute.AddCategory)
router.delete('/category/delete/:id',protectAdmin,categoryRoute.deleteCategory)
router.get("/category/deletedCategories",protectAdmin,categoryRoute.deletedCategories)
router.patch("/category/revert/:id",protectAdmin,categoryRoute.revert)
// router.patch("/category/edit/:id",categoryRoute.editcategory)
router.post("/category/edit/:id",protectAdmin, categoryRoute.editcategory)
//product management
// router.get("/products",protectAdmin,productRoute.getProducts) 
// router.post("/products/add",protectAdmin,productManage.upload,productRoute.addProduct)
// router.delete('/products/delete/:id',protectAdmin,productRoute.deleteProduct)
// router.post("/products/edit/:id",protectAdmin,productRoute.editProduct)
//deleted section
router.get("/deletedHome",protectAdmin,deletedRoute.getHome)
//product section
router.get('/getAddProduct',protectAdmin,ProduRoute.getAddProduct)
router.post('/product/add',protectAdmin,upload.array('images',4),ProduRoute.AddProduct)
router.get('/product',protectAdmin,ProduRoute.ListProducts)
router.post('/product/offer/add',protectAdmin,ProduRoute.AddProductOffer)
router.post('/product/offer/remove',protectAdmin,ProduRoute.RemoveProductOffer)
router.post('/product/unblock',protectAdmin,ProduRoute.unBlockProduct)
router.post('/product/block',protectAdmin,ProduRoute.blockProduct)
router.get('/product/getEdit',protectAdmin,ProduRoute.getEditProduct)
router.post('/product/edit/:id',protectAdmin,upload.array('images',4),ProduRoute.editProducts)
router.post('/product/deleteImage',protectAdmin,ProduRoute.deleteImage)
router.get('/product/search',protectAdmin,ProduRoute.SearchProduct)
//orders page

router.get('/orders',protectAdmin,OrderRoute.getOrderPage)
router.get('/orders/details/:id',protectAdmin,OrderRoute.getOrderDetails)
router.post('/orders/productStatus',protectAdmin,OrderRoute.ChangeOrder)
router.post('/orders/paymentStatus',protectAdmin,OrderRoute.ChangePayStatus)
router.post('/orders/cancelProduct',protectAdmin,OrderRoute.CancelProduct)
//coupons
router.get('/coupons',protectAdmin,CouponRoute.getCoupons)
router.post('/coupon/edit/:id',protectAdmin,CouponRoute.editCoupon)
router.get('/coupons/edit/:id',protectAdmin,CouponRoute.getEditCoupon)
router.post('/coupons/add',protectAdmin,CouponRoute.AddCoupon)
router.post('/coupon/delete/:id',protectAdmin,CouponRoute.CouponDelete)
//offers
router.get('/offers',protectAdmin,OfferRoute.ListCategoryOffer)
router.post('/offers/add',protectAdmin,OfferRoute.AddCategoryOffer)
router.post('/offer/delete/:id',protectAdmin,OfferRoute.deleteCatOffer)
router.get('/offers/edit/:id',protectAdmin,OfferRoute.getEditCatOffer)
router.post('/offers/edit/:id',protectAdmin,OfferRoute.EditOffer)
//sales
router.get('/sales-report',protectAdmin,SalesRoute.fetchReport)
router.get('/topProduct',protectAdmin,SalesRoute.getTopProducts)
router.get('/topCategory',protectAdmin,SalesRoute.getTopCategory)
module.exports = router;