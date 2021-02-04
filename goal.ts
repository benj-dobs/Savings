import * as chrono from "chrono-node";
import { existsSync, readFileSync, writeFile } from "fs";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-prompt";

inquirer.registerPrompt("autocomplete", autocomplete);

const hasGoals = existsSync("Data/goals.json");
const goalsJson: GoalJson[] = hasGoals
  ? JSON.parse(readFileSync("Data/goals.json").toString())
  : [];
export let goals: ReadonlyArray<Goal> = goalsJson.map(parseGoal);

function parseGoal(goalJson: GoalJson): Goal {
  return {
    ...goalJson,
    startDate: chrono.parseDate(goalJson.startDate),
    endDate: chrono.parseDate(goalJson.endDate),
  };
}
export interface Goal {
  startDate: Date;
  endDate: Date;
  tag: string;
  startBalance: number;
  endBalance: number;
}

type GoalJson = {
  tag: string;
  startBalance: number;
  endBalance: number;
  startDate: string;
  endDate: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const makeDateInput = (options: any) => ({
  ...options,
  type: "autocomplete",
  suggestOnly: true,
  emptyText: "Not a date",
  filter: (input) => chrono.parseDate(input || options.default),
  validate: (input) =>
    chrono.parseDate(input || options.default) === null ? "Not a date" : true,
  source: async (_, input: string) => {
    const date = chrono.parseDate(input || options.default);
    if (!date) {
      return [];
    } else {
      return [dateFormatter.format(date)];
    }
  },
});

export async function createGoal() {
  const newGoal = await inquirer.prompt([
    {
      name: "tag",
      message: "What is the goal called?",
      validate: (tag) =>
        !tag
          ? "Please enter a name"
          : goals.some((goal) => goal.tag === tag)
          ? "Name already in use"
          : true,
    },
    makeDateInput({
      name: "startDate",
      message: "When does the goal start?",
      default: "Today",
    }),
    makeDateInput({
      name: "endDate",
      message: "When does the end?",
      default: "in 1 year",
    }),
    {
      type: "number",
      name: "startBalance",
      message: "How much is saved at the goal start date?",
      default: 0,
    },
    {
      type: "number",
      name: "endBalance",
      message: "How much do you want to save?",
      validate: (input) => (isNaN(input) ? "Please enter a number" : true),
    },
  ]);

  goals = [...goals, newGoal];
  writeFile("Data/goals.json", JSON.stringify(goals), () => {});
  showGoals();
}

export function showGoals() {
  const formattedGoals = goals
    .map((goal) => ({
      tag: goal.tag,
      "Start date": dateFormatter.format(goal.startDate),
      "End date": dateFormatter.format(goal.endDate),
      "Start balance": currencyFormatter.format(goal.startBalance),
      "End balance": currencyFormatter.format(goal.endBalance),
    }))
    .reduce((map, goal) => {
      const { tag, ...namelessGoal } = goal;
      return {
        ...map,
        [tag]: namelessGoal,
      };
    }, {});
    console.table(formattedGoals)
}
