
const Category = require('../model/admin/categoryModel')
const CategoryOffer = require('../model/admin/CategoryOfferModel')


exports.ListCategoryOffer = async(req,res) => {
  try {
    const categories = await Category.find() 
    console.log(categories);
    const offers = await CategoryOffer.find().populate('category')
    return res.render('admin/CategoryOffer',{categories,offers})
  } catch (error) {
    console.log(error);
    return res.send(error)
  }
}

exports.AddCategoryOffer = async (req,res) => {
  try {
    const {category, discountPercentage, startDate, endDate } = req.body 
    console.log("from backend",category, discountPercentage, startDate, endDate )
    const newOffer = new CategoryOffer ({
      category:category,
      discountPercentage:discountPercentage,
      startDate:startDate,
      endDate:endDate,

    })
    await newOffer.save()
    return res.status(200).json({success:true,message:"Coupon applied successfully!"})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:"something went wrong!"})
  }
}


exports.deleteCatOffer = async (req,res) => {
  try {
    const id = req.params.id
    console.log(id)
    const  offer = await CategoryOffer.findByIdAndDelete(id)
    return res.status(200).json({success:true,message:"Succesfully deleted"})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:"Something went wrong!"})
  }
}