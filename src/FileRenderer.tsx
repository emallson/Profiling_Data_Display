import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { useEffect, useMemo } from "react";
import type { Encounter, FrameCreation, NamedFrameCreation } from "./lua";
import ScriptTimingTree from "./ScriptTimingTree";
import useStore, { useProfilingData, useSelectedRecording } from "./store";

const Container = styled.div`
  display: grid;
  grid-template-areas:
    "sidebar addons"
    "sidebar functions"
    "sidebar frames";
  grid-template-columns: max-content minmax(0, 1fr);
  height: 100%;
  max-width: 100vw;
  gap: 1rem;
  padding-right: 1rem;
`;

const formatStartTime = (startTime: number) => {
  const date = new Date(startTime * 1000);

  return Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

const EncounterEntry = ({
  encounter,
  onClick,
}: {
  encounter: Encounter;
  onClick: () => void;
}) => {
  return (
    <div
      className={css`
        margin-bottom: 1rem;
      `}
      onClick={onClick}
    >
      <div
        className={css`
          font-weight: bold;
        `}
      >
        {encounter.encounterName}
      </div>
      <div>
        <span>{formatStartTime(encounter.startTime)}</span>
      </div>
    </div>
  );
};

const alternatingTableRow = css`
  &:nth-child(even) {
    background-color: #eee;
  }
`;

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

const FrameCreationsTable = () => {
  const recording = useSelectedRecording();

  if (!recording) {
    return null;
  }

  const frames = (
    recording.data.CreateFrame.anonymous as (
      | FrameCreation
      | NamedFrameCreation
    )[]
  )
    .concat(Object.values(recording.data.CreateFrame.named))
    .sort((a, b) => a.creationTime - b.creationTime);

  return (
    <details>
      <summary>Frame Creations</summary>
      <p>
        This shows the mid-combat frame creations. Creating a frame is
        relatively expensive, and while it <em>can</em> be okay to create them
        in combat, creating a lot of them is likely to cause performance issues.
      </p>
      <table>
        <thead>
          <tr>
            <td>Frame Name</td>
            <td>Frame Type</td>
            <td>Time of Creation</td>
            <td>Parent</td>
            <td>Template</td>
          </tr>
        </thead>
        <tbody>
          {frames.map((frame, ix) => (
            <tr key={ix}>
              <td>{"name" in frame ? frame.name : <em>Anonymous</em>}</td>
              <td>{frame.frameType}</td>
              <td>
                {formatDuration(
                  frame.creationTime - recording.encounter.startTime
                )}
              </td>
              <td>{frame.parent}</td>
              <td>{frame.template}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
};

const AddonTable = () => {
  const recording = useSelectedRecording();
  const addon = recording?.data.addon;

  const entries = useMemo(
    () =>
      addon &&
      Object.entries(addon)
        .filter(([, addon]) => addon.time > 1)
        .sort(([, a], [, b]) => b.time - a.time),
    [addon]
  );

  if (!addon) {
    return null;
  }

  // this value is already in seconds
  const totalTime = recording.encounter.endTime - recording.encounter.startTime;

  // number of frames that should be rendered at 60 fps
  const frameCount = totalTime * 60;
  const frameLength = 1000 / 60;

  return (
    <details>
      <summary>Addon Overview</summary>
      <p>
        This shows the amount of time spent in each addon's code according to
        the WoW API. This does not include time spent on calls from addon code
        into Blizzard's APIs (such as time spent creating frames).
      </p>
      <p>Only addons that took at least 1ms of script time are shown.</p>
      <table>
        <thead
          className={css`
            font-weight: bold;
          `}
        >
          <tr>
            <td>Addon Name</td>
            <td>Reported Time (ms)</td>
            <td>Combat Time (%)</td>
            <td>Time per Frame @ 60 FPS (ms)</td>
            <td>60 FPS Frame Time (%)</td>
          </tr>
        </thead>
        <tbody>
          {entries?.map(([key, entry]) => (
            <tr key={key} className={alternatingTableRow}>
              <td>{entry.name}</td>
              <td>{entry.time.toFixed(2)}</td>
              <td>{((entry.time / (totalTime * 1000)) * 100).toFixed(2)}</td>
              <td>{(entry.time / frameCount).toFixed(2)}</td>
              <td>
                {((entry.time / frameCount / frameLength) * 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
};

const Sidebar = () => {
  const data = useProfilingData();
  const selectEncounter = useStore((state) => state.selectRecording);

  return (
    <div
      className={css`
        grid-area: sidebar;
        padding: 1rem;
        border-right: 1px solid black;
        height: 100%;
      `}
    >
      {data?.recordings.map(({ encounter }, index) => (
        <EncounterEntry
          key={encounter.startTime}
          encounter={encounter}
          onClick={() => selectEncounter(index)}
        />
      ))}
    </div>
  );
};

export default function FileRenderer(): JSX.Element {
  const initialize = useStore((state) => state.resetView);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Container>
      <Sidebar />
      <AddonTable />
      <ScriptTimingTree />
      <FrameCreationsTable />
    </Container>
  );
}
