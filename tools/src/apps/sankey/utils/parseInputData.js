// src/utils/parseInputData.js

export const parseInputData = (textInput) => {
    const lines = textInput.split('\n');
    const nodes = [];
    const links = [];
    const nodeMap = {};
  
    lines.forEach(line => {
      if (line.startsWith('//') || line.trim() === '') return;
  
      if (line.includes(':')) {
        // Node color
        const [node, color] = line.split(' ');
        const nodeName = node.slice(1);
        if (nodeMap[nodeName]) {
          nodeMap[nodeName].color = color.trim();
        }
      } else if (line.includes('[') && line.includes(']')) {
        // Links
        const [source, rest] = line.split('[');
        const [value, target] = rest.split(']');
        const targetParts = target.trim().split(/ (.+)/); // Splitting on the first space
        const targetName = targetParts[1] && targetParts[1].startsWith('#') ? targetParts[0] : targetParts.join(' ');
        const color = targetParts[1] && targetParts[1].startsWith('#') ? targetParts[1] : null;
  
        if (!nodeMap[source.trim()]) {
          nodeMap[source.trim()] = { name: source.trim() };
          nodes.push(nodeMap[source.trim()]);
        }
        if (!nodeMap[targetName.trim()]) {
          nodeMap[targetName.trim()] = { name: targetName.trim() };
          nodes.push(nodeMap[targetName.trim()]);
        }
  
        const link = {
          source: nodeMap[source.trim()],
          target: nodeMap[targetName.trim()],
          value: +value.trim()
        };
        if (color) {
          link.color = color.trim();
        }
        links.push(link);
      }
    });
  
    return { nodes, links };
  };
  