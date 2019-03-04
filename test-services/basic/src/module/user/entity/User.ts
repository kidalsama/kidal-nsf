import {IEntityBase, IEntityRegistry} from "../../../../../../src/data/IEntity";
import Database from "../../../../../../src/data/Database";
import Sequelize from "sequelize";

export interface IUser extends IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const model = Database.S.sequelize.define<IUser, any>(
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
  public get model(): Sequelize.Model<IUser, any> {
    return model;
  }
}

export default new Registry();
