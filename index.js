const express = require("express");
const cors = require("cors");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-com"; //for security perpose you can save it inside a .env file also
const app = express();
require("./database/config");
const User = require("./database/user");
const Product = require("./database/product");

// app.get("/", (req, resp) => {
//   resp.send("app is working fine");
// });
// const connectDB = async () => {
//   mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");
//   const productSchema = new mongoose.Schema({});
//   const product = mongoose.model("products", productSchema);
//   const data = await product.find();
//   console.log(data);
// };
// connectDB();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  const user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      resp.send({
        result: "something went wrong please try again after some time",
      });
    }
    resp.send({ result, auth: token });
  });
});

app.post("/login", async (req, resp) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          resp.send({
            result: "something went wrong please try again after some time",
          });
        }
        resp.send({ user, auth: token });
      });
    } else {
      resp.send({
        result: "no user found,either incorrect password or email id",
      });
    }
  } else {
    resp.send({
      result: "no user found,insert all the fields",
    });
  }
});

app.post("/add-product", verifyToken, async (req, resp) => {
  const product = new Product(req.body);
  const result = await product.save();
  resp.send(result);
});

app.get("/products", verifyToken, async (req, resp) => {
  const products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "no product found" });
  }
});

app.delete("/products/:id", verifyToken, async (req, resp) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.put("/update/:id", verifyToken, async (req, resp) => {
  const result = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(result);
});

app.get("/search/:key", verifyToken, async (req, resp) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  resp.send(result);
});

function verifyToken(req, resp, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    console.log(token);
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp.status(401).send({ result: "please provide the valid token" });
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send({ result: "please provide the token" });
  }
}

app.listen(5000);
