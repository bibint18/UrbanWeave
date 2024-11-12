const Product = require('../model/admin/prodectModel')
const Wishlist = require('../model/user/WishlistModel')
exports.getWishlist = async (req,res) => {
  try {
    const user = req.user._id
    console.log("user: ",user);
    const products = await Wishlist.find({user:user}).populate('Product').populate('user')
    console.log("from db: ",products);
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
      return res.status(400).json({success:false,message:"Product Not found"})
    }
    // const SizeCheck =  product.sizes.find(s => s.size === selectedSize)
    // if(!SizeCheck){
    //   return res.status(400).json({success:false,message:"Size Not found"})
    // }
    let exist = await Wishlist.findOne({Product:ProductID})
    if(exist){
      return res.status(400).json({success:false,message:"Product already exist in wishlist"})
    }
    const wishlist = new Wishlist ({
      user: user,
      Product: ProductID, 
       
    })
    await wishlist.save()
    return res.status(200).json({success:true,message:"Product Added To Wishlist"})
  } catch (error) {
    console.log(error);
    return res.status(400).json({success:false,message:"Error adding"})
  }
}


exports.removeWishlist = async (req,res) => {
  try {
    const id = req.params.id
    console.log("id: ",id);
    const p = await Wishlist.findByIdAndDelete(id)
    if(!p){
      return res.status(400).json({success:false,message:"Product Not found"})
    }
    return res.status(200).json({success:true,message:"deldettde"})
  } catch (error) {
   console.log(error)
   return res.status(400).json({success:false,message:"error"}) 
  }
}