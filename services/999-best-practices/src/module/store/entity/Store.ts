import {IEntityBase, IEntityCache, IEntityRegistry} from "../../../../../../data/IEntity";
import Database from "../../../../../../data/Database";
import Sequelize = require("sequelize");

export interface IStore extends IEntityBase<string> {
  id: string;
  val: string;
  createdAt: Date;
  updatedAt: Date;
}

export const model = Database.S.sequelize.define<IStore, any>(
  "999_store",
  {
    id: {
      type: Sequelize.STRING(20),
      primaryKey: true,
    },
    val: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "",
      validate: {
        len: [0, 20],
      },
    },
  });

class Registry implements IEntityRegistry<string, IStore> {
  public readonly model: Sequelize.Model<IStore, any>;

  constructor(m: Sequelize.Model<IStore, any>) {
    this.model = m;
  }

  private _cache?: IEntityCache<string, IStore>;

  public get cache(): IEntityCache<string, IStore> {
    return this._cache!;
  }

  public async init(cache: IEntityCache<string, IStore>): Promise<any> {
    // 保存缓存
    this._cache = cache;

    // 初始化数据库
    await this.model.sync();
  }
}

export default new Registry(model);
