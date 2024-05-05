//  + "000" no need in BINANCE API

export default function runModel(
  config,
  trade_hours,
  history,
  refresh_bars,
  start_time
) {
  if (config.bars.length == 0) return;

  if (!history) {
    history = {};
  }

  //CCI setttings
  let len = config.cciLength; // parametr
  let valueCCI = config.valueCCI;

  // Config settings
  let timeframe = config["bars"][0].timeframe;
  let isintraday = timeframe.includes("H") || timeframe.includes("min");
  let orderCall = config.orderCall;
  let barsCloseReversal = config.barsCloseReversal;
  let barsClose = config.barsClose;
  let barsIgnore = config.barsIgnore;
  let barsIgnoreClose = config.barsIgnoreClose;
  let profitPercantage = config.profitPercantage;
  let lossPercantage = config.lossPercantage;
  let enableSLbyReversal = config.enableSLbyReversal;
  let order = 1000;

  // Bars Data
  let bars_data = config.bars;
  //console.log("bars_data", bars_data[0]);
  let low = bars_data.map((el) => el.low);
  let high = bars_data.map((el) => el.high);
  let close = bars_data.map((el) => el.close);
  let open = bars_data.map((el) => el.open);
  let time = bars_data.map((el) => el.time);
  let source_bar_index = bars_data.map((el) => el.Index_bar);

  let startPoint = bars_data[0].open;
  let endPoint = bars_data[bars_data.length - 1].close;
  let instrumentDelta = ((endPoint - startPoint) / startPoint) * 100;

  // VARIABLES
  var lastLow = !!history.lastLow ? history.lastLow : 0.0;
  var lastHigh = !!history.lastHigh ? history.lastHigh : 0.0;
  // main
  var arrayStatistics = Array.isArray(history.arrayStatistics)
    ? history.arrayStatistics
    : [];
  // long
  var lastReversalBarsLong = Array.isArray(history.lastReversalBarsLong)
    ? history.lastReversalBarsLong
    : [];
  var entryPriceLong = Array.isArray(history.entryPriceLong)
    ? history.entryPriceLong
    : [];
  var entryBarindexLong = Array.isArray(history.entryBarindexLong)
    ? history.entryBarindexLong
    : [];
  // short
  var lastReversalBarsShort = Array.isArray(history.lastReversalBarsShort)
    ? history.lastReversalBarsShort
    : [];
  var entryPriceShort = Array.isArray(history.entryPriceShort)
    ? history.entryPriceShort
    : [];
  var entryBarindexShort = Array.isArray(history.entryBarindexShort)
    ? history.entryBarindexShort
    : [];

  if (refresh_bars) {
    arrayStatistics.forEach((order) => {
      if (typeof order.barIndex == "number") order.barIndex--;
      if (typeof order.barIndexExit == "number") order.barIndexExit--;
    });

    entryBarindexLong = entryBarindexLong.map((el) => (el = el - 1));
    entryBarindexShort = entryBarindexShort.map((el) => (el = el - 1));

    lastReversalBarsLong = lastReversalBarsLong.map(
      (el) => (el.barIndex = el.barIndex - 1)
    );
    lastReversalBarsShort = lastReversalBarsShort.map(
      (el) => (el.barIndex = el.barIndex - 1)
    );
  }

  var bearishReversal = undefined;
  var bullishReversal = undefined;
  var bullish_TAR = undefined;
  var bearish_TAR = undefined;

  var isProfitPercantage = profitPercantage > 0.0;
  var isLossPercantage = lossPercantage > 0.0;
  var isBarsClose = barsClose > 0;
  var isBarsCloseReversal = barsCloseReversal > 0;

  // UTILS FUNCTIONS
  function inTradeTime() {
    let current = new Date();
    let current_str = `${current.getHours()}${current.getMinutes()}`;

    let trade_hours_splitted = trade_hours.split("-");

    let start_str = trade_hours_splitted[0];
    let end_str = trade_hours_splitted[1];

    if (+current_str >= +start_str && +current_str <= +end_str) {
      return true;
    } else {
      return false;
    }
  }
  function endTrade() {
    let current = new Date();
    let current_str = `${current.getHours()}${current.getMinutes()}`;

    let trade_hours_splitted = trade_hours.split("-");
    let end_str = trade_hours_splitted[1];
    if (+current_str >= +end_str) {
      return true;
    } else {
      return false;
    }
  }

  function countTakeProfitPerTrade(initPrice, lastPrice, order) {
    return (order / initPrice) * (lastPrice - initPrice);
  }
  function findIndexByBarIndex(arrayBla, value) {
    let result = -1;
    arrayBla.forEach((el, index) => {
      if (el.barIndex && el.barIndex == value) {
        result = index;
      }
    });
    return result;
  }

  /// START
  let bar_index = bars_data.length - 1;
  let ifInTradeTime = inTradeTime();
  let ifEndTrade = endTrade();
  let ifAlreadyExist =
    arrayStatistics.length > 0 &&
    arrayStatistics[arrayStatistics.length - 1].barIndex == bar_index
      ? true
      : false;

  let closedBySL = false;
  let closedByTP = false;
  if (bar_index < 1) return;
  bearishReversal =
    (orderCall == "Both" || orderCall == "Long Only") &&
    high[bar_index] > high[bar_index - 1] &&
    close[bar_index] < close[bar_index - 1];
  bullishReversal =
    (orderCall == "Both" || orderCall == "Short Only") &&
    low[bar_index] < low[bar_index - 1] &&
    close[bar_index] > close[bar_index - 1];
  bullish_TAR =
    (orderCall == "Both" || orderCall == "Long Only") &&
    low[bar_index - 1] < low[bar_index - 2] &&
    close[bar_index - 1] > close[bar_index - 2] &&
    high[bar_index] > high[bar_index - 1];
  bearish_TAR =
    (orderCall == "Both" || orderCall == "Short Only") &&
    high[bar_index - 1] > high[bar_index - 2] &&
    close[bar_index - 1] < close[bar_index - 2] &&
    low[bar_index] < low[bar_index - 1];

  // COUNT CCI
  let cci = undefined;
  let src = undefined;
  let isEnableCCICriteria = bar_index > len; // config.cciLength && config.cciValue && close > len;
  if (isEnableCCICriteria && bar_index) {
    src = close.slice(bar_index - len + 1, bar_index + 1);
    let ma = src.reduce((a, b) => a + b, 0) / len;
    let dev =
      src.map((el) => Math.abs(el - ma)).reduce((a, b) => a + b, 0) / len;
    cci = (close[bar_index] - ma) / (0.015 * dev);
  }
  var conditionCloseLong = isEnableCCICriteria ? cci > valueCCI : true;
  let conditionCloseShort = isEnableCCICriteria ? cci < -1 * valueCCI : true;
  let conditionCCIEnterLong = isEnableCCICriteria ? !conditionCloseLong : true;
  let conditionCCIEnterShort = isEnableCCICriteria
    ? !conditionCloseShort
    : true;

  //cci
  //LONG
  if (
    low[bar_index] < low[bar_index - 1] &&
    close[bar_index] > close[bar_index - 1]
  ) {
    let reversal_bar_long = {
      barIndex: bar_index,
      barLow: low[bar_index],
      barHigh: high[bar_index],
      isOutter: true,
    };
    lastReversalBarsLong.push(reversal_bar_long);
  }
  if (lastReversalBarsLong.length > 0 && barsCloseReversal > 0) {
    let temp_el = lastReversalBarsLong[lastReversalBarsLong.length - 1];
    temp_el.isOutter = temp_el.barLow > low[bar_index];
    if (bar_index - temp_el.barIndex < barsCloseReversal) {
      lastReversalBarsLong = [];
    } else if (temp_el.barHigh < high[bar_index]) {
      bullish_TAR = true;
      lastReversalBarsLong = [];
    }
  }

  //SHORT
  if (
    high[bar_index] > high[bar_index - 1] &&
    close[bar_index] < close[bar_index - 1]
  ) {
    let reversal_bar_short = {
      barIndex: bar_index,
      barLow: low[bar_index],
      barHigh: high[bar_index],
      isOutter: true,
    };
    lastReversalBarsShort.push(reversal_bar_short);
  }
  if (lastReversalBarsShort.length > 0 && barsCloseReversal > 0) {
    let temp_el = lastReversalBarsShort[lastReversalBarsShort.length - 1];
    temp_el.isOutter = temp_el.barHigh < high[bar_index];
    if (bar_index - temp_el.barIndex < barsCloseReversal) {
      lastReversalBarsShort = [];
    } else if (temp_el.barLow > low[bar_index]) {
      bearish_TAR = true;
      lastReversalBarsShort = [];
    }
  }

  // ENTER ORDERS
  let isOpenedTrades =
    arrayStatistics && arrayStatistics.length > 0
      ? arrayStatistics[arrayStatistics.length - 1] &&
        !!arrayStatistics[arrayStatistics.length - 1].exitPrice
      : false;
  let condBarsIgnore =
    arrayStatistics.length > 0 || isOpenedTrades
      ? bar_index - arrayStatistics[arrayStatistics.length - 1].barIndex >
        barsIgnore
      : true;
  let condBarsIgnoreAfterClose =
    arrayStatistics.length > 0 && isintraday
      ? bar_index -
          (arrayStatistics[arrayStatistics.length - 1].barIndexExit || 0) >
        barsIgnoreClose
      : true;
  // condBarsIgnoreAfterClose = barsIgnoreClose
  //   ? condBarsIgnoreAfterClose
  //   : true;

  // LONG
  if (
    ifInTradeTime &&
    !ifAlreadyExist &&
    bullish_TAR &&
    condBarsIgnore &&
    conditionCCIEnterLong &&
    condBarsIgnoreAfterClose
  ) {
    let countEntryPrice =
      open[bar_index] > high[bar_index - 1]
        ? open[bar_index]
        : high[bar_index - 1];

    //
    let ifSamePrice =
      arrayStatistics.length > 0 &&
      !arrayStatistics[arrayStatistics.length - 1].barExit
        ? arrayStatistics[arrayStatistics.length - 1].initPrice ==
          countEntryPrice
        : false;
    if (ifSamePrice) return;

    entryPriceLong.push(countEntryPrice);
    entryBarindexLong.push(bar_index);
    let addItem = {
      entrySignal: "BullTAR",
      barIndex: bar_index,
      sourceBarIndex: source_bar_index[bar_index],
      exitPrice: null,
      timeEnter: time[bar_index],
      timeTransformed: new Date(+time[bar_index]).toDateString(),
      initPrice: countEntryPrice,
      id: arrayStatistics.length + 1,
    };
    arrayStatistics.push(addItem);
    lastLow = low[bar_index - 1];

    // CLOSED BY CHANGE DIRECTION
    if (entryPriceShort.length > 0) {
      for (let index = entryPriceShort.length - 1; index >= 0; index--) {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexShort[index]
        );
        arrayStatistics[elIndex].timeExit = time[bar_index];
        arrayStatistics[elIndex].signalExit = "Direction";
        arrayStatistics[elIndex].exitPrice = countEntryPrice;
        arrayStatistics[elIndex].profit =
          countTakeProfitPerTrade(
            entryPriceShort[index],
            countEntryPrice,
            order
          ) * -1;
        arrayStatistics[elIndex].barIndexExit = bar_index;
        arrayStatistics[elIndex].sourceBarIndexExit =
          source_bar_index[bar_index];
      }
      entryPriceShort = [];
      entryBarindexShort = [];
    }
  }

  // SHORT
  if (
    ifInTradeTime &&
    !ifAlreadyExist &&
    bearish_TAR &&
    condBarsIgnore &&
    conditionCCIEnterShort &&
    condBarsIgnoreAfterClose
  ) {
    let countEntryPrice =
      low[bar_index - 1] > open[bar_index]
        ? open[bar_index]
        : low[bar_index - 1];

    let ifSamePrice =
      arrayStatistics.length > 0 &&
      !arrayStatistics[arrayStatistics.length - 1].barExit
        ? arrayStatistics[arrayStatistics.length - 1].initPrice ==
          countEntryPrice
        : false;
    if (ifSamePrice) return;

    entryPriceShort.push(countEntryPrice);
    entryBarindexShort.push(bar_index);
    let addItem = {
      entrySignal: "BearTAR",
      barIndex: bar_index,
      sourceBarIndex: source_bar_index[bar_index],
      exitPrice: null,
      timeEnter: time[bar_index],
      timeTransformed: new Date(+time[bar_index]).toDateString(),
      initPrice: countEntryPrice,
      id: arrayStatistics.length + 1,
    };
    arrayStatistics.push(addItem);
    lastHigh = high[bar_index - 1];

    // CLOSED BY CHANGE DIRECTION
    if (entryPriceLong.length > 0) {
      for (let index = entryPriceLong.length - 1; index >= 0; index--) {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexLong[index]
        );
        arrayStatistics[elIndex].timeExit = time[bar_index];
        arrayStatistics[elIndex].signalExit = "Direction";
        arrayStatistics[elIndex].exitPrice = countEntryPrice;
        arrayStatistics[elIndex].profit = countTakeProfitPerTrade(
          entryPriceLong[index],
          countEntryPrice,
          order
        );
        arrayStatistics[elIndex].barIndexExit = bar_index;
        arrayStatistics[elIndex].sourceBarIndexExit =
          source_bar_index[bar_index];
      }
      entryPriceLong = [];
      entryBarindexLong = [];
    }
  }
  //CLOSED BY SL

  //LONG
  if (entryPriceLong.length > 0 && isLossPercantage) {
    for (let index = entryPriceLong.length - 1; index >= 0; index--) {
      let SL_price =
        entryPriceLong[entryPriceLong.length - 1] *
        ((100 - lossPercantage) / 100);
      if (
        SL_price >= low[bar_index] &&
        bar_index >= entryBarindexLong[entryBarindexLong.length - 1]
      ) {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexLong[index]
        );
        arrayStatistics[elIndex] = {
          ...arrayStatistics[elIndex],
          timeExit: time[bar_index],
          signalExit: "SL",
          exitPrice: SL_price,
          profit: countTakeProfitPerTrade(
            entryPriceLong[index],
            SL_price,
            order
          ),
          barIndexExit: bar_index,
          sourceBarIndexExit: source_bar_index[bar_index],
        };
        closedBySL = true;
      }
    }
    if (closedBySL) {
      entryPriceLong = [];
      entryBarindexLong = [];
    }
  }

  if (
    enableSLbyReversal &&
    (!isLossPercantage || !closedBySL) &&
    low[bar_index] < lastLow &&
    entryBarindexLong.length > 0
  ) {
    closedBySL = true;
    if (
      entryPriceLong.length > 0 &&
      bar_index >= entryBarindexLong[entryBarindexLong.length - 1]
    ) {
      entryPriceLong.forEach((el, index) => {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexLong[index]
        );

        if (elIndex != -1) {
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "SL(Reversal)",
            exitPrice: lastLow,
            profit: countTakeProfitPerTrade(
              arrayStatistics[elIndex].initPrice,
              lastLow,
              order
            ),
            barIndexExit: bar_index,
            sourceBarIndexExit: source_bar_index[bar_index],
          };
        }
      });
      entryPriceLong = [];
      entryBarindexLong = [];
    }
  }

  // SHORT
  if (entryPriceShort.length > 0 && isLossPercantage) {
    for (let index = entryPriceShort.length - 1; index >= 0; index--) {
      let SL_price =
        entryPriceShort[entryPriceShort.length - 1] *
        ((100 + lossPercantage) / 100);
      if (
        SL_price <= high[bar_index] &&
        bar_index >= entryBarindexShort[entryBarindexShort.length - 1]
      ) {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexShort[index]
        );
        if (elIndex != -1) {
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "SL",
            exitPrice: SL_price,
            profit:
              countTakeProfitPerTrade(entryPriceShort[index], SL_price, order) *
              -1,
            barIndexExit: bar_index,
            sourceBarIndexExit: source_bar_index[bar_index],
          };

          closedBySL = true;
        }
      }
    }
    if (closedBySL) {
      entryPriceShort = [];
      entryBarindexShort = [];
    }
  }

  if (
    enableSLbyReversal &&
    (!isLossPercantage || !closedBySL) &&
    high[bar_index] > lastHigh &&
    entryBarindexShort.length > 0
  ) {
    closedBySL = true;
    if (
      entryPriceShort.length > 0 &&
      bar_index >= entryBarindexShort[entryBarindexShort.length - 1]
    ) {
      entryPriceShort.forEach((el, index) => {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexShort[index]
        );
        if (elIndex != -1) {
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "SL(Reversal)",
            exitPrice: lastHigh,
            profit:
              countTakeProfitPerTrade(
                +arrayStatistics[elIndex].initPrice,
                +lastHigh,
                order
              ) * -1,
            barIndexExit: bar_index,
            sourceBarIndexExit: source_bar_index[bar_index],
          };
        }
      });
      entryPriceShort = [];
      entryBarindexShort = [];
    }
  }

  // CLOSED BY REVERSAL
  // LONG
  if (bearishReversal) {
    if (entryPriceLong.length > 0) {
      entryPriceLong.forEach((el, index) => {
        if (
          bar_index - entryBarindexLong[entryBarindexLong.length - 1] >
          barsCloseReversal
        ) {
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexLong[index]
          );
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "Reversal",
            exitPrice: low[bar_index - 1],
            profit: countTakeProfitPerTrade(
              arrayStatistics[elIndex].initPrice,
              low[bar_index - 1],
              order
            ),
            barIndexExit: bar_index,
            sourceBarIndexExit: source_bar_index[bar_index],
          };
          entryPriceLong.splice(index, 1);
          entryBarindexLong.splice(index, 1);
        }
      });
    }
  }
  // SHORT
  if (bullishReversal) {
    if (entryPriceShort.length > 0) {
      entryPriceShort.forEach((el, index) => {
        if (
          bar_index - entryBarindexShort[entryPriceShort.length - 1] >
          barsCloseReversal
        ) {
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexShort[index]
          );
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "Reversal",
            exitPrice: high[bar_index - 1],
            profit:
              countTakeProfitPerTrade(
                arrayStatistics[elIndex].initPrice,
                high[bar_index - 1],
                order
              ) * -1,
            barIndexExit: bar_index,
            sourceBarIndexExit: source_bar_index[bar_index],
          };
          entryPriceShort.splice(index, 1);
          entryBarindexShort.splice(index, 1);
        }
      });
    }
  }

  //CLOSED BY  TP
  //LONG
  if (entryPriceLong.length > 0 && isProfitPercantage) {
    for (let index = entryPriceLong.length - 1; index >= 0; index--) {
      let TP_price =
        entryPriceLong[entryPriceLong.length - 1] *
        ((100 + profitPercantage) / 100);
      if (
        TP_price <= high[bar_index] &&
        bar_index > entryBarindexLong[entryBarindexLong.length - 1]
      ) {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexLong[index]
        );
        arrayStatistics[elIndex] = {
          ...arrayStatistics[elIndex],
          timeExit: time[bar_index],
          signalExit: "TP",
          exitPrice: TP_price,
          profit: countTakeProfitPerTrade(
            arrayStatistics[elIndex].initPrice,
            TP_price,
            order
          ),
          barIndexExit: bar_index,
          sourceBarIndexExit: source_bar_index[bar_index],
        };
        closedByTP = true;
      }
    }
    if (closedByTP) {
      entryPriceLong = [];
      entryBarindexLong = [];
    }
  }
  //SHORT
  if (entryPriceShort.length > 0 && isProfitPercantage) {
    for (let index = entryPriceShort.length - 1; index >= 0; index--) {
      let TP_price =
        (entryPriceShort[entryPriceShort.length - 1] *
          (100 - profitPercantage)) /
        100;
      if (
        TP_price >= low[bar_index] &&
        bar_index >= entryBarindexShort[entryBarindexShort.length - 1]
      ) {
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexShort[index]
        );
        if (elIndex != -1) {
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "TP",
            exitPrice: TP_price,
            profit:
              countTakeProfitPerTrade(
                arrayStatistics[elIndex].initPrice,
                TP_price,
                order
              ) * -1,
            barIndexExit: bar_index,
            sourceBarIndexExit: source_bar_index[bar_index],
          };

          closedByTP = true;
        }
      }
    }
    if (closedByTP) {
      entryPriceShort = [];
      entryBarindexShort = [];
    }
  }

  // CLOSED BY BAR INDEX
  //LONG
  if (entryBarindexLong.length > 0 && entryPriceLong.length > 0) {
    for (let index = entryBarindexLong.length - 1; index >= 0; index--) {
      if (entryPriceLong.length > 0) {
        if (
          bar_index - barsClose >=
            entryBarindexLong[entryBarindexLong.length - 1] &&
          isBarsClose
        ) {
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexLong[index]
          );
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "Bars",
            exitPrice: open[bar_index],
            profit: countTakeProfitPerTrade(
              arrayStatistics[elIndex].initPrice,
              open[bar_index],
              order
            ),
            barIndexExit: bar_index,
            sourceBarIndexExit: source_bar_index[bar_index],
          };
          entryPriceLong.splice(index, 1);
          entryBarindexLong.splice(index, 1);
        }
      }
    }
  }
  //SHORT
  if (entryBarindexShort.length > 0 && entryPriceShort.length > 0) {
    for (let index = entryBarindexShort.length - 1; index >= 0; index--) {
      if (entryPriceShort.length > 0) {
        if (
          bar_index - barsClose >=
            entryBarindexShort[entryBarindexShort.length - 1] &&
          isBarsClose
        ) {
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexShort[index]
          );
          if (elIndex != -1) {
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "Bars",
              exitPrice: open[bar_index],
              profit:
                countTakeProfitPerTrade(
                  arrayStatistics[elIndex].initPrice,
                  open[bar_index],
                  order
                ) * -1,
              barIndexExit: bar_index,
              sourceBarIndexExit: source_bar_index[bar_index],
            };
            entryPriceShort.splice(index, 1);
            entryBarindexShort.splice(index, 1);
          }
        }
      }
    }
  }

  // START CCI

  if (
    conditionCloseLong &&
    isEnableCCICriteria &&
    entryBarindexLong.length > 0 &&
    entryPriceLong.length > 0
  ) {
    for (let i = entryPriceLong.length - 1; i >= 0; i--) {
      let elIndex = findIndexByBarIndex(arrayStatistics, entryBarindexLong[i]);
      arrayStatistics[elIndex] = {
        ...arrayStatistics[elIndex],
        timeExit: time[bar_index],
        signalExit: "CCI Long",
        exitPrice: close[bar_index],
        profit: countTakeProfitPerTrade(
          entryPriceLong[i],
          close[bar_index],
          order
        ),
        barIndexExit: bar_index,
        sourceBarIndexExit: source_bar_index[bar_index],
      };
    }
    entryPriceLong = [];
    entryBarindexLong = [];
  }

  //array.set(arrayStatistics , elIndex , el   )

  // // SHORT
  if (
    conditionCloseShort &&
    isEnableCCICriteria &&
    entryBarindexShort.length > 0 &&
    entryPriceShort.length > 0
  ) {
    for (let i = entryPriceShort.length - 1; i >= 0; i--) {
      let elIndex = findIndexByBarIndex(arrayStatistics, entryBarindexShort[i]);
      arrayStatistics[elIndex] = {
        ...arrayStatistics[elIndex],
        timeExit: time[bar_index],
        signalExit: "CCI Short",
        exitPrice: close[bar_index],
        profit: countTakeProfitPerTrade(
          entryPriceShort[i],
          close[bar_index],
          order
        ),
        barIndexExit: bar_index,
        sourceBarIndexExit: source_bar_index[bar_index],
      };
    }
    entryPriceShort = [];
    entryBarindexShort = [];
  }

  let AllOrders = {
    closed: 0,
    opened: 0,
  };
  arrayStatistics.forEach((el) => {
    AllOrders.opened = AllOrders.opened + 1;
    if (el.signalExit) {
      AllOrders.closed = AllOrders.closed + 1;
    }
  });

  // Profit calculate + info about orders
  let profit = 0;
  let unclosed_arr = [];
  let closed = { unclosed: 0 };
  let Exit_signals = {};
  arrayStatistics.forEach((el) => {
    if (el.profit && el.profit != null) {
      profit += el.profit;
      if (!Exit_signals["total"]) {
        Exit_signals["total"] = 0;
      }
      Exit_signals["total"] = Exit_signals["total"] + 1;

      if (!Exit_signals[el.signalExit]) {
        Exit_signals[el.signalExit] = 1;
      } else {
        Exit_signals[el.signalExit] += 1;
      }

      if (!closed[el.signalExit]) {
        closed[el.signalExit] = 0;
      }
      closed[el.signalExit] += 1;
    } else {
      unclosed_arr.push(el);
      closed.unclosed += 1;
    }
  });

  Exit_signals["total"] = arrayStatistics.length;

  // console.log("All orders :", arrayStatistics.length);
  // console.log("PROFIT : ", profit);
  // console.log("Orders status: ", closed);
  delete config["bars"];

  // REWRITE HISTORY VARIABLES
  history = {
    arrayStatistics,
    lastLow,
    lastHigh,
    entryPriceLong,
    lastReversalBarsLong,
    entryBarindexLong,
    entryPriceShort,
    lastReversalBarsShort,
    entryBarindexShort,
  };

  let countProfitDelta = ((Math.floor(profit) + order) / order) * 100 - 100;
  countProfitDelta = Math.round(countProfitDelta * 100) / 100;

  return {
    isRunning:
      ifEndTrade && AllOrders.opened == AllOrders.closed ? false : true,
    profit: Math.floor(profit),
    profitDelta: countProfitDelta,
    initDate: start_time,
    startDate: new Date(+time[0]).toLocaleString(),
    finishDate: new Date(+time[time.length - 1]).toLocaleString(),
    instrumentDelta: instrumentDelta,
    orders: arrayStatistics.length,
    bars: bars_data.length,
    Exit_signals,
    history,
    //config
  };
}
