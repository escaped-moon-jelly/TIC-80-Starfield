/** @format */

// title:   Starfield
// author:  Escaped Moon Jelly
// desc:    A simple scrolling starfield demo
// site:    
// license: MIT License 
// version: 0.1
// script:  js
//'use strict'
var screenX = 240
var screenY = 136
var maxStars = 64
var stars = []
var frame = 0
var ship

// Classes (well as close as possible in ES5)
function Entity(x, y, spriteID) {
	this.x = x
	this.y = y
	this.spriteID = spriteID
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
}
function Star(x, y, spriteID) {
	Entity.call(this, x, y, spriteID)
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
		var maxY = screenY + 8 // sprites are 8px tall
		var minY = -8
		// if the next frame would be offscreen wrap around to the top as a new star
		if (this.y >= maxY - this.speed) {
			this.setY(minY)
			this.randomize()
		} else {
			this.setY(this.y + this.speed)
		}
	}

	this.randomize()
}

function Ship () {
	Entity.call(this, screenX/2 - 16, screenY - 32, 16)
	this.animationFrame = 0
}

// Functions
function randInt(max) {
	return Math.round(Math.random() * max)
}

function drawStars() {
	stars.forEach(function (star) {
		spr(star.spriteID, star.x, star.y, star.transparentColorIndex)
		star.move()
	})
}

function drawShip() {
	var exhaustSpriteID = 32
	spr(ship.spriteID, ship.x, ship.y, 0, 2)
	if (frame % 6 === 5) {
		ship.animationFrame = (ship.animationFrame + 1) % 3
	}
	spr(exhaustSpriteID + ship.animationFrame, ship.x, ship.y + 16, 0, 2)
}

function BOOT() {
	for (var i = 0; i < maxStars; i++) {
		stars.push(new Star(randInt(screenX), randInt(screenY), randInt(6)))
	}
	// sort the stars by plane so the closer and faster ones draw on top of the others
	stars.sort(function (a, b) {
		return a.plane - b.plane
	})
	ship = new Ship()
}
function TIC() {
	cls(0)
	drawStars()
	drawShip()
	frame = (frame + 1) % 1028
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

