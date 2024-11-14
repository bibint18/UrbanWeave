const PDFDocument = require('pdfkit')
const easyinvoice = require('easyinvoice')
const fs = require('fs')
const path = require('path')
const Cart = require('../model/user/cartModel')
const Product = require('../model/admin/prodectModel')
const Order = require('../model/user/orderModel')
const User = require('../model/user/userModel')
const Coupon = require('../model/admin/CouponModel')
const Wallet = require('../model/user/WalletModel')
exports.getOrdersPage =async (req,res) => {
  try {
    
    const user = req.user
    const userId = req.user._id 
    console.log(userId);
    const { sort, page = 1, limit = 3} = req.query;
    const skip = (page - 1) * limit;
    let sortOptions ={}

    if (sort) {
      sortOptions = {
        products: { $elemMatch: { ProductStatus: sort } },
      };
      console.log(sortOptions)
    }
    console.log(sortOptions)
    const totalOrders = await Order.countDocuments({ user: userId, ...sortOptions });
    const totalPages = Math.ceil(totalOrders / limit);
    let orders = await Order.find({user:userId,...sortOptions}).populate('products.product').sort({ orderDate: -1 }).skip(skip).limit(limit).exec()
    console.log("or: ",orders);

    if (sort) {
       orders = orders.map(order => {
        const filteredProducts = order.products.filter(
          product => product.ProductStatus === sort
        );
        console.log("fill: ",filteredProducts)
        return { ...order.toObject(), products: filteredProducts };
      });
    }
    return res.render('user/orders',{orders,sort,user, currentPage: parseInt(page, 10),
      totalPages,})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:error})
  }
}

exports.cancelOrder =async (req,res) => {
  try {
    const user = req.user._id
    const {id,ProId} = req.params
    console.log("idPro ",ProId);
    console.log(id,"id");
    const orders = await Order.findById(id)
    console.log("can: ",orders);
    if(!orders){
      return res.json({success:false,message:"No order"})
    }
    const paid = orders.AmountPaid
    const CouponOffer = orders.CouponDiscount
    const product = orders.products.find(p => p.product.toString() == ProId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found in the order" });
    }
    console.log("products: ",product)
    let quantity = product.quantity
    let salePrice = product.price * quantity 
    let couponCode = orders.usedCoupons[0]
    let CatOffer = product.categoryOffer 
    let SaleAfterCat = salePrice - CatOffer
    let couponMinimum =0
    const coupon = await Coupon.findOne({code:couponCode})
    if(coupon){
    couponMinimum = coupon.minimum
    } 
    console.log("Coooo: ",couponMinimum)
    console.log("Catoffer: ",CatOffer)
    console.log("saleaftercat: ",SaleAfterCat)
    let reducedTotal = paid - SaleAfterCat
    console.log("reduced: ",reducedTotal)
    let wallet = await Wallet.findOne({user:user})
    console.log("wallet: ",wallet)
    if(!wallet){
      wallet = new Wallet({
        user: user,
        balance: 0,
        transactions:[]
      })
      await wallet.save();
    }
    // log('')
    if(product.ProductStatus =='Processing' || product.ProductStatus =='Shipped'){
      let amountToWallet;
      
      if(reducedTotal < couponMinimum){
        amountToWallet = SaleAfterCat - CouponOffer;
        orders.CouponDiscount = 0
      }else{
        amountToWallet = SaleAfterCat;
      }
      if(orders.paymentStatus ==='Paid'){
      wallet.balance += amountToWallet;
      wallet.transactions.push({
        amount: amountToWallet,
        type: 'credit',
        description: `Wallet credited with ${amountToWallet} rupees for order cancellation.`
      });
      await wallet.save();
    }
      orders.totalQuantity -= quantity;
      orders.AmountPaid -= amountToWallet;
      orders.totalAmount -= salePrice;
      orders.CategoryOffer -=CatOffer
      // product.categoryOffer =0
      product.ProductStatus = 'Cancelled'; 
      await orders.save();
      // await product.save()
      return res.json({success:true,message:"order cancelled succesfully",orderId:id})
    }else{
      return res.json({success:false,message:"cant cancel  the order"})
    }
    
  } catch (error) {
    console.log(error);
    return res.status(400).json({success:false,message:error})
    
  }
}

exports.ReturnProduct = async (req,res) => {
  try {
    const {id,ProId} = req.params
    console.log("id: ",id,"Po: ",ProId)

    const orders = await Order.findById(id)
    console.log("can: ",orders); 
    if(!orders){
      return res.json({success:false,message:"No order"})
    } 
    const product = orders.products.find(p => p.product.toString() == ProId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found in the order" });
    }
    if(product.ProductStatus =='Delivered'){
      product.ProductStatus =  'Returned'
      await orders.save()
      return res.status(200).json({success:true,message:"Product Returned"})
    }else{
      return res.status(400).json({success:false,message:" cannot return the Product"})
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({success:false,message:"cant return the product"})
  
  }
}

exports.UpdatePayStatus = async(req,res) => {
  try{
    console.log("inside update")
  const user = req.user._id
  const id = req.params.id
  const {couponCode}=req.body 
  console.log("CoCo: ",couponCode)
  console.log(id,"from the update")
  const ThatOrder = await Order.findById(id)
  const AmountToPay = ThatOrder.AmountPaid - ThatOrder.tempCouponAmount
  const order = await Order.findByIdAndUpdate(id,{paymentStatus:"Paid", $push: { usedCoupons: couponCode },AmountPaid:AmountToPay,CouponDiscount:ThatOrder.tempCouponAmount,tempCouponAmount:0})
  const UserCoupon = await User.findByIdAndUpdate(user,{$push: { usedCoupons: couponCode }},{new:true})
  return res.status(200).json({success:true,message:"Payment succcessfull"})
  }catch(error){
    console.log(error)
    return res.status(400).json({success:false,message:"error"})
  }
}

exports.Invoice = async(req,res) => {
  try {
    const orderId = req.params.id;
    console.log("inside invoice: ", orderId);
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('products.product');
    console.log("order: ", order);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const user = await User.findById(order.user._id);
    console.log("user: ", user);

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Header section
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order.oid || orderId}`, { align: 'left' });
    doc.text(`Order Date: ${order.orderDate.toDateString()}`, { align: 'left' });
    doc.moveDown();

    // User Details section
    doc.fontSize(14).text('Customer Details:', { underline: true });
    doc.fontSize(12).text(`Name: ${user.username || ''}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${order.address.phone}`);
    doc.text(`Address: ${order.address.addressLine1}, ${order.address.addressLine2 || ''}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}`);
    doc.moveDown();

    // Table header with border
    doc.fontSize(14).text('Order Details:', { underline: true });
    doc.moveDown();
    doc.fontSize(12);

    const tableTop = doc.y;
    const startX = 30;
    const columnWidths = [30, 100, 60, 100, 100];

    // Draw table header
    doc.rect(startX, tableTop, 470, 20).stroke();
    doc.text('No', startX + 5, tableTop + 5);
    doc.text('Product', startX + columnWidths[0] + 5, tableTop + 5);
    doc.text('Quantity', startX + columnWidths[0] + columnWidths[1] + 5, tableTop + 5);
    doc.text('Regular Price', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, tableTop + 5);
    doc.text('Sale Price', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 5, tableTop + 5);

    // Move down for table rows
    doc.moveDown();

    // Loop through products and draw rows with borders
    let itemNo = 1;
    let subtotal = 0;
    order.products.forEach((item) => {
      if (item.ProductStatus !== 'Cancelled') {
        const product = item.product;
        const rowY = doc.y;

        // Draw table row border
        doc.rect(startX, rowY, 470, 20).stroke();

        // Insert row data
        doc.text(itemNo++, startX + 5, rowY + 5, { width: columnWidths[0] - 10, ellipsis: true });
    doc.text(product.ProductName, startX + columnWidths[0] + 5, rowY + 5, { width: columnWidths[1] - 10, ellipsis: true });
    doc.text(item.quantity, startX + columnWidths[0] + columnWidths[1] + 5, rowY + 5, { width: columnWidths[2] - 10, ellipsis: true });
    doc.text(`$${product.regularPrice.toFixed(2)}`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, rowY + 5, { width: columnWidths[3] - 10, ellipsis: true });
    doc.text(`$${item.price.toFixed(2)}`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 5, rowY + 5, { width: columnWidths[4] - 10, ellipsis: true });

        doc.moveDown();

        subtotal += item.price * item.quantity;
      }
    });

    // Summary section with styled text
    doc.moveDown();
    doc.fontSize(14).text('Summary:', { underline: true });
    doc.fontSize(12).text(`Subtotal: ₹${subtotal.toFixed(2)}`);
    doc.text(`Offer Amount: ₹${order.CategoryOffer.toFixed(2)}`);
    doc.text(`Coupon Discount: ₹${order.CouponDiscount.toFixed(2)}`);
    doc.text(`Delivery Fee: ₹40`);
    doc.fontSize(14).fillColor('red').text(`Total Amount: ₹${order.AmountPaid.toFixed(2)}`, { bold: true });

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).send('Error generating invoice');
  }
}
// exports.Invoice = async (req, res) => {
//   try {
//       // Fetch the order details from the database based on the order ID
//       const orderId = req.params.id;  // Adjust as needed for your request handling
//       console.log("from invoice: ",orderId)
//       const order = await Order.findById(orderId)
//       .populate('user')
//       .populate('products.product');

//       if (!order) {
//           return res.status(404).send('Order not found');
//       }

//       // Construct the invoice data using order details
//       const invoiceData = {
//           "sender": {
//               "company": "URBAN WEAVE",
//               "address": "urbanweave72@gmail.com",
//               "city": "Banglore",
//               "country": "INDIA"
//           },
//           "client": {
//               "company": order.user.email,
//               "address": `${order.address.fullName}, ${order.address.addressLine1}, ${order.address.city}`,
//               "zip": order.address.postalCode,
//               "city": order.address.city,
//               "country": order.address.country
//           },
//           "information": {
//               "number": order.oid || order._id.toString(),
//               "date": order.orderDate.toISOString().split('T')[0],
//               "due-date": new Date().toISOString().split('T')[0]  // Set due date as current date or as per business logic
//           },
//           "products": order.products
//               .filter(item => item.ProductStatus !== 'Cancelled')  // Exclude cancelled products
//               .map(item => ({
//                   "quantity": item.quantity,
//                   "description": item.product.ProductName,
//                   "price": item.salePrice,
//                   "tax-rate": 0  // Adjust tax rate if necessary
//               })),
              
//           "bottom-notice": `
//     Thank you for your purchase!
//     <br>
//     <strong style="color: red;">Category Offer Discount: ₹${order.CategoryOffer.toFixed(2)}</strong>
//     <br>
//     <strong style="color: red;">Coupon Discount: ₹${order.CouponDiscount.toFixed(2)}</strong>
//     <br>
//     <strong style="color: red;">Total Discount: ₹${(order.CategoryOffer + order.CouponDiscount).toFixed(2)}</strong>
// `,
//           "settings": {
//               "currency": "INR"  // Adjust the currency as needed
//           },
//           "amounts": {
//               "subtotal": order.totalAmount.toFixed(2),
//               "categoryOffer": order.CategoryOffer.toFixed(2),
//               "couponDiscount": order.CouponDiscount.toFixed(2),
//               "discount": (order.CategoryOffer + order.CouponDiscount).toFixed(2),
//               "discount": order.CategoryOffer.toFixed(2),
//               "tax": 0,  // Include if applicable
//               "total": order.AmountPaid.toFixed(2)
//           },
//           "custom-fields": {
//     "Discounts": `
//         <strong>Category Offer Discount:</strong> ₹${order.CategoryOffer.toFixed(2)}<br>
//         <strong>Coupon Discount:</strong> ₹${order.CouponDiscount.toFixed(2)}<br>
//         <strong>Total Discount:</strong> ₹${(order.CategoryOffer + order.CouponDiscount).toFixed(2)}
//     `
// }
//       };

//       // Generate the invoice using easyinvoice
//       const result = await easyinvoice.createInvoice(invoiceData);

//       // Save the PDF to a file
//       const outputPath = path.join(__dirname, '../invoices', `${order.oid || order._id}.pdf`);
//       fs.writeFileSync(outputPath, result.pdf, 'base64');

//       // Send the generated PDF as a response to download
//       res.download(outputPath, `${order.oid || order._id}_invoice.pdf`);

//   } catch (error) {
//       console.error('Error generating invoice:', error);
//       res.status(500).send('Internal Server Error');
//   }
// };


