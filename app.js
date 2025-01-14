if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js")
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const { error } = require('console');

// const MONGO_URL = "mongodb://127.0.0.1:27017/airbnb";

const dbUrl = process.env.ATLAS_DB;

main().then(() =>{
    console.log("Connected to DB");
})
.catch(err =>{
    console.log(err);
});
async function main() {
    await mongoose.connect(dbUrl);
       
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store =  MongoStore.create({
    mongoUrl:dbUrl,
    crypto: {
        secret:process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", ()=>{
    console.log("ERROR IN MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 *60 * 60 * 1000,
        maxAge :  7 * 24 *60 * 60 * 1000,
        httpOnly: true,
    }

};

// app.get("/", (req,res)=>{
//     res.send("Hii, I am root");
// });




app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error= req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser",async (req,res)=>{
// let fakeUser = new User({
//     email: "mana123@gmail.com",
//     username: "Delta-student",
// });

//  let registerUser = await User.register(fakeUser, "hello");
//  res.send(registerUser);
// });

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);



app.all("*",(req,res,next)=>{
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err,req,res,next)=>{
    let{statusCode= 500, message= "Something went wrong!" } = err;
   res.status(statusCode).render("errors.ejs", {err});
//    res.status(statusCode).send(message);
});

app.listen(8080, () =>{
    console.log("server is listening on port 8080");
});
