require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const User = require("./models/User");

const authenticateToken = require("./middleware/authenticateToken");

const gigRoutes = require("./routes/gigRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const https = require("https");
const fs = require("fs");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");


const app = express();



// SECURITY MIDDLEWARE


app.use(helmet());


const limiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 100,

    message: {
        message: "Too many requests. Please try again later."
    }

});


app.use(limiter);


app.use(express.json());

app.use(mongoSanitize());

app.use(express.static("public"));




// ROUTES



app.use("/api/gigs", gigRoutes);

app.use("/api/bookings", bookingRoutes);




// VARIABLES



const PORT = process.env.PORT || 4000;

const JWT_SECRET = process.env.JWT_SECRET;




// HOME



app.get("/", (req,res)=>{

    res.sendFile(
        __dirname + "/public/index.html"
    );

});





// REGISTER



app.post("/api/auth/register", async(req,res)=>{


try{


const {
    name,
    email,
    password
}=req.body;



if(!name || !email || !password){

return res.status(400).json({

message:"Name, email and password are required."

});

}




if(!validator.isEmail(email)){


return res.status(400).json({

message:"Invalid email address."

});


}




if(password.length < 8){

return res.status(400).json({

message:"Password must contain at least 8 characters."

});

}




if(!/[A-Z]/.test(password)
||
!/[0-9]/.test(password)){


return res.status(400).json({

message:"Password must contain uppercase letter and number."

});


}




const existingUser =
await User.findOne({

email:email.toLowerCase()

});



if(existingUser){


return res.status(409).json({

message:"User already exists."

});


}




const hashedPassword =
await bcrypt.hash(password,10);




const newUser =
await User.create({

name:name.trim(),

email:email.toLowerCase(),

password:hashedPassword

});



res.status(201).json({

message:"User registered successfully.",

user:{

id:newUser._id,

name:newUser.name,

email:newUser.email,

role:newUser.role

}


});



}

catch(error){


console.log(error);


res.status(500).json({

message:"Registration failed."

});


}



});






// LOGIN



app.post("/api/auth/login", async(req,res)=>{


try{


const {

email,

password

}=req.body;



const user =
await User.findOne({

email:email.toLowerCase()

});



if(!user){

return res.status(401).json({

message:"Invalid email or password."

});

}



const match =
await bcrypt.compare(

password,

user.password

);



if(!match){


return res.status(401).json({

message:"Invalid email or password."

});


}




const token =
jwt.sign(

{

id:user._id,

email:user.email,

role:user.role

},

JWT_SECRET,

{

expiresIn:"1h"

}


);



res.json({

message:"Login successful.",

token

});



}

catch(error){


console.log(error);


res.status(500).json({

message:"Login failed."

});


}



});






// PROTECTED PROFILE



app.get(
"/api/profile",
authenticateToken,
async(req,res)=>{


try{


const user =
await User.findById(req.user.id);



if(!user){

return res.status(404).json({

message:"User not found."

});

}




res.json({

message:"Protected route accessed.",

user:{

id:user._id,

name:user.name,

email:user.email,

role:user.role

}


});


}

catch(error){


res.status(500).json({

message:"Profile failed."

});


}


});







// HTTPS SERVER



const sslOptions = {


key:fs.readFileSync("./cert/key.pem"),


cert:fs.readFileSync("./cert/cert.pem")


};





connectDB();



https.createServer(

sslOptions,

app

).listen(PORT,()=>{


console.log(
`HustleHub+ API running securely on https://localhost:${PORT}`
);


});