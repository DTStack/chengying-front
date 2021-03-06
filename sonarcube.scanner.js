const scanner = require("sonarqube-scanner");
const VERSION = JSON.stringify(require('./package.json').version); // app version.
scanner(
  {
    // this example uses local instance of SQ
    serverUrl: "http://172.16.100.198:9000/",
    token: "",
    options: {
      "sonar.projectVersion": VERSION,
      "sonar.projectName": "dt-insight-front/dt-em-front",
      "sonar.login": "yuwan",
      "sonar.password": "123123",
      "sonar.sources": "./src",
      "sonar.exclusions": "**/__tests__/**, **/src/mocks/**, **/src/public/**, **/src/services/**, **/src/actions/**, **/src/model/**",
      "sonar.tests": "./src",
      "sonar.test.inclusions": "./src/__tests__/**/*.test.tsx,./src/__tests__/**/*.test.ts",
      "sonar.typescript.lcov.reportPaths": "coverage/lcov.info",
      "sonar.testExecutionReportPaths": "coverage/test-reporter.xml"
    },
  },
  () => {
    // callback is required
  }
);