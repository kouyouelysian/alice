Devices.Routing = {}

Devices.Routing.TriState = class TriState extends Devices.Device { // general constructor for 3-pin gates. not to be used directly in circuits.
	
	static packageData = {
		"pins": [
			{"name":"c", "mode":"in", "side":3, "offset": 0}
		],
		"body": {
			"origin": {
				x:1,
				y:1
			},
			"dimensions": {
				"width": 2,
				"height": 2
			},
			"symbol": [
				{
					"segmentData": [ 
						{"point":[0,0]},
						{"point":[2,1]},
						{"point":[0,2]} 
					],
					"closed": true
				},
				{
					"segmentData": [
						{"point":[1,1.5]},
						{"point":[1,2]}
					]
				}
			],
			"label": null
		}	
	}

	constructor(circuit, point) {

		super(circuit, point, Devices.Routing.TriState.packageData);

		this.options = {
			buffers: {"type":"qty", "value":1},
			style: {"type":"choice", "choices":["full","compact"], "value":"full"}
		};

	}

	reload()
	{
		var step = this.options.style.value=="full"? 2 : 1;
		this.deleteBody();
		for (var x = 0; x < this.options.buffers.value; x++)
		{
			var pdata = Devices.Routing.TriState.packageData;
			if (x != this.options.buffers.value-1)
				pdata.pins = [];
			pdata.pins.push({"name":`i${x}`, "mode":"in", "side":2, "offset":0});
			pdata.pins.push({"name":`o${x}`, "mode":"out", "side":0, "offset":0});
			var point = new Point(this.position.x, this.position.y + step*window.sim.appearance.size.grid);
			
			this.fillBodyCustom(this.body, pdata, point, window.sim.appearance.size.grid, this.rotation)
		}
	}

	createGate()
	{

	}

	update() {
		if (!this.read("c"))
			return this.mode("o", "hi-z");
		this.mode("o", "out");
		return this.write("o", this.read("i"));
	}	

}
