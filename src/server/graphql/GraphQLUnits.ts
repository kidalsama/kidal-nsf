import Maybe from "graphql/tsutils/Maybe";

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
    s: date.getSeconds(),
  };
  fmt = fmt.replace(/([Mdhms])+/g, (rez: string, key) => {
    return (o[key] + "").padStart(rez.length, "0");
  });
  return fmt;
};

export default {
  dateUnit(result: Maybe<Date>, args?: { unit?: string }): string | number | null {
    if (!result) {
      return null;
    }

    let fmt;
    if (args && args.unit) {
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
          fmt = "yyyy-MM-dd hh:mm";
          break;
        default:
          fmt = args.unit
          break;
      }
    }
    return formatTime(result, fmt);
  },
};
