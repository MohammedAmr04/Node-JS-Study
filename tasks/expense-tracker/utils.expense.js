import fs from "fs"
import { FILE_NAME } from "./CONSTANTS.js"


function addExpense({ amount, description }) {

    const expense = { Date: new Date(), description, amount };
    fs.readFile(FILE_NAME, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading expenses file:", err);
            return;
        }
        const expenses = data ? JSON.parse(data) : [];
        expenses.push(expense);
        fs.writeFile(FILE_NAME, JSON.stringify(expenses) + '\n', (err) => {
            if (err) {
                console.error("Error adding expense:", err);
            } else {
                console.log("Expense added successfully.");
            }
        });
    })
}

function listExpenses() {
    fs.readFile(FILE_NAME, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading expenses file:", err);
            return;
        }
        const expenses = data ? JSON.parse(data) : [];
        console.log("Expenses:");
        expenses.forEach((expense) => {
            console.log(`-${expense.id} ${expense.description}: $${expense.amount}`);
        });
    });
}

// Users can update an expense.
function updateExpense({id,newData}) {
    fs.readFile(FILE_NAME, "utf8", (err,data) => {
          if (err) {
            console.error("Error reading expenses file:", err);
            return;
          }
        let expenses = data ? JSON.parse(data) : [];
        expenses[expenses.findIndex(id)] = {...expenses[expenses.findIndex(id)],newData} 
    fs.writeFile(FILE_NAME, JSON.stringify(expenses) + "\n", (err) => {
      if (err) {
        console.error("Error updating expense:", err);
      } else {
        console.log("Expense updating successfully.");
      }
    });    })
          
}

function deleteExpense({ id }) {
    fs.readFile(FILE_NAME, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading expenses file:", err);
            return;
        }
        let expenses = data ? JSON.parse(data) : [];
        expenses = expenses.filter((expense) => expense.id !== id);
        fs.writeFile(FILE_NAME, JSON.stringify(expenses) + "\n", (err) => {
            if (err) {
                console.error("Error deleting expense:", err);
            } else {
                console.log("Expense deleted successfully.");
            }
        });
    })
}

export { addExpense, listExpenses, updateExpense, deleteExpense };