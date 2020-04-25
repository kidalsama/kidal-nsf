import Application from "../../src/application/Application";

describe("Basic: IEntityCache", () => {
  let User: any;
  // noinspection TsLint
  beforeAll(async () => {
    await Application.runTest("basic", "test-database");
    User = require("../../test-services/basic/src/module/user/entity/User")
      .default;
  });

  afterAll(async () => {
    await Application.S.shutdown();
  });

  it("#get", async () => {
    const user = await User.model.findOne({ where: { id: 2 } });
    expect(user).toBeNull();
  });

  it("#getOrCreate", async () => {
    const user1 = await User.model.findOrCreate({
      where: { id: 2 },
      defaults: { id: 2, username: "sa", password: "sa" },
    });
    expect(user1).not.toBeNull();

    const user2 = await User.model.findOrCreate({
      where: { id: 2 },
      defaults: { id: 2, username: "sa", password: "sa" },
    });
    expect(user2).not.toBeNull();
  });

  it("#loadOne", async () => {
    const user = await User.model.findOne({ where: { username: "sa" } });
    expect(user).not.toBeNull();
  });

  it("#loadMany", async () => {
    const users = await User.model.findAll({ where: { username: "sa" } });
    expect(users).toHaveLength(1);
  });

  it("#create", async () => {
    const user = await User.model.create({ username: "sa2", password: "sa" });
    expect(user).not.toBeNull();
  });

  it("#createOrUpdate", async () => {
    const user = await User.model.upsert({
      id: 3,
      username: "sa2",
      password: "sa2",
    });
    expect(user).not.toBeNull();
  });

  it("#updateOne", async () => {
    const user = await User.model.update(
      {
        username: "sa3",
        password: "sa2",
      },
      {
        where: { id: 3 },
      }
    );
    expect(user).not.toBeNull();

    const user2 = await User.model.findOne({ where: { id: 3 } });
    expect(user2).not.toBeNull();
    expect(user2!.username).toEqual("sa3");
  });

  it("dataInitializer", async () => {
    const dataInitializerUser = await User.model.findOne({
      where: { username: "dataInitializer" },
    });
    expect(dataInitializerUser).not.toBeNull();
  });
});
