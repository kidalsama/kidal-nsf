import PayloadDispatcher from "../../../../../server/PayloadDispatcher";
import Rank, {IRank} from "../rank/entity/Rank";

export default class RankService {
  public static readonly S = new RankService();

  private constructor() {
    // 监听字段改变事件
    Rank.cache.on("field-updated", (id: number, key: string, value: any) => {
      // 添加到自动同步
      PayloadDispatcher.S.addSyncPartial("Rank", id, key, value);
    });
  }

  public async get(userId: number): Promise<IRank | null> {
    return await await Rank.cache.loadOne(async (model) => {
      return await model.findOne({where: {userId}});
    });
  }

  public async set(userId: number, score: number): Promise<IRank> {

    let rank = await Rank.cache.loadOne(async (model) => {
      return await model.findOne({where: {userId}});
    });
    // 加载或者创建一个
    // const rank = await Rank.cache.getOrCreate(userId, {userId, score});

    if (!rank) {
      rank = await Rank.cache.create({userId, score});
    } else {
      // 自动同步功能，不用手动保存到数据库
      // 这里会触发上面的「field-updated」监听器
      rank.score = score;
    }

    // done
    return rank;
  }
}
