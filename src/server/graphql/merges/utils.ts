import {
  DefinitionNode,
  DirectiveDefinitionNode,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
  InterfaceTypeDefinitionNode,
  InterfaceTypeExtensionNode,
  Kind,
  ListTypeNode,
  NamedTypeNode,
  NonNullTypeNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  ScalarTypeDefinitionNode,
  ScalarTypeExtensionNode,
  SchemaDefinitionNode,
  TypeNode,
  UnionTypeDefinitionNode,
  UnionTypeExtensionNode,
} from "graphql";

export function isSchemaDefinition(node: DefinitionNode): node is SchemaDefinitionNode {
  return node.kind === "SchemaDefinition";
}

export function isFieldDefinitionNode(node: any): node is FieldDefinitionNode {
  return node.kind === "FieldDefinition";
}

export function isGraphQLType(definition: DefinitionNode): definition is ObjectTypeDefinitionNode {
  return definition.kind === "ObjectTypeDefinition";
}

export function isGraphQLTypeExtension(definition: DefinitionNode): definition is ObjectTypeExtensionNode {
  return definition.kind === "ObjectTypeExtension";
}

export function isGraphQLEnum(definition: DefinitionNode): definition is EnumTypeDefinitionNode {
  return definition.kind === "EnumTypeDefinition";
}

export function isGraphQLEnumExtension(definition: DefinitionNode): definition is EnumTypeExtensionNode {
  return definition.kind === "EnumTypeExtension";
}

export function isGraphQLUnion(definition: DefinitionNode): definition is UnionTypeDefinitionNode {
  return definition.kind === "UnionTypeDefinition";
}

export function isGraphQLUnionExtension(definition: DefinitionNode): definition is UnionTypeExtensionNode {
  return definition.kind === "UnionTypeExtension";
}

export function isGraphQLScalar(definition: DefinitionNode): definition is ScalarTypeDefinitionNode {
  return definition.kind === "ScalarTypeDefinition";
}

export function isGraphQLScalarExtension(definition: DefinitionNode): definition is ScalarTypeExtensionNode {
  return definition.kind === "ScalarTypeExtension";
}

export function isGraphQLInputType(definition: DefinitionNode): definition is InputObjectTypeDefinitionNode {
  return definition.kind === "InputObjectTypeDefinition";
}

export function isGraphQLInputTypeExtension(definition: DefinitionNode): definition is InputObjectTypeExtensionNode {
  return definition.kind === "InputObjectTypeExtension";
}

export function isGraphQLInterface(definition: DefinitionNode): definition is InterfaceTypeDefinitionNode {
  return definition.kind === "InterfaceTypeDefinition";
}

export function isGraphQLInterfaceExtension(definition: DefinitionNode): definition is InterfaceTypeExtensionNode {
  return definition.kind === "InterfaceTypeExtension";
}

export function isGraphQLDirective(definition: DefinitionNode): definition is DirectiveDefinitionNode {
  return definition.kind === "DirectiveDefinition";
}

export function extractType(type: TypeNode): NamedTypeNode {
  let visitedType = type;
  while (visitedType.kind === "ListType" || visitedType.kind === "NonNullType") {
    visitedType = visitedType.type;
  }
  return visitedType as any;
}

export function isListTypeNode(type: TypeNode): type is ListTypeNode {
  return type.kind === Kind.LIST_TYPE;
}

export function isNonNullTypeNode(type: TypeNode): type is NonNullTypeNode {
  return type.kind === Kind.NON_NULL_TYPE;
}

export function printTypeNode(type: TypeNode): string {
  if (isListTypeNode(type)) {
    return `[${printTypeNode(type.type)}]`;
  }

  if (isNonNullTypeNode(type)) {
    return `${printTypeNode(type.type)}!`;
  }

  return type.name.value;
}

export function isWrappingTypeNode(type: TypeNode): type is ListTypeNode | NonNullTypeNode {
  return type.kind !== Kind.NAMED_TYPE;
}

export function isEqual<T>(a: T, b: T): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (let index = 0; index < a.length; index++) {
      if (a[index] !== b[index]) {
        return false;
      }
    }

    return true;
  }

  return a === b || (!a && !b);
}

export function isNotEqual<T>(a: T, b: T): boolean {
  return !isEqual(a, b);
}
