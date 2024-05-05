import Binance from "node-binance-api";
import fs from "fs";

let order = 1000;
let input = JSON.parse(fs.readFileSync("./btc__231229.txt", "utf8"));

let positive = []; //  LONG
let negative = []; // SHORT
let profit = 0;

let averageLast = (index) => {
  let res = input.slice(index - 10, index);

  let resSum = res.reduce((acc, val) => {
    return (acc += val);
  }, 0);

  return resSum / 10;
};

let average = (arr) => {
  return (
    arr.reduce((acc, val) => {
      return (acc += val);
    }, 0) / arr.length || 0
  );
};

let max = input.sort((a, b) => b - a);

let delta = (max[0] - max[max.length - 1]) / 8; // average(input) * 0.0065;
console.log("DELTA", delta, max[0]);
let maxPositions = 0;

for (let i = 10; i < input.length; i += 40) {
  let avrg = averageLast(i);

  if (input[i + 1] > avrg) {
    positive.push(input[i + 1]);
  } else {
    negative.push(input[i + 1]);
  }

  if (maxPositions < positive.length + negative.length) {
    maxPositions = positive.length + negative.length;
  }

  // TODO FINISH
  input.slice(i, i + 40).forEach((realPrice) => {
    let averagePositive = average(positive);
    let averageNegative = average(negative);

    let averageCountNegative = order / averageNegative;
    let averageCountPositive = order / averagePositive;

    let comissionStart = 0.00045;
    let comissionEnd = 0.00027;

    let comissionNegative =
      comissionStart * order +
      (order / averageNegative) * realPrice * comissionEnd;

    let comissionPositive =
      comissionStart * order +
      (order / averagePositive) * realPrice * comissionEnd;

    let conditionProfitNegative =
      (averageNegative - realPrice) * averageCountNegative * negative.length -
      (realPrice - averagePositive) * averageCountPositive * positive.length -
      (comissionNegative * negative.length +
        comissionPositive * positive.length);

    let conditionProfitPositive =
      (realPrice - averagePositive) * averageCountPositive * positive.length -
      (realPrice - averageNegative) * averageCountNegative * negative.length -
      (comissionNegative * negative.length +
        comissionPositive * positive.length);

    if (
      averagePositive &&
      conditionProfitPositive > 0 &&
      realPrice - averagePositive >= delta
    ) {
      console.log("PROFIT_positive", i, conditionProfitPositive);
      profit += conditionProfitPositive;
      positive = [];
      negative = [];
    } else if (
      averageNegative &&
      averageNegative - realPrice >= delta &&
      conditionProfitNegative > 0
    ) {
      console.log("PROFIT_NEGATIVE", i, conditionProfitNegative);
      profit += conditionProfitNegative;
      positive = [];
      negative = [];
    }
  });
}
console.log("MAX_POSITION", maxPositions);
console.log("Profit", profit);
console.log("POSITIVE", positive.length);
console.log("NEGATIVE", negative.length);
