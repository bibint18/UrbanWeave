const mongoose = require("mongoose");
const { validate } = require("./adminModel");
const categoryModel = require("./categoryModel");

const ProductSchema = new mongoose.Schema(
  {
    ProductName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: categoryModel,
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: true,
    },
    color: {
      type: String,
      required: true,
    },
    productOffer: {
      type: Number,
      default: 0,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    
    productImage: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "out of stock", "Discountinued"],
      required: true,
      default: "Available",
    },
    isDeleted: {
      type: Boolean,
      default:false,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("products", ProductSchema);

