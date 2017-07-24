(function() {
	let lastTime = 0;
	let vendors = ['webkit', 'moz'];
	for(let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
	    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // name has changed in Webkit
	                                  window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
	    window.requestAnimationFrame = function(callback, element) {
	        let currTime = new Date().getTime();
	        let timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
	        let id = window.setTimeout(function() {
	            callback(currTime + timeToCall);
	        }, timeToCall);
	        lastTime = currTime + timeToCall;
	        return id;
	    };
	}
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
	    	clearTimeout(id);
		};
	}
}());
const Tween = {
	ease: function(t, b, c, d){
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	back: function(t, b, c, d, s){
		if (typeof s == 'undefined') {
			s = 1.10158;  //回缩的距离
		}
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	}
}
class mScroll {
	constructor(init){
		this.dir = "y";
		for(let s in  init){
			this[s] = init[s];
		}
		this.swiper = this.wrap.children[0];
		let attrMin = this.dir == "x"?"minWidth":"minHeight";
		this.swiper.style[attrMin] = "100%";
		this.initial();
		this.addEv();
	}
	initial(){
		let _this = this;
		this.attr = {
			x: "translateX",
			y: "translateY"
		};
		this.scroll = {};
		this.translate(this.setDir(),0);
		this.translate('translateZ',0);
		this.startPoint = {};
		this.lastPoint = {};
		this.lastDis = {};
		this.lastTime = 0;
		this.lastTimeDis = 0;
		this.startScroll = 0;
		this.F = .2;
		this.isMove = {
			x: false,
			y: false
		};
		this.isFirst = true;
		this.fnStart = function(e){
			_this.toStart(e);
		};
		this.fnMove = function(e){
			_this.toMove(e);
		};
		this.fnEnd = function(e){
			_this.toEnd(e);
		};
		this.addEv();
	}
	toStart(e){
		this.start&&this.start(e);
		this.reset();
		this.startPoint = this.getTouch(e);
		this.lastPoint = this.getTouch(e);
		this.startScroll = this.getScroll();
	}
	toMove(e){
		let nowPoint = this.getTouch(e);
		let nowTime = Date.now();
		this.lastDis = this.getDis(nowPoint,this.lastPoint);
		if(!this.lastDis.x && !this.lastDis.y){
			return;
		}
		let dis = this.getDis(nowPoint,this.startPoint);
		if(this.isFirst){
			this.getDir(dis);
		}
		let target = this.toOver(this.startScroll + dis[this.dir],"move");
		this.isMove[this.dir]&&(this.translate(this.setDir(),target));
		this.move&&this.move(e);
		this.lastTimeDis = nowTime - this.lastTime;
		this.lastTime = nowTime;
		this.lastPoint = this.getTouch(e);
	}
	toEnd(e){
		let speed = this.getSpeed();
		let target = this.getTarget(speed);
		let nowTarget = this.toOver(target,"end");
		let type = "ease";
		if(nowTarget != target){
			type = "back";
		}
		let time = this.getTime(target,type);
		let _this = this;
		let init = {
			type: type,
			time: time,
			target: {
				[this.setDir()]:nowTarget
			},
			callIn: function(){
				_this.move&&_this.move();
			},
			callBack: function(){
				_this.over&&_this.over();
			}
		};
		this.animation(init);
		this.end&&this.end();
	}
	setDir(){
		return this.attr[this.dir];
	}
	toOver(target,type){
		if(target > 0){
			return type == 'move'?target*this.F:0;
		}
		if(target < this.min[this.dir]) {
			let over = target - this.min[this.dir];
			over *= this.F;
			return  type == 'move'? this.min[this.dir] + over:this.min[this.dir];
		}
		return target;
	}
	addEv(){
		this.wrap.addEventListener('touchstart', this.fnStart);
		this.wrap.addEventListener('touchmove', this.fnMove);
		this.wrap.addEventListener('touchend', this.fnEnd);
	}
	removeEv(){
		this.wrap.removeEventListener('touchstart', this.fnStart);
		this.wrap.removeEventListener('touchmove', this.fnMove);
		this.wrap.removeEventListener('touchend', this.fnEnd);
	}
	reset(){
		this.setMin();
		this.isFirst = true;
		this.lastTime = Date.now();
		this.isMove = {
			x: false,
			y: false,
		}
		this.lastTimeDis  = 0;
		this.lastDis = {
			x:0,
			y:0
		}
	}
	setMin(){
		this.min = {
			x: parseInt(this.css(this.wrap,"width")) - parseInt(this.css(this.swiper,"width")),
			y: parseInt(this.css(this.wrap,"height")) - parseInt(this.css(this.swiper,"height"))
		}
	}
	getScroll(){
		return this.translate(this.setDir());
	}
	getTouch(e) {
		return {
			x:Math.round(e.changedTouches[0].pageX),
			y:Math.round(e.changedTouches[0].pageY)
		};
	}
	getDis(point1,point2){
		return {
			x: point1.x - point2.x,
			y: point1.y - point2.y
		}
	}
	getDir(dis){
		if(Math.abs(dis.x) - Math.abs(dis.y) > 2){
			this.isMove.x = true;
			this.isFrist = false;
		} else if(Math.abs(dis.y) - Math.abs(dis.x) > 2){
			this.isMove.y = true;
			this.isFrist = false;
		}
	}
	getSpeed(){
		let nowTime = Date.now();
		if(nowTime - this.lastTime > 100||!this.lastTimeDis){
			return 0;
		}
		return this.lastDis[this.dir]/this.lastTimeDis;
	}
	getTarget(speed) {
		let f = .02; 
		let s = Math.round(speed*speed/(2*f));
		s = speed>0?s:-s;
		return this.getScroll()+s;
	}
	getTime(target,type){
		let dis = Math.abs(target - this.getScroll());
		let time = type == "ease"?dis*1.1:dis*1.2;
		return (time < 200 && time > 0)?200:time;  
	}
	css(el,attr,val){
		if(arguments.length == 2){
			val = getComputedStyle(el)[attr];
			return parseFloat(val);
		} else {
			if(attr == "opacity"){
				el.style.opacity = val/100;
			} else {
				el.style[attr] = val + "px";
			}
		}
	}
	translate(attr,val) {
		let el = this.swiper;
		if(typeof val == "undefined"){
			return this.scroll[attr];
		}else {
			this.scroll[attr] = val;
			let value = "";
			for(let s in this.scroll){	
				value += (s+"("+this.scroll[s]+"px) ");	
			}
			this.swiper.style.WebkitTransform = value;
			this.swiper.style.transform = value;
		}
	}
	animation(init){
		this.animationStop();
		let {type,time,target,callBack,callIn} = init;
		let t = 0; 
		let b = {};
		let c = {};
		let d = Math.ceil(time/20);
		let _this = this;
		for( let s in target){ 
			b[s] = this.translate(s);
			c[s] = target[s] - b[s];
		} 
		this.timer = requestAnimationFrame(move);
		function move(){
			t++;
			if(t > d){
				_this.animationStop()
				callBack&&callBack();
			} else {
				for(let s in target){
					let val = Tween[type](t,b[s],c[s],d);
					_this.translate(s,val);
				}
				callIn&&callIn();
				_this.timer = requestAnimationFrame(move);
			}
		}
	}
	animationStop(){
		cancelAnimationFrame(this.timer);
	}
}