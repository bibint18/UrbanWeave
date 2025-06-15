const Category = require("../model/admin/categoryModel");
const Product = require("../model/admin/prodectModel");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const mongoose = require("mongoose");

exports.getAddProduct = async (req, res) => {
  const products = await Product.find();
  const categories = await Category.find({isDeleted:false});
  res.render("admin/productDemo", { categories });
};

exports.AddProduct = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "../public/uploads/product-images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Recursive creates parent directories if necessary
    }
    const product = req.body;
    console.log(product);
    const existingProduct = await Product.findOne({
      ProductName: product.ProductName,
    });
    if (!existingProduct) {
      const uploadDir = path.normalize(
        path.join(__dirname, "../public/uploads/product-images")
      );
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating...");
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const sizes = Object.entries(product.sizes).map(([size, stock]) => ({
        size: size.toUpperCase(),
        stock: parseInt(stock, 10),
      }));
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          const resizedImagePath = path.join(
            "public",
            "uploads",
            "product-images",
            req.files[i].filename
          );
          await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);
          images.push(req.files[i].filename);
        }
      }
      const newProducts = new Product({
        ProductName: product.productName,
        description: product.description,
        category: product.category,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        quantity: product.quantity,
        color: product.color,
        productImage: images,
        sizes: sizes,
      });
      await newProducts.save();
      return res.redirect("/admin/getAddProduct");
    }
  } catch (err) {
    console.log(err);
    return res.json({"error":err});
  }
};

exports.ListProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const categoryQuery = req.query.categoryQuery
    const limit = 4;
    const skip = (page - 1) * limit;
    let filterCriteria = {isDeleted:false};
    if (categoryQuery) {
      filterCriteria.category = categoryQuery; // Filter by category
    }
    const products = await Product.find(filterCriteria)
      .populate("category")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const categories = await Category.find({ isDeleted: false });
    const totalProducts = await Product.countDocuments(filterCriteria);
    const totalPages = Math.ceil(totalProducts / limit);
    res.render("admin/ProductPage", {
      products,
      categories,
      searchQuery: null,
      currentPage: page,
      totalPages,
      categoryQuery
    });
  } catch (error) {
    console.log(error);
  }
};

exports.AddProductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body;
    const FindProduct = await Product.findOne({ _id: productId });
    FindProduct.productOffer = parseInt(percentage);
    await FindProduct.save();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
};

exports.RemoveProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;
    const FindProduct = await Product.findOne({ _id: productId });
    if (!FindProduct) {
    }
    const percentage = FindProduct.productOffer;
    FindProduct.productOffer = 0;
    await FindProduct.save();
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

exports.unBlockProduct = async (req, res) => {
  try {
    const {productId} = req.body
    await Product.updateOne({ _id: productId }, { $set: { isBlocked: false} });
    // return res.redirect("/admin/product");
        return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

exports.blockProduct = async (req, res) => {
  try {
    const {productId} = req.body;
    await Product.updateOne({ _id: productId }, { $set: { isBlocked: true } });
    // return res.redirect("/admin/product");
    return res.status(200).json({ success: true });
  } catch (err) {
    {
      console.log(err);
      return res.status(500).json({ success: false });
    }
  }
};

exports.getEditProduct = async (req, res) => {
  const id = req.query.id;
  const products = await Product.findOne({ _id: id }).populate('category')
  const categories = await Category.find({ isDeleted: false });
  let currentCategory = null;
  if (products.category && products.category.isDeleted) {
    currentCategory = products.category;
  }
  const sizes = products.sizes;
  return res.render("admin/ProductEdit", { products, categories, sizes,currentCategory });
};

exports.editProducts = async (req, res) => {
  try {
    const id = req.params.id;
    const products = await Product.findOne({ _id: id });
    const data = req.body;
    const category = await Category.findById(data.category);
    const existing = await Product.findOne({
      ProductName: data.productName,
      _id: { $ne: id },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Product Name already exist" });
    }
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].filename);
      }
    }
    const sizes = [
      { size: "S", stock: data.sizes.s || 0 },
      { size: "M", stock: data.sizes.m || 0 },
      { size: "L", stock: data.sizes.l || 0 },
      { size: "XL", stock: data.sizes.xl || 0 },
    ];

    const updatedData = {
      ProductName: data.productName,
      description: data.descriptionData,
      category: category,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      quantity: data.quantity,
      color: data.color,
      sizes: sizes,
    };
    if (req.files.length > 0) {
      updatedData.$push = { productImage: { $each: images } };
    }
    await Product.findByIdAndUpdate(id, updatedData, { new: true });
    res.redirect("/admin/product");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { imageName, productId } = req.body;
    const product = await Product.findByIdAndUpdate(productId, {
      $pull: { productImage: imageName },
    });
    const imagePath = path.join("public", "uploads", "re-image", imageName);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    } else {
      console.log(`image ${imageName} not found `);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

exports.SearchProduct = async (req, res) => {
  try {
    const search = req.query.search;
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const categories = await Category.find({ isDeleted: false });
    const matchingCategories = await Category.find({
      categoryName: { $regex: search, $options: "i" },
    }).select("_id");
    const productCount = await Product.countDocuments({
      $or: [
        { ProductName: { $regex: search, $options: "i" } },
        { category: { $in: matchingCategories.map((cat) => cat._id) } },
      ],
    });
    const totalPages = Math.ceil(productCount / limit);
    const products = await Product.find({
      $or: [
        { ProductName: { $regex: search, $options: "i" } },
        { category: { $in: matchingCategories.map((cat) => cat._id) } },
      ],
    })
      .skip(skip)
      .limit(limit)
      .populate("category");
    return res.render("admin/ProductPage", {
      products,
      categories,
      searchQuery: search,
      currentPage: page,
      totalPages,
      categoryQuery:null
    });
  } catch (error) {
    return res.send(error);
  }
};
