import {IEntityBase, IEntityCache, IEntityRegistry} from "../../../../../../data/IEntity";
import Database from "../../../../../../data/Database";
import Sequelize = require("sequelize");

export interface IRank extends IEntityBase<number> {
  id: number;
  userId: number;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export const model = Database.S.sequelize.define<IRank, any>(
  "999_rank",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    score: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    indexes: [
      {
        name: "unique_userId",
        unique: true,
        fields: ["userId"],
      },
    ],
  });

class Registry implements IEntityRegistry<number, IRank> {
  public readonly model: Sequelize.Model<IRank, any>;

  constructor(m: Sequelize.Model<IRank, any>) {
    this.model = m;
  }

  private _cache?: IEntityCache<number, IRank>;

  public get cache(): IEntityCache<number, IRank> {
    return this._cache!;
  }

  public async init(cache: IEntityCache<number, IRank>): Promise<any> {
    // 保存缓存
    this._cache = cache;

    // 初始化数据库
    await this.model.sync();
  }
}

export default new Registry(model);
