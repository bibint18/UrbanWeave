const { response } = require("express");
const Category = require("../model/admin/categoryModel");

exports.listCategory = async (req, res) => {
  const categories = await Category.find({ isDeleted: false });
  return res.render("admin/category", { categories });
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
        .status(400)
        .json({ success: false, message: "Category Already Exist" });
    }
    const category = new Category({ categoryName, description });
    category.save();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .json({ success: false, message: "something went wrong!" });
  }
};

exports.deleteCategory = async (req, res) => {
  const id = req.params.id;
  const user = await Category.findByIdAndUpdate(id, { isDeleted: true });
  return res
    .status(200)
    .json({ success: true, message: "Category deleted successfully" });
};

exports.deletedCategories = async (req, res) => {
  const categories = await Category.find({ isDeleted: true });
  return res.render("admin/deleted", { categories });
};
exports.revert = async (req, res) => {
  const id = req.params.id;
  await Category.findByIdAndUpdate(id, { isDeleted: false });
  return res.status(200).send("category added back");
};

exports.editcategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { categoryName, description } = req.body;
    console.log("cat and dis",categoryName,description)
    const category = await Category.findById(id);
    console.log('category from id',category)
    const CatName = category.categoryName;
    if(CatName === categoryName){
      return res.status(400).json({ success: false, message: "Same Category"})
    }
    if (CatName != categoryName) {
      const PreCategory = await Category.findOne({
        categoryName: { $regex: `^${categoryName}$`, $options: "i" },
      });
      console.log('precategory',PreCategory)
      if (PreCategory) {
        return res
          .status(400)
          .json({ success: false, message: "Category Already Exist" });
      }
    }
    await Category.findByIdAndUpdate(id, { categoryName, description });
    return res
      .status(200)
      .json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong!" });
  }
};
