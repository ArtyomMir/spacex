import { SpaceX } from "./api/spacex.js";
import * as d3 from "d3";
import Geo from "./geo.json" assert { type: "json" };

document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const spaceX = new SpaceX();

  // Загружаем данные запусков
  const launches = await spaceX.launches();
  const listContainer = document.getElementById("listContainer");
  renderLaunches(launches, listContainer);

  // Рисуем карту и launchpads
  drawMap(spaceX, Geo, launches);
}

// --- Отображение списка запусков ---
function renderLaunches(launches, container) {
  const list = document.createElement("ul");
  list.style.listStyle = "none";
  list.style.padding = 0;

  launches.forEach(launch => {
    const item = document.createElement("li");
    item.innerHTML = `${launch.name} (${new Date(launch.date_utc).getFullYear()})`;
    item.style.cursor = "pointer";
    list.appendChild(item);

    // Событие hover для подсветки launchpad
    item.addEventListener("mouseenter", () => {
      d3.selectAll(".launchpad-circle")
        .attr("fill", d => (d.id === launch.launchpad ? "orange" : "red"))
        .attr("r", d => (d.id === launch.launchpad ? 8 : 5));
    });
    item.addEventListener("mouseleave", () => {
      d3.selectAll(".launchpad-circle")
        .attr("fill", "red")
        .attr("r", 5);
    });
  });

  container.replaceChildren(list);
}

// --- Рисуем карту и launchpads ---
function drawMap(spaceX, Geo, launches) {
  const width = 800;
  const height = 500;

  const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoMercator()
    .fitSize([width, height], Geo); // Автоцентрирование и масштаб

  const path = d3.geoPath().projection(projection);

  // Рисуем страны
  svg.selectAll("path")
    .data(Geo.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "lightgray")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);

  // Загружаем launchpads
  spaceX.launchpads().then(pads => {
    svg.selectAll("circle")
      .data(pads)
      .enter()
      .append("circle")
      .attr("class", "launchpad-circle")
      .attr("cx", d => projection([d.longitude, d.latitude])[0])
      .attr("cy", d => projection([d.longitude, d.latitude])[1])
      .attr("r", 5)
      .attr("fill", "red")
      .attr("stroke", "white")
      .append("title")
      .text(d => d.name);
  });
}
