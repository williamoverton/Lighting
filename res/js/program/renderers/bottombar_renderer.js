const debug = require('debug')("li:client:program:renderers:bottombar");
const remote = require('electron').remote;
const app = remote.getGlobal('app_main');
const color = require("color");

BottomBarRenderer = function(parent) {
	this.parent = parent;

	this.init()
}

BottomBarRenderer.prototype.init = function() {
	debug("init...");

	this.editorPoints = [];

	this.pointWidth = 10;

}

BottomBarRenderer.prototype.buildGraphics = function() {
	/**
	 * Bottom Bar graphics
	 * @type {PIXI}
	 */
	this.bbg = new PIXI.Graphics();
	this.bbg.interactive = true;
	this.parent.stage.addChild(this.bbg);

	this.bblc = new PIXI.Container();
	this.parent.stage.addChild(this.bblc);

	this.bbpc = new PIXI.Container();
	this.parent.stage.addChild(this.bbpc);
}

BottomBarRenderer.prototype.buildCursor = function() {
	this.cg = new PIXI.Graphics();
	this.parent.stage.addChild(this.cg);

	this.cursor = {
		pos: 0
	}
}

BottomBarRenderer.prototype.drawCursor = function() {

	var width = this.parent.width - this.parent.parent.options.leftSideWidth - this.parent.parent.options.rightSideWidth - this.timelineScrollBarWidth;
	var cursorMoveTime = this.parent.parent.options.bars * 60 / this.parent.parent.options.bpm * 4

	this.cursor.pos = ((this.parent.parent.time / 1000) % cursorMoveTime) * (100 / cursorMoveTime)

	this.cg.clear();
	this.cg.beginFill(0xdd2222);
	this.cg.drawRect(this.parent.parent.options.leftSideWidth + (width * (this.cursor.pos / 100)), 0, 1, this.timelineHeight);
	this.cg.endFill();

	app.dmx.set({
		1: {
			0: (Math.sin(this.cursor.pos / 100 * Math.PI * 2) * 64) + 128,
			1: (Math.cos(this.cursor.pos / 100 * Math.PI * 2) * 64) + 128,
			2: 250, //this.cursor.pos * 2.54,
			3: (this.parent.parent.options.running ? 50 : 30),
			4: (this.parent.parent.options.running ? 50 : 30),
		}
	})

}

BottomBarRenderer.prototype.redraw = function() {
	this.draw();
}

BottomBarRenderer.prototype.draw = function() {

	debug("Drawing Bottom bar")

	this.bbg.clear();

	if (!this.parent.selectedPattern) {
		this.bbg.beginFill(0x222222);
		this.bbg.drawRect(this.parent.parent.options.leftSideWidth, this.parent.timelineRenderer.timelineHeight, this.parent.width - this.parent.parent.options.leftSideWidth, this.parent.bottomBarHeight);
		this.bbg.endFill();
		return;
	}

	var background = color(this.parent.selectedPattern.colour);
	background.darken(0.8);

	this.bbg.beginFill(parseInt(background.hexString().substring(1), 16));
	this.bbg.drawRect(this.parent.parent.options.leftSideWidth, this.parent.timelineRenderer.timelineHeight, this.parent.width - this.parent.parent.options.leftSideWidth, this.parent.bottomBarHeight);
	this.bbg.endFill();

	this.drawPatternLines();
	this.drawPatternPoints();

}

BottomBarRenderer.prototype.drawPatternLines = function() {

	for (var i = this.bblc.children.length - 1; i >= 0; i--) {
		this.bblc.removeChild(this.bblc.children[i]);
	};

	var pattern = this.parent.selectedPattern.pattern;

	var lineColour = color(this.parent.selectedPattern.colour).darken(0.3);

	var width = this.parent.width - this.parent.parent.options.leftSideWidth - this.pointWidth;
	var xPad = this.parent.parent.options.leftSideWidth;

	for (var i = 0; i < pattern.nodes.length - 1; i++) {
		var line = new PIXI.Graphics().lineStyle(1, parseInt(lineColour.hexString().substring(1), 16));

		line.moveTo((this.pointWidth / 2) + xPad + ((pattern.nodes[i].x / 100) * width), this.parent.height - ((this.parent.bottomBarHeight - this.pointWidth) * (pattern.nodes[i].y / 100)) - (this.pointWidth / 2));
		line.lineTo((this.pointWidth / 2) + xPad + ((pattern.nodes[i + 1].x / 100) * width), this.parent.height - ((this.parent.bottomBarHeight - this.pointWidth) * (pattern.nodes[i + 1].y / 100)) - (this.pointWidth / 2));

		this.bblc.addChild(line);
	}
}

BottomBarRenderer.prototype.drawPatternPoints = function() {

	/**
	 * Clearup editor points
	 */
	for (var i = 0; i < this.editorPoints.length; i++) {
		this.editorPoints[i].unbind();
	}

	this.editorPoints = [];

	for (var i = this.bbpc.children.length - 1; i >= 0; i--) {
		this.bbpc.removeChild(this.bbpc.children[i]);
	};

	var pattern = this.parent.selectedPattern.pattern;

	var pointColour = color(this.parent.selectedPattern.colour).darken(0.1);

	var width = this.parent.width - this.parent.parent.options.leftSideWidth - this.pointWidth;
	var xPad = this.parent.parent.options.leftSideWidth;

	for (var i = 0; i < pattern.nodes.length; i++) {
		var point = new BottomBarEditorPoint(this, {
			centerx: (this.pointWidth / 2) + xPad + ((pattern.nodes[i].x / 100) * width),
			centery: this.parent.height - ((this.parent.bottomBarHeight - this.pointWidth) * (pattern.nodes[i].y / 100)) - (this.pointWidth / 2),
			width: this.pointWidth,
			colour: pointColour,
			nodeLoc: i
		});

		this.editorPoints.push(point);

		this.bbpc.addChild(point.getGraphics());

		point.draw();
		
	}

}