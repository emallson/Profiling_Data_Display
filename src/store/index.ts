import create, { StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import type { ProfilingData, Recording } from "../lua";
import { TimingEntry } from "../ScriptTimingTree";
import { FrameTree } from "../tree";

export type DataState = {
  setProfilingData: (data: ProfilingData) => void;
  clearProfilingData: () => void;
  profilingData?: ProfilingData;
  parseError: boolean;
  setParseError: (value: boolean) => void;
};

type SliceCreator<T> = StateCreator<
  State,
  [["zustand/devtools", never]],
  [],
  T
>;

const createDataSlice: SliceCreator<DataState> = (set) => ({
  setProfilingData: (profilingData) =>
    set({ profilingData, parseError: false }),
  clearProfilingData: () =>
    set({ profilingData: undefined, parseError: false }),
  setParseError: (value) => set({ parseError: value }),
  parseError: false,
});

export type ViewState = {
  selectedRecordingIndex?: number;
  resetView: () => void;
  selectRecording: (index: number) => void;
  focusedNode?: FrameTree<TimingEntry>;
  clearFocusedNode: () => void;
  setFocusedNode: (node: FrameTree<TimingEntry>) => void;
  expandScriptTimingChart: boolean;
  setExpandScriptTimingChart: (value: boolean) => void;
};

const createViewSlice: SliceCreator<ViewState> = (set) => ({
  resetView: () =>
    set({
      expandScriptTimingChart: false,
      focusedNode: undefined,
      selectedRecordingIndex: undefined,
    }),
  selectRecording: (index: number) => set({ selectedRecordingIndex: index }),
  clearFocusedNode: () => set({ focusedNode: undefined }),
  setFocusedNode: (node) => set({ focusedNode: node }),
  expandScriptTimingChart: false,
  setExpandScriptTimingChart: (value) =>
    set({ expandScriptTimingChart: value }),
});

export type State = DataState & ViewState;

const useStore = create<State>()(
  devtools((...args) => ({
    ...createDataSlice(...args),
    ...createViewSlice(...args),
  }))
);

export default useStore;

// dunno how i feel about this pattern, but it is a convenient shorthand.
// trading one class of error (changing one var name but not the () => state.foo
// part) for another (stringly state access).
export function useStoreKey<Key extends keyof State>(key: Key): State[Key] {
  return useStore((state) => state[key]);
}

export const useProfilingData: () => ProfilingData | undefined = () =>
  useStore((state) => state.profilingData);

export const useSelectedRecording: () => Recording | undefined = () =>
  useStore((state) =>
    state.selectedRecordingIndex !== undefined
      ? state.profilingData?.recordings[state.selectedRecordingIndex]
      : undefined
  );
