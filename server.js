require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const Room = require("./models/Room");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function safeRoom(room) {
  return {
    code: room.code,
    members: room.members,
    cart: room.cart,
    activity: room.activity
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "CartShare API" });
});

app.post("/api/rooms", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required." });

    let code;
    do { code = makeCode(); } while (await Room.exists({ code }));

    const member = { userId: crypto.randomUUID(), name };
    const room = await Room.create({
      code,
      members: [member],
      cart: [],
      activity: [{
        text: `${name} created the room`,
        icon: "🏠",
        userName: name,
        createdAt: new Date()
      }]
    });

    res.status(201).json({ room: safeRoom(room), member });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/rooms/:code/join", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required." });

    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found." });

    let member = room.members.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (!member) {
      member = { userId: crypto.randomUUID(), name };
      room.members.push(member);
      room.activity.unshift({
        text: `${name} joined the room`,
        icon: "👋",
        userName: name,
        createdAt: new Date()
      });
      room.activity = room.activity.slice(0, 50);
      await room.save();
      io.to(code).emit("room:updated", safeRoom(room));
    }

    res.json({ room: safeRoom(room), member });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/rooms/:code", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found." });
    res.json(safeRoom(room));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/rooms/:code/cart", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const { name, price, image, category, qty, addedBy, addedById } = req.body;
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found." });

    const quantity = Math.max(1, Number(qty) || 1);
    const numericPrice = Math.max(0, Number(price) || 0);

    const existing = room.cart.find(
      item => item.productName.toLowerCase() === String(name).toLowerCase()
    );

    if (existing) {
      existing.qty += quantity;
      existing.addedBy = addedBy;
      existing.addedById = addedById;
      room.activity.unshift({
        text: `${addedBy} added ${quantity} more × ${name}`,
        icon: "➕",
        userName: addedBy,
        createdAt: new Date()
      });
    } else {
      room.cart.push({
        productId: crypto.randomUUID(),
        productName: name,
        price: numericPrice,
        image: image || "",
        category: category || "General",
        qty: quantity,
        addedBy,
        addedById
      });
      room.activity.unshift({
        text: `${addedBy} added ${quantity} × ${name}`,
        icon: "🛒",
        userName: addedBy,
        createdAt: new Date()
      });
    }

    room.activity = room.activity.slice(0, 50);
    await room.save();
    const data = safeRoom(room);
    io.to(code).emit("room:updated", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/rooms/:code/cart/:productId", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found." });

    const item = room.cart.find(i => i.productId === req.params.productId);
    if (!item) return res.status(404).json({ message: "Cart item not found." });

    const qty = Number(req.body.qty);
    if (qty <= 0) {
      room.cart = room.cart.filter(i => i.productId !== req.params.productId);
      room.activity.unshift({
        text: `${req.body.userName || "A member"} removed ${item.productName}`,
        icon: "🗑️",
        userName: req.body.userName || "Member",
        createdAt: new Date()
      });
    } else {
      item.qty = Math.min(99, qty);
      room.activity.unshift({
        text: `${req.body.userName || "A member"} changed ${item.productName} quantity to ${item.qty}`,
        icon: "🔢",
        userName: req.body.userName || "Member",
        createdAt: new Date()
      });
    }

    room.activity = room.activity.slice(0, 50);
    await room.save();
    const data = safeRoom(room);
    io.to(code).emit("room:updated", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/rooms/:code/cart/:productId", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found." });

    const item = room.cart.find(i => i.productId === req.params.productId);
    room.cart = room.cart.filter(i => i.productId !== req.params.productId);
    room.activity.unshift({
      text: `${req.body.userName || "A member"} removed ${item?.productName || "an item"}`,
      icon: "🗑️",
      userName: req.body.userName || "Member",
      createdAt: new Date()
    });
    room.activity = room.activity.slice(0, 50);
    await room.save();

    const data = safeRoom(room);
    io.to(code).emit("room:updated", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/rooms/:code/cart", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found." });

    room.cart = [];
    room.activity.unshift({
      text: `${req.body.userName || "A member"} cleared the cart`,
      icon: "🧹",
      userName: req.body.userName || "Member",
      createdAt: new Date()
    });
    room.activity = room.activity.slice(0, 50);
    await room.save();

    const data = safeRoom(room);
    io.to(code).emit("room:updated", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

io.on("connection", socket => {
  socket.on("room:join", code => socket.join(String(code).toUpperCase()));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Create a .env file from .env.example.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");
  server.listen(PORT, () => console.log(`CartShare running on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error("Startup error:", err.message);
  process.exit(1);
});
