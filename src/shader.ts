function parseShader(id: string): string {
    let shaderString = document.getElementById(id)!.textContent;

    console.log(shaderString);

    return '';
}

const Shaders = {
    grow: {
        vertex: '',
        fragment: ''
    },
    propogate: {
        vertex: '',
        fragment: ''
    }
}

function replaceVars(str: string, replacements: Map<string, string>) {
    let res = str;

    for (let [a, b] of replacements.entries()) {
        let regexStr = "\\/\\*\\${" + a + "}\\*\\/[\\s\\S]*?\\/*\\*\\/";
        console.log(regexStr);
        res = res.replace(new RegExp(regexStr), b);
    }

    return res;
}
let test = `uniform float u_frontier[/*\${zcount}*/1/**/]; blah
blah */`;
console.log(replaceVars(test, new Map([["zcount", "40"]])));

function loadShaders() {
    return Promise.all(Object.keys(Shaders).map((shaderName) => {
        let shader = Shaders[shaderName];

        return Promise.all(['vertex', 'fragment'].map((shaderType) => {
            const fileName = `./shaders/${shaderName}_${shaderType}_shader.glslx`;

            return fetch(fileName).then((res) => {
                return res.text();
            }).then((str) => {
                const lines = str.split('\n');

                const goodLines = lines.filter((l) => !l.includes('//DELETE'));

                const processedLines = goodLines.map((l) => {
                    if (l.includes('//UNCOMMENT')) {
                        l = l.replace('//UNCOMMENT', '');
                        l = l.replace('// ', '');
                    }

                    return l;
                });
                
                shader[shaderType] = processedLines.join('\n');
            });
        }));
    }));
}
