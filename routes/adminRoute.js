const express= require('express')
const adminRoute = require('../controller/adminController');
const router = express.Router();

router.get('/login',adminRoute.getAdminLogin)
router.get('/dashboard',adminRoute.getDashboard)
router.post('/loginSubmit',adminRoute.loginSubmit)
router.get("/users",adminRoute.ListUsers)
module.exports = router;