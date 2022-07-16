export type FrameTree<T> = {
  name: string;
  value: T;
  children: {
    [name: string]: FrameTree<T>;
  };
};

type FrameKey = {
  /**
   * The reversed frame path
   */
  framePath: string[];
  script?: string;
};

export function parseKey(key: string): FrameKey {
  const [rawFramePath, script] = key.split(":");

  return {
    framePath: rawFramePath.split("/"),
    script,
  };
}

export function punch<T>(
  tree: FrameTree<T | undefined>,
  path: string[]
): FrameTree<T | undefined> {
  if (path.length === 0) {
    return tree;
  }

  const key = path[path.length - 1];
  let child = tree.children[key];

  if (child === undefined) {
    child = {
      name: key,
      value: undefined,
      children: {},
    };
    tree.children[key] = child;
  }

  return punch(child, path.slice(0, -1));
}

export function build<T>(
  data: T[],
  selector: (value: T) => string
): FrameTree<T | undefined> {
  let root = {
    name: "root",
    value: undefined,
    children: {},
  };

  for (const element of data) {
    const { framePath, script } = parseKey(selector(element));
    const node = punch<T>(root, script ? [script, ...framePath] : framePath);
    node.value = element;
  }

  return root;
}
