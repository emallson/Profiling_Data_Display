import * as tree from "./tree";

describe("parseKey", () => {
  it("should correctly parse the frame path for a scriptless key", () => {
    const key =
      "RavenButton4TipFrame/RavenButton4Container/RavenButton4Frame/RavenBarGroupDebuffs/UIParent";

    expect(tree.parseKey(key)).toStrictEqual({
      framePath: [
        "RavenButton4TipFrame",
        "RavenButton4Container",
        "RavenButton4Frame",
        "RavenBarGroupDebuffs",
        "UIParent",
      ],
      script: undefined,
    });
  });

  it("should correctly parse a frame path with a script key", () => {
    const key =
      "RavenButton4TipFrame/RavenButton4Container/RavenButton4Frame/RavenBarGroupDebuffs/UIParent:OnLeave";

    expect(tree.parseKey(key)).toStrictEqual({
      framePath: [
        "RavenButton4TipFrame",
        "RavenButton4Container",
        "RavenButton4Frame",
        "RavenBarGroupDebuffs",
        "UIParent",
      ],
      script: "OnLeave",
    });
  });

  it("should correctly handle a singleton path", () => {
    const key = "nil";

    expect(tree.parseKey(key)).toStrictEqual({
      framePath: ["nil"],
      script: undefined,
    });
  });
});

describe("punch", () => {
  it("should create a new nodes recursively as needed", () => {
    const root: tree.FrameTree<undefined> = {
      name: "root",
      value: undefined,
      children: {},
    };

    const test1 = tree.punch(root, ["test1", "parent"]);
    const test2 = tree.punch(root, ["test2", "test1", "parent"]);
    const test1_copy = tree.punch(root, ["test1", "parent"]);

    expect(test1).toBe(test1_copy);
    expect(test1).toBe(root.children["parent"].children["test1"]);
    expect(test1).toBeDefined();
    expect(test2).toBeDefined();
  });
});

describe("buildTree", () => {
  it("should build a toy tree successfully", () => {
    const keys = [
      "WeakAurasFrame.24f4f0164d0.24f4f01a9e0/WeakAurasFrame.24f4f0164d0/WeakAurasFrame/UIParent:OnSizeChanged",
      "WeakAurasFrame.24ef3d108a0.24ef3d121f0/WeakAurasFrame.24ef3d108a0/WeakAurasFrame/UIParent:OnSizeChanged",
      "BattleGroundEnemies.Allies.24ef2416520.24ef242a7b0/BattleGroundEnemies.Allies.24ef2416520/BattleGroundEnemies.Allies/BattleGroundEnemies:OnHide",
      "BigWigsProximityAnchor.24f59eea100/BigWigsProximityAnchor/UIParent:OnEnter",
      "WeakAurasFrame.24ef9e33540.24ef9e369c0/WeakAurasFrame.24ef9e33540/WeakAurasFrame/UIParent:OnSizeChanged",
      "WeakAurasFrame.24f4f039dd0/WeakAurasFrame/UIParent:OnSizeChanged",
    ];

    const result = tree.build<string>(keys, (x) => x);

    expect(result).toMatchSnapshot();
  });
});
