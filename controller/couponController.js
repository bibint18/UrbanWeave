const Coupon = require('../model/admin/CouponModel')


exports.getCoupons =async (req,res) => {
  try {

    return res.render('admin/coupons',{coupons:null})
  } catch (error) {
    console.log(error)
    return res.send(error)
  }
}

exports.AddCoupon = async(req,res) => {
  try {
    const{code,start_date,end_date,minimum,maximum,discount,status} = req.body
    console.log("from copun received:  ",code,start_date,end_date,minimum,maximum,discount,status)
    const coupon = new Coupon({
      code:code,
      startDate:start_date,
      endDate:end_date,
      minimum:minimum,
      maximum:maximum,
      discount:discount,
      status:status
    })
    await coupon.save();
    return res.status(200).json({success:true,message:"addded"})
  } catch (error) {
    console.log(error)
    return res.status(400).json({success:false,message:"something went wrong!"})
  }
}