// src/components/SankeyChart.js

import React, { useRef, useEffect } from 'react';
import { select } from 'd3-selection';
import { sankey, sankeyLinkHorizontal, sankeyCenter } from 'd3-sankey';
import { formatCurrency } from '../utils/formatCurrency';
import './SankeyChart.css';

const SankeyChart = ({ data, width, height, fontSize, colors }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = select(svgRef.current);
    const margin = { top: 0, right: 0, bottom: 10, left: 0 }; // Add margins

    svg.selectAll("*").remove(); // Clear the previous content

    const adjustedWidth = width - margin.left - margin.right;
    const adjustedHeight = height - margin.top - margin.bottom;

    const sankeyGenerator = sankey()
      .nodeAlign(sankeyCenter) // Ensuring nodes are centered correctly
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[1, 1], [adjustedWidth - 1, adjustedHeight - 1]]);

    const { nodes, links } = sankeyGenerator(data);

    // Assign colors to nodes based on the selected color scheme
    nodes.forEach((node, i) => {
      if (!node.color) {
        node.color = colors[i % colors.length];
      }
    });

    // Ensure that nodes connected to the same source node are grouped together
    links.forEach(link => {
      if (!link.color) {
        link.color = link.source.color;
      }
    });

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const node = g
      .append("g")
      .selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node");

    // Append node rectangles
    node.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", d => d.color)
      .attr("stroke", "#000")
      .attr("stroke-width", "1px"); // Added stroke for nodes

    // Append links
    g.append("g")
      .attr("class", "link")
      .attr("fill", "none")
      .selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke", d => d.color ? d.color : d.source.color); // Use source node color if link color is not specified

    // Append text elements for node names
    svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", d => d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2 - 6) // Move the name text a bit up
      .attr("dy", "0.2em")
      .attr("text-anchor", "end")
      .attr("font-size", `${fontSize}px`)
      .text(d => d.name)
      .filter(d => d.x0 < 400) // Adjust according to your chart size
      .attr("x", d => d.x1 + 6)
      .attr("text-anchor", "start");

    // Append labels after links
    svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", d => d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2 + 6) // Move the value text below the name text
      .attr("dy", "0.2em")
      .attr("text-anchor", "end")
      .attr("font-size", `${fontSize}px`)
      .text(d => formatCurrency(d.value)) // Format as currency
      .filter(d => d.x0 < 400) // Adjust according to your chart size
      .attr("x", d => d.x1 + 6)
      .attr("text-anchor", "start");
  }, [data, width, height, fontSize, colors]);

  return (
    <svg ref={svgRef} width={width} height={height} />
  );
};

export default SankeyChart;
