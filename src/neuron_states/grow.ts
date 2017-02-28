class GrowNeuron extends NeuronState {
    static SPEED = 2;
    promise: Promise<{}>;

    private frontier_uniform: THREE.IUniform;
    private done: () => void;

    constructor(neuron: Neuron) {
        super(neuron);
        let mat = createCellGrowMaterial();
        neuron.mesh.material = mat;

        this.frontier_uniform = mat.uniforms.u_frontier;

        this.promise = new Promise((f, r) => {
            this.done = () => {
                f();
            };
        });
    }

    update() {
        if (!this.active) {
        }

        if (this.frontier_uniform.value < this.neuron.hopMap.max) {
            this.frontier_uniform.value += GrowNeuron.SPEED;
        } else {
            this.done();
        }
    }
}

interface CellGrowShaderMaterial extends THREE.ShaderMaterial {
    uniforms: {
        u_frontier: THREE.IUniform;
    };
}

function createCellGrowMaterial(): CellGrowShaderMaterial {
    const uniforms = {
		u_frontier: {
			type: '1f', // a float
			value: 0.0
		},
		u_camera_pos: {
			type: 'v3', // a float
			value:new THREE.Vector3(-1, -1, -1)
		}
	}

    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: Shaders.grow.vertex,
        fragmentShader: Shaders.grow.fragment,
    }) as CellGrowShaderMaterial;
}
