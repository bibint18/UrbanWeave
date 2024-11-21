const Products = require("../model/admin/prodectModel")
const Category = require("../model/admin/categoryModel")
const {resizeAndSaveImage} = require("../middleware/productmanage")
exports.getProducts=async (req,res) => {
  const products = await Products.find({isDeleted:false}).populate("category","categoryName")
  const categories = await Category.find({isDeleted:false})
  res.render("admin/productList",{products,categories})
}

exports.addProduct = async (req,res) => {
  try{
  const {name,brand,category,price,description} = req.body
  const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filename = `${Date.now()}-${file.originalname}`;
        const imagePath = await resizeAndSaveImage(file.buffer, filename); // Resize and save image
        imagePaths.push(imagePath); // Push resized image path to array
      }
    }
    if (imagePaths.length < 3) {
      return res.status(400).json({ error: 'You must upload at least 3 images.' });
    }
  const newProduct = new Products({
    name,
    brand,
    category,
    price,
    description,
    images:imagePaths,
    isDeleted:false
  })
  await newProduct.save()
  return res.render("/admin/productPage")
  }catch(err){
    console.log(err)
    return res.render('admin/errorpage')
  }
}

exports.deleteProduct =async (req,res) => {
  try{
  const id = req.params.id
  await Products.findByIdAndUpdate(id,{isDeleted:true})
  return res.status(200).json({ success: true, message: "Category deleted successfully" });
  }catch(err){
    return res.status(500).send("failure")
  }
}

exports.editProduct =async (req,res) => {
  try{
  const {name,brand,category,price,description} = req.body
  const id = req.params.id
  await Products.findByIdAndUpdate(id,{name,brand,category,price,description},{new:true})
  const product = await Products.findById(id)
  return res.redirect("/admin/products")
  }catch(err){
    console.log(err)
  }
}