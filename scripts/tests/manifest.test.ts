import { readManifest, writeManifest, getProgress, markStep } from "../lib/manifest.js";
import fs from "fs";
import path from "path";
import os from "os";

let testDir: string;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

test("readManifest returns empty object when file does not exist", () => {
  const manifest = readManifest(path.join(testDir, "manifest.json"));
  expect(manifest).toEqual({});
});

test("writeManifest and readManifest round-trip", () => {
  const filePath = path.join(testDir, "manifest.json");
  const manifest = {
    zappik: { concept: "completed" as const, sprite: "pending" as const, animation: "pending" as const },
  };
  writeManifest(filePath, manifest);
  const result = readManifest(filePath);
  expect(result).toEqual(manifest);
});

test("getProgress returns default pending for unknown creature", () => {
  const progress = getProgress({}, "zappik");
  expect(progress).toEqual({ concept: "pending", sprite: "pending", animation: "pending" });
});

test("getProgress returns existing progress", () => {
  const manifest = {
    zappik: { concept: "completed" as const, sprite: "pending" as const, animation: "pending" as const },
  };
  expect(getProgress(manifest, "zappik").concept).toBe("completed");
});

test("markStep updates manifest and writes to disk", () => {
  const filePath = path.join(testDir, "manifest.json");
  let manifest = {};
  manifest = markStep(manifest, "zappik", "concept", filePath);
  expect(manifest).toEqual({
    zappik: { concept: "completed", sprite: "pending", animation: "pending" },
  });
  const onDisk = readManifest(filePath);
  expect(onDisk).toEqual(manifest);
});
