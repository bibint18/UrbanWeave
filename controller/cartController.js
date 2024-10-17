const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')

exports.getCart =async (req,res) => {
  try {
    const userId = req.user.id
    console.log("usre: ",userId)
    const cartItems = await Cart.find({user:userId}).populate('product').exec()
    console.log("items: ",cartItems);
    
    if(!cartItems || cartItems.length ==0){
      return res.render('user/cart',{cartItems:[],message:"Cart is empty"})
    }
    const itemsWithTotal = cartItems.map((item) => {
      const total = item.quantity * item.product.salePrice;
      console.log("total",total);
      return{
        ...item.toObject(),total
      }
    })
    return res.render("user/cart",{cartItems:itemsWithTotal})
    
  } catch (error) {
    console.log(error)
    res.status(400).json({success:false,message:"error"})
  }
  
}

exports.AddCart =async (req,res) => {
  try {
    // console.log("req,",req.user)
    const userId = req.user.id
    const{size,productId,quantity} = req.body 
    const product = await Product.findById(productId)
    if(!product){
      return res.status(400).json({success:false,message:"product not found"})
    }
    let cartItem = await Cart.findOne({user:userId,product:productId,size:size})
    if(cartItem){
      cartItem.quantity += parseInt(quantity,10)
      await cartItem.save()
    }else{
      cartItem=new Cart({
        user:userId,
        product:productId,
        quantity:parseInt(quantity,10),
        size:size
      })
      await cartItem.save()
    }
    return res.status(200).json({success:true,message:"added"})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:"error"})
  }
}