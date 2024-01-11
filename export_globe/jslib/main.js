var camera, scene, renderer;

window.onload = function(){
    var clock = new THREE.Clock();
    var UserInterface = null;
    var Labels = null;
    var parseURL = new URLparser();
	var dollars = 100000000;
    var particles = 1000;
    var destination = [];
    var increment = 5;
    var globe = null;
    var bright = false;
    var percentage = 1;
    var loaded = false;
    var selectedID = 0;
    var shape = null;
    var products = {};
    var countries = {};
    var trades = {};
    var countryOverlay = null;
    var links;
    var globeSize = 150;
    var names = [];
    var countryIndex = 0;
    var categories = {};
    var previousMode = "2D";
    var selectedCountry = null;
    var currentSetup;
    var cameraControls = null;
    var isDragging = false;
    var mouseCoord = {"x": 0, "y": 0};
    var currentZoom = 0;
    var selectedNode = new THREE.Mesh(
        new THREE.SphereGeometry(5, 24, 24),
        new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        })
    );
    var constantSize = false;
    var particleLinks = null;
    var particlesPlaced = 0;
    var Pgeometry = null;
    var Sgeometry = null;
    var overlayMaterial = null;

    /*检测当前浏览器是否支持WebGL*/
    if(WebGLtest()){
        init();
        animate();
    }else{
        $("#noPrompt").html($("#noWebGL").html());  // 若不支持，则提示用户
    }

    /*初始化函数*/
    function init() {

        /* 场景、相机、渲染器 */
        var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;  // 浏览器窗口的视口宽度和高度，单位：px

        scene = new THREE.Scene();  // 【实例化一个三维场景对象】

        var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;  // 设置透视投影相机的部分属性：视场角度、画布宽高比、近裁截面距离、远裁截面距离
        camera =new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);  // 【实例化一个透视投影相机对象】
        scene.add(camera);  // 将相机添加到三维场景中
        camera.position.z = 450;  // 设置相机在三维场景中的位置

        renderer = new THREE.WebGLRenderer();  // 【实例化一个WebGL渲染器对象】
        renderer.setClearColor(0x000000, 1.0);  // 设置颜色（黑色）及其透明度
        renderer.setSize(window.innerWidth, window.innerHeight);

        window.addEventListener("resize", function(){  // 监听浏览器窗口的缩放，在窗口大小发生变化时实现自适应
            var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;  // 设定画布的宽度和高度
            renderer.setSize(WIDTH, HEIGHT);  // 按设定宽高调整画布大小并考虑设备像素比，且将视口从(0, 0)开始调整到适合大小
            camera.aspect = WIDTH / HEIGHT;  // 相机视锥体水平方向和竖直方向长度比，一般设置为画布的宽高比
            camera.updateProjectionMatrix();  // 更新相机投影矩阵，在任何参数被改变以后必须被调用
        });

        document.body.appendChild(renderer.domElement);  // WebGL渲染器通过属性.domElement可以获得渲染方法.render()生成的画布（全屏渲染）

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /* 数据加载完成前，先显示加载界面 */
        UserInterface= new UI();  // 【实例化一个UI对象，用于实现用户交互】
        UserInterface.addSpinner();  // 使用UI对象的.addSpinner()方法创建加载圈元素
        
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /* 加载数据 */
        var color = new THREE.Color();
        countryIndex = 0;
        var planeShapeIDs;
        var sphereShapeIDs;

        $.getJSON("data/world.json", function(geojson) {  // 加载世界地图JSON数据到geojson参数，加载成功后执行回调函数
            overlayMaterial = new THREE.MeshPhongMaterial({  // 创建地球仪的表面（在球体表面覆盖一层Phong网格材质）
                map: THREE.ImageUtils.loadTexture("images/world.png"),  // 加载一个纹理映射，这是一个海陆双色（深蓝/浅蓝）简版世界地图的图片
                transparent: true,  // 设置材质为透明
                blending: THREE.AdditiveBlending  // 设置颜色融合模式为加法模式
            });

            shape = new THREE.Object3D();  // 创建一个3D对象
            temp = drawThreeGeo(geojson, 400, 'plane', scene, {  // 调用THREE.GeoJSON.js中的drawThreeGeo方法，绘制平面地图（plane），大小为400
                color: 0x7e7e7e,  // 灰色
                linewidth: 4,  // 线条宽度
            });
            shape.add(temp[0]);  // 将绘制出的平面地图添加到3D对象中
            /* 创建一个平面几何体（使用之前创建的地球仪表面材质），将其添加到3D对象中 */
            overlay = new THREE.Mesh(new THREE.PlaneGeometry(560, 280, 1, 1), overlayMaterial);
            shape.add(overlay);

            planeShapeIDs = temp[1];

            /* 创建一个新的3D对象，并添加一个球体几何体作为地球仪，其表面为基础材质，颜色为黑色 */
            globe = new THREE.Object3D();
            globe.add(
                new THREE.Mesh(
                    new THREE.SphereGeometry(globeSize-1, 32, 32),
                    new THREE.MeshBasicMaterial({color: 0x000000})
                )
            );
            /* 创建一个新的球体几何体（使用之前创建的地球仪表面材质），将其添加到地球仪对象中 */
            overlaySphere = new THREE.Mesh(new THREE.SphereGeometry(globeSize, 32, 32), overlayMaterial);
            overlaySphere.rotation.y = - Math.PI / 2;  // 将球体绕y轴旋转适当的角度，使表面材质上的地图与地球仪上的地图相吻合
            globe.add(overlaySphere);
            temp = drawThreeGeo(geojson, globeSize*1.42, 'sphere', scene, {  // 调用THREE.GeoJSON.js中的drawThreeGeo方法，绘制三维地图（sphere），半径为globeSize的1.42倍
                color: 0x7e7e7e,  // 灰色
                linewidth: 4,  // 线条宽度
                transparent: true,  // 设置为透明
                opacity: 0.5,  // 不透明度
                blending: THREE.AdditiveBlending  // 加法融合模式
            });
            globe.add(temp[0]);  // 将绘制出的三维地图添加到地球仪对象中
            globe.updateMatrix();  // 更新地球仪对象的矩阵

            sphereShapeIDs = temp[1];

            renderer.render(scene, camera);  // 渲染场景
        });
        
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            
        $.getJSON("data/core.json", function(corejson) {  // 加载核心JSON数据到corejson参数，加载成功后执行回调函数
            /* 遍历corejson.countries（即国家或地区商品贸易出口数据），依次将corejson中的国家或地区商品贸易出口数据复制到countries字典中 */
            $.each(corejson.countries, function(co, country) {
                countries[co]=country;
            });
                
            $.each(planeShapeIDs, function(shapeid, shapes) {
                if(countries[shapeid])countries[shapeid]["polygons"]=shapes;
            });

            $.each(sphereShapeIDs, function(shapeid, shapes) {
                if(countries[shapeid])countries[shapeid]["polygons3D"]=shapes;
            });

            /* 遍历corejson.products（即商品数据），依次将corejson中的商品数据复制到products字典中 */
            $.each(corejson.products, function(pid, product) {
                products[pid] = product;
            });

            /* 遍历corejson.categories（即大类分区数据），依次将corejson中的大类分区数据复制到categories字典中 */
            $.each(corejson.categories, function(cid, category) {
                categories[cid] = category;
            });

            /* 遍历corejson.trade（即出口贸易伙伴数据），依次将corejson中的出口贸易伙伴数据复制到trades字典中 */
            $.each(corejson.trade,function(i, val) {
                if(countries[i]) {
                    trades[i] = val;
                }
            });

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////

            Labels = new LabelManager(countries);  // 用国家或地区商品贸易出口数据创建国家/地区名称标签系统

            UserInterface.buildCategories(categories);  // 用大类分区数据创建商品类别筛选器元素

            UserInterface.createSelectionBox(countries);  // 用国家或地区商品贸易出口数据创建经济体选择器元素

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////

            /* 创建粒子系统 */
            countryIndex = 126;  // 经济体数量
            particles = 263842 + 1;  // 粒子总数+1（使用Python计算得到该数据）
            var positions = new Float32Array(particles * 3);  // 创建一个浮点数组来存储粒子的位置信息（落入地图前）（xyz三维）
            destination = new Float32Array(particles * 3);  // 创建一个浮点数组来存储粒子的目标位置信息（落入地图后）（xyz三维）
            var values_color = new Float32Array(particles * 3);  // 创建一个浮点数组来存储粒子的颜色信息（rgb三维）
            var values_size = new Float32Array(particles);  // 创建一个浮点数组来存储粒子的大小信息

            /*
                遍历所有经济体
                对于每个经济体，遍历其所有出口商品类别
                对于每个出口商品类别，根据其出口额创建一定数量的粒子（productValue/dollars）
                每个粒子的颜色由商品类别的代表颜色决定（productInfo.color）
                位置和目标位置被初始化为(1, 2, 5000)
            */
            var v = 0;
            for (var i = 0; i < countryIndex; i++) {
                $.each(countries, function(p, v){if(i==v.id){val=v;code=p;}});

                for(var key in val["products"]) {
                    productValue = val["products"][key];
                    productInfo = products[key];

                    color = new THREE.Color(productInfo.color);

                    for(var s = 0; s < Math.round(productValue/dollars); s++) {
                        names.push({"n": key, "c": code});

                        values_size[v] = 3;  // 初始大小（暗淡模式下）为3

                        /* 增强粒子颜色的亮度，将r、g、b值均设置为类别颜色的1.25倍，使粒子成为“亮点” */
                        values_color[v*3] = color.r * 1.25;
                        values_color[v*3+1] = color.g * 1.25;
                        values_color[v*3+2] = color.b * 1.25;

                        destination[v*3] = 1;
                        destination[v*3+1] = 2;
                        destination[v*3+2] = 5000;

                        positions[v*3] = 1;
                        positions[v*3+1] = 2;
                        positions[v*3+2] = 5000;

                        v++;
                    }
                }
            }

            geometry = new THREE.BufferGeometry();  // 创建一个空的缓冲几何体对象
            geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));  // 给几何体添加position属性，其值为粒子的位置信息
            geometry.addAttribute('customColor', new THREE.BufferAttribute(values_color, 3));  // 给几何体添加customColor属性，其值为粒子的颜色信息
            geometry.addAttribute('size', new THREE.BufferAttribute(values_size, 1));  // 给几何体添加size属性，其值为粒子的大小信息

            /* 创建一个自定义的着色器材质，允许使用自定义的顶点着色器和片段着色器来渲染物体，以实现各种复杂的渲染效果 */
            var attributes = {  // 在顶点着色器中使用
                size:        {type: 'f', value: null},
                customColor: {type: 'c', value: null}
            };
            var uniforms = {  // 在顶点着色器和片段着色器中都可以访问的全局变量
                color:     {type: "c", value: new THREE.Color(0xffffff)},
                texture:   {type: "t", value: THREE.ImageUtils.loadTexture("images/block.png")}  // 加载外部纹理（小方块粒子）
            };
            var shaderMaterial = new THREE.ShaderMaterial( {
                uniforms:       uniforms,
                attributes:     attributes,
                vertexShader:   document.getElementById('vertexshader').textContent,
                fragmentShader: document.getElementById('fragmentshader').textContent
            });

            particleSystem = new THREE.PointCloud(geometry, shaderMaterial);  // 使用缓冲几何体和自定义着色器材质创建粒子云对象，也就是粒子系统
            /*
                在Three.js中，.frustumCulled是一个布尔值属性，用于决定一个物体是否应该进行视锥裁剪
                视锥裁剪是一种优化技术，用于跳过渲染那些完全不在摄像机视野内的物体
                这里将其设置为true，意味着Three.js将会检查物体是否在摄像机的视锥内
                如果物体完全在视锥之外，那么这个物体就不会被渲染，从而节省了计算资源
            */
            particleSystem.frustrumCulled = true;

            scene.add(particleSystem);  // 将粒子系统添加到场景中

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////

            /* 初始化地球飞线，并将其添加到场景中 */
            particleLinks = new ParticleLinks(13000, clock);
            links = particleLinks.getMesh();
            scene.add(links);

            /* 当通过经济体选择器或者点击国家/地区名称标签选中某个经济体时，相机将旋转至对准该国家/地区的几何地理中心位置 */
            $(".countrySelection").on("change", function() {
                targetCountry($(this).val(), true, true);
                filterCountry = $(this).val();
            });

            /* 当所有数据加载完成后，加载提示语和加载圈淡出，显示主界面 */
            loaded = true;  // 数据加载完成标记
            $("#loading").fadeOut("slow");
            $("#spinner").fadeOut("slow");
            switcher("gridSphere", false, 25);  // 初始的主界面中展示的是三维地球仪视图模式下的可视化结果
        });

        selectedNode.position.set(0, 0, 10000);
        scene.add(selectedNode);

        /* 鼠标事件监听 */
        renderer.domElement.addEventListener("mousemove", mouseMove);  // 移动鼠标
        renderer.domElement.addEventListener("mousedown", mouseDown);  // 按下鼠标
        window.addEventListener("mouseup", function(){  // 释放鼠标
            if(!isDragging){  // 若不是在拖动鼠标，则释放鼠标时移除所有飞线，并重置地名标签
                scene.remove(links)
                Labels.resetLabels(countries);
            }
            UserInterface.changeCursor("default");
            isClicking = false;
            isDragging = false;
        });
        renderer.domElement.addEventListener("wheel", mousewheel, false);  // 滚动鼠标滚轮
        $(renderer.domElement).dblclick(function(e) {cameraControls.zoom(10);});  // 鼠标双击放大（相机向物体靠近）


        scene.add(new THREE.AmbientLight(0xFFFFFF));

        cameraControls = new Controls(renderer.domElement, 450);
	}

    function animateOverlay(percentage) {
        if(currentSetup === "gridSphere") {
            var test = true;
            $.each(categories, function(col, val) {
                if(!val.active)test = false;
            })
            if (test) {
                overlay = globe.children[1];
                if(percentage === 0) {
                    overlayMaterial.opacity = Math.min(((cameraControls.getZoom() - 175) / 300), 0.6);
                } else {
                    overlayMaterial.opacity = Math.min(percentage / 100, 0.6);
                }
            }else {
                overlayMaterial.opacity = 0;
            }
        } else {
            overlayMaterial.opacity = 0;
        }
    }

    /* 创建经济体之间的飞线连接 */
    function addLinks(type, chosenCountry) {
        scene.remove(links);  // 先清除掉现有的飞线
        var color = new THREE.Color();

        /*
            先将所有国家/地区名称标签全部隐去（不透明度设置为0）
            然后仅显示（不透明度设置为1）并放大（字体大小由10变为24）被选中的国家/地区的名称标签
        */
        $.each(countries, function(c, co) {
            $("#" + c).css({'font-size': 10, 'color': '#FFFFFF', 'z-index': 2, 'opacity': 0});
        });
        if(chosenCountry)$("#" + chosenCountry).css({'font-size': 24, 'color': '#FFFFFF', 'z-index': 4, 'opacity': 1});

        $.each(trades, function(i, exports) {  // 获取各经济体的前十大出口贸易伙伴信息
            country1 = countries[i];  // 出口来源经济体

            if(country1) {

                $.each(exports, function(j, val) {
                    country2 = countries[val.c];  // 出口目的经济体

                    if(country2 && (chosenCountry==="ALL" || chosenCountry===i)) {  // 将被选中的经济体作为出口来源经济体
                        
                        /* 显示被选中经济体的前十大出口贸易伙伴的名称标签，字体的大小取决于出口总额的高低 */
                        $("#" + val.c).css({'font-size': 12+Math.sqrt(val.e)/40, 'color': '#eee', 'z-index': 2, 'opacity': 1});

                        var segments = [];  // 样条曲线的控制点对象数组

                        if(type === "countries2D") {  // 在平面地图上
                            segments.push(new THREE.Vector3(country2.lat*1.55, country2.lon*1.55, 0));  // 起点
                            segments.push(new THREE.Vector3((country2.lat*1.55+country1.lat*1.55)/2, (country2.lon*1.55+country1.lon*1.55)/2, 10));  //中心点上提，制造凸起效果
                            segments.push(new THREE.Vector3((country2.lat*1.55+country1.lat*1.55)/2, (country2.lon*1.55+country1.lon*1.55)/2, 10));  //中心点上提，制造凸起效果
                            segments.push(new THREE.Vector3(country1.lat*1.55, country1.lon*1.55, 0));  // 终点
                            line = Spline(segments, color.getHex(), 5-j/2);  // 样条曲线
                            particleLinks.assignPositions(line.geometry.vertices, j, val.e);  // 根据样条曲线和出口总额确定飞线上粒子的数量和位置
                        }else if(type === "countries3D") {  // 在三维地图上
                            /*
                                计算两个经济体的几何地理中心在地球仪上的坐标
                                theta和phi为球面坐标：
                                    theta为从正z轴到点的线段与正z轴之间的角度（即仰角）
                                    phi为从正x轴到点的线段在xy平面上的投影与正x轴之间的角度（即方位角）
                                下面的计算将球面坐标转换为笛卡尔坐标（x、y、z）
                            */
                            theta1 = (90 - country2.lon) * Math.PI / 180;
                            phi1 = country2.lat * Math.PI / 180;
                            sx = globeSize * Math.sin(theta1) * Math.cos(phi1);
                            sy = globeSize * Math.sin(theta1) * Math.sin(phi1);
                            sz = globeSize * Math.cos(theta1);

                            theta2 = (90 - country1.lon) * Math.PI / 180;
                            phi2 = country1.lat * Math.PI / 180;
                            tx = globeSize * Math.sin(theta2) * Math.cos(phi2);
                            ty = globeSize * Math.sin(theta2) * Math.sin(phi2);
                            tz = globeSize * Math.cos(theta2);

                            dist = Math.sqrt(Math.pow(sx-tx, 2) + Math.pow(sy-ty, 2) + Math.pow(sz-tz, 2));  // 起点和终点之间的距离
                            extrude = 1 + Math.pow(dist, 2) / 40000;  // 用于确定路径中间部分的外凸程度，距离越近凸度越小
                            intrude = 0.99;
                            var S = new THREE.Vector3(sx, sy, sz);  // 起点下沉
                            segments.push(S.multiplyScalar(intrude));
                            var A = new THREE.Vector3(sx+(tx-sx)/3, sy+(ty-sy)/3, sz+(tz-sz)/3);  // 第一三分点上提
                            segments.push(A.multiplyScalar(extrude));
                            var B = new THREE.Vector3(sx+(tx-sx)*2/3, sy+(ty-sy)*2/3, sz+(tz-sz)*2/3);  // 第二三分点上提
                            segments.push(B.multiplyScalar(extrude));
                            var D = new THREE.Vector3(tx,ty,tz);  // 终点下沉
                            segments.push(D.multiplyScalar(intrude));

                            line = Spline(segments, color.getHex(), 5-j/2);  // 样条曲线
                            particleLinks.assignPositions(line.geometry.vertices, j, val.e);  // 根据样条曲线和出口总额确定飞线上粒子的数量和位置
                        }
                        if(chosenCountry==="ALL")return false;
                    }
                });
            }
        });
        links = particleLinks.getMesh();  // 返回飞线（实质是一个沿着飞线分配位置的粒子系统，在Three.js中是一个PointCloud对象）的几何形状和材质
        scene.add(links);  // 将飞线添加到场景中
    }

    /* 创建样条曲线（三维三次贝塞尔曲线） */
    function Spline(controlPoints) {  // 接受三个参数：控制点数组、十六进制颜色码、线条宽度
        var material = new THREE.LineDashedMaterial();  // 创建虚线材质（该样条曲线是一条虚拟线，提供飞线粒子位置分配的依据，不必设置材质属性）
        var colors = [];  // 顶点颜色数组
        var spline = new THREE.CubicBezierCurve3(controlPoints[0], controlPoints[1], controlPoints[2], controlPoints[3]);  // 使用控制点创建三维三次贝塞尔曲线
        var geometry = new THREE.Geometry();  // 创建一个几何体来存储曲线上的点
        var splinePoints = spline.getPoints(200);  // 获取曲线上的200个点
        for(var i = 0; i < splinePoints.length; i++) {  // 遍历获取到的这200个点
            geometry.vertices.push(splinePoints[i]);  // 将该点添加到几何体的顶点中
            colors[i] = new THREE.Color();  // 创建颜色对象
            colors[i].setHSL(0.5, 0.2, i/200);  // 设置该点颜色的HSL值
        }
        geometry.colors = colors;  // 将顶点颜色数组赋值给几何体的颜色属性
        return (new THREE.Line(geometry, material, THREE.LinePieces));  // 使用几何体和材质创建曲线对象并返回
    }

    /* 飞线动画 */
    function animateLinks(){
        particleLinks.animate();
    }

    function mouseMove(e){
        /* 获取鼠标指针在页面上位置的x和y坐标 */
        moveY = (e.clientY || e.pageY);
        moveX = (e.clientX || e.pageX);
        e.preventDefault();  // 阻止事件的默认行为
        isDragging = isClicking;  // 如果在点击时移动鼠标，则表示开始拖动鼠标

        /* 若正在拖动，则改变光标样式，并且如果当前模式是3D或"towers"，就设置相机的对准位置，然后更新鼠标的坐标 */
        if(isDragging) {
            UserInterface.changeCursor("grabbing", cameraControls.isLocked());
            if (previousMode==="3D" || currentSetup==="towers") cameraControls.setTarget(mouseCoord.x-moveX, mouseCoord.y-moveY);
            mouseCoord.x = moveX;
            mouseCoord.y = moveY;
        } else {
            if (loaded) {
                var mouseX = e.clientX / window.innerWidth * 2 - 1;
                var mouseY = - e.clientY / window.innerHeight * 2 + 1;
                vector = new THREE.Vector3(mouseX, mouseY, 0);
                var i = 1e3;
                var s = new THREE.Projector;
                var o = new THREE.Raycaster;
                if (currentSetup === "gridSphere") cameraDistance = Math.sqrt(Math.pow(camera.position.x,2) + Math.pow(camera.position.y,2) + Math.pow(camera.position.z,2));
                else cameraDistance = 3000;
                s.unprojectVector(vector, camera);
                o.ray.set(camera.position, vector.sub(camera.position).normalize());

                intersects = o.intersectObject(particleSystem);
                /* 当鼠标指针移动到相当靠近某粒子所在位置时，改变光标样式，弹出亮点提示标签并高亮显示该粒子所属国家/地区的边界线 */
                if (intersects.length > 0) {
                    for (var u = 0; u < intersects.length; u++) {
                        if (intersects[u].distanceToRay < i) {
                            i = intersects[u].distanceToRay;
                            if (this.INTERSECTED != intersects[u].index && intersects[u].distance < cameraDistance-globeSize/5) {
                                this.INTERSECTED = intersects[u].index;
                            }
                        }
                    }
                } else if (this.INTERSECTED !== null) {
                    this.INTERSECTED = null;
                    highLightCountry(null, false);
                }
                if (this.INTERSECTED) {
                    if (selectedID !== this.INTERSECTED) {
                        selectedID = this.INTERSECTED;
                    }
                    UserInterface.changeCursor("pointer");
                    $("#pointer").css({left: e.pageX+15, top: e.pageY-7});
                    $("#pointer").html("<span style='color:"+products[names[this.INTERSECTED].n].color+"'>"+countries[names[this.INTERSECTED].c].name+" 出口 "+products[names[this.INTERSECTED].n].name+"</span>");
                    highLightCountry(countries[names[this.INTERSECTED].c], true);
                } else {
                    $("#pointer").css({top: -100, left: 0});
                    UserInterface.changeCursor("default");
                    selectedID = null;
                    highLightCountry(null, false);
                }
            }
        }
    }

    function highLightCountry(country,on){
        if(countryOverlay){
            for (var i = 0; i < countryOverlay.length; i++){
                currentMesh=scene.getObjectById(countryOverlay[i],true);
                if(currentMesh){
                    currentMesh.material.linewidth=1;
                    currentMesh.material.opacity=0.6;
                }
            };
        }
        if(on){
            if(currentSetup==="gridSphere"){
                meshes=country.polygons3D;
                if(!countryOverlay)countryOverlay=[];
                for (var i = 0; i < meshes.length; i++){
                    currentMesh=globe.children[2].getObjectById(meshes[i],true);
                    currentMesh.material.linewidth=2;
                    currentMesh.material.opacity=1;
                    countryOverlay.push(meshes[i]);
                };
            }else if(currentSetup==="gridmap" || currentSetup==="towers"){
                meshes=country.polygons;
                if(!countryOverlay)countryOverlay=[];
                for (var i = 0; i < meshes.length; i++){
                    currentMesh=shape.children[0].getObjectById(meshes[i],true);
                    currentMesh.material.linewidth=2;
                    currentMesh.material.opacity=1;
                    countryOverlay.push(meshes[i]);
                };
            }
        }
    }

    function mouseDown(e){
        mouseCoord.x=e.clientX || e.pageX;
        mouseCoord.y=e.clientY || e.pageY;
        isClicking = true;
        if(names[selectedID]){
            var co=names[selectedID].c;
            $(".countrySelection").select2("val", co);
        }else{
            chosenCountry=null;
            UserInterface.changeCursor("grab",cameraControls.isLocked());
        }
    }

    /* 旋转相机使其对准选中经济体的中心点 */
    function targetCountry(co,linksOn,center){
        parseURL.update_url(currentSetup,selectedCountry);
        filterCountry=co;
        var target=countries[co];
        if(target){
            if(previousMode==="3D") {
                if(linksOn)addLinks("countries3D",co);
                if(center)cameraControls.rotate(-(target.lat * Math.PI / 180+Math.PI),-(target.lon * Math.PI / 180-Math.PI)+0.01);
            }else{
                if(linksOn)addLinks("countries2D",co);
                cameraControls.center(target.lat*1.55,target.lon*1.55,0);
            }
        }
    }

    function mousewheel( event )
    {
        var fov;
        if(event.wheelDeltaY) fov= event.wheelDeltaY*0.005;
        else fov= -event.detail/10;
        cameraControls.zoom(fov);
    }

    /* 隐藏未选中商品类别 */
    function hideCategories(){
        var v=0;
        var country=null;
        var xaxis=0;yaxis=0,total=0;
        loaded=false;
        var indexer = {};
        for (var i = 0; i < countryIndex; i++) {
            $.each(countries,function(p,o){if(i==o.id){country=o;code=p;}});
            if(country){
                for(var product in country["products"]){
                    cat=categories[products[product].color];
                    if(!indexer[products[product].color]){
                        indexer[products[product].color]=total;
                        total+=cat["total"];
                    }
                    xaxis=cat.id;
                    for(var s=0;s<Math.round(country["products"][product]/dollars);s++){
                    index=cat["total"];
                    if(!cat.active ){
                        if(previousMode==="3D"){
                            tetha=(categories[products[product].color].id)/11*Math.PI*2;
                            destination[ v * 3 + 0 ] = 3000*Math.cos(tetha);
                            destination[ v * 3 + 1 ] = 3000*Math.sin(tetha);
                            destination[ v * 3 + 2 ] = 0;
                        }else if(previousMode==="2D"){
                            destination[ v * 3 + 0 ] = (indexer[products[product].color]+Math.random()*cat["total"])/particles*window.innerWidth/4-window.innerWidth/8;
                            destination[ v * 3 + 1 ] = Math.random()*5-window.innerHeight/4.7;
                            destination[ v * 3 + 2 ] = 0;
                        }
                    }
                    v++;
                    }
                }
            }
        }
        loaded=true;
    }

    /* 视图模式切换 */
    function switcher(to, reset, incremental) {
        increment = incremental;  // 全部粒子落入地图中的目的位置所需要的时长，控制粒子排布的速度
        if(currentSetup !== to || reset) {  // 只有当需要转换视图模式或重置粒子时才会进行以下操作，否则无变化
            /* 无需重置粒子时重置相机、粒子系统和3D对象（在切换视图模式时都无需重置粒子，只有在切换商品类别时需要重置） */
            if(!reset) {
                cameraControls.reset();
                cameraControls.lockRotation(false);
                particleSystem.rotation.set(0, 0, 0);
                cameraControls.center(0, 0, 0);
                cameraSpeed = 5;
                shape.position.set(0, 0, 0);
            }

            var v = 0;

            /* 先移除场景中所有的物体（可视化元素） */
            scene.remove(globe);
            scene.remove(shape);
            scene.remove(Pgeometry);
            scene.remove(Sgeometry);
            scene.remove(links);

            Labels.resetLabels(countries);  // 重置国家/地区名称标签（恢复默认）

            switch(to){
                case "towers":  // 堆叠柱状图
                    previousMode = "2D";  // 此时的地图模式为2D模式（当前的地图模式对视图模式切换时的渲染有影响）
                    if(!reset)cameraControls.rotate(-Math.PI/2, 3*Math.PI/4);  // 将相机旋转到合适的位置（从斜上方俯视平面地图，便于观察堆叠柱）
                    scene.add(shape);  // 将平面地图添加到场景中
                    var v = 0;
                    loaded = false;  // 加载未完成标记
                    var country = null;
                    for (var i = 0; i < countryIndex; i++) {  // 遍历全部经济体
                        var xaxis = 0, yaxis = 0, zaxis = 0;  // 粒子的相对坐标（相对于当前经济体的几何地理中心位置）
                        $.each(countries, function(p, o) {if(i == o.id) {country = o; code = p;}});  // 遍历countries对象，找到id等于i的经济体并将其出口信息复制到country变量中
                        for (var j = 0; j < country.particles; j++) {  // 遍历当前经济体的全部粒子
                            /* 每个堆叠柱都是由一层层的粒子堆叠形成的，每一层都是5×5的粒子阵 */
                            if(xaxis > 5) {
                                yaxis++;
                                xaxis = 0;
                            }
                            if(yaxis > 5) {
                                zaxis++;
                                yaxis = 0;
                            }
                            /* 由粒子的相对坐标和当前经济体的几何地理中心坐标共同求出粒子目标位置的绝对坐标 */
                            destination[v * 3 + 0] = country.lat * 1.55 + (xaxis - 2.5) / 3;
                            destination[v * 3 + 1] = country.lon * 1.55 + (yaxis - 2.5) / 3;
                            destination[v * 3 + 2] = zaxis / 3;
                            v++;
                            xaxis++;
                        }
                    }
                    loaded = true;  // 加载完成标记
                    break;

                case "gridmap":  // 平面投影图
                    cameraControls.lockRotation(true);  // 在平面投影图模式下锁定相机的旋转
                    previousMode="2D";  // 此时的地图模式为2D模式
                    scene.add(shape);  // 将平面地图添加到场景中
                    var v = 0;
                    loaded = false;
                    cameraControls.center(-35, 0, 10);  // 通过调整相机对准点可以调整平面地图在屏幕中的位置
                    var country = null;
                    var xaxis = 0, yaxis = 0;

                    /* 求地理多边形几何中心函数，返回几何中心的xyz坐标+多边形周长数组 */
                    function shapeCentroid(poly) {
                        var totalx = 0, totaly = 0, totalz = 0, perimeter = 0;
                        for (var l = 0; l < poly.length; l++) {
                            totalx += poly[l].x;
                            totaly += poly[l].y;
                            totalz += poly[l].z;
                            if(l < poly.length - 1){
                                perimeter += Math.sqrt(Math.pow(poly[l].x-poly[l+1].x,2)+Math.pow(poly[l].y-poly[l+1].y,2)+Math.pow(poly[l].z-poly[l+1].z,2));
                            }
                        };
                        return [totalx/poly.length*0.7, totaly/poly.length*0.7, totalz/poly.length*0.7, perimeter];
                    }

                    for (var i = 0; i < countryIndex; i++) {
                        $.each(countries, function(p, o) {
                            if (i == o.id) {
                                country = o;
                                code = p;
                            }
                        });
                        IDs = country.polygons;
                        /* 粒子在某个国家/地区内散开的间距由其粒子密度（粒子总数/总面积）决定 */
                        var dotspacing = Math.pow(country.particles / country.area, 0.5) * 40;
                        if (IDs) {
                            var p = 0;
                            while (p < country.particles) {
                                for (var k = 0; k < IDs.length; k++) {
                                    /* 求出当前国家/地区的几何地理中心点（若是多边形组合，对其中每个多边形都要求） */
                                    var countryline = shape.children[0].getObjectById(IDs[k]);
                                    cent = shapeCentroid(countryline.geometry.vertices);

                                    /* 粒子从几何中心点向外发散分布，在保证散开间距的前提下随机置点，直至抵达多边形边界 */
                                    /* 以下涉及计算机图形学知识，代码参考GitHub@romsson */
                                    for (var j = 0; j < countryline.geometry.vertices.length - 1; j++) {
                                        r = Math.floor(Math.random() * (countryline.geometry.vertices.length - 1));
                                        vector = countryline.geometry.vertices[r];
                                        vector2 = countryline.geometry.vertices[r + 1];
                                        for (var u = 0; u < Math.sqrt(Math.pow(vector.x-vector2.x,2)+Math.pow(vector.y-vector2.y,2)+Math.pow(vector.z-vector2.z,2))/cent[3]*countryline.geometry.vertices.length; u++) {
                                            rand = Math.random();

                                            newx = - (vector.x + rand * (vector2.x - vector.x)) * 0.7;
                                            newy = (vector.z + rand * (vector2.z - vector.z)) * 0.7;
                                            newz = (vector.y + rand * (vector2.y - vector.y)) * 0.7;
                                            theta = (90 - country.lon) * Math.PI / 180;
                                            phi = country.lat * Math.PI / 180 + Math.PI / 2;
                                            rand = Math.random();
                                            newx2 = -cent[0] + (2 * Math.random() - 1) * rand;
                                            newy2 = cent[2] + (2 * Math.random() - 1) * rand;
                                            newz2 = cent[1] + (2 * Math.random() - 1) * rand;

                                            if (p < country.particles) {
                                                newpoint = {"x": newx + rand * (newx2 - newx),
                                                            "y": newy + rand * (newy2 - newy),
                                                            "z": newz + rand * (newz2 - newz)};
                                                newpoint2 = {"x": cent[0], "y": cent[2], "z": cent[1]}
                                                destination[v * 3 + 0] = - Math.round(newpoint.x * dotspacing) / dotspacing;
                                                destination[v * 3 + 2] = - Math.round(newpoint.y * dotspacing)/ dotspacing;
                                                destination[v * 3 + 1] = Math.round(newpoint.z * dotspacing) / dotspacing;
                                                v++;
                                                p++;
                                            } else {
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            for (var r = 0; r < country.particles; r++) {
                                destination[v * 3 + 0] = 0;
                                destination[v * 3 + 1] = 0;
                                destination[v * 3 + 2] = 0;
                                v++;
                            };
                        }
                    }
                    loaded = true;
                    break;

                case "gridSphere":  // 三维地球仪
                    previousMode = "3D";
                    cameraControls.globe();
                    /* 旋转相机使其对准地球仪上中国的几何地理中心点 */
                    if(!reset)cameraControls.rotate(Math.PI*0.395, Math.PI*0.808);
                    particleSystem.position.set(0, 0, 0);
                    globe.rotation.set(Math.PI/2, Math.PI/2, 0);
                    particleSystem.rotation.z = - Math.PI / 2;
                    scene.add(globe);
                    var v = 0;
                    loaded = false;
                    var theta, phi;
                    var code, country = null;

                    function shapeCentroid(poly) {
                        var totalx = 0, totaly = 0, totalz = 0, perimeter = 0;
                        for (var l = 0; l < poly.length; l++) {
                            totalx += poly[l].x;
                            totaly += poly[l].y;
                            totalz += poly[l].z;
                            if(l < poly.length - 1){
                                perimeter += Math.sqrt(Math.pow(poly[l].x-poly[l+1].x,2)+Math.pow(poly[l].y-poly[l+1].y,2)+Math.pow(poly[l].z-poly[l+1].z,2));
                            }
                        };
                        return [totalx/poly.length*0.7, totaly/poly.length*0.7, totalz/poly.length*0.7, perimeter];
                    }
                    
                    for (var i = 0; i < countryIndex; i++) {
                        $.each(countries, function(p, o) {
                            if (i == o.id) {
                                country = o;
                                code = p;
                            }
                        });
                        IDs = country.polygons3D;
                        var dotspacing = Math.pow(country.particles / country.area, 0.5) * 40;
                        if (IDs) {
                            var p = 0;
                            while (p < country.particles) {
                                for (var k = 0; k < IDs.length; k++) {
                                    var countryline = globe.children[2].getObjectById(IDs[k], true);
                                    cent=shapeCentroid(countryline.geometry.vertices);

                                    for (var j = 0; j < countryline.geometry.vertices.length - 1; j++) {
                                        r = Math.floor(Math.random() * (countryline.geometry.vertices.length - 1));
                                        vector = countryline.geometry.vertices[r];
                                        vector2 = countryline.geometry.vertices[r + 1];
                                        for (var u = 0; u < Math.sqrt(Math.pow(vector.x-vector2.x,2)+Math.pow(vector.y-vector2.y,2)+Math.pow(vector.z-vector2.z,2))/cent[3]*countryline.geometry.vertices.length; u++) {
                                            rand = Math.random();

                                            newx = - (vector.x + rand * (vector2.x - vector.x)) * 0.7;
                                            newy = (vector.z + rand * (vector2.z - vector.z)) * 0.7;
                                            newz = (vector.y + rand * (vector2.y - vector.y)) * 0.7;
                                            theta = (90 - country.lon) * Math.PI / 180;
                                            phi = country.lat * Math.PI / 180 + Math.PI / 2;
                                            rand = 0.25 + (Math.random() - 0.25) * Math.random();
                                            newx2 = -cent[0] + (2 * Math.random() - 1) * rand;
                                            newy2 = cent[2] + (2 * Math.random() - 1) * rand;
                                            newz2 = cent[1] + (2 * Math.random() - 1) * rand;

                                            if (p < country.particles) {
                                                newpoint = {"x": newx + rand * (newx2 - newx),
                                                            "y": newy + rand * (newy2 - newy),
                                                            "z": newz + rand * (newz2 - newz)};
                                                len = Math.sqrt(newpoint.x * newpoint.x + newpoint.y * newpoint.y + newpoint.z * newpoint.z);
                                                newpoint.x *= globeSize / len;
                                                newpoint.y *= globeSize / len;
                                                newpoint.z *= globeSize / len;
                                                newpoint2 = {"x": cent[0], "y": cent[2], "z": cent[1]}
                                                destination[v * 3 + 0] = Math.round(newpoint.x*dotspacing)/dotspacing;
                                                destination[v * 3 + 1] = Math.round(newpoint.y*dotspacing)/dotspacing;
                                                destination[v * 3 + 2] = Math.round(newpoint.z*dotspacing)/dotspacing;
                                                v++;
                                                p++;
                                            } else {
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            for (var r = 0; r < country.particles; r++) {
                                destination[v * 3 + 0] = 0;
                                destination[v * 3 + 1] = 0;
                                destination[v * 3 + 2] = 0;
                                v++;
                            };
                        }
                    }
                    loaded = true;
                    break;
            }
        }
        particlesPlaced = 0;
        currentSetup = to;  // 修改为当前模式
        hideCategories();  // 隐藏非选中类别
    }

    $("#UI").on("click",".modeSelector",function(){
        $(".modeSelector").removeClass("selectedMode");
        $(this).addClass("selectedMode");
            switch($(this).prop('id')){
                case "towersButton":switcher("towers",false,5);break;  // Country Stacks（国家堆叠视图）按钮
                case "gridSphereButton":switcher("gridSphere",false,5);break;  // Globe View（三维地球仪视图）按钮
                case "gridButton":switcher("gridmap",false,5);break;  // Map View（二维平面地图视图）按钮
            }
    });

    $("#categories").on("click",".chooseCategory",function(){
        var id=$(this).prop("id");
        id=id.substring(3,id.length);
        IDcode=parseInt(id);
        var reset=false;
        $.each(categories,function(a,b){
            if(IDcode===b.id){
                if(b.active)reset=true;
                b.active=true;
            }else{
                if(b.active)reset=false;
                b.active=false;
            }
        });
        $.each(categories,function(a,b){
            if(reset){
                b.active=true;
                $("#cat"+b.id).removeClass("categorySelected");
            }else{
            if(b.active){
                $("#cat"+b.id).addClass("categorySelected");
            }
            else{
                $("#cat"+b.id).removeClass("categorySelected");
            }
            }
        });
        switcher(currentSetup,true,5);
    });

    $("#countries").on('click','.chosenCountry',function(){
        $(".countrySelection").select2("val", $(this).prop('id'));
    });

    $("#countries").on('mouseout','.chosenCountry',function(){
        hoverHTML=$(this).html();
        $(this).html(hoverHTML.substring(0,hoverHTML.length-8));
    });

    $("#countries").on('mouseover','.chosenCountry',function(){
        hoverHTML=$(this).html();
        hoverHTML+="(点击单独查看)";
        $(this).html(hoverHTML);

        selectedCountry=$(this).prop("id");
        highLightCountry(countries[selectedCountry],true);

        $("#pointer").css({top:-100,left:0});
    });

    $('.title').click(function(){
        positions=geometry.attributes.position.array;
        for (var v = 0; v < particles; v++) {
            positions[v*3+2]=3000;
        };
        increment=3;
    });

    $("#brighter").click(function(){
        if(!bright){
            $(this).html("暗&emsp;淡&emsp;模&emsp;式");
            bright=true;
            constantSize=true;
            changePointSize(3);
            lines=shape.children[0];
            for (var i = 0; i < lines.children.length; i++) {lines.children[i].material.linewidth=6};
            lines=globe.children[2];
            for (var i = 0; i < lines.children.length; i++) {lines.children[i].material.linewidth=6};
        }else{
            $(this).html("明&emsp;亮&emsp;模&emsp;式");
            bright=false;
            constantSize=false;
            lines=shape.children[0];
            for (var i = 0; i < lines.children.length; i++) {lines.children[i].material.linewidth=2};
            lines=globe.children[2];
            for (var i = 0; i < lines.children.length; i++) {lines.children[i].material.linewidth=2};
            animatePointSize(true);
        }
    })

    function animatePointSize(reset){
        if(!constantSize){
            if(previousMode==="2D")testZoom=Math.round(Math.log(431-particleSystem.position.z));
            else{
                zoom=Math.sqrt(Math.pow(camera.position.x,2)+Math.pow(camera.position.y,2)+Math.pow(camera.position.z,2));
                testZoom=Math.round(Math.log(zoom-globeSize-20));
            }
            levels=[0.23,0.23,0.4,0.8,1,1.3,1.35,1.38,1.4,1.41,1.413,1.4];
            if(testZoom!==currentZoom || reset){
                currentZoom=testZoom;
                var sizes = geometry.attributes.size.array;
                for(var v=0;v<particles/percentage;v++){
                    sizes[ v ] = levels[currentZoom];
                }
            geometry.attributes.size.needsUpdate = true;
            }
        }
    }

    function changePointSize(size){
        var sizes = geometry.attributes.size.array;
        for(var v=0; v<particles/percentage; v++){
            sizes[v] = size;
        }
        geometry.attributes.size.needsUpdate = true;
    }

    function animate() {
        if (Labels) Labels.animateLabels(countries, geometry, currentSetup, particleSystem);  // 初始化地名标签动画
        if (loaded) {  // 数据加载完成后
            if (links) links.position.set(particleSystem.position.x, particleSystem.position.y, particleSystem.position.z);
            animateLinks();  // 初始化地球飞线动画
            var positions = geometry.attributes.position.array;
            error = 0.2;  // 目的位置与当前位置之间的目标最大误差
            var a = false, b = false, c = false, fin = true;
            if (increment > 0) {
                for (var v = 0; v < particles / percentage; v++) {
                    a = false, b = false, c = false;
                    easing = 0.2 + (v % 1000) / 1000;  // 缓动，粒子降落的速度逐渐减缓
                    /* 逐步调整每个粒子的位置，直至目的位置与当前位置在误差允许范围内“大致”重合 */
                    if (Math.abs(positions[v*3]-destination[v*3]) > error) positions[v*3] += (destination[v*3] - positions[v*3]) / increment * easing;
                    else {
                        positions[v * 3] = destination[v * 3];
                        a = true;
                    }
                    if (Math.abs(positions[v*3+1]-destination[v*3+1]) > error) positions[v*3+1] += (destination[v*3+1] - positions[v*3+1]) / increment * easing;
                    else {
                        positions[v * 3 + 1] = destination[v * 3 + 1];
                        b = true;
                    }
                    if (Math.abs(positions[v*3+2]-destination[v*3+2]) > error) positions[v*3+2] += (destination[v*3+2] - positions[v*3+2]) / increment * easing;
                    else {
                        positions[v * 3 + 2] = destination[v * 3 + 2];
                        c = true;
                    }
                    if (a && b && c) {
                        particlesPlaced++;
                    } else {fin = false;}
                }
                /* 当粒子全部降落到误差允许范围内的位置后，直接将粒子放置到“确切的”目标位置上 */
                if (fin) {
                    increment = 0;
                    for (var v = 0; v < particles; v++) {
                        positions[v * 3] = destination[v * 3];
                        positions[v * 3 + 1] = destination[v * 3 + 1];
                        positions[v * 3 + 2] = destination[v * 3 + 2];
                    }
                }
                animateOverlay(particlesPlaced / particles);  // 降落的粒子数量越多，地球仪越“亮”
            } else {
                animateOverlay(0);
            }
            geometry.attributes.position.needsUpdate = true;  // 设置几何体的位置属性需要更新
            animatePointSize(false);  // 不调整粒子（亮点）的大小（“亮度”），维持暗淡模式
	   }
        cameraControls.update();  // 更新相机控制器的状态
		renderer.render(scene, camera);  // 使用给定的场景和相机渲染一帧
		requestAnimationFrame(animate);  // 请求浏览器在下一帧调用animate函数进行“重绘”（更新），以创建连续的动画
    }
}