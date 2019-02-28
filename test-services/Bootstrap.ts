import Application from "../src/application/Application";

// run
export default (async () => {
  try {
    await Application.run(process.argv);
  } catch (e) {
    // noinspection TsLint
    console.error(e);
    process.exit(1);
  }
  return Application.S;
})();
