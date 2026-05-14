function LabelManager(countries){
	this.showlabels=true;
    myThis=this;
    this.globeSize=150;
    this.capitals={
        AE:{lat:24.4539,lon:54.3773}, AR:{lat:-34.6037,lon:-58.3816}, AT:{lat:48.2082,lon:16.3738},
        AU:{lat:-35.2809,lon:149.13}, BE:{lat:50.8503,lon:4.3517}, BR:{lat:-15.7939,lon:-47.8828},
        CA:{lat:45.4215,lon:-75.6972}, CH:{lat:46.948,lon:7.4474}, CL:{lat:-33.4489,lon:-70.6693},
        CN:{lat:39.9042,lon:116.4074}, CO:{lat:4.711,lon:-74.0721}, CZ:{lat:50.0755,lon:14.4378},
        DE:{lat:52.52,lon:13.405}, DK:{lat:55.6761,lon:12.5683}, ES:{lat:40.4168,lon:-3.7038},
        FI:{lat:60.1699,lon:24.9384}, FR:{lat:48.8566,lon:2.3522}, GB:{lat:51.5074,lon:-0.1278},
        GR:{lat:37.9838,lon:23.7275}, HK:{lat:22.3193,lon:114.1694}, HU:{lat:47.4979,lon:19.0402},
        IE:{lat:53.3498,lon:-6.2603}, IL:{lat:31.7683,lon:35.2137}, IN:{lat:28.6139,lon:77.209},
        IT:{lat:41.9028,lon:12.4964}, JP:{lat:35.6762,lon:139.6503}, KR:{lat:37.5665,lon:126.978},
        LU:{lat:49.6116,lon:6.1319}, MX:{lat:19.4326,lon:-99.1332}, NL:{lat:52.3676,lon:4.9041},
        NO:{lat:59.9139,lon:10.7522}, NZ:{lat:-41.2865,lon:174.7762}, PL:{lat:52.2297,lon:21.0122},
        PT:{lat:38.7223,lon:-9.1393}, RO:{lat:44.4268,lon:26.1025}, RU:{lat:55.7558,lon:37.6173},
        SA:{lat:24.7136,lon:46.6753}, SE:{lat:59.3293,lon:18.0686}, SG:{lat:1.3521,lon:103.8198},
        TH:{lat:13.7563,lon:100.5018}, TR:{lat:39.9334,lon:32.8597}, TW:{lat:25.033,lon:121.5654},
        UA:{lat:50.4501,lon:30.5234}, US:{lat:38.9072,lon:-77.0369}, ZA:{lat:-25.7479,lon:28.2293}
    };

    $("#showLabels").click(function() {
    if(typeof window.isProductView==="function" && window.isProductView()){
        if(typeof window.setProductLabelsVisible==="function")window.setProductLabelsVisible(!window.showProductLabels);
        return;
    }
    if (!myThis.showlabels) {
        $("#showLabels").html('隐&emsp;藏&emsp;地&emsp;名');
        myThis.showlabels = true;
    } else {
        $("#showLabels").html('显&emsp;示&emsp;地&emsp;名');
        myThis.showlabels = false;
    }
    });

    countryHTML="";
    $.each(countries,function(co,country){
         countryHTML+="<a href='#' class='chosenCountry' id='"+co+"'>"+country.name+"</a><br/>";
    });        
    $("#countries").html(countryHTML);
	};

LabelManager.prototype.labelLatLon = function(id,country){
    if(this.capitals[id])return this.capitals[id];
    var list=(window.anchors && window.anchors[id]) || [];
    if(list.length){
        var best=list[0];
        for(var i=1;i<list.length;i++){
            if(Number(list[i].pop || 0)>Number(best.pop || 0))best=list[i];
        }
        return {lat:Number(best.lat),lon:Number(best.lon)};
    }
    return {lat:country.lon,lon:country.lat};
};

LabelManager.prototype.resetLabels = function(countries){
    $.each(countries,function(c,co){
        $("#"+c).css({'font-size':10,'color':'#FFFFFF','z-index':2,'opacity':1});
    });
};
LabelManager.prototype.toScreenXY = function(id,country,particleSystem){
    var positions = geometry.attributes.position.array;
    var point=this.labelLatLon(id,country);

    var p = new THREE.Vector3(point.lon*1.55+particleSystem.position.x,point.lat*1.55+particleSystem.position.y, particleSystem.position.z);
    projScreenMat = new THREE.Matrix4;
    projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    p.applyProjection(projScreenMat);
    var ID="#"+id;  
    var labelWidth=$(ID).width();
    $(ID).css({top: -p.y * window.innerHeight / 2 + window.innerHeight / 2-3,left:p.x * window.innerWidth / 2 + window.innerWidth / 2 -labelWidth/2});
};

LabelManager.prototype.toScreenXYZ = function(id,country,geometry){
    var positions = geometry.attributes.position.array;
    var point=this.labelLatLon(id,country);
    var theta = (90 - point.lat) * Math.PI / 180;
    var phi = ( point.lon) * Math.PI / 180;
    var x=this.globeSize * Math.sin(theta) * Math.cos(phi);
    var y=this.globeSize * Math.sin(theta) * Math.sin(phi);
    var z=this.globeSize * Math.cos(theta);
    var cameraRay=Math.sqrt(Math.pow(camera.position.x,2)+Math.pow(camera.position.y,2)+Math.pow(camera.position.z,2));
    if(cameraRay>Math.sqrt(Math.pow(camera.position.x-x,2)+Math.pow(camera.position.y-y,2)+Math.pow(camera.position.z-z,2))+this.globeSize/4){
    var p = new THREE.Vector3(x,y, z);
    projScreenMat = new THREE.Matrix4;
    projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    p.applyProjection(projScreenMat);
    var ID="#"+id;
    var labelWidth=$(ID).width();
    $(ID).css({top: Math.round(-p.y * window.innerHeight / 2 + window.innerHeight / 2-3),left:Math.round(p.x * window.innerWidth / 2 + window.innerWidth / 2 -labelWidth/2)});
    }else{
    var ID="#"+id;
    $(ID).css({top: -100,left:0});
    }
};

LabelManager.prototype.setLabels = function(show){
    this.showlabels=show;
};

LabelManager.prototype.animateLabels = function(countries,geometry,currentSetup,particleSystem){
    myThis=this;
    if(this.showlabels ){
    switch(currentSetup){
        case "cities":
        case "probability":
        case "gridmap":
        case "towers":
        $.each(countries,function(index,co){
            myThis.toScreenXY(index,co,particleSystem);
        });
        break;
        case "globe":
        case "probability3D":
        case "gridSphere":
        $.each(countries,function(index,co){
            myThis.toScreenXYZ(index,co,geometry);
        });
        break;
        default:
        $.each(countries,function(index,co){
            $("#"+index).css({top:-100});
        });
        break;
    }
    }else{
         $.each(countries,function(index,co){
            $("#"+index).css({top:-100});
        });
    }
    
};
