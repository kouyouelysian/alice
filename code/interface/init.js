const GLOBAL_sizing = 25;

function debugCircle(point, radius=10, color=Color.random())
{
	var c = new Path.Circle(point, radius);
	c.strokeColor = color;
}

function initField(x, y, id, name) {

	var parent = document.getElementById(id);
	if (!parent)
		return;

	var clickbox=parent.getElementsByTagName("div")[0];
	clickbox.style.width = String((x+1)*GLOBAL_sizing)+"px";
	clickbox.style.height = String((y+1)*GLOBAL_sizing)+"px";
	
	var canvas=parent.getElementsByTagName("canvas")[0];
	canvas.setAttribute("width", String(x*GLOBAL_sizing));
	canvas.setAttribute("height", String(y*GLOBAL_sizing));

	paper.setup(canvas);
}

function patchPaperPoint() {

	Point.prototype.findEditable = function(options={/* type, all, exclude */}) {

		var hitTestOptions = { fill: true, stroke: true, segments: true, tolerance: settings.hitTolerance };

		hitTestOptions.match = function(hit) {
			if (!hit.item)
				return false;
			if (!hit.item.data.type)
				return false;
			if (options.type && hit.item.data.type != options.type)
				return false;
			if (options.net && hit.item.net != options.net)
				return false;
			if (options.exclude && hit.item == options.exclude)
				return false;				
			return true;
		};

		var test = project.layers.editables.hitTestAll(this, hitTestOptions);
		if (test == null || test.length == 0)
			return null;

		var items = [];
		for (const hit of test)
			items.push(hit.item);
		
		if (options.all)
			return items;
		return items[0];
	}

	Point.prototype.quantize = function(step) {
		this.x = Math.round(this.x / step) * step;
		this.y = Math.round(this.y / step) * step;
	}


}


function init() {

	paper.install(window);
	patchPaperPoint();

	
	initField(100, 75, "simViewport");
	initField(100, 75, "icDesigner");

	paper.projects[0].activate();

}




init();