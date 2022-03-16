require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");

const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const passportSetup = require("./passport/setup.js");

mongoose.Promise = Promise;
mongoose
  .connect(
    process.env.MONGODB_URI
  )
  .then(() => {
    console.log("Connected to Mongo!");
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();
if(process.env.ENV != "development"){
app.use(function(req, res, next){
  if(req.header('x-forwarded-proto') !== 'https'){
    res.redirect('https://' + req.header('host') + req.url);
  }else{
    next();
  }
})
}


// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res){
  res.sendfile('index.html', { root: path.join(__dirname, "public/landing") } );
});

app.use(express.static(path.join(__dirname, "public")));

app.use(
  cors({
    //receive cookies from other domains
    credentials: true,
    // these are the domains I want cookies (or any request) from
    //origin: ["http://localhost:4200"]
    origin: ["http://localhost:4100"]
  })
);

// Session setup should come after the CORS setup
app.use(
  session({
    secret: "blah blah blah",
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

// Passport setup should come after SESSION setup
passportSetup(app);

const authRouter = require("./routes/auth-router.js");
app.use("/api", authRouter);

const tripRouter = require("./routes/trip-router.js");
app.use("/api", tripRouter);

const matchesRouter = require("./routes/matches-router.js");
app.use("/api", matchesRouter);

const settingsRouter = require("./routes/settings.js");
app.use("/api", settingsRouter);

// AFTER your routes -> send the Angular HTML (instead of 404)
// uncommented to avoid 404 on refresh
app.use((req, res, next) => {
   res.sendFile(`${__dirname}/public/index.html`);
});

module.exports = app;
