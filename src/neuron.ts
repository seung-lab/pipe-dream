const propVecSize = 4; // vec4 for each attribute to allow 4 props per attribute
const MAX_PROP = 40;

const propAttributesCount = Math.ceil(MAX_PROP / propVecSize);


class Neuron {
    mesh: THREE.Mesh;
    geometry: THREE.BufferGeometry;
    adjacencyMap: AdjacencyMap;
    hopMap: HopMapData;
    nodeCount: number;

    constructor(geometry: THREE.BufferGeometry, root: number) {
        this.geometry = geometry;
        this.adjacencyMap = createAdjacencyMap(geometry.index.array as Uint32Array);
        this.nodeCount = geometry.getAttribute('position').count;
        this.hopMap = bft(root, this.adjacencyMap, this.nodeCount);
        geometry.addAttribute('a_hops', new THREE.BufferAttribute(this.hopMap.map, 1));

        this.mesh = new THREE.Mesh(geometry);
    }

    static generateFromUrl(url: string, root: number): Promise<Neuron> {
        return new Promise((f, r) => {
            const loader = new THREE.CTMLoader();

            loader.load(url, (geometry: THREE.BufferGeometry) => {
                f(new Neuron(geometry, root));
            }, {
                useWorker: true,
                worker: new Worker("./third_party/ctm/CTMWorker.js")
            });
        });
    }
}

class NeuronState {
    neuron: Neuron;
    protected active = true;

    constructor(neuron: Neuron) {
        this.neuron = neuron;
    }

    to<T extends NeuronState>(c: {new(neuron: Neuron): T; }): T { // TODO, is there a way to use typeof T here?
        this.cleanup();
        return new c(this.neuron);
    }

    update() {}

    cleanup() {
        this.active = false;
    }
}
