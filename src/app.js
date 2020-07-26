import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose from "mongoose";

// import routes
import api from "./api";

const app = express();

//evn imports
require("dotenv").config();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "../public")));

const env = process.env.NODE_ENV;
const PORT = process.env.BACKEND_PORT;
let database = process.env.DB_HOST;

if (env === "development") {
  database = process.env.DB_HOST;
}

// Configuring the database
mongoose.Promise = global.Promise;

// Connecting to the database
mongoose
  .connect(database, {
    useNewUrlParser: true,
    reconnectTries: Number.MAX_SAFE_INTEGER,
    reconnectInterval: 500,
    poolSize: 10,
    socketTimeoutMS: 45000
  })
  .then(() => {
    console.log("Successfully connected to the database!");
  })
  .catch(err => {
    console.log(err, "Could not connect to the database. Exiting now...");
    process.exit();
  });

// define a simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SchooLish API." });
});

// modify request object
app.use((req, res, next) => {
  res.locals.userId = 0.0;
  res.locals.userType = "anonymous";
  res.locals.role = "";
  next();
});

// Use Routes
app.use("/api/v1", api);

app.use((req, res, next) => {
  const error = new Error("Not found!");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: `SchooLish API says ${error.message}`
    }
  });
  next();
});

// listen for requests
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
