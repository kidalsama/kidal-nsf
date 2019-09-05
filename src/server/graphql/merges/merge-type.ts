import {ObjectTypeDefinitionNode, ObjectTypeExtensionNode} from "graphql";
import mergeFields from "./merge-fields";
import {mergeDirectives} from "./merge-directive";
import {mergeNamedTypeArray} from "./merge-named-type-array";

export default function mergeType(
  node: ObjectTypeDefinitionNode | ObjectTypeExtensionNode,
  existingNode: ObjectTypeDefinitionNode | ObjectTypeExtensionNode,
): ObjectTypeDefinitionNode | ObjectTypeExtensionNode {
  if (existingNode) {
    try {
      return {
        name: node.name,
        description: (node as any).description || (existingNode as any).description,
        kind: node.kind === "ObjectTypeDefinition"
        || existingNode.kind === "ObjectTypeDefinition"
          ? "ObjectTypeDefinition"
          : "ObjectTypeExtension",
        loc: node.loc,
        fields: mergeFields(node, node.fields!, existingNode.fields!),
        directives: mergeDirectives(node.directives!, existingNode.directives!),
        interfaces: mergeNamedTypeArray(node.interfaces!, existingNode.interfaces!),
      } as any;
    } catch (e) {
      throw new Error(`Unable to merge GraphQL type "${node.name.value}": ${e.message}`);
    }
  }

  return node;
}
