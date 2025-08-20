require("dotenv").config();
const express = require("express");
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r5e76.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const inventoryItemsCollection = client
      .db("HikingInventory")
      .collection("inventoryItems");

    const usersCollection = client.db("HikingInventory").collection("users");

    app.get("/items", async (req, res) => {
      const cursor = inventoryItemsCollection.find();
      const result = await cursor.skip(0).limit(8).toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const userData = req.body;
      const result = await usersCollection.insertOne(userData);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to WareHouse Inventory website");
});

app.listen(port);
