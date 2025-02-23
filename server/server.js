require("dotenv").config();
let http = require("http");
let path = require("path");
let cors = require("cors");
let express = require("express");
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let passport = require("passport");

require("./models/user");
require("./models/restaurant");
require("./models/achievement-template");
require("./models/reward-template");
require("./config/passport");

let apiRoute = require("./routes/index");
let app = express();

// If env is production, serve the built static files, else allow cross-origin requests for development
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../dist/pick-easy")));
    app.get("/*", (req, res) => res.sendFile(path.join(__dirname)));
} else {
    app.use(cors());
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use("/api", apiRoute);

app.use((req, res, next) => {
    let error = new Error("Not Found");
    error.status = 404;
    next(error);
});

// Send error 401 if any error responds UnauthorizedError
app.use((err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        return res.status(401).send("Unauthorized access");
    }
});

// Connect to the database
mongoose.connect(process.env.DB_URI || "mongodb://localhost/pick-easy", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on("error", console.error.bind(console, "MongoDB connection error:"));

// Use Railway's PORT
const PORT = process.env.PORT || 3000;

// Ensure the HTTP server is properly created and listening
const server = http.createServer(app);
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
