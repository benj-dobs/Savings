import { readFileSync, readdirSync } from "fs";
import { deserializeQif, QifData, QifTransaction } from "qif-ts";

export function getTransactions(): ReadonlyArray<QifTransaction> {
  const filenames = readdirSync("Data");
  return filenames.flatMap((fileName) => {
    if (!fileName.endsWith(".qif")) {
      return [];
    }
    const qifText = readFileSync(`Data/${fileName}`).toString();
    const { transactions }: QifData = deserializeQif(qifText);
    const transactionsWithStandardisedDates = transactions.map((t) => ({
      ...t,
      date: t.date.replace(
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        (_, day, month, year) => `${year}-${month}-${day}`
      ),
    }));
    return transactionsWithStandardisedDates;
  });
}
