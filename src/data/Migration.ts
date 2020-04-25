import { IEntityBase } from "./IEntity";
import Database from "./Database";
import Sequelize from "sequelize";

export class Migration extends Sequelize.Model<number, Migration>
  implements IEntityBase<number> {
  public id: number;
  public modelName: string;
  public migrationName: string;
  public createdAt: Date;
  public updatedAt: Date;
}

export function initializeMigrationModel(database: Database) {
  Migration.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      modelName: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      migrationName: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
    },
    {
      modelName: "migration",
      indexes: [
        {
          name: "unique_modelName_migrationName",
          unique: true,
          fields: ["modelName", "migrationName"],
        },
      ],
      sequelize: database.sequelize,
    }
  );
  Migration.sync();
}
