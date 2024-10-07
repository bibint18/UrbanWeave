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
      productImage:images
    })
    await newProducts.save()
    return res.redirect('/admin/getAddProduct')
    }
  }catch(err){
    console.log(err)
    return res.json("something went wrong!")
  }
}

exports.ListProducts =async (req,res) => {
  try {
    const products = await Product.find().populate('category');
    const categories = await Category.find({isDeleted:false})
    res.render('admin/productPage',{products,categories})
  } catch (error) {
    console.log(error)
  }
}

exports.AddProductOffer =async (req,res) => {
  try{
  const {productId,percentage} =req.body
  const FindProduct = await Product.findOne({_id:productId})
  FindProduct.salePrice = FindProduct.salePrice - Math.floor(FindProduct.regularPrice * (percentage/100))
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
  FindProduct.salePrice= FindProduct.salePrice + Math.floor(FindProduct.regularPrice *(percentage/100))
  FindProduct.productOffer = 0
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
