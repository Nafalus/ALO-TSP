let map;
let markers = [];
let routeLayer;
let chart;
let cities = [
    {name: "Surabaya", lat: -7.2575, lng: 112.7521},
    {name: "Malang", lat: -7.9839, lng: 112.6214},
    {name: "Blitar", lat: -8.0954, lng: 112.1611},
    {name: "Kediri", lat: -7.8483, lng: 112.0160},
    {name: "Madiun", lat: -7.6296, lng: 111.5233},
    {name: "Bojonegoro", lat: -7.1500, lng: 111.8810},
    {name: "Jember", lat: -8.1845, lng: 113.6681},
    {name: "Banyuwangi", lat: -8.2192, lng: 114.3691},
    {name: "Mojokerto", lat: -7.4724, lng: 112.4381},
    {name: "Pasuruan", lat: -7.6451, lng: 112.9076}
];

const numAntlions = 50;
const numAnts = 50;
const maxIterations = 100;
let antlions = [];
let ants = [];
let globalBest;
let iterationData = [];

class Antlion {
    constructor() {
        this.position = shuffle([...Array(cities.length).keys()]);
        this.bestPosition = [...this.position];
        this.bestDistance = this.calculateDistance();
    }

    calculateDistance() {
        let distance = 0;
        for (let i = 0; i < this.position.length - 1; i++) {
            distance += getDistance(cities[this.position[i]], cities[this.position[i + 1]]);
        }
        distance += getDistance(cities[this.position[this.position.length - 1]], cities[this.position[0]]);
        return distance;
    }

    updateBestPosition() {
        const currentDistance = this.calculateDistance();
        if (currentDistance < this.bestDistance) {
            this.bestDistance = currentDistance;
            this.bestPosition = [...this.position];
        }
    }

    updatePosition() {
        for (let i = 0; i < this.position.length; i++) {
            if (Math.random() < 0.2) {
                let swapIndex = Math.floor(Math.random() * this.position.length);
                [this.position[i], this.position[swapIndex]] = [this.position[swapIndex], this.position[i]];
            }
        }
        this.updateBestPosition();
    }
}

class Ant {
    constructor() {
        this.position = shuffle([...Array(cities.length).keys()]);
        this.distance = this.calculateDistance();
    }

    calculateDistance() {
        let distance = 0;
        for (let i = 0; i < this.position.length - 1; i++) {
            distance += getDistance(cities[this.position[i]], cities[this.position[i + 1]]);
        }
        distance += getDistance(cities[this.position[this.position.length - 1]], cities[this.position[0]]);
        return distance;
    }

    move(antlions) {
        let bestAntlion = antlions.reduce((best, current) => 
            current.bestDistance < best.bestDistance ? current : best, antlions[0]);
        this.position = [...bestAntlion.bestPosition];
        this.distance = bestAntlion.bestDistance;
    }
}

function initMap() {
    map = L.map('map').setView([-7.5, 112.5], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }).addTo(map);

    cities.forEach(city => {
        const marker = L.marker([city.lat, city.lng]).addTo(map)
            .bindPopup(city.name);
        markers.push(marker);
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getDistance(city1, city2) {
    const R = 6371;
    const dLat = (city2.lat - city1.lat) * Math.PI / 180;
    const dLng = (city2.lng - city1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(city1.lat * Math.PI / 180) * Math.cos(city2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function solveALO() {
    initializeAntlions();
    globalBest = { position: null, distance: Infinity };
    iterationData = [];

    initChart();
    runIterations(0);
}

function initializeAntlions() {
    antlions = [];
    ants = [];
    for (let i = 0; i < numAntlions; i++) {
        antlions.push(new Antlion());
    }
    for (let i = 0; i < numAnts; i++) {
        ants.push(new Ant());
    }
}

function runIterations(iteration) {
    if (iteration >= maxIterations) {
        return;
    }

    ants.forEach(ant => {
        ant.move(antlions);
    });

    antlions.forEach(antlion => {
        antlion.updatePosition();
    });

    const bestAntlion = antlions.reduce((best, current) => 
        current.bestDistance < best.bestDistance ? current : best, antlions[0]);

    if (bestAntlion.bestDistance < globalBest.distance) {
        globalBest.position = [...bestAntlion.bestPosition];
        globalBest.distance = bestAntlion.bestDistance;
    }

    iterationData.push(globalBest.distance);
    updateChart(iteration);
    drawRoute(globalBest.position);

    document.getElementById('result').innerHTML = `Best Distance at iteration ${iteration + 1}: ${globalBest.distance.toFixed(2)} km`;

    setTimeout(() => runIterations(iteration + 1), 500);
}

function drawRoute(route) {
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    const latlngs = route.map(index => [cities[index].lat, cities[index].lng]);
    latlngs.push(latlngs[0]);

    routeLayer = L.polyline(latlngs, { color: 'blue' }).addTo(map);
    map.fitBounds(routeLayer.getBounds());
}

function initChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Best Distance per Iteration',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Iteration'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Distance (km)'
                    }
                }
            }
        }
    });
}

function updateChart(iteration) {
    chart.data.labels.push(iteration + 1);
    chart.data.datasets[0].data.push(iterationData[iteration]);
    chart.update();
}

initMap();
