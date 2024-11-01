const Coupon = require('../model/admin/CouponModel')


exports.getCoupons =async (req,res) => {
  try {
    const coupons = await Coupon.find({isDeleted:false})
    return res.render('admin/coupons',{coupons})
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

