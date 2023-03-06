/** @format */

// title:   Starfield
// author:  Escaped Moon Jelly
// desc:    A simple scrolling starfield demo
// site:
// license: MIT License
// version: 0.1
// script:  js
//'use strict'
const screenX = 240
const screenY = 136
const maxStars = 128
var state = {
	entities: {
		stars: [],
		ships: [],
		junk: [],
	},
	mainShip: undefined,
	frame: 0,
}

// Classes (well as close as possible in ES5)
function Entity(config) {
	this.className = "Entity"
	this.x = config.x !== undefined ? config.x : 0
	this.y = config.y !== undefined ? config.y : 0
	this.spriteID = config.spriteID !== undefined ? config.spriteID : 255
	this.transparentColorIndex = config.transparentColorIndex !== undefined 
		? config.transparentColorIndex
		: 0
	this.spriteRotation = config.spriteRotation !== undefined ? config.spriteRotation : 0
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
		var xOnscreen = minXY <= this.x && this.x <= screenX
		var yOnscreen = minXY <= this.y && this.y <= screenY
		/*if (!xOnscreen || !yOnscreen) {
			trace("entity not onscreen: " + this.x +"," + this.y)
		}*/
		return xOnscreen && yOnscreen
	}
	this.draw = function () {
		spr(
			this.spriteID,
			this.x,
			this.y,
			this.transparentColorIndex,
			this.spriteScale
		)
	}
}

function Star(entityConfig) {
	Entity.call(this, entityConfig)
	this.className = "Star"
	// divides the stars into 4 planes which move at different speeds for parallax
	this.plane = randInt(4)
	this.speed = 0.2 * ((this.plane + 1) / 2)
	this.randomize = function (x, spriteID) {
		//this.speed = Math.random() * 0.3 + 0.2
		this.x = x !== undefined ? x : randInt(screenX - 8)
		this.spriteID = spriteID !== undefined ? spriteID : randInt(13)
	}
	this.move = function () {
		var minY = 0 - this.spriteSize
		// if the next frame would be offscreen wrap around to the top as a new star
		if (this.y + this.speed >= screenY) {
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

function Ship(entityConfig) {
	Entity.call(this, entityConfig)
	this.className = "Ship"
	this.animationFrame = 0
	this.destruct = function () {
		var index = state.entities.ships.indexOf(this)
		state.entities.ships.splice(index, 1)
	}
}

function MainShip(entityConfig) {
	Ship.call(this, entityConfig)
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

function UFO(entityConfig) {
	Ship.call(this, entityConfig)
	this.className = "UFO"
	this.speed = entityConfig.speed
	this.move = function () {
		this.x += this.speed
		this.y += this.speed / 6
		if (!this.getIsOnscreen()) {
			this.destruct()
			//trace("UFO self destructed")
		}
	}
}

// Functions
function randInt(max) {
	return Math.round(Math.random() * max)
}
function entitiesGC() {
	//totally pointless garbage collection for practice
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

function drawAndMoveEntities() {
	for (var property in state.entities) {
		var entitiesArray = state.entities[property]
		entitiesArray.forEach(function (entity) {
			entity.draw()
			entity.move()
		})
	}
}

function BOOT() {
	for (var i = 0; i < maxStars; i++) {
		state.entities.stars.push(
			new Star({
				x: randInt(screenX),
				y: randInt(screenY),
				spriteID: randInt(13),
				transparentColorIndex: 0 
			})
		)
	}
	// sort the stars by plane so the closer and faster ones draw on top of the others
	state.entities.stars.sort(function (a, b) {
		return a.plane - b.plane
	})
	state.entities.ships.unshift(
		new MainShip({
			x: screenX / 2 - 16,
			y: screenY - 32,
			spriteID: 16,
			spriteScale: 2,
		})
	)
	state.mainShip = state.entities.ships[0]
}

function TIC() {
	cls(0)
	drawAndMoveEntities()
	// have framecount loop every 10 minutes
	state.frame = (state.frame + 1) % (60 * 60 * 10)
	//spawn a UFO every now and then
	if (state.frame % (60 * 20) === 0){
		state.entities.ships.push(new UFO({
			x: -8,
			y: randInt(screenY/2.5),
			speed: (Math.random() * 0.4) + 0.3,
			spriteID: 48,
			spriteScale: 1.5
		}))
		//trace("A UFO!")
	}
	// run GC once per minute
	if (state.frame % (60 * 60) === 0) {
		//trace("Starting Garbage Collection:")
		entitiesGC()
		//trace("End Garbage Collection")
	}
}

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
// 016:00000000000cd000004de4000ccefcc044c44c44bdccccdb00d44d00000bb000
// 032:b000000ba00aa00a900990090008800000000000000000000000000000000000
// 033:80000008900aa009a0a99a0a0098890000800800000000000000000000000000
// 034:000000009000000900a00a00809aa90800899800000880000000000000000000
// 048:0000000000cdef0006deef600dfffed006666660677667767bb77bb709900990
// 255:ccccccccc00ee00cc0e00e0cc0000e0cc000e00cc000000cc000e00ccccccccc
// </TILES>

// <WAVES>
// 000:00000000ffffffff00000000ffffffff
// 001:0123456789abcdeffedcba9876543210
// 002:0123456789abcdef0123456789abcdef
// </WAVES>

// <SFX>
// 000:000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000304000000000
// </SFX>

// <TRACKS>
// 000:100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </TRACKS>

// <PALETTE>
// 000:1a1c2c5d275db13e53ef7d57ffcd75a7f07038b76425717929366f3b5dc941a6f673eff7f4f4f494b0c2566c86333c57
// </PALETTE>

