const express= require('express')
const adminRoute = require('../controller/adminController');
const router = express.Router();

router.get('/admin-home',adminRoute.getAdminLogin)

module.exports = router;