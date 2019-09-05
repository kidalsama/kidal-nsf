import {InputObjectTypeDefinitionNode, InputObjectTypeExtensionNode, InputValueDefinitionNode} from "graphql";
import mergeFields from "./merge-fields";
import {mergeDirectives} from "./merge-directive";

export default function mergeInputType(
  node: InputObjectTypeDefinitionNode | InputObjectTypeExtensionNode,
  existingNode: InputObjectTypeDefinitionNode | InputObjectTypeExtensionNode,
): InputObjectTypeDefinitionNode | InputObjectTypeExtensionNode {
  if (existingNode) {
    try {
      return {
        name: node.name,
        description: (node as any).description || (existingNode as any).description,
        kind: (node.kind === "InputObjectTypeDefinition" || existingNode.kind === "InputObjectTypeDefinition")
          ? "InputObjectTypeDefinition" : "InputObjectTypeExtension",
        loc: node.loc,
        fields: mergeFields<InputValueDefinitionNode>(node, node.fields!, existingNode.fields!),
        directives: mergeDirectives(node.directives!, existingNode.directives!),
      } as any;
    } catch (e) {
      throw new Error(`Unable to merge GraphQL input type "${node.name.value}": ${e.message}`);
    }
  }

  return node;
}
