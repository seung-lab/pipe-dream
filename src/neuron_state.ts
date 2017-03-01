// interface NeuronStateContainer {
//     state: NeuronState;
// }

abstract class NeuronState {
    static neurons: NeuronState[] = [];

    neuron: Neuron;
    // private stateContainer: NeuronStateContainer

    protected active = true;

    constructor(neuron: Neuron) {
        this.neuron = neuron;
        NeuronState.neurons.push(this);
    }

    to<T extends NeuronState>(c: {new(neuron: Neuron): T; }): T { // TODO, is there a way to use typeof T here?
        this._cleanup();
        return new c(this.neuron);
    }

    private _cleanup() {
        this.active = false;
        NeuronState.neurons.splice(NeuronState.neurons.indexOf(this), 1);
        this.cleanup();
    }

    update() {}

    cleanup() {}
}
