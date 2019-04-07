import {IEntityBase} from "./IEntity";
import Database from "./Database";
import Sequelize from "sequelize";

export interface IMigration extends IEntityBase<number> {
  id: number;
  modelName: string;
  migrationName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createMigrationModel = async (database: Database): Promise<Sequelize.Model<IMigration, any>> => {
  const model = database.sequelize.define<IMigration, any>(
    "migration",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      modelName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      migrationName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          name: "unique_modelName_migrationName",
          unique: true,
          fields: ["modelName", "migrationName"],
        },
      ],
    });
  await model.sync()
  return model
}
