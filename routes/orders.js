const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { createAdhocOrder } = require('../services/shiprocketService');
const { syncShiprocketStatus } = require('../services/syncShiprocketStatus');

// POST /api/orders - Create order (public for checkout)
router.post('/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerLastName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      postalCode,
      country,
      totalAmount,
      items,
    } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create order in local DB
    const order = new Order({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      city,
      postal_code: postalCode,
      country,
      total_amount: totalAmount,
      status: 'pending',
    });

    await order.save();

    // 💾 Save order items locally
    const itemsToSave = items.map((it) => ({
      order_id: order._id,
      product_id: it.product_id,
      product_name: it.product_name,
      product_price: it.product_price,
      discount_price: it.discount_price ?? undefined,
      quantity: it.quantity,
      subtotal: it.subtotal,
    }));

    await OrderItem.insertMany(itemsToSave);

    // Push order to Shiprocket asynchronously
    (async () => {
      try {
        // ✅ Merge duplicate SKUs before sending
        const mergedItems = Object.values(
          items.reduce((acc, it) => {
            if (acc[it.product_id]) {
              acc[it.product_id].units += it.quantity;
            } else {
              acc[it.product_id] = {
                name: it.product_name,
                sku: it.product_id,
                units: it.quantity,
                selling_price: it.product_price,
              };
            }
            return acc;
          }, {})
        );

        const shiprocketPayload = {
          order_id: order._id.toString(),
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: "home 2",
          billing_customer_name: customerName,
          billing_last_name: customerLastName,
          billing_address: shippingAddress,
          billing_city: city,
          billing_pincode: postalCode,
          billing_state: city,
          billing_country: country,
          billing_email: customerEmail,
          billing_phone: customerPhone,
          shipping_is_billing: true,
          order_items: mergedItems, // ✅ use merged items
          payment_method: "Prepaid",
          sub_total: totalAmount,
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5,
        };

        const shiprocketRes = await createAdhocOrder(shiprocketPayload);
        console.log("✅ Order pushed to Shiprocket:", shiprocketRes);

        if (shiprocketRes?.order_id) {
          order.status = 'pending';
          order.shiprocket_order_id = shiprocketRes.order_id?.toString() || null;
          order.shiprocket_channel_id = shiprocketRes.channel_order_id?.toString() || null;
          await order.save();
        }

        await syncShiprocketStatus();
      } catch (shipErr) {
        console.error("🚨 Failed to push order to Shiprocket:", shipErr.message || shipErr);
      }
    })();

    res.status(201).json({
      id: order.shiprocket_channel_id || order._id,
      message: 'Order created successfully',
    });

  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }


   router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let items = await OrderItem.find({ order_id: order._id });

    // ✅ Merge duplicate product entries if any
    const mergedItems = Object.values(
      items.reduce((acc, it) => {
        if (acc[it.product_id]) {
          acc[it.product_id].quantity += it.quantity;
          acc[it.product_id].subtotal += it.subtotal;
        } else {
          acc[it.product_id] = {
            ...it.toObject(),
          };
        }
        return acc;
      }, {})
    );

    res.json({
      order: {
        ...order.toObject(),
        display_id: order.shiprocket_channel_id || order._id,
      },
      items: mergedItems,
    });
  } catch (err) {
    console.error('Fetch order error:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});


});

module.exports = router;
