const debug = require('debug')("li:client:program_renderer");
const remote = require('electron').remote;
const app = remote.getGlobal('app_main');
const pleasejs = require("pleasejs");
const color = require("color");

ProgramRenderer = function(elem, options, callback) {
	this.elem = elem;
	this.options = options;
	this.height = this.elem.height();
	this.width = this.elem.width();

	this.time = 0;
	this.bottomBarHeight = 300;

	this.timelineLanes = [{
		fixtures: ["b522f2cc-8855-4ad1-aeb9-a04dc7604682"],
		patterns: [],
		active: true
	}, {
		fixtures: ["b522f2cc-8855-4ad1-aeb9-a04dc7604682"],
		patterns: [{
			id: "fa3445ae-se34-531a-sdfe-345hfghfghys",
			location: 4,
			colour: pleasejs.make_color()[0],
			pattern: {
				length: 8,
				nodes: [{
					x: 0,
					y: 0
				},
				{
					x: 50,
					y: 128
				},
				{
					x: 100,
					y: 0
				}]
			}
		}],
		active: false
	}, {
		fixtures: ["b522f2cc-8855-4ad1-aeb9-a04dc7604682"],
		patterns: [],
		active: false
	}, {
		fixtures: ["b522f2cc-8855-4ad1-aeb9-a04dc7604682"],
		patterns: [],
		active: false
	}, {
		fixtures: ["b522f2cc-8855-4ad1-aeb9-a04dc7604682"],
		patterns: [],
		active: false
	}];

	if (!callback) {
		callback = options;
		this.options = {};
	}

	this.options = this.buildOptions(this.options);

	this.init(callback);
}

ProgramRenderer.prototype.init = function(callback) {
	debug("Loading program renderer...");

	this.buildFpsMeter();

	/**
	 * build
	 */
	this.buildStage(callback);
	
	this.timelineRenderer = new TimelineRenderer(this);
	this.bottomBarRenderer = new BottomBarRenderer(this);

	this.listenForResize();
	this.buildLayout();
	this.timelineRenderer.buildCursor();
	this.buildRightClickMenu();

	this.draw();

	debug("Renderer ready!");
}

ProgramRenderer.prototype.buildFpsMeter = function() {
	this.meter = new FPSMeter($("#fps-meter").get(0), {
		theme: 'transparent',
		graph: 1
	});
}

ProgramRenderer.prototype.buildStage = function(callback) {

	if (!this.elem) {
		callback("No container element supplied!", null);
		return;
	}

	this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {
		backgroundColor: 0xff00ff
	});

	this.elem.get(0).appendChild(this.renderer.view);

	this.stage = new PIXI.Container();
	this.stage.interactive = true;

	callback(null, null);
}

ProgramRenderer.prototype.listenForResize = function() {
	$(window).on("resize", function() {

		// debug("Detected resize!");

		setTimeout(function() {
			this.width = this.elem.width();
			this.height = this.elem.height() - 1;
			this.timelineRenderer.timelineHeight = this.height - this.bottomBarHeight;
			this.timelineRenderer.timelineScroll  = 0;

			this.renderer.resize(this.width, this.height)

			this.resize();

			// debug(this.height)

			// debug("Resize complete")
		}.bind(this), 0);

	}.bind(this))
}

ProgramRenderer.prototype.buildOptions = function(options) {

	var obj = {
		running: true,
		bpm: 120,
		bars: 4,
		leftSideWidth: 300,
		rightSideWidth: 100
	}

	for (var attrname in options) {
		obj[attrname] = options[attrname];
	}

	return obj;
}

ProgramRenderer.prototype.draw = function() {
	this.tick();

	this.renderer.render(this.stage);

	requestAnimationFrame(this.draw.bind(this));
}

ProgramRenderer.prototype.resize = function() {
	this.drawLayout(true, false);
}

ProgramRenderer.prototype.buildLayout = function() {
	/**
	 * Get Graphics
	 */

	this.timelineRenderer.buildGraphics();
	this.bottomBarRenderer.buildGraphics();

	/**
	 * Right sidebar graphics
	 * @type {PIXI}
	 */
	this.rsbg = new PIXI.Graphics();
	this.rsbg.interactive = true;
	this.stage.addChild(this.rsbg);

	/**
	 * Left sidebar graphics
	 * @type {PIXI}
	 */
	this.lsbg = new PIXI.Graphics();
	this.stage.addChild(this.lsbg);

	this.drawLayout(true, true);
}

ProgramRenderer.prototype.buildRightClickMenu = function() {

	var width = 115;

	var outerContainer = new PIXI.Container();

	this.stage.addChild(outerContainer);

	outerContainer.visible = false;

	var innerContainer = new PIXI.Container();
	outerContainer.addChild(innerContainer);

	/**
	 * itemContainer1
	 * @type {PIXI}
	 */
	var itemContainer1 = new PIXI.Container();

	itemContainer1.interactive = true;
	itemContainer1.buttonMode = true;

	itemContainer1.position.y = 0;

	var rcg1 = new PIXI.Graphics();
	rcg1.interactive = true;
	itemContainer1.addChild(rcg1);

	rcg1.beginFill(0xaaaaaa);
	rcg1.drawRect(0, 0, width, 25);
	rcg1.endFill();

	var text1 = new PIXI.Text('Add Pattern lane', {
		font: '14px Lato',
		fill: 0x111111,
		align: 'left'
	});
	text1.position.x = 5;
	text1.position.y = 5;

	itemContainer1.addChild(text1);

	itemContainer1.hitArea = itemContainer1.getBounds();

	itemContainer1.mousedown = function(event) {
		this.addNewTimelineLane();
	}.bind(this)

	innerContainer.addChild(itemContainer1);

	/**
	 * itemContainer2
	 * @type {PIXI}
	 */
	var itemContainer2 = new PIXI.Container();

	itemContainer2.interactive = true;
	itemContainer2.buttonMode = true;

	itemContainer2.position.y = 25;

	var rcg2 = new PIXI.Graphics();
	rcg2.interactive = true;
	itemContainer2.addChild(rcg2);

	rcg2.beginFill(0xaaaaaa);
	rcg2.drawRect(0, 0, width, 25);
	rcg2.endFill();

	var text2 = new PIXI.Text('Add Pattern', {
		font: '14px Lato',
		fill: 0x111111,
		align: 'left'
	});
	text2.position.x = 5;
	text2.position.y = 5;

	itemContainer2.addChild(text2);

	itemContainer2.hitArea = itemContainer2.getBounds();

	itemContainer2.mousedown = function(event) {
		this.addNewPattern();
	}

	innerContainer.addChild(itemContainer2);


	document.body.addEventListener('mousedown', function(event) {

		itemContainer2.visible = this.timelineRenderer.tlg.mouseIn

		if (event.button == 2 && (this.timelineRenderer.tlg.mouseIn || this.timelineRenderer.tlgbg.mouseIn || this.rsbg.mouseIn)) {
			outerContainer.position.x = this.renderer.plugins.interaction.mouse.global.x;
			outerContainer.position.y = this.renderer.plugins.interaction.mouse.global.y;
			outerContainer.visible = true;

			return;
		}

		outerContainer.visible = false;
	}.bind(this));
}

ProgramRenderer.prototype.addNewTimelineLane = function() {

	for (var i = 0; i < this.timelineLanes.length; i++) {
		this.timelineLanes[i].active = false;
	}

	this.timelineLanes.push({
		fixtures: ["b522f2cc-8855-4ad1-aeb9-a04dc7604682"],
		patterns: [],
		active: true
	})

	this.drawLayout(true, false);
}

ProgramRenderer.prototype.drawLayout = function(redraw, initial) {
	this.timelineRenderer.verifyAndSetTimelineScroll()

	if (redraw) this.drawLeftSidebar();
	this.drawRightSidebar(redraw, initial);

	this.timelineRenderer.drawTimeline(redraw, initial);
	this.timelineRenderer.buildTimelineScrollBar(redraw, initial);
	this.timelineRenderer.drawTimelineRowSeperators();
	this.timelineRenderer.drawGreyedOutTimelineArea(initial);
	this.timelineRenderer.drawPatterns(redraw, initial);

	this.bottomBarRenderer.redraw();
}

ProgramRenderer.prototype.drawLeftSidebar = function() {

	this.lsbg.clear()

	this.lsbg.beginFill(0x777777);
	this.lsbg.drawRect(0, 0, this.options.leftSideWidth, this.height);
	this.lsbg.endFill();

	this.lsbg.beginFill(0x111111);
	this.lsbg.drawRect(this.options.leftSideWidth, 0, 1, this.height);
	this.lsbg.endFill();
}

ProgramRenderer.prototype.drawRightSidebar = function(redraw, initial) {

	var xpos = this.width - this.options.rightSideWidth - this.timelineRenderer.timelineScrollBarWidth;

	this.rsbg.clear()

	/**
	 * background
	 */
	this.rsbg.beginFill(0x333333);
	this.rsbg.drawRect(xpos, 0, this.options.rightSideWidth, this.timelineRenderer.timelineHeight);
	this.rsbg.endFill();

	this.rsbg.beginFill(0x111111);
	this.rsbg.drawRect(xpos, 0, 1, this.timelineRenderer.timelineHeight);
	this.rsbg.endFill();

	/**
	 * Count as in timeline
	 */

	this.rsbg.hitArea = this.rsbg.getBounds();

	if (initial) {

		this.rsbg.mouseover = function() {
			setTimeout(function() {
				this.mouseIn = true;
			}.bind(this), 0);

		}

		this.rsbg.mouseout = function() {
			this.mouseIn = false;
		}

	}
}

ProgramRenderer.prototype.setTime = function(time) {
	this.time = time;
}

ProgramRenderer.prototype.tick = function() {
	if (this.meter) this.meter.tick();

	this.timelineRenderer.drawCursor();
}


ProgramRenderer.prototype.selectPattern = function(pid){
	this.selectedPattern = this.getPatternFromPid(pid);

	this.bottomBarRenderer.redraw();
}

ProgramRenderer.prototype.getPatternFromPid = function(pid) {
	for (var j = 0; j < this.timelineLanes.length; j++) {

		for (var x = 0; x < this.timelineLanes[j].patterns.length; x++) {

			if (this.timelineLanes[j].patterns[x].id == pid) {
				return this.timelineLanes[j].patterns[x];
			}

		}

	}
}