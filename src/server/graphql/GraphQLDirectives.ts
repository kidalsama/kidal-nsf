import {SchemaDirectiveVisitor} from "graphql-tools";
import {GraphQLField, GraphQLInt, GraphQLInterfaceType, GraphQLList, GraphQLObjectType, GraphQLString} from "graphql";
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
      field.args.push({
        name: "unit",
        description: undefined,
        type: GraphQLString,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }
    if (!field.args.find((it) => it.name === "precision")) {
      field.args.push({
        name: "precision",
        description: undefined,
        type: GraphQLInt,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }

    // 重写解析
    field.resolve = async function (source, {unit, precision, ...otherArgs}, context, info) {
      const result = defaultResolve
        ? await defaultResolve.call(this, source, otherArgs, context, info)
        : source[info.fieldName]

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
      field.args.push({
        name: "unit",
        description: undefined,
        type: GraphQLString,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }

    // 重写解析
    field.resolve = async function (source, {unit, ...otherArgs}, context, info) {
      const date = defaultResolve
        ? await defaultResolve.call(this, source, otherArgs, context, info)
        : source[info.fieldName]
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
      field.args.push({
        name: "unit",
        description: undefined,
        type: GraphQLString,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }
    if (!field.args.find((it) => it.name === "precision")) {
      field.args.push({
        name: "precision",
        description: undefined,
        type: GraphQLInt,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }

    // 重写解析
    field.resolve = async function (source, {unit, precision, ...otherArgs}, context, info) {
      const result = defaultResolve
        ? await defaultResolve.call(this, source, otherArgs, context, info)
        : source[info.fieldName]

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
      field.args.push({
        name: "unit",
        description: undefined,
        type: GraphQLString,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }

    // 重写解析
    field.resolve = async function (source, {unit, precision, ...otherArgs}, context, info) {
      const result = defaultResolve
        ? await defaultResolve.call(this, source, otherArgs, context, info)
        : source[info.fieldName]

      return GraphQLUnits.urlUnit(result, {
        unit: unit || defaultUnit,
      })
    }
  }
}

/**
 * 集合
 */
export class ConnectionDirective extends SchemaDirectiveVisitor {
  public static readonly NAME = "connection"
  public static readonly SCHEMA =
    `directive @connection(page: Int, limit: Int, order: [String]) on FIELD_DEFINITION`

  public visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: { objectType: GraphQLObjectType | GraphQLInterfaceType },
  ): GraphQLField<any, any> | void | null {
    const {resolve: defaultResolve} = field
    const {unit: defaultUnit, precision: defaultPrecision} = this.args

    // 在参数列表末尾添加page、limit、order参数
    if (!field.args.find((it) => it.name === "page")) {
      field.args.push({
        name: "page",
        description: undefined,
        type: GraphQLInt,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }
    if (!field.args.find((it) => it.name === "limit")) {
      field.args.push({
        name: "limit",
        description: undefined,
        type: GraphQLInt,
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }
    if (!field.args.find((it) => it.name === "order")) {
      field.args.push({
        name: "order",
        description: undefined,
        type: new GraphQLList(GraphQLString),
        defaultValue: null,
        extensions: undefined,
        astNode: undefined,
      })
    }
  }
}
