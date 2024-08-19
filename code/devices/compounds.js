Devices.Compounds = {};

Devices.Compounds.DLatch = class DLatch extends Devices.Device {

	static packageData = {
		pins: [
			{name:"data", mode:"in", side:2, offset:0, label:"D"},
			{name:"clock", mode:"in", side:2, offset:1, label:"CK"},
			{name:"opos", mode:"out", side:0, offset:0, label:"Q"},
			{name:"oneg", mode:"out", side:0, offset:1, label:"!Q"},
		],
		body: {
			dimensions: {
				width: 4,
				height: 3
			}, 
			origin: {
				x: 2,
				y: 1
			}
		}
	}

	constructor(circuit, point) {
		super(circuit, point);
		this.ckstate = undefined;
	}

	update() {
		var ck = this.read("clock");
		if (ck == this.ckstate)
			return; // skip frames with no clock shift
		this.ckstate = ck;
		if (!ck)
			return; // skip negative transitions
		this.write("opos", this.read("data"));
		this.write("oneg", !this.read("data"));
	}

}

Devices.Compounds.Memory = class Memory extends Devices.Device {

	constructor(circuit, point) {

		const opts = {
			// displays size, but actually stores data bus width
			memwidth: {type:"choice", choices:[], value:"8", description:"Memory size, bytes"}
		};

		for (var x = 4; x <= 16; x++)
		{
			var n = 2**x;
			var prefix = "bytes";
			if (n >= 1024)
			{
				n /= 1024;
				prefix = "Kbytes";
			}
			if (n >= 1024)
			{
				n /= 1024;
				prefix = "Mbytes";
			}
			opts.memwidth.choices.push([x, `${n} ${prefix}`]);
		}

		super(circuit, point, opts);

		this.memwidth = 8;
		this.memsize = 0;
		this.memory = undefined;
		this.memmode = "hi-z";
		this.lastmode = undefined
		this.lastval = undefined;
		this.meminit();
	}

	get packageData() {
		
		var bits = this.memwidth;
		if (!bits)
			bits = 8;
		var pheight = Math.max(9, bits+4);

		var pd = {
			pins: [
				{name:"read", mode:"in", side:2, offset:Math.max(5,pheight)-3, label:"read"},
				{name:"write", mode:"in", side:2, offset:Math.max(5,pheight)-2, label:"write"}
			],
			body: {
				origin: {
					x: 2,
					y: 2
				},
				dimensions: {
					width: 5,
					height: pheight
				}
			}
		};

		for (var x = 0; x < bits; x++)
			pd.pins.push(this.makeAddressPin(x));

		for (var x = 0; x < 8; x++)
			pd.pins.push(this.makeDataPin(x));

		return pd;

	}

	makeAddressPin(n)
	{
		return {name:`a${n}`, mode:"in", side:2, offset:n, label:`A${n}`};
	}

	makeDataPin(n)
	{
		return {name:`d${n}`, mode:"hi-z", side:0, offset:n,  label:`D${n}` };
	}

	meminit() {
		this.memsize = 2 ** this.memwidth;
		this.memory = new Uint8Array(this.memsize); 
		this.memory[0] = 111;
	}

	reload() {
		this.memwidth = parseInt(this.options.memwidth.value);
		this.meminit();
		this.recreatePackage();
	}

	update() {

		var read = this.read(`read`);
		var write = this.read(`write`);
		
		if (read && write)
			return; // invalid state - do nothing

		var newmode = "in";
		if (!read && !write)
			newmode = "hi-z";
		else if (read)
			newmode = "out";
	
		if (newmode != this.memmode)
		{	// if memmode changed - update data pin directions
			for (var x = 0; x < 8; x++)
				this.mode(`d${x}`, newmode);
			this.memmode = newmode;
			this.lastval = undefined;
		}

		if (newmode == "hi-z")
			return;

		var address = 0;
		for (var n = 0; n < this.memwidth; n++)
		{
			if (this.read(`a${n}`))
				address += Devices.BinaryTable[n];
		}
		

		if (this.memmode == "out")
		{	
			var val = this.memory[address];
			if (val == this.lastval)
				return;
			this.lastval = val;
			for (var n = 0; n < 8; n++)
				this.write(`d${n}`, (val & Devices.BinaryTable[n]) != 0);
		}
		else
		{
			this.memory[address] = 0;
			for (var n = 0; n < 8; n++)
			{
				if (this.read(`d${n}`))
					this.memory[address] += Devices.BinaryTable[n];
				
			}
		}
	}

	reset() {
		super.reset();
		this.lastval = undefined;
		this.memmode = "hi-z";
		for (var x = 0; x < 8; x++)
				this.mode(`d${x}`, "hi-z");

	}

}

