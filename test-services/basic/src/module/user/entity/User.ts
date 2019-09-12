import {IEntityBase, IEntityMigration, IEntityRegistry} from "../../../../../../src/data/IEntity";
import Database from "../../../../../../src/data/Database";
import Sequelize from "sequelize";
import IEntityCache from "../../../../../../src/data/IEntityCache";
import {Autowired, Component} from "../../../../../../src/ioc/Annotation";
import {DatabaseManager} from "../../../../../../src/data/DatabaseManager";
import {Lazy} from "../../../../../../src/ioc/Lazy";
import {Container} from "../../../../../../src/ioc/Container";

export interface IUser extends IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component
class Registry implements IEntityRegistry<number, IUser> {
  public constructor(
    @Autowired public readonly manager: DatabaseManager,
  ) {
  }

  @Lazy()
  public get database(): Database {
    return this.manager.acquire()
  }

  @Lazy()
  public get model(): Sequelize.Model<IUser, any> {
    return this.database.sequelize.define<IUser, any>(
      "user",
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

  public readonly cache: IEntityCache<number, IUser>

  public get migrations(): { [key: string]: IEntityMigration } {
    return {
      init: {
        up: async () => {
          await this.model.sync()
        },
      },
    }
  }

  public readonly dataInitializer = async () => {
    if (!(await this.model.findOne({where: {username: "dataInitializer"}}))) {
      await this.model.create({username: "dataInitializer", password: "dataInitializer"})
    }
  }
}

export default Container.get(Registry)
