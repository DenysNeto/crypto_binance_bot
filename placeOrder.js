import Binance from "node-binance-api";
import { placeOrder, closeOrder } from "./OrderManager.js";

const API_KEY =
  "PCV7ytY7T9F7wuAaAaL1DbLNwRZAzuWGk3dUyz4pQK0nN0ZTbdoIciELw5LCdtar";
const API_SECRET =
  "WrCdNkQqiFdTesqj3ymplNgtZPARBdaCO6Dgv9zafsXCXK6Z33A1xecOqAGRTcMf";

let BINANCE_CLIENT = new Binance().options({
  APIKEY: API_KEY,
  APISECRET: API_SECRET,
});

// let INFO = await BINANCE_CLIENT.futuresExchangeInfo();
// let PRICE_PRECISION = {};
// Object.keys(INFO).forEach((el) => {
//   if (el == "symbols") {
//     let all_symbols = INFO[el];
//     all_symbols.forEach((symbol, index) => {
//       if (symbol.symbol == "APTUSDT") console.log(symbol);
//       PRICE_PRECISION[symbol.symbol] = symbol.pricePrecision;
//     });
//   }
// });
// console.log("AAAa", PRICE_PRECISION);

placeOrder(
  BINANCE_CLIENT,
  "FILUSDT",
  {
    entrySignal: "BullTAR",
    barIndex: -23,
    sourceBarIndex: 21,
    exitPrice: "0.25710000",
    timeEnter: 1693664400000,
    timeTransformed: "Sat Sep 02 2023",
    initPrice: "0.25650000",
    id: 1,
    timeExit: 1693668300000,
    signalExit: "SL(Reversal)",
    profit: -2.339181286549666,
    barIndexExit: -10,
    sourceBarIndexExit: 34,
  },
  (res) => {
    console.log("PLACED");
  },
  (err) => {
    console.log("ERRR ", err);
  }
);
