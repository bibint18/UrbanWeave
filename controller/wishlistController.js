const Product = require('../model/admin/prodectModel')
const Wishlist = require('../model/user/WishlistModel')
const RESPONSE_MESSAGES = require('../utils/Response')
const HTTP_STATUS_CODE = require('../utils/statusCode')
exports.getWishlist = async (req,res) => {
  try {
    const user = req.user._id
    const products = await Wishlist.find({user:user}).populate('Product').populate('user')
    return res.render('user/wishlist',{user,products}) 
  } catch (error) {
    console.log(error);
    return res.send(error)
  }
}

exports.addWishlist =async (req,res) => {
  try {
    const user = req.user._id
    const {ProductID,selectedSize,Quantity} = req.body
    const product = await Product.findById(ProductID)
    if(!product){
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({success:false,message:"Product Not found"})
    }
    let exist = await Wishlist.findOne({Product:ProductID})
    if(exist){
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({success:false,message:"Product already exist in wishlist"})
    }
    const wishlist = new Wishlist ({
      user: user,
      Product: ProductID, 
    })
    await wishlist.save()
    return res.status(HTTP_STATUS_CODE.OK).json({success:true,message:"Product Added To Wishlist"})
  } catch (error) {
    console.log(error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({success:false,message:"Error adding"})
  }
}


exports.removeWishlist = async (req,res) => {
  try {
    const id = req.params.id
    const p = await Wishlist.findByIdAndDelete(id)
    if(!p){
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({success:false,message:"Product Not found"})
    }
    return res.status(HTTP_STATUS_CODE.OK).json({success:true,message:"deldettde"})
  } catch (error) {
   console.log(error)
   return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({success:false,message:RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR}) 
  }
}