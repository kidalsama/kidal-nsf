import {DefinitionNode} from "graphql";
import {collectComment} from "./comments";
import {
  isGraphQLDirective,
  isGraphQLEnum,
  isGraphQLEnumExtension,
  isGraphQLInputType,
  isGraphQLInputTypeExtension,
  isGraphQLInterface,
  isGraphQLInterfaceExtension,
  isGraphQLScalar,
  isGraphQLScalarExtension,
  isGraphQLType,
  isGraphQLTypeExtension,
  isGraphQLUnion,
  isGraphQLUnionExtension,
} from "./utils";
import mergeType from "./merge-type";
import mergeEnum from "./merge-enum";
import mergeUnion from "./merge-union";
import mergeInputType from "./merge-input-type";
import mergeDirective from "./merge-directive";
import mergeInterface from "./merge-interface";

export interface IMergedResultMap {
  [name: string]: DefinitionNode
}

export default function mergeGraphQLNodes(nodes: ReadonlyArray<DefinitionNode>): IMergedResultMap {
  return nodes.reduce<IMergedResultMap>((prev: IMergedResultMap, nodeDefinition: DefinitionNode) => {
    const node = nodeDefinition as any;

    if (node && node.name && node.name.value) {
      const name = node.name.value;

      collectComment(node);

      if (isGraphQLType(nodeDefinition) || isGraphQLTypeExtension(nodeDefinition)) {
        prev[name] = mergeType(nodeDefinition, prev[name] as any);
      } else if (isGraphQLEnum(nodeDefinition) || isGraphQLEnumExtension(nodeDefinition)) {
        prev[name] = mergeEnum(nodeDefinition, prev[name] as any);
      } else if (isGraphQLUnion(nodeDefinition) || isGraphQLUnionExtension(nodeDefinition)) {
        prev[name] = mergeUnion(nodeDefinition, prev[name] as any);
      } else if (isGraphQLScalar(nodeDefinition) || isGraphQLScalarExtension(nodeDefinition)) {
        prev[name] = nodeDefinition;
      } else if (isGraphQLInputType(nodeDefinition) || isGraphQLInputTypeExtension(nodeDefinition)) {
        prev[name] = mergeInputType(nodeDefinition, prev[name] as any);
      } else if (isGraphQLInterface(nodeDefinition) || isGraphQLInterfaceExtension(nodeDefinition)) {
        prev[name] = mergeInterface(nodeDefinition, prev[name] as any);
      } else if (isGraphQLDirective(nodeDefinition)) {
        prev[name] = mergeDirective(nodeDefinition, prev[name] as any);
      }
    }

    return prev;
  }, {});
}
