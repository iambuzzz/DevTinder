const express = require("express");
const dbConnect = require("./config/dbConnect");
const User = require("./models/user");
const app = express();
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const auth = require("./middlewares/auth.js");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const http = require("http");
// require("./utils/cronjob");
// NODE_ENV ke basis par file path decide karo
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
// Specific path se config load karo
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });
console.log("Loaded env file:", envFile);

const {
  validateSignupData,
  validateLoginData,
} = require("./utils/validate.js");

const authRouter = require("./routes/authRouter.js");
const profileRouter = require("./routes/profileRouter.js");
const requestRouter = require("./routes/requestRouter.js");
const userRouter = require("./routes/userRouter.js");
const paymentRouter = require("./routes/paymentRouter.js");
const { initializeSocket } = require("./utils/socket.js");
const chatRouter = require("./routes/chatRouter.js");

const start = async () => {
  try {
    await dbConnect();
    server.listen(3000, () => {
      console.log("Server running on port 3000...");
    });
  } catch (err) {
    console.error("Startup failed", err);
  }
};

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://iambuzzdev.in",
      "http://13.48.58.37",
      "https://13.48.58.37",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);

const server = http.createServer(app);
initializeSocket(server);

start();

//------------------------------------------------------------------------

// express.json() converts raw JSON → JS object
//whatever request comes, if it is coming in json format, express converts it to js-object
//just checking the collection(adding the document)
//Express does NOT parse JSON by default

//post api to add documents in db -> inserting documents
// app.post("/signup", async (req, res) => {
//   // 1) creating new instance of User model (manual testing)
//   //   const user = new User({ // js-object
//   //     firstName: "Ambuj",
//   //     lastName: "Jaiswal",
//   //     emailId: "ambuj123@gmail.com",
//   //     password: "ambuj123",
//   //     age: 19,
//   //     gender: "male",
//   //     mobileNo: "1234567890",
//   //   });

//   // 2) taking data through api (req.body = data sent)
//   //   const user = new User(req.body); //✅
//   // internally -: (Postman → Body → raw → JSON) -> Client sends HTTP POST with JSON body -> express.json() parses it -> req.body becomes JS-object
//   // ❌ WHAT IF YOU FORGET express.json()?
//   // console.log(req.body); -> Output:undefined -> Then: new User(req.body); -> 💥 Error: User validation failed

//   // 3) 🔴 SECURITY WARNING (VERY IMPORTANT) ❌ Never trust client input directly
//   // Right now: new User(req.body);
//   // Client can send:{"isAdmin": true}
//   //✅ SAFER WAY -> WHITELIST FIELDS
//   // const { firstName, lastName, emailId, password, age, gender, mobileNo } =
//   //   req.body;
//   // const safeUser = {
//   //   firstName,
//   //   lastName,
//   //   emailId,
//   //   password,
//   //   age,
//   //   gender,
//   //   mobileNo,
//   // };
//   // const user = new User(safeUser);

//   // //saving data to db
//   // try {
//   //   await user.save();
//   //   console.log(user);
//   //   res.send("User added Succesfully");
//   // } catch (err) {
//   //   console.log(err);
//   //   res.status(400).send("Some error Occurred...\n" + err.message);
//   // }

//   try {
//     const { firstName, lastName, emailId, password, age, gender, mobileNo } =
//       req.body;
//     // Validate input (may throw)
//     validateSignupData(req);
//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     // Create user
//     const user = new User({
//       firstName,
//       lastName,
//       emailId,
//       password: hashedPassword,
//       age,
//       gender,
//       mobileNo,
//     });
//     // 4️⃣ Save to DB
//     await user.save();
//     console.log("User created:", user._id);
//     res.status(201).send("Signup successful");
//   } catch (err) {
//     console.error("Signup error:", err.message);
//     // Duplicate email error
//     if (err.code === 11000) {
//       return res.status(409).send("Email already registered");
//     }
//     // Other validation / server errors
//     res.status(400).json({
//       message: "Signup failed",
//       error: err.message,
//     });
//   }
// });

// api to insert documents in db
app.post("/insertUsers", async (req, res) => {
  //   // insertOne() ❌ (LOW LEVEL – AVOID)
  //   // Code:
  //   // await User.collection.insertOne({
  //   //   firstName: "Ambuj",
  //   //   emailId: "ambuj@gmail.com"
  //   // });
  //   // What happens :❌ NO validation❌ NO middleware❌ NO defaults
  //   // Use when: ✔ Bulk imports , ✔ Seed scripts
  //   // 🚫 Never use for user signup
  //   //insertMany()->(BULK INSERT)
  //   try {
  //     const pass1 = await bcrypt.hash("Riya@123", 10);
  //     const pass2 = await bcrypt.hash("Ambuj@123", 10);
  //     const pass3 = await bcrypt.hash("Bhavya@123", 10);
  //     const pass4 = await bcrypt.hash("Radhika@123", 10);
  //     const pass5 = await bcrypt.hash("Bhavna@123", 10);
  //     const pass6 = await bcrypt.hash("Kavita@123", 10);
  //     const pass7 = await bcrypt.hash("Isha@123", 10);
  //     const pass8 = await bcrypt.hash("Yashasvi@123", 10);
  //     const pass9 = await bcrypt.hash("Renu@123", 10);
  //     const pass10 = await bcrypt.hash("Vinita@123", 10);
  //     const result = await User.insertMany([
  //       {
  //         firstName: "Riya",
  //         lastName: "Maurya",
  //         emailId: "riyamaurya@gmail.com",
  //         password: pass1,
  //         age: 22,
  //         gender: "female",
  //         mobileNo: "9000000001",
  //         skillsOrInterests: [
  //           "upsc",
  //           "si",
  //           "socialmedia",
  //           "beautiful",
  //           "fashion",
  //           "hindi",
  //         ],
  //       },
  //       {
  //         firstName: "Ambuj",
  //         lastName: "Jaiswal",
  //         emailId: "ambujjaiswal@gmail.com",
  //         password: pass2,
  //         age: 23,
  //         gender: "male",
  //         mobileNo: "9000000002",
  //         skillsOrInterests: [
  //           "webdevlopment",
  //           "commpetitiveprogramming",
  //           "dsa",
  //           "problemsolving",
  //           "java",
  //           "javascript",
  //           "cricket",
  //           "sports",
  //           "singing",
  //           "beautiful",
  //         ],
  //       },
  //       {
  //         firstName: "Bhavya",
  //         lastName: "Jain",
  //         emailId: "bhavyajain@gmail.com",
  //         password: pass3,
  //         age: 21,
  //         gender: "female",
  //         mobileNo: "9000000003",
  //         skillsOrInterests: [
  //           "buisness",
  //           "socialmedia",
  //           "art",
  //           "decoration",
  //           "fashion",
  //           "beautiful",
  //         ],
  //       },
  //       {
  //         firstName: "Radhika",
  //         lastName: "Sharma",
  //         emailId: "radhikasharma@gmail.com",
  //         password: pass4,
  //         age: 29,
  //         gender: "female",
  //         mobileNo: "9000000004",
  //         skillsOrInterests: [
  //           "literature",
  //           "english",
  //           "buisness",
  //           "speaking",
  //           "teacher",
  //           "beautiful",
  //         ],
  //       },
  //       {
  //         firstName: "Bhavna",
  //         lastName: "Meemroth",
  //         emailId: "bhavnameemroth@gmail.com",
  //         password: pass5,
  //         age: 21,
  //         gender: "female",
  //         mobileNo: "9000000005",
  //         skillsOrInterests: [
  //           "webdevlopment",
  //           "cpp",
  //           "dsa",
  //           "beautiful",
  //           "mern",
  //           "javascript",
  //           "badminton",
  //           "sports",
  //         ],
  //       },
  //       {
  //         firstName: "Kavita",
  //         lastName: "Singh",
  //         emailId: "kavita@gmail.com",
  //         password: pass6,
  //         age: 23,
  //         gender: "female",
  //         mobileNo: "9000000006",
  //         skillsOrInterests: [
  //           "english",
  //           "speaking",
  //           "beautiful",
  //           "cute",
  //           "hot",
  //           "sexy",
  //           "dancing",
  //           "singing",
  //         ],
  //       },
  //       {
  //         firstName: "Isha",
  //         lastName: "Tripathi",
  //         emailId: "ishatripathi@gmail.com",
  //         password: pass7,
  //         age: 32,
  //         gender: "female",
  //         mobileNo: "9000000007",
  //         skillsOrInterests: [
  //           "management",
  //           "leadership",
  //           "reading",
  //           "yoga",
  //           "traveling",
  //           "cooking",
  //         ],
  //       },
  //       {
  //         firstName: "Yashasvi",
  //         lastName: "Yadav",
  //         emailId: "yashasviyadav@gmail.com",
  //         password: pass8,
  //         age: 21,
  //         gender: "female",
  //         mobileNo: "9000000008",
  //         skillsOrInterests: [
  //           "python",
  //           "datascience",
  //           "machinelearning",
  //           "swimming",
  //           "music",
  //           "coding",
  //         ],
  //       },
  //       {
  //         firstName: "Renu",
  //         lastName: "Rawal",
  //         emailId: "renurawal@gmail.com",
  //         password: pass9,
  //         age: 20,
  //         gender: "female",
  //         mobileNo: "9000000009",
  //         skillsOrInterests: [
  //           "graphicdesign",
  //           "sketching",
  //           "photography",
  //           "creative",
  //           "editing",
  //           "movies",
  //         ],
  //       },
  //       {
  //         firstName: "Vinita",
  //         lastName: "Jangra",
  //         emailId: "vinitajangra@gmail.com",
  //         password: pass10,
  //         age: 19,
  //         gender: "female",
  //         mobileNo: "9000000010",
  //         skillsOrInterests: [
  //           "marketing",
  //           "contentwriting",
  //           "blogging",
  //           "socialmedia",
  //           "fitness",
  //           "dance",
  //         ],
  //       },
  //     ]);
  //     console.log("Users inserted successfully:", result.length, "\n", result);

  //     res.status(201).json({
  //       message: "Users inserted successfully",
  //       insertedCount: result.length,
  //     });
  //   } catch (err) {
  //     console.error("InsertMany error:", err.message);

  //     res.status(400).json({
  //       message: "Failed to insert users",
  //       error: err.message,
  //     });
  //   }
  try {
    const commonPass = await bcrypt.hash("Password@123", 10);

    const result = await User.insertMany([
      {
        firstName: "Vikram",
        lastName: "Rathore",
        emailId: "vikram.cyber@gmail.com",
        password: commonPass,
        age: 22,
        gender: "male",
        mobileNo: "9876543220",
        skillsOrInterests: [
          "Ethical Hacking",
          "Python",
          "Linux",
          "Metasploit",
          "Cybersecurity",
          "Networking",
        ],
        about:
          "B.Tech CSE | OSCP Aspirant | CTF Player. I find bugs and secure systems. Deeply interested in penetration testing and network security. Let's connect if you're into InfoSec!",
      },
      {
        firstName: "Kritika",
        lastName: "Menon",
        emailId: "kritika.flutter@gmail.com",
        password: commonPass,
        age: 21,
        gender: "female",
        mobileNo: "9876543221",
        skillsOrInterests: [
          "Flutter",
          "Dart",
          "Firebase",
          "App Development",
          "GetX",
          "UI/UX",
        ],
        about:
          "Final Year Student | Flutter Developer | Building cross-platform mobile apps with smooth 60fps animations. Published 3 apps on Play Store. Looking for backend devs to collaborate on startup ideas!",
      },
      {
        firstName: "Sameer",
        lastName: "Azad",
        emailId: "sameer.oss@gmail.com",
        password: commonPass,
        age: 20,
        gender: "male",
        mobileNo: "9876543222",
        skillsOrInterests: [
          "Git",
          "GitHub",
          "C++",
          "JavaScript",
          "Open Source",
          "Documentation",
        ],
        about:
          "CSE Sophomore | GSoC Contributor | Open Source Evangelist. Contributed to major repos like React and Kubernetes. I believe in community-driven code. Let's discuss open-source culture!",
      },
      {
        firstName: "Arushi",
        lastName: "Tiwari",
        emailId: "arushi.data@gmail.com",
        password: commonPass,
        age: 21,
        gender: "female",
        mobileNo: "9876543223",
        skillsOrInterests: [
          "SQL",
          "PySpark",
          "Hadoop",
          "Data Engineering",
          "ETL",
          "Big Data",
        ],
        about:
          "B.Tech CSE | Aspiring Data Engineer | I love playing with massive datasets. Working on ETL pipelines and data warehousing projects. Let's talk about Big Data architecture!",
      },
      {
        firstName: "Dev",
        lastName: "Kashyap",
        emailId: "dev.swift@gmail.com",
        password: commonPass,
        age: 21,
        gender: "male",
        mobileNo: "9876543224",
        skillsOrInterests: [
          "Swift",
          "SwiftUI",
          "iOS Development",
          "Xcode",
          "Combine",
          "CoreData",
        ],
        about:
          "3rd Year CSE | iOS Developer | Building premium Apple Ecosystem apps. Passionate about clean architecture and SwiftUI. If you're an Apple fanboy/girl, we should definitely connect!",
      },
      {
        firstName: "Prisha",
        lastName: "Goel",
        emailId: "prisha.web3@gmail.com",
        password: commonPass,
        age: 19,
        gender: "female",
        mobileNo: "9876543225",
        skillsOrInterests: [
          "Solidity",
          "Hardhat",
          "Truffle",
          "Ethers.js",
          "Web3",
          "Polygon",
        ],
        about:
          "Sophomore @ CSE | Smart Contract Dev | Building the future of finance on Polygon. Currently participating in global Hackathons. Always looking for a tech stack to disrupt the status quo!",
      },
      {
        firstName: "Rishabh",
        lastName: "Pandey",
        emailId: "rishabh.sys@gmail.com",
        password: commonPass,
        age: 22,
        gender: "male",
        mobileNo: "9876543226",
        skillsOrInterests: [
          "System Design",
          "Microservices",
          "Go",
          "Redis",
          "Distributed Systems",
          "SQL",
        ],
        about:
          "Final Year B.Tech | High-scalability Nerd | Building systems that can handle millions of requests. Love reading whitepapers on distributed databases. Hit me up for a technical deep dive!",
      },
      {
        firstName: "Nandini",
        lastName: "Sethi",
        emailId: "nandini.ml@gmail.com",
        password: commonPass,
        age: 21,
        gender: "female",
        mobileNo: "9876543227",
        skillsOrInterests: [
          "NLP",
          "PyTorch",
          "Python",
          "MLOps",
          "Scikit-Learn",
          "Data Viz",
        ],
        about:
          "B.Tech CSE | ML Engineer | Specialized in Natural Language Processing. Building chatbots that actually feel human. Currently working on fine-tuning LLMs. Let's exchange papers!",
      },
      {
        firstName: "Aryan",
        lastName: "Mehra",
        emailId: "aryan.mern@gmail.com",
        password: commonPass,
        age: 20,
        gender: "male",
        mobileNo: "9876543228",
        skillsOrInterests: [
          "Next.js",
          "TypeScript",
          "Prisma",
          "PostgreSQL",
          "Tailwind",
          "FullStack",
        ],
        about:
          "CSE Junior | Full Stack Wizard | Transforming complex requirements into elegant code. Ship fast, break nothing. Working on a real-time collaborative tool. Let's build something epic!",
      },
      {
        firstName: "Sanya",
        lastName: "Malhotra",
        emailId: "sanya.cloud@gmail.com",
        password: commonPass,
        age: 21,
        gender: "female",
        mobileNo: "9876543229",
        skillsOrInterests: [
          "Google Cloud",
          "GCP",
          "Serverless",
          "Firebase",
          "Functions",
          "Cloud Security",
        ],
        about:
          "3rd Year CSE | Cloud Certified | Building serverless architectures that scale to infinity. Firebase expert and GCP enthusiast. Let's connect if you want to move your app to the cloud!",
      },
    ]);

    res.status(201).json({
      message: "10 more Diverse Tech Users inserted successfully",
      insertedCount: result.length,
    });
  } catch (err) {
    res.status(400).json({ message: "Failed", error: err.message });
  }
});

// get api to get documents -> requesting data from db
// app.get("/users", async (req, res) => {
//   const users = await User.find(); //it will give all the data of that collection, returns array of documents if any, else return empty array [].
//   // res.send(users);

//   const maleUsers = await User.find({ gender: "male", firstName: "Ambuj" }); //expect more than one documents that are matching.
//   // if we get empty data then there is a way to handle it.
//   // we can not do -> if(!users){ ... } // because users is there [] empty.
//   //corect way is :
//   //   if (maleUsers.length === 0) {
//   //     console.log("no match found...");
//   //     res.send(users);
//   //   } else {
//   //     console.log(maleUsers);
//   //     res.send(maleUsers);
//   //   }

//   // findOne() — FETCH SINGLE DOCUMENT -> returns single object if present OR null -> use when You expect at most one document
//   //   const user = await User.findOne({ emailId: "riya123@gmail.com" });
//   //   if (!user) {
//   //     console.log("Not found");
//   //     res.send("Not found");
//   //   } else {
//   //     console.log(user);
//   //     res.send(user);
//   //   }

//   // findById() — FETCH BY _id -> returns a object or null
//   //   const user1 = await User.findById(req.body.id);
//   //   if (!user1) {
//   //     console.log("Not found");
//   //     res.send("Not found");
//   //   } else {
//   //     console.log(user1);
//   //     res.send(user1);
//   //   }

//   //select() — FETCH SPECIFIC FIELDS
//   //   const selectData = await User.find().select("firstName emailId");
//   //   console.log(selectData);
//   //   res.send(selectData);
//   //   // exclude password
//   //   const selectData2 = await User.find().select("-password");
//   //   console.log(selectData2);

//   // limit() & skip() — PAGINATION -> limit number of results and skip is no. of documents skiped from top
//   //   const newUsers = await User.find().skip(2).limit(2);
//   //   res.send(newUsers);
//   //   console.log(newUsers);

//   // sort() — ORDER RESULTS -1=descending, 1=ascending
//   const sortedUsers = await User.find().sort({ firstName: -1 });
//   res.send(sortedUsers);

//   // countDocuments() — COUNT RESULTS -> return number
//   const count = await User.countDocuments({ gender: "male" });
//   console.log("Number of males : " + count);

//   //exists() — CHECK EXISTENCE (FAST than findOne) -> return object with object id matched, else null
//   const exists = await User.exists({ emailId: req.body.emailId });
//   console.log(exists);

//   //lean() — RETURN PLAIN JS OBJECT (IMPORTANT) -> returns Plain JS Object, Faster because it has No methods, without lean() it returns mongoose document which is heavy as it has methods. Use when ✔ Read-only data ✔ Performance critical APIs
//   const plainUser = await User.find().lean().limit(1);
//   console.log(plainUser);

//   // QUERY EXECUTION (IMPORTANT CONCEPT)
//   // const query = User.find({ age: { $gt: 18 } }); Only This does NOT hit DB yet.
//   //DB call happens when: -> await query; OR -> query.exec();

//   //insertOne() and insertMany()
// });

// PUT replaces the entire resource, while PATCH partially updates the resource.
// patch api to update existing documents
// app.patch("/updateUsers", async (req, res) => {
//   // // save() FOR UPDATE (BEST PRACTICE)
//   // const user = await User.findById(id);
//   // user.age = 25;
//   // await user.save();

//   const { id, ...data } = req.body;
//   try {
//     const user = await User.findByIdAndUpdate(id, data, {
//       new: true,
//       runValidators: true,
//     }); //this will return new updated document, by default if u dont pass new:true, it is false which return old document(before updation) and enforce schema validation, as by default it is false.
//     console.log(user);
//     res.send("user updated successfully\n" + user);
//   } catch (err) {
//     console.log(err);
//     res.status(404).send("some error occured\n" + err.message);
//   }
// });
// patch api to update document using updateOne() -> (NO DOCUMENT RETURN)
// app.patch("/updateOneUser", async (req, res) => {
//   console.log(req.body);
//   const { emailId, mobileNo, ...data } = req.body;
//   try {
//     const user = await User.updateOne({ emailId, mobileNo }, { $set: data });
//     if (user.matchedCount === 0) {
//       console.log("Failed:Not matched!❌");
//       return res.status(401).send("filters does not match");
//     } else {
//       res.send("updated successfully");
//       console.log("done!!");
//     }
//   } catch (err) {
//     console.log("some error occured\n" + err.message);
//     res.status(404).send("some error occured\n" + err.message);
//   }
// });
// updateMany() (BULK UPDATE)
// app.patch("/updateManyUsers", async (req, res) => {
//   const list = await User.updateMany(
//     { gender: "female" },
//     { $set: { age: 21 } }
//   );
//   try {
//     if (list.matchedCount === 0) {
//       res.status(401).send("error occured : no match found");
//       console.log("no match found");
//     } else {
//       res.send("updated successfully : " + list.modifiedCount);
//       console.log("updated successfully : " + list.modifiedCount);
//     }
//   } catch (err) {
//     res.status(400).send("some error occured : " + err.message);
//     console.log("some error occured : " + err.message);
//   }
// });

//delete api -> to delete documents
// app.delete("/deleteUser", async (req, res) => {
//   // 1) findByIdAndDelete()
//   try {
//     const user = await User.findByIdAndDelete(req.body.id); // returns deleted document or null if not found
//     if (user != null) {
//       res.send("deleted successfully : " + user);
//       console.log("deleted successfully : " + user);
//     } else {
//       res.send("no match found");
//       console.log("no match found");
//     }
//   } catch (err) {
//     res.status(400).send("something went wrong!! : " + err.message);
//     console.log("something went wrong!! : " + err.message);
//   }

//   // 2) const result = await User.deleteOne({ emailId: "radhika123@gmail.com" }); // returns : { deletedCount: 1 }
//   // try {
//   //   const result = await User.deleteOne({ emailId: "radhika123@gmail.com" }); // returns deleted document or null if not found
//   //   if (result != null) {
//   //     res.send("deleted successfully : " + result.deletedCount);
//   //     console.log("deleted successfully : " + result.deletedCount);
//   //   } else {
//   //     res.send("no match found");
//   //     console.log("no match found");
//   //   }
//   // } catch (err) {
//   //   res.status(400).send("something went wrong!! : " + err.message);
//   //   console.log("something went wrong!! : " + err.message);
//   // }
//   // 3) const result2 = await User.deleteMany({ gender: "female" });
//   // try {
//   //   const result = await User.deleteMany({ gender: "female" });
//   //   if (result != null) {
//   //     res.send("deleted successfully : " + result.deletedCount);
//   //     console.log("deleted successfully : " + result.deletedCount);
//   //   } else {
//   //     res.send("no match found");
//   //     console.log("no match found");
//   //   }
//   // } catch (err) {
//   //   res.status(400).send("something went wrong!! : " + err.message);
//   //   console.log("something went wrong!! : " + err.message);
//   // }

//   //   //🔴 SOFT DELETE (INTERVIEW FAVORITE)
//   // //Instead of deleting data:
//   // await User.findByIdAndUpdate(id, {
//   //   isDeleted: true
//   // });
//   // //Why? Data recovery, Audit logs, Legal compliance
//   // //🔥 Most companies prefer soft delete
// });

//login api
// app.post("/login", async (req, res) => {
//   const { emailId, password } = req.body;
//   try {
//     validateLoginData(req);
//     const user = await User.findOne({ emailId });
//     if (!user) {
//       console.log("email not found");
//       return res.status(401).send("Invalid credentials");
//     } else {
//       const isMatch = user.isPasswordCorrect(password);
//       if (!isMatch) {
//         console.log("wrong password!");
//         return res.status(401).send("Invalid credentials");
//       } else {
//         // Create JWT
//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//           expiresIn: "7d",
//         });
//         console.log("Login successful");
//         // Send cookie
//         res.cookie("authToken", token, {
//           httpOnly: true, // ❗ JS can't access (protects from XSS)
//           secure: true, // ❗ Only HTTPS in production
//           sameSite: "strict", // ❗ Prevents CSRF
//           expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//         });
//         return res.send("Login successful");
//       }
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(400).send(err.message);
//   }
// });

//api to access his profile - allowed only when signed in

// app.get("/profile", auth, async (req, res) => {
//   const user = req.user;
//   try {
//     console.log("Profile accessed:", req.user.emailId);
//     res.status(200).send(user);
//   } catch (err) {
//     console.error("Profile error:", err.message);
//     res.status(500).send("Something went wrong");
//   }
// });

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong on the server",
    error: err.message,
  });
});
