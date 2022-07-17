import { styled } from "@linaria/react";
import { useCallback, useEffect, useMemo } from "react";
import { ScriptTiming } from "./lua";
import useStore, { useSelectedRecording, useStoreKey } from "./store";
import { build, FrameTree } from "./tree";

export type TimingEntry = {
  callCount?: number;
  totalTime: number;
};

function toTimingTree(
  sourceTree: FrameTree<[string, ScriptTiming] | undefined>
): FrameTree<TimingEntry> {
  const children: [string, FrameTree<TimingEntry>][] = Object.entries(
    sourceTree.children
  ).map(([k, v]) => [k, toTimingTree(v)]);

  const originalEntry = sourceTree.value?.[1];

  const value = originalEntry
    ? {
        callCount: originalEntry.callCount,
        totalTime: originalEntry.debugTime,
      }
    : {
        totalTime: children.reduce(
          (totalTime, [, value]) => value.value.totalTime + totalTime,
          0
        ),
      };

  return {
    ...sourceTree,
    children: Object.fromEntries(children),
    value,
  };
}

const NodeLabel = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: #eee;

  &:hover {
    background-color: #aaa;
  }
`;

const ChildContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  place-items: start;
  gap: 2px;
  max-width: 100%;
`;

const ChildNode = styled.div`
  display: inline-block;
  overflow: hidden;
`;

function TimingTreeNode({
  node,
  parentTime,
}: {
  parentTime: number;
  node: FrameTree<TimingEntry>;
}) {
  const width = node.value.totalTime / parentTime;

  const focusedNode = useStore((state) => state.focusedNode);
  const setFocusedNode = useStore((state) => state.setFocusedNode);
  const clearFocusedNode = useStore((state) => state.clearFocusedNode);

  const onClick = useCallback(() => {
    if (focusedNode === node) {
      clearFocusedNode();
    } else {
      setFocusedNode(node);
    }
  }, [focusedNode, setFocusedNode, clearFocusedNode]);

  if (node.value.totalTime < 1) {
    return null;
  }

  return (
    <ChildNode style={{ width: `${width * 100}%` }}>
      <NodeLabel
        title={`${node.name} (${node.value.totalTime.toFixed(2)} ms)`}
        onClick={onClick}
      >
        {node.name}
      </NodeLabel>
      <ChildContainer>
        {Object.entries(node.children).map(([key, child]) => (
          <TimingTreeNode
            key={key}
            node={child}
            parentTime={node.value.totalTime}
          />
        ))}
      </ChildContainer>
    </ChildNode>
  );
}

const TreeContainer = styled.details`
  max-width: 100%;
`;

export default function ScriptTimingTree(): JSX.Element | null {
  const recording = useSelectedRecording();

  const focusedNode = useStoreKey("focusedNode");
  const clearFocusedNode = useStoreKey("clearFocusedNode");

  const tree = useMemo(
    () =>
      recording &&
      toTimingTree(build(Object.entries(recording.data.fn), ([key]) => key)),
    [recording]
  );

  useEffect(() => {
    clearFocusedNode();
  }, [tree]);

  if (!tree) {
    return null;
  }

  const node = focusedNode ?? tree;

  return (
    <TreeContainer>
      <summary>Script Timing</summary>
      <p>
        This shows the recording time spent on every script attached to every
        frame (except for a few unhookable internal frames).
      </p>
      <p>Subtrees that took less than 1ms of script time are not shown.</p>
      <TimingTreeNode node={node} parentTime={node.value.totalTime} />
    </TreeContainer>
  );
}
