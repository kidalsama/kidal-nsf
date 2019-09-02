import {SchemaDirectiveVisitor} from "graphql-tools";
import {GraphQLField, GraphQLInterfaceType, GraphQLObjectType, GraphQLString} from "graphql";
import GraphQLUnits from "./GraphQLUnits";

/**
 * DateUnit
 */
export class DateUnitDirective extends SchemaDirectiveVisitor {
  public static readonly SCHEMA = `directive @DateUnit(unit: String = "datetime") on FIELD_DEFINITION`

  public visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: { objectType: GraphQLObjectType | GraphQLInterfaceType },
  ): GraphQLField<any, any> | void | null {
    const {resolve: defaultResolve} = field
    const {unit: defaultUnit} = this.args

    field.args.push({
      name: "unit",
      type: GraphQLString,
    })

    field.resolve = async function (
      source,
      {unit, ...otherArgs},
      context,
      info,
    ) {
      const date = defaultResolve ? await defaultResolve.call(this, source, otherArgs, context, info) : null

      if (date === undefined || date === null) {
        return null
      } else if (typeof date === "number" || typeof date === "string") {
        return GraphQLUnits.dateUnit(new Date(date), {unit})
      } else if (date instanceof Date) {
        return GraphQLUnits.dateUnit(date, {unit: unit || defaultUnit})
      } else {
        return null
      }
    }
  }
}
