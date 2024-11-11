const Coupon = require('../model/admin/CouponModel')


exports.getCoupons =async (req,res) => {
  try {
    const coupons = await Coupon.find({isDeleted:false})
    return res.render('admin/coupons',{coupons,coupon:null})
  } catch (error) {
    console.log(error)
    return res.send(error)
  }
}

exports.AddCoupon = async(req,res) => {
  try {
    const{code,start_date,end_date,minimum,maximum,discount,Maxdiscount,status} = req.body
    console.log("from copun received:  ",code,start_date,end_date,minimum,maximum,discount,Maxdiscount,status)
    const exist= await Coupon.findOne({code:code})
    if(exist){
      return res.status(400).json({success:false,message:"coupon code already exist"})
    }
    let discountt = Number(discount)
    const coupon = new Coupon({
      code:code,
      startDate:start_date,
      endDate:end_date,
      minimum:minimum,
      maximum:maximum,
      discount:discountt,
      maximumDiscount:Maxdiscount,
      status:status
    })
    await coupon.save();
    return res.status(200).json({success:true,message:"addded"})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:"something went wrong!"})
  }
}

exports.CouponDelete = async(req,res) => {
  try{
  const id = req.params.id
  console.log(id)
  const coupon = await Coupon.findById(id)
  console.log(coupon);
  
  if(!coupon){
    return res.status(400).json({success:false,message:"No coupon found"})
  }
  await Coupon.findByIdAndUpdate(id,{isDeleted:true})
  return res.status(200).json({success:true,message:"coupon Removed!"})
}catch(error){
  console.error(error)
  return res.status(400).json({success:false,message:"Something went wrong!"})
}
}
exports.getEditCoupon = async (req,res) => {
  try {
    const couponID = req.params.id;  // Get the CouponID from the URL parameter
    const coupon = await Coupon.findById(couponID); // Find the coupon by ID

    if (!coupon) {
      return res.status(404).send('Coupon not found');
    }

    // Render the EditCoupons view and pass the coupon data to it
    return res.render('admin/EditCoupons', { coupon });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
}
exports.editCoupon = async (req,res) => {
  try {
    console.log("inside edit")
    const Id = req.params.id
    console.log("orderId : ",Id)
    const{code,startDate,endDate,minimum,maximum,discount,Maxdiscount,status} = req.body
    console.log("edit",code,startDate,endDate,minimum,maximum,discount,Maxdiscount,status)
    console.log(typeof Maxdiscount)
    const existedCode = await Coupon.findOne({code:code})
    if(existedCode){
      return res.status(400).json({success:false,message:"Coupon code already exists!"})
    }
    const coupon = await Coupon.findByIdAndUpdate(Id,{
      code:code,
      start_date:startDate,
      end_date:endDate,
      minimum:minimum,
      maximum:maximum,
      discount:discount,
      maximumDiscount:Maxdiscount,
      status:status 
    },{new:true})
    
    if(!coupon){
      return res.status(400).json({success:false,message:"No order found"})
    }
    return res.status(200).json({success:true})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:"Something went wrong!"})
  }
}
