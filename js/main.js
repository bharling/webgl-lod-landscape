// Shader Vars

var _vertShader, _fragShader;

// Shader Params

var _landMaterial;

var _texHeightmap, _texMultilayer, _texStencil, _texLightmap, _paramUVX, _paramUVY, _paramHeight, _paramCellNumber;


// Game params  

var _landMesh, _cellSize, _subDivisions;

// Renderer

var _scene, camera, _renderer, _controls, _clock;


_paramHeight = 320.00;
_paramUVX = 0;
_paramUVY = 0;
_paramCellNumber = 64;
_cellSize = 2;

_subDivisions = 4;

var testRect;

var uniforms = {
	heightMap: { type: 't', value: THREE.ImageUtils.loadTexture( "img/height_normal.png" )},
	multilayer: { type: 't', value: THREE.ImageUtils.loadTexture( "img/multilayer3.jpg")},
	stencil: { type: 't', value: THREE.ImageUtils.loadTexture( "img/stencils.jpg" )},
	lightmap: { type: 't', value: THREE.ImageUtils.loadTexture( "img/lightmap.jpg" )},
	height: { type: 'f', value: _paramHeight },
	uvX: { type: 'i', value: _paramUVX },
	uvY: { type: 'i', value: _paramUVY },
	cellNumber: { type:'i', value: _paramCellNumber } 
}


function initScene () {
	loadShaders();
	initEngine();
	testSubDRect();
	animate();
}

function testSubDRect() {
	testRect = new SubDRect(-64, -64, 128, 128);
	var center = new THREE.Vector2(0,0);
	var t = 6;
	while(t--) {
		testRect.subdivide(true);
	}
	var c;
	for ( var i=0; i < testRect.children.length; i++ ) {
		c = testRect.children[i].getChildInDirectionOf(center);
		c.subdivide(true)
		for ( var lod = 0; lod < 3; lod++ ) {
			c.subdivide(true);
			c = c.getChildInDirectionOf(center);
		}
	}
	var geom = new THREE.Geometry();
	geom.vertices = testRect.verts();

	for ( var i = 0; i < verts.length; i+=4 ) {
		geom.faceVertexUvs[0].push([
			new THREE.Vector2(1.0 - ((verts[i].x - testRect.x) / testRect.width), 1.0 - ((verts[i].z - testRect.y) / testRect.height)),
			new THREE.Vector2(1.0 - ((verts[i+1].x - testRect.x) / testRect.width), 1.0 - ((verts[i+1].z - testRect.y) / testRect.height)),
			new THREE.Vector2(1.0 - ((verts[i+2].x - testRect.x) / testRect.width), 1.0 - ((verts[i+2].z - testRect.y) / testRect.height)),
			new THREE.Vector2(1.0 - ((verts[i+3].x - testRect.x) / testRect.width), 1.0 - ((verts[i+3].z - testRect.y) / testRect.height))
		]);
	}
	for ( var i=0, vl=verts.length; i<vl; i+=4) {

		geom.faces.push(new THREE.Face4(i, i+1, i+2, i+3));

	}
	
	geom.mergeVertices();
	geom.computeFaceNormals();
	geom.computeCentroids();
	
	
	createSkirts(geom);

	
	var testMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } )
	_landMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: _vertShader,
		fragmentShader: _fragShader,
		wireframe: false
	});
	_landMesh = new THREE.Mesh( geom, _landMaterial );
	_landMesh.scale = new THREE.Vector3(1,1,1);
	_scene.add(_landMesh);
	
}


var Edge = function (vertIndexA, vertIndexB, faceIndex) {
	var start = vertIndexA;
	var end = vertIndexB;
	var faces = [face];
}


function getEdges ( geom ) {
	/* to avoid duplicates 
	var edgeHashMap = {};
	var f, hash;
	for ( var i = 0, il = geom.faces.length; i < il; i++ ) {
		f = geom.faces[i];
		
		hash = "" + f.a + f.d + i;
		//if ( edgeHashMap[hash] )
		
	}*/
	
	
}


if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
    "use strict";
 
    if (this == null)
      throw new TypeError();
 
    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();
 
    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }
 
    return res;
  };
}


function createSkirts( geom ) {
	/* Assumes the vertices have ALREADY BEEN MERGED */
	
	var face, i, 
		faces = geom.faces,
		vertices = geom.vertices,
		il = faces.length,
		vertexUsage = [],
		vl = vertices.length;
	
	/* fill an array the same length as vertices with 0s for counting vertex usage */
	var vll = vl;
	while ( vll-- ) {
		vertexUsage.push(0);
	}
	
	/* Find all vertices that occupy less than 4 faces */
	for ( i=0; i<il; i++ ) {
		face = faces[i];
		vertexUsage[face.a]++;
		vertexUsage[face.b]++;
		vertexUsage[face.c]++;
		vertexUsage[face.d]++;
	}
	
	var edgeVertIndexes = [];
	vll = vl;
	for( i=0; i<vl; i++) {
		if ( vertexUsage[i] <= 3 ) {
			edgeVertIndexes.push( i );
		}
	}
	
	var vert
	for ( var t=0, tl = edgeVertIndexes.length; t<tl; t++ ) {
		geom.vertices[edgeVertIndexes[t]].y = -5;

	}
	
	
	/*var ind = vl;
	
	var iMap = [0,0,0,0], va, vb, vc, vd, uva, uvb, offset=new THREE.Vector3(0,-10, 0);
	for ( i=0; i<il; i++) {
		face = faces[i];
		iMap[0] = edgeVertIndexes.indexOf(face.a);
		iMap[1] = edgeVertIndexes.indexOf(face.b);
		iMap[2] = edgeVertIndexes.indexOf(face.c);
		iMap[3] = edgeVertIndexes.indexOf(face.d);
		
		// if all are equal, they must all be -1, so skip to next face
		if ( iMap[0] == -1 &&  iMap[1] == -1 && iMap[2] == -1 && iMap[3] == -1) {
			continue;
		}
		
		iMap.sort();
		
		if ( iMap[2] < 0 ) {
			// more than 1 side of this face is on an edge, skip again
			continue;
		}
		
		
		va = geom.vertices[edgeVertIndexes[iMap[2]]]
		vb = geom.vertices[edgeVertIndexes[iMap[3]]]
		
		vc = new THREE.Vector3().add(va, offset);
		vd = new THREE.Vector3().add(vb, offset);
		
		geom.vertices.push( vc );
		geom.vertices.push( vd );
		
		geom.faces.push( new THREE.Face4( edgeVertIndexes[iMap[3]], edgeVertIndexes[iMap[2]], ind, ind+1 ))
		ind+=2;
		
		geom.faceVertexUvs[0].push([
			new THREE.Vector2(1.0 - ((va.x - testRect.x) / testRect.width), 1.0 - ((va.z - testRect.y) / testRect.height)),
			new THREE.Vector2(1.0 - ((vb.x - testRect.x) / testRect.width), 1.0 - ((vb.z - testRect.y) / testRect.height)),
			new THREE.Vector2(1.0 - ((va.x - testRect.x) / testRect.width), 1.0 - ((va.z - testRect.y) / testRect.height)),
			new THREE.Vector2(1.0 - ((vb.x - testRect.x) / testRect.width), 1.0 - ((vb.z - testRect.y) / testRect.height))
		]);
		
	}
	
	*/
	
}


function initEngine () {
	_clock = new THREE.Clock();
	_scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, .02, 500 );
	camera.position = new THREE.Vector3(-20, 7, 4);
	camera.lookAt(_scene.position);
	_controls = new THREE.FirstPersonControls( camera );
	_controls.movementSpeed = 3;
	_controls.lookSpeed = 0.09;
	_controls.lookVertical = true;
	_renderer = new THREE.WebGLRenderer( { antialias: false } );
	_renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild(_renderer.domElement);
	document.addEventListener('keydown', _onKeyDown, false);
	_scene.add( new THREE.AmbientLight( 0xcccccc ) );
}

function _onKeyDown () {
	
}

function createLandscape () {
	var loader = new THREE.JSONLoader();
	loader.load( 'meshes/land.js', landLoaded )
}

function landLoaded (geom) {
	var mat = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: false, transparent: false } );
	_landMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: _vertShader,
		fragmentShader: _fragShader,
		wireframe: false,
		
	});
	var m = new THREE.Mesh( geom, _landMaterial );
	m.scale = new THREE.Vector3(1,1,1);
	_scene.add(m);
}

function loadShaders () {
	_vertShader = $('#vertex').text();
	_fragShader = $('#fragment_to_fix').text();
}


function render () {
	_controls.update(_clock.getDelta());
	_renderer.render( _scene, camera );
}


function animate () {
	requestAnimationFrame( animate );
	var timer = Date.now() * 0.0005;
	var cell = _cellSize;
	/* Round values to ints */
	_landMesh.position.x = ~~(camera.position.x/cell)*cell;
	_landMesh.position.z = ~~(camera.position.z/cell)*cell;
	uniforms['uvX'].value = ~~(-camera.position.x / _cellSize);
	uniforms['uvY'].value = ~~(-camera.position.z / _cellSize);
	render();
}
