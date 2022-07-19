import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { useEffect, useMemo } from "react";
import FrameDataDisplay from "./FrameData";
import {
  Encounter,
  FrameCreation,
  isBossEncounter,
  NamedFrameCreation,
} from "./lua";
import ScriptTimingTree from "./ScriptTimingTree";
import useStore, {
  useProfilingData,
  useSelectedRecording,
  useStoreKey,
} from "./store";

const Container = styled.div`
  display: grid;
  grid-template-areas:
    "sidebar encounter"
    "sidebar addons"
    "sidebar functions"
    "sidebar frames"
    "sidebar empty";
  grid-template-columns: max-content minmax(0, 1fr);
  height: 100%;
  max-width: 100vw;
  gap: 1rem;
  padding-right: 1rem;
  grid-template-rows: repeat(4, max-content) 1fr;
  align-items: start;
  align-content: start;
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

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

const DescriptionList = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0 1rem;
`;

const EncounterTable = () => {
  const recording = useSelectedRecording();

  if (!recording) {
    return null;
  }

  const encounter = recording.encounter;

  return (
    <details>
      <summary>Encounter Details</summary>
      <DescriptionList>
        <dt>Encounter/Map ID</dt>
        <dd>
          {isBossEncounter(encounter) ? encounter.encounterId : encounter.mapId}
        </dd>
        <dt>Encounter Name</dt>
        <dd>{encounter.encounterName}</dd>
        <dt>Start Time</dt>
        <dd>{formatStartTime(encounter.startTime)}</dd>
        <dt>End Time</dt>
        <dd>{formatStartTime(encounter.endTime)}</dd>
        <dt>Duration</dt>
        <dd>{formatDuration(encounter.endTime - encounter.startTime)}</dd>
        {isBossEncounter(encounter) ? (
          <>
            <dt>Result</dt>
            <dd>{encounter.success ? "Kill" : "Wipe"}</dd>
            <dt>Group Size</dt>
            <dd>{encounter.groupSize}</dd>
            <dt>Difficulty ID</dt>
            <dd>{encounter.difficultyId}</dd>
          </>
        ) : null}
      </DescriptionList>
    </details>
  );
};

const Table = styled.table`
  tbody tr:nth-child(even) {
    background-color: #eee;
  }

  td {
    padding: 0 1rem;
  }
`;

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
      <Table>
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
      </Table>
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
      <Table>
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
          </tr>
        </thead>
        <tbody>
          {entries?.map(([key, entry]) => (
            <tr key={key}>
              <td>{entry.name}</td>
              <td>{entry.time.toFixed(2)}</td>
              <td>{((entry.time / (totalTime * 1000)) * 100).toFixed(2)}</td>
              <td>{(entry.time / frameCount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </details>
  );
};

const ClearButton = () => {
  const reset = useStoreKey("clearProfilingData");

  return (
    <button
      className={css`
        margin-bottom: 1rem;
      `}
      onClick={reset}
    >
      Clear
    </button>
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
      <ClearButton />
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
      <EncounterTable />
      <FrameDataDisplay />
      <AddonTable />
      <ScriptTimingTree />
      <FrameCreationsTable />
    </Container>
  );
}
