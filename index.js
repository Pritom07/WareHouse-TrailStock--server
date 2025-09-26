require("dotenv").config();
const express = require("express");
const app = express();
var cors = require("cors");
const nodemailer = require("nodemailer");
//JWT setup-1
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

//JWT setup-2
app.use(
  cors({
    origin: ["http://localhost:5173", "https://trailstock-client.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r5e76.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//JWT setup-3
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ message: "Token is not matched or expired" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const inventoryItemsCollection = client
      .db("HikingInventory")
      .collection("inventoryItems");

    const usersCollection = client.db("HikingInventory").collection("users");

    //JWT setup-4
    app.post("/jwt", async (req, res) => {
      const userEmail_userGithub = req.body;

      const token = jwt.sign(
        userEmail_userGithub,
        process.env.JWT_ACCESS_TOKEN,
        {
          expiresIn: "3h",
        }
      );

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        })
        .send({ success: true });
    });

    //JWT setup-5
    app.post("/logout", async (req, res) => {
      res.clearCookie("token");
      res.send({ success: true });
    });

    //Nodemailer configuration to send Email
    app.post("/feedbackSending", async (req, res) => {
      const { senderEmail, feedback } = req.body;

      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER_EMAIL, //use that email where 2-step verification is on and app password is created
          pass: process.env.APP_PASS,
        },
      });

      let mailOptions = {
        from: process.env.USER_EMAIL, //use that email where 2-step verification is on and app password is created
        to: process.env.USER_EMAIL, //destenation of the mail
        replyTo: senderEmail, //who is sending mail
        subject: `Feedback About our Website "trailstock"`,
        text: feedback,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          return res
            .status(500)
            .send({ message: "Email Sending failed", sent: false });
        } else {
          return res
            .status(200)
            .send({ message: "Email Sent Successfully", sent: true });
        }
      });
    });

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

    //Pagination code implemented here. Frontend--->Manageinventories.jsx

    app.get("/totalDoc", async (req, res) => {
      const result = await inventoryItemsCollection.estimatedDocumentCount();
      res.send(result);
    });

    app.get("/allinventories", verifyToken, async (req, res) => {
      const page = parseInt(req.query?.page) || 0;
      const size = parseInt(req.query?.size) || 0;
      const email = req.query?.email;
      const githubID = req.query?.githubID;

      let query = {};
      if (email && email !== "null" && email !== "undefined") {
        query = { addedByEmail: email };
      } else if (githubID && githubID !== "null" && githubID !== "undefined") {
        query = { githubID };
      }

      const cursor = inventoryItemsCollection
        .find(query)
        .skip(page * size)
        .limit(size);

      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/item/:id", async (req, res) => {
      const ID = req.params.id;
      const query = { _id: new ObjectId(ID) };
      const result = await inventoryItemsCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/items", async (req, res) => {
      const item = req.body;
      const result = await inventoryItemsCollection.insertOne(item);
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
