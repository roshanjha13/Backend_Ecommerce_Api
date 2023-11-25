const mongoose = require("mongoose");

const mongoDb = process.env.MONGO_URL;

const connectDB = async () => {
  const conn = await mongoose
    .connect(mongoDb)
    .then((res) => {
      console.log("mongodb is connected");
    })
    .catch((err) => {
      console.log(err.message);
    });
};

module.exports = connectDB;
