const User = require("../model/user/userModel");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { text } = require("express");
const { info, error } = require("console");
const jwtService = require("../services/jwtService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Products = require("../model/admin/prodectModel");
const CategoryOffer = require('../model/admin/CategoryOfferModel')
const Wallet = require('../model/user/WalletModel');
const { default: mongoose } = require("mongoose");
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('404', {
        message: 'Invalid Product ID',
        url: req.originalUrl
      });
    }
  const user = req.cookies.jwt;
  const products = await Products.findById(id);
  let OfferPrice=0
  if(products.productOffer){
    OfferPrice =products.salePrice - ((products.salePrice) * products.productOffer / 100)
  }
  const HereCategory = products.category
  console.log("hereCategory",HereCategory)
  console.log("products: ",products)
  const CatOffer = await CategoryOffer.findOne({category:products.category})
  let CatOfferPercentage=0;
  let CatOfferEndDate= Date.now()
  if(CatOffer){
     CatOfferPercentage = CatOffer.discountPercentage
     CatOfferEndDate=CatOffer.endDate
  console.log(CatOfferPercentage)
  }
  
  if (products.isDeleted == true || products.isBlocked==true) {
    return res.redirect("/home");
  }
  const prod = await Products.find({ category:HereCategory }).limit(8)
  res.render("user/product-details", { products, prod, user ,CatOfferPercentage,CatOfferEndDate,OfferPrice});
};

exports.getPayment = (req, res) => {
  return res.render("payment");
};


async function creditWallets(newUserId,referrerId,amount){
  let newUserWallet = await Wallet.findOne({user:newUserId})
  if(!newUserWallet){
    newUserWallet = new Wallet({user:newUserId})
  }
  newUserWallet.balance+=amount
  newUserWallet.transactions.push({
    type:"credit",
    date:Date.now(),
    amount:amount,
    description: `Referral bonus ${amount} credited to your wallet`
  })
  await newUserWallet.save()

  let referrerWallet = await Wallet.findOne({user:referrerId})
  if(!referrerWallet){
    referrerWallet = new Wallet({user:referrerId})
  }
  referrerWallet.balance+=amount
  referrerWallet.transactions.push({
    type:"credit",
    date:Date.now(),
    amount:amount,
    description: `Referral bonus ${amount} credited to your wallet`
  })
  await referrerWallet.save()
}