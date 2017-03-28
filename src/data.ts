function loadConnsList() {
    return new Promise((f, r) => {
        fetch(connsListURL)
        .then( response => {
            return response.json();
        })
        .then((data) => {
            // Cast data to array wtf..
            f(data);
        });
    });
}

// Load Conns-List
// Load Conns-Data
// Load Meshes

// Render Synapses as Particles -> Tonight

// Click on synapse => Propagate Signal, (if exist => Load <other> cell)

// Set up Vue -> Playground
// What properties should we trigger?
