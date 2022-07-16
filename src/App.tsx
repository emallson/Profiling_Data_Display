import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { ChangeEvent, useCallback } from "react";
import useStore from "./store";
import { parseProfilingData } from "./lua";
import FileRenderer from "./FileRenderer";

export const globals = css`
  :global() {
    html,
    body,
    div#root {
      height: 100%;
      max-width: 100vw;
    }
  }
`;

const CenteringContainer = styled.div`
  display: grid;
  justify-items: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const profilingLabelCss = css`
  display: block;
  font-size: 2rem;
`;

const Error = styled.div`
  color: red;
`;

function FilePickerPage() {
  const { setProfilingData, clearProfilingData, setParseError, parseError } =
    useStore(
      ({
        setProfilingData,
        clearProfilingData,
        setParseError,
        parseError,
      }) => ({
        setProfilingData,
        clearProfilingData,
        setParseError,
        parseError,
      })
    );

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        files[0].text().then((raw) => {
          const data = parseProfilingData(raw);
          if (data) {
            setProfilingData(data);
          } else {
            setParseError(true);
          }
        });
      } else {
        clearProfilingData();
      }
    },
    [setProfilingData, clearProfilingData, setParseError]
  );

  return (
    <CenteringContainer>
      <div>
        <label className={profilingLabelCss} htmlFor="file-picker">
          Select profiling data
        </label>
        <input
          type="file"
          id="file-picker"
          onChange={onFileChange}
          accept=".lua"
        />
        {parseError && <Error>Unable to parse input.</Error>}
      </div>
    </CenteringContainer>
  );
}

function App() {
  const hasProfilingData = useStore(
    (state) => state.profilingData !== undefined
  );
  if (!hasProfilingData) {
    return <FilePickerPage />;
  }
  return <FileRenderer />;
}

export default App;
