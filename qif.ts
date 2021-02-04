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
    return transactions;
  });
}
