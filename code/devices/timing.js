 Devices.Clock = class Clock extends Devices.Device {
	constructor(parentGroup, point) {

		super(parentGroup, point);
		this.name = "Clock source";

		this.write('o', false);
		this.counter = 0;
		this.ticks = 200;

	}

	update() {
		this.counter += 1;
		if (this.counter == this.ticks)
		{
			this.counter = 0;
			this.toggle("o");
		}
	}

}