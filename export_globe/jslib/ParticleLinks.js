function ParticleLinks(count, clock) {
	this.count = count;
	this.totalAdded = 0;
	this.dotsAdded = [];
	this.clock = clock;  // 粒子颜色变化的时间周期
	this.ordered = false;
    this.linkGeometry = new THREE.BufferGeometry();
    var attributes = {
		size:        {type: 'f', value: null},
		customColor: {type: 'c', value: null}
	};
	var uniforms = {
		color:     {type: "c", value: new THREE.Color(0xffffff)},
		texture:   {type: "t", value: THREE.ImageUtils.loadTexture("images/link_dot.png")}
	};
    var shaderMaterial = new THREE.ShaderMaterial({
		uniforms:       uniforms,
		attributes:     attributes,
		vertexShader:   document.getElementById('vertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent
	});
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var sizes = new Float32Array(count);
    for (var i = 0; i < count; i++) {
    	positions[i * 3] = 0;
    	positions[i * 3 + 1] = 0;
    	positions[i * 3 + 2] = 0;
    	colors[i * 3] = 255;
    	colors[i * 3 + 1] = 255;
    	colors[i * 3 + 2] = 255;
    	sizes[i] = 3;
    };
    this.linkGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.linkGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    this.linkGeometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.particleMesh = new THREE.PointCloud(this.linkGeometry, shaderMaterial);
	this.particleMesh.dynamic = true;
	this.particleMesh.frustrumCulled = true;
};

/* 返回飞线粒子系统的几何形状和材质 */
ParticleLinks.prototype.getMesh = function() {
	return this.particleMesh;
};

/* 通过单个粒子周期性的颜色变化来制造飞线整体的“流动”动画效果 */
ParticleLinks.prototype.animate = function() {
	var colors = this.linkGeometry.attributes.customColor.array;
	for (var j = this.dotsAdded.length-1; j >= 0; j--) {
		index = this.dotsAdded[j];
		for (var i = 0; i < index; i++) {
			t = 0.8 + Math.sin(this.clock.getElapsedTime() * index / 50 + i) / 2;
			colors[index * 3 + i * 3] = t;
			colors[index * 3 + i * 3 + 1] = t;
			colors[index * 3 + i * 3 + 2] = t;
		}
	}
	this.linkGeometry.attributes.customColor.needsUpdate = true;
};

/* 根据样条曲线和出口总额确定飞线上粒子的位置和数量，用一系列沿飞线排布的粒子来代替实际的飞线 */
ParticleLinks.prototype.assignPositions = function(vertices, j, value) {
	var positions = this.linkGeometry.attributes.position.array;
	this.ordered = true;
	offset = Math.round(Math.log(value) * 15);  // 飞线上粒子的数量由出口总额决定，出口总额越高粒子数量越多
	if(j === 0) {
		this.totalAdded = 0;
		this.dotsAdded = [];
	}
	for (var i = 0; i < offset; i++) {
		indice = Math.floor(i / offset * 200);
		average = i / offset * 200 - indice;
		positions[this.totalAdded * 3 + i * 3] = vertices[indice].x + (vertices[indice+1].x - vertices[indice].x) * average;
		positions[this.totalAdded * 3 + i * 3 + 1] = vertices[indice].y + (vertices[indice+1].y - vertices[indice].y) * average;
		positions[this.totalAdded * 3 + i * 3 + 2] = vertices[indice].z + (vertices[indice+1].z - vertices[indice].z) * average;
	};
	if(j === 9) {
		for (var i = this.count; i >= this.totalAdded; i--) {
			positions[i * 3] = 0;
			positions[i * 3 + 1] = 0;
			positions[i * 3 + 2] = 0;
		};
	}
	this.totalAdded += offset;
	this.dotsAdded.push(this.totalAdded);
	this.linkGeometry.attributes.position.needsUpdate = true;
};