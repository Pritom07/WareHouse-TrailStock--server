# 🏔️ WareHouse-TrailStock--server

This is the **backend repository** for **TrailStock**, a hiking inventory management system.  
It provides a REST API with **JWT authentication, user management, inventory management, feedback via email (Nodemailer), and pagination support**.

---

## 📌 Frontend Repository

👉 [WareHouse-TrailStock--client](https://github.com/Pritom07/WareHouse-TrailStock--client)

## 📌 Overview

TrailStock backend is built using:

- **Node.js + Express.js** for server
- **MongoDB (Atlas)** as database
- **JWT + Cookies** for authentication
- **Nodemailer (Gmail + App Password)** for email feedback
- **CORS** configured for Netlify & local dev client

This server handles user accounts, inventory items, secure access via JWT, and provides email feedback functionality.

---

## 🛠️ Tech Stack

- 🟢 **Node.js + Express.js** – Server framework
- 🍃 **MongoDB Atlas** – Database
- 🔑 **JWT + Cookies** – Authentication
- 📧 **Nodemailer (Gmail App Password)** – Email service
- 🌐 **CORS** – Allow client requests
- 🍪 **Cookie-parser** – Manage cookies

---

## 🚀 Features

- 🔐 **JWT Authentication**

  - Token generation & verification using cookies
  - Logout support (clears token cookie)

- 👥 **User Management**

  - Create new users
  - Update user info (email / GitHub sign-in supported)
  - Patch user details (password, last sign-in, method)

- 📦 **Inventory Management**

  - Add new items
  - Update stock quantity
  - Reduce quantity & increase sold count
  - Pagination for large datasets
  - Delete items
  - Get single item details

- ✉️ **Feedback via Nodemailer**
  - Users can send feedback email to admin Gmail
  - Uses Gmail App Password authentication

---

## ⚙️ Middleware

### 🔑 Token Creation (`/jwt`)

```js
app.post("/jwt", async (req, res) => {
  const userEmail_userGithub = req.body;
  const token = jwt.sign(userEmail_userGithub, process.env.JWT_ACCESS_TOKEN, {
    expiresIn: "3h",
  });

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .send({ success: true });
});
```

### ✅ Token Verification

```js
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
```

### 🚪 Logout (/logout)

```js
app.post("/logout", async (req, res) => {
  res.clearCookie("token");
  res.send({ success: true });
});
```

---

## 📡 API Endpoints

### 🔑 Authentication

- `POST /jwt` → Generate JWT & set cookie
- `POST /logout` → Clear JWT cookie

### 👥 Users

- `POST /users` → Insert new user
- `PATCH /users` → Update password, last sign-in, method
- `PUT /users` → Upsert user (supports email & GitHub login)

### 📦 Inventory

- `GET /items` → Get first 8 items
- `POST /items` → Insert new inventory item
- `GET /inventoryDetails/:id` → Get details of single item
- `POST /items/:id` → Reduce quantity by 1, increase sold
- `PATCH /items/:id` → Increase quantity (stock update)
- `DELETE /item/:id` → Delete item by ID

### 📊 Pagination

- `GET /totalDoc` → Get total document count
- `GET /allinventories?page=X&size=Y&email=user@mail.com` → Paginated items filtered by email
- `GET /allinventories?page=X&size=Y&githubID=12345` → Paginated items filtered by GitHub ID

### ✉️ Feedback

# Sends email to admin Gmail using Nodemailer.

- `POST /feedbackSending`

```json
{
  "senderEmail": "user@example.com",
  "feedback": "This website is great!"
}
```

---

## 📂 Project Structure

```bash
.
├── index.js        # Main server file
├── package.json
├── .env            # Environment variables

```

---

## 🔑 Environment Variables

Create a `.env` file in the root with the following:

```env
DB_USER=yourMongoUser
DB_PASS=yourMongoPassword
JWT_ACCESS_TOKEN=yourSecretKey
USER_EMAIL=yourGmail@gmail.com
APP_PASS=yourAppPassword
```

---

## ▶️ Run Locally

```bash
# Clone repo
git clone https://github.com/Pritom07/WareHouse-TrailStock--server.git

# Install dependencies
npm install

# Start development server
nodemon index.js
```

---

## 🌍 Deployment

- **Backend:** [Vercel Live URL](https://warehouse-server-mu.vercel.app/)
- **Frontend:** [Netlify Live URL](https://trailstock-client.netlify.app/)
