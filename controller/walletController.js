const Wallet = require("../model/user/WalletModel");
const User = require("../model/user/userModel");
const mongoose = require("mongoose");
exports.loadWallet = async (req, res) => {
  try {
    const user = req.user._id;
    let wallet = await Wallet.findOne({ user: user });
      if (!wallet) {
        await Wallet.create({
          user: user,
          balance: 0,
          transactions: [], 
        });
      }
      console.log(wallet)
    return res.render("user/wallet", { user,wallet });
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
    console.log(amount);
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount should be atleast greater than 0",
      });
    }
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user:userId});
    console.log(wallet)
    console.log(wallet);
    if (!wallet) {
      console.log("create");
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

// const initializeWallets = async () => {
//   try {
//     const users = await User.find(); // Get all users from the database

//     for (let user of users) {
//       // Check if the user already has a wallet
//       const existingWallet = await Wallet.findOne({ userId: user._id });

//       // If no wallet exists, create one with balance 0
//       if (!existingWallet) {
//         await Wallet.create({
//           user: user._id,
//           balance: 0,
//           transactions: [], // Empty transaction history
//         });
//         console.log(`Initialized wallet for user: ${user._id}`);
//       }
//     }

//     console.log("Wallets initialized for all users");
//   } catch (error) {
//     console.error("Error initializing wallets:", error);
//   } finally {
//     mongoose.connection.close(); // Close the connection after the script finishes
//   }
// };

// initializeWallets();
