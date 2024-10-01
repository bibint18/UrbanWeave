const express= require('express')
const adminRoute = require('../controller/adminController');
const router = express.Router();

router.get('/login',adminRoute.getAdminLogin)
router.get('/dashboard',adminRoute.getDashboard)
router.post('/loginSubmit',adminRoute.loginSubmit)
router.get("/users",adminRoute.ListUsers)
router.patch("/user/block/:id",adminRoute.blockUser)
router.patch("/user/unblock/:id",adminRoute.unblockUser)
module.exports = router;