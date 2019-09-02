import {GraphQLScalarType} from "graphql";
import {Kind} from "graphql/language"
import GraphQLUnits from "./GraphQLUnits";

/**
 * 日期标量
 */
export const scalarDate = {
  schema: "scalar Date",
  resolver: new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    parseValue(value) {
      if (value === undefined || value === null) {
        return null
      } else if (typeof value === "string") {
        return new Date(value)
      } else {
        return null
      }
    },
    serialize(value) {
      if (value === undefined || value === null) {
        return null
      } else if (typeof value === "number") {
        return String(value)
      } else if (typeof value === "string") {
        return value
      } else {
        return GraphQLUnits.dateUnit(value, {unit: "datetime"})
      }
    },
    parseLiteral(ast) {
      if (ast === undefined || ast === null) {
        return null
      } else if (ast.kind === Kind.STRING) {
        return new Date(ast.value)
      } else {
        return null
      }
    },
  }),
}
