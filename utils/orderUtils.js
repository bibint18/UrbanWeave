const Counter = require('../model/user/counter')


async function getNextOrderId() {
  const updatedCounter = await Counter.findOneAndUpdate(
    {},
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return updatedCounter.sequenceValue;
}

async function initializeCounter() {
  const counter = await Counter.findOne();
  if (!counter) {
    await new Counter().save(); // Create the initial counter document if it doesn't exist
  }
}

module.exports = { getNextOrderId, initializeCounter };