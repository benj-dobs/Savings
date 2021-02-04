import * as chrono from "chrono-node";
import {
  differenceInMilliseconds,
  differenceInSeconds,
  formatDuration,
  isAfter,
} from "date-fns";
import { existsSync, readFileSync, writeFile } from "fs";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-prompt";
import parseDuration from "parse-duration";
import { getTransactions } from "./qif";

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
  };
}
export interface Goal {
  startDate: Date;
  durationInSeconds: number;
  tag: string;
  startBalance: number;
  endBalance: number;
}

type GoalJson = {
  tag: string;
  startBalance: number;
  endBalance: number;
  startDate: string;
  durationInSeconds: number;
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

const tagQuestion = {
  name: "tag",
  message: "What is the goal called?",
  validate: (tag) =>
    !tag
      ? "Please enter a name"
      : goals.some((goal) => goal.tag === tag)
      ? "Name already in use"
      : true,
};
const startDateQuestion = {
  name: "startDate",
  message: "When does the goal start?",
  default: "Today",
  type: "autocomplete",
  suggestOnly: true,
  emptyText: "Not a date",
  filter: (input) => chrono.parseDate(input || "Today"),
  validate: (input) =>
    chrono.parseDate(input || "Today") === null ? "Not a date" : true,
  source: async (_, input: string) => {
    const date = chrono.parseDate(input || "Today");
    if (!date) {
      return [];
    } else {
      return [dateFormatter.format(date)];
    }
  },
};
const durationQuestion = {
  name: "durationInSeconds",
  message: "How long should the goal last?",
  default: "1 year",
  type: "autocomplete",
  suggestOnly: true,
  emptyText: "Not a duration",
  filter: (input) => parseDuration(input || "1 year"),
  validate: (input) =>
    parseDuration(input || "1 year") === null ? "Not a duration" : true,
  source: async (_, input: string) => {
    const durationInSeconds = parseDuration(input || "1 year");

    if (!durationInSeconds) {
      return [];
    } else {
      return [formatDuration({ seconds: durationInSeconds })];
    }
  },
};
const startBalanceQuestion: inquirer.DistinctQuestion<any> = {
  type: "number",
  name: "startBalance",
  message: "How much is saved at the goal start date?",
  default: 0,
  validate: (input) => (isNaN(input) ? "Please enter a number" : true),
  transformer: (input) => currencyFormatter.format(input),
};
const endBalanceQuestion: inquirer.DistinctQuestion<any> = {
  type: "number",
  name: "endBalance",
  message: "How much do you want to save?",
  validate: (input) => (isNaN(input) ? "Please enter a number" : true),
  transformer: (input) => currencyFormatter.format(input),
};
const goalCreationQuestions = [
  tagQuestion,
  startDateQuestion,
  durationQuestion,
  startBalanceQuestion,
  endBalanceQuestion,
];
export async function createGoal() {
  const newGoal = await inquirer.prompt(goalCreationQuestions);

  goals = [...goals, newGoal];
  writeFile("Data/goals.json", JSON.stringify(goals), () => {});
  showGoals();
}

export async function editGoals() {
  const { goal, field } = await inquirer.prompt([
    {
      type: "autocomplete",
      name: "goal",
      source: async (_, input) =>
        goals
          .map((g) => g.tag)
          .filter((tag) => (input ? tag.startsWith(input) : true)),
      filter: (tag) => goals.find((g) => g.tag === tag),
    },
    {
      type: "autocomplete",
      name: "field",
      source: async ({ goal }, input) =>
        Object.keys(goal).filter((key) =>
          input ? key.startsWith(input) : true
        ),
    },
  ]);

  const edit = await inquirer.prompt(
    goalCreationQuestions.filter((q) => q.name === field)
  );
  const newGoal = { ...goal, ...edit };
  const retainedGoals = goals.filter((g) => g.tag !== goal.tag);
  goals = [newGoal, ...retainedGoals];
  writeFile("Data/goals.json", JSON.stringify(goals), () => {});
  showGoals();
}

export function showGoals() {
  const savings = calculateSavings();
  const formattedGoals = goals
    .map((goal) => {
      const goalSavings = savings.find((s) => s.tag === goal.tag).savings;
      const expectedGoalSavings =
        (goal.endBalance *
          differenceInMilliseconds(Date.now(), goal.startDate)) /
        goal.durationInSeconds;
      return {
        tag: goal.tag,
        "Start date": dateFormatter.format(goal.startDate),
        "Start balance": currencyFormatter.format(goal.startBalance),
        Duration: goal.durationInSeconds,
        "Savings target": currencyFormatter.format(goal.endBalance),
        "Expected savings by today": currencyFormatter.format(
          expectedGoalSavings
        ),
        "Savings achieved": currencyFormatter.format(goalSavings),
        Surplus: currencyFormatter.format(goalSavings - expectedGoalSavings),
      };
    })
    .reduce((map, goal) => {
      const { tag, ...namelessGoal } = goal;
      return {
        ...map,
        [tag]: namelessGoal,
      };
    }, {});
  console.table(formattedGoals);
}

function calculateSavings() {
  const transactions = getTransactions();
  const savingSplit = transactions.map((t) => {
    const relevantGoals = goals.filter((g) =>
      isAfter(chrono.parseDate(t.date), g.startDate)
    );
    const totalDailySavings = relevantGoals.reduce(
      (total, goal) => total + getDailySavings(goal),
      0
    );
    return relevantGoals.map((g) => ({
      tag: g.tag,
      date: t.date,
      savings: t.amount * (getDailySavings(g) / totalDailySavings),
    }));
  });
  const totalSavingsByGoal = goals.map((g) => {
    const savings = savingSplit
      .flatMap((split) => split.filter((goal) => goal.tag === g.tag))
      .reduce((total, goal) => total + goal.savings, g.startBalance);
    return {
      tag: g.tag,
      savings,
    };
  });
  return totalSavingsByGoal;
}

function getDailySavings(goal: Goal) {
  return (
    (goal.endBalance - goal.startBalance) / (goal.durationInSeconds / 86400)
  );
}
