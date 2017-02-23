class PropogateNeuron extends NeuronState {
    private propAttribArray: THREE.BufferAttribute[];
    private propogations: Propogation[];
    private propCount = 0; // used for the circular propAttribArray
    private readonly frontiers = new Float32Array(MAX_PROP);

    private material: CellPropShaderMaterial;


    constructor(neuron: Neuron) {
        super(neuron);

        this.propAttribArray = [];
        for (let i = 0; i < propAttributesCount; i++) {
            const propAttrib = new THREE.BufferAttribute(new Float32Array(this.neuron.nodeCount*propVecSize), propVecSize);
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
        const attribNumber = Math.floor((this.propCount % MAX_PROP) / propVecSize);
        const propAttrib = this.propAttribArray[attribNumber];
        const start = performance.now();
        bbft(index, this.neuron.adjacencyMap, this.neuron.hopMap.map, this.neuron.nodeCount, propAttrib.array as Float32Array, this.propCount % propVecSize);
        propAttrib.needsUpdate = true;

        const propIndex = this.propCount % MAX_PROP;
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
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    }) as CellPropShaderMaterial;
}

let bpAttrString = "";

let backpropString = "";

const zcount = 40;

for (let i = 0; i < 10; i++) {
    bpAttrString += `\tattribute vec4 a_backprop${i};\n`;
    for (let j = 0; j < 4; j++) {
        backpropString += `\t\t\toffset = min(offset, abs(u_frontier[${i * 4 + j}] - a_hops) + 100000.0 * (1.0 - a_backprop${i}[${j}]));\n`;
    }
}

let vertexShader = `
    // switch on high precision floats
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    #endif
    
    uniform float u_frontier[${zcount}];
    // uniform float u_max_hop;
    uniform float u_feather;
    
    attribute float a_hops;

${bpAttrString}

    uniform vec3 u_camera_pos;
    
    varying vec4 v_Color;
    varying vec3 v_From_Cam;
    varying vec3 v_Normal;

    // Remap value
    float remap(float value, float inMin, float inMax, float outMin, float outMax) {
        return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
    }

    void main() {
        float amplitude = 0.0; // Create a swelling effect during signal prop

        v_Normal = normal;
        v_From_Cam = u_camera_pos - position;

        float offset = 100000.0;

${backpropString}

        float r = 0.0;

        if (offset < u_feather) {
            r = remap(offset, 0.0, u_feather, 1.0, 0.0);
            // amplitude = r * 100.0; // Experimentally Determined
            // r = 1.0;
        }

        // This for discard
        // if (a_threshold >= u_frontier) {
        // 	r = 1.0;	
        // }
        
        float b = 1.0 - r;

        v_Color = vec4(r,0.0,b,1.0);

        // Multiply our a_displacement by the
        // amplitude. The amp will get animated
        // so we'll have animated a_displacement
        vec3 newPosition = position + 
                            normal * 
                            vec3(amplitude);

        gl_Position = projectionMatrix *
                        modelViewMatrix *
                        vec4(newPosition,1.0);
    }`;

let fragmentShader = `
    #ifdef GL_ES
    precision highp float;
    #endif
    
    // Same name and type as VS
    varying vec4 v_Color;
    varying vec3 v_From_Cam;
    varying vec3 v_Normal;

    void main() {

        // This is for discard
        // if (v_Color.r == 0.0) {
        // 	discard;
        // }


        vec3 from_Cam = normalize(v_From_Cam);
        vec3 light1 = vec3(1,0,0);
        vec3 light2 = vec3(0,0.5,0);
        
        float cam_mult = 1.0;
        float light1_mult = 0.75;
        float light2_mult = 1.0;
        
        light1 = normalize(light1);
        light2 = normalize(light2);

        float dProdCam = max(0.0, dot(v_Normal, from_Cam));
                // dProdCam = 1.0 - dProdCam;
                // dProdCam = clamp(dProdCam, 0.0, 1.0);
        
        // Flipping the dot-product gives an edge glow effect
        // Naturally, this will result in an emerging (dark) view
        float dProd1 = max(0.0, dot(v_Normal, light1));
                dProd1 = 1.0 - dProd1;
                dProd1 = clamp(dProd1, 0.0, 1.0);

        float dProd2 = max(0.0, dot(v_Normal, light2));
                // dProd2 = 1.0 - dProd2;
                // dProd2 = clamp(dProd2, 0.0, 1.0);

        // float fragColorMix = (dProd1 + dProdCam) / 2.0;
        float fragColorMix = clamp( ( (dProdCam * cam_mult + dProd1 * light1_mult + dProd2 * light2_mult) / 2.0 ), 0.0, 1.0 );
                
        // vec4 fragColor = vec4(dProd2, dProd2, dProd2, 1.0); 
        vec4 fragColor = vec4(fragColorMix, fragColorMix, fragColorMix, 1); 
        
        // Feed into our frag colour
        gl_FragColor = (v_Color * fragColor);
        
    }`;
