import Binance from "node-binance-api";
import fs from "fs";

const API_KEY =
  "PCV7ytY7T9F7wuAaAaL1DbLNwRZAzuWGk3dUyz4pQK0nN0ZTbdoIciELw5LCdtar";
const API_SECRET =
  "WrCdNkQqiFdTesqj3ymplNgtZPARBdaCO6Dgv9zafsXCXK6Z33A1xecOqAGRTcMf";

let BINANCE_CLIENT = new Binance().options({
  APIKEY: API_KEY,
  APISECRET: API_SECRET,
});

let results = [];

// ['BTCBUSD', 'BTCDOMUSDT', 'ETHBTC', 'BTCUSDT_231229', 'BTCUSDT', 'BTCUSDT_240329']

// console.info(await BINANCE_CLIENT.futuresPrices());

let symbolQ = "ETH";

let last = 1706738400000;

function a() {
  console.log("LAST", last);
  BINANCE_CLIENT.candlesticks(
    `${symbolQ}USDT`,
    "1h",
    (error, ticks, symbol) => {
      console.info("candlesticks()", ticks.length);

      ticks.forEach((element) => {
        let [
          time,
          open,
          high,
          low,
          close,
          volume,
          closeTime,
          assetVolume,
          trades,
          buyBaseVolume,
          buyAssetVolume,
          ignored,
        ] = element;

        results.push({
          time,
          open,
          high,
          low,
          close,
          volume,
          closeTime,
          assetVolume,
          trades,
          buyBaseVolume,
          buyAssetVolume,
          ignored,
        });
      });

      // data = JSON.parse(data || "[]");
      // data = data.concat(results);
      console.log(
        "DDD",
        "closeTime",
        results[results.length - 1].closeTime,
        results.length
      );
      last = results[results.length - 1].closeTime;

      fs.writeFileSync(
        `./${symbolQ.toLowerCase()}__2024.txt`,
        JSON.stringify(results)
      );
      a();
    },

    { limit: 1000, startTime: last, endTime: 1738360800000 }
  );
}

a();
// TIMES
// startTime:  1706738400000  , endTime : 1738360800000  - 2024
// startTime:  1675202400000  , endTime : 1706738400000  - 2023
// startTime: 1640908800000, endTime: 1672444800000 - 2022
// startTime : 1609372800000 ,        endTime :  1640908800000           2021
// startTime :  1577750400000 ,    endTime : 1609372800000    2020

let takerFirst = false;
let takerSecond = false;
