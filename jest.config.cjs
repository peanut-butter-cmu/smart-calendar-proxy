/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: "node",
    transform: {
      "^.+.tsx?$": [
        "ts-jest",
        { useESM: true }
      ]
    },
    setupFiles: [
      "<rootDir>/tests/setup.ts"
    ],
    extensionsToTreatAsEsm: [".ts"],
    modulePaths: [
      "<rootDir>"
    ],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
      "^(\\.{1,2}/.*)\\.js$": "$1"
    }
};