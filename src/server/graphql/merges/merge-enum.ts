import {EnumTypeDefinitionNode, EnumTypeExtensionNode, EnumValueDefinitionNode} from "graphql";
import {mergeDirectives} from "./merge-directive";

export default function mergeEnum(
  e1: EnumTypeDefinitionNode | EnumTypeExtensionNode,
  e2: EnumTypeDefinitionNode | EnumTypeExtensionNode,
): EnumTypeDefinitionNode | EnumTypeExtensionNode {
  if (e2) {
    return {
      name: e1.name,
      description: (e1 as any).description || (e2 as any).description,
      kind: e1.kind === "EnumTypeDefinition"
      || e2.kind === "EnumTypeDefinition" ? "EnumTypeDefinition" : "EnumTypeExtension",
      loc: e1.loc,
      directives: mergeDirectives(e1.directives!, e2.directives!),
      values: mergeEnumValues(e1.values!, e2.values!),
    } as any;
  }

  return e1;
}

function mergeEnumValues(
  first: ReadonlyArray<EnumValueDefinitionNode>,
  second: ReadonlyArray<EnumValueDefinitionNode>,
): EnumValueDefinitionNode[] {
  return [
    ...second,
    ...(first.filter((d) => !alreadyExists(second, d))),
  ];
}

function alreadyExists(
  arr: ReadonlyArray<EnumValueDefinitionNode>,
  other: EnumValueDefinitionNode,
): boolean {
  return !!arr.find((v) => v.name.value === other.name.value);
}
