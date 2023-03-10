module.exports = {
	root: true,
	reportUnusedDisableDirectives: true,
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json",
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:import/recommended",
		"plugin:import/typescript",
		"prettier",
	],
	plugins: ["@typescript-eslint"],
	rules: {
		"import/no-unresolved": "off",
		"import/first": "error",
		"import/order": [
			"error",
			{
				alphabetize: { order: "asc" },
				groups: ["builtin", "external", ["sibling", "parent"]],
				"newlines-between": "always",
			},
		],
		"@typescript-eslint/no-unused-vars": "error",
	},
};
