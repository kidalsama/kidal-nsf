import {SchemaDirectiveVisitor} from "graphql-tools";
import {GraphQLField, GraphQLInt, GraphQLInterfaceType, GraphQLObjectType, GraphQLString} from "graphql";
import GraphQLUnits from "./GraphQLUnits";

/**
 * 字节
 */
export class ByteDirective extends SchemaDirectiveVisitor {
  public static readonly NAME = "byte"
  public static readonly SCHEMA = `directive @byte(unit: String = "b", precision: Int = 0) on FIELD_DEFINITION`

  public visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: { objectType: GraphQLObjectType | GraphQLInterfaceType },
  ): GraphQLField<any, any> | void | null {
    const {resolve: defaultResolve} = field
    const {unit: defaultUnit, precision: defaultPrecision} = this.args

    // 在参数列表末尾添加unit、precision参数
    if (!field.args.find((it) => it.name === "unit")) {
      field.args.push({name: "unit", type: GraphQLString})
    }
    if (!field.args.find((it) => it.name === "precision")) {
      field.args.push({name: "precision", type: GraphQLInt})
    }

    // 重写解析
    field.resolve = async function (source, {unit, precision, ...otherArgs}, context, info) {
      const result = defaultResolve ? await defaultResolve.call(this, source, otherArgs, context, info) : null

      return GraphQLUnits.byteUnit(result, {
        unit: unit || defaultUnit,
        precision: precision || defaultPrecision,
      })
    }
  }
}

/**
 * 日期
 */
export class DateDirective extends SchemaDirectiveVisitor {
  public static readonly NAME = "date"
  public static readonly SCHEMA = `directive @date(unit: String = "datetime") on FIELD_DEFINITION`

  public visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: { objectType: GraphQLObjectType | GraphQLInterfaceType },
  ): GraphQLField<any, any> | void | null {
    const {resolve: defaultResolve} = field
    const {unit: defaultUnit} = this.args

    // 在参数列表末尾添加unit参数
    if (!field.args.find((it) => it.name === "unit")) {
      field.args.push({name: "unit", type: GraphQLString})
    }

    // 重写解析
    field.resolve = async function (source, {unit, ...otherArgs}, context, info) {
      const date = defaultResolve ? await defaultResolve.call(this, source, otherArgs, context, info) : null
      const typeOfDate = typeof date
      const instanceOfDate = date instanceof Date

      if (date === undefined || date === null) {
        return null
      } else if (typeOfDate === "number" || typeOfDate === "string") {
        return GraphQLUnits.dateUnit(new Date(date), {unit: unit || defaultUnit})
      } else if (instanceOfDate) {
        return GraphQLUnits.dateUnit(date, {unit: unit || defaultUnit})
      } else {
        return null
      }
    }
  }
}

/**
 * 时间
 */
export class TimeDirective extends SchemaDirectiveVisitor {
  public static readonly NAME = "time"
  public static readonly SCHEMA = `directive @time(unit: String = "ms", precision: Int = 0) on FIELD_DEFINITION`

  public visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: { objectType: GraphQLObjectType | GraphQLInterfaceType },
  ): GraphQLField<any, any> | void | null {
    const {resolve: defaultResolve} = field
    const {unit: defaultUnit, precision: defaultPrecision} = this.args

    // 在参数列表末尾添加unit、precision参数
    if (!field.args.find((it) => it.name === "unit")) {
      field.args.push({name: "unit", type: GraphQLString})
    }
    if (!field.args.find((it) => it.name === "precision")) {
      field.args.push({name: "precision", type: GraphQLInt})
    }

    // 重写解析
    field.resolve = async function (source, {unit, precision, ...otherArgs}, context, info) {
      const result = defaultResolve ? await defaultResolve.call(this, source, otherArgs, context, info) : null

      return GraphQLUnits.timeUnit(result, {
        unit: unit || defaultUnit,
        precision: precision || defaultPrecision,
      })
    }
  }
}

/**
 * Url
 */
export class UrlDirective extends SchemaDirectiveVisitor {
  public static readonly NAME = "url"
  public static readonly SCHEMA = `directive @url(unit: String) on FIELD_DEFINITION`

  public visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: { objectType: GraphQLObjectType | GraphQLInterfaceType },
  ): GraphQLField<any, any> | void | null {
    const {resolve: defaultResolve} = field
    const {unit: defaultUnit, precision: defaultPrecision} = this.args

    // 在参数列表末尾添加unit参数
    if (!field.args.find((it) => it.name === "unit")) {
      field.args.push({name: "unit", type: GraphQLString})
    }

    // 重写解析
    field.resolve = async function (source, {unit, precision, ...otherArgs}, context, info) {
      const result = defaultResolve ? await defaultResolve.call(this, source, otherArgs, context, info) : null

      return GraphQLUnits.urlUnit(result, {
        unit: unit || defaultUnit,
      })
    }
  }
}