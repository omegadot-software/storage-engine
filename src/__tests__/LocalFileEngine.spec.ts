import { assertInstanceof } from "@omegadot/assert";
import { mkdirTmp } from "@omegadot/fs";

import { storageEngineTestSuite } from "./storageEngineTestSuite";
import { streamToString } from "./streamToString";
import { FileSystemStorageEngine } from "../FileSystemStorageEngine";
import { IReadOptions, StorageEngine } from "../StorageEngine";

describe("LocalFileEngine", () => {
	storageEngineTestSuite(
		"LocalFileEngine",
		async () => new FileSystemStorageEngine(await mkdirTmp())
	);

	let sto: StorageEngine;

	beforeAll(async () => {
		sto = new FileSystemStorageEngine(await mkdirTmp());
		await sto.write("test", Buffer.from("abcdefghijklmnopqrstuvw"));
	});

	test("readFile", async () => {
		expect((await sto.readFile("test")).toString("utf-8")).toBe(
			"abcdefghijklmnopqrstuvw"
		);
	});

	test("readFileStream", async () => {
		const stream = sto.readFileStream("test");
		const decoder = new TextDecoder("utf-8");

		const data = await new Promise((r) => {
			let data = "";

			stream.on("data", (chunk) => {
				assertInstanceof(chunk, Buffer);
				data += decoder.decode(chunk);
			});

			stream.on("end", () => {
				r(data);
			});
		});

		expect(data).toBe("abcdefghijklmnopqrstuvw");
	});

	describe("readReverse", () => {
		async function readReverse(
			path: string,
			options?: IReadOptions
		): Promise<string> {
			const sto = new FileSystemStorageEngine(__dirname);
			const { buffer, bytesRead } = await sto.readReverse(path, options);
			return buffer.toString("utf8", 0, bytesRead);
		}

		test("returns complete file contents with default options", async () => {
			const string = await readReverse("samples/abc.txt");

			expect(string).toBe("zyxwvutsrqponmlkjihgfedcba");
		});

		test("returns file contents with specified `length`", async () => {
			const string = await readReverse("samples/abc.txt", { length: 10 });

			expect(string).toBe("zyxwvutsrq");
			expect(string).toHaveLength(10);
		});

		test("returns file contents from specified `position`", async () => {
			const string = await readReverse("samples/abc.txt", {
				position: 1,
				length: 10,
			});

			expect(string).toBe("yxwvutsrqp");
			expect(string).toHaveLength(10);
		});

		test("position beyond end of file", async () => {
			const sto = new FileSystemStorageEngine(__dirname);
			const { bytesRead } = await sto.readReverse("samples/abc.txt", {
				position: 36,
				length: 10,
			});

			expect(bytesRead).toBe(0);
		});

		test("length beyond end of file", async () => {
			const sto = new FileSystemStorageEngine(__dirname);
			const { bytesRead } = await sto.readReverse("samples/abc.txt", {
				position: 24,
				length: 4,
			});

			expect(bytesRead).toBe(2);
		});

		test("length larger than file", async () => {
			const sto = new FileSystemStorageEngine(__dirname);
			const { bytesRead } = await sto.readReverse("samples/abc.txt", {
				length: 100,
			});

			expect(bytesRead).toBe(26);
		});

		test("short buffer", async () => {
			const buffer16 = Buffer.alloc(16);
			const sto = new FileSystemStorageEngine(__dirname);
			const { buffer, bytesRead } = await sto.readReverse("samples/abc.txt", {
				buffer: buffer16,
			});

			expect(bytesRead).toBe(16);
			expect(buffer).toBe(buffer16);
			expect(buffer.toString("utf8")).toBe("zyxwvutsrqponmlk");
		});
	});

	describe("createReverseReadStream", () => {
		test("streams in reverse order", async () => {
			const sto = new FileSystemStorageEngine(__dirname);
			const stream = sto.createReverseReadStream("samples/abc.txt");

			expect(await streamToString(stream)).toBe("zyxwvutsrqponmlkjihgfedcba");
		});

		test("high water mark", async () => {
			const sto = new FileSystemStorageEngine(__dirname);
			const stream = sto.createReverseReadStream("samples/abc.txt", {
				highWaterMark: 4,
			});

			expect(await streamToString(stream)).toBe("zyxwvutsrqponmlkjihgfedcba");
		});
	});
});
