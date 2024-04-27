
var Explorer = {

	target: "explorer",
	iconDir: "../gfx/icon/ico16/",

	getElementChildUl: function(elem)
	{
		for (let x of elem.childNodes.values())
			if (x instanceof HTMLUListElement) {return x;}
		return null;
	},

	directoryToggle: function(elem)
	{
		event.stopPropagation();
		var parent = elem.parentNode;
		ul = Explorer.getElementChildUl(parent);
		if (ul == null)
			return;

		if (ul.style.display == "none")
		{
			parent.classList.add("diropen");
			ul.removeAttribute("style");
		}
		else
		{
			parent.classList.remove("diropen");
			ul.style.display = "none"; 
		}
		
	},

	tabsWidthUpdate: function()
	{
		var sb = document.getElementById(Explorer.target);
		sb.style.width = "auto";
		var w = sb.offsetWidth + 16;
		sb.style.width = String(w)+"px";
		document.getElementById("window").style.width = "calc(100% - "+String(w+1)+"px)";
		document.getElementById("window").style.left = String(w)+"px";
	},

	fileLoad: function(path)
	{
		event.stopPropagation();
		bmco_getParamWrite("file", path);
		const dataRoot = "./files/";
		bmco_xml_awaitXmlFromFile( (dataRoot+path).replace("//", "/") ).then(function(xmldoc){
			GLOBAL_workingDoc = xmldoc;
			const template = xmldoc.childNodes[0].tagName;
			templateRender(xmldoc, template);
		});
	},

	buildListLine: function(xmlTag)
	{
		var li = document.createElement('li');

		var id = xmlTag.getAttribute("id");
			if (id)
				li.id = id;

		if (xmlTag.nodeName == "item")
		{
			li.classList.add("item");
			

			var a = document.createElement("a");
			var link = xmlTag.getAttribute("link");
			if (link)
				a.setAttribute("href", xmlTag.getAttribute("link"));
	
			if (xmlTag.getAttribute("blank") == "blank")
				a.setAttribute("target", "_blank");
			a.innerHTML = xmlTag.getAttribute("name");
			li.appendChild(a);

			var customIcon = xmlTag.getAttribute("icon");
			if (customIcon)
				li.setAttribute("style", "--icon: url('"+Explorer.iconDir+customIcon+"');");

			var onClick = xmlTag.getAttribute("onclick");
			if (onClick)
				li.setAttribute("onclick", onClick);
			
		}
		else
		{
			li.classList.add("directory");

			var control = document.createElement("div");
			control.classList.add("dirControl");
			control.setAttribute("onclick", "Explorer.directoryToggle(this)");

			li.appendChild(control);

			xmlTag.getAttribute("link") == null? type = "span" : type = "a";
			var label = document.createElement(type);
			label.innerHTML = xmlTag.getAttribute("name");
			if (type == "a")
			{
				li.classList.add("notebook");
				label.setAttribute("href", xmlTag.getAttribute("link"));
			}
			
			
			if (xmlTag.getAttribute("noclose") == "noclose")
			{
				li.classList.add("diropen");
				li.setAttribute("noclose", "noclose");	
			}
			li.appendChild(label);

			var vsel = document.createElement("div");
			vsel.classList.add("selectVert");
			li.appendChild(vsel);

		}

		var hsel = document.createElement("div");
		hsel.classList.add("selectHor");
		li.appendChild(hsel);

		return li;
	},

	buildDirectory: function(xmlTag)
	{
		var li = Explorer.buildListLine(xmlTag);
		var ul = document.createElement("ul");
		for (var x = 0; x < xmlTag.childNodes.length; x++)
		{
			var child = xmlTag.childNodes[x];
			var newLi = undefined
			if (child.nodeName == "directory")
			{
				newLi = Explorer.buildDirectory(child);
				if (x+1==xmlTag.childNodes.length)
				{
					var selectHide = document.createElement("div");
					selectHide.classList.add("selectHide");
					newLi.appendChild(selectHide);
				}
			}
			else if (child.nodeName == "item")
				newLi = Explorer.buildListLine(child);

			
			ul.appendChild(newLi);
		}

		li.appendChild(ul);
		return li;
	},

	fillDevices: function(xmldoc) {
		// the Devices var should be filled by importing the Device class and then stuff from code/devices
		var allDevicesXmlNode  = bmco_xml_nodeGetByAttributeValue(xmldoc, "directory", "name", "Devices");
		for (const categoryName in Devices) {
			if (categoryName == "defaultPackageData" || categoryName == "Device")
				continue; // skip the first two entries. sections follow

			var categoryXmlNode = xmldoc.createElement("directory");
			categoryXmlNode.setAttribute("name", categoryName);
			for (const deviceName in Devices[categoryName]) {
				var deviceXmlNode = xmldoc.createElement("item");
				deviceXmlNode.setAttribute("name", deviceName);
				deviceXmlNode.setAttribute("onclick", `window.sim.setTool('${categoryName}.${deviceName}')`);
				categoryXmlNode.appendChild(deviceXmlNode);
			}

			allDevicesXmlNode.appendChild(categoryXmlNode);
		}
	},

	createStructure: function(xmlPath = "./data/explorer.xml")
	{
		bmco_xml_awaitXmlFromFile(xmlPath).then(function(xmldoc){

			Explorer.fillDevices(xmldoc);// custom addition

			var target = document.getElementById(Explorer.target);
			var ul = document.createElement("ul");
			ul.id = "sitemap"
			ul.appendChild(Explorer.buildDirectory(bmco_xml_nodeGetFirstOfTag(xmldoc, "sitemap")));
			target.appendChild(ul);

			
			

			Explorer.closeFolders();
		})
	},

	closeFolders: function()
	{
		var lis = document.getElementById(Explorer.target).getElementsByTagName("li");
		for (var j = 0; j < lis.length; j++)
		{
			if (lis[j].getAttribute("noclose") == "noclose")
				continue;
			var ul = Explorer.getElementChildUl(lis[j]);
			if (ul != null)
				ul.style.display = "none";    
		}
	},

	onload: function()
	{
		var getFname = bmco_getParamRead("file");
		if ( (getFname != null) )
			Explorer.fileLoad(getFname);
	},

	toggleFolded: function()
	{
		var nav = document.getElementsByTagName("nav");
		if (!nav)
			return;
		nav = nav[0];
		if (nav.classList.contains("folded"))
			return nav.classList.remove("folded");
		return nav.classList.add("folded");

	}

}

Explorer.createStructure();
window.addEventListener("load", (event) => {
	Explorer.onload();
});