Devices.Routing = {}

Devices.Routing.TriState = class extends Devices.Device { // general constructor for 3-pin gates. not to be used directly in circuits.
	
	constructor(circuit, point) {

		const packageData = {
			"pins": [
				{"name":"i", "mode":"in", "side":2, "offset":0,},
				{"name":"o", "mode":"out", "side":0, "offset": 0},
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
		super(circuit, point, packageData);
	}

	update() {
		if (!this.read("c"))
			return this.mode("o", "hi-z");
		this.mode("o", "out");
		return this.write("o", this.read("i"));
	}	

}
