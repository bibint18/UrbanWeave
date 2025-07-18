const { response } = require("express");
const Category = require("../model/admin/categoryModel");
const HTTP_STATUS_CODE = require("../utils/statusCode");
const RESPONSE_MESSAGES = require("../utils/Response");

exports.listCategory = async (req, res) => {
  const searchQuery = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const limit =4
  const skip = (page-1)* limit;
  const categories = await Category.find({ isDeleted: false,categoryName:{$regex:searchQuery,$options:'i'}}).skip(skip).limit(limit)
  const totalCategory= await Category.countDocuments({isDeleted: false,categoryName:{$regex:searchQuery,$options:'i'}})
  const totalPages = Math.ceil(totalCategory/limit)
      if (page < 1 || (page > totalPages && totalPages > 0)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send("Invalid page number");
    }
  return res.render("admin/category", { categories,search:searchQuery,currentPage:page,totalPages });
};

exports.AddCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    console.log("Add cat cat and des",categoryName,description)
    const ExistingCategory = await Category.findOne({
      categoryName: { $regex: `^${categoryName}$`, $options: "i" },
    });
    console.log("Exist ",ExistingCategory)
    if (ExistingCategory) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Category Already Exist" });
    }
    const category = new Category({ categoryName, description });
    category.save();
    return res.status(HTTP_STATUS_CODE.OK).json({ success: true });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: RESPONSE_MESSAGES.SOMETHING });
  }
};

exports.deleteCategory = async (req, res) => {
  const id = req.params.id;
  const user = await Category.findByIdAndUpdate(id, { isDeleted: true });
  return res
    .status(HTTP_STATUS_CODE.OK)
    .json({ success: true, message: "Category deleted successfully" });
};

exports.deletedCategories = async (req, res) => {
  const categories = await Category.find({ isDeleted: true });
  return res.render("admin/deleted", { categories });
};
exports.revert = async (req, res) => {
  const id = req.params.id;
  await Category.findByIdAndUpdate(id, { isDeleted: false });
  return res.status(HTTP_STATUS_CODE.OK).send("category added back");
};

exports.editcategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { categoryName, description } = req.body;
    const category = await Category.findById(id);
    const CatName = category.categoryName;
    const CatDescription = category.description
    if(CatName === categoryName){
      if(CatDescription !== description){
        await Category.findByIdAndUpdate(id,{description})
        return res.status(HTTP_STATUS_CODE.OK).json({success:true,message:"Category updated Succesfully"})
      }
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({success:false,message:"Category name unchanged"})
    }
    if (CatName != categoryName) {
      const PreCategory = await Category.findOne({
        categoryName: { $regex: `^${categoryName}$`, $options: "i" },
      });
      console.log('precategory',PreCategory)
      if (PreCategory) {
        return res
          .status(HTTP_STATUS_CODE.BAD_REQUEST)
          .json({ success: false, message: "Category Already Exist" });
      }
    }
    await Category.findByIdAndUpdate(id, { categoryName, description });
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: RESPONSE_MESSAGES.SOMETHING });
  }
};
