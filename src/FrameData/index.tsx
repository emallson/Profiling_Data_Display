import { useMemo } from "react";
import { createClassFromSpec } from "react-vega";
import { useSelectedRecording } from "../store";

const timeAxis = {
  field: "time",
  type: "quantitative" as const,
  scale: {
    nice: false,
  },
  title: "Time in Encounter",
  axis: {
    labelExpr: "floor((datum.value + 1) / 60) + 'm'",
    tickMinStep: 60,
  },
};

const FrameDurationChart = createClassFromSpec({
  spec: {
    data: {
      name: "durations",
    },
    layer: [
      {
        mark: "bar",
        encoding: {
          x: timeAxis,
          y: {
            field: "delta",
            type: "quantitative",
            scale: {
              domain: {
                unionWith: [0, 1.5 / 60],
              },
            },
            title: "Est. Time Between Frames (sec)",
          },
        },
      },
      {
        mark: "rule",
        encoding: {
          y: {
            datum: 1 / 60,
          },
          color: {
            value: "lightgreen",
          },
        },
      },
      {
        mark: "rule",
        encoding: {
          y: {
            datum: 2 / 60,
          },
          color: {
            value: "orange",
          },
        },
      },
      {
        mark: "rule",
        encoding: {
          y: {
            datum: 3 / 60,
          },
          color: {
            value: "red",
          },
        },
      },
    ],
  },
});

const ScriptStackChart = createClassFromSpec({
  spec: {
    data: {
      name: "scriptFrames",
    },
    layer: [
      {
        mark: "bar",
        encoding: {
          x: {
            field: "label",
            type: "nominal",
            title: "Time in Encounter (Frame Duration)",
            sort: {
              field: "sortValue",
              op: "min",
              order: "descending",
            },
            axis: {
              labelAngle: -45,
            },
          },
          y: {
            field: "duration",
            title: "Script Duration (ms)",
            type: "quantitative",
          },
          color: {
            field: "scriptKey",
            type: "nominal",
            legend: null,
          },
          tooltip: [
            {
              field: "scriptKey",
              type: "nominal",
              title: "Script Key",
            },
            {
              field: "duration",
              type: "quantitative",
              title: "Duration",
            },
          ],
        },
      },
    ],
  },
});

export default function FrameDataDisplay(): JSX.Element | null {
  const recording = useSelectedRecording();

  const durations = useMemo(
    () =>
      recording?.data.frames.times
        .map((value, ix, arr) => {
          if (ix < arr.length - 1) {
            return {
              delta: arr[ix + 1] - value,
              time: value - arr[0],
            };
          } else {
            return null;
          }
        })
        .slice(0, -1),
    [recording?.data.frames.times]
  );

  const worstFrames = useMemo(() => {
    if (!recording || !durations) {
      return null;
    }

    const badDurations = durations
      .map((val, ix) => ({
        val,
        ix,
      }))
      .filter(({ val }) => val && val?.delta > 1 / 60);

    badDurations.sort((a, b) => b.val!.delta - a.val!.delta);

    return badDurations.slice(0, 30).flatMap(({ ix }) => {
      const datum = recording.data.frames.data[ix];

      return Object.entries(datum).map(([scriptKey, duration]) => {
        const time =
          recording.data.frames.times[ix] - recording.data.frames.times[0];
        const frameDuration = durations[ix]?.delta ?? -1;
        return {
          frameIndex: ix,
          duration,
          scriptKey,
          frameDuration,
          sortValue: frameDuration,
          label: `${Math.floor(time / 60)}m ${Math.floor(
            time % 60
          )}s (${Math.floor(frameDuration * 1000)}ms)`,
          time,
        };
      });
    });
  }, [recording, durations]);

  const worstScriptFrames = useMemo(() => {
    if (!recording || !durations) {
      return null;
    }

    const scriptDurations = recording.data.frames.data
      .map((datum, ix) => ({
        ix,
        duration: Object.values(datum).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 30);

    return scriptDurations.flatMap(({ ix, duration: totalDuration }) => {
      const datum = recording.data.frames.data[ix];

      return Object.entries(datum).map(([scriptKey, duration]) => {
        const time =
          recording.data.frames.times[ix] - recording.data.frames.times[0];
        const frameDuration = durations[ix]?.delta ?? -1;
        return {
          frameIndex: ix,
          duration,
          scriptKey,
          frameDuration: duration,
          sortValue: totalDuration,
          label: `${Math.floor(time / 60)}m ${Math.floor(
            time % 60
          )}s (${Math.floor(frameDuration * 1000)}ms)`,
          time,
        };
      });
    });
  }, [recording, durations]);

  if (!recording?.data?.frames) {
    return null;
  }

  return (
    <details>
      <summary>Frame-by-Frame Breakdown</summary>
      <p>This shows some frame-by-frame data.</p>
      <section>
        <header>Estimated Between-Frame Time</header>
        <p>
          This shows the amount of time from frame to frame, estimated by the
          amount of time between calls to <code>GetTime()</code> in subsequent
          frames. The green, yellow, and red lines show the maximum duration for
          60 FPS, 30 FPS, and 20 FPS respectively.
        </p>
        <FrameDurationChart
          renderer="canvas"
          data={{ durations }}
          width={1200}
          height={200}
        />
      </section>
      <section>
        <header>Script Time per Frame</header>
        <p>
          The script duration of the 30 worst frames by estimated time between
          frames.
        </p>
        <ScriptStackChart
          data={{
            scriptFrames: worstFrames,
          }}
          renderer="canvas"
          width={1200}
          height={200}
        />
        <p>
          The script duration of the 30 worst frames by measured script
          duration.
        </p>
        <ScriptStackChart
          data={{
            scriptFrames: worstScriptFrames,
          }}
          renderer="canvas"
          width={1200}
          height={200}
        />
      </section>
    </details>
  );
}
