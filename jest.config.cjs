/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: "node",
    transform: {
        "^.+.tsx?$": [
            "ts-jest",
            { useESM: true, isolatedModules: true }
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
        "^@/(.*).js$": "<rootDir>/src/$1",
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    modulePathIgnorePatterns: ["<rootDir>/dist/"]
};