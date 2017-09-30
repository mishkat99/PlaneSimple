/*Web Application I made to learn Web Dev*/

var scene, camera, renderer, controls, raycaster;

var mouse = new THREE.Vector2(), mouseOver;
mouse.z = 1;

var axisSize = 5;

var localPlanes = [new THREE.Plane(new THREE.Vector3(1,0,0), 5),
						new THREE.Plane(new THREE.Vector3(-1,0,0), 5),
						new THREE.Plane(new THREE.Vector3(0,1,0), 5),
						new THREE.Plane(new THREE.Vector3(0,-1,0), 5),
						new THREE.Plane(new THREE.Vector3(0,0,1), 5),
						new THREE.Plane(new THREE.Vector3(0,0,-1), 5),];


var planes = [],
	intersections = [];
var currentPlane = 0;
var tempNum = 0;

var xcoord = document.querySelector("#x");
var ycoord = document.querySelector("#y");
var zcoord = document.querySelector("#z");
var dValue = document.querySelector("#d");
var addBtn = document.querySelector("#addBtn");
var loiRadio = document.querySelector("#toggleLOI");

var planeDiv;
var currentDiv;
var lineInfo;

var toggleLOI = false;

init();
animate();

function init() {
	initThreeJS();
	drawAxes();
	labelAxis();
	render();
	planes.push(new plane(0,0,0));
}

function initThreeJS() {
	scene = new THREE.Scene;
	scene.background = new THREE.Color(0xdce8e3);

	var screenWidth = window.innerWidth, screenHeight = window.innerHeight, viewAngle = 45, 
		aspectRatio = screenWidth/screenHeight, nearView = 0.01, farView = 2000;

	camera = new THREE.PerspectiveCamera(viewAngle, aspectRatio, nearView, farView);

	scene.add(camera);
	camera.position.set(10, 10, 10);
	camera.lookAt(scene.position);

	if (Detector.webgl) {
		renderer = new THREE.WebGLRenderer( 
			{antialias: true}
			);
	} else {
		renderer = new THREE.CanvasRenderer();
	}
	renderer.setSize(screenWidth, screenHeight);
	renderer.localClippingEnabled = true;

	document.querySelector("#PlaneSimple").appendChild(renderer.domElement);

	controls = new THREE.OrbitControls(camera, renderer.domElement);

	var light = new THREE.PointLight(0xffffff);
	light.position.set(10, 25, 10);
	scene.add(light);

	raycaster = new THREE.Raycaster();

	document.addEventListener('DOMContentLoaded', initInputListeners);
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	renderer.render(scene, camera);
}

function initInputListeners() {
	xcoord.addEventListener("keyup", function(){
		planes[currentPlane].normal.x = (Number(xcoord.value));
		changePoint();
		planes[currentPlane].position.setX(planes[currentPlane].normal.x + planes[currentPlane].mesh.position.x);
		planes[currentPlane].mesh.lookAt(planes[currentPlane].position);
		update();
	});

	ycoord.addEventListener("keyup", function(){
		planes[currentPlane].normal.y = (Number(ycoord.value));
		changePoint();
		planes[currentPlane].position.setY(planes[currentPlane].normal.y + planes[currentPlane].mesh.position.y);
		planes[currentPlane].mesh.lookAt(planes[currentPlane].position);
		update();
	});

	zcoord.addEventListener("keyup", function(){
		planes[currentPlane].normal.z = (Number(zcoord.value));
		planes[currentPlane].position.setZ(planes[currentPlane].normal.z + planes[currentPlane].mesh.position.z);
		planes[currentPlane].mesh.lookAt(planes[currentPlane].position);
		update();
	});

	dValue.addEventListener("keyup", function(){
		planes[currentPlane].normal.d = Number(dValue.value);
		if (!changePoint()){
			update();
		} else {
			changePoint();
			update();
		}
	});

	addBtn.addEventListener("click", function() {
		if (currentDiv) {
			currentDiv.classList.toggle("plane-clicked", false);
		}

		if (planeAtIndexExists(currentPlane)) {
			if (planeAtIndexExists((planes.length - 1))) {
				if (!planes[currentPlane].hasDiv) {
					addPanel();
				}
				textReset();
				planes.push(new plane(0,0,0));
			} else {
				textReset();
			}
			currentPlane = planes.length - 1;
		}
	});

	loiRadio.addEventListener("change", function() {
		if (loiRadio.checked) {
			findLOI();
			toggleLOI = true;
		} else {
			toggleLOI = false;
			clearLOI();
		}
	});

	window.addEventListener("resize", function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	});

	document.addEventListener("mousemove", function(e) {
		e.preventDefault();

		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		if (intersections) {
			mouseIntersect(e.pageX, e.pageY);
		}

	});
};

function update() {
	drawPlanes();
	if (toggleLOI) {
		findLOI();
	}
}

function drawAxes() {
	var lineMaterial = new THREE.LineBasicMaterial({color: 0x000000});

	var xGeo = new THREE.Geometry();
	xGeo.vertices.push(new THREE.Vector3(-axisSize,0,0));
	xGeo.vertices.push(new THREE.Vector3(axisSize,0,0));
	var xAxis = new THREE.Line(xGeo, lineMaterial);

	var yGeo = new THREE.Geometry();
	yGeo.vertices.push(new THREE.Vector3(0, -axisSize, 0));
	yGeo.vertices.push(new THREE.Vector3(0, axisSize, 0));
	var yAxis = new THREE.Line(yGeo, lineMaterial);

	var zGeo = new THREE.Geometry();
	zGeo.vertices.push(new THREE.Vector3(0,0,-axisSize));
	zGeo.vertices.push(new THREE.Vector3(0,0,axisSize));
	var zAxis = new THREE.Line(zGeo, lineMaterial);

	var size = 10,
		divisions = 20;

	var gridHelper = new THREE.GridHelper(size, divisions);
	
	scene.add(gridHelper);
	scene.add(xAxis);
	scene.add(yAxis);
	scene.add(zAxis);
}

function labelAxis() {
	var labelX = [(axisSize + 0.4), (-axisSize - 0.4), 0, 0, 0, 0];
	var labelY = [0,0,(axisSize+0.4),(-axisSize-0.4),0,0];
	var labelZ = [0,0,0,0,(axisSize+0.4),(-axisSize-0.4)];
	var labelText = ["+X", "-X", "+Y", "-Y", "+Z","-Z"];
	var labels = [];

	for (var i = 0; i < 6; i++) {
		labels.push(new THREE.TextSprite({
			renderOrder: 0,
			textSize: 0.5,
			material: {
				color: 0x000000,
			},
			texture: {
				text: labelText[i],
				fontFamily: "Trebuchet MS",
			}
		}));

		labels[i].position
					.setX(labelX[i])
					.setY(labelY[i])
					.setZ(labelZ[i]);
	}

	scene.add(...labels);
}

function plane(a, b, c) {
	this.geometry = new THREE.PlaneBufferGeometry(3*axisSize,3*axisSize);
	this.material = new THREE.MeshBasicMaterial({color: randomHexColor(), side: THREE.DoubleSide, transparent: true, opacity: 0.7, clippingPlanes: localPlanes}); //MAKE COLOR A VARIABLE
	this.mesh = new THREE.Mesh(this.geometry, this.material);
	tempNum += 1;
	this.mesh.name = "plane" + tempNum;
	this.normal = new THREE.Vector3(a,b,c);
	this.normal.d = 0;
	this.position = new THREE.Vector3().addVectors(this.normal, this.mesh.position);
}

function randomHexColor() {
	return "#" + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6);
}

function drawPlanes() {
	clearLOI();
	for (var i = 0; i < planes.length; i++) {
		if (planeAtIndexExists(i)) {
			scene.add(planes[i].mesh);
		}
	}
}

function removePlane(element) {
	var i = Array.prototype.indexOf.call(element.parentNode.parentNode.children, element.parentNode);
	element.parentNode.parentNode.removeChild(element.parentNode);
	scene.remove(scene.getObjectByName(planes[i].mesh.name));
	if (planeAtIndexExists(currentPlane)) {
		addPanel();
		planes.splice(i, 1);
		textReset();
		if (planeAtIndexExists(planes.length - 1)) {
			planes.push(new plane(0,0,0));
		}
		currentPlane = planes.length-1;
	} else {
		planes.splice(i, 1);
		currentPlane -= 1;
	}
	if (toggleLOI) {
		findLOI();
	}
}

function planeAtIndexExists(index) {
	if (planes[(index)].normal.x !== 0 || planes[(index)].normal.y !== 0 || planes[(index)].normal.z !== 0) {
		return true;
	}

	return false;
}

function planeOutput() {
	var xMessage = "",
		yMessage = "", 
		zMessage = "";

	if (planes[currentPlane].normal.x !== 0) {
		xMessage = planes[currentPlane].normal.x + "x ";
	}

	if (planes[currentPlane].normal.y !== 0) {
		if (planes[currentPlane].normal.y > 0 && xMessage) {
			yMessage = "+ " + planes[currentPlane].normal.y;
		} else {
			yMessage = planes[currentPlane].normal.y;
		}
		yMessage += "y ";
	}

	if (planes[currentPlane].normal.z !== 0) {
		if (planes[currentPlane].normal.z > 0 && (xMessage || yMessage)) {
			zMessage = "+ " + planes[currentPlane].normal.z;
		} else {
			zMessage = planes[currentPlane].normal.z;
		}
		zMessage += "z ";
	}

	return xMessage + yMessage + zMessage + " = " + planes[currentPlane].normal.d;
}

function findPoint(a,b,c) {
	var point = [0,0,0];
	if(!!planes[currentPlane].normal.d) {
		if (!!a) {
			point[0] = (planes[currentPlane].normal.d / a) / 10;
		} else if (!!b) {
			point[1] = (planes[currentPlane].normal.d / b) / 10;
		} else if (!!c) {
			point[2] = (planes[currentPlane].normal.d / c) / 10;
		} else {
			return false;
		}
	}
	return point;
}

function changePoint(point) {
		var point = findPoint(planes[currentPlane].normal.x, planes[currentPlane].normal.y, planes[currentPlane].normal.z);
		planes[currentPlane].mesh.position.set(point[0], point[1], point[2]);
}

function findLOI() {
	var v1, v1Three, v2, v3, direction, linePoints, lineEqn;
	var matrix = new THREE.Matrix4(),
		minV = new THREE.Matrix4();
	var lineMaterial;

	clearLOI();

	for (var i = 0; i < planes.length; i++) {
		for (var j = (i+1); j < planes.length; j++) {
			if (planes[i].normal && planes[j].normal) {
				if ((planes[i].normal.x || planes[i].normal.y || planes[i].normal.z) && (planes[j].normal.x || planes[j].normal.y || planes[j].normal.z)) {
					v1 = new THREE.Vector4(),
					v2 = new THREE.Vector3(),
					v3 = new THREE.Vector3(),
					direction = new THREE.Vector3(),
					linePoints = new THREE.Geometry();

					direction.crossVectors(planes[i].normal, planes[j].normal);
					v1.set(planes[i].normal.d, planes[j].normal.d, 0, 1);

					if (direction.x) {
						matrix.set(planes[i].normal.x, planes[i].normal.y, planes[i].normal.z, 0,
								planes[j].normal.x, planes[j].normal.y, planes[j].normal.z, 0,
								1, 0, 0, 0,
								0, 0, 0, 1);
						v1.exists = true;
					} else if (direction.y) {
						matrix.set(planes[i].normal.x, planes[i].normal.y, planes[i].normal.z, 0,
								planes[j].normal.x, planes[j].normal.y, planes[j].normal.z, 0,
								0, 1, 0, 0,
								0, 0, 0, 1);
						v1.exists = true;
					} else if (direction.z) {
						matrix.set(planes[i].normal.x, planes[i].normal.y, planes[i].normal.z, 0,
								planes[j].normal.x, planes[j].normal.y, planes[j].normal.z, 0,
								0, 0, 1, 0,
								0, 0, 0, 1);
						v1.exists = true;
					} else {
						v1.exists = false;
					}

					if (v1.exists) {
						matrix.getInverse(matrix);

						v1.applyMatrix4(matrix);

						lineEqn = "[" + v1.x + ", " + v1.y + ", " + v1.z + "] + [" + direction.x + ", " + direction.y + ", " + direction.z + "]t";

						direction.normalize();
						direction.multiplyScalar(8);
						v1.divideScalar(10);

						v2.addVectors(v1, direction);
						v3.subVectors(v1, direction);

						v1Three = new THREE.Vector3(v1.x, v1.y, v1.z);

						linePoints.vertices.push(v2, v1Three, v3);

						lineMaterial = new THREE.LineBasicMaterial();
						var loi = new THREE.Line(linePoints, lineMaterial);
						loi.name = "line" + intersections.length;
						loi.toString = lineEqn;
						loi.between = ["rgb(" + (planes[i].material.color.r * 255) + ", " + (planes[i].material.color.g*255) + ", " + (planes[i].material.color.b * 255) + ")", "rgb(" + (planes[j].material.color.r * 255) + ", " + (planes[j].material.color.g*255) + ", " + (planes[j].material.color.b * 255) + ")"];
						scene.add(loi);
						
						intersections.push(loi);
					}
				}
			}
		}
	}
}

function clearLOI() {
	for (var i = 0; i < intersections.length; i++) {
		scene.remove(scene.getObjectByName(intersections[i].name));
	}
	intersections = [];
}

function mouseIntersect(pageX, pageY) {
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(intersections);

	if (intersects.length > 0 ) {
		if (mouseOver != intersects[0].object) {
			if (mouseOver) {
				document.querySelector("#overlay").removeChild(lineInfo);
				lineInfo = null;
				mouseOver.material.color.setHex(mouseOver.currentHex);
			} 
			mouseOver = intersects[0].object;
			mouseOver.currentHex = mouseOver.material.color.getHex();
			mouseOver.material.color.setHex(0xff0000);
			lineOverlay(mouseOver.toString, mouseOver.between[0], mouseOver.between[1], pageX, pageY);
		}
	} else {
		if (mouseOver) {
			document.querySelector("#overlay").removeChild(lineInfo);
			lineInfo = null;
			mouseOver.material.color.setHex(mouseOver.currentHex)
		}
		mouseOver = null;
	}
}

function lineOverlay(message, color1, color2, pageX, pageY) {
	lineInfo = document.createElement("div");
	lineInfo.classList.add("intersection-info");
	lineInfo.style.top = (pageY - 50) + "px";
	lineInfo.style.left = (pageX + 50) + "px";
	lineInfo.innerHTML = "Line of Intersection: " + message + "<div><div class='small-box' style='background-color:" + color1 + ";'></div><div class='small-box' style='background-color:" + color2 + ";'></div></div>";
	document.querySelector("#overlay").appendChild(lineInfo);
}

function textReset() {
	xcoord.value = "";
	ycoord.value = "";
	zcoord.value = "";
	dValue.value = "";
}

function addPanel() {
	if (!(planes[currentPlane].hasDiv)) {
		planeDiv = document.createElement("div");
		planeDiv.classList.add("sidebar-panel");
		planeDiv.style.backgroundColor = "rgb(" + (planes[currentPlane].material.color.r * 255) + ", " + (planes[currentPlane].material.color.g*255) + ", " + (planes[currentPlane].material.color.b * 255) + ")";
		planes[currentPlane].hasDiv = true;
		planeDiv.innerHTML = "<span class='close' index='" + currentPlane + "' onclick='removePlane(this)'><a>x</a></span><br>PLANE<br>" + planeOutput();
		document.querySelector("#sidebar").appendChild(planeDiv);
		planeDiv.addEventListener("click", switchCurrent);
	}
}

function switchCurrent(e) {
	var i = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
	if (currentDiv) {
		currentDiv.classList.toggle("plane-clicked", false);
	}
	currentDiv = (e.target) ? e.target : e.srcElement;
	currentDiv.classList.toggle("plane-clicked");

	if (currentPlane !== i && !(planes[currentPlane].hasDiv) && (planes[currentPlane].normal.x !== 0 || planes[currentPlane].normal.y !== 0 || planes[currentPlane].normal.z !== 0)) {
		addPanel();
	}

	currentPlane = i;

	xcoord.value = planes[currentPlane].normal.x;
	ycoord.value = planes[currentPlane].normal.y;
	zcoord.value = planes[currentPlane].normal.z;
	dValue.value = planes[currentPlane].normal.d;
}