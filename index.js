const express = require("express");
require("dotenv").config();
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary");
const compression = require("compression");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/dbConfig");

const userRouter = require("./routes/userRoute");
const productRouter = require("./routes/productRoute");
const categoryRouter = require("./routes/categoryRoute");
const orderRouter = require("./routes/orderRoute");

connectDB();

//cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const port = process.env.PORT;

app.use(morgan("dev"));
app.use(compression());
app.use(cors());
app.use(cookieParser());
app.use(helmet());
app.use(mongoSanitize());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRouter);
app.use("/product", productRouter);
app.use("/category", categoryRouter);
app.use("/order", orderRouter);

app.get("/", (req, res) => {
  return res.status(200).send("<h1>Welcome To Node Server</h1>");
});

app.listen(port, () => {
  console.log(`mongodb is connected on server :${port}`);
});
