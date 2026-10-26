import { Command } from "commander";
import { addExpense, listExpenses } from "./utils.expense.js";

const program = new Command();

program
  .name("expense-tracker")
  .description("A simple expense tracker")
  .version("1.0.0");

program
  .command("add")
  .description("Add a new expense")
  .argument("<description>", "Expense description")
  .argument("<amount>", "Expense amount")
  .action((description, amount) => {

       addExpense({amount,description})
  });

  program.command("list")
  .description("List all expenses")
  .action(() => {
    // Implement the logic to list expenses here
    listExpenses();
  });
  
  program.command("update")
  .description("Update an expense")
  .argument("<id>", "Expense ID")
  .option("[description]", "New description for the expense")
  .option("[amount]", "New amount for the expense")
  .action((id, description, amount) => {
    // Implement the logic to update an expense here
    updateExpense({id,newData: { description, amount }})
  });

  program.command("delete")
  .description("Delete an expense")
  .argument("<id>", "Expense ID")
  .action((id) => {
    // Implement the logic to delete an expense here
    deleteExpense({ id });
  });

program.parse();
