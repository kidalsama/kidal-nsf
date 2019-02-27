import Application from "../application/Application";

// run
(async () => {
  try {
    await Application.run();
  } catch (e) {
    // noinspection TsLint
    console.error(e);
    process.exit(1);
  }
})();
