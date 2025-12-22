const express = require("express");
const dbConnect = require("./config/dbConnect");
const User = require("./models/user");
const app = express();

//connect to database/cluster and start the server after that.
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

app.use(express.json()); //whatever request comes, if it is coming in json format, express converts it to js-object
//just checking the collection(adding the document)
//Express does NOT parse JSON by default
// express.json() converts raw JSON → JS object

//post api to add documents in db
app.post("/signup", async (req, res) => {
  // 1) creating new instance of User model (manual testing)
  //   const user = new User({ // js-object
  //     firstName: "Ambuj",
  //     lastName: "Jaiswal",
  //     emailId: "ambuj123@gmail.com",
  //     password: "ambuj123",
  //     age: 19,
  //     gender: "male",
  //     mobileNo: "1234567890",
  //   });

  // 2) taking data through api (req.body = data sent)
  //   const user = new User(req.body); //✅
  // internally -: (Postman → Body → raw → JSON) -> Client sends HTTP POST with JSON body -> express.json() parses it -> req.body becomes JS-object
  // ❌ WHAT IF YOU FORGET express.json()?
  // console.log(req.body); -> Output:undefined -> Then: new User(req.body); -> 💥 Error: User validation failed

  // 3) 🔴 SECURITY WARNING (VERY IMPORTANT) ❌ Never trust client input directly
  // Right now: new User(req.body);
  // Client can send:{"isAdmin": true}
  //✅ SAFER WAY -> WHITELIST FIELDS
  const { firstName, lastName, emailId, password, age, gender, mobileNo } =
    req.body;
  const safeUser = {
    firstName,
    lastName,
    emailId,
    password,
    age,
    gender,
    mobileNo,
  };
  const user = new User(safeUser);

  //saving data to db
  try {
    await user.save();
    console.log(user);
    res.send("User added Succesfully");
  } catch (err) {
    console.log(err);
    res.status(400).send("Some error Occurred...\n" + err.message);
  }
});

// requesting data from db
app.get("/users", async (req, res) => {
  const users = await User.find(); //it will give all the data of that collection, returns array of documents if any, else return empty array [].
  // res.send(users);

  const maleUsers = await User.find({ gender: "male", firstName: "Ambuj" }); //expect more than one documents that are matching.
  // if we get empty data then there is a way to handle it.
  // we can not do -> if(!users){ ... } // because users is there [] empty.
  //corect way is :
  //   if (maleUsers.length === 0) {
  //     console.log("no match found...");
  //     res.send(users);
  //   } else {
  //     console.log(maleUsers);
  //     res.send(maleUsers);
  //   }

  // findOne() — FETCH SINGLE DOCUMENT -> returns single object if present OR null -> use when You expect at most one document
  //   const user = await User.findOne({ emailId: "riya123@gmail.com" });
  //   if (!user) {
  //     console.log("Not found");
  //     res.send("Not found");
  //   } else {
  //     console.log(user);
  //     res.send(user);
  //   }

  // findById() — FETCH BY _id -> returns a object or null
  //   const user1 = await User.findById(req.body.id);
  //   if (!user1) {
  //     console.log("Not found");
  //     res.send("Not found");
  //   } else {
  //     console.log(user1);
  //     res.send(user1);
  //   }

  //select() — FETCH SPECIFIC FIELDS
  //   const selectData = await User.find().select("firstName emailId");
  //   console.log(selectData);
  //   res.send(selectData);
  //   // exclude password
  //   const selectData2 = await User.find().select("-password");
  //   console.log(selectData2);

  // limit() & skip() — PAGINATION -> limit number of results and skip is no. of documents skiped from top
  //   const newUsers = await User.find().skip(2).limit(2);
  //   res.send(newUsers);
  //   console.log(newUsers);

  // sort() — ORDER RESULTS -1=descending, 1=ascending
  const sortedUsers = await User.find().sort({ firstName: -1 });
  res.send(sortedUsers);

  // countDocuments() — COUNT RESULTS -> return number
  const count = await User.countDocuments({ gender: "male" });
  console.log("Number of males : " + count);

  //exists() — CHECK EXISTENCE (FAST than findOne) -> return object with object id matched, else null
  const exists = await User.exists({ emailId: req.body.emailId });
  console.log(exists);

  //lean() — RETURN PLAIN JS OBJECT (IMPORTANT) -> returns Plain JS Object, Faster because it has No methods, without lean() it returns mongoose document which is heavy as it has methods. Use when ✔ Read-only data ✔ Performance critical APIs
  const plainUser = await User.find().lean().limit(1);
  console.log(plainUser);
});
