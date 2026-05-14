function UI() {
    this.fullscreen = false;
    this.showabout = false;
    myThis = this;
    this.loading=0;
    $(document).keyup(function(e) {
        switch (e.which) {
            case 37: 

                break;
            case 27:
                THREEx.FullScreen.cancel();
                $("#fullscreen").html('全&emsp;屏&emsp;模&emsp;式');
                myThis.fullscreen = false;
                break;
            default:
                return; 
        }
    });
    $(window).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(e) {
            var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
            if(!state){
                $("#fullscreen").html('全&emsp;屏&emsp;模&emsp;式');
                myThis.fullscreen = false;
                THREEx.FullScreen.cancel();
            }  
    });


    $("#fullscreen").click(function() {
        if (!myThis.fullscreen) {
            THREEx.FullScreen.request(document.body);
            $("#fullscreen").html('窗&emsp;口&emsp;模&emsp;式');
            myThis.fullscreen = true;
        } else {
            THREEx.FullScreen.cancel();
            $("#fullscreen").html('全&emsp;屏&emsp;模&emsp;式');
            myThis.fullscreen = false;
        }
    });

    ring=true;
    buttons = [];
    divX = 45;
    divY = 60;
    step = 30;
    ring = false;
    //buttons.push({"id":"groupButton","title":"Group by Product","img":"images/stack_icon.png"});
    buttons.push({
        "id": "gridSphereButton",
        "title": "地球仪",
        "img": "images/globe_icon.png",
        "desc": ""
    });
    buttons.push({
        "id": "gridButton",
        "title": "平面地图",
        "img": "images/map_icon.png",
        "desc": ""
    });
    buttons.push({
        "id": "towersButton",
        "title": "国家堆叠",
        "img": "images/stack_icon.png",
        "desc": ""
    });
    buttons.push({
        "id": "productButton3",
        "title": "3D技术网络",
        "img": "images/3dgraph_icon.png",
        "desc": ""
    });
    buttons.push({
        "id": "productButton",
        "title": "2D技术网络",
        "img": "images/2dgraph_icon.png",
        "desc": ""
    });
    buttons.push({
        "id": "productButton2",
        "title": "技术堆叠",
        "img": "images/techstack_icon.png",
        "desc": ""
    });

    newDiv="<table>";
    for (var i = 0; i < buttons.length; i++) {
        option = buttons[i];
        option.rank=i;
        angle = 0;
        if(i%3==0 && i>0){
            newDiv+="</tr><tr>"
        }
        newDiv += "<td><div class='modeSelector' style='-webkit-transform: rotateY(" + angle + "deg);transform: rotateY(" + angle + "deg);'id='" + option.id + "'><img src='" + option.img + "'/><div class='optionTitle'>" + option.title + "</div></div></td>";
    }
    newDiv+="</tr></table>";

    $("#visualizations").html(newDiv);

    $("#gridSphereButton").addClass("selectedMode");

};
UI.prototype.addSpinner = function(){
var opts = {
  lines: 17 // The number of lines to draw
, length: 0 // The length of each line
, width: 1 // The line thickness
, radius: 84 // The radius of the inner circle
, scale: 3.5 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: '#FFF' // #rgb or #rrggbb or array of colors
, opacity: 0 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 99 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: 'spinner' // The CSS class to assign to the spinner
, top: '50%' // Top position relative to parent
, left: '50%' // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: 'absolute' // Element positioning
}
var target = document.getElementById('spinner')
var spinner = new Spinner(opts).spin(target);

}
UI.prototype.buildCategories= function(categories){
    var catHTML="<table><tr>";
    $.each(categories,function(i,val){
            color=new THREE.Color(i);
            rgba="rgba("+Math.round(color.r*295)+","+Math.round(color.g*295)+","+Math.round(color.b*295)+",0.8)";
            //catHTML+="<td class='categoryButton' style='-webkit-box-shadow: inset 0px -12px 15px -2px  "+rgba+"; -moz-box-shadow: inset 0px -12px 15px -2px  "+rgba+"; box-shadow: inset 0px -12px 15px -2px  "+rgba+";'><div id=cat"+val.id+" class='chooseCategory'>"+cats[val.id]+" </div></td>";
            catHTML+="<td class='categoryButton' style='border-top:8px solid "+rgba+" ;'><div id=cat"+val.id+" class='chooseCategory'>"+val.name+" </div></td>";
        });
        $("#categories").html(catHTML+"</tr></table>");
};
UI.prototype.updateLoader = function(add){
    this.loading+=add;
    percentage=this.loading;
    $("#loadingBar").animate({'width':percentage/100*500},100);
}
UI.prototype.createProductBox = function(products) {
    var html='<select class="productSelection"><option value="null" selected="selected">选择低碳技术子类</option>';
    var list=[];
    $.each(products,function(i,val){list.push(val);});
    list.sort(function(a,b){return String(a.atlasid).localeCompare(String(b.atlasid));});
    $.each(list,function(i,val){
        html+="<option value ='"+escapeHtml(val.atlasid)+"'>"+escapeHtml(val.atlasid+" - "+val.name)+"</option>";
    });
    html+="</select>";
    $(".productBox").html(html);
    $(".productSelection").select2({placeholder: "选择低碳技术子类",allowClear: true});
    
};

function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(char){
        return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char];
    });
}

UI.prototype.changeCursor = function(type,blocked){
    $('body').removeClass("grab");
    $('body').removeClass("grabbing");
    switch(type){
        case "grab":
        if(blocked)$('body').css({"cursor":"not-allowed"});
        else $('body').addClass("grab");
        break;
        case "grabbing":
        if(blocked)$('body').css({"cursor":"not-allowed"});
        else $('body').addClass("grabbing");
        break;
        case "default":
        case "pointer":
        default:
        $('body').css({"cursor":type});
        break;
    }
    
};

UI.prototype.createSelectionBox = function(countries) {
    var html='<select class="countrySelection"><option value="null" selected="selected">选择国家或地区</option>';

    $.each(countries,function(i,val){
        html+="<option value ='"+i+"'>"+val.name+"</option>";
    });
    html+="</select>";
    $(".selectionBox").html(html);
    $(".countrySelection").select2({placeholder: "选择国家或地区",allowClear: true});
    
};
