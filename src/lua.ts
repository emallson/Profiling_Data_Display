import { parse } from "lua-json";

export type BossEncounter = {
  encounterName: string;
  encounterId: number;
  success: boolean;
  difficultyId: number;
  startTime: number;
  groupSize: number;
};

export type DungeonEncounter = {
  encounterName: string;
  startTime: number;
  mapId: number;
};

export type Encounter = BossEncounter | DungeonEncounter;

export function isBossEncounter(
  encounter: Encounter
): encounter is BossEncounter {
  if ("mapId" in encounter) {
    return false;
  }

  return true;
}

export type AddonTiming = {
  name: string;
  time: number;
};

export type AddonTimings = {
  [path: string]: AddonTiming;
};

export type ScriptTiming = {
  callCount: number;
  selfTime: number;
  totalTime: number;
};

export type ScriptTimings = {
  [key: string]: ScriptTiming;
};

export type FrameCreation = {
  frameType: string;
  parent?: string;
  template?: string;
};

export type NamedFrameCreation = FrameCreation & { name: string };

export type NamedFrameCreations = {
  [key: string]: NamedFrameCreation;
};

export type Recording = {
  encounter: Encounter;
  data: {
    addon: AddonTimings;
    fn: ScriptTimings;
    CreateFrame: {
      anonymous: FrameCreation[];
      named: NamedFrameCreations;
    };
  };
};

export type ProfilingData = {
  recordings: Recording[];
};

export function parseProfilingData(data: string): ProfilingData | undefined {
  return parse(data.replace("Profiling_Data_Storage = ", "return "));
}
