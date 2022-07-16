import { parseProfilingData } from "./lua";
import * as fs from "fs";

describe("parseProfilingData", () => {
  it("should parse the data", () => {
    const raw = fs.readFileSync("./test_data/data_1.lua");

    const result = parseProfilingData(raw.toString());

    expect(result).toBeDefined();
  });
});
