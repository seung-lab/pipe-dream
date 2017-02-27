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
        vertexShader: growVertexShader,
        fragmentShader: growFragmentShader
    }) as CellGrowShaderMaterial;
}

let growVertexShader = `
    // switch on high precision floats
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    #endif
    
    uniform float u_frontier;
    attribute float a_hops;

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

        float r = 0.0;

        if (u_frontier > a_hops) {
            r = 1.0;
            // amplitude = r * 100.0; // Experimentally Determined
            // r = 1.0;
        }

        if (a_hops < 0.0) {
            r = 0.0;
        }

        
        float b = 1.0 - r;

        v_Color = vec4(b,0.0,r,1.0);

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

let growFragmentShader = `
    #ifdef GL_ES
    precision highp float;
    #endif
    
    // Same name and type as VS
    varying vec4 v_Color;
    varying vec3 v_From_Cam;
    varying vec3 v_Normal;

    void main() {
        // This is for discard
        if (v_Color.b == 0.0) {
        	discard;
        }

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
