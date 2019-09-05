import {InterfaceTypeDefinitionNode, InterfaceTypeExtensionNode} from "graphql";
import mergeFields from "./merge-fields";
import {mergeDirectives} from "./merge-directive";

export default function mergeInterface(
  node: InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode,
  existingNode: InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode,
): InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode {
  if (existingNode) {
    try {
      return {
        name: node.name,
        description: (node as any).description || (existingNode as any).description,
        kind: (node.kind === "InterfaceTypeDefinition" || existingNode.kind === "InterfaceTypeDefinition")
          ? "InterfaceTypeDefinition" : "InterfaceTypeExtension",
        loc: node.loc,
        fields: mergeFields(node, node.fields!, existingNode.fields!),
        directives: mergeDirectives(node.directives!, existingNode.directives!),
      } as any;
    } catch (e) {
      throw new Error(`Unable to merge GraphQL interface "${node.name.value}": ${e.message}`);
    }
  }

  return node;
}
