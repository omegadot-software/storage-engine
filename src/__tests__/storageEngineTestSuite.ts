import { streamToString } from "./streamToString";
import { IReadOptions, StorageEngine } from "../StorageEngine";

export function storageEngineTestSuite(
	implName: string,
	getStorageEngineInstance: () => StorageEngine | Promise<StorageEngine>
) {
	let sto: StorageEngine;
	const files = {
		"abc.txt": "abcdefghijklmnopqrstuvwxyz",
	};

	beforeAll(async () => {
		sto = await getStorageEngineInstance();
		for (const [path, fileContents] of Object.entries(files)) {
			await sto.write(path, Buffer.from(fileContents));
		}
	});

	describe(`StorageEngine test suite - ${implName} implementation`, () => {
		describe("read()", () => {
			async function read(
				path: string,
				options?: IReadOptions
			): Promise<string> {
				const { buffer, bytesRead } = await sto.read(path, options);
				return buffer.toString("utf8", 0, bytesRead);
			}

			test("returns complete file contents with default options", async () => {
				const string = await read("abc.txt");

				expect(string).toBe("abcdefghijklmnopqrstuvwxyz");
			});

			test("returns file contents with specified `length`", async () => {
				const string = await read("abc.txt", { length: 10 });

				expect(string).toBe("abcdefghij");
				expect(string).toHaveLength(10);
			});

			test("returns file contents from specified `position`", async () => {
				const string = await read("abc.txt", { position: 1, length: 10 });

				expect(string).toBe("bcdefghijk");
				expect(string).toHaveLength(10);
			});

			test("short buffer", async () => {
				const buffer16 = Buffer.alloc(16);
				const { buffer, bytesRead } = await sto.read("abc.txt", {
					buffer: buffer16,
				});

				expect(bytesRead).toBe(16);
				expect(buffer).toBe(buffer16);
				expect(buffer.toString("utf8")).toBe("abcdefghijklmnop");
			});
		});

		describe("rename()", () => {
			test("renames file", async () => {
				const src = "move-source";
				const dst = "move-dst";

				await sto.write(src, Buffer.from("123"));

				await expect(sto.size(dst)).rejects.toThrow();

				await sto.rename(src, dst);

				await expect(sto.size(src)).rejects.toThrow();
				expect(await sto.size(dst)).toBe(3);

				await sto.remove(dst);
			});
		});

		describe("remove()", () => {
			test("cannot access removed file", async () => {
				const src = "deletion-test";
				await sto.write(src, Buffer.from("123"));

				expect(await sto.size(src)).toBe(3);
				await sto.remove(src);
				await expect(sto.size(src)).rejects.toThrow();
			});
		});

		describe("size()", () => {
			test("returns size of file in bytes", async () => {
				expect(await sto.size("abc.txt")).toBe(26);
			});
		});

		describe("createReadStream()", () => {
			test("streams file contents", async () => {
				const stream = sto.createReadStream("abc.txt");

				expect(await streamToString(stream)).toBe(files["abc.txt"]);
			});

			test("throws on non existing files", async () => {
				const stream = sto.createReadStream("THIS_FILE_SHOULD_NOT_EXIST");

				await expect(streamToString(stream)).rejects.toThrow();
			});
		});
	});
}
