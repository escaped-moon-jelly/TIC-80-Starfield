/** @format */

// title:   Starfield
// author:  Escaped Moon Jelly
// desc:    A simple scrolling starfield demo
// site:
// license: MIT License
// version: 0.1
// script:  js
//'use strict'

// global state and constants
const SCREEN_SIZE_X = 240
const SCREEN_SIZE_Y = 136
const MAX_STARS = 128
const NUM_STAR_SPRITES = 15
var state = {
	entities: {
		stars: [],
		ships: [],
		junk: [],
	},
	mainShip: undefined,
	framesToNextUFO: randInt(1800) + 600,
	frame: 0,
	frameTimes: [],
	lastFrameEndTime: 0,
	totalFrameEndTimes: []
}

// Classes (well as close as possible in ES5)
/**
 * Represents an entity with a sprite.
 * @constructor
 * @param {Object} config - The configuration object
 * @param {Number} [config.x=0] - X coordinate
 * @param {Number} [config.y=0] - Y coordinate
 * @param {Number} [config.spriteID=255] - index of the sprite to draw
 * @param {Number} [config.transparentColorIndex=0] - index of the palette color to be transparent
 * @param {Number} [config.spriteRotation=0] - [0,1,2,3] rotates sprite by n*90 degrees
 * @param {Number} [config.spriteFlip=0] - [0,1,2,3] flips sprite along x and/or y axis
 * @param {Boolean} [config.gcExempt=false] - allows object to avoid garbage collection if necessary
 */
function Entity(config) {
	this.className = "Entity"
	this.x = config.x !== undefined ? config.x : 0
	this.y = config.y !== undefined ? config.y : 0
	this.spriteID = config.spriteID !== undefined ? config.spriteID : 255
	this.transparentColorIndex =
		config.transparentColorIndex !== undefined
			? config.transparentColorIndex
			: 0
	this.spriteRotation =
		config.spriteRotation !== undefined ? config.spriteRotation : 0
	this.spriteFlip = config.spriteFlip !== undefined ? config.spriteFlip : 0

	this.spriteScale = config.spriteScale !== undefined ? config.spriteScale : 1
	this.spriteSize = 8 * this.spriteScale
	this.gcExempt = config.gcExempt !== undefined ? config.gcExempt : false
	this.getPosition = function () {
		return [this.x, this.y]
	}
	this.setX = function (newX) {
		this.x = newX
	}
	this.setY = function (newY) {
		this.y = newY
	}
	this.setPos = function (x, y) {
		this.x = x
		this.y = y
	}
	this.setSprite = function (newSpriteID) {
		this.SpriteID = newSpriteID
	}
	this.getIsOnscreen = function () {
		var minXY = 0 - this.spriteSize
		var xOnscreen = minXY <= this.x && this.x <= SCREEN_SIZE_X
		var yOnscreen = minXY <= this.y && this.y <= SCREEN_SIZE_Y
		/*if (!xOnscreen || !yOnscreen) {
			trace("entity not onscreen: " + this.x +"," + this.y)
		}*/
		return xOnscreen && yOnscreen
	}
	this.draw = function () {
		if (!fget(this.spriteID, 0)) {
			spr(
				this.spriteID,
				this.x,
				this.y,
				this.transparentColorIndex,
				this.spriteScale,
				this.spriteFlip,
				this.spriteRotation
			)
		} else {
			// if the sprite has the noFlip flag set, ignore any rotation or flip config
			spr(
				this.spriteID,
				this.x,
				this.y,
				this.transparentColorIndex,
				this.spriteScale,
				0,
				0
			)
		}
	}
}
/**
 * Represents the star entities which scroll down the screen.
 * @constructor
 * @param {Object} config - See {@link Entity}
 */
function Star(config) {
	Entity.call(this, config)
	this.className = "Star"
	// divides the stars into 4 planes which move at different speeds for parallax
	this.plane = randInt(4)
	this.speed = 0.2 * ((this.plane + 1) / 2)
	this.randomize = function (x, spriteID) {
		//this.speed = Math.random() * 0.3 + 0.2
		this.spriteFlip = randInt(3)
		this.spriteRotation = randInt(3)
		this.x = x !== undefined ? x : randInt(SCREEN_SIZE_X - 8)
		this.spriteID =
			spriteID !== undefined ? spriteID : randInt(NUM_STAR_SPRITES)
	}
	this.move = function () {
		var minY = 0 - this.spriteSize
		// if the next frame would be offscreen wrap around to the top as a new star
		if (this.y + this.speed >= SCREEN_SIZE_Y) {
			this.setY(minY)
			this.randomize()
		} else {
			this.setY(this.y + this.speed)
		}
	}
	this.destruct = function () {
		var index = state.entities.stars.indexOf(this)
		state.entities.stars.splice(index, 1)
	}

	this.randomize(this.x, this.spriteID)
}
/**
 * Represents any ship entity.
 * @constructor
 * @param {Object} config - See {@link Entity}
 */
function Ship(config) {
	Entity.call(this, config)
	this.className = "Ship"
	this.animationFrame = 0
	this.destruct = function () {
		var index = state.entities.ships.indexOf(this)
		state.entities.ships.splice(index, 1)
	}
}
/**
 * Represents the main ship in the lower middle of the screen.
 * @constructor
 * @param {Object} config - See {@link Entity}
 */
function MainShip(config) {
	Ship.call(this, config)
	this.className = "MainShip"
	this.move = function () {
		this.y += Math.sin(state.frame / 8) / 4
	}
	this.draw = function () {
		var exhaustSpriteID = 32
		spr(this.spriteID, this.x, this.y, this.transparentColorIndex, 2)
		if (state.frame % 6 === 5) {
			this.animationFrame = (this.animationFrame + 1) % 3
		}
		// the ship exhaust animation is a different sprite
		spr(
			exhaustSpriteID + this.animationFrame,
			this.x,
			this.y + 16,
			this.transparentColorIndex,
			2
		)
	}
}
/**
 * Represents the UFO ships that fly past.
 * @constructor
 * @param {Object} config - See {@link Entity}
 * @param {Number} [config.direction=1] - [1,-1] 1 for right, -1 for left
 * @param {Number} config.speed - the speed of the ship
 * @param {Boolean} [config.vertical=false] - should it go veritcally or horizontally?
 */
function UFO(config) {
	Ship.call(this, config)
	this.className = "UFO"
	this.speed = config.speed
	this.vertical = config.vertical ? config.vertical : false
	if (config.direction === -1) {
		this.direction = -1
		//this.x = SCREEN_SIZE_X - 1
	} else {
		this.direction = 1
		//this.x = 1 - this.spriteSize
	}
	this.move = function () {
		if (this.vertical) {
			this.y += this.speed * this.direction
			this.x += Math.sin(state.frame / 8) / 4
		} else {
			this.x += this.speed * this.direction
			this.y += this.speed / 6
			this.y += Math.sin(state.frame / 8) / 4
		}
		if (!this.getIsOnscreen()) {
			this.destruct()
			//trace("UFO self destructed")
		}
	}
}

// Functions
/**
 * Get a random int between 0 and max (inclusive)
 * @param {Number} max -- the maximum integer
 */
function randInt(max) {
	return Math.round(Math.random() * max)
}
/**
 * Clean up any entities that are offscreen somewhere
 */
function entitiesGC() {
	for (var property in state.entities) {
		var entitiesArray = state.entities[property]
		var toDelete = []
		entitiesArray.forEach(function (entity) {
			if (!entity.gcExempt && !entity.getIsOnscreen()) {
				toDelete.push(entity)
				trace("Entity in " + property + " slated for deletion")
			}
		})
		if (toDelete.length) {
			toDelete.forEach(function (entity) {
				var index = entitiesArray.indexOf(entity)
				entitiesArray.splice(index, 1)
			})
			trace(
				toDelete.length +
					" entities in entities." +
					property +
					" was garbage collected"
			)
		}
	}
}
/**
 * Handle drawing of every entity and updating their position afterwards
 */
function drawAndMoveEntities() {
	for (var property in state.entities) {
		var entitiesArray = state.entities[property]
		entitiesArray.forEach(function (entity) {
			entity.draw()
			entity.move()
		})
	}
}
/**
 * Generates a UFO entity
 */
function spawnUFO() {
	var direction = [-1, 1][randInt(1)]
	var vertical = [true, false][randInt(1)]
	if (vertical) {
		if (direction === -1) {
			var y = SCREEN_SIZE_Y - 1
		} else {
			var y = -7 // the ufo sprite is 8px
		}
		var xOptions = []
		// x choice for left third of screen
		xOptions.push((Math.random() * SCREEN_SIZE_X) / 3)
		// x choice for right third of screen
		xOptions.push(
			(SCREEN_SIZE_X / 3) * 2 - 8 + (Math.random() * SCREEN_SIZE_X) / 3
		)
		var x = xOptions[randInt(1)]
	} else {
		if (direction === -1) {
			var x = SCREEN_SIZE_X - 1
		} else {
			var x = -7 // the ufo sprite is 8px
		}
		var y = randInt(SCREEN_SIZE_Y / 2.5)
	}

	state.entities.ships.push(
		new UFO({
			x: x,
			y: y,
			speed: Math.random() * 0.4 + 0.3,
			direction: direction,
			vertical: vertical,
			spriteID: 48,
			spriteScale: 1,
		})
	)
}
/**
 * TIC-80 BOOT function, runs once on boot for initialization
 */
function BOOT() {
	for (var i = 0; i < MAX_STARS; i++) {
		state.entities.stars.push(
			new Star({
				x: randInt(SCREEN_SIZE_X),
				y: randInt(SCREEN_SIZE_Y),
				spriteID: randInt(NUM_STAR_SPRITES),
				transparentColorIndex: 0,
			})
		)
	}
	// sort the stars by plane so the closer and faster ones draw on top of the others
	state.entities.stars.sort(function (a, b) {
		return a.plane - b.plane
	})
	state.entities.ships.unshift(
		new MainShip({
			x: SCREEN_SIZE_X / 2 - 8,
			y: SCREEN_SIZE_Y - 32,
			spriteID: 16,
			spriteScale: 2,
		})
	)
	state.mainShip = state.entities.ships[0]
}
/**
 * TIC-80 TIC function, called once per frame at 60fps
 */
function TIC() {
	var startTime = time()
	// have framecount loop if it runs long enough to get too big
	state.frame = (state.frame + 1) % Number.MAX_SAFE_INTEGER
	//drawing and updating
	cls(0)
	drawAndMoveEntities()
	//spawn a UFO every now and then
	if (state.framesToNextUFO-- <= 0) {
		spawnUFO()
		state.framesToNextUFO = randInt(1800) + 600
		//trace("A UFO!")
	}
	// run GC once per minute
	if (state.frame % (60 * 60) === 0) {
		//trace("Starting Garbage Collection:")
		entitiesGC()
		//trace("End Garbage Collection")
	}
	//framerate info
	var frameTime = time() - startTime
	state.frameTimes.push (frameTime)
	if (state.frameTimes.length > 10) {
		state.frameTimes.shift()
	}
	avgFrameTime = state.frameTimes.reduce(function (accumulator, value) {
		return accumulator + value
	}, 0) / state.frameTimes.length

	state.totalFrameEndTimes.push(state.lastFrameEndTime)
	if (state.totalFrameEndTimes.length > 10) {
		state.totalFrameEndTimes.shift()
	}
	avgTotalFrameEndTime = state.totalFrameEndTimes.map(function (element, index, array) {
		if (index > 0) {
			return element - array[index - 1]
		} else {
			return 0
		}
	}).reduce(function (accumulator, value) {
		return accumulator + value
	}, 0) / state.totalFrameEndTimes.length

	print((((state.frame - 1) / state.lastFrameEndTime) * 1000).toPrecision(2) + "fps")
	print("(" + (avgTotalFrameEndTime).toFixed(4) + ") (total)", 40, 0)
	print((60, 1000 / avgFrameTime).toFixed(0) + "fps", 0, 8)
	print("(" + avgFrameTime.toFixed(4) + "/16.6ms) (game loop)", 40, 8)
	state.lastFrameEndTime = time()
}
/*
------------------------------------------------------------------------
	TIC-80 Non-Code Data, DO NOT MODIFY
------------------------------------------------------------------------
*/
// <TILES>
// 000:000000000000000000100100000cc000000cc000001001000000000000000000
// 001:000000000005500000500500050bb050050bb050005005000005500000000000
// 002:000000000000000000500200000a40000004a000002005000000000000000000
// 003:0000000000000100001000000000000001001010000000000001000000000000
// 004:000000000076600007000500000bb5000304403000b5500000b00090000aa900
// 005:0001000000000a00a0d0000000000d00000a00000d0000a000010a000a000000
// 006:000000000000000000ffff0000f88f0000f88f0000ffff000000000000000000
// 007:00000000000000c0000000000000000000000000000000000c00000000000000
// 009:00000000000000000b0000000000000000000000000000000000000000000b00
// 010:000000000000000000000000000000000000e000000000000000000000000000
// 011:0000000000000000000000000001000000000000000000000000000000000000
// 012:0000000000000000000300000000400000000000000000000000000000000000
// 013:00099000000aa000000bb000000cc000000cc000000bb000000aa00000099000
// 014:000880000007700000066000000c50000005c000000660000007700000088000
// 015:000080000000a0000000b00089abcba90000b0000000b0000000a00000008000
// 016:00000000000cd000004de4000ccefcc044c44c44bdccccdb00d44d00000bb000
// 032:b000000ba00aa00a900990090008800000000000000000000000000000000000
// 033:80000008900aa009a0a99a0a0098890000800800000000000000000000000000
// 034:000000009000000900a00a00809aa90800899800000880000000000000000000
// 048:0000000000cdef0006deef6004fffe4046644664677667767bb77bb709900990
// 255:ccccccccc00ee00cc0e00e0cc0000e0cc000e00cc000000cc000e00ccccccccc
// </TILES>

// <WAVES>
// 000:fffffffff000000000000000ffffffff
// 001:0123456789abcdeffedcba9876543210
// 002:0123456789abcdef0123456789abcdef
// 003:013579bdeefffffffffeedca98654210
// </WAVES>

// <SFX>
// 000:f10001000100010001000100f100f1000100010001000100010001000100f100f1000100010001000100010001000100f100f1000100010001000100205000000000
// </SFX>

// <PATTERNS>
// 000:c00004c00004c00004c00004c00004c00004c00004c00004c00004c00004c00004c00004c00004c00004c00004c00004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </PATTERNS>

// <TRACKS>
// 000:100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000820380
// </TRACKS>

// <FLAGS>
// 000:00000000000000000000000000101000100000000000000000000000000000001010100000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </FLAGS>

// <PALETTE>
// 000:1a1c2c5d275db13e53ef7d57ffcd75a7f07038b76425717929366f3b5dc941a6f673eff7f4f4f494b0c2566c86333c57
// </PALETTE>
