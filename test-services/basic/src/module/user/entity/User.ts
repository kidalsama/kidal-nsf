import {IEntityBase, IEntityMigration, IEntityRegistry} from "../../../../../../src/data/IEntity";
import Database from "../../../../../../src/data/Database";
import Sequelize from "sequelize";
import IEntityCache from "../../../../../../src/data/IEntityCache";

export interface IUser extends IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const database = Database.acquire()
const model = database.sequelize.define<IUser, any>(
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

class Registry implements IEntityRegistry<number, IUser> {
  public get database(): Database {
    return database
  }

  public get model(): Sequelize.Model<IUser, any> {
    return model;
  }

  public readonly cache: IEntityCache<number, IUser> = null!

  public get migrations(): { [key: string]: IEntityMigration } {
    return {
      init: {
        up: async () => {
          await model.sync()
        },
      },
    }
  }

  public readonly dataInitializer = async () => {
    if (!(await model.findOne({where: {username: "dataInitializer"}}))) {
      await model.create({username: "dataInitializer", password: "dataInitializer"})
    }
  }
}

export default new Registry();
