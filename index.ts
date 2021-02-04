import inquirer from "inquirer";
import { createGoal, editGoals, showGoals } from "./goal";

async function mainMenu() {
  while (true) {
    const { value: action } = await inquirer.prompt({
      type: "list",
      name: "value",
      message: "What do you want to do?",
      choices: [
        {
          name: "Create a goal",
          value: () => createGoal(),
        },
        {
          name: "Show goals",
          value: () => showGoals(),
        },
        {
          name: 'Edit goals',
          value: () => editGoals()
        },
        {
          name: "Show transactions",
          value: () => console.log("not implemented"),
        },
        {
          name: "Quit",
          value: null,
        },
      ],
    });
    if (!action) {
      return;
    }
    await action();
  }
}

mainMenu();
