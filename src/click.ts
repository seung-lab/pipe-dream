// click trigger backprop from selected vertex
{
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

addEventListener('click', ({clientX, clientY, shiftKey}) => {
    if (!shiftKey) {
        return;
    }

    mouse.x = clientX / WIDTH * 2 - 1;
    mouse.y = -clientY / HEIGHT * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length) {
        const {faceIndex, object} = intersects[0];

        for (let state of NeuronState.neurons) {
            let {neuron: {id, mesh}} = state;

            console.log(object, mesh);

            if (object === mesh) {
                console.log('we have the neuron!', id);

                console.log(state);

                if (state instanceof GrowNeuron) {
                    let pNeuron = state.to(PropogateNeuron);
                    let goodIdx = randomFarIndex(pNeuron);
                    pNeuron.generatePropogation(goodIdx);
                } else if (state instanceof PropogateNeuron) {
                    state.to(GrowNeuron);
                }

                const vertex1 = state.neuron.geometry.index.array[faceIndex * 3]; // choose one of the vertices from the selected face
                console.log('new root', vertex1);
                // neuron.changeRoot(vertex1);
                break;
            }
        }
    }
});
}
