// 3D "periodic table" of people, adapted from the official three.js example:
// https://threejs.org/examples/#css3d_periodictable
// Data is retrieved live from the Google Sheet configured in js/config.js (SHEET_ID).

import * as THREE from "three";
import TWEEN from "three/addons/libs/tween.module.js";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import { CSS3DRenderer, CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

const TABLE_COLUMNS = 20; // 200 people -> 20 x 10 table
const GRID_COLUMNS = 5; // 5 wide x 4 tall x 10 layers deep
const GRID_ROWS = 4;

const TILE_COLORS = {
  red: "239, 48, 34", // #EF3022
  orange: "253, 202, 53", // #FDCA35
  green: "58, 159, 72", // #3A9F48
};

let camera, scene, renderer, controls;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };


const statusEl = document.getElementById("status");

// js/main.js already redirects to the login page when there is no session.
// this check only stops the module from fetching mid-redirect.
if (sessionStorage.getItem("kasatriaUser")) {
  loadPeople()
    .then((people) => {
      statusEl.style.display = "none";
      init(people);
      animate();
    })
    .catch((error) => {
      statusEl.textContent =
        "Could not load the Google Sheet :( check that link sharing is set to " +
        '"Anyone with the link: Viewer". (' + error.message + ")";
      console.error(error);
    });
}


async function loadPeople() {
  if (typeof SHEET_ID === "undefined") {
    throw new Error("SHEET_ID is missing from js/config.js");
  }

  const url =
    "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/gviz/tq?tqx=out:json&headers=1";
  const response = await fetch(url);
  if (!response.ok) throw new Error("HTTP " + response.status);

  // The gviz endpoint wraps JSON in a callback:
  // google.visualization.Query.setResponse({...});
  const text = await response.text();
  const json = JSON.parse(text.substring(text.indexOf("(") + 1, text.lastIndexOf(")")));
  if (json.status !== "ok") throw new Error("sheet query status: " + json.status);

  return json.table.rows
    .map((row) => {
      const c = row.c || [];
      return {
        name: cellText(c[0]),
        photo: cellText(c[1]),
        age: cellText(c[2]),
        country: cellText(c[3]),
        interest: cellText(c[4]),
        netWorthText: cellText(c[5]),
        netWorth: cellNumber(c[5]), // numeric value 
      };
    })
    .filter((person) => person.name && person.name.toLowerCase() !== "name");
}

// A gviz cell is {v: rawValue, f: formattedString} — prefer the formatted string
// so currency/number formatting from the sheet ("$251,260.80") is kept as-is.
function cellText(cell) {
  if (!cell) return "";
  if (cell.f !== undefined && cell.f !== null) return String(cell.f).trim();
  if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
  return "";
}

function cellNumber(cell) {
  if (!cell || cell.v === undefined || cell.v === null) return 0;
  if (typeof cell.v === "number") return cell.v;
  const parsed = parseFloat(String(cell.v).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function tileColor(netWorth) {
  if (netWorth > 200000) return TILE_COLORS.green;
  else if (netWorth < 100000) return TILE_COLORS.red;
  else return TILE_COLORS.orange;
}

function buildTile(person) {
  const element = document.createElement("div");
  element.className = "element";
  element.style.setProperty("--tile-color", tileColor(person.netWorth));
  element.title = person.name + " | Net Worth: " + person.netWorthText;

  const top = document.createElement("div");
  top.className = "tile-top";

  const country = document.createElement("span");
  country.textContent = person.country;

  const age = document.createElement("span");
  age.textContent = person.age;

  top.append(country, age);

  const photo = document.createElement("img");
  photo.className = "tile-photo";
  photo.src = person.photo;
  photo.alt = person.name;
  photo.draggable = false;
  photo.addEventListener("error", () => {
    photo.style.visibility = "hidden";
  });

  const name = document.createElement("div");
  name.className = "tile-name";
  name.textContent = person.name;

  const interest = document.createElement("div");
  interest.className = "tile-interest";
  interest.textContent = person.interest;

  element.append(top, photo, name, interest);
  return element;
}

function init(people) {
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 3000;

  scene = new THREE.Scene();

  for (const person of people) {
    const object = new CSS3DObject(buildTile(person));
    object.position.x = Math.random() * 4000 - 2000;
    object.position.y = Math.random() * 4000 - 2000;
    object.position.z = Math.random() * 4000 - 2000;
    scene.add(object);
    objects.push(object);
  }

  buildTargets(objects.length);

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6500;
  controls.addEventListener("change", render);

  for (const shape of ["table", "sphere", "helix", "grid"]) {
    document.getElementById(shape).addEventListener("click", () => {
      transform(targets[shape], 2000);
    });
  }

  transform(targets.table, 2000);

  window.addEventListener("resize", onWindowResize);
}

function buildTargets(count) {
  const vector = new THREE.Vector3();

  // Table
  const tableRows = Math.ceil(count / TABLE_COLUMNS);

  for (let i = 0; i < count; i++) {
    const object = new THREE.Object3D();
    object.position.x = (i % TABLE_COLUMNS) * 140 - ((TABLE_COLUMNS - 1) * 140) / 2;
    object.position.y = -Math.floor(i / TABLE_COLUMNS) * 180 + ((tableRows - 1) * 180) / 2;
    targets.table.push(object);
  }

  // Sphere
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const object = new THREE.Object3D();
    object.position.setFromSphericalCoords(800, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);
    targets.sphere.push(object);
  }

  // DOUBLE helix: people alternate between two strands
  const pairs = Math.ceil(count / 2);
  for (let i = 0; i < count; i++) {
    const strand = i % 2;
    const pair = Math.floor(i / 2);
    const theta = pair * 0.24 + strand * Math.PI;
    const y = -pair * 13 + ((pairs - 1) * 13) / 2;
    const object = new THREE.Object3D();
    object.position.setFromCylindricalCoords(900, theta, y);
    vector.x = object.position.x * 2;
    vector.y = object.position.y;
    vector.z = object.position.z * 2;
    object.lookAt(vector);
    targets.helix.push(object);
  }

  // Grid
  const perLayer = GRID_COLUMNS * GRID_ROWS;
  const layers = Math.ceil(count / perLayer);
  for (let i = 0; i < count; i++) {
    const object = new THREE.Object3D();
    object.position.x = (i % GRID_COLUMNS) * 400 - ((GRID_COLUMNS - 1) * 400) / 2;
    object.position.y =
      -(Math.floor(i / GRID_COLUMNS) % GRID_ROWS) * 400 + ((GRID_ROWS - 1) * 400) / 2;
    object.position.z = Math.floor(i / perLayer) * 500 - ((layers - 1) * 500) / 2;
    targets.grid.push(object);
  }
}

function transform(targetObjects, duration) {
  TWEEN.removeAll();

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const target = targetObjects[i];

    new TWEEN.Tween(object.position)
      .to(
        { x: target.position.x, y: target.position.y, z: target.position.z },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  }

  new TWEEN.Tween({}).to({}, duration * 2).onUpdate(render).start();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}
