import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";

const run = async (cmd: string, args: string[], cwd?: string): Promise<void> => {
	const prefix = cwd ? `[${cwd}] ` : "";
	console.log(`${prefix}${cmd} ${args.join(" ")}`);

	await new Promise<void>((resolve, reject) => {
		const child = spawn(cmd, args, {
			cwd,
			stdio: "inherit",
			env: process.env,
		});

		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(new Error(`Command failed with exit code ${code ?? "unknown"}`));
		});
	});
};

const exists = async (target: string): Promise<boolean> => {
	try {
		await access(target, constants.F_OK);
		return true;
	} catch {
		return false;
	}
};

const typecheckGenerated = async (dir: string): Promise<void> => {
	await run(
		"npx",
		[
			"tsc",
			"--noEmit",
			"--strict",
			"--exactOptionalPropertyTypes",
			"--noUncheckedIndexedAccess",
			"--noImplicitReturns",
			"--noFallthroughCasesInSwitch",
			"--noUnusedLocals",
			"--noUnusedParameters",
			"--moduleResolution",
			"NodeNext",
			"--module",
			"NodeNext",
			"--target",
			"ES2022",
			"--skipLibCheck",
			"generated/effect/index.ts",
		],
		dir,
	);
};

const runSuite = async (
	dir: string,
	banner: string,
	generate: () => Promise<void>,
	keepDb: boolean,
): Promise<void> => {
	console.log(`\n=== ${banner} ===\n`);

	if (!(await exists(`${dir}/node_modules`))) {
		await run("npm", ["install", "--yes"], dir);
	}

	await generate();
	await typecheckGenerated(dir);
	await run("npm", ["test"], dir);

	if (!keepDb) {
		await run("rm", ["-rf", `${dir}/dev.db`]);
	}
};

const main = async (): Promise<void> => {
	const args = process.argv;
	const clean = args.includes("--clean");
	const keepDb = args.includes("--keep-db");
	const prisma7Only = args.includes("--prisma7");
	const prisma6Only = args.includes("--prisma6");
	const customErrorOnly = args.includes("--custom-error");
	const importExtensionOnly = args.includes("--import-extension");

	if (clean || !(await exists("dist"))) {
		await run("npm", ["run", "build"]);
	}

	if (clean) {
		await run("tsc", ["--noEmit", "--project", "tsconfig.test.json"]);
	}

	const runPrisma6Tests = () =>
		runSuite(
			"tests/prisma6",
			"Running Prisma 6 Tests",
			() => run("npm", ["exec", "prisma", "db", "push"], "tests/prisma6"),
			keepDb,
		);

	const runPrisma7Tests = () =>
		runSuite(
			"tests/prisma7",
			"Running Prisma 7 Tests",
			async () => {
				await run("npm", ["exec", "prisma", "db", "push"], "tests/prisma7");
				await run("npm", ["exec", "prisma", "generate"], "tests/prisma7");
			},
			keepDb,
		);

	const runCustomErrorTests = () =>
		runSuite(
			"tests/custom-error",
			"Running Custom Error Tests",
			() => run("npm", ["exec", "prisma", "db", "push"], "tests/custom-error"),
			keepDb,
		);

	const runImportExtensionTests = () =>
		runSuite(
			"tests/import-extension",
			"Running Import Extension Tests",
			() =>
				run("npm", ["exec", "prisma", "db", "push"], "tests/import-extension"),
			keepDb,
		);

	if (prisma7Only) {
		await runPrisma7Tests();
	} else if (prisma6Only) {
		await runPrisma6Tests();
	} else if (customErrorOnly) {
		await runCustomErrorTests();
	} else if (importExtensionOnly) {
		await runImportExtensionTests();
	} else {
		await runPrisma6Tests();
		await runPrisma7Tests();
		await runCustomErrorTests();
		await runImportExtensionTests();
	}
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
