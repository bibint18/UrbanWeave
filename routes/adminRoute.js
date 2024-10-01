const express= require('express')
const adminRoute = require('../controller/adminController');
const categoryRoute = require("../controller/category")
const router = express.Router();

router.get('/login',adminRoute.getAdminLogin)
router.get('/dashboard',adminRoute.getDashboard)
router.post('/loginSubmit',adminRoute.loginSubmit)
router.get("/users",adminRoute.ListUsers)
router.patch("/user/block/:id",adminRoute.blockUser)
router.patch("/user/unblock/:id",adminRoute.unblockUser)
router.get("/category",categoryRoute.listCategory)
router.post('/category/add',categoryRoute.AddCategory)
router.patch('/category/delete/:id',categoryRoute.deleteCategory)
router.get("/category/deletedCategories",categoryRoute.deletedCategories)
router.patch("/category/revert/:id",categoryRoute.revert)
// router.patch("/category/edit/:id",categoryRoute.editcategory)
router.post("/category/edit/:id",categoryRoute.editcategory)
module.exports = router;