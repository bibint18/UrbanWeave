const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')

exports.getCart =async (req,res) => {
  try {
    const userId = req.user.id
    const cartItems = await Cart.find({user:userId}).populate('product').exec()  
    if(!cartItems || cartItems.length ==0){
      return res.render('user/cart',{cartItems:[],message:"Cart is empty"})
    }
    const itemsWithTotal = cartItems.map((item) => {
      const total = item.quantity * item.product.salePrice;
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
    const requestedQuantity = parseInt(quantity,10)

    const product = await Product.findById(productId)
    if(!product){
      return res.status(400).json({success:false,message:"product not found"})
    }

    const sizeStock = await product.sizes.find(s => s.size ===size)
    if(!sizeStock){
      return  res.status(400).json({success:false,message:"size not found"})
    }
    if(requestedQuantity > sizeStock.stock){
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }
    if(requestedQuantity > 5){
      return res.status(400).json({ success: false, message: "Maximum quantity is 5"})
    }


    let cartItem = await Cart.findOne({user:userId,product:productId,size:size})
    if(cartItem){
      // cartItem.quantity += parseInt(quantity,10)
      const newQuantity = cartItem.quantity + requestedQuantity
      if(newQuantity > sizeStock.stock || newQuantity > 5){
        return res.status(400).json({ success: false, message: "Exceeds stock or max limit" })
      }
      cartItem.quantity = newQuantity;
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
    sizeStock.stock -= requestedQuantity;
    await product.save();
    return res.status(200).json({success:true,message:"added"})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:"error"})
  }
}

exports.deleteCart = async (req,res) => {
  try {
    const id = req.params.id
    const deleteItem = await Cart.findByIdAndDelete(id)
    if(!deleteItem){
      console.log("no item")
      return res.status(400).json({success:false,message:"item not found"})
    }
    return res.status(200).json({success:true,message:"deleted"})
  } catch (error) {
    console.log(error)
    res.status(400).json({success:false,message:error})
  }
}