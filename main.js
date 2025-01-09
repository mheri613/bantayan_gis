// Base URL Configuration
const WORKSPACE = "bantayan"; // Workspace GeoServer
const BASE_URL = "http://localhost";
const GEOSERVER_URL = `${BASE_URL}:8080/geoserver/${WORKSPACE}/wms?`;

// Loader Element
function showLoader(show) {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = show ? "block" : "none";
    }
}

// Map Initialization
let mapView = new ol.View({
    center: ol.proj.fromLonLat([97.45175736767429, 5.230198941441781]),
    zoom: 15,
});

let map = new ol.Map({
    target: "map",
    view: mapView,
});

let layerGroup = new ol.layer.Group({
    title: "Digitasi Layers",
    layers: [],
});

// Popup Elements
let container = document.getElementById('popup');
let content = document.getElementById('popup-content');
let closer = document.getElementById('popup-closer');

// Popup Overlay
let popup = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: { duration: 250 }
});
map.addOverlay(popup);

closer.onclick = function () {
    popup.setPosition(undefined);
    closer.blur();
};

// Controller Setup
function addController() {
    let osmTile = new ol.layer.Tile({
        title: "Open Street Map",
        visible: true,
        source: new ol.source.OSM(),
    });
    map.addLayer(osmTile);

    let sidebar = new ol.control.Sidebar({
        element: "sidebar",
        position: "left",
    });
    map.addControl(sidebar);

    let layerSwitcher = new ol.control.LayerSwitcher({
        activationMode: "click",
        startActive: false,
        groupSelectStyle: "children",
    });
    map.addControl(layerSwitcher);
}

// Toggle Layer Visibility
function toggleLayer(event) {
    let layerName = event.target.value;
    let checkedStatus = event.target.checked;

    let targetLayer = layerGroup.getLayers().getArray().find(layer => layer.get("title") === layerName);
    if (targetLayer) {
        targetLayer.setVisible(checkedStatus);
    }
}

// Feature Info
function getFeatureInfo(newLayer) {
    let popup = new ol.Overlay({
        element: container,
        autoPan: true,
        autoAnimation: {
            duration: 250
        }
    });

    map.addOverlay(popup);

    closer.onclick = function () {
        popup.setPosition(undefined);
        closer.blur();
    };

    map.on("singleclick", function (evt) {
        // Pastikan layer dalam keadaan visible
        if (!newLayer.getVisible()) {
            return; // Abaikan jika layer tidak terlihat
        }

        const viewResolution = mapView.getResolution();

        const url = newLayer
            .getSource()
            .getFeatureInfoUrl(evt.coordinate, viewResolution, "EPSG:3857", {
                INFO_FORMAT: "text/html",
            });

        if (url) {
            fetch(url)
                .then((response) => response.text())
                .then((html) => {
                    if (!(html.toString().includes("<td>"))) {
                        dapat = false;
                    } else {
                        dapat = true;
                    }

                    if (dapat === true) {
                        hasil = html;
                    }

                    if (hasil != null && hasil.toString().includes("<td>")) {
                        content.innerHTML = hasil;
                        popup.setPosition(evt.coordinate);
                    } else {
                        content.innerHTML = "Kosong";
                        popup.setPosition(evt.coordinate);
                    }

                    map.un("singleclick");
                    map.un("pointermove");
                    return;
                })
                .catch(() => {
                    return;
                });
        }
        hasil = null;
    });
}


// Add Checkbox
function addCheckbox(layer, group) {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = layer.title;
    checkbox.checked = true;
    checkbox.onchange = toggleLayer;

    let label = document.createElement("label");
    label.htmlFor = layer.title;
    label.appendChild(document.createTextNode(layer.title));

    let nameGroup = group.folder.replace("Digitasi", "").replace(/\s/g, "");
    let groupContainer = document.getElementById(nameGroup.toLowerCase() + "Group");
    if (groupContainer) {
        groupContainer.appendChild(checkbox);
        groupContainer.appendChild(label);
        groupContainer.appendChild(document.createElement("br"));
    }
}

// Add Layers Dynamically
function addLayer() {
    map.addLayer(layerGroup);
    showLoader(true);

    fetch(`${BASE_URL}/read_shapefiles.php`)
        .then((response) => response.json())
        .then((data) => {
            data.forEach((group) => {
                let groupLayer = new ol.layer.Group({
                    title: group.folder,
                    layers: [],
                });

                group.layers.forEach((layer) => {
                    let newLayer = new ol.layer.Tile({
                        title: layer.title,
                        source: new ol.source.TileWMS({
                            url: GEOSERVER_URL,
                            params: { LAYERS: layer.layerName, TILED: false },
                            serverType: "geoserver",
                            visible: false,
                        }),
                    });

                    getFeatureInfo(newLayer);
                    groupLayer.getLayers().push(newLayer);
                    addCheckbox(layer, group);
                });

                layerGroup.getLayers().push(groupLayer);
            });

            showLoader(false);
        })
        .catch((error) => {
            console.error("Error loading layers:", error);
            showLoader(false);
        });
}

// Initialization
addController();
addLayer();
