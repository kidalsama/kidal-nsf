import Application from "../../src/application/Application"
import {IEntityCache} from "../../src/data/IEntity";
import {IUser} from "../../test-services/basic/src/module/user/entity/User";
import Database from "../../src/data/Database";

describe("Basic: IEntityCache", () => {
  // noinspection TsLint
  let userCache: IEntityCache<number, IUser>
  beforeAll(async () => {
    await Application.runTest("basic");
    userCache = Database.S.getCache("999_user")
  })

  afterAll(async () => {
    await Application.S.shutdown()
  })

  it("#get", async () => {
    const user = await userCache.get(1)
    expect(user).toBeNull()
  });

  it("#getOrCreate", async () => {
    const user1 = await userCache.getOrCreate(1, {username: "sa", password: "sa"});
    expect(user1).not.toBeNull()

    const user2 = await userCache.getOrCreate(1, {username: "sa", password: "sa"});
    expect(user2).not.toBeNull()
  })

  it("#loadOne", async () => {
    const user = await userCache.loadOne(async (model) => {
      return model.findOne({where: {username: "sa"}});
    })
    expect(user).not.toBeNull()
  });

  it("#loadMany", async () => {
    const user = await userCache.loadMany(async (model) => {
      return model.findAll({where: {username: "sa"}});
    })
    expect(user).toHaveLength(1)
  });

  it("#create", async () => {
    const user = await userCache.create({username: "sa2", password: "sa"});
    expect(user).not.toBeNull()
  });

  it("#createOrUpdate", async () => {
    const user = await userCache.createOrUpdate({id: 2, username: "sa2", password: "sa2"});
    expect(user).not.toBeNull()
  });

  it("#updateOne", async () => {
    const user = await userCache.updateOne({id: 2, username: "sa3", password: "sa2"});
    expect(user).not.toBeNull()

    const user2 = await userCache.get(2)
    expect(user2).not.toBeNull()
    expect(user2!.username).toEqual("sa3")
  });

  it("AutoUpdateChangedFields", async () => {
    const user = await userCache.get(2)
    expect(user).not.toBeNull()

    user!.username = "autoUpdate"
    await user!.waitAutoUpdateChangedFieldsComplete()

    const updated = await userCache.get(2)
    expect(updated).not.toBeNull()
    expect(updated!.username).toEqual("autoUpdate")
  })
});