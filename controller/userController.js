const User = require("../model/user/userModel");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { text } = require("express");
const { info } = require("console");
const jwtService = require('../services/jwtService')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.getUserLogin = (req, res) => {
  res.render("user/user-login");
};
exports.getHome = (req, res) => {
  res.render("home");
};
let otpStore = {};
exports.SignToLogin = (req, res) => {
  const { username, email, password, rpassword } = req.body;
  console.log(username, email, password, rpassword);
  try {
    const user = new User({ username, email, password, isverified: false });
    user.save();
    const newOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000;
    otpStore[email] = { newOtp: newOtp, otpExpiry };
    console.log(otpStore);
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
      res.render("user/otp", { email });
      console.log(`otp is ${newOtp} collection: ${otpStore}`);
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getOtp = (req, res) => {
  res.render("user/otp", { email: null });
};

exports.otpSubmit = (req, res) => {
  const { email, enteredOtp } = req.body;
  console.log(email, enteredOtp);
  const storedOtp = otpStore[email];
  console.log(storedOtp);
  if (!storedOtp) {
    return res.send("invalid no otp");
  }
  const { newOtp, otpExpiry } = storedOtp;
  console.log(newOtp);
  if (Date.now() > otpExpiry) {
    console.log(Date.now(), otpExpiry);
    return res.send("expired request new one");
  }
  if (newOtp === enteredOtp) {
     User.findOneAndUpdate({email},{isverified:true})
    console.log(newOtp, enteredOtp);
    return res.redirect("/userLogin");
  } else {
    return res.send("nooooo");
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
  const user = await User.findOne({email})
  if(user.isBlocked == true){
    return res.redirect("/userLogin")
  }
  if(user && await user.comparePassword(password)){
    const token = jwtService.signToken(user)
    res.cookie('jwt', token, { httpOnly: true, secure: false });
     return res.redirect('/home') 
  }else{
    res.redirect('/userLogin')
  }
}
exports.logout = (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.redirect('/userLogin'); 
};

// exports.forgotPassword =(req,res) => {
//   res.redirect('/')
// }
// exports.getPasswordReset =(req,res) => {
//   res.render('user/passwordReset')
// }