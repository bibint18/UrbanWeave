const cron = require('node-cron')
const Coupon = require('../model/admin/CouponModel')

cron.schedule('0 0 * * *', async () => {
  try {
    const currentDate = new Date();
    
    // Find and update all coupons where the end date has passed
    const result = await Coupon.updateMany(
      { end_date: { $lt: currentDate }, status: 'active' },
      { $set: { status: 'inactive' } }
    );

    console.log(`Updated ${result.nModified} coupons to inactive status.`);
  } catch (error) {
    console.error('Error updating coupon statuses:', error);
  }
});