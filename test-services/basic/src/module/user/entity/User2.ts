import {IEntityBase, IEntityMigration, IEntityRegistry} from "../../../../../../src/data";
import Database from "../../../../../../src/data/Database";
import Sequelize from "sequelize";
import IEntityCache from "../../../../../../src/data/IEntityCache";
import {Autowired, Component, Container, Lazy} from "../../../../../../src/ioc";
import {DatabaseManager} from "../../../../../../src/data/DatabaseManager";

export interface IUser2 extends IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component
class Registry implements IEntityRegistry<number, IUser2> {
  public constructor(
    @Autowired public readonly manager: DatabaseManager,
  ) {
  }

  @Lazy()
  public get database(): Database {
    return this.manager.acquire("secondary")
  }

  @Lazy()
  public get model(): Sequelize.Model<IUser2, any> {
    return this.database.sequelize.define<IUser2, any>(
      "user2",
      {
        id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
        username: {type: Sequelize.STRING(20), allowNull: false, defaultValue: ""},
        password: {type: Sequelize.STRING(128), allowNull: false, defaultValue: ""},
      },
      {
        indexes: [
          {name: "unique_username", unique: true, fields: ["username"]},
        ],
      });
  }

  public readonly cache: IEntityCache<number, IUser2>

  public get migrations(): { [key: string]: IEntityMigration } {
    return {
      init: {
        up: async () => {
          await this.model.sync()
        },
      },
    }
  }
}

export default Container.get(Registry)
