import prompts from "prompts";
import { createGoal } from "./goal";
import { getTransactions } from "./qif";

async function mainMenu() {
  while (true) {
    const { value: action } = await prompts({
      type: "select",
      name: "value",
      message: "What do you want to do?",
      choices: [
        {
          title: "Create a goal",
          value: () => createGoal(),
        },
        {
          title: "Show transactions",
          value: () => console.log("not implemented"),
        },
        {
          title: "Quit",
          value: null,
        },
      ],
    });
    if (!action) {
      return;
    }
    action();
  }
}

mainMenu();
