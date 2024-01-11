function LabelManager(countries) {
	this.showlabels = false;  // 默认（初始状态下）不显示国家/地区名称标签
    myThis = this;
    this.globeSize = 150;  // 设置地球仪大小

    $("#showLabels").click(function() {
        if (!myThis.showlabels) {
            $("#showLabels").html('<a href="#">隐&emsp;藏&emsp;地&emsp;名</a>');
            myThis.showlabels = true;
        } else {
            $("#showLabels").html('<a href="#">显&emsp;示&emsp;地&emsp;名</a>');
            myThis.showlabels = false;
        }
    });

    /* 创建国家/地区名称标签HTML元素 */
    countryHTML = "";
    $.each(countries, function(co, country) {
        countryHTML += "<a href='#' class='chosenCountry' id='" + co + "'>" + country.name + "</a><br/>";
    });
    $("#countries").html(countryHTML);
};

/* 重置（恢复默认）方法，即显示全部地名标签并恢复到默认字体大小 */
LabelManager.prototype.resetLabels = function(countries) {
    $.each(countries, function(c, co) {
        $("#" + c).css({'font-size': 10, 'color': '#FFFFFF', 'z-index': 2, 'opacity': 1});
    });
};

/* 由3D场景切换为2D场景时标签位置坐标的变化（球面转平面） */
LabelManager.prototype.toScreenXY = function(id, country, particleSystem) {
    var p = new THREE.Vector3(
        country.lat * 1.55 + particleSystem.position.x,
        country.lon * 1.55 + particleSystem.position.y,
        particleSystem.position.z
    );
    projScreenMat = new THREE.Matrix4;
    projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    p.applyProjection(projScreenMat);
    var ID = "#" + id;
    var labelWidth = $(ID).width();
    $(ID).css({
        top: - p.y * window.innerHeight / 2 + window.innerHeight / 2 - 3,
        left: p.x * window.innerWidth / 2 + window.innerWidth / 2 - labelWidth / 2
    });
};

/* 由2D场景切换为3D场景时标签位置坐标的变化（平面转球面） */
LabelManager.prototype.toScreenXYZ = function(id, country, geometry) {
    var theta = (90 - country.lon) * Math.PI / 180;
    var phi = country.lat * Math.PI / 180;
    var x = this.globeSize * Math.sin(theta) * Math.cos(phi);
    var y = this.globeSize * Math.sin(theta) * Math.sin(phi);
    var z = this.globeSize * Math.cos(theta);
    var cameraRay = Math.sqrt(Math.pow(camera.position.x,2)+Math.pow(camera.position.y,2)+Math.pow(camera.position.z,2));
    if (cameraRay > Math.sqrt(Math.pow(camera.position.x-x,2)+Math.pow(camera.position.y-y,2)+Math.pow(camera.position.z-z,2))+this.globeSize/4) {
        var p = new THREE.Vector3(x, y, z);
        projScreenMat = new THREE.Matrix4;
        projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        p.applyProjection(projScreenMat);
        var ID = "#" + id;
        var labelWidth = $(ID).width();
        $(ID).css({
            top: Math.round(- p.y * window.innerHeight / 2 + window.innerHeight / 2 - 3),
            left: Math.round(p.x * window.innerWidth / 2 + window.innerWidth / 2 - labelWidth / 2)
        });
    } else {
        var ID = "#" + id;
        $(ID).css({top: -100, left: 0});
    }
};

/* 视图模式（2D/3D）切换时标签位置变化的动画效果 */
LabelManager.prototype.animateLabels = function(countries,geometry,currentSetup,particleSystem){
    myThis = this;
    if (this.showlabels) {
        switch(currentSetup) {
            case "gridmap":
            case "towers":
                $.each(countries, function(index, co) {
                    myThis.toScreenXY(index, co, particleSystem);
                });
                break;
            case "gridSphere":
                $.each(countries, function(index, co) {
                    myThis.toScreenXYZ(index, co, geometry);
                });
                break;
            default:
                $.each(countries, function(index, co) {
                    $("#" + index).css({top: -100});
                });
                break;
        }
    } else {
        $.each(countries, function(index, co) {
            $("#" + index).css({top: -100});
        });
    }
};