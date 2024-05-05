import { Worker, workerData, parentPort } from "worker_threads";
import fs from "fs";
import Binance from "node-binance-api";
import sendMessageToTelegram from "./telegramManager.js";

//import { Logger_binance } from "../Logger/LoggerManager.js";

// const API_KEY =
//   "PCV7ytY7T9F7wuAaAaL1DbLNwRZAzuWGk3dUyz4pQK0nN0ZTbdoIciELw5LCdtar";
// const API_SECRET =
//   "WrCdNkQqiFdTesqj3ymplNgtZPARBdaCO6Dgv9zafsXCXK6Z33A1xecOqAGRTcMf";

//let Logger = new Logger_binance(null, null, null);

let Timeframe = "4h";

//BEST FOR 3m
// let config = {
//   bars: [],
//   orderCall: "Both",
//   barsCloseReversal: 10,
//   barsClose: 10,
//   profitPercantage: 3,
//   enableSLbyReversal: true,
//   lossPercantage: 1000,
//   barsIgnore: 0,
//   barsIgnoreClose: 0,
// };

//BEST FOR 1m
let config = {
  bars: [],
  orderCall: "Both",
  barsCloseReversal: 10,
  barsClose: 6,
  profitPercantage: 3,
  enableSLbyReversal: true,
  lossPercantage: 1000,
  barsIgnore: 0,
  barsIgnoreClose: 0,
};

// let instruments = [
//   "BTCUSDT",
//   "ETHUSDT",
//   "XRPUSDT",
//   "BNBUSDT",
//   "LTCUSDT",
//   "ADAUSDT",
//   "TRXUSDT",
//   "LINKUSDT",
//   "MATICUSDT",
// ];

let instruments = [
  {
    symbol: "BTCUSDT",
    timeframe: Timeframe,
    trade_hours: "0000-2400",
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 8,
      profitPercantage: 7,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 10,
      barsIgnoreClose: 10,
    },
  },
  {
    symbol: "ETHUSDT",
    timeframe: Timeframe,
    trade_hours: "0000-2400",
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 8,
      barsClose: 11,
      profitPercantage: 14,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 1,
      barsIgnoreClose: 9,
    },
  },
];

instruments.forEach((inst) => {
  if (!inst?.trade_hours) {
    console.log("NO TRADE TIME FOR ", inst.symbol);
    return;
  }
  if (!inst?.config) {
    console.log("NO CONFIG FOR ", inst.symbol);
    return;
  }

  let { symbol, timeframe, trade_hours, config } = inst;
  let worker = new Worker("./worker_run_model.js", {
    workerData: {
      symbol,
      timeframe,
      trade_hours,
      config,
    },
  });

  worker.on("message", (msg) => {
    if (msg.open_time) {
      msg.open_time_ISO = new Date(msg.open_time).toISOString();
    }
    if (msg.event == "model_run") {
      console.log("MODEL_run");
      sendMessageToTelegram("MODEL_run");
      // Trigger after first runModel func call
    }

    if (msg.event == "model_stop") {
      console.log("MODEL_stop");
      sendMessageToTelegram("MODEL_stop");
      worker.terminate();
      // Trigger when model closed by time and all orders closed
    }

    if (msg.event == "order_opened") {
      sendMessageToTelegram("order_opened");
      // Logger.send_message({
      //   data: { ...msg },
      //   text: `#{{id}} | Order opened\n{{side}} | {{symbol}}\nPrice : {{open_price}}\nQuantity: {{quantity}}\nTime: {{open_time_ISO}}`,
      // });
    }

    if (msg.event == "order_closed") {
      sendMessageToTelegram("order_closed");
      // REPLY TO MSG
    }
  });
});

sendMessageToTelegram("ping");
setInterval(() => {
  sendMessageToTelegram("ping");
}, 5 * 60 * 1000);
