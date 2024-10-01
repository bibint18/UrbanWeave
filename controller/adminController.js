const Admin = require('../model/admin/adminModel')
const User = require("../model/user/userModel")
const bcrypt = require('bcrypt')
exports.getAdminLogin = (req,res) => {
  res.render('admin/admin-login')
}
exports.loginSubmit =async (req,res) => {
  const {email,password} = req.body;
  console.log(email,password)
  const admin = await Admin.findOne({email})
  if(admin && await admin.comparePassword(password)){
    res.redirect('/admin/dashboard')
  }else{
   res.redirect('/admin/login')
  }
}
exports.getDashboard =(req,res) => {
  res.render('admin/dashboard')
}
exports.ListUsers = async (req,res) => {
  try{
    const users = await User.find({})
    res.render('admin/users',{users})
  }catch(err){
    console.log(err)
  }
}

exports.blockUser = async(req,res) => {
  try{
    const userId = req.params.id
    const  user=await User.findByIdAndUpdate(userId,{isBlocked:true})
  return res.send("user blocked succesfully")
  }catch(err){
    console.log(err)
  }
}

exports.unblockUser = async(req,res) => {
  try{
    const userId = req.params.id
    await User.findByIdAndUpdate(userId,{isBlocked:false})
    return res.send("user unbloked")
  }catch(err){
    return res.send("error unblocking user")
  }
}