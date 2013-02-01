var vcolRed = new THREE.Color(0xff0000);
var vcolWhite = new THREE.Color(0xffffff);


SubDRect = function (x,y,w,h,d,p) {
	var self = this;
	self.x = x;
	self.y = y;
	self.width = w;
	self.height = h;
	self.children = [];
	self.depth = d || 0;
	self.maxChildDepth = d;
	
	self.parent = p; // can be null
	
	/* are all children of the same depth */
	self.balanced = true;
	
	/*if ( p && p.maxChildDepth != d ) {
		p.updateMaxChildDepth( d );
	}*/
	
	/**
	 *
	 *  
	 */
	self.updateMaxChildDepth = function ( depth ) {
		self.maxChildDepth = depth;
		self.checkBalance();
		if ( self.parent ) {
			self.parent.updateMaxChildDepth( depth );
		}
	}
	
	/**
	 *	returns true if the given rect is enclosed inside or exaclty the same dimensions 
	 */
	self.containsRect = function (rect) {
		return rect.x >= self.x && (rect.x+rect.width) <= (self.x+self.width) && rect.y >= self.y && (rect.y+rect.height) <= (self.y+self.height);
	}
	
	/**
	 *	Check if all children are the same size 
	 */
	self.checkBalance = function () {
		self.balanced = self.children.length == 0 || self.children[0].maxChildDepth == self.children[1].maxChildDepth == self.children[2].maxChildDepth == self.children[3].maxChildDepth;
	}
	
	/**
	 *	return the bounds of this rectangle as [top, right, bottom, left] 
	 */
	self.bounds = function () {
		return [self.y, self.x+self.width, self.y+self.height, self.x];
	}
	
	/**
	 *	Subdivide this rect into 4 equal rects
	 *  If 'recursive' flag is set, fall through to children until we reach a child that has not been subdivided yet 
	 */
	self.subdivide = function (recursive) {
		if ( self.children.length > 0 ) { 
			if (recursive) {
				for ( var i=0; i < self.children.length; i++) {
					self.children[i].subdivide(recursive)
				}
			} 
			
			return;
		}
		var hw = self.width / 2;
		var hh = self.height / 2;
		self.children = [
			new SubDRect(self.x, self.y, hw, hh, self.depth+1, self),
			new SubDRect(self.x+hw, self.y, hw, hh, self.depth+1, self),
			new SubDRect(self.x+hw, self.y+hh, hw, hh, self.depth+1, self),
			new SubDRect(self.x, self.y+hh, hw, hh, self.depth+1, self)
		]
		
	}
	
	/**
	 *	Return the center point of this rect as a vector2 
	 */
	self.getCenter = function () {
		return new THREE.Vector2( self.x+(self.width/2), self.y+(self.height/2) )
	}
	

	
	/**
	 *	Get the closest child to a point, calls subdivide if this rect has no children 
	 */
	self.getChildInDirectionOf = function (point) {
		if ( self.children.length == 0 ) { return self }
		
		var direction = new THREE.Vector2().sub(self.getCenter(), point).negate();
		
		if(direction.x <= 0&&direction.y <= 0) { return self.children[0] }
		if(direction.x >= 0&&direction.y <= 0) {return self.children[1] }
		if(direction.x >= 0&&direction.y >= 0) {return self.children[2] }
		return self.children[3];
	}
	
	/**
	 *
	 *  Get Neighbouring rects
	 */
	self.getSiblings = function () {
		if ( !self.parent ) {
			return [self];
		}
		return self.parent.children;
	}
	
	/**
	 * Is this rect on the edge of its parent ( recurse up the parents until balanced == false, then test against that rect's children ) 
	 */
	self.onLODBoundary = function () {
		if ( !self.parent ) {
			return false;
		}
		while ( p.balanced && p.parent ) {
			p = p.parent;
		}
		// find the child that contains us
		var c = null;
		var i = 4;
		while( i-- ) {
			c=p.children[i];
			if (c.containsRect( self )) {
				break;
			}
		}
		var pbounds = c.bounds();
		var mybounds = self.bounds();
		pbounds.sort();
		mybounds.sort();
		for ( var i=0; i<4; i++) {
			if ( pbounds[i] == mybounds[i] ) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 *
	 * DEBUG: Color this face depending on whether its an edge or not; 
	 */
	self.faceColors = function () {
		var fcols = [];
		if ( self.children.length > 0 ) {
			var i=4;
			while ( i-- ) {
				fcols=fcols.concat(self.children[i].faceColors());
			}
		} else {
			fcols = self.onLODBoundary() ? [0xff0000] : [0xffffff];
		}
		return fcols;
	}
	
	
	/**
	 *	return a set of 3-Vectors in an anticlockwise order suitable for creating a face ? 
	 */
	
	self.verts = function () {
		verts = new Array();
		if ( self.children.length > 0 ) {
			var i=4;
			while ( i-- ) {
				verts=verts.concat(self.children[i].verts())
			}
		} else {
			
		    // TODO: ADD Skirts to the geometry to hide holes ( detect if we're on an edge and if so, whether the adjoining rect is a higher depth )
			verts = [
				new THREE.Vector3(self.x, 0, self.y),
				new THREE.Vector3(self.x, 0, self.y+self.height),
				new THREE.Vector3(self.x+self.width, 0, self.y+self.height),
				new THREE.Vector3(self.x+self.width, 0, self.y)
			]
		}
		return verts;
	}
	
	self.vertexColors = function () {
		vcols = new Array();
		if ( self.children.length > 0 ) {
			var i = 4;
			while ( i-- ) {
				vcols = vcols.concat(self.children[i].vertexColors())
			}	
		} else {
			var onb = self.onLODBoundary();
			
			if (onb) {
				vcols = [new THREE.Color(0xff0000), 
				new THREE.Color(0xff0000), 
				new THREE.Color(0xff0000), 
				new THREE.Color(0xff0000) ]
			} else {
				vcols = [new THREE.Color(0xffffff), 
				new THREE.Color(0xffffff),  
				new THREE.Color(0xffffff),  
				new THREE.Color(0xffffff) ]
			}
			
				
		}
		return vcols;
	}
}
