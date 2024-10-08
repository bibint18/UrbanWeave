const Product = require('../model/admin/prodectModel')

exports.ShopPage = async (req,res) => {
  try {
    const products = await Product.find({isDeleted:false})
    return res.render('user/shop',{products})
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({success:false})
  }
}