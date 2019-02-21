import {IEntityBase, IEntityCache, IEntityRegistry} from "../../../../../../data/IEntity";
import Database from "../../../../../../data/Database";
import Sequelize from "sequelize";

export interface IUser extends IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export const model = Database.S.sequelize.define<IUser, any>(
  "999_user",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "",
      validate: {
        len: [2, 20],
      },
    },
    password: {
      type: Sequelize.STRING(128),
      allowNull: false,
      defaultValue: "",
      validate: {
        len: [2, 128],
      },
    },
  },
  {
    indexes: [
      {
        name: "unique_username",
        unique: true,
        fields: ["username"],
      },
    ],
  });

class Registry implements IEntityRegistry<number, IUser> {
  public readonly model: Sequelize.Model<IUser, any>;

  constructor(m: Sequelize.Model<IUser, any>) {
    this.model = m;
  }

  private _cache?: IEntityCache<number, IUser>;

  public get cache(): IEntityCache<number, IUser> {
    return this._cache!;
  }

  public async init(cache: IEntityCache<number, IUser>): Promise<any> {
    // 保存缓存
    this._cache = cache;

    // 初始化数据库
    await this.model.sync();
  }
}

export default new Registry(model);
