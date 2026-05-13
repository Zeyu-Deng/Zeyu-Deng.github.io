function ParticleLinks(count,clock){
	this.count=count;
	this.totalAdded=0;
	this.dotsAdded=[];
	this.clock=clock;
	this.ordered=false;
    this.linkGeometry = new THREE.BufferGeometry();
    var attributes = {size:{ type: 'f', value: null },customColor: { type: 'c', value: null }};
	var uniforms = {color:     { type: "c", value: new THREE.Color( 0xffffff ) },texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "images/dot.png" ) }};

    var shaderMaterial = new THREE.ShaderMaterial( {
                uniforms:       uniforms,
                attributes:     attributes,
                vertexShader:   document.getElementById( 'vertexshader' ).textContent,
                fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
                blending:       THREE.AdditiveBlending,
                depthTest:      false,
                transparent:    true
            });
    var positions = new Float32Array( count * 3 );
    var colors = new Float32Array( count * 3 );
    var sizes = new Float32Array( count );
    for (var i = 0; i < count; i++) {
    	positions[i*3]=0;
    	positions[i*3+1]=0;
    	positions[i*3+2]=0;
    	colors[i*3]=255;
    	colors[i*3+1]=255;
    	colors[i*3+2]=255;
    	sizes[i]=3;

    };
    this.linkGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    this.linkGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    this.linkGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
    this.particleMesh = new THREE.PointCloud( this.linkGeometry, shaderMaterial );
	this.particleMesh.dynamic=true;
	this.particleMesh.frustrumCulled=true;

};
ParticleLinks.prototype.getMesh = function(){
	return this.particleMesh;
};
ParticleLinks.prototype.align = function(links){
	this.particleMesh.position=links.position;

};
ParticleLinks.prototype.hide = function(links){
	this.particleMesh.visible=false;

};
ParticleLinks.prototype.clearPositions = function(){
	var positions = this.linkGeometry.attributes.position.array;
	var sizes = this.linkGeometry.attributes.size.array;
	for (var i = 0; i < this.count; i++) {
		positions[i*3]=0;
		positions[i*3+1]=0;
		positions[i*3+2]=0;
		sizes[i]=3;
	}
	this.totalAdded=0;
	this.dotsAdded=[];
	this.linkGeometry.attributes.position.needsUpdate = true;
	this.linkGeometry.attributes.size.needsUpdate = true;
};
ParticleLinks.prototype.animate = function(){
	var colors = this.linkGeometry.attributes.customColor.array;
	for (var j = this.dotsAdded.length-1; j >=0; j--) {
	index=this.dotsAdded[j];
	for (var i = 0; i < index; i++) {
			/*positions[index*3+i*3]=0;
			positions[index*3+i*3+1]=0;
			positions[index*3+i*3+2]=0;*/
			t=0.8+Math.sin(this.clock.getElapsedTime()*index/50+i)/2;
			colors[index*3+i*3]=t;
			colors[index*3+i*3+1]=t;
			colors[index*3+i*3+2]=t;
	}}
	this.linkGeometry.attributes.customColor.needsUpdate=true;

};
ParticleLinks.prototype.assignPositions = function(vertices,j,value,pointSize){
	var positions = this.linkGeometry.attributes.position.array;
	var sizes = this.linkGeometry.attributes.size.array;
	this.ordered=true;
	//offset=Math.round(value/1000);
	offset=Math.round(Math.log(value)*10);
	pointSize=pointSize || 3;
	if(j===0){
		this.totalAdded=0;
		this.dotsAdded=[];
	}
	for (var i =0; i <offset; i++) {
		indice=Math.floor(i/offset*100);
		
		average=i/offset*100-indice;
		positions[this.totalAdded*3+i*3]=vertices[indice].x+(vertices[indice+1].x-vertices[indice].x)*average;
		positions[this.totalAdded*3+i*3+1]=vertices[indice].y+(vertices[indice+1].y-vertices[indice].y)*average;
		positions[this.totalAdded*3+i*3+2]=vertices[indice].z+(vertices[indice+1].z-vertices[indice].z)*average;
		sizes[this.totalAdded+i]=pointSize;
	};
	if(j===9){
		for (var i = this.count; i >= this.totalAdded; i--) {
			positions[i*3]=0;
			positions[i*3+1]=0;
			positions[i*3+2]=0;
		};
	}

	this.totalAdded+=offset;
	this.dotsAdded.push(this.totalAdded);
	this.linkGeometry.attributes.position.needsUpdate = true;
	this.linkGeometry.attributes.size.needsUpdate = true;

};
