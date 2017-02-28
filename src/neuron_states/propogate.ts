class PropogateNeuron extends NeuronState {
    private propAttribArray: THREE.BufferAttribute[];
    private propogations: Propogation[];
    private propCount = 0; // used for the circular propAttribArray
    private readonly frontiers = new Float32Array(Config.MAX_PROP);

    private material: CellPropShaderMaterial;


    constructor(neuron: Neuron) {
        super(neuron);

        this.propAttribArray = [];
        for (let i = 0; i < propAttributesCount; i++) {
            const propAttrib = new THREE.BufferAttribute(new Float32Array(this.neuron.nodeCount*Config.PROP_VEC_SIZE), Config.PROP_VEC_SIZE);
            this.propAttribArray.push(propAttrib);
            neuron.geometry.addAttribute(`a_backprop${i}`, propAttrib);
        }

        this.material = createCellPropMaterial(this.frontiers);

        neuron.mesh.material = this.material;

        this.propogations = [];
    }

    update() {
        if (!this.active) {
            return;
        }

        for (let i = 0; i < this.propogations.length; i++) {
            if (this.propogations[i]) {
                this.propogations[i].move();
                this.material.uniforms.u_frontier.value[i] = this.propogations[i].frontier;
            }
        }
    }

    cleanup() {
        for (let i = 0; i < propAttributesCount; i++) {
            this.neuron.geometry.removeAttribute(`a_backprop${i}`);
        }
    }

    generatePropogation(index: number) {
        const attribNumber = Math.floor((this.propCount % Config.MAX_PROP) / Config.PROP_VEC_SIZE);
        const propAttrib = this.propAttribArray[attribNumber];
        const start = performance.now();
        bbft(index, this.neuron.adjacencyMap, this.neuron.hopMap.map, this.neuron.nodeCount, propAttrib.array as Float32Array, this.propCount % Config.PROP_VEC_SIZE);
        propAttrib.needsUpdate = true;

        const propIndex = this.propCount % Config.MAX_PROP;
        const frontier = this.neuron.hopMap.map[index];
        this.propCount++;

        return new Promise((f, r) => {
            this.propogations[propIndex] = new Propogation(frontier, f);
        });
    }
}

class Propogation {
    frontier: number;
    static speed = 1;
    static feather = 10;
    onEnd : () => void;

    constructor(frontier: number, onEnd : () => void) {
        this.frontier = frontier;
        this.onEnd = onEnd;
    }

    move() {
        if (this.alive()) {
            this.frontier -= Propogation.speed;
            if (!this.alive()) {
                this.frontier = -1000;
                this.onEnd();
            }
        }
    }

    alive() {
        return this.frontier > 0;
    }
}

interface CellPropShaderMaterial extends THREE.ShaderMaterial {
    uniforms: {
        u_frontier: THREE.IUniform;
    };
}

function createCellPropMaterial(frontierArr: Float32Array): CellPropShaderMaterial {
    const uniforms = {
		u_amplitude: {
			type: 'f', // a float
			value: 0.0
		},
		u_frontier: {
			type: 'fv1', // a float
			value: frontierArr
		},
		u_feather: {
			type: 'f', // a float
			value: Propogation.feather
		}, 
		u_camera_pos: {
			type: 'v3', // a float
			value:new THREE.Vector3(-1, -1, -1)
		}
	}

    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: replaceVars(Shaders.propogate.vertex, new Map([
            ["zcount", Config.MAX_PROP.toString()],
            ["bpAttrString", bpAttrString],
            ["backpropString", backpropString]
        ])),
        fragmentShader: Shaders.propogate.fragment
    }) as CellPropShaderMaterial;
}

let bpAttrString = "";

let backpropString = "";

for (let i = 0; i < 10; i++) {
    bpAttrString += `\tattribute vec4 a_backprop${i};\n`;
    for (let j = 0; j < Config.PROP_VEC_SIZE; j++) {
        backpropString += `\t\t\toffset = min(offset, abs(u_frontier[${i * 4 + j}] - a_hops) + 100000.0 * (1.0 - a_backprop${i}[${j}]));\n`;
    }
}
