import _ from "lodash";
import { parentPort, workerData } from "worker_threads";
import Binance from "node-binance-api";
import runModel from "./runModel.js";
import { placeOrder, closeOrder } from "./OrderManager.js";
import fs from "fs";

const API_KEY =
  "PCV7ytY7T9F7wuAaAaL1DbLNwRZAzuWGk3dUyz4pQK0nN0ZTbdoIciELw5LCdtar";
const API_SECRET =
  "WrCdNkQqiFdTesqj3ymplNgtZPARBdaCO6Dgv9zafsXCXK6Z33A1xecOqAGRTcMf";
let BINANCE_CLIENT = new Binance().options({
  APIKEY: API_KEY,
  APISECRET: API_SECRET,
});

let BINANCE_ORDERS = [];
let CONFIG = workerData?.config ? workerData.config : {};
let TRADE_HOURS = workerData?.trade_hours
  ? workerData.trade_hours
  : "0000-2400";
const SYMBOL = workerData?.symbol ? workerData.symbol : "XRPUSDT";
const TIMEFRAME = workerData?.timeframe ? workerData.timeframe : "1m";

const RunModelTime = new Date().toLocaleString();
const Logs_folder_path = `./Logs/${SYMBOL}/${TIMEFRAME}`;
const slice_step = workerData?.slice_step ? workerData.slice_step : 15;
let bars_shift_count = 1;

const formatedTimestamp = (timestamp) => {
  let date = new Date(timestamp);
  let date_obj = {};
  date_obj.hours = date.getHours();
  date_obj.minutes = date.getMinutes();
  date_obj.seconds = date.getSeconds();
  date_obj.timestamp = timestamp;
  return date_obj;
};

let State = {
  bars: [],
  history: {},
};
let Prev = {
  date_str: null,
  date: {},
  tick: {},
};
let Current = {
  date_str: null,
  date: {},
  tick: {},
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function run() {
  BINANCE_CLIENT.websockets.chart(
    SYMBOL,
    TIMEFRAME,
    (symbol, interval, chart) => {
      let refresh_bars = false;
      let bars_data = [];
      let arr_keys = Object.keys(chart);
      arr_keys = arr_keys.reverse();
      arr_keys.forEach((key, index) => {
        if (slice_step > index) {
          let temp_bar = {
            ...chart[key],
            time: +key,
            symbol: SYMBOL,
            timeframe: TIMEFRAME,
          };
          bars_data.unshift(temp_bar);
        }
      });
      bars_data = bars_data.map((el, index) => {
        el.Index_bar = bars_shift_count + index;
        return el;
      });
      // bars_data = bars_data.reverse();
      let tick = bars_data[bars_data.length - 1];
      if (!tick || !tick.time) return;

      //Main logic

      if (Object.keys(Current.tick).length > 0) {
        Prev = { ...Current };
      }
      Current.tick = { ...tick };
      Current.date = formatedTimestamp(tick.time);

      if (
        Prev?.date?.timestamp &&
        Current.date.timestamp != Prev.date.timestamp
      ) {
        bars_shift_count++;
        refresh_bars = true;
      }
      State.bars = [...bars_data];
      CONFIG.bars = [...State.bars];

      let model_res = runModel(
        CONFIG,
        TRADE_HOURS,
        _.cloneDeep(State.history),
        refresh_bars,
        RunModelTime
      );

      if (model_res && model_res.history) {
        console.log(
          `${SYMBOL}_${TIMEFRAME}_model_output`,
          model_res.history.arrayStatistics.length
        );
        if (model_res.history.arrayStatistics.length > 0) {
          model_res.history.arrayStatistics.forEach((order, index) => {
            if (
              (!State.history.arrayStatistics ||
                !State?.history?.arrayStatistics?.[index]) &&
              !order.signalExit
            ) {
              console.log(SYMBOL + " NEW_ORDER", order.id);
              placeOrder(
                BINANCE_CLIENT,
                SYMBOL,
                order,
                (result) => {
                  console.log("SUCRESS_RES");
                  BINANCE_ORDERS.push(result);
                  parentPort.postMessage({ ...result, event: "order_opened" });
                },
                (err) => {
                  console.log("ERROR_PLACE_ORDER", err);
                }
              );
            } else if (
              (State.history.arrayStatistics || []).length > 0 &&
              !_.isEqual(order, State.history.arrayStatistics[index])
            ) {
              if (order.signalExit) {
                console.log(SYMBOL + "CLOSE_ORDER", order.id);

                let id_to_close = BINANCE_ORDERS.findIndex((el) => {
                  return el.id == order.id;
                });
                if (
                  id_to_close != -1 &&
                  !BINANCE_ORDERS[id_to_close].isClosed
                ) {
                  // closeOrder(
                  //   BINANCE_CLIENT,
                  //   SYMBOL,
                  //   BINANCE_ORDERS[id_to_close],
                  //   (result) => {
                  //     BINANCE_ORDERS[id_to_close] = result;
                  //     parentPort.postMessage({
                  //       ...result,
                  //       event: "order_closed",
                  //     });
                  //   },
                  //   (err) => {
                  //     console.log("ERROR_CLOSE_ORDER", err);
                  //   }
                  // );
                }
              }
            }
          });
        }
        State.history = _.cloneDeep(model_res.history);
        fs.access(Logs_folder_path, (error) => {
          if (error) {
            fs.mkdir(Logs_folder_path, { recursive: true }, (error) => {
              if (error) {
                console.log(error);
              }
            });
          } else {
            fs.writeFileSync(
              Logs_folder_path + `/model_status`,
              JSON.stringify(model_res)
            );

            fs.writeFileSync(
              Logs_folder_path + "/model_bars",
              JSON.stringify(State.bars)
            );

            fs.writeFileSync(
              Logs_folder_path + "/binance_orders",
              JSON.stringify(BINANCE_ORDERS)
            );
          }
        });
      }

      if (!model_res.isRunning) {
        parentPort.postMessage({ event: "model_stop" });
      }
    }
  );
}

setTimeout(() => {
  run();
}, 20000);
