import {UnionTypeDefinitionNode, UnionTypeExtensionNode} from "graphql";
import {mergeDirectives} from "./merge-directive";
import {mergeNamedTypeArray} from "./merge-named-type-array";

export default function mergeUnion(
  first: UnionTypeDefinitionNode | UnionTypeExtensionNode,
  second: UnionTypeDefinitionNode | UnionTypeExtensionNode,
): UnionTypeDefinitionNode | UnionTypeExtensionNode {
  if (second) {
    return {
      name: first.name,
      description: (first as any).description || (second as any).description,
      directives: mergeDirectives(first.directives!, second.directives!),
      kind:
        first.kind === "UnionTypeDefinition"
        || second.kind === "UnionTypeDefinition" ? "UnionTypeDefinition" : "UnionTypeExtension",
      loc: first.loc,
      types: mergeNamedTypeArray(first.types!, second.types!),
    } as any;
  }

  if (first.kind === "UnionTypeExtension") {
    throw new Error(`Unable to extend undefined GraphQL union: ${first.name}`);
  }

  return first;
}
