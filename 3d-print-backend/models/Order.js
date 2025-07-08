import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  technology: { type: String, required: true },
  material: { type: String, required: true },
  color: { type: String, required: true },
  surfaceFinish: { type: Boolean, default: false },
  finishType: { type: String },
  generalSanding: { type: Boolean, default: false },
  quantity: { type: Number, required: true },
  productDesc: { type: String },
  price: { type: Number, required: true },
  remarks: { type: String },
  uploadedFile: { type: String }, // Optional: can be file path or URL
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
