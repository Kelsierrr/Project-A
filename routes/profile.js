const express = require ('express');    // Import express
const route = express.Router ();       // Create an express router
require('dotenv').config();              // Import dotenv
const jwt = require ('jsonwebtoken');   // Import jsonwebtoken
const bcrypt = require ('bcrypt');    // Import bcryptjs
const User = require ('../models/user');            // Import the user model
const mongoose = require('mongoose');    // Import mongoose
const crypto = require('crypto'); // Import crypto for secure random token generation
const transporter = require('../utils/nodemailer'); // Import nodemailer transporter






const usernameregex = /^[a-zA-Z0-9]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordregex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;



// Create a new user
route.post ('/register', async (req, res) => {
 const { username, email, password } = req.body; // Destructure the request body

    // Check if the required fields are present

    if (!username || !email || !password) {
        return res.status(400).send({message: 'All required fields must be filled'});
    }
    // Check if the username, email and password are valid
   if (!usernameregex.test(username) || username.length < 3 || username.length > 20) {
        return res.status(400).send({message: 'Invalid username format. Username must be alphanumeric and between 3 and 20 characters'});
    }

    if (!emailRegex.test(email)) {
        return res.status(400).send({message: 'Invalid email format'});
    }

    if (!passwordregex.test(password)) {
        return res.status(400).send({message: 'Password must be between 6 and 20 characters and contain at least one numeric digit, one uppercase and one lowercase letter'});
    }



    try {
        const check = await User.find ({email: email}).lean(); // Check if a user with the given email already exists
        
        if (check.length > 0) {
            return res.status (400).send({message: 'User already exists'}); // Return an error if the user already exists
        }

        const check2 = await User.find ({username: username}).lean(); // Check if a user with the given username already exists
        if (check2.length > 0) {
            return res.status (400).send({message: 'Username already taken'}); // Return an error if the user already exists
        }

        // Create a new user document using the User model
        const user = new User();
        user.username = username;
        user.email = email;
        user.password = await bcrypt.hash(password, 10);

        await user.save();

        // Return a response to the frontend
        return res.status(200).send({message: 'User created successfully', user});
    } catch (error) {
        console.error(error);
        return res.status(500).send({message: 'An error occurred'});
    }
});

// Login a user
route.post ('/login', async (req, res) => {
    const { username, password } = req.body; // Destructure the request body

    // Check if the required fields are present
    if (!username || !password) {
        return res.status(400).send({message: 'Please input username and password'});
    }

    try {
        // Check if the user exists
        const user = await User.findOne({username}).lean();
        if (!user) {
            return res.status(404).send({message: 'User not found'});
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send({message: 'Invalid credentials'});
        }

        // Create a token
        const token = jwt.sign({id: user._id, username: user.username}, process.env.JWT_SECRET, {expiresIn: '1h'});
        delete user.password;

        // Return a response to the frontend
        return res.status(200).send({message: 'Login successful', user, token});
    } catch (error) {
        console.error(error);
        return res.status(500).send({message: 'An error occurred'});
    }
});


//handling reset password requests
route.post('/reset-password', async (req, res) => {
    const { email } = req.body; // Destructure the request body

    // Check if the required fields are present
    if (!email) {
        return res.status(400).send({ message: 'Email is required' });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
        return res.status(400).send({ message: 'Invalid email format' });
    }

    try {
        // Check if the user exists
        const user = await User.findOne({ email }).lean();
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Generate a secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Save the reset token to the user document (you should also set an expiration time)
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes
        await user.save();

        // Send the reset link via email
        const resetLink = `${process.env.RESET_PASSWORD_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html:
                `<p>Hi ${user.username},</p>
                 <p>You requested a password reset. Click the link below to reset your password:</p>
                 <a href="${resetLink}">Reset Password</a>
                 <p>If you did not request this, please ignore this email.</p>
                 <p>Thank you!</p>`
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).send({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'An error occurred' });
    }
});


// Reset password using the token
route.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params; // Get the token from the URL
    const { newPassword } = req.body; // Get the new password from the request body

    // Check if the required fields are present
    if (!newPassword) {
        return res.status(400).send({ message: 'New password is required' });
    }

    // Validate password format
    if (!passwordregex.test(newPassword)) {
        return res.status(400).send({ message: 'Password must be between 6 and 20 characters and contain at least one numeric digit, one uppercase and one lowercase letter' });
    }

    try {
        // Find the user with the reset token
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } }).lean();
        if (!user) {
            return res.status(404).send({ message: 'Invalid or expired reset token' });
        }

        // Update the user's password
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined; // Clear the reset token
        user.resetTokenExpiration = undefined; // Clear the expiration time
        await user.save();

        return res.status(200).send({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'An error occurred' });
    }
});


module.exports = route