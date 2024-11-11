const User = require("../model/user/userModel");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { text } = require("express");
const { info, error } = require("console");
const jwtService = require("../services/jwtService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Products = require("../model/admin/prodectModel");

function sendResetEmail(email, resetLink) {
  console.log("triggered")
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset. Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>This link will expire in 1 hour.</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

exports.getUserSignup = (req, res) => {
  res.render("user/up", { error: null });
};
exports.getUserLogin = (req, res) => {
  res.render("user/login", { error: null });
};
exports.getHome = async (req, res) => {
  try {
    const products = await Products.find({ isDeleted: false });
    if(req.isAuthenticated()){
    console.log("isauth")
    console.log("uswr; ",req.user)
      return res.render('home',{user:req.user,products})
    }
    const user = req.cookies.jwt;
    console.log("user: ", user);
    return res.render("home", { products, user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
};

let otpStore = {};
exports.SignToLogin = async (req, res) => {
  const { username, email, password, rpassword } = req.body;
  console.log(username, email, password, rpassword);
  if (
    !username ||
    username.trim() === "" ||
    !password ||
    password.trim() === "" ||
    !rpassword ||
    rpassword.trim() === ""
  ) {
    return res.render("user/up", {
      error: "Input cannot be empty or spaces only!",
    });
  }
  if (password !== rpassword) {
    return res.render("user/up", {
      error: "Password and confirm password must be same!",
    });
  }
  const pre = await User.findOne({ email: email });
  console.log(pre);
  if (pre.length > 0) {
    return res.render("user/up", { error: "Email already exists!" });
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
      password,
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
      res.render("user/otp", { email: email });
      console.log(`otp is ${newOtp} collection: ${otpStore}`);
    });
  } catch (err) {
    console.log(err);
    return res.render("user/up", { error: "Email already exist" });
  }
};

exports.getOtp = (req, res) => {
  res.render("user/otp", { email: null, error: null });
};

exports.otpSubmit = async (req, res) => {
  const { email, enteredOtp } = req.body;
  console.log("got from ajx: ", email, enteredOtp);
  // const storedOtp = otpStore[email];
  const storedOtp = req.session.otpStore && req.session.otpStore.newOtp;
  const otpExpiry = req.session.otpStore && req.session.otpStore.otpExpiry;
  console.log("storedOtp: ", storedOtp);
  console.log("otpexpiry: ", otpExpiry);
  if (!storedOtp) {
    // return res.send("invalid no otp");
    return res.json({ success: false, messege: "NO Otp" }); //here
  }
  // const { newOtp, otpExpiry } = storedOtp;
  console.log(storedOtp);
  if (Date.now() > otpExpiry) {
    console.log(Date.now(), otpExpiry);
    // return res.send("expired request new one");
    return res.json({ success: false, messege: "Expired Request New One" }); //here
  }
  if (storedOtp === enteredOtp) {
    // const existingUser = await User.findOne({ email });
    //   if (existingUser) {
    //     return res.json({ success: false, message: "Email is already registered!" });
    //   }
    const { username, email, password } = req.session.otpStore || {};
    const user = new User({ username, email, password });
    user.save();
    //  User.findOneAndUpdate({email},{isverified:true})
    // console.log(newOtp, enteredOtp);
    // return res.redirect("/userLogin");
    return res.json({ success: true, redirectUrl: "/userLogin" });
  } else {
    // return res.send("Enter valid Otp");
    return res.json({ success: false, messege: "Please try again!" });
  }
};

exports.resend = (req, res) => {
  const { email } = req.body;
  try {
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
      return res.render("user/otp", { email });
    });
  } catch (err) {
    console.log(err);
  }
};

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log("email", email, "passw", password);
  const user = await User.findOne({ email });
  console.log("user", user);
  if (!user) {
    return res.json({ success: false, message: "user not existed" });
  }
  if (!email || email.trim() === "" || !password || password.trim() === "") {
    // return res.render('user/login', { error: "Input cannot be empty or spaces only!" });
    return res
      .status(400)
      .json({
        success: false,
        message: "Input cannot be empty or spaces only!",
      });
  }

  if (user.isBlocked) {
    console.log(user.isBlocked);
    return res.status(200).json({ success: false, message: "User is Blocked" });
    // return res.render("user/login",{error:"User is Blocked"})
  }
  if (user && (await user.comparePassword(password))) {
    const token = jwtService.signToken(user);
    res.cookie("jwt", token, { httpOnly: true, secure: false });
    return res.json({ success: true, message: "Login Successfull" });
  } else {
    // res.render('user/login',{error:"invalid Username or password"})
    return res
      .status(200)
      .json({ success: false, message: "Invalid username or password" });
  }
};

exports.logout = (req, res) => {
  req.logout(() => {
    console.log("cookie", req.cookies);
  res.cookie("jwt", "", { maxAge: 1 });
  console.log("Session after destroying:", req.session);
  return res.redirect("/userLogin");
  })
  
};

exports.getForgotpassword = async (req, res) => {
  try {
    res.render("user/forgotPassword.ejs");
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};
exports.forgot = async (req, res) => {
  try{
  console.log("inside : forgot")
  const { email } = req.body;
  console.log(email)
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send('No user found with that email address.');
  }
  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = token;
  user.passwordResetExpiry = Date.now() + 3600000; // 1 hour in milliseconds
  await user.save();
  const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
  sendResetEmail(email, resetLink);
  return res.status(200).json({success:true,message:'Password reset link has been sent to your email.'})
}catch(error){
  console.log(error)
  return res.status(400).json({success:false,message:"Something went wrong!"})
}
}

exports.getResetpassword = async (req, res) => {
  try {
    console.log("inside rset");
    const { token } = req.params;
    console.log("token: ",token);
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: Date.now() } 
  });
  console.log("backuser: ",user)
  if (!user) {
    return res.status(400).json({success:false,message:'Invalid or expired token.'});
  }
  res.render('user/resetpass', { token });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};


exports.Reset = async (req, res) => {
  try{
  let  token  = decodeURIComponent(req.params.token.trim());
  const { newPassword } = req.body;
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: Date.now() } 
  });
  if(!newPassword || newPassword.trim()===''){
    return res.status(400).json({success:false,message:'Password should not be empty'});
  }
  if(!newPassword.length>=8){
    return res.status(400).json({success:false,message:'Password should be at least 8'})
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
  if(!passwordRegex.test(newPassword)){
    return res.status(400).json({success:false,message:"Password should contain An uppercase ,a lowercase,a number and special characchter"})
  }
  if (!user) {
    return res.status(400).json({success:false,message:'Invalid or expired token.'});
  }
  user.password = newPassword
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();
  return res.status(200).json({success:true});
}catch(error){
  console.log(error)
  return res.status(400).json({success:false,message:"Something went wrong!"})
}
}


exports.getProductDetails = async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const user = req.cookies.jwt;
  const products = await Products.findById(id);
  if (products.isDeleted == true) {
    return res.redirect("/home");
  }
  console.log(products);
  const prod = await Products.find({ isDeleted: false });
  res.render("user/product-details", { products, prod, user });
};

exports.getPayment = (req, res) => {
  return res.render("payment");
};
