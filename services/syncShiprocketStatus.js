const Order = require('../models/Order');
const { trackByOrderId } = require('./shiprocketService');

function normalizeShiprocketStatus(statusText = '') {
  const text = statusText.toLowerCase();
  if (text.includes('pending')) return 'pending';
  if (text.includes('confirmed') || text.includes('processing')) return 'processing';
  if (text.includes('shipped') || text.includes('in transit')) return 'shipped';
  if (text.includes('out for delivery')) return 'out_for_delivery';
  if (text.includes('delivered')) return 'delivered';
  if (text.includes('cancelled')) return 'cancelled';
  return null; 
}

async function syncShiprocketStatus() {
  try {
   
    const orders = await Order.find({ shiprocket_channel_id: { $exists: true, $ne: null } });

    for (const order of orders) {
      try {
        const trackingData = await trackByOrderId(order.shiprocket_channel_id);

        console.log('Full trackingData JSON:', JSON.stringify(trackingData, null, 2));

        // Extract the last known shipment event, if available
        const shipmentTrack =
          trackingData?.[0]?.[order.shiprocket_channel_id]?.tracking_data?.shipment_track || [];

        // Get the latest current_status
        const latestStatusText =
          shipmentTrack.length > 0
            ? shipmentTrack[shipmentTrack.length - 1].current_status
            : null;

        // Normalize it
        const normalized = normalizeShiprocketStatus(latestStatusText);

        // Only update if we got a valid normalized status and it's different from current
        if (normalized && normalized !== order.status) {
          order.status = normalized;
          await order.save();
          console.log(`✅ Updated order ${order._id} → ${normalized}`);
        } else {
          console.log(`Order ${order._id} already up to date`);
        }
      } catch (err) {
        console.error(`Error syncing order ${order._id}:`, err.message);
      }
    }

    console.log(' Shiprocket status sync completed.');
  } catch (err) {
    console.error(' Failed to sync Shiprocket statuses:', err);
  }
}

module.exports = { syncShiprocketStatus };
