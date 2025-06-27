
const Wallet = require("../model/user/WalletModel");
const User = require("../model/user/userModel");
const mongoose = require("mongoose");
exports.loadWallet = async (req, res) => {
  try {
    const user = req.user._id;
    const User = req.user
    const page = parseInt(req.query.page) || 1
    const limit =4
    const skip = (page -1 )* limit

    let wallet = await Wallet.findOne({ user: user });
      if (!wallet) {
       wallet = await Wallet.create({
          user: user,
          balance: 0,
          transactions: [], 
        });
      }
    const totalTransactions = wallet.transactions.length
    const paginatedTransactions = wallet.transactions.sort((a,b) => b.date -a.date).slice(skip,skip+limit)
    const totalPages=Math.ceil(totalTransactions/limit)
    console.log(totalPages)
    return res.render("user/wallet", { user,wallet,User,currentPage:page,totalPages,transactions:paginatedTransactions});
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong!" });
  }
};

exports.AddMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount should be atleast greater than 0",
      });
    }
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user:userId});
    if (!wallet) {
      wallet = new Wallet({
        user: userId,
        balance: 0,
        transactions: [],
      });
    }
    wallet.balance += amount;
    wallet.transactions.push({
      amount: amount,
      type: "credit",
      description: `Wallet Credited with ${amount} rupees.`,
    });
    await wallet.save();
    return res
      .status(200)
      .json({ success: true, message: "Amount Credited Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something Went Wrong!" });
  }
};


