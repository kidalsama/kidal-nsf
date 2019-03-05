import GraphQLUnits from "../../../../../../src/server/graphql/GraphQLUnits";
import {IRpcApiRegistry} from "../../../../../../src/cluster/RpcApiManager";

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

class Registry implements IRpcApiRegistry<IArgs, IResults> {
  public readonly type: string = null!;

  public async process(args: IArgs): Promise<IResults> {
    return {
      format: GraphQLUnits.dateUnit(new Date(), {unit: args.fmt}),
      timestamp: GraphQLUnits.dateUnit(new Date(), {unit: "timestamp"}),
      date: GraphQLUnits.dateUnit(new Date(), {unit: "date"}),
      datetime: GraphQLUnits.dateUnit(new Date(), {unit: "datetime"}),
      testingNull: null,
    } as IResults
  }
}

export default new Registry()
