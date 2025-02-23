let express = require("express");
let router = express.Router();
let { body, param } = require("express-validator");
let jwt = require("express-jwt");
let multer = require("multer");
let path = require("path");
let fs = require("fs");

// Create 'uploads' folder if it doesn't exist
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer to store files locally
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save images in the 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

// File filter to allow only PNG and JPEG images
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
        cb(null, true);
    } else {
        cb(new Error("Only .png and .jpg images are allowed!"), false);
    }
};

// Configure Multer with storage and file filter
let upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB max file size
});

// Authentication middleware
let auth = jwt({ secret: process.env.JWT_SECRET });

// Restaurant staff authentication middleware
let restaurantStaffAuth = (req, res, next) => {
    if (!req.user.isRestaurantStaff)
        return res.status(403).send("User is not a restaurant staff");

    next();
};

// Customer authentication middleware
let customerAuth = (req, res, next) => {
    if (req.user.isRestaurantStaff)
        return res.status(403).send("User is not a customer");

    next();
};

let userController = require("../controllers/user");
let restaurantController = require("../controllers/restaurant");
let customerController = require("../controllers/customer");
let achievementTemplateController = require("../controllers/achievement-template");
let rewardTemplateController = require("../controllers/reward-template");

/*********************************** Users API endpoints ***********************************/
// Sign Up endpoint
router.post(
    "/users/signup",
    [
        body("firstName").trim().isAlpha().isLength({ min: 1, max: 20 }).escape(),
        body("lastName").trim().isAlpha().isLength({ min: 1, max: 20 }).escape(),
        body("isRestaurantStaff").toBoolean(true),
        body("username")
            .trim()
            .isAlphanumeric()
            .isLength({ min: 3, max: 20 })
            .escape(),
        body("password").trim().isLength({ min: 8, max: 20 }).escape(),
    ],
    userController.signUp
);

// Sign In endpoint
router.post(
    "/users/signin",
    [
        body("isRestaurantStaff").toBoolean(true),
        body("username")
            .trim()
            .isLength({ min: 3, max: 20 })
            .isAlphanumeric()
            .escape(),
        body("password").trim().isLength({ min: 8, max: 20 }).escape(),
    ],
    userController.signIn
);

// Retrieve New JWT endpoint
router.get("/users/retrieve-new-jwt", auth, userController.retrieveNewJWT);

/*********************************** Restaurants API endpoints ***********************************/
// Create Restaurant endpoint (with local image upload)
router.post(
    "/restaurants",
    auth,
    restaurantStaffAuth,
    upload.single("restaurantImage"),
    [
        body("restaurantName").trim().isLength({ min: 1, max: 30 }).escape(),
        body("restaurantDescription")
            .trim()
            .isLength({ min: 1, max: 250 })
            .escape(),
        body("restaurantCost")
            .exists({ checkNull: true })
            .toInt()
            .isInt({ min: 1, max: 4 }),
        body("restaurantCuisine").isIn([
            "Mexican",
            "Italian",
            "American",
            "Thai",
            "Japanese",
            "Chinese",
            "Indian",
            "French",
            "Brazilian",
            "Greek",
            "Korean",
        ]),
    ],
    restaurantController.createRestaurant
);

// Update Restaurant's Information endpoint (with local image upload)
router.patch(
    "/restaurants/:id",
    auth,
    restaurantStaffAuth,
    upload.single("restaurantImage"),
    [
        param("id")
            .exists({ checkNull: true, checkFalsy: true })
            .trim()
            .isMongoId()
            .escape(),
        body("restaurantName").trim().isLength({ min: 1, max: 30 }).escape(),
        body("restaurantDescription")
            .trim()
            .isLength({ min: 1, max: 250 })
            .escape(),
        body("restaurantCost")
            .exists({ checkNull: true })
            .toInt()
            .isInt({ min: 1, max: 4 }),
        body("restaurantCuisine").isIn([
            "Mexican",
            "Italian",
            "American",
            "Thai",
            "Japanese",
            "Chinese",
            "Indian",
            "French",
            "Brazilian",
            "Greek",
            "Korean",
        ]),
    ],
    restaurantController.updateRestaurant
);

/*********************************** Other API endpoints remain unchanged ***********************************/

// Export router
module.exports = router;
