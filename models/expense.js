const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total: {type: Number, required: true, default: 0},
    datespent: {type: Date, default: Date.now},
    items:[
        {
        itemName: {type: String, required: true},
        amount: {type: Number, required: true}
    }

    ],
    additionaldetails: {type: String}
}, {collection: 'expenses'});

const model = mongoose.model('Expense', expenseSchema); 

module.exports = model;

