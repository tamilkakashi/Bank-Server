var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");

var app = express();
app.use(cors());
app.use(express.json());

// Open the port
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`✅ Server Connected on port ${PORT}`);
});

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://tamil:tamil@cluster0.r1q9p.mongodb.net/bank?retryWrites=true&w=majority")
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// Define Schema
let dataSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  amount: { type: Number, default: 0 }, // Default amount to avoid errors
});

let Data = mongoose.model("test", dataSchema);

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Banking API");
});

// API to fetch all data
app.get("/data", async (req, res) => {
  try {
    const items = await Data.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});

// API to create new user
app.post("/create", async (req, res) => {
  try {
    const newItem = new Data(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Error creating data", error: error.message });
  }
});

// API to delete data
app.delete("/delete/:id", async (req, res) => {
  try {
    const deletedItem = await Data.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting data", error: error.message });
  }
});

// API to update data
app.put("/update/:id", async (req, res) => {
  try {
    const updatedData = await Data.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedData) return res.status(404).json({ message: "User not found" });
    res.json(updatedData);
  } catch (error) {
    res.status(500).json({ message: "Error updating data", error: error.message });
  }
});

// API to deposit money
app.post("/data/deposit", async (req, res) => {
  const { email, amount, password } = req.body;

  console.log("🔹 Deposit Request Received:", req.body);

  try {
    const user = await Data.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    user.amount += depositAmount;
    await user.save();

    console.log("✅ Deposit Successful. New Balance:", user.amount);
    res.json({ message: "Deposit successful", newBalance: user.amount });
  } catch (error) {
    console.error("❌ Deposit Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// API to withdraw money
app.post("/withdraw", async (req, res) => {
  const { email, amount ,password } = req.body;

  try {
      const user = await Data.findOne({ email });
      if (!user) {
          return res.status(400).json({ message: "User not found" });
      }

  
      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
          return res.status(400).json({ message: "Invalid withdrawal amount" });
      }

      
      if (user.amount < withdrawAmount) {
          return res.status(400).json({ message: "Insufficient balance" });
      }

     
      user.amount -= withdrawAmount;
      await user.save();

      res.json({ message: "Withdrawal successful", newBalance: user.amount });
  } catch (error) {
      console.error("Withdraw Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
});