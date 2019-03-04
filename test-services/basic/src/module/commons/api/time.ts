import IApiRegistry, {IHandlePayloadContext} from "../../../../../../src/server/IApiRegistry";
import GraphQLUnits from "../../../../../../src/server/graphql/GraphQLUnits";

interface IArgs {
  fmt: string;
}

interface IResults {
  format: string | null;
  timestamp: string | null;
  date: string | null;
  datetime: string | null;
  testingNull: string | null;
}

class Registry implements IApiRegistry<IArgs, IResults> {
  public readonly type: string = null!;

  public async handle(args: IHandlePayloadContext<IArgs, IResults>): Promise<IResults> {
    return {
      format: GraphQLUnits.dateUnit(new Date(), {unit: args.data.fmt}),
      timestamp: GraphQLUnits.dateUnit(new Date(), {unit: "timestamp"}),
      date: GraphQLUnits.dateUnit(new Date(), {unit: "date"}),
      datetime: GraphQLUnits.dateUnit(new Date(), {unit: "datetime"}),
      testingNull: null,
    } as IResults
  }
}

export default new Registry()
