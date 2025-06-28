const Category = require("../model/admin/categoryModel");
const CategoryOffer = require("../model/admin/CategoryOfferModel");
const Products = require("../model/admin/prodectModel");
const RESPONSE_MESSAGES = require("../utils/Response");
const HTTP_STATUS_CODE = require("../utils/statusCode");

exports.ListCategoryOffer = async (req, res) => {
  try {
    const searchQuery = (await req.query.search) || "";
    const categories = await Category.find({ isDeleted: false });
    // const offers = await CategoryOffer.find().populate("category");
    const offers = await CategoryOffer.find().populate({
      path: "category",
      match: { categoryName: { $regex: searchQuery, $options: "i" } },
    });
    const products = await Products.find().populate("category");
    return res.render("admin/CategoryOffer", {
      categories,
      offers: offers.filter((o) => o.category),
      products,
      searchQuery,
    });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

exports.AddCategoryOffer = async (req, res) => {
  try {
    const { category, discountPercentage, startDate, endDate } = req.body;
    let existing = await CategoryOffer.findOne({ category: category });
    if (existing) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Category offer already exist" });
    }
    if (discountPercentage > 80) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Discount should not be more than 80%",
      });
    }
    const newOffer = new CategoryOffer({
      category: category,
      discountPercentage: discountPercentage,
      startDate: startDate,
      endDate: endDate,
    });
    await newOffer.save();
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, message: "Coupon applied successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: RESPONSE_MESSAGES.SOMETHING });
  }
};

exports.deleteCatOffer = async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await CategoryOffer.findByIdAndDelete(id);
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, message: "Succesfully deleted" });
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: RESPONSE_MESSAGES.SOMETHING });
  }
};

exports.getEditCatOffer = async (req, res) => {
  const id = req.params.id;
  const categories = await Category.find();
  const offers = await CategoryOffer.findById(id).populate("category");
  return res.render("admin/EditCategoryOffer", { categories, offers });
};

exports.EditOffer = async (req, res) => {
  try {
    const id = req.params.id;
    const { category, discountPercentage, startDate, endDate } = req.body;
    const cat = await CategoryOffer.findById(id);
    if (discountPercentage > 80) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Discount percentage cannot be more than 80%",
      });
    }
    const offer = await CategoryOffer.findByIdAndUpdate(id, {
      discountPercentage: discountPercentage,
      startDate: startDate,
      endDate: endDate,
    });
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, message: "Offer updated succesfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: RESPONSE_MESSAGES.SOMETHING });
  }
};
