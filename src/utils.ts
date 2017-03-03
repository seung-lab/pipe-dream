interface xyz {
    x: number;
    y: number;
    z: number;
}

// Find closest vertex to specified point (vec3)
// verts -> bufffer: [size 3] · loc -> vec3
function find_root(verts:Float32Array, loc:xyz) {
    let v_i;
    let min_dist2 = Infinity;
    let x2,y2,z2;

    let {x, y, z} = loc;

    for (let i = verts.length-1; i >= 0; i-=3) {
        x2 = verts[i-0];
        y2 = verts[i-1];
        z2 = verts[i-2];

        let dist2 = 
            Math.pow((loc.x - x2), 2) + 
            Math.pow((loc.y - y2), 2) + 
            Math.pow((loc.z - z2), 2);

        if (dist2 < min_dist2) {
            v_i = i;
            min_dist2 = dist2;
        }
    }

    return (v_i + 1) / 3; // Account for 0 offset
}