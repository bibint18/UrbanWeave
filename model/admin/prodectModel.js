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
      default: false,
    },
    color: {
      type: String,
      required: false,
    },
    productOffer: {
      type: Number,
      default: 0,
    },
    isOnSale: {
      type: Boolean,
      default: true,
    },
    
    productImage: {
      type: [String],
      required: true,
    },
    sizes: [
      {
        size: {
          type: String,
          enum: ['S', 'M', 'L', 'XL'],
          required: true,
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

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
    isBlocked:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);

