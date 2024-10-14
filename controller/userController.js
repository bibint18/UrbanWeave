const User = require("../model/user/userModel");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { text } = require("express");
const { info, error } = require("console");
const jwtService = require('../services/jwtService')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Products = require("../model/admin/prodectModel")

exports.getUserSignup = (req,res) => {
  res.render("user/up",{error:null})
}
exports.getUserLogin = (req, res) => {
  res.render("user/login",{error:null});
};
exports.getHome =async (req, res) => {
  try{
    const products =await Products.find({isDeleted:false})
  return res.render("home",{products});
  }catch(err){
    console.log(err);
    return res.status(500).json({success:false})
  }
};

let otpStore = {};
exports.SignToLogin = async (req, res) => {
  const { username, email, password, rpassword } = req.body;
  console.log(username, email, password, rpassword);
  if(!username || username.trim() ==='' || !password || password.trim() === '' || !rpassword || rpassword.trim() === ''){
    return res.render('user/up',{error:"Input cannot be empty or spaces only!"})
  }
  if(password !== rpassword){
    return  res.render('user/up',{error:"Password and confirm password must be same!"})
  }
  const pre = await User.find({email:email})
  console.log(pre)
  if(pre.length >0){
    return res.render('user/up',{error:"Email already exists!"})
  }
  
  try {
    // const user = new User({ username, email, password, isverified: false });
    // user.save();
    const newOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000;
    req.session.otpStore = {
      newOtp,
      otpExpiry,
      username,
      email,
      password
    };
    // otpStore[email] = { newOtp: newOtp, otpExpiry,username,email,password };
    // console.log(otpStore);
    const Transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailoptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "your OTP code",
      text: `Your Otp code is ${newOtp}`,
    };

    Transporter.sendMail(mailoptions, (err, info) => {
      if (err) {
        return res.status(500).send(err);
      }
      console.log(`otp sent `, info.response);
      // res.redirect(`/otp?email=${email}`);
      res.render("user/otp", { email:email });
      console.log(`otp is ${newOtp} collection: ${otpStore}`);
    });
  } catch (err) {
    console.log(err);
    return res.render("user/up",{error:"Email already exist"})
  }
};

exports.getOtp = (req, res) => {
  res.render("user/otp", { email: null,error:null });
};

exports.otpSubmit = async (req, res) => {
  const { email, enteredOtp } = req.body;
  console.log("got from ajx: ",email, enteredOtp);
  // const storedOtp = otpStore[email];
  const storedOtp = req.session.otpStore && req.session.otpStore.newOtp;
  const otpExpiry = req.session.otpStore && req.session.otpStore.otpExpiry;
  console.log("storedOtp: ",storedOtp);
  console.log("otpexpiry: ",otpExpiry);
  if (!storedOtp) {
    // return res.send("invalid no otp");
    return res.json({success:false,messege:"NO Otp"})                       //here
  }
  // const { newOtp, otpExpiry } = storedOtp;
  console.log(storedOtp);
  if (Date.now() > otpExpiry) {
    console.log(Date.now(), otpExpiry);
    // return res.send("expired request new one"); 
    return res.json({success:false,messege:"Expired Request New One"})              //here
  }
  if (storedOtp === enteredOtp) {
    // const existingUser = await User.findOne({ email });
    //   if (existingUser) {
    //     return res.json({ success: false, message: "Email is already registered!" });
    //   }
    const {username,email,password} = req.session.otpStore || {}
    const user = new User({ username, email, password});
    user.save();
    //  User.findOneAndUpdate({email},{isverified:true})
    // console.log(newOtp, enteredOtp);
    // return res.redirect("/userLogin");
    return res.json({success:true,redirectUrl:"/userLogin"})
  } else {
    // return res.send("Enter valid Otp");
    return res.json({success:false,messege:"Please try again!"})
  }
};



exports.resend = (req, res) => {
  const { email } = req.body;
  try{
  const newOtp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = Date.now() + 5 * 60 * 1000;
  otpStore[email] = { newOtp: newOtp, otpExpiry };
  const Transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailoptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your new OTP`,
    text: `Your new OTP code is ${newOtp}. It will expire in 5 minutes.`,
  };
  Transporter.sendMail(mailoptions, (err, info) => {
    if (err) {
      return res.status(500).send(err);
    }
    console.log("send", info.response);
    return res.render('user/otp',{email})
  });
}catch(err){
  console.log(err)
}
};

exports.userLogin =async (req,res) => {
  const{email,password} = req.body
  console.log("email",email,"passw",password)
  const user = await User.findOne({email})
  console.log("user",user)
  if(!user){
    return res.json({success:false,message:"user not existed"})
  }
  if (!email|| email.trim() === '' || !password || password.trim() === '') {
    // return res.render('user/login', { error: "Input cannot be empty or spaces only!" });
    return res.json({success:false,message:"Input cannot be empty or spaces only!"})
}

  if(user && user.isBlocked === true){
    console.log(user.isBlocked)
    return res.status(400).json({success:false,message:"user is blocked"})
    // return res.render("user/login",{error:"User is Blocked"})
  }
  if(user && await user.comparePassword(password)){
    const token = jwtService.signToken(user)
    res.cookie('jwt', token, { httpOnly: true, secure: false });
    // const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'12d'})
    // res.cookie('token',token,{
    //   httpOnly:true,
    //   maxAge: 30* 24* 60 * 60* 1000,
    //   secure:false,
    //   sameSite:'Lax'
    // })
    //  return res.redirect('/home') 
    
    return res.json({success:true,message:"Login Successfull"})
  }
  else{
    // res.render('user/login',{error:"invalid Username or password"})
    return res.status(200).json({success:false,message:"Invalid username or password"})
  }
}

exports.logout = (req, res) => {
  console.log("cookie",req.cookies)
  res.cookie('jwt', '', { maxAge: 1 });
  console.log("Session after destroying:", req.session);
  return res.redirect('/userLogin')
  
  // req.logout((err) => {
  //   if (err) {
  //     return next(err);
  //   }
  //   console.log('Session before destroying:', req.session);
  //   console.log('Cookies before clearing:', req.cookies);
  //   req.session.destroy((err) => {
  //     if (err) {
  //       return next(err);
  //     }
  //     console.log("Session after destroying:", req.session);
  //     console.log('Cookies after clearing:', req.cookies);
  //     res.redirect('/userSignup');
  //   });
  // });
};



// exports.forgotPassword =(req,res) => {
//   res.redirect('/')
// }
// exports.getPasswordReset =(req,res) => {
//   res.render('user/passwordReset')
// }

exports.getProductDetails =async (req,res) => {
  const id = req.params.id
  console.log(id)

  const products = await  Products.findById(id)
  if(products.isDeleted == true){
    return res.redirect('/home')
  }
  console.log(products)
  const prod = await Products.find({isDeleted:false});
  res.render('user/product-details',{products,prod})
}