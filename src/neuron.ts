const propVecSize = 4; // vec4 for each attribute to allow 4 props per attribute
const MAX_PROP = 40;

const propAttributesCount = Math.ceil(MAX_PROP / propVecSize);

interface xyz {
    x: number;
    y: number;
    z: number;
}

interface contact {
    centroid: xyz;
    area: xyz;
    post: xyz;
    pre: xyz;
}

interface contacts {
    [index:string]: contact[];
}

class Neuron {
    mesh: THREE.Mesh;
    id: string;
    conns: contacts;
    geometry: THREE.BufferGeometry;
    adjacencyMap: AdjacencyMap;
    hopMap: HopMapData;
    nodeCount: number;

    constructor(id: string, geometry: THREE.BufferGeometry, root: number, conns: contacts) {
        this.geometry = geometry;
        this.adjacencyMap = createAdjacencyMap(geometry.index.array as Uint32Array);
        this.nodeCount = geometry.getAttribute('position').count;
        this.hopMap = bft(root, this.adjacencyMap, this.nodeCount);
        geometry.addAttribute('a_hops', new THREE.BufferAttribute(this.hopMap.map, 1));
        this.id = id;
        this.conns = conns;

        this.mesh = new THREE.Mesh(geometry);
    }

    static generateFromId(id: string, root: number): Promise<Neuron> {
        let connsPromise: Promise<contacts> = fetch(`../data/conns-${id}.json`) // Check if this data exists...
            .then(function(response) {
                return response.json();
            })
            .then(function(data: Object) {
                return data as contacts;
            }).catch(() => {
                console.log('meow');
            });

        let geometryPromise: Promise<THREE.BufferGeometry> = new Promise((f, r) => {
            const url = `http://museum.eyewire.org/1.0/mesh/${id}`;

            const loader = new THREE.CTMLoader();
            loader.load(url, (geometry: THREE.BufferGeometry) => {
                f(geometry);
            }, {
                useWorker: true,
                worker: new Worker("./third_party/ctm/CTMWorker.js")
            });
        }); 

        return Promise.all([connsPromise, geometryPromise]).then(([conns, geo]) => {
            return new Neuron(id, geo, root, conns);
        })
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
