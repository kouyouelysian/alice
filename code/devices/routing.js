Devices.Routing = {}

Devices.Routing.TriState = class TriState extends Devices.Device { // general constructor for 3-pin gates. not to be used directly in circuits.
	
	static packageData = {
		"pins": [
			{"name":"control", "mode":"in", "side":3, "offset": 0}
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
						{"point":[1,1.5]},
						{"point":[1,2]}
					]
				},
				{
					"segmentData": [ 
						{"point":[0,0]},
						{"point":[2,1]},
						{"point":[0,2]} 
					],
					"closed": true
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

		this.transparent = undefined;

	}

	get packageData() {

		var step = 2;
		if (this.options.style)
			step = this.options.style.value=="full"? 2 : 1;

		var pd = bmco.clone(Devices.Routing.TriState.packageData);
		var qty = 1;
		if (this.options.buffers)
			qty = this.options.buffers.value;
		
		pd.pins.push.apply(pd.pins, this.makePinPairData(0,step));

		var oseg = bmco.clone(pd.body.symbol[1]);
		if (step == 1) // change the drawing if we're being compact
		{
			
			oseg.segmentData[0].point[0] += 1;
			oseg.segmentData[0].point[1] += 0.5;
			oseg.segmentData.push({"point":[0,1]});
			oseg.closed = false;
		}
		
		for (var x = 1; x < qty; x++)
		{
			var seg = bmco.clone(oseg);
			for (var p of seg.segmentData)
				p.point[1] += x*step;
			pd.body.symbol.push(seg);
			if (step == 2)
				pd.body.symbol.push({
					"segmentData": [
						{"point":[1,-0.5+x*step]},
						{"point":[1,0.5+x*step]}
					]
				});
			pd.pins.push.apply(pd.pins, this.makePinPairData(x, step));
		}

		pd.body.symbol[0].segmentData[0].point[1] += step*(qty-1);
		pd.body.symbol[0].segmentData[1].point[1] += step*(qty-1);
		pd.body.dimensions.height += step*(qty-1);

		return pd;
	}

	makePinPairData(n=0, step=2) {
		return [
			{"name":`in${n}`, "mode":"in", "side":2, "offset": n*step},
			{"name":`out${n}`, "mode":"hi-z", "side":0, "offset": n*step}
			]
	}

	reload()
	{
		var o = this.orientation.valueOf();
		var step = this.options.style.value=="full"? 2 : 1;
		this.reorientTo(0)
		this.recreatePackage();
		this.reorientTo(o);
	}

	update() {

		var tnew = this.read("control");
		if (this.transparent != tnew)
		{ // only update pin modes if the control pin changed to conserve time
			var mode = tnew? 'out' : 'hi-z';
			for (var x = 0; x < this.options.buffers.value; x++)
				this.mode(`out${x}`, mode);
		}
		
		this.transparent = tnew;
		if (tnew)
		{	
		for (var x = 0; x < this.options.buffers.value; x++)
			this.write(`out${x}`, this.read(`in${x}`));
		}		
	}	

}
