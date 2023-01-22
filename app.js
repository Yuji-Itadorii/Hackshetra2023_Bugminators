//Constants ***************************************************

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const port = 3000;
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const { on } = require("events");
const app = express();

// App Uses ***********************************************

app.use(
  session({
    secret: "AbhayRawat.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.set("view engine", "ejs");

//Mongoose Connection *******************************************************

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// mongoose Schema **********************************************************

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

const userDataSchema = new mongoose.Schema({
  email: String,
  first_name: String,
  last_name: String,
  address: String,
  address2: String,
  country: String,
  state: String,
  PIN: String,
});

const healthSchema = new mongoose.Schema({
  username: String,
  symptoms: String,
  injury: String,
  pain: String,
  tests: String,
  allegies: String,
  high_cholestrol: String,
  hbp: String,
  heart_problem: String,
  depression: String,
  diabetes: String,
  astma: String,
  smoke: String,
});

const DoctorSchema = new mongoose.Schema({
  email: String,
  first_name: String,
  last_name: String,
  address: String,
  Specilization : String,
  country: String,
  state: String,
  PIN: String,
  rating: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// mongosse Mondel **********************************************************

const User = new mongoose.model("User", userSchema);
const Userdata = new mongoose.model("Userdata", userDataSchema);
const Doctordata = new mongoose.model("Doctordata", DoctorSchema);
const HealthReport = new mongoose.model("HealthReport", healthSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// All Get Request **********************************************************

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  User.find({ secret: { $ne: null } }, (err, foundUsers) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      if (foundUsers) {
        res.render("secrets", { userWithSecrets: foundUsers });
      }
    }
  });
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
  res.redirect("/");
});

app.get("/healthform", (req, res) => {

  if(req.isAuthenticated()){
    res.render("patient_health");
  }
  else{
    res.redirect("/login");
  }

  
});


// app.get("/reports", (req, res) => {
    
//     HealthReport.find({ username : { $ne: null } }, (err, foundUsers) => {
//         if (err) {
//           console.log(err);
//           res.redirect("/login");
//         } else {
//           if (foundUsers) {
//             res.send(foundUsers);
//           }
//         }
//       });
// });

app.get("/doctors", (req, res) => {

    Doctordata.find({ email : { $ne: null } }, (err, foundUsers) => {
        if (err) {
          console.log(err);
          res.redirect("/login");
        } else {
          if (foundUsers) {
            if(req.isAuthenticated()){
              res.render("doctors", { docs: foundUsers });
            }
            else{
              res.redirect("/login");
            }
            
          }
        }
      });

});

app.get("/patient_reports", (req, res) => {

    HealthReport.find({ username : { $ne: null } }, (err, foundUsers) => {
        if (err) {
          console.log(err);
          res.redirect("/login");
        } else {
          if (foundUsers) {
            if(req.isAuthenticated()){
              res.render("reports", { docs: foundUsers });
            }
            else{
              res.redirect("/login");
            }
           
          }
        }
      });

});

// All Post Request **********************************************************

app.post("/landing", (req, res) => {
  const a = req.body.for_patient;
  const b = req.body.for_doctor;
  if (a == "on") {
    if (req.body.rbutton == "Register") {
      res.render("register");
    } else {
      res.render("login");
    }
  } else if (b == "on") {
    if (req.body.rbutton == "Register") {
      res.render("doctor_register");
    } else {
      res.render("login");
    }
  } else {
    console.log("Not choosen");
  }
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/login");
        });
      }
    }
  );

  const newUserData = new Userdata({
    email: req.body.username,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    address: req.body.address,
    address2: req.body.address2,
    country: req.body.country,
    state: req.body.state,
    PIN: req.body.PIN,
  });

  newUserData.save(function (err) {
    if (err) {
      console.log("Error in savinf user data!!");
    }
  });

  const DoctorUserData = new Doctordata({
    email: req.body.username,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    address: req.body.address,
    Specilization: req.body.Specilization,
    country: req.body.country,
    state: req.body.state,
    PIN: req.body.PIN,
    rating : "NA"
  });

  DoctorUserData.save(function (err) {
    if (err) {
      console.log("Error in savinf user data!!");
    }
  });
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  var FoundedUser = "none";

  Userdata.findOne({ email: req.body.username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        FoundedUser = foundUser;
      }
    }
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        const a = req.body.for_patient;
        const b = req.body.for_doctor;
        if (a == "on") {
          res.render("patient_dashbord", { P_Variable: FoundedUser });
        } else if (b == "on") {
          res.render("doctor_dashboard", { D_Variable: FoundedUser });
          //   console.log(FoundedUser.tim);
        } else {
          console.log("");
        }
      });
    }
  });
});

app.post("/submit", (req, res) => {
  const submitted_Text = req.body.secret;
  // console.log(req.user.id);
  // console.log(submitted_Text);
  User.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submitted_Text;
        foundUser.save(() => {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.post("/health", (req, res) => {


  var high_cholestrol ;
  var hbp;
  var heart_problem;
  var depression;
  var diabetes;
  var astma;
  var smoke;

  if(req.body.high_cholestrol == "on"){
     high_cholestrol = "YES";
  }
  else{
     high_cholestrol = "NO"
  }
  if(req.body.hbp == "on"){
     hbp = "YES";
  }
  else{
     hbp = "NO"
  }
  if(req.body.heart_problem == "on"){
     heart_problem = "YES";
  }
  else{
     heart_problem = "NO"
  }
  if(req.body.depression == "on"){
     depression = "YES";
  }
  else{
     depression = "NO"
  }
  if(req.body.diabetes == "on"){
     diabetes = "YES";
  }
  else{
     diabetes = "NO"
  }
  if(req.body.astma == "on"){
     astma = "YES";
  }
  else{
     astma = "NO"
  }
  if(req.body.smoke == "on"){
     smoke = "YES";
  }
  else{
     smoke = "NO"
  }
  
  



  const newReport = new HealthReport({
    username: req.body.username,
    symptoms: req.body.symptoms,
    injury: req.body.injury,
    pain: req.body.pain,
    tests: req.body.tests,
    allegies: req.body.allergies,
    high_cholestrol: high_cholestrol,
    hbp: hbp,
    heart_problem: heart_problem,
    depression: depression,
    diabetes: diabetes,
    astma: astma,
    smoke: smoke,
  });

  var FoundedUser = "none";

  Userdata.findOne({ email: req.body.username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        FoundedUser = foundUser;
      }
    }
  });

  newReport.save(function (err) {
    if (err) {
      console.log("Error in saving user data!!");
    } else {
        res.render("patient_dashbord", { P_Variable: FoundedUser });
    }
  });
});

// App Listening ************************************************************

app.listen(port, () => {
  console.log("Starting at http://localhost:3000");
});
