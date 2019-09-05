import {DirectiveDefinitionNode, DirectiveNode, NameNode, print} from "graphql";
import mergeArguments from "./merge-arguments";

export default function mergeDirective(
  node: DirectiveDefinitionNode,
  existingNode?: DirectiveDefinitionNode,
): DirectiveDefinitionNode {
  if (existingNode) {
    validateInputs(node, existingNode);

    return {
      ...node,
      locations: [
        ...existingNode.locations,
        ...node.locations.filter((name) => !nameAlreadyExists(name, existingNode.locations)),
      ],
    };
  }

  return node;
}

export function mergeDirectives(d1: ReadonlyArray<DirectiveNode>, d2: ReadonlyArray<DirectiveNode>): DirectiveNode[] {
  const reverseOrder: boolean = false;
  const asNext = reverseOrder ? d1 : d2;
  const asFirst = reverseOrder ? d2 : d1;
  const result = deduplicateDirectives([...asNext]);

  for (const directive of asFirst) {
    if (directiveAlreadyExists(result, directive)) {
      const existingDirectiveIndex = result.findIndex((d) => d.name.value === directive.name.value);
      const existingDirective = result[existingDirectiveIndex];
      (result[existingDirectiveIndex] as any).arguments =
        mergeArguments(directive.arguments as any, existingDirective.arguments as any);
    } else {
      result.push(directive);
    }
  }

  return result;
}

function validateInputs(
  node: DirectiveDefinitionNode,
  existingNode: DirectiveDefinitionNode,
): void | never {
  const printedNode = print(node);
  const printedExistingNode = print(existingNode);
  const leaveInputs = new RegExp("(directive @w*d*)|( on .*$)", "g");
  const sameArguments = printedNode.replace(leaveInputs, "") === printedExistingNode.replace(leaveInputs, "");

  if (!sameArguments) {
    throw new Error(
      `Unable to merge GraphQL directive "${node.name.value}".` +
      `\nExisting directive:  \n\t${printedExistingNode} \nReceived directive: \n\t${printedNode}`);
  }
}

function nameAlreadyExists(name: NameNode, namesArr: ReadonlyArray<NameNode>): boolean {
  return namesArr.some(({value}) => value === name.value);
}

function directiveAlreadyExists(directivesArr: ReadonlyArray<DirectiveNode>, otherDirective: DirectiveNode): boolean {
  return !!directivesArr.find((directive) => directive.name.value === otherDirective.name.value);
}

function deduplicateDirectives(directives: ReadonlyArray<DirectiveNode>): DirectiveNode[] {
  return directives.map((directive, i, all) => {
    const firstAt = all.findIndex((d) => d.name.value === directive.name.value);

    if (firstAt !== i) {
      const dup = all[firstAt];

      (directive as any).arguments = mergeArguments(directive.arguments as any, dup.arguments as any)
      return null;
    }

    return directive;
  })
    .filter((d) => d)
    .map((d) => d!);
}
