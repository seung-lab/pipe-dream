const propAttributesCount = Math.ceil(Config.MAX_PROP / Config.PROP_VEC_SIZE);

interface contact {
    vertex: number;
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
        this.changeRoot(root);
        this.id = id;
        this.conns = conns;

        this.mesh = new THREE.Mesh(geometry);
    }

    changeRoot(root: number) {
        this.hopMap = bft(root, this.adjacencyMap, this.nodeCount);
        this.geometry.removeAttribute('a_hops');
        this.geometry.addAttribute('a_hops', new THREE.BufferAttribute(this.hopMap.map, 1));
    }

    static generateFromId(id: string, root: number): Promise<Neuron> {
        function generateConns(geo:THREE.BufferGeometry) {
            return fetch(`../data/conns-${id}.json`) // Check if this data exists...
            .then(function(response) {
                return response.json();
            })
            .then(function(data: Object) {
                // transform data -> contacts; map => vertex:id
                // this needs to be significantly faster! (~3.5m -> 100ms)
                // two options: either downsample 
                let cellT = performance.now();
                let count = 0;                
                for (let cell in data) {
                    let now = performance.now();
                    data[cell].forEach((contact) => { 
                        count++;
                        contact['vertex'] = find_root(geo.getAttribute('position').array as Float32Array, contact.post); 
                        console.log("found contact ", count, contact[id], "in", (performance.now() - now));
                    });
                }
                console.log('cell contacts complete in ', (performance.now() - cellT));

                return data as contacts;
            }).catch((reason) => {
                console.log(reason);
            });
        }

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

        return  geometryPromise.then((geo) => {
            return generateConns(geo).then((conns) => {
                return new Neuron(id, geo, root, conns!);
            });
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
