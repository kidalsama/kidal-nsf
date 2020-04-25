import Database from "../../../../../../src/data/Database";
import Sequelize from "sequelize";
import { DatabaseManager } from "../../../../../../src/data/DatabaseManager";
import {
  IEntityBase,
  IEntityMigration,
  IEntityRegistry,
} from "../../../../../../src/data/IEntity";
import { Autowired, Component } from "../../../../../../src/ioc/Annotation";
import { Lazy } from "../../../../../../src/ioc/Lazy";
import { Container } from "../../../../../../src/ioc/Container";

export class User2Model extends Sequelize.Model implements IEntityBase<number> {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component
class Registry implements IEntityRegistry<number, User2Model> {
  public constructor(@Autowired public readonly manager: DatabaseManager) {}

  @Lazy()
  public get database(): Database {
    return this.manager.acquire("secondary");
  }

  @Lazy()
  public get model(): typeof User2Model {
    User2Model.init(
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        username: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: "",
        },
        password: {
          type: Sequelize.STRING(128),
          allowNull: false,
          defaultValue: "",
        },
      },
      {
        modelName: "user2",
        indexes: [
          { name: "unique_username", unique: true, fields: ["username"] },
        ],
        sequelize: this.database.sequelize,
      }
    );
    return User2Model;
  }

  public get migrations(): { [key: string]: IEntityMigration } {
    return {
      init: {
        up: async () => {
          await this.model.sync();
        },
      },
    };
  }
}

export default Container.get(Registry);
