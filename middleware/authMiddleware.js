const jwt = require('jsonwebtoken')
const User = require('../model/user/userModel')
const Admin = require('../model/admin/adminModel')
const jwtService = require('../services/jwtService')
exports.protect = async (req,res,next) => {
  const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];
  if(!token){
    console.log("NO TOKEN USER NEED TO LOGIN")
    return res.redirect('/userLogin')
    
    // return res.send("no token user not loggedin")
  }
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if(!user){
      return res.send("no user in databse");
    }
    req.user = user
    next();
  }catch(err){
    return res.send(err)
  }
}

exports.protectAdmin = async (req,res,next) => {
  const token =  req.cookies.jwt || req.headers.authorization?.split(' ')[1];
  if(!token){
    return res.redirect('/admin/login')
  }
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET_ADMIN)
    const admin = await Admin.findById(decoded.id)
    if(!admin){
      return  res.send("no admin in database");
    }
    req.admin = admin
    next()
  }catch(error){
    console.log(error)
    // return res.status(400).json({message:"Invalid Token Jwt expired Login again"})
    res.redirect('/admin/login')
  }
}

exports.AdminLoggedIn = (req,res,next)=> {
  const token = req.cookies.jwt ||  req.headers.authorization?.split(' ')[1];
  console.log(token)
  if(!token){
    return next()  
  }
  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET_ADMIN)
    if(decoded){
      console.log(decoded,"its decoed")
      res.redirect('/admin/dashboard')
    }
  } catch (error) {
    return next()
  }
}

exports.isLoggedIn = (req,res,next)=> {
  const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1]
  console.log(token)
  if(!token){
    return next()
  }
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    if(decoded){
      console.log(decoded,"its deco")
      res.redirect('/home')
    }
  }catch(err){
    return next()
  }
}

