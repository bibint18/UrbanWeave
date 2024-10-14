const Product = require('../model/admin/prodectModel')
const User = require('../model/user/userModel')
exports.ShopPage = async (req,res) => {
  try {
    const products = await Product.find({isDeleted:false})
    return res.render('user/shop',{products})
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({success:false})
  }
}

exports.userProfile = async (req,res) => {
  const user = await User.findById(req.user.id)
  console.log("req.user :",user)
  return res.render('user/myAccount',{user})
}

exports.EditUserProfile = async (req,res) => {
  console.log(req.body)
  const {fullName,email,gender,mobilePh}= req.body
  Lowgender = gender.toLowerCase();
  console.log(fullName,email,Lowgender,mobilePh)
  const user = await User.findOne({email})
  if(!user){
    return res.status(404).json({success:false,message:"user not exist"})
  }
  if(user){
    user.username = fullName;
    user.gender = Lowgender;
    user.mobile = mobilePh;
  await user.save()
}
  res.send("done")
}