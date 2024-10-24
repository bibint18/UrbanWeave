const express= require('express')
const adminRoute = require('../controller/adminController');
const categoryRoute = require("../controller/category")
const productRoute = require("../controller/productController")
const productManage = require("../middleware/productmanage")
const deletedRoute = require("../controller/deleted")
const ProduRoute = require('../controller/proController')
const OrderRoute = require('../controller/adminOrder')
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
router.get('/product/unblock',protectAdmin,ProduRoute.unBlockProduct)
router.get('/product/block',protectAdmin,ProduRoute.blockProduct)
router.get('/product/getEdit',protectAdmin,ProduRoute.getEditProduct)
router.post('/product/edit/:id',protectAdmin,upload.array('images',4),ProduRoute.editProducts)
router.post('/product/deleteImage',protectAdmin,ProduRoute.deleteImage)
router.get('/product/search',protectAdmin,ProduRoute.SearchProduct)
//orders page

router.get('/orders',protectAdmin,OrderRoute.getOrderPage)
router.get('/orders/details/:id',protectAdmin,OrderRoute.getOrderDetails)
router.post('/orders/productStatus',protectAdmin,OrderRoute.ChangeOrder)
module.exports = router;