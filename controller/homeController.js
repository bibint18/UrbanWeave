const { findByIdAndDelete } = require('../model/admin/adminModel')
const Product = require('../model/admin/prodectModel')
const User = require('../model/user/userModel')
const bcrypt = require('bcrypt')
exports.ShopPage = async (req,res) => {
  try {
    const pro = await Product.find({isDeleted:false})
    console.log("prod: ",pro);
    const user = req.cookies.jwt
    const {sort} = req.query
    console.log("sort: ",sort);
    let sortOptions ={};
    switch(sort){
      case 'priceLowHigh':
        sortOptions = {salePrice:1};
        break;
      case 'priceHighLow':
        sortOptions = {salePrice:-1};
        break;
      case 'newArrivals':
        sortOptions = {createdAt:-1};
        break;
      case 'az':
        const productsAZ = await Product.aggregate([
          { $match: { isDeleted: false } },
          { $addFields: { ProductNameCleaned: { $trim: { input: { $toLower: "$ProductName" } } } } }, 
          { $sort: { ProductNameCleaned: 1 } }  
        ]);
        return res.render('user/shop', { products: productsAZ,sort });
        // sortOptions = {productName:1}; 
        // break;
      case 'za':
        const productsZA = await Product.aggregate([
          { $match: { isDeleted: false } },
          { $addFields: { ProductNameCleaned: { $trim: { input: { $toLower: "$ProductName" } } } } }, 
          { $sort: { ProductNameCleaned: -1 } }  // Sort Z-A
        ]);
        return res.render('user/shop', { products: productsZA,sort,user });
        // sortOptions = {productName:-1};
        // break;
      default:
        sortOptions = {createdAt:-1}
    }
    const products= await Product.find({isDeleted:false}).collation({ locale: 'en', strength: 2 }).sort(sortOptions).exec()
    return res.render('user/shop',{products,sort,user})
  } catch (error) {
    console.log(error)
    return res.status(500).json({success:false})
  }
}

exports.userProfile = async (req,res) => {
  const user = await User.findById(req.user.id)
  return res.render('user/myAccount',{user})
}

exports.EditUserProfile = async (req,res) => {
  const {fullName,email,gender,mobilePh,current,newPsw,confirmPsw}= req.body
  console.log( 'hhih ',fullName,email,gender,mobilePh,current,newPsw,confirmPsw);
  console.log(current,newPsw,confirmPsw);
  
  let Lowgender = gender.toLowerCase();
  const user = await User.findOne({email})
  if(!user){
    return res.status(404).json({success:false,message:"user not exist"})
  }
  if(fullName){
    user.username = fullName
  }
  if(mobilePh){
    user.mobile = mobilePh
  }
  if(gender){
    user.gender = Lowgender
  }

  let isYes = await bcrypt.compare(current,user.password)
  console.log(isYes)
  if(isYes){
    if(newPsw && confirmPsw && newPsw === confirmPsw){
      bcrypt.hash(newPsw,10)
      user.password = newPsw
    }
  }
  //
//   if(user){
//     user.username = fullName;
//     user.gender = Lowgender;
//     user.mobile = mobilePh;
//   await user.save()
// }
await user.save();
  // res.send("done")
  return res.redirect('/userProfile')
}

exports.userAddress = async (req,res) => {
  try{
    const addresses = await User.findById(req.user.id)
    console.log("rendering ",addresses)
  res.render('user/addressPage',{addresses})
  }catch(error){
    console.log(error)
  }
}

exports.manageAddress =async (req,res) => {
  console.log(req.user.id)
  const user = req.user
  const addresses = await User.findById(req.user.id)
  const addr = addresses.address;
  // console.log("rendering ",addr)
  res.render('user/addressLand',{addr,user})
}

exports.addAddress = async (req,res) => {
  try{
    console.log(req.user)
  const {fullName,phone,addressLine1,addressLine2,city,state,postalCode,country,addType} = req.body
  // console.log(fullName,phone,addressLine1,addressLine2,city,state,postalCode,country,addType)
  // res.send("done")
  
  const user = await User.findById(req.user.id)
  const newAddress = {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    addType,
  }
  user.address.push(newAddress);
  await user.save();
  return res.redirect('/userProfile')
}catch(err){
  console.log(err)
}
}

exports.getEditAddress =async (req,res) => {
  try {
    const id = req.query.id
    const userAddress = await User.findOne({"address._id":id},{"address.$":1})
    const user =userAddress.address[0]
    console.log("aaddress:",user)
    res.render('user/editAddress',{address:user})
  } catch (error) {
    console.log(error)
  }
}

exports.editAddress = async (req,res) => {
  try {
      console.log("req:",req.query)
       const id = req.query.id
       console.log(id,"got from edit")
    const {fullName,phone,addressLine1,addressLine2,city,state,postalCode,country,addType} = req.body
       console.log(fullName,phone,addressLine1,addressLine2,city,state,postalCode,country,addType)
      // const useraddress = await User.findOne({"address._id":id},{"address.$":1})
      // console.log(useraddress)
      // console.log("add: ",useraddress)
      const updatedAddress = await  User.findOneAndUpdate({"address._id":id},
        {
          $set: {
            "address.$.fullName": fullName,
            "address.$.phone": phone,
            "address.$.addressLine1": addressLine1,
            "address.$.addressLine2": addressLine2,
            "address.$.city": city,
            "address.$.state": state,
            "address.$.postalCode": postalCode,
            "address.$.country": country,
            "address.$.addType": addType,
          },
        },
        { new: true },
      )
      console.log("updated",updatedAddress)
      res.send("done")
  } catch (error) {
    console.log(error)
    res.send(error)
  }
}

exports.deleteAddress =async (req,res) => {
  try {
    console.log(req.query);
    
    const id = req.query.id
    console.log(id)
    const updated =  await User.findOneAndUpdate({"address._id":id},{$pull:{address:{_id:id}}},{new:true})
    console.log("after deelete",updated)
    return res.redirect('/manageAddress')
    
  } catch (error) {
    console.log(error)
  }
}