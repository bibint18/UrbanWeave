const Category = require("../model/admin/categoryModel")

exports.listCategory =async (req,res) => {
  const categories = await Category.find({isDeleted:false})
  return res.render('admin/category',{categories})
}

exports.AddCategory =(req,res) => {
  const {categoryName,description} =req.body 
  console.log(categoryName,description)
  const category = new Category ({categoryName,description})
  category.save();
  res.redirect('/admin/category')
}

exports.deleteCategory =async (req,res) => {
  const id = req.params.id
  console.log("id",id)
  const user =await Category.findByIdAndUpdate(id,{isDeleted:true})
  console.log("dne")
  // res.redirect("/admin/category")
  return res.status(200).json({ success: true, message: "Category deleted successfully" });
}

exports.deletedCategories =async (req,res) => {
  const categories=await Category.find({isDeleted:true})
  return res.render('admin/deleted',{categories})
}
exports.revert = async(req,res) => {
  const id = req.params.id
  await Category.findByIdAndUpdate(id,{isDeleted:false})
  return res.status(200).send("category added back")
}

exports.editcategory = async (req,res) => {
  const {categoryName,description} = req.body;
  console.log(categoryName,description)
  if (!categoryName || categoryName.trim() =='' || !description || description.trim() == '') {
    return res.status(400).json({ error: 'Category name is required' });
}
  const id = req.params.id
  await Category.findByIdAndUpdate(id,{categoryName,description})
  // res.redirect("/admin/category")
  return  res.status(200).json({ success: true, message: "Category updated successfully" });

}
