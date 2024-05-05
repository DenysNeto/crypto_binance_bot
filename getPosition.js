import Binance from "node-binance-api";

// const API_KEY =
//   "PCV7ytY7T9F7wuAaAaL1DbLNwRZAzuWGk3dUyz4pQK0nN0ZTbdoIciELw5LCdtar";
// const API_SECRET =
//   "WrCdNkQqiFdTesqj3ymplNgtZPARBdaCO6Dgv9zafsXCXK6Z33A1xecOqAGRTcMf";

const API_KEY =
  "PCV7ytY7T9F7wuAaAaL1DbLNwRZAzuWGk3dUyz4pQK0nN0ZTbdoIciELw5LCdtar";
const API_SECRET =
  "WrCdNkQqiFdTesqj3ymplNgtZPARBdaCO6Dgv9zafsXCXK6Z33A1xecOqAGRTcMf";
let BINANCE_CLIENT = new Binance().options({
  APIKEY: API_KEY,
  APISECRET: API_SECRET,
});

let symbols = [
  "BTCUSDT",
  "ETHUSDT",
  "XRPUSDT",
  "BNBUSDT",
  "LTCUSDT",
  "ADAUSDT",
  "TRXUSDT",
  "LINKUSDT",
  "MATICUSDT",
];

async function getPositions() {
  let Positions = await BINANCE_CLIENT.futuresAccount();
  let Active_postitions = [];
  Object.keys(Positions).forEach((key) => {
    // console.log("key", Positions);
    if (key == "positions") {
      Positions[key].forEach((position) => {
        if (position.initialMargin > 0) {
          Active_postitions.push(position.symbol);
        }
      });
    }
  });

  return Active_postitions;
}

console.log("AAA", await getPositions());
