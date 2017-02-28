class StaticNeuron extends NeuronState {

    constructor(neuron: Neuron) {
        super(neuron);
        let mat = createCellStaticMaterial();
        neuron.mesh.material = mat;
    }
}

interface CellStaticShaderMaterial extends THREE.ShaderMaterial {
    
}

function createCellStaticMaterial(): CellStaticShaderMaterial {
    const uniforms = {
		u_camera_pos: {
			type: 'v3', // a float
			value:new THREE.Vector3(-1, -1, -1)
		}
	}

    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: Shaders.static.vertex,
        fragmentShader: Shaders.static.fragment,
    }) as CellStaticShaderMaterial;
}
