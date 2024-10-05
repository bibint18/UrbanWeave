const express= require('express')
const adminRoute = require('../controller/adminController');
const categoryRoute = require("../controller/category")
const productRoute = require("../controller/productController")
const productManage = require("../middleware/productmanage")
const deletedRoute = require("../controller/deleted")
const router = express.Router();

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
module.exports = router;