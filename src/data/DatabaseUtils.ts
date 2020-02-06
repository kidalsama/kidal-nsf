import * as lodash from "lodash";
import { col, FindOptionsOrderArray, fn, literal } from "sequelize";

export default {
  /**
   * 标准化更新的参数
   */
  normalizeUpdateValues(
    values: { [key: string]: any },
    allowNull?: boolean
  ): { [key: string]: any } {
    const keys = Object.keys(values);
    const normalized: { [key: string]: any } = {};
    for (const key of keys) {
      const value = values[key];
      if (value !== undefined && (allowNull || value !== null)) {
        normalized[key] = value;
      }
    }
    return normalized;
  },

  /**
   * 标准化查询条件
   */
  normalizeWhereValues(
    values: { [key: string]: any },
    allowNull?: boolean
  ): { [key: string]: any } {
    const keys = Object.keys(values);
    const normalized: { [key: string]: any } = {};
    for (const key of keys) {
      const value = values[key];
      if (value !== undefined && (allowNull || value !== null)) {
        normalized[key] = value;
      }
    }
    return normalized;
  },

  /**
   * 标准化排序条件
   */
  normalizeOrderValues(
    values: string[] | undefined | null,
    allows?: string[],
    builder?: (
      instruction: string
    ) => string | col | literal | FindOptionsOrderArray | fn | undefined
  ): Array<string | col | literal | FindOptionsOrderArray | fn> {
    if (values === undefined || values === null || values.length === 0) {
      return [];
    }
    const orderValues: Array<
      string | col | literal | FindOptionsOrderArray | fn
    > = [];
    values.forEach(instruction => {
      let orderValue;
      if (instruction.startsWith(".") && builder) {
        orderValue = builder(instruction);
      } else {
        const kv = instruction.split(" ");
        if (
          kv.length === 2 &&
          (allows === undefined || allows.includes(kv[0])) &&
          ["asc", "desc"].includes(kv[1])
        ) {
          orderValue = [kv[0], kv[1]];
        }
      }
      if (orderValue !== undefined) {
        orderValues.push(orderValue);
      }
    });
    return orderValues;
  },

  /**
   * 使用like语法
   */
  wcUseLike(val: any) {
    if (val === undefined || val === null) {
      return val;
    }
    if (lodash.isArray(val)) {
      return { $like: val.map(it => `%${it}%`) };
    } else {
      return { $like: `%${val}%` };
    }
  },

  /**
   * 使用between语法
   */
  wcUseBetween(val: any, orGTE?: boolean) {
    if (val === undefined || val === null) {
      return val;
    }
    if (!lodash.isArray(val)) {
      return orGTE ? { $gte: val } : undefined;
    }
    if (val.length === 0) {
      return undefined;
    } else if (val.length === 1) {
      return orGTE ? { $gte: val[0] } : undefined;
    } else {
      return { $between: [val[0], val[1]] };
    }
  }
};
