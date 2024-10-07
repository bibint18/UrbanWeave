const express= require('express')
const adminRoute = require('../controller/adminController');
const categoryRoute = require("../controller/category")
const productRoute = require("../controller/productController")
const productManage = require("../middleware/productmanage")
const deletedRoute = require("../controller/deleted")
const ProduRoute = require('../controller/proController')
const router = express.Router();
const  multer = require('multer');
const storage = require('../helpers/multer')
const  upload = multer({ storage: storage })

router.get('/login',adminRoute.getAdminLogin)
router.get('/dashboard',adminRoute.getDashboard)
router.post('/loginSubmit',adminRoute.loginSubmit)
router.get('/logout',adminRoute.logout)
//user management
router.get("/users",adminRoute.ListUsers)
router.patch("/user/block/:id",adminRoute.blockUser)
router.patch("/user/unblock/:id",adminRoute.unblockUser)
router.get("/user/search",adminRoute.searchUser)
// category managament
router.get("/category",categoryRoute.listCategory)
router.post('/category/add',categoryRoute.AddCategory)
router.delete('/category/delete/:id',categoryRoute.deleteCategory)
router.get("/category/deletedCategories",categoryRoute.deletedCategories)
router.patch("/category/revert/:id",categoryRoute.revert)
// router.patch("/category/edit/:id",categoryRoute.editcategory)
router.post("/category/edit/:id",categoryRoute.editcategory)
//product management
router.get("/products",productRoute.getProducts)
router.post("/products/add",productManage.upload,productRoute.addProduct)
router.delete('/products/delete/:id',productRoute.deleteProduct)
router.post("/products/edit/:id",productRoute.editProduct)
//deleted section
router.get("/deletedHome",deletedRoute.getHome)
//product section
router.get('/getAddProduct',ProduRoute.getAddProduct)
router.post('/product/add',upload.array('images',4),ProduRoute.AddProduct)
router.get('/product',ProduRoute.ListProducts)
router.post('/product/offer/add',ProduRoute.AddProductOffer)
router.post('/product/offer/remove',ProduRoute.RemoveProductOffer)
router.get('/product/unblock',ProduRoute.unBlockProduct)
router.get('/product/block',ProduRoute.blockProduct)
router.get('/product/getEdit',ProduRoute.getEditProduct)
router.post('/product/edit/:id',upload.array('images',4),ProduRoute.editProducts)
router.post('/product/deleteImage',ProduRoute.deleteImage)
module.exports = router;