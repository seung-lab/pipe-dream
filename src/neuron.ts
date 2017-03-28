const propAttributesCount = Math.ceil(Config.MAX_PROP / Config.PROP_VEC_SIZE);

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
    vertex: number;
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
        // Check conns-list for id
        const url = connsURL + `conns-${id}.json`;
        let connsPromise: Promise<contacts> = fetch(url) // Check if this data exists...
            .then(function(response) {
                return response.json();
            })
            .then(function(data: Object) {
                return data as contacts;
                // need to flatten contacts
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

