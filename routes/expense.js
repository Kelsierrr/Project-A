const express = require ('express');    // Import express
const route = express.Router ();       // Create an express router
const Expense = require ('../models/expense');            // Import the expense model
const mongoose = require('mongoose');    // Import mongoose

// Create a new expense
route.post ('/add-expense', async (req, res) => {
    const { total, datespent, items, additionaldetails } = req.body; // Destructure the request body

    // Check if the required fields are present

    if (!total || !datespent || !items) {
        return res.status(400).send({message: 'All required fields must be filled'});
    }

    // Check if the total, datespent, items and additionaldetails are valid
    if (isNaN(total) || total < 0) {
        return res.status(400).send({message: 'Invalid total amount'});
    }

    if (isNaN(Date.parse(datespent))) {
        return res.status(400).send({message: 'Invalid date format'});
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).send({message: 'Items must be an array and must not be empty'});
    }

    if (additionaldetails && typeof additionaldetails !== 'string') {
        return res.status(400).send({message: 'Additional details must be written in text'});
    }

    items.forEach(item => {
        if (!item.itemName || !item.amount) {
            return res.status(400).send({message: 'All items must have a name and an amount'});
        }

        if (typeof item.itemName !== 'string' || isNaN(item.amount) || item.amount < 0) {
            return res.status(400).send({message: 'Items must have a valid name and amount'});
        }

    });

    // Create a new expense document using the Expense model
    const expense = new Expense();
    expense.total = total;
    expense.datespent = datespent;
    expense.items = items;
    expense.additionaldetails = additionaldetails || '';

    await expense.save();

    res.status(201).send({message: 'Expense added successfully'});
});

// Get all expenses, optionally filtered by month and year
route.get ('/get-expenses', async (req, res) => {
    const { month, year } = req.query; // Destructure the query parameters
try{
    let expenses = [];

    if (month && year) {
        expenses = await Expense.find({
            datespent: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            }
        }).sort({datespent: -1 }).lean();
    } else {
        expenses = await Expense.find().sort({datespent: -1 }).lean();
    }

    res.status(200).send(expenses);
}catch(error){
    console.error(error);
    return res.status(500).send({message: 'An error occurred'});
}});


// Get a single expense by ID
route.get ('/get-expense/:id', async (req, res) => {
    const { id } = req.params; // Destructure the request parameters

   try{ 

    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({message: 'Invalid expense ID'});
}

const expense = await Expense.findById(id).lean();

if (!expense) {
    return res.status(404).send({message: 'Expense not found'});
}

res.status(200).send(expense);
} catch (error) {
    console.error(error);
    return res.status(500).send({message: 'An error occurred'});
}});

module.exports = route; 