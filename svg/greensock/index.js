Draggable.create(".icon", {
    type:"x,y",
    bounds:"svg",
    onDrag: function(){
      if (this.hitTest("#bag")){
        TweenLite.to(this.target, 1, {scale:0, opacity:0, svgOrigin:"675px 143px"});
      }
    }
  })