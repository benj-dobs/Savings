import * as chrono from "chrono-node";
import { question } from "readline-sync";
import { existsSync, readFileSync, writeFile } from "fs";

const hasGoals = existsSync("Data/goals.json");
const goalsJson: GoalJson[] = hasGoals
? JSON.parse(readFileSync("Data/goals.json").toString())
: []
export let goals: ReadonlyArray<Goal> = goalsJson.map(parseGoal);

function parseGoal(goalJson: GoalJson): Goal {
  return {
    ...goalJson,
    startDate: chrono.parseDate(goalJson.startDate),
    endDate: chrono.parseDate(goalJson.endDate)
  }
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
  startDate: string
  endDate: string;
}

export function createGoal() {
  const tag = question("What is the goal called? ");
  const startDate = promptDate("When does the goal start?", "today");
  const endDate = promptDate("When does the goal end?", "in 1 year");
  const startBalance = parseInt(
    question("How much have you saved already? (pence) ")
  );
  const endBalance = parseInt(
    question("How much do you want to save? (pence) ")
  );
  const newGoal = {
    tag,
    startBalance,
    endBalance,
    startDate,
    endDate,
  };
  goals = [...goals, newGoal];
  writeFile('Data/goals.json', JSON.stringify(goals), () => {});
}

function promptDate(prompt: string, fallback: string): Date {
  const dateString = question(`${[prompt]} [${fallback}]: `) || fallback;
  return chrono.parseDate(dateString);
}
