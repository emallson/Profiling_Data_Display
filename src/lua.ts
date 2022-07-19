import { parse } from "lua-json";

export type BossEncounter = {
  encounterName: string;
  encounterId: number;
  success: boolean;
  difficultyId: number;
  startTime: number;
  endTime: number;
  groupSize: number;
};

export type DungeonEncounter = {
  encounterName: string;
  startTime: number;
  endTime: number;
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
  debugTime: number;
  totalTime: number;
};

export type ScriptTimings = {
  [key: string]: ScriptTiming;
};

export type FrameCreation = {
  frameType: string;
  creationTime: number;
  parent?: string;
  template?: string;
};

export type NamedFrameCreation = FrameCreation & { name: string };

export type NamedFrameCreations = {
  [key: string]: NamedFrameCreation;
};

export enum EventRegistationType {
  Registered = "R",
  Unregistered = "U",
}

export type EventRegistration = {
  type: EventRegistationType;
  units?: string[];
  frameIndex: number;
};

export type EventRegistrations = {
  [eventName: string]: EventRegistration[];
};

export type EventRegistrationUpdates = {
  [path: string]: EventRegistrations;
};

export type EventTimings = {
  totalUsage: number;
  updates: EventRegistrationUpdates;
  usage: {
    [eventName: string]: number;
  };
};

export type FrameScriptTimings = {
  [key: string]: number;
};

// slight abuse here as I'm assuming that every frame has at least one script
// call. can't wait to get hoisted by that.
export type FrameData = {
  data: FrameScriptTimings[];
  times: number[];
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
    events: EventTimings;
    frames: FrameData;
  };
};

export type ProfilingData = {
  recordings: Recording[];
};

export function parseProfilingData(data: string): ProfilingData | undefined {
  return parse(data.replace("Profiling_Data_Storage = ", "return "));
}
