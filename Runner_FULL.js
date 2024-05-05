import { Worker, workerData, parentPort } from "worker_threads";
import fs from "fs";
import Binance from "node-binance-api";
//import { Logger_binance } from "../Logger/LoggerManager.js";

// const API_KEY =
//   "PCV7ytY7T9F7wuAaAaL1DbLNwRZAzuWGk3dUyz4pQK0nN0ZTbdoIciELw5LCdtar";
// const API_SECRET =
//   "WrCdNkQqiFdTesqj3ymplNgtZPARBdaCO6Dgv9zafsXCXK6Z33A1xecOqAGRTcMf";

//let Logger = new Logger_binance(null, null, null);

let Timeframe = "5m";

let TRADE_HOURS = "0100-2400";

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
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 9,
      profitPercantage: 1.5,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 10,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "APTUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 9,
      profitPercantage: 2,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 9,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "AVAXUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 8,
      profitPercantage: 2,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 10,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "BCHUSDT",
    timeframe: Timeframe,
    trade_hours: "1630-2230",
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 8,
      profitPercantage: 2,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 10,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "FILUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 8,
      profitPercantage: 1,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 10,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "RUNEUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 10,
      profitPercantage: 1.5,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 0,
      barsIgnoreClose: 0,
    },
  },

  {
    symbol: "TRXUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 10,
      profitPercantage: 1.5,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 0,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "DYDXUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 8,
      profitPercantage: 2,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 10,
      barsIgnoreClose: 0,
    },
  },

  {
    symbol: "HBARUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 10,
      profitPercantage: 1.5,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 0,
      barsIgnoreClose: 0,
    },
  },

  {
    symbol: "LDOUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 8,
      profitPercantage: 2,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 0,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "ETHUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 10,
      profitPercantage: 1.9,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 10,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "XRPUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 6,
      profitPercantage: 3,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 0,
      barsIgnoreClose: 0,
    },
  },

  {
    symbol: "LTCUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 9,
      profitPercantage: 2,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 9,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "ADAUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 14,
      profitPercantage: 1,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 8,
      barsIgnoreClose: 0,
    },
  },

  {
    symbol: "DOTUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 9,
      profitPercantage: 1.5,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 8,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "NEARUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      barsIgnore: 0,
      profitPercantage: 1.4,
      lossPercantage: 1000,
      barsClose: 14,
      barsCloseReversal: 10,
      barsIgnoreClose: 0,
      orderCall: "Both",
      enableSLbyReversal: true,
      enableCCI: false,
      bars: [],
    },
  },
  {
    symbol: "LINKUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      bars: [],
      orderCall: "Both",
      barsCloseReversal: 10,
      barsClose: 10,
      profitPercantage: 1,
      enableSLbyReversal: true,
      lossPercantage: 1000,
      barsIgnore: 0,
      barsIgnoreClose: 0,
    },
  },
  {
    symbol: "MATICUSDT",
    timeframe: Timeframe,
    trade_hours: TRADE_HOURS,
    config: {
      barsIgnore: 8,
      profitPercantage: 3,
      lossPercantage: 1000,
      barsClose: 16,
      barsCloseReversal: 10,
      barsIgnoreClose: 0,
      orderCall: "Both",
      enableSLbyReversal: true,
      enableCCI: false,
      bars: [],
    },
  },
  ////////
  // {
  //   symbol: "DOGEUSDT",
  //   timeframe: Timeframe,
  // },
  // {
  //   symbol: "FLOKIUSDT",
  //   timeframe: Timeframe,
  // },
  // {
  //   symbol: "PEPEUSDT",
  //   timeframe: Timeframe,
  // },
  // {
  //   symbol: "SHIBUSDT",
  //   timeframe: Timeframe,
  // },
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
      // Trigger after first runModel func call
    }

    if (msg.event == "model_stop") {
      console.log("MODEL_stop");
      worker.terminate();
      // Trigger when model closed by time and all orders closed
    }

    if (msg.event == "order_opened") {
      // Logger.send_message({
      //   data: { ...msg },
      //   text: `#{{id}} | Order opened\n{{side}} | {{symbol}}\nPrice : {{open_price}}\nQuantity: {{quantity}}\nTime: {{open_time_ISO}}`,
      // });
    }

    if (msg.event == "order_closed") {
      // REPLY TO MSG
    }
  });
});
