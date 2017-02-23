interface Window {
    n: any
}

let frameRate = 60;

// Set the scene size.
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// Set some camera attributes.
const VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 1000;
const FAR = 1000000000;

// Create a WebGL renderer, camera and scene
const renderer = new THREE.WebGLRenderer({
	antialias: true
});
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.display = 'block'; // by default, most browsers use inline-block, creates scrollbars for fullscreen

const scene = new THREE.Scene();

const camera =
	new THREE.PerspectiveCamera(
		VIEW_ANGLE,
		ASPECT,
		NEAR,
		FAR
);

const controls = new THREE.TrackballControls(camera);
camera.position.set(-194536.51784707283, 184329.38148911536, 168343.49533261952);
controls.target.set(56825.99513772479, 144964.66253099282, 146510.9148580572);

// Add stats
// let stats = new Stats();
// 	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats.dom );

function recurse(neuron: PropogateNeuron) {
    let goodIdx = -1;
    while (true) {
        goodIdx = Math.floor(Math.random() * neuron.neuron.nodeCount);
        if (neuron.neuron.hopMap.map[goodIdx] > 200) {
            break;
        }
    }

    neuron.generatePropogation(goodIdx).then(() => {
        recurse(neuron);
    });
}

Neuron.generateFromUrl("https://alexnortn.github.io/gl_test/cells/10010.ctm", 21628).then((neuron) => {
    scene.add(neuron.mesh);

    let cneuron : NeuronState;

    cneuron = new GrowNeuron(neuron);

    (cneuron as GrowNeuron).promise.then(() => {
        cneuron = cneuron.to(PropogateNeuron);
        let i = 0;
        let interval = setInterval(() => {
            recurse(cneuron as PropogateNeuron);
            i++;

            if (i === 40) {
                clearInterval(interval);
            }
        }, 200);
    });




    function loop() {
        // stats.begin();
        controls.update();
        cneuron.update();
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
        // stats.end();
    }
    requestAnimationFrame(loop);
});
