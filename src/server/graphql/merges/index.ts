import * as log4js from "log4js";
import * as lodash from "lodash";
import {DefinitionNode, DocumentNode, GraphQLObjectType, Kind, parse} from "graphql";
import {printWithComments, resetComments} from "./comments";
import {isSchemaDefinition} from "./utils";
import mergeGraphQLNodes, {IMergedResultMap} from "./merge-node";

/**
 * 合并类型定义
 */
export function mergeTypeDefs(types: string[], logger?: log4js.Logger): string {
  resetComments()

  const doc = {
    kind: Kind.DOCUMENT,
    definitions: mergeGraphQLTypes(types),
    useSchemaDefinition: true,
    forceSchemaDefinition: false,
    throwOnConflict: false,
    commentDescriptions: false,
  };

  const result = printWithComments(doc);

  resetComments();

  return result;
}

/**
 * 合并解析器
 */
export function mergeResolver(prefix: string, to: any, from: any, logger?: log4js.Logger): any {
  for (const key of Object.keys(from)) {
    // 获取解析器
    const resolver = from[key]
    // 合并
    if (lodash.isFunction(resolver)) {
      if (to.hasOwnProperty(key)) {
        if (logger) {
          logger.warn("Duplicated resolver: ", `${prefix}${key}`)
        }
      } else {
        to[key] = resolver
      }
    } else if (lodash.isObject(resolver)) {
      if (to.hasOwnProperty(key)) {
        mergeResolver(`${prefix}${key}.`, to[key], resolver, logger)
      } else {
        mergeResolver(`${prefix}${key}.`, to[key] = {}, resolver, logger)
      }
    }
  }
  return to
}

function mergeGraphQLTypes(types: string[]): DefinitionNode[] {
  resetComments();

  const allNodes: ReadonlyArray<DefinitionNode> = types
    .map<DocumentNode>((type) => parse(type))
    .map((ast) => ast.definitions)
    .reduce((defs, newDef = []) => [...defs, ...newDef], []);

  // XXX: right now we don't handle multiple schema definitions
  let schemaDef: {
    query: string | null | undefined;
    mutation: string | null | undefined;
    subscription: string | null | undefined;
  } = allNodes.filter(isSchemaDefinition).reduce(
    (def: any, node) => {
      node.operationTypes
        .filter((op) => op.type.name.value)
        .forEach((op) => {
          def[op.operation] = op.type.name.value;
        });

      return def;
    },
    {
      query: null,
      mutation: null,
      subscription: null,
    },
  );
  const mergedNodes: IMergedResultMap = mergeGraphQLNodes(allNodes);
  const allTypes = Object.keys(mergedNodes);

  const queryType = schemaDef.query ? schemaDef.query : allTypes.find((t) => t === "Query");
  const mutationType = schemaDef.mutation ? schemaDef.mutation : allTypes.find((t) => t === "Mutation");
  const subscriptionType = schemaDef.subscription ? schemaDef.subscription : allTypes.find((t) => t === "Subscription");
  schemaDef = {
    query: queryType,
    mutation: mutationType,
    subscription: subscriptionType,
  };

  const schemaDefinition = createSchemaDefinition(schemaDef, {
    force: true,
  });

  if (!schemaDefinition) {
    return Object.values(mergedNodes);
  }

  return [...Object.values(mergedNodes), parse(schemaDefinition).definitions[0]];
}

function createSchemaDefinition(
  def: {
    query: string | GraphQLObjectType | null | undefined;
    mutation: string | GraphQLObjectType | null | undefined;
    subscription: string | GraphQLObjectType | null | undefined;
  },
  config?: {
    force?: boolean;
  },
): string | undefined {
  const schemaRoot: {
    query?: string;
    mutation?: string;
    subscription?: string;
  } = {};

  if (def.query) {
    schemaRoot.query = def.query.toString();
  }
  if (def.mutation) {
    schemaRoot.mutation = def.mutation.toString();
  }
  if (def.subscription) {
    schemaRoot.subscription = def.subscription.toString();
  }

  const fields = Object.keys(schemaRoot)
    .map((rootType) => ((schemaRoot as any)[rootType] ? `${rootType}: ${(schemaRoot as any)[rootType]}` : null))
    .filter((a) => a);

  if (fields.length) {
    return `schema { ${fields.join("\n")} }`;
  } else if (config && config.force) {
    return ` schema { query: Query } `;
  }

  return undefined
}
