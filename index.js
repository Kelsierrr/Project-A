const express = require ('express');     
const app = express ();          
const bodyparser = require ('bodyparser');
const mongoose = require("mongoose");
require('dotenv').config();          


mongoose.connect(process.env.MONGO_URI)
.catch(error => `MongoDB connection error: ${error}`)

const con = mongoose.connection
con.on('open', error =>{
 if(!error)

 console.log("Connected to MongoDB")

 else
 console.log(`Error connecting to MongoD: ${error}`)
})

con.on('disconnected', error => {
    console.log("mongoose lost connection")
})


app.use (express.json ());                       // Enable req.body JSON parsing
app.use (bodyparser.json ());                       // Enable req.body JSON parsing


app.use("/expense", require ("./routes/expense"))
app.use("/", require ("./routes/profile"))

const PORT = process.env.PORT || 3000;                                      // Define the port for the server to run on
app.listen (PORT, () => {                                           // Start the server on the specified PORT
    console.log (`Server is running on PORT ${PORT}`);                          // Log a message to the console
});