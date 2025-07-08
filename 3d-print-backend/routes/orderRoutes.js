import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();


// @route   POST /api/orders
// @desc    Create a new order
router.post('/', async (req, res) => {
  try {
    const {
      technology,
      material,
      color,
      surfaceFinish,
      finishType,
      generalSanding,
      quantity,
      productDesc,
      price,
      remarks,
      uploadedFile,
    } = req.body;

    const newOrder = new Order({
      technology,
      material,
      color,
      surfaceFinish,
      finishType,
      generalSanding,
      quantity,
      productDesc,
      price,
      remarks,
      uploadedFile,
    });

    const savedOrder = await newOrder.save();
    console.log("✅ Order saved:", savedOrder);

    res.status(201).json({ 
      message: "✅ Order saved", 
      order: savedOrder });
  } catch (err) {
    console.error("❌ Error saving order:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// @route   GET /api/orders
// @desc    Fetch all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});


export default router;
