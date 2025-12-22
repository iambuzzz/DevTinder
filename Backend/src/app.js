const express = require("express");
const dbConnect = require("./config/dbConnect");
const User = require("./models/user");
const app = express();

const start = async () => {
  try {
    await dbConnect();
    app.listen(3000, () => {
      console.log("Server running on port 3000...");
    });
  } catch (err) {
    console.error("Startup failed", err);
  }
};

start();

app.post("/signup", async (req, res) => {
  const user = new User({
    firstName: "Ambuj",
    lastName: "Jaiswal",
    emailId: "ambuj123@gmail.com",
    password: "ambuj123",
    age: 19,
    gender: "male",
    mobileNo: "1234567890",
  });
  try {
    await user.save();
    console.log(user);
    res.send("User added Succesfully");
  } catch (err) {
    console.log(err);
    res.status(400).send("Some error Occurred...\n" + err.message);
  }
});
