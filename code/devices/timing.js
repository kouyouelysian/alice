Devices.Timing = {}

Devices.Timing.Clock = class Clock extends Devices.Device {
	constructor(parentGroup, point) {

		super(parentGroup, point);
		this.write('o', false);
		this.counter = 0;
		this.period = 10 * this.getCircuit().ticksPerFrame;

	}

	update() {
		this.counter += 1;
		if (this.counter == this.period)
		{
			this.counter = 0;
			this.toggle("o");
		}
	}

}