const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");
const Review= require("./models/review.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/airbnb";

main().then(() =>{
    console.log("Connected to DB");
})
.catch(err =>{
    console.log(err);
});
async function main() {
    await mongoose.connect(MONGO_URL);
    
    
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req,res)=>{
    res.send("Hii, I am root");
});



// const validateListing = (req,res,next) =>{
//     let{ error }=   listingSchema.validate(req.body);
//      if(error){
//     let errMssg = error.details.map((el)=>   el.message).join(",");
    
//     throw new ExpressError(400, result.error);

// }else{
//     next();
// }
// };
//Index Route
 app.get("/listings", wrapAsync (async (req,res) =>{
    const allListings = await Listing.find({})
    res.render("listings/index.ejs",{allListings});
 
 }));
//New Route
app.get("/listings/new", (req, res) =>{
    res.render("listings/new.ejs");
});

 //Show Route
 app.get("/listings/:id", wrapAsync (async (req, res) =>{
    let {id} = req.params;
  const listing =  await Listing.findById(id);
  res.render("listings/show.ejs", {listing});
 }));


//Create Route
app.post("/listings", 
     
    wrapAsync(async(req,res,next)=>{
    //    console.log(req.body);
   let result = listingSchema.validate(req.body);
   console.log(result);
    const newlisting= new Listing(req.body.listing);
    await newlisting.save();
   res.redirect("/listings");
})

);

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) =>{
    let {id} = req.params;
    const listing =  await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
}));

//Update Route
app.put("/listings/:id", 
   
    wrapAsync(async(req,res) =>{
   
    let {id} = req.params;
   await Listing.findByIdAndUpdate(id,{...req.body.listing});
   res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id",wrapAsync(async(req,res) =>{
    
    let {id} = req.params;
   let deleteListing = await Listing.findByIdAndDelete(id);
   console.log(deleteListing);
   res.redirect("/listings");
}));

//Reviews
//Post route
app.post("/listings/:id/reviews", async(res,req)=>{
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  listing.reviews.push(newReview);

 await  newReview.save();
 await listing.save();

 console.log("New review saved");
 res.send("New review saved");
});

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