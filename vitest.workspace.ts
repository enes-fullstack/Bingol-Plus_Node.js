export default [
    {
        test: {
            name: "unit",
            include: ["test/helpers/**/*.test.ts", "test/middleware/**/*.test.ts"],
        },
    },
    {
        test: {
            name: "integration",
            include: ["test/integration/**/*.test.ts", "test/controller/**/*.test.ts"],
        },
    },
];
