const Category = require('../model/admin/categoryModel')
const Product = require('../model/admin/prodectModel')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const mongoose = require('mongoose')

exports.getAddProduct =async (req,res) => {
  const products = await Product.find()
  const  categories = await Category.find()
  res.render('admin/productDemo',{categories})
}


exports.AddProduct = async (req,res) => {
  try{
    const uploadDir = path.join(__dirname, '../public/uploads/product-images');

        // Check if the directory exists, and if not, create it
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // Recursive creates parent directories if necessary
        }
    const product = req.body 
    console.log(product)
    const existingProduct = await Product.findOne({ProductName:product.ProductName})
    if(!existingProduct){
      const uploadDir = path.normalize(path.join(__dirname, '../public/uploads/product-images'));
        console.log('Upload directory:', uploadDir); // Log the directory path for debugging

        // Check if the directory exists, and if not, create it
        if (!fs.existsSync(uploadDir)) {
            console.log('Directory does not exist, creating...');
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const sizes = Object.entries(product.sizes).map(([size, stock]) => ({
          size:size.toUpperCase(),
          stock: parseInt(stock, 10), // Convert stock to a number
        }));
    const images =[]
    if(req.files && req.files.length>0){
      for(let i=0;i<req.files.length;i++){
        const originalImagePath = req.files[i].path
        const resizedImagePath = path.join('public','uploads','product-images',req.files[i].filename)
        console.log("fileeeeeeeeeeee",resizedImagePath)
        await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath)
        images.push(req.files[i].filename)
      }
    }
    // const categoryId = await Category.findOne({ _id: new mongoose.Types.ObjectId(product.Category)})
    // console.log(categoryId)
    // if(!categoryId){
    //   return res.json("enter valid category name")
    // }
    const newProducts = new Product({
      ProductName:product.productName,
      description:product.description,
      category:product.category,
      regularPrice:product.regularPrice,
      salePrice:product.salePrice,
      quantity:product.quantity,
      color:product.color,
      productImage:images,
      sizes:sizes,
    })
    await newProducts.save()
    return res.redirect('/admin/getAddProduct')
    // return res.render('admin/productDemo')
    }
  }catch(err){
    console.log(err)
    return res.json("something went wrong!")
  }
}

exports.ListProducts =async (req,res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 4;
    const skip = (page-1) * limit 
    const products = await Product.find().populate('category').skip(skip).limit(limit).sort({createdAt:-1})
    const categories = await Category.find({isDeleted:false})
    const totalProducts =  await Product.countDocuments()
    const  totalPages = Math.ceil(totalProducts/limit)

    res.render('admin/productPage',{products,categories,searchQuery:null,currentPage:page,totalPages})
  } catch (error) {
    console.log(error)
  }
}

exports.AddProductOffer =async (req,res) => {
  try{
  const {productId,percentage} =req.body
  const FindProduct = await Product.findOne({_id:productId})
  // FindProduct.salePrice = FindProduct.salePrice - Math.floor(FindProduct.regularPrice * (percentage/100))
  FindProduct.productOffer = parseInt(percentage)
  await FindProduct.save();
  return res.status(200).json({success:true})
  }catch(err){
    console.log(err)
    return res.status(500).json({success:false})
  }
}


exports.RemoveProductOffer =async (req,res) => {
  try{
  const {productId} = req.body
  console.log(productId)
  const  FindProduct = await Product.findOne({_id:productId})
    console.log("REMOVE",FindProduct)
  if(!FindProduct){
    console.log("nooooooooooooooo")
  }
  const percentage = FindProduct.productOffer
  FindProduct.productOffer= 0
  await FindProduct.save()
  return res.status(200).json({success:true})
  }catch(err){
    return res.status(500).json({success:false})
  }
}

exports.unBlockProduct = async (req,res) => {
  try {
    const id = req.query.id
    await Product.updateOne({_id:id},{$set:{isDeleted:false}})
    return res.redirect('/admin/product')
  } catch (error) {
    console.log(error)
  }
}

exports.blockProduct = async (req,res) => {
  try{
  const id = req.query.id
  console.log(id)
  await Product.updateOne({_id:id},{$set:{isDeleted:true}})
  return res.redirect("/admin/product")
  }catch(err){{
    console.log(err)
    return res.status(500).json({success:false})
  }}
}

exports.getEditProduct = async (req,res) => {
  const  id = req.query.id
  const products = await Product.findOne({_id:id})
  console.log("edit: ",products)
  const categories = await Category.find({isDeleted:false})
  const sizes = products.sizes
  console.log("sizes: ",sizes)
  return res.render('admin/ProductEdit',{products,categories,sizes})
}

exports.editProducts = async (req,res) => {
  try{
  const id = req.params.id
  console.log(id)
  const products = await Product.findOne({_id:id})
  const data = req.body
  console.log("data",data)
  console.log("cat",data.category)
  const category = await Category.findById(data.category) 
  console.log("main cat",category)
  const existing = await Product.findOne({ProductName:data.productName,_id:{$ne:id}})
  if(existing){
    return res.status(400).json({success:false,message:"Product Name already exist"})
  }
  const images =[]
  if(req.files && req.files.length>0){
    for(let i=0;i<req.files.length;i++){
      images.push(req.files[i].filename)
    }
  }
  const sizes = [
    { size: 'S', stock: data.sizes.s || 0 },
    { size: 'M', stock: data.sizes.m || 0 },
    { size: 'L', stock: data.sizes.l || 0 },
    { size: 'XL', stock: data.sizes.xl || 0 }
  ];

  const updatedData ={
    ProductName:data.productName,
    description:data.description,
    category:category,
    regularPrice:data.regularPrice,
    salePrice:data.salePrice,
    quantity:data.quantity,
    color:data.color,
    sizes:sizes,
  }
  if(req.files.length > 0){
    updatedData.$push = {productImage:{$each:images}}
  }
  await Product.findByIdAndUpdate(id,updatedData,{new:true})
  res.redirect('/admin/product')
  // res.render('admin/productPage')
}catch(err){
  console.log(err)
  return res.status(500).json({success:false,message:err})
}
}


exports.deleteImage =async (req,res) => {
  try{
  const{imageName,productId} = req.body
  console.log(imageName,productId)
  const product = await Product.findByIdAndUpdate(productId,{$pull:{productImage:imageName}})
  const imagePath = path.join("public","uploads","re-image",imageName)
  if(fs.existsSync(imagePath)){
    fs.unlinkSync(imagePath)
    console.log(`image ${imageName} deleted `)
  }else{
    console.log(`image ${imageName} not found `)
  }
  return res.status(200).json({success:true})
}catch(err){
  console.log(err)
  res.status(500).json({success:false})

}
}


exports.SearchProduct =async (req,res) => {
  try{
  const search = req.query.search
  const page = parseInt(req.query.page) || 1;
  const limit =7
  const skip = (page -1) * limit
  
  console.log(search)
  const categories = await Category.find({ isDeleted: false });
  console.log("cat",categories)

  const matchingCategories = await Category.find({
    categoryName: { $regex: search, $options: 'i' }
  }).select('_id');
  console.log("match",matchingCategories)

  const productCount = await Product.countDocuments({
    $or: [
      { ProductName: { $regex: search, $options: 'i' } },
      { category: { $in: matchingCategories.map(cat => cat._id) } }
    ]
  });
  const totalPages = Math.ceil(productCount / limit);
  // const products =await Product.find({ProductName:{$regex:search,$options:'i'}})
  const products = await Product.find({$or:[{ProductName:{$regex:search,$options:'i'}},{category: { $in: matchingCategories.map(cat => cat._id)}}]}).skip(skip).limit(limit).populate('category')
  console.log("pro",products);
  
  return res.render('admin/productPage',{products,categories,searchQuery:search,currentPage:page,totalPages})
}catch(error){
  return res.send(error)
}
}
