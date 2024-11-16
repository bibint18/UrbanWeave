const { response } = require("express");
const Category = require("../model/admin/categoryModel");

exports.listCategory = async (req, res) => {
  const categories = await Category.find({ isDeleted: false });
  return res.render("admin/category", { categories });
};

exports.AddCategory = async (req, res) => {
  try {
    console.log(req.body)
    const { categoryName, description } = req.body;
    console.log("Add category", categoryName, description);
    const ExistingCategory = await Category.findOne({categoryName:{$regex:categoryName,$options:'i'}});
    console.log(ExistingCategory)
    if(ExistingCategory){
      return res.status(400).json({success:false,message:"Category Already Exist"})
    }
    const category = new Category({ categoryName, description });
    category.save();
    // res.redirect('/admin/category')
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ success: false, message: "something went wrong!" });
  }
};

exports.deleteCategory = async (req, res) => {
  const id = req.params.id;
  console.log("id", id);
  const user = await Category.findByIdAndUpdate(id, { isDeleted: true });
  console.log("dne");
  // res.redirect("/admin/category")
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
  try{
    const id = req.params.id
  const { categoryName, description } = req.body;
  console.log(categoryName, description);
  const category = await Category.findById(id)
  const CatName = category.categoryName
  if(CatName != categoryName){
  const PreCategory = await Category.findOne({categoryName:{$regex:`^${categoryName}$`,$options:'i'}})
  if(PreCategory){
    return res.status(400).json({success:false,message:"Category Already Exist"})
  }
}
  await Category.findByIdAndUpdate(id, { categoryName, description });
  return  res.status(200).json({ success: true, message: "Category updated successfully" });
}catch(error){
  console.log(error)
  return res.status(400).json({success:false,message:"Something went wrong!"})
}
};
