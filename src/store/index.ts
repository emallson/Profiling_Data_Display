import create, { StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import type { ProfilingData, Recording } from "../lua";

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
};

const createViewSlice: SliceCreator<ViewState> = (set) => ({
  resetView: () => set({ selectedRecordingIndex: undefined }),
  selectRecording: (index: number) => set({ selectedRecordingIndex: index }),
});

export type State = DataState & ViewState;

const useStore = create<State>()(
  devtools((...args) => ({
    ...createDataSlice(...args),
    ...createViewSlice(...args),
  }))
);

export default useStore;

export const useProfilingData: () => ProfilingData | undefined = () =>
  useStore((state) => state.profilingData);

export const useSelectedRecording: () => Recording | undefined = () =>
  useStore((state) =>
    state.selectedRecordingIndex !== undefined
      ? state.profilingData?.recordings[state.selectedRecordingIndex]
      : undefined
  );
