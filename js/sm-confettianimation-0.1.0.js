this.sm = this.sm || {};

(function () {
    var confettiAnimation = function (cfg) {
        this.initialize(cfg);
    };
    var p = confettiAnimation.prototype = new sm.BaseAnimationEnd();
    p.singleton = null;

    p.running = false;
    
    p.BaseAnimationEnd_initialize = p.initialize;
    p.initialize = function (cfg) {
        if (cfg != undefined && cfg != null) {
            this.BaseAnimationEnd_initialize(cfg);
            confettiColors = this.cfg.animation.confettiColors;
            this.confetti = new sm.Confetti(0, 0, this.cfg.animation.backgroundColor, this.cfg.animation.backgroundOpacity, this.cfg.animation.confettiRibbonCount, this.cfg.animation.confettiPaperCount, this.cfg.animation.soundId);
            this.addChild(this.confetti);            
        }      
    };
      
    p.BaseAnimationEnd_run = p.run;
    p.run = function (callbackOnFinished) {
        this.on("finished", function(event) {
            if (callbackOnFinished != null && callbackOnFinished != undefined) {
                callbackOnFinished(this);
            }
        });
        this.confetti.width = this.width;
        this.confetti.height = this.width;
        this.confetti.start();
    };
    
    p.BaseAnimationEnd_stop = p.stop;
    p.stop = function() {
        this.confetti.stop();
    };

    sm.ConfettiAnimation = confettiAnimation;
} (window));

// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
var DEG_TO_RAD = Math.PI / 180;
var RAD_TO_DEG = 180 / Math.PI;
var frameRate = 30;
var dt = 1.0 / frameRate;
var confettiColors = [["#df0049", "#660671"], ["#00e857", "#005291"], ["#2bebbc", "#05798a"], ["#ffd200", "#b06c00"]];

// ---------------------------------------------------------------------------------------------------------------------------------

function Vector2(_x, _y) {
    this.x = _x, this.y = _y; this.Length = function () { return Math.sqrt(this.SqrLength()); }
    this.SqrLength = function () { return this.x * this.x + this.y * this.y; }
    this.Equals = function (_vec0, _vec1) { return _vec0.x == _vec1.x && _vec0.y == _vec1.y; }
    this.Add = function (_vec) { this.x += _vec.x; this.y += _vec.y; }
    this.Sub = function (_vec) { this.x -= _vec.x; this.y -= _vec.y; }
    this.Div = function (_f) { this.x /= _f; this.y /= _f; }
    this.Mul = function (_f) { this.x *= _f; this.y *= _f; }
    this.Normalize = function() {
        var sqrLen = this.SqrLength();
        if (sqrLen != 0) {
            var factor = 1.0 / Math.sqrt(sqrLen);
            this.x *= factor;
            this.y *= factor;
        }
    };
    this.Normalized = function() {
        var sqrLen = this.SqrLength();
        if (sqrLen != 0) {
            var factor = 1.0 / Math.sqrt(sqrLen);
            return new Vector2(this.x * factor, this.y * factor);
        }
        return new Vector2(0, 0);
    };
};

Vector2.Lerp = function(_vec0, _vec1, _t) {
    return new Vector2((_vec1.x - _vec0.x) * _t + _vec0.x, (_vec1.y - _vec0.y) * _t + _vec0.y);
};
Vector2.Distance = function(_vec0, _vec1) {
    return Math.sqrt(Vector2.SqrDistance(_vec0, _vec1));
};
Vector2.SqrDistance = function(_vec0, _vec1) {
    var x = _vec0.x - _vec1.x;
    var y = _vec0.y - _vec1.y;
    return (x * x + y * y + z * z);
};
Vector2.Scale = function(_vec0, _vec1) { return new Vector2(_vec0.x * _vec1.x, _vec0.y * _vec1.y); };
Vector2.Min = function(_vec0, _vec1) { return new Vector2(Math.min(_vec0.x, _vec1.x), Math.min(_vec0.y, _vec1.y)); };
Vector2.Max = function(_vec0, _vec1) { return new Vector2(Math.max(_vec0.x, _vec1.x), Math.max(_vec0.y, _vec1.y)); };
Vector2.ClampMagnitude = function(_vec0, _len) {
    var vecNorm = _vec0.Normalized;
    return new Vector2(vecNorm.x * _len, vecNorm.y * _len);
};
Vector2.Sub = function(_vec0, _vec1) { return new Vector2(_vec0.x - _vec1.x, _vec0.y - _vec1.y, _vec0.z - _vec1.z); };

// ---------------------------------------------------------------------------------------------------------------------------------

function EulerMass(_x, _y, _mass, _drag) {
    this.position = new Vector2(_x, _y);
    this.mass = _mass;
    this.drag = _drag;
    this.force = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);
    this.AddForce = function (_f) { this.force.Add(_f); }
    this.Integrate = function(_dt) {
        var acc = this.CurrentForce(this.position);
        acc.Div(this.mass);
        var posDelta = new Vector2(this.velocity.x, this.velocity.y);
        posDelta.Mul(_dt);
        this.position.Add(posDelta);
        acc.Mul(_dt);
        this.velocity.Add(acc);
        this.force = new Vector2(0, 0);
    };
    this.CurrentForce = function(_pos, _vel) {
        var totalForce = new Vector2(this.force.x, this.force.y);
        var speed = this.velocity.Length();
        var dragVel = new Vector2(this.velocity.x, this.velocity.y);
        dragVel.Mul(this.drag * this.mass * speed);
        totalForce.Sub(dragVel);
        return totalForce;
    };
}

// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------

(function () {
    var ConfettiPaper = function (_x, _y) {
        this.initialize(_x, _y);
    }
    var p = ConfettiPaper.prototype = new createjs.DisplayObject();

    ConfettiPaper.bounds = new Vector2(0, 0);

    p.DisplayObject_initialize = p.initialize;

    p.initialize = function(_x, _y) {
        if (ConfettiPaper.prototype.DisplayObject_initialize) {
            this.DisplayObject_initialize();
        }

        this.pos = new Vector2(_x, _y);
        this.rotationSpeed = Math.random() * 600 + 800;
        this._angle = DEG_TO_RAD * Math.random() * 360;
        this._rotation = DEG_TO_RAD * Math.random() * 360;
        this.cosA = 1.0;
        this.size = 5.0;
        this.oscillationSpeed = Math.random() * 1.5 + 0.5;
        this.xSpeed = 40.0;
        this.ySpeed = Math.random() * 60 + 50.0;
        this.corners = new Array();
        this.time = Math.random();
        var ci = Math.round(Math.random() * (confettiColors.length - 1));
        this.frontColor = confettiColors[ci][0];
        this.backColor = confettiColors[ci][1];
        for (var i = 0; i < 4; i++) {
            var dx = Math.cos(this._angle + DEG_TO_RAD * (i * 90 + 45));
            var dy = Math.sin(this._angle + DEG_TO_RAD * (i * 90 + 45));
            this.corners[i] = new Vector2(dx, dy);
        }
    };

    p.update = function(_dt) {
        this.time += _dt;
        this._rotation += this.rotationSpeed * _dt;
        this.cosA = Math.cos(DEG_TO_RAD * this._rotation);
        this.pos.x += Math.cos(this.time * this.oscillationSpeed) * this.xSpeed * _dt;
        this.pos.y += this.ySpeed * _dt;
        if (this.pos.y > ConfettiPaper.bounds.y) {
            this.pos.x = Math.random() * ConfettiPaper.bounds.x;
            this.pos.y = 0;
        }
    };

    p.DisplayObject_draw = p.draw;

    p.draw = function(ctx, ignoreCache) {
        if (this.DisplayObject_draw(ctx, ignoreCache)) {
            return true;
        }

        if (this.cosA > 0) {
            ctx.fillStyle = this.frontColor;
        } else {
            ctx.fillStyle = this.backColor;
        }
        ctx.beginPath();
        ctx.moveTo(this.pos.x + this.corners[0].x * this.size, this.pos.y + this.corners[0].y * this.size * this.cosA);
        for (var i = 1; i < 4; i++) {
            ctx.lineTo(this.pos.x + this.corners[i].x * this.size, this.pos.y + this.corners[i].y * this.size * this.cosA);
        }
        ctx.closePath();
        ctx.fill();

        return true;
    };

    p.isVisible = function() {
        return this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0;
    };

    p.clone = function() {
        var o = new ConfettiPaper(this._x, this._y);
        this.cloneProps(o);
        return o;
    };

    p.toString = function() {
        return "[ConfettiPaper (name=" + this.name + ")]";
    };

    sm.ConfettiPaper = ConfettiPaper;
} ());

// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------

(function () {
    var ConfettiRibbon = function(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag) {
        this.initialize(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag);
    };
    var p = ConfettiRibbon.prototype = new createjs.DisplayObject();

    ConfettiRibbon.bounds = new Vector2(0, 0);

    p.DisplayObject_initialize = p.initialize;

    p.initialize = function(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag) {
        if (ConfettiRibbon.prototype.DisplayObject_initialize) {
            this.DisplayObject_initialize();
        }

        this.particleDist = _dist;
        this.particleCount = _count;
        this.particleMass = _mass;
        this.particleDrag = _drag;
        this.particles = new Array();
        var ci = Math.round(Math.random() * (confettiColors.length - 1));
        this.frontColor = confettiColors[ci][0];
        this.backColor = confettiColors[ci][1];
        this.xOff = Math.cos(DEG_TO_RAD * _angle) * _thickness;
        this.yOff = Math.sin(DEG_TO_RAD * _angle) * _thickness;
        this.position = new Vector2(_x, _y);
        this.prevPosition = new Vector2(_x, _y);
        this.velocityInherit = Math.random() * 2 + 4;
        this.time = Math.random() * 100;
        this.oscillationSpeed = Math.random() * 2 + 2;
        this.oscillationDistance = Math.random() * 40 + 40;
        this.ySpeed = Math.random() * 40 + 80;
        for (var i = 0; i < this.particleCount; i++) {
            this.particles[i] = new EulerMass(_x, _y - i * this.particleDist, this.particleMass, this.particleDrag);
        }
    };

    p.update = function(_dt) {
        var i = 0;
        this.time += _dt * this.oscillationSpeed;
        this.position.y += this.ySpeed * _dt;
        this.position.x += Math.cos(this.time) * this.oscillationDistance * _dt;
        this.particles[0].position = this.position;
        var dX = this.prevPosition.x - this.position.x;
        var dY = this.prevPosition.y - this.position.y;
        var delta = Math.sqrt(dX * dX + dY * dY);
        this.prevPosition = new Vector2(this.position.x, this.position.y);
        for (i = 1; i < this.particleCount; i++) {
            var dirP = Vector2.Sub(this.particles[i - 1].position, this.particles[i].position);
            dirP.Normalize();
            dirP.Mul((delta / _dt) * this.velocityInherit);
            this.particles[i].AddForce(dirP);
        }
        for (i = 1; i < this.particleCount; i++) {
            this.particles[i].Integrate(_dt);
        }
        for (i = 1; i < this.particleCount; i++) {
            var rp2 = new Vector2(this.particles[i].position.x, this.particles[i].position.y);
            rp2.Sub(this.particles[i - 1].position);
            rp2.Normalize();
            rp2.Mul(this.particleDist);
            rp2.Add(this.particles[i - 1].position);
            this.particles[i].position = rp2;
        }
        if (this.position.y > ConfettiRibbon.bounds.y + this.particleDist * this.particleCount) {
            this.reset();
        }
    };

    p.reset = function() {
        this.position.y = -Math.random() * ConfettiRibbon.bounds.y;
        this.position.x = Math.random() * ConfettiRibbon.bounds.x;
        this.prevPosition = new Vector2(this.position.x, this.position.y);
        this.velocityInherit = Math.random() * 2 + 4;
        this.time = Math.random() * 100;
        this.oscillationSpeed = Math.random() * 2.0 + 1.5;
        this.oscillationDistance = Math.random() * 40 + 40;
        this.ySpeed = Math.random() * 40 + 80;
        var ci = Math.round(Math.random() * (confettiColors.length - 1));
        this.frontColor = confettiColors[ci][0];
        this.backColor = confettiColors[ci][1];
        this.particles = new Array();
        for (var i = 0; i < this.particleCount; i++) {
            this.particles[i] = new EulerMass(this.position.x, this.position.y - i * this.particleDist, this.particleMass, this.particleDrag);
        }
    };

    p.Side = function(x1, y1, x2, y2, x3, y3) {
        return ((x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2));
    };

    p.DisplayObject_draw = p.draw;

    p.draw = function(ctx, ignoreCache) {
        for (var i = 0; i < this.particleCount - 1; i++) {
            var p0 = new Vector2(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff);
            var p1 = new Vector2(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff);
            if (this.Side(this.particles[i].position.x, this.particles[i].position.y, this.particles[i + 1].position.x, this.particles[i + 1].position.y, p1.x, p1.y) < 0) {
                ctx.fillStyle = this.frontColor;
                ctx.strokeStyle = this.frontColor;
            } else {
                ctx.fillStyle = this.backColor;
                ctx.strokeStyle = this.backColor
            }
            if (i == 0) {
                ctx.beginPath();
                ctx.moveTo(this.particles[i].position.x, this.particles[i].position.y);
                ctx.lineTo(this.particles[i + 1].position.x, this.particles[i + 1].position.y);
                ctx.lineTo((this.particles[i + 1].position.x + p1.x) * 0.5, (this.particles[i + 1].position.y + p1.y) * 0.5);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p0.x, p0.y);
                ctx.lineTo((this.particles[i + 1].position.x + p1.x) * 0.5, (this.particles[i + 1].position.y + p1.y) * 0.5);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            } else if (i == this.particleCount - 2) {
                ctx.beginPath();
                ctx.moveTo(this.particles[i].position.x, this.particles[i].position.y);
                ctx.lineTo(this.particles[i + 1].position.x, this.particles[i + 1].position.y);
                ctx.lineTo((this.particles[i].position.x + p0.x) * 0.5, (this.particles[i].position.y + p0.y) * 0.5);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p0.x, p0.y);
                ctx.lineTo((this.particles[i].position.x + p0.x) * 0.5, (this.particles[i].position.y + p0.y) * 0.5);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(this.particles[i].position.x, this.particles[i].position.y);
                ctx.lineTo(this.particles[i + 1].position.x, this.particles[i + 1].position.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.lineTo(p0.x, p0.y);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
        }
        return true;
    };

    p.isVisible = function() {
        return this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0;
    };

    p.clone = function() {
        var o = new ConfettiPaper(this._x, this._y, this._count, this._dist, this._thickness, this._angle, this._mass, this._drag);
        this.cloneProps(o);
        return o;
    };

    p.toString = function() {
        return "[ConfettiRibbon (name=" + this.name + ")]";
    };

    sm.ConfettiRibbon = ConfettiRibbon;
} ());

// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------

(function () {
    var Confetti = function(width, height, bkgColor, bkgOpacity, confettiRibbonCount, confettiPaperCount, soundId) {
        this.initialize(width, height, bkgColor, bkgOpacity, confettiRibbonCount, confettiPaperCount, soundId);
    };
    var p = Confetti.prototype = new createjs.Container();

    p.confettiRibbons = null;
    p.confettiPapers = null;
    p.width = 0;
    p.height = 0;
    p.bkgColor = "#000000";
    p.bkgOpacity = 1.0;

    p.Container_initialize = p.initialize;

    p.initialize = function(width, height, bkgColor, bkgOpacity, confettiRibbonCount, confettiPaperCount, soundId) {
        this.Container_initialize();

        this.visible = false;
        this.width = width;
        this.height = height;
        this.confettiRibbonCount = confettiRibbonCount;
        this.confettiPaperCount = confettiPaperCount;
        this.soundId = soundId;
        
        if (bkgColor) {
            this.bkgColor = bkgColor;
        }
        if (bkgOpacity) {
            this.bkgOpacity = bkgOpacity;
        }
    };

    p.createObjects = function() {
        var i = 0;

        // Se crean lo lazos
        var ribbonCount = 7;
        if (this.confettiRibbonCount >= 0) {
            ribbonCount = this.confettiRibbonCount;
        }
        var rpCount = 10;
        var rpDist = 8.0;
        var rpThick = 8.0;
        this.confettiRibbons = new Array();
        sm.ConfettiRibbon.bounds = new Vector2(this.width, this.height);
        for (i = 0; i < ribbonCount; i++) {
            this.confettiRibbons[i] = new sm.ConfettiRibbon(Math.random() * this.width, -Math.random() * this.height * 2, rpCount, rpDist, rpThick, 45, 1, 0.05);
            this.addChild(this.confettiRibbons[i]);
        }

        // Se crean los papeles
        var paperCount = 100;
        if (this.confettiPaperCount >= 0) {
            paperCount = this.confettiPaperCount;
        }
        this.confettiPapers = new Array();
        sm.ConfettiPaper.bounds = new Vector2(this.width, this.height);
        for (i = 0; i < paperCount; i++) {
            this.confettiPapers[i] = new sm.ConfettiPaper(Math.random() * this.width, Math.random() * this.height);
            this.addChild(this.confettiPapers[i]);
        }
    };
    
    p.start = function() {
        this.stop();
        this.createObjects();
        this.visible = true;
        (function(target) {
            target.interval = setInterval(function() {
                target.update(target);
            }, 1000.0 / frameRate);
        })(this);
        //if (SoundManager != undefined && SoundManager != null) SoundManager.play(this.soundId);
        window.audioInstance = createjs.Sound.play(this.soundId, createjs.Sound.INTERRUPT_ANY, 0, 0, false);
    };

    p.stop = function() {
        this.visible = false;
        clearInterval(this.interval);
        if (SoundManager != undefined && SoundManager != null) SoundManager.stop(this.soundId);
    };

    p.update = function(target) {
        for (var iPapers = 0; iPapers < target.confettiPapers.length; iPapers++) {
            target.confettiPapers[iPapers].update(dt);
        }
        for (var iRibbons = 0; iRibbons < target.confettiRibbons.length; iRibbons++) {
            target.confettiRibbons[iRibbons].update(dt);
        }
    };

    p.DisplayObject_draw = p.draw;

    p.draw = function(ctx, ignoreCache) {
        if (this.visible) {
            ctx.save();
            
            ctx.globalAlpha = this.bkgOpacity;
            ctx.beginPath();
            ctx.rect(0, 0, this.width, this.height);
            ctx.fillStyle = this.bkgColor;
            ctx.fill();
            ctx.globalAlpha = 1;
            
            for (var iPapers = 0; iPapers < this.confettiPapers.length; iPapers++) {
                this.confettiPapers[iPapers].updateContext(ctx);
                this.confettiPapers[iPapers].draw(ctx);
            }
            for (var iRibbons = 0; iRibbons < this.confettiRibbons.length; iRibbons++) {
                this.confettiRibbons[iRibbons].updateContext(ctx);
                this.confettiRibbons[iRibbons].draw(ctx);
            }
            ctx.restore();
        }
        return true;
    };

    p.isVisible = function() {
        return this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0;
    };

    p.clone = function() {
        var o = new Confetti(this.width, this.height);
        this.cloneProps(o);
        return o;
    };

    p.toString = function() {
        return "[Confetti (name=" + this.name + ")]";
    };

    sm.Confetti = Confetti;
} ());

// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------























