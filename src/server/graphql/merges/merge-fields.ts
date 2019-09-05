import {FieldDefinitionNode, InputValueDefinitionNode, NameNode, TypeNode} from "graphql";
import {extractType, isListTypeNode, isNonNullTypeNode, isNotEqual, isWrappingTypeNode, printTypeNode} from "./utils";
import mergeArguments from "./merge-arguments";
import {mergeDirectives} from "./merge-directive";

export default function mergeFields<T extends FieldDefinitionNode | InputValueDefinitionNode>(
  type: { name: NameNode },
  f1: ReadonlyArray<T>,
  f2: ReadonlyArray<T>,
): T[] {
  const result: T[] = [...f2];

  for (const field of f1) {
    if (fieldAlreadyExists(result, field)) {
      const existing: any = result.find((f: any) => f.name.value === (field as any).name.value);

      preventConflicts(type, existing, field, false);

      if (isNonNullTypeNode(field.type) && !isNonNullTypeNode(existing.type)) {
        existing.type = field.type;
      }

      existing.arguments = mergeArguments((field as any).arguments, existing.arguments);
      existing.directives = field.directives ? mergeDirectives(field.directives, existing.directives) : undefined
    } else {
      result.push(field);
    }
  }

  return result;
}

function fieldAlreadyExists(fieldsArr: ReadonlyArray<any>, otherField: any): boolean {
  const result: FieldDefinitionNode | null = fieldsArr.find((field) => field.name.value === otherField.name.value);

  if (result) {
    const t1 = extractType(result.type);
    const t2 = extractType(otherField.type);

    if (t1.name.value !== t2.name.value) {
      throw new Error(
        `Field "${otherField.name.value}" already defined with a different type.` +
        ` Declared as "${t1.name.value}", but you tried to override with "${t2.name.value}"`,
      );
    }
  }

  return !!result;
}

function preventConflicts(
  type: { name: NameNode },
  a: FieldDefinitionNode | InputValueDefinitionNode,
  b: FieldDefinitionNode | InputValueDefinitionNode,
  ignoreNullability: boolean = false,
) {
  const aType = printTypeNode(a.type);
  const bType = printTypeNode(b.type);

  if (isNotEqual(aType, bType)) {
    if (!safeChangeForFieldType(a.type, b.type, ignoreNullability)) {
      throw new Error(`Field '${type.name.value}.${a.name.value}' changed type from '${aType}' to '${bType}'`);
    }
  }
}

function safeChangeForFieldType(oldType: TypeNode, newType: TypeNode, ignoreNullability: boolean = false): boolean {
  // both are named
  if (!isWrappingTypeNode(oldType) && !isWrappingTypeNode(newType)) {
    return oldType.toString() === newType.toString();
  }

  // new is non-null
  if (isNonNullTypeNode(newType)) {
    // I don't think it's a breaking change but `merge-graphql-schemas` needs it...
    if (!isNonNullTypeNode(oldType) && !ignoreNullability) {
      return false;
    }

    const ofType = isNonNullTypeNode(oldType) ? oldType.type : oldType;

    return safeChangeForFieldType(ofType, newType.type);
  }

  // old is non-null
  if (isNonNullTypeNode(oldType)) {
    return safeChangeForFieldType(newType, oldType, ignoreNullability);
  }

  // old is list
  if (isListTypeNode(oldType)) {
    return (isListTypeNode(newType) && safeChangeForFieldType(oldType.type, newType.type))
      || (isNonNullTypeNode(newType) && safeChangeForFieldType(oldType, newType.type));
  }

  return false;
}
