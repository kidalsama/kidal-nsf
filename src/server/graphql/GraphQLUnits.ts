import UrlUtils from "../../util/UrlUtils";
import Maybe from "../../util/Maybe";

const formatTime = (date: Date, fmt: string = "yyyy-MM-dd hh:mm:ss") => {
  if (/(y+)/.test(fmt)) {
    const _$1 = RegExp.$1;
    const year = (date.getFullYear() + "").substr(4 - _$1.length, _$1.length);
    fmt = fmt.replace(_$1, year);
  }
  const o: any = {
    M: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds()
  };
  fmt = fmt.replace(/([Mdhms])+/g, (rez: string, key) => {
    return (o[key] + "").padStart(rez.length, "0");
  });
  return fmt;
};

export default {
  /**
   * 字节单位
   */
  byteUnit(
    result: Maybe<number>,
    args?: { unit?: string; precision?: number }
  ): number | null {
    if (!result) {
      return null;
    }

    let proceed = Number(result);
    if (args && args.unit !== undefined && args.unit !== null) {
      switch (args.unit) {
        case "b":
        case "byte":
          proceed = result;
          break;
        case "kb":
        case "kilobyte":
          proceed = result / 1024;
          break;
        case "mb":
        case "megabyte":
          proceed = result / (1024 * 1024);
          break;
        case "gb":
        case "gigabyte":
          proceed = result / (1024 * 1024 * 1024);
          break;
      }
    }

    if (args && args.precision && args.precision > 0) {
      proceed = Number(proceed.toFixed(args.precision));
    } else {
      proceed = Math.floor(proceed);
    }

    return proceed;
  },
  /**
   * 日期单位
   */
  dateUnit(
    result: Maybe<Date>,
    args?: { unit?: string }
  ): Maybe<string | number> {
    if (!result) {
      return null;
    }

    let fmt;
    if (args && args.unit !== undefined && args.unit !== null) {
      switch (args.unit) {
        case "timestamp":
          return result.getTime();
        case "unix-timestamp":
          return Math.floor(result.getTime() / 1000);
        case "date":
          fmt = "yyyy-MM-dd";
          break;
        case "datetime":
          fmt = "yyyy-MM-dd hh:mm:ss";
          break;
        case "datetime-no-sec":
        case "without-sec":
        case "no-sec":
          fmt = "yyyy-MM-dd hh:mm";
          break;
        default:
          fmt = args.unit;
          break;
      }
    }
    return formatTime(result, fmt);
  },
  /**
   * 时间单位
   */
  timeUnit(
    result: Maybe<number>,
    args?: { unit?: string; precision?: number }
  ): Maybe<number> {
    if (!result) {
      return null;
    }

    let proceed = Number(result);
    if (args && args.unit !== undefined && args.unit !== null) {
      switch (args.unit) {
        case "ms":
        case "milliseconds":
          proceed = result;
          break;
        case "s":
        case "seconds":
          proceed = result / 1000;
          break;
        case "m":
        case "minutes":
          proceed = result / (1000 * 60);
          break;
        case "h":
        case "hours":
          proceed = result / (1000 * 60 * 60);
          break;
        case "d":
        case "days":
          proceed = result / (1000 * 60 * 60 * 24);
          break;
      }
    }

    if (args && args.precision && args.precision > 0) {
      proceed = Number(proceed.toFixed(args.precision));
    } else {
      proceed = Math.floor(proceed);
    }

    return proceed;
  },
  /**
   * Url单位
   */
  urlUnit(result: Maybe<string>, args?: { unit?: string }): Maybe<string> {
    if (!result) {
      return null;
    }

    let proceed: Maybe<string> = result;
    if (args && args.unit !== undefined && args.unit !== null) {
      switch (args.unit) {
        case "//":
          proceed = UrlUtils.removeProtocol(result);
          break;
        case "http":
          proceed = "http:" + UrlUtils.removeProtocol(result);
          break;
        case "https":
          proceed = "https:" + UrlUtils.removeProtocol(result);
          break;
      }
    }

    return proceed;
  }
};
