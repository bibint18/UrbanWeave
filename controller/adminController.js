const Admin = require('../model/admin/adminModel')

exports.getAdminLogin = (req,res) => {
  res.render('admin/admin-login')
}