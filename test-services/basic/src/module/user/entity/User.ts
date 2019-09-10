import {IEntityBase, IEntityMigration, IEntityRegistry} from "../../../../../../src/data/IEntity";
import Database from "../../../../../../src/data/Database";
import Sequelize from "sequelize";
import IEntityCache from "../../../../../../src/data/IEntityCache";
import {Container, Lazy} from "../../../../../../src/ioc";
import {DatabaseManager} from "../../../../../../src/data/DatabaseManager";

export interface IUser extends IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

class Registry implements IEntityRegistry<number, IUser> {
  @Lazy()
  public get database(): Database {
    return Container.get(DatabaseManager).acquire()
  }

  @Lazy()
  public get model(): Sequelize.Model<IUser, any> {
    return this.database.sequelize.define<IUser, any>(
      "user",
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
  }

  public readonly cache: IEntityCache<number, IUser> = null!

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

export default new Registry();
