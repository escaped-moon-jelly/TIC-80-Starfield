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
	frame: 0,
}
//var stars = []
//var frame = 0
//var ship

// Classes (well as close as possible in ES5)
function Entity(x, y, spriteID, spriteScale) {
	this.x = x
	this.y = y
	this.spriteID = spriteID
	this.spriteScale = spriteScale
	this.spriteSize = 8 * this.spriteScale
	this.gcExempt = false
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
}
function Star(x, y, spriteID, spriteScale) {
	var defaultSpriteScale = spriteScale ? spriteScale : 1
	Entity.call(this, x, y, spriteID, defaultSpriteScale)
	this.transparentColorIndex = 0
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

	this.randomize(this.x, this.spriteID)
}

function Ship() {
	Entity.call(this, screenX / 2 - 16, screenY - 32, 16, 2)
	this.animationFrame = 0
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

function drawStars() {
	state.entities.stars.forEach(function (star) {
		spr(star.spriteID, star.x, star.y, star.transparentColorIndex)
		star.move()
	})
}

function drawShip() {
	var exhaustSpriteID = 32
	var ship = state.entities.ships[0]
	spr(ship.spriteID, ship.x, ship.y, 0, ship.spriteScale)
	if (state.frame % 6 === 5) {
		ship.animationFrame = (ship.animationFrame + 1) % 3
	}
	spr(exhaustSpriteID + ship.animationFrame, ship.x, ship.y + 16, 0, 2)
}

function BOOT() {
	for (var i = 0; i < maxStars; i++) {
		state.entities.stars.push(new Star(randInt(screenX), randInt(screenY)))
	}
	// sort the stars by plane so the closer and faster ones draw on top of the others
	state.entities.stars.sort(function (a, b) {
		return a.plane - b.plane
	})
	state.entities.ships.push(new Ship())
	// garbace collection test
	/*state.entities.junk.push(new Star(0, screenY + 10))
	state.entities.junk.push(new Star(screenX + 10, 0))
	state.entities.junk.push(new Star(screenX + 10, screenY + 10))
	state.entities.junk.push(new Star(-9, -9))
	state.entities.junk.push(new Star(0, -9))
	state.entities.junk.push(new Star(-9, 1))
	state.entities.junk.push(new Star(-9, 2))
	state.entities.junk.push(new Star(-9, -1))
	state.entities.junk.push(new Star(-9, -2))
	state.entities.junk.push(new Star(-9, 0)) */
}
function TIC() {
	cls(0)
	drawStars()
	drawShip()
	// have framecount loop every 10 minutes
	state.frame = (state.frame + 1) % (60 * 60 * 10)
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
