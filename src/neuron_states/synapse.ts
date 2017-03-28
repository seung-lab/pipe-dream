class SynapseNeuron extends NeuronState {

    constructor(neuron: Neuron) {
        super(neuron);
        let mat = createCellSynapseMaterial();
        neuron.mesh.material = mat;
        createSynapses(neuron.conns);
        createContacts(neuron.conns, neuron.geometry.attributes.position.array);
    }
}

interface CellSynapseShaderMaterial extends THREE.ShaderMaterial {
    
}

function createCellSynapseMaterial(): CellSynapseShaderMaterial {
    const uniforms = {
		u_camera_pos: {
			type: 'v3', // a float
			value:new THREE.Vector3(-1, -1, -1)
		}
	}

    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: Shaders.synapse.vertex,
        fragmentShader: Shaders.synapse.fragment,
    }) as CellSynapseShaderMaterial;
}

// Create Synapses at Conns -> Position
function createSynapses(conns: any) { // being a bitch
    let loader = new THREE.TextureLoader();
    let particleCount = Object.keys(conns).length,
        particles = new THREE.Geometry(),
        pMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1024,
            map: loader.load("../../data/particle4.jpg"),
            blending: THREE.AdditiveBlending,
            transparent: true
        });

    // conns.forEach( contact => {
    for (let cell in conns)  {
        conns[cell].forEach( contact => {
            particles.vertices.push(
                new THREE.Vector3(contact.post.x, contact.post.y, contact.post.z)); // Create new particle for each contact point
        });
    }

    let particleSystem = new THREE.Points(particles, pMaterial);

    scene.add(particleSystem);
}

// Create Synapses at Vertex
function createContacts(conns: any, verts: Float32Array) { // being a bitch
    let loader = new THREE.TextureLoader();
    let particleCount = Object.keys(conns).length,
        particles = new THREE.Geometry(),
        pMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1024,
            map: loader.load("../../data/particle2.jpg"),
            blending: THREE.AdditiveBlending,
            transparent: true
        });

    // conns.forEach( contact => {
    for (let cell in conns)  {
        conns[cell].forEach( contact => {
            let loc = new THREE.Vector3(); // Vertex look up
                loc.x =  verts[contact.vertex * 3 + 0];
                loc.y =  verts[contact.vertex * 3 + 1]; 
                loc.z =  verts[contact.vertex * 3 + 2]; 

            particles.vertices.push(loc); // Create new particle for each contact point
        });
    }

    let particleSystem = new THREE.Points(particles, pMaterial);

    scene.add(particleSystem);
}
