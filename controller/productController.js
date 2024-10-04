const Products = require("../model/admin/prodectModel")
const Category = require("../model/admin/categoryModel")
const {resizeAndSaveImage} = require("../middleware/productmanage")
exports.getProducts=async (req,res) => {
  const products = await Products.find({isDeleted:false}).populate("category","categoryName")
  // const products = await Product.find()
  const categories = await Category.find({isDeleted:false})
  res.render("admin/productList",{products,categories})
}

exports.addProduct = async (req,res) => {
  try{
  const {name,brand,category,price,description} = req.body
  console.log(category)
  const imagePaths = [];

    // Loop through each uploaded file, resize and save it
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
  
    // if(!name || name.trim() =='' ||  !brand || brand.trim() =='' || !description || description.trim() =='' || !price || price.trim() ==''){
    //   return res.render("admin/productList")
    // }
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
  // res.status(201).json({ message: 'Product added successfully', product: newProduct });
  return res.redirect("/admin/products")
  }catch(err){
    console.log(err)
    // res.status(500).json({ error: 'Internal Server Error' });
    return res.render('admin/errorpage')
  }
}

exports.deleteProduct =async (req,res) => {
  try{
    const id = req.params.id
  console.log(id)
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
  console.log(id)
  
  await Products.findByIdAndUpdate(id,{name,brand,category,price,description},{new:true})
  const product = await Products.findById(id)
  console.log(product)
  return res.redirect("/admin/products")
  }catch(err){
    console.log(err)
  }
}