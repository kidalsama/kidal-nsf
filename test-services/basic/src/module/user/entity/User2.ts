import {IEntityBase, IEntityMigration, IEntityRegistry} from "../../../../../../src/data/IEntity";
import Database from "../../../../../../src/data/Database";
import Sequelize from "sequelize";
import IEntityCache from "../../../../../../src/data/IEntityCache";
import {Container} from "../../../../../../src/ioc";
import {DatabaseManager} from "../../../../../../src/data/DatabaseManager";

export interface IUser2 extends IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const database = Container.get(DatabaseManager).acquire("secondary")
const model = database.sequelize.define<IUser2, any>(
  "user2",
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

class Registry implements IEntityRegistry<number, IUser2> {
  public get database(): Database {
    return database
  }

  public get model(): Sequelize.Model<IUser2, any> {
    return model;
  }

  public readonly cache: IEntityCache<number, IUser2> = null!

  public get migrations(): { [key: string]: IEntityMigration } {
    return {
      init: {
        up: async () => {
          await model.sync()
        },
      },
    }
  }
}

export default new Registry();
