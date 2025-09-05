require("dotenv").config();
const express = require("express");
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    app.patch("/users", async (req, res) => {
      const userData = req.body;
      const email = userData.email;
      const password = userData.password;
      const lastSignInTime = userData.lastSignInTime;
      const method = userData.method;
      const filter = { userEmail: email };
      const updateDoc = {
        $set: {
          password,
          lastSignInTime,
          method,
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/users", async (req, res) => {
      const userData = req.body;
      const name = userData.name;
      const email = userData?.email;
      const github_User_Id = userData?.github_User_Id;
      const photoURL = userData?.photoURL;
      const lastSignInTime = userData.lastSignInTime;
      const creationTime = userData.creationTime;
      const method = userData.method;

      let filter = {};
      if (email) {
        filter = { userEmail: email };
      } else if (github_User_Id) {
        filter = { github_User_Id };
      }

      const updateDoc = {
        $set: {
          name,
          userEmail: email || null,
          lastSignInTime,
          creationTime,
          method,
          photoURL,
          github_User_Id: github_User_Id || null,
        },
      };
      const options = { upsert: true };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/inventoryDetails/:id", async (req, res) => {
      const ID = req.params.id;
      const query = { _id: new ObjectId(ID) };
      const result = await inventoryItemsCollection.findOne(query);
      res.send(result);
    });

    app.post("/items/:id", async (req, res) => {
      const ID = req.params.id;
      const filter = { _id: new ObjectId(ID) };
      const desiredDocument = await inventoryItemsCollection.findOne(filter);
      const quantity = desiredDocument?.quantity;
      const sold = desiredDocument?.sold;
      let newQuantity = quantity;
      let newSold = sold;
      if (quantity <= 0) {
        return;
      } else {
        newQuantity = quantity - 1;
        newSold = sold + 1;
      }
      const updateDoc = {
        $set: {
          quantity: newQuantity,
          sold: newSold,
        },
      };
      const result = await inventoryItemsCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });

    app.patch("/items/:id", async (req, res) => {
      const ID = req.params.id;
      const Data = req.body.updatedStock;
      const filter = { _id: new ObjectId(ID) };
      const desiredData = await inventoryItemsCollection.findOne(filter);
      const quantity = desiredData.quantity;
      const updateDoc = {
        $set: {
          quantity: quantity + Data,
        },
      };
      const result = await inventoryItemsCollection.updateOne(
        filter,
        updateDoc
      );
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
