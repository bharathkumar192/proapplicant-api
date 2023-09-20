const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

require("dotenv").config();
// const bcrypt = require('bcrypt');
// schemas
const Owner = require("./models/owner_schema");
const Admin = require("./models/admin_schema");
const Customer = require("./models/cust_schema");
const Admit = require("./models/admitSchema");
const OtpModel = require("./models/otp");

// Getting University Names from Unversity1.xlsx excel workbook
const searchFile = XLSX.readFile(__dirname + "/University1.xlsx");
const search_sheet = searchFile.Sheets[searchFile.SheetNames[0]];
const searchJson = XLSX.utils.sheet_to_json(search_sheet);
// Getting Details for the selected university
// OS_Rankings
const searchFile1 = XLSX.readFile(__dirname + "/OS_Rankings.xlsx");
const search_sheet1 = searchFile1.Sheets[searchFile1.SheetNames[0]];
const searchJson1 = XLSX.utils.sheet_to_json(search_sheet1);

// Program Details
const searchFile2 = XLSX.readFile(__dirname + "/Programs.xlsx");
const search_sheet2 = searchFile2.Sheets[searchFile2.SheetNames[0]];
const searchJson2 = XLSX.utils.sheet_to_json(search_sheet2);
// US news Rankings
const searchFile3 = XLSX.readFile(__dirname + "/usnews.xlsx");
const search_sheet3 = searchFile3.Sheets[searchFile3.SheetNames[0]];
const searchJson3 = XLSX.utils.sheet_to_json(search_sheet3);
// THE Rankings
const searchFile4 = XLSX.readFile(__dirname + "/THE_Rank.xlsx");
const search_sheet4 = searchFile4.Sheets[searchFile4.SheetNames[0]];
const searchJson4 = XLSX.utils.sheet_to_json(search_sheet4);
console.log(searchJson);
let CouseNames = searchJson2
  .filter((item) => item.Name.toLowerCase())
  .map((val) => {
    return val["Course Name"];
  });
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3003;

function generateRandomNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

const OAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

OAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const sendOtp = async (number) => {
  try {
    let otp = Math.floor(Math.random() * 100000);
    let exists = await OtpModel.findOne({ phnum: number });
    if (exists) {
      exists.otp = otp;
      exists.createdAt = Date.now();
      exists.save();
    } else {
      let o = new OtpModel({ phnum: number, otp: otp, createdAt: Date.now() });
      o.save();
    }
    let response = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.API_KEY}&route=otp&variables_values=${otp}&flash=0&numbers=${number}`
    )
      .then((data) => data.json())
      .then((data) => data);
    return response;
  } catch {
    return { error: "Error in sending OTP" };
  }
};

const sendMail = async ({ cust_id, reference_id, email }) => {
  const ACCESS_TOKEN = await OAuth2Client.getAccessToken();
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAUTH2",
      user: "abhayrajeshshah@gmail.com",
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: ACCESS_TOKEN,
    },
  });
  const mailOptions = {
    from: "abhayrajeshshah@gmail.com",
    to: email,
    subject: "Welcome to Proapplicant.",
    text: "Thanks For Signing up to our page",
    html: `<h1>Thanks for Signing Up to Proapplicant</h1><p>Your Customer Id is <b> ${cust_id} </b></p><p>Your Referral Id is <b>${reference_id}</b></p><p>Contact Support : 9849291321,proapplicantsubs@gmail.com</p>`,
  };
  const result = await transport.sendMail(mailOptions);
  return result;
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

///////////////////////////////////// Verify Users ///////////////////////////////////
app.post("/verifyOtp", async (req, res) => {
  try {
    let { phnum, otp } = req.body;
    let otpBody = await OtpModel.findOneAndDelete({ phnum: phnum, otp: otp });
    if (otpBody) {
      res.json({ success: "Verified" });
    } else {
      return res.json({ error: "Otp Validation Failed" });
    }
  } catch {
    return res.json({ error: "Otp Validation Failed" });
  }
});

app.post("/sendOtp", async (req, res) => {
  let { phnum } = req.body;
  let response = await sendOtp(phnum);
  res.json(response);
});

///////////////////////////////////// Check if user is pro or not /////////////////////

app.get("/pro/:email", async (req, res) => {
  try {
    let user = await Customer.findOne({ email: req.params.email });
    if (
      user.subscriptions[`Tool_1`].expiryDate >
      user.subscriptions[`Tool_1`].joinedAt
    ) {
      return res.json({ pro: true });
    } else {
      return res.json({ pro: false });
    }
  } catch {
    return res.json({ error: "Could not get user details" });
  }
});

///////////////////////////////////// Soft Ban Users /////////////////////////////////

app.put("/softban/:id", async (req, res) => {
  try {
    const time = req.body.time;
    console.log(time);
    const id = req.params.id;
    const tool = req.body.tool;
    console.log(tool);
    let resp = await Customer.findById(id);
    resp.subscriptions[`${tool}`].joinedAt = time;
    console.log(resp);
    resp.save();
    res.json({ success: "blabla" });
  } catch {
    res.json({ error: "blabla" });
  }
});

//////////////////////////////////// Start Admits ///////////////////////////////////

app.get("/students", (req, res) => {
  Admit.find({ approved: true })
    .limit(100)
    .then((records) => {
      res.json(records);
    });
});

app.post("/query", (req, res) => {
  console.log(req.body);
  Admit.find(req.body.query)
    .limit(100)
    .then((records) => res.json(records));
});

app.get("/hints", async (req, res) => {
  let uni = await Admit.distinct("uni", {});
  let clg = await Admit.distinct("clg", {});
  let course = await Admit.distinct("course", {});
  let major = await Admit.distinct("major", {});
  res.json({ uni: uni, clg: clg, course: course, major: major });
});

////////////////////////////////////    START ADMINS   //////////////////////////////////////////////

// function to generate random 5 digit number
function generateRandomNumber() {
  return Math.floor(10000 + Math.random() * 90000);
}

// addUsers(usersToAdd);   // change details in usersToAdd and uncomment this line to add owners into DB

// function to add admins, call whenever required.
async function addAdmin(name, email, password) {
  const existingAdmin = await Admin.findOne({
    $or: [
      { email },
      { admin_id: name.substring(0, 4) + generateRandomNumber() },
    ],
  });

  if (existingAdmin) {
    throw new Error("An admin with the same email or admin_id already exists");
  }
  const newAdmin = new Admin({
    name,
    email,
    password,
    admin_id: "AD" + generateRandomNumber(),
  });
  console.log(newAdmin);
  await newAdmin.save();
  console.log(`Added Admin: ${newAdmin.name}`);
  return newAdmin;
}

app.get("/rejectAdmit/:id", async (req, res) => {
  try {
    await Admit.findByIdAndDelete(req.params.id);
    res.json({ success: "Deleted Successfully" });
  } catch {
    res.json({ error: "Could no delete record" });
  }
});

// route to add admin to the db
app.post("/add-admin", async (req, res) => {
  try {
    const { name, email, password, phnum } = req.body;
    const newAdmin = await addAdmin(name, email, password, phnum);
    res
      .status(201)
      .json({ message: "Admin added successfully", admin: newAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding the admin" });
  }
});

// Route to update admin details in the db
app.put("/update-admin/:adminId", async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const AdminData = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, AdminData, {
      new: true,
    });

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ message: "Admin updated successfully", admin: updatedAdmin });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the admin" });
  }
});

// const sampleAdminData = {
//   name: 'Sample Admin',
//   email: 'sampleadmin@example.com',
//   phnum: '9876543210',
//   status: true,
//   password: 'Admin_password' ,
// };

// addAdmin(sampleAdminData.name, sampleAdminData.email, sampleAdminData.phnum, sampleAdminData.status, sampleAdminData.password);

// toggle admin active status. changes between (true, false) "false" for "temporarily disabled" and "true" for "active"
// Create a route to toggle admin status by admin_id
app.post("/toggle-admin-status/:admin_id", async (req, res) => {
  try {
    const admin_id = req.params.admin_id;

    // Find the admin by admin_id
    const admin = await Admin.findOne({ admin_id });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Toggle the admin's status
    admin.status = !admin.status;
    await admin.save();

    res
      .status(200)
      .json({ message: "Admin status toggled successfully", admin });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while toggling admin status" });
  }
});

app.delete("/deleteAdmin/:id", async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: "Deleted Successfully" });
  } catch {
    res.json({ error: "Could not delete" });
  }
});

app.get("/getUser/:email", async (req, res) => {
  try {
    let user = await Customer.findOne({ email: req.params.email });
    let refs = await Customer.find({ referred_by: user.reference_id });
    res.json({ user: user, refs: refs });
  } catch {
    res.json({ error: "Could not find user" });
  }
});

app.put("/change-customer/:id", async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, req.body);
  } catch {
    res.json({ error: "Could not change customer" });
  }
  res.json({ success: "Edited Record Successfully." });
});

// get all admins names for register page.
app.get("/available-admins", async (req, res) => {
  try {
    const admins = await Admin.find({});
    console.log(admins);
    res.json(admins);
  } catch (error) {
    console.error("Error fetching available admins:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

////////////////////////////////////    END ADMINS    //////////////////////////////////////////////

////////////////////////////////////    START CUSTOMERS    //////////////////////////////////////////////

// POST route to add a new customer or customer signup/register page
app.post("/add-customer", async (req, res) => {
  try {
    const {
      cust_name,
      email,
      password,
      Reference,
      admin_name,
      phnum,
      intake,
      year,
    } = req.body;

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    // const firstThreeLetters = cust_name.slice(0, 3).toUpperCase();
    const firstThreeLetters = "PA";
    const cust_id = `${firstThreeLetters}${randomDigits}`;

    const randomDigits_ = Math.floor(100000 + Math.random() * 900000);
    const firstThreeLetters_ = cust_name.slice(0, 3).toUpperCase();
    const reference_id = `${firstThreeLetters_}${randomDigits_}`;

    console.log(
      "form details",
      cust_name,
      email,
      password,
      Reference,
      admin_name,
      phnum
    );

    // Check if the customer with the same email already exists
    const existingCustomerEmail = await Customer.findOne({ email });
    if (existingCustomerEmail) {
      return res
        .status(400)
        .json({ error: "A customer with the same email already exists" });
    }

    const existingCustomerPhnum = await Customer.findOne({ phnum });
    if (existingCustomerPhnum) {
      return res
        .status(400)
        .json({ error: "A customer with the Phone Number already exists" });
    }

    let referringCustomer = null;
    let referred_by = null;

    // Check if the referred_by code is provided
    if (Reference) {
      // Find the referring customer based on the referred_by code
      referringCustomer = await Customer.findOne({ reference_id: Reference });
      referred_by = referringCustomer["reference_id"];
      console.log("referring customers is ", referringCustomer["reference_id"]);
      if (!referringCustomer) {
        return res.status(400).json({ error: "Referring customer not found" });
      }
    }

    // Create a new customer instance
    const newCustomer = new Customer({
      cust_name,
      email,
      cust_id,
      password,
      reference_id,
      phnum,
      referred_by,
      year,
      intake,
    });

    // Save the new customer to the database
    await newCustomer.save();
    sendMail({
      cust_id: cust_id,
      reference_id: reference_id,
      email: email,
    }).then((response) => {
      console.log(response);
    });
    res.status(201).json(newCustomer); // Respond with the newly created customer
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while adding the customer" });
  }
});

////////////////////////////////////    END CUSTOMERS    //////////////////////////////////////////////

////////////////////////////////////    START LOGIN    //////////////////////////////////////////////

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Search in owner collection
    const owner = await Owner.findOne({ email: email, password });
    if (owner) {
      return res.json({ userType: "owner", user: owner });
    }

    // Search in admin collection
    const admin = await Admin.findOne({ email: email, password });
    if (admin) {
      return res.json({ userType: "admin", user: admin });
    }

    // Search in customer collection
    const customer = await Customer.findOne({ email: email, password });
    if (customer) {
      return res.json({ userType: "customer", username: customer.email });
    }

    // No match found
    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// /////////////////////////////      Adding new tool to the system ( for all users) ////////////////////////

app.post("/addNewTool", async (req, res) => {
  try {
    const newToolName = "newTool"; // Replace with the actual tool name

    // Find all customers
    const customers = await Customer.find();

    // Loop through customers and add the new tool subscription
    for (const customer of customers) {
      if (!customer.subscriptions[newToolName]) {
        customer.subscriptions[newToolName] = {
          joinedAt: "",
          proDaysLeft: 0, // Or any initial value
          expiryDate: "", // Or any initial value
        };

        await customer.save();
      }
    }

    return res.json({
      message: `Added ${newToolName} subscription to all customers`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////

//  find users based on tool who has a joining date of anykind.

app.get("/usersByTool/:toolName", async (req, res) => {
  try {
    const toolName = req.params.toolName;

    const usersWithJoiningDate = await Customer.find({
      [`subscriptions.${toolName}.proDaysLeft`]: { $ne: 0 },
      [`subscriptions.${toolName}`]: { $exists: true },
    });
    console.log(usersWithJoiningDate);
    return res.json(usersWithJoiningDate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/freeUsers/:toolName", async (req, res) => {
  const toolName = req.params.toolName;
  try {
    const freeUsers = await Customer.find({
      [`subscriptions.${toolName}.proDaysLeft`]: 0,
    });
    return res.json(freeUsers);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/emailUsers/:toolName", async (req, res) => {
  const toolName = req.params.toolName;
  try {
    let response = await Customer.find(
      { [`subscriptions.${toolName}.proDaysLeft`]: 0 },
      "email"
    );
    console.log(response);
    res.json(response);
  } catch {}
});

app.get("/user/:email", async (req, res) => {
  try {
    console.log();
    let response = await Customer.findOne({ email: req.params.email });
    res.json(response);
  } catch {}
});

app.get("/usersByAdmin/:admin_name", async (req, res) => {
  try {
    let response = await Customer.find({ admin_name: req.params.admin_name });
    res.json(response);
  } catch {
    res.json({ error: "No Customers Found" });
  }
});

//  deletes a user based on cust_id parameter and returns the status

app.delete("/deleteUser/:custId", async (req, res) => {
  try {
    const custId = req.params.custId;

    const deletedUser = await Customer.findOneAndDelete({ cust_id: custId });

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get cust_id based on email;

app.get("/getUserId/:email", async (req, res) => {
  const cust = await Customer.findOne({ email: req.params.email });
  if (!cust) {
    res.json({ error: "No User found with this email" });
  } else {
    res.json({ cust_id: cust.cust_id });
  }
});

// update user information based on cust_id

app.put("/editUser/:custId", async (req, res) => {
  // try {
  const custId = req.params.custId;
  const updateData = req.body; // Assuming the updated data is sent in the request body
  const Reference = req.body.referred_by;
  let referringCustomer;
  console.log(Reference);
  if (Reference !== "" && Reference !== undefined) {
    // Find the referring customer based on the referred_by code
    referringCustomer = await Customer.findOne({ reference_id: Reference });
    referred_by = referringCustomer["reference_id"];
    console.log("referring customers is ", referringCustomer["reference_id"]);
    if (!referringCustomer) {
      return res.status(400).json({ error: "Referring customer not found" });
    }
  }
  // Add the new customer to the referrals of the referring customer
  if (referringCustomer) {
    // Check if the referring customer has a valid referrals array before updating it
    if (referringCustomer.referrals) {
      referringCustomer.referrals.push(custId);
      await referringCustomer.save();
    }
  }

  if (updateData.admin_name) {
    const admin = await Admin.findOne({ name: updateData.admin_name });
    if (admin) {
      admin.customers.push(custId);
      await admin.save();
    }
  }
  console.log(custId);
  console.log(updateData);
  const updatedUser = await Customer.findOneAndUpdate(
    { cust_id: custId },
    updateData,
    { new: true }
  );

  if (!updatedUser) {
    console.log("Hi");
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(updatedUser);
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ error: "Internal server error" });
  // }
});

//////////////////////////////// GET NON APPROVED ADMITS ////////////////////////////////////

app.get("/nonApproved", async (req, res) => {
  let response = await Admit.find({ approved: false });
  res.json(response);
});

app.get("/approveAdmit/:id", async (req, res) => {
  try {
    let response = await Admit.findByIdAndUpdate(req.params.id, {
      approved: true,
    });
    res.json(response);
  } catch {
    res.json({ error: "Error " });
  }
});

app.post("/new", async (req, res) => {
  try {
    let query = req.body.query;
    delete query.uni;
    delete query.decision;
    let results = req.body.results;
    let docs = [];
    results.forEach((result) => {
      query["uni"] = result.name;
      query["decision"] = result.status ? "admitted" : "rejected";
      docs.push(query);
    });
    await Admit.insertMany(docs);
    res.json({ success: "Success" });
  } catch {
    res.json({ error: "Could not add User, Try Again" });
  }
});
// search University
app.get("/searchUniv", (req, res) => {
  try {
    let array = [];
    for (i of searchJson) {
      array.push(i.Name);
    }
    res.json({ data: array });
  } catch {
    res.status(500).json({ error: "Could not find university try again" });
  }
});
app.get("/getCourses/:name", async (req, res) => {
  try {
    let CouseNames = searchJson2
      .filter((item) =>
        item.Name.toLowerCase().includes(
          req.params.name.replace("%20", " ").toLowerCase()
        )
      )
      .map((val) => {
        return val["Course Name"];
      });
    res.json({ Names: CouseNames });
  } catch (error) {
    res.status(500).json({ err: error });
  }
});
app.get("/getUniversityData/:name", async (req, res) => {
  try {
    let OSRankings = searchJson1.filter((item) =>
      item.Name.toLowerCase().includes(
        req.params.name.replace("%20", " ").toLowerCase()
      )
    );
    let USRankings = searchJson3.filter((item) =>
      item.Name.toLowerCase().includes(
        req.params.name.replace("%20", " ").toLowerCase()
      )
    );
    let THERankings = searchJson4.filter((item) =>
      item.Name.toLowerCase().includes(
        req.params.name.replace("%20", " ").toLowerCase()
      )
    );
    let CoursesDetails = searchJson2.filter((item) =>
      item.Name.toLowerCase().includes(
        req.params.name.replace("%20", " ").toLowerCase()
      )
    );
    console.log(OSRankings);
    const res2 = await fetch(
      `https://geocode.maps.co/search?q=${req.params.name.toLowerCase()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((r) => r.json())
      .then((r) => {
        return r;
      });
    const res3 = await fetch(
      `https://geocode.maps.co/search?q=${
        USRankings[0].Address.split(",")[
          USRankings[0].Address.split(",").length - 2
        ]
      }}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((r) => r.json())
      .then((r) => {
        return r;
      });
    if (res3.length == 0) {
      const res3 = await fetch(
        `https://geocode.maps.co/search?q=${
          USRankings[0].Address.split(",")[
            USRankings[0].Address.split(",").length - 3
          ]
        }}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((r) => r.json())
        .then((r) => {
          return r;
        });
    }
    console.log(res3);
    let json = await fetch(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${res2[0].lat},${res2[0].lon}?unitGroup=metric&key=ALTC49LEQYCMGSZLTU6CS23MU`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        return res;
      });
    console.log(json);
    let json1 = await fetch(
      `https://api.waqi.info/feed/${
        USRankings[0].Address.split(",")[
          USRankings[0].Address.split(",").length - 2
        ]
      }/?token=ce487560a1930392e9ef0925c6230885ad66e4c6`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        return res;
      });
    if (json1.status !== "ok") {
      json1 = await fetch(
        `https://api.waqi.info/feed/${
          USRankings[0].Address.split(",")[
            USRankings[0].Address.split(",").length - 3
          ]
        }/?token=ce487560a1930392e9ef0925c6230885ad66e4c6`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((res) => res.json())
        .then((res) => {
          return res;
        });
    }
    let json2 = await fetch(
      "https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&q=" +
        USRankings[0].Address.split(",")[
          USRankings[0].Address.split(",").length - 3
        ] +
        "&sort=population&facet=country",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        return res;
      });
    if (json2.records.length == 0) {
      json2 = await fetch(
        "https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&q=" +
          USRankings[0].Address.split(",")[
            USRankings[0].Address.split(",").length - 2
          ] +
          "&sort=population&facet=country",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((res) => res.json())
        .then((res) => {
          return res;
        });
    }
    res.json({
      AQI: json1,
      QS_Rankings: OSRankings[0],
      USN_Rankings: USRankings[0],
      THE_Rankings: THERankings[0],
      ProgramDetails: CoursesDetails,
      Geography: res2,
      Weather: json,
      city: res3,
      Population: json2.records[0],
    });
  } catch (err) {
    res
      .status(500)
      .json({ Error: "Cant find the Details for this university" });
  }
});
