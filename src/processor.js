function buildUserId(fullName, dob) {
  const normalizedName = (fullName || "john doe")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, "");

  const normalizedDob = String(dob || "17091999").replace(/\D/g, "").slice(0, 8);
  return `${normalizedName || "johndoe"}_${normalizedDob || "17091999"}`;
}

function toTree(root, childrenMap) {
  const sortedChildren = [...(childrenMap.get(root) || [])].sort();
  const subtree = {};

  for (const child of sortedChildren) {
    subtree[child] = toTree(child, childrenMap);
  }

  return subtree;
}

function computeDepth(root, childrenMap) {
  const children = childrenMap.get(root) || [];
  if (children.length === 0) {
    return 1;
  }

  let best = 0;
  for (const child of children) {
    best = Math.max(best, computeDepth(child, childrenMap));
  }
  return 1 + best;
}

function groupNodes(nodes, undirectedMap, firstSeenIndex) {
  const visited = new Set();
  const groups = [];

  const ordered = [...nodes].sort((a, b) => firstSeenIndex.get(a) - firstSeenIndex.get(b));

  for (const start of ordered) {
    if (visited.has(start)) {
      continue;
    }

    const stack = [start];
    visited.add(start);
    const component = [];

    while (stack.length > 0) {
      const current = stack.pop();
      component.push(current);
      const neighbors = undirectedMap.get(current) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    groups.push(component);
  }

  return groups;
}

function hasDirectedCycle(nodes, childrenMap) {
  const UNVISITED = 0;
  const VISITING = 1;
  const VISITED = 2;

  const state = new Map();
  for (const node of nodes) {
    state.set(node, UNVISITED);
  }

  function dfs(node) {
    state.set(node, VISITING);

    for (const child of childrenMap.get(node) || []) {
      const childState = state.get(child);
      if (childState === VISITING) {
        return true;
      }
      if (childState === UNVISITED && dfs(child)) {
        return true;
      }
    }

    state.set(node, VISITED);
    return false;
  }

  for (const node of nodes) {
    if (state.get(node) === UNVISITED && dfs(node)) {
      return true;
    }
  }

  return false;
}

function processData(rawData, identity) {
  const data = Array.isArray(rawData) ? rawData : [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const duplicateSet = new Set();

  const seenEdges = new Set();
  const chosenParentForChild = new Map();
  const acceptedEdges = [];

  const firstSeenIndex = new Map();
  let nodeIndex = 0;

  for (const item of data) {
    const normalized = typeof item === "string" ? item.trim() : "";

    if (!/^[A-Z]->[A-Z]$/.test(normalized)) {
      invalidEntries.push(normalized || String(item ?? ""));
      continue;
    }

    const parent = normalized[0];
    const child = normalized[3];

    if (parent === child) {
      invalidEntries.push(normalized);
      continue;
    }

    const edgeKey = `${parent}->${child}`;

    if (seenEdges.has(edgeKey)) {
      if (!duplicateSet.has(edgeKey)) {
        duplicateSet.add(edgeKey);
        duplicateEdges.push(edgeKey);
      }
      continue;
    }
    seenEdges.add(edgeKey);

    if (chosenParentForChild.has(child)) {
      continue;
    }

    chosenParentForChild.set(child, parent);
    acceptedEdges.push({ parent, child });

    if (!firstSeenIndex.has(parent)) {
      firstSeenIndex.set(parent, nodeIndex++);
    }
    if (!firstSeenIndex.has(child)) {
      firstSeenIndex.set(child, nodeIndex++);
    }
  }

  const allNodes = new Set();
  const childrenMap = new Map();
  const indegree = new Map();
  const undirectedMap = new Map();

  for (const { parent, child } of acceptedEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    if (!childrenMap.has(parent)) {
      childrenMap.set(parent, []);
    }
    childrenMap.get(parent).push(child);

    if (!childrenMap.has(child)) {
      childrenMap.set(child, []);
    }

    indegree.set(child, (indegree.get(child) || 0) + 1);
    if (!indegree.has(parent)) {
      indegree.set(parent, indegree.get(parent) || 0);
    }

    if (!undirectedMap.has(parent)) {
      undirectedMap.set(parent, new Set());
    }
    if (!undirectedMap.has(child)) {
      undirectedMap.set(child, new Set());
    }
    undirectedMap.get(parent).add(child);
    undirectedMap.get(child).add(parent);
  }

  const groups = groupNodes(allNodes, undirectedMap, firstSeenIndex);
  const hierarchies = [];

  let totalTrees = 0;
  let totalCycles = 0;
  let bestDepth = 0;
  let bestRoot = "";

  for (const group of groups) {
    const groupSet = new Set(group);

    const groupChildrenMap = new Map();
    for (const node of group) {
      const children = (childrenMap.get(node) || []).filter((c) => groupSet.has(c));
      groupChildrenMap.set(node, children);
    }

    const roots = group.filter((n) => (indegree.get(n) || 0) === 0).sort();
    const defaultRoot = [...group].sort()[0];
    const root = roots[0] || defaultRoot;

    const cyclic = hasDirectedCycle(group, groupChildrenMap);

    if (cyclic) {
      totalCycles += 1;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
      continue;
    }

    const nested = {};
    nested[root] = toTree(root, groupChildrenMap);
    const depth = computeDepth(root, groupChildrenMap);

    totalTrees += 1;
    if (depth > bestDepth || (depth === bestDepth && root < bestRoot)) {
      bestDepth = depth;
      bestRoot = root;
    }

    hierarchies.push({
      root,
      tree: nested,
      depth
    });
  }

  return {
    user_id: buildUserId(identity.fullName, identity.dob),
    email_id: identity.email,
    college_roll_number: identity.roll,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: totalTrees > 0 ? bestRoot : ""
    }
  };
}

module.exports = {
  processData,
  buildUserId
};
