const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const CartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  category: String,
  qty: { type: Number, default: 1 },
  addedBy: String,
  addedById: String
}, { _id: false });

const ActivitySchema = new mongoose.Schema({
  text: String,
  icon: String,
  userName: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

module.exports = mongoose.model("Room", new mongoose.Schema({
  code: { type: String, unique: true, index: true },
  members: [MemberSchema],
  cart: [CartItemSchema],
  activity: [ActivitySchema]
}, { timestamps: true }));
