import { build, Format } from "esbuild";

const formats: Format[] = ["cjs", "esm"];
Promise.all(
	formats.map((format) =>
		build({
			format,
			entryPoints: ["src/index.ts"],
			bundle: true,
			sourcemap: true,
			platform: "node",
			// Excludes all dependencies from the bundle
			// https://esbuild.github.io/api/#packages
			packages: "external",
			outdir: `dist/${format}`,
		})
	)
).catch(() => {
	process.exit(1);
});
