import * as chrono from "chrono-node";
import { question } from "readline-sync";

export interface Goal {
  startDate: Date;
  endDate: Date;
  tag: string;
  startBalance: number;
  endBalance: number;
}

export function createGoal(): Goal {
  const tag = question("What is the goal called? ");
  const startDate = promptDate("When does the goal start?", "today");
  const endDate = promptDate("When does the goal end?", "in 1 year");
  const startBalance = parseInt(
    question("How much have you saved already? (pence) ")
  );
  const endBalance = parseInt(question("How much do you want to save? (pence) "));
  return {
      tag,
      startBalance,
      endBalance,
      startDate,
      endDate
  }
}

function promptDate(prompt: string, fallback: string): Date {
  const dateString = question(`${[prompt]} [${fallback}]: `) || fallback;
  return chrono.parseDate(dateString);
}
