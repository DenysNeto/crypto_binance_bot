import Binance from "node-binance-api";
import fs from "fs";

let order = 1000;
let input = JSON.parse(fs.readFileSync("./btc__231229.txt", "utf8"));

let stepsArr = [];
let delta = 50;

function divideIntoSteps(arr) {
  let firstIndex = 0;
  let currValue = 0;
  arr.forEach((el, index) => {
    if (!firstIndex) {
      firstIndex = index;
      currValue = el;
    }
    if (Math.abs(el - currValue) > delta) {
      stepsArr.push({
        direction: el - currValue > 0 ? "Long" : "Short",
        startIndex: firstIndex,
        finishIndex: index,
        startValue: currValue,
        finishValue: el,
      });
      firstIndex = index;
      currValue = el;
    }
  });
}

divideIntoSteps(input);

console.log("STEPS_ARR", stepsArr);
