/*!
 * sm.js
 * v3.0.20160412
 * http://www.phoenixds.es/
 *
 * Copyright (c) 2011-2013
 * ©Phoenix Design Studios, S.L.
 */

/*
 * Librería de controles SM para motores educativos
 * @copyright (c) 2011-2015 ©Phoenix Design Studios, S.L.
 */

this.sm = this.sm || {};

var DEG_TO_RAD = Math.PI / 180;
var RAD_TO_DEG = 180 / Math.PI;

function showHandCursor(show) {
    if (show) {
        jQuery('body').css('cursor', 'pointer');
    } else {
        jQuery('body').css('cursor', 'default');
    }
};

function arrayContains(array, element) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == element) {
            return true;
        }
    }
    return false;
};

function validateNumericTextBox(evt) {
    var theEvent = evt || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode(key);
    var regex = /[0-9]|\-|\./;
    if (!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    }
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function replaceFont(fontString, newFontFamily) {
    var parts = fontString.split(" ");
    var result = "";
    for (var i = 0; i < parts.length - 1; i++) {
        var part = parts[i];
        result = part + " ";
    }
    result += newFontFamily;
    return result;
};

// Definimos la clase auxiliar para detección de navegador.
function browserDetect() { }

browserDetect.init = function () {
    var agent = navigator.userAgent;
    browserDetect.isEdge = (agent.indexOf("Edge") > -1);
    browserDetect.isExplorer = (agent.indexOf("MSIE ") > -1 || navigator.appVersion.indexOf("Trident/") > 0);
    browserDetect.isFirefox = (agent.indexOf("Firefox") > -1);
    browserDetect.isChrome = (agent.indexOf("Chrome") > -1);
    browserDetect.isOpera = (window.opera != null);
    browserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
    browserDetect.isAndroid = agent.indexOf("Android") > -1;
};

// Iniciamos la detección del navegador utilizado.
browserDetect.init();

var globalScaleX = 1;
var globalScaleY = 1;
var globalStage = null;
var canvasElement = null;
var counterDynDomEids = 0;
var touchEnabled = false;
var totalWidth;
var totalHeight;
var mainEngine = null;

// ---------------------------------------------------------------------------------------------------------
// sm.BaseEngine -------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var baseEngine = function (htmlCanvasId, cfg, animationEnd, unique) {
        this.initialize(htmlCanvasId, cfg, animationEnd, unique);
    };
    var p = baseEngine.prototype = new createjs.Container();
    p.singelton = null;

    p.running = false;

    p.Container_initialize = p.initialize;

    p.initialize = function (htmlCanvasId, cfg, animationEnd, unique) {
        this.activityEnded = false;
        this.com = new Mae.Com.Interactivos();
        this.iniciado = false;
        this.recoveredState = false;
        this.traceTotal = 0;
        this.traceAciertos = 0;
        this.traceIntentos = 0;
        this.mode = "A";
        this.loaded = false;
        this.loading = false;
        if (cfg != undefined && cfg != null) {
            this.Container_initialize();
            this.htmlCanvasId = htmlCanvasId;
            this.cfg = cfg;
            this.animationEnd = animationEnd;
            this.repeatButton = null;
            // Por defecto si no se especifica unique se asume único motor.
            if (unique == undefined || unique == true) {
                // Establecemos el objeto unico.
                p.singelton = this;
                mainEngine = this;
                // Inicializamos en entorno.
                this.setupEnvironment();
                // Nos agregamos al stage.
                this.Stage.addChild(this);
            }

            try {
                SoundManager.inicializarSnd("./data/audios/", audios);
            } catch (e) {
                SoundManager = {
                    play: function () {
                    },
                    stop: function () {
                    },
                    borrarTodosSonidos: function () {
                    },
                    registrarAudio: function () {
                    },
                    inicializarSnd: function () {
                    },
                    registrarEventListener: function () {
                    },
                };
            }
        }
    };

    p.setupEnvironment = function () {
        // Desactivamos la selección en el documento HTML.
        document.onselectstart = function () { return false; };

        // Definimos la clase auxiliar para detección de navegador.
        function browserDetect() { }
        browserDetect.init = function () {
            var agent = navigator.userAgent;
            browserDetect.isFirefox = (agent.indexOf("Firefox") > -1);
            browserDetect.isChrome = (agent.indexOf("Chrome") > -1);
            browserDetect.isOpera = (window.opera != null);
            browserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
        };
        // Iniciamos la detección del navegador utilizado.
        browserDetect.init();

        // Obtenemos el tamaño original del canvas y asignamos el evento de cambio de tamaño 
        var canvas = document.getElementById(this.htmlCanvasId);
        canvasElement = canvas;
        this.originalWidth = canvas.width;
        this.originalHeight = canvas.height;
        totalWidth = this.originalWidth;
        totalHeight = this.originalHeight;
        if (this.animationEnd != null) {
            this.animationEnd.width = this.originalWidth;
            this.animationEnd.height = this.originalHeight;
        }

        window.onresize = this.onResizeWindow;

        // Inicializamos valores de CreateJS y creamos el stage para el canvas.
        var useTouch = Modernizr.touch;
        this.Stage = new createjs.Stage(canvas, useTouch);
        this.Stage.enableMouseOver(10);
        createjs.Touch.enable(this.Stage);
        globalStage = this.Stage;
        touchEnabled = true;
        // Suprimimos notificación de errores de CrossDomain.
        createjs.DisplayObject.suppressCrossDomainErrors = true;

        //Obtenemos fuentes personalizadas que se usaran en los motores para realizar un printado previo
        var fonts = [];
        if (AjustFonts) {
            for (var af in AjustFonts) {
                fonts.push(AjustFonts[af]);
            }
        }
        this.dummiesText = [];
        this.getFonts(styles, fonts);
        for (var f = 0 in fonts) {
            var t = new createjs.Text("a0998324", "20px " + fonts[f], "#FFFFFF");
            t.alpha = 0.01;
            this.Stage.addChild(t);
            this.dummiesText.push(t);
        }
        this.Stage.update();
        //createjs.Ticker.timingMode = createjs.Ticker.RAF; // ESTO ACELERA LOS CICLOS
        createjs.Ticker.addEventListener("tick", this.tick);
        createjs.Ticker.setFPS(30);
    };

    p.preload = function () {
        createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin]);

        if (!createjs.Sound.isReady()) {
            alert("error");
        }

        var audiosForRegister = [];
        var audioPath = "data/audios/";
        if (numAudios > 0) {
            for (var fx = 0 in audios) {
                audiosForRegister.push({ id: audios[fx], src: audios[fx] + ".mp3" });
            }
            if (navigator.userAgent.indexOf("MSIE") > -1) {
                createjs.Sound.alternateExtensions = ["ogg"];
                createjs.Sound.registerSounds(audiosForRegister, audioPath);
                this.handleLoad();
            } else {
                createjs.Sound.addEventListener("fileload", createjs.proxy(this.handleLoad, this));
                createjs.Sound.alternateExtensions = ["ogg"];
                createjs.Sound.registerSounds(audiosForRegister, audioPath);
            }
        } else {
            this.handleLoad();
        }
    };

    p.handleLoad = function () {
        createjs.Sound.removeAllEventListeners();
        if (this.singelton != null) {
            window.onresize = this.singelton.onResizeWindow;
            this.singelton.runSingelton();
        } else {
            this.runThis();
        }
        this.running = true;
    };

    p.loadState = function () {
    };

    p.setStateData = function (state, mode) {
    };

    p.getStateData = function () {
        return {};
    };

    p.saveState = function (state) {
    };

    p.setMode = function (mode) {
    };

    p.registerEnd = function (engine, data) {
        engine.com.FinEjecucion(data);
    }

    p.eliminarFuentesDummy = function () {
        for (var t = 0 in this.dummiesText) {
            this.Stage.removeChild(this.dummiesText[t]);
        }
    };

    p.getFonts = function (obj, fonts) {
        for (var st = 0 in obj) {
            if (st.substring(0, 10) == "fontFamily") {
                if (!arrayContains(fonts, obj[st])) {
                    fonts.push(obj[st]);
                }
            }
            if (obj[st] instanceof Object) {
                this.getFonts(obj[st], fonts);
            }
        }
    };

    p.tick = function (event) {
        if (p.singelton != null) {
            p.singelton.stage.update();
        }

        //Borramos las fuentes pintadas
        if (this.dummiesText != undefined && this.dummiesText.length > 0)
            this.eliminarFuentesDummy();

        if (browserDetect.isFirefox && AjustFonts) {
            this.processAjustFont(this);
        }
    };

    p.processAjustFont = function(container) {
        if (container.children){
            for (var indexChild in container.children) {
                var child = container.children[indexChild];
                if (child instanceof createjs.Text && child.orgY == undefined) {
                    for (var indexAjustFont in AjustFonts) {
                        var ajustFont = AjustFonts[indexAjustFont];
                        if (child.font.indexOf(ajustFont) >= 0) {
                            var metrics = child.getMetrics();
                            child.orgY = child.y;
                            if (child.textBaseline == "middle") {
                                child.y += (metrics.lineHeight / 2) + metrics.vOffset;
                            } else {
                                child.y += (metrics.lineHeight / 8) + metrics.vOffset;
                            }
                        }
                    }
                } else if (child.children && child.children.length > 0) {
                    this.processAjustFont(child);
                }
            }
        }
    }

    p.isUnique = function () {
        return p.singelton != null;
    };

    p.setupObjects = function () {
        this.iniciado = false;
        if (this.cfg.buttonRepeat != undefined && this.cfg.buttonRepeat != null) {
            this.repeatButton = new sm.Button(this.cfg.buttonRepeat.width, styles.button.buttonHeight, this.cfg.buttonRepeat.x, this.cfg.buttonRepeat.y, this.onRepeatActivity);
            if (this.cfg.buttonRepeat.textId == undefined || this.cfg.buttonRepeat.textId == null) {
                this.repeatButton.setText("Repetir");
            } else {
                this.repeatButton.setText(this.cfg.buttonRepeat.textId);
            }
        }
        if (this.educamosBarNav != null) {

            this.repeatButton = this.educamosBarNav.getButton("Repeat");
            this.repeatButton.on("mousedown", function () {
                if (this.educamosBarNav.parent == null) {
                    this.educamosBarNav.parent = this;
                }
                this.getSingelton().onRepeatActivity.call(this.educamosBarNav);
            }, this);
        }
        if (this.getSingelton().cfg.platform === "Infantil" && this.footerTool != undefined) {
            styles.icons.Comenzar = styles.icons.Play;
            styles.icons.Pausar = styles.icons.Play;


            var audioButtonDef = styles.icons.Audio;
            var audioButtonImage = document.createElement("img");
            audioButtonImage.src = audioButtonDef.src.replace(/_/g, "/");
            audioButtonImage.width = audioButtonDef.width;
            audioButtonImage.height = audioButtonDef.height;

            var audioButtonRooloverDef = styles.icons.Audio_Rollover;
            var audioButtonRooloverImage = document.createElement("img");
            audioButtonRooloverImage.src = audioButtonRooloverDef.src.replace(/_/g, "/");
            audioButtonRooloverImage.width = audioButtonRooloverDef.width;
            audioButtonRooloverImage.height = audioButtonRooloverDef.height;

            var audioButtonDisabledDef = styles.icons.Audio_Desactivado;
            var audioButtonDisabledImage = document.createElement("img");
            audioButtonDisabledImage.src = audioButtonDisabledDef.src.replace(/_/g, "/");
            audioButtonDisabledImage.width = audioButtonDisabledDef.width;
            audioButtonDisabledImage.height = audioButtonDisabledDef.height;

            var audioButtonX = 2;
            var audioButtonY = styles.headerSM.height / 2;
            this.audioButton = new sm.ImageButton(audioButtonX, audioButtonY, audioButtonImage, audioButtonRooloverImage, audioButtonDisabledImage, createjs.proxy(this.onPlayEnunciado, this));
            this.audioButton.regX = 0;
            this.audioButton.regY = audioButtonImage.height / 2;
            this.audioButton.x = audioButtonX;
            this.audioButton.y = styles.headerSM.height / 2;
            this.headerTool.addChild(this.audioButton);
            this.headerTool.enunciado.x = audioButtonImage.width + styles.headerSM.objectDistanceBorder;

            var repeatButtonDef = styles.icons.VolverComenzar;
            var repeatButtonImage = document.createElement("img");
            repeatButtonImage.src = repeatButtonDef.src.replace(/_/g, "/");
            repeatButtonImage.width = repeatButtonDef.width;
            repeatButtonImage.height = repeatButtonDef.height;

            var repeatButtonRooloverDef = styles.icons.VolverComenzar_Rollover;
            var repeatButtonRooloverImage = document.createElement("img");
            repeatButtonRooloverImage.src = repeatButtonRooloverDef.src.replace(/_/g, "/");
            repeatButtonRooloverImage.width = repeatButtonRooloverDef.width;
            repeatButtonRooloverImage.height = repeatButtonRooloverDef.height;

            var repeatButtonDisabledDef = styles.icons.VolverComenzar_Desactivado;
            var repeatButtonDisabledImage = document.createElement("img");
            repeatButtonDisabledImage.src = repeatButtonDisabledDef.src.replace(/_/g, "/");
            repeatButtonDisabledImage.width = repeatButtonDisabledDef.width;
            repeatButtonDisabledImage.height = repeatButtonDisabledDef.height;

            var repeatButtonX = (totalWidth / 2) - (repeatButtonImage.width * 1.2);
            var repeatButtonY = (styles.footerSM.height - styles.footerSM.baseLineHeight) / 2;
            this.repeatButton = new sm.ImageButton(repeatButtonX, repeatButtonY, repeatButtonImage, repeatButtonRooloverImage, repeatButtonDisabledImage, createjs.proxy(this.onRepeatActivity, this));
            this.repeatButton.regX = repeatButtonImage.width / 2;
            this.repeatButton.regY = repeatButtonImage.height / 2;
            this.repeatButton.x = totalWidth - repeatButtonImage.width / 2 - styles.footerSM.marginRight;
            this.repeatButton.y = (styles.footerSM.height - styles.footerSM.baseLineHeight) / 2;
            this.repeatButton.setEnabled(false);
            this.footerTool.addChild(this.repeatButton);

            this.footerTool.addChild(this.getSingelton().navBar);
        }

        this.resizeCanvas();
    };

    p.educamosNavBarButtonClick = function (evt) {
        var button = evt.target;
        if (button.action == "repeat") {
            p.singelton.onRepeatActivity.call(p.singelton.educamosBarNav);
        } else if (button.action == "repeat") {

        }
    };

    p.onPlayEnunciado = function(button) {
        if (this.audioButton.audioId != undefined && this.audioButton.audioId != null) {
            this.playAudio(this.audioButton.audioId);
        }
    };

    p.setAudio = function(audioId) {
        if (this.audioButton) {
            this.audioButton.audioId = audioId;
        }
    };

    p.getRepeatButton = function () {
        //return this.educamosBarNav == null ? this.repeatButton : null;
        return this.repeatButton;
    };

    p.onLoadImages = function() {
        this.loaded = true;
        this.loading = false;
        this.run();
    }

    p.run = function () {
        if (this.imageSectionKey == undefined) {
            this.imageSectionKey = "imagenes";
        }
        if (!this.loaded) {
            this.loading = true;
            ImageManager.loadImages("data/imgs/" + this.imageSectionKey + ".js", this.imageSectionKey, this.onLoadImages, this);
            return false;
        }

        this.Stage = this.getStage();
        if (p.singelton != null) {
            this.educamosBarNav = null;
            setTimeout(new createjs.proxy(this.preload, this), 100);
        } else {
            this.runThis();
            return true;
        }
        this.running = true;
        this.activityEnded = false;
        if (this.onRunning) {
            this.onRunning(this);
        }
        return true;
    };

    p.runThis = function() {
        this.educamosBarNav = null;
        if (this.cfg.educamosBarNav != undefined && this.cfg.educamosBarNav != null) {
            this.educamosBarNav = new sm.EducamosBarNav(this.cfg.educamosBarNav, this.navBar);
        }
        this.setupObjects();
        if (this.educamosBarNav != null) {
            this.addChild(this.educamosBarNav);
        }
        this.running = true;
        this.activityEnded = false;
        if (this.onRunning) {
            this.onRunning(this);
        }
    }

    p.runSingelton = function () {
        var singelton = this.singelton != null ? this.singelton : this.getSingelton();
        singelton.educamosBarNav = null;
        if (singelton.cfg.educamosBarNav != undefined && singelton.cfg.educamosBarNav != null) {
            singelton.educamosBarNav = new sm.EducamosBarNav(singelton.cfg.educamosBarNav, this.navBar);
        }
        singelton.setupObjects();
        if (singelton.educamosBarNav != null) {
            singelton.addChild(singelton.educamosBarNav);
        }
        this.activityEnded = false;
    };

    p.stop = function () {
        this.running = false;
        this.activityEnded = true;
        this.removeAllChildren();
    };

    p.reset = function () {
        this.stop();
        this.iniciado = false;
        this.runSingelton();
        this.onReset(this);
    };

    p.onReset = function(target) {

    };

    p.onResizeWindow = function () {
        if (p.singelton != null) {
            p.singelton.resizeCanvas();
        }
    };

    p.resizeCanvas = function () {
        switch (this.cfg.sizeMode) {
            // Tamaño original. 
            case 0:
                break;
                // FullScreen manteniendo proporciones. 
            case 1:
                var factorW = window.innerWidth / this.originalWidth;
                var factorH = window.innerHeight / this.originalHeight;
                if (factorW <= factorH) {
                    this.Stage.canvas.width = window.innerWidth;
                    this.Stage.canvas.height = this.originalHeight * window.innerWidth / this.originalWidth;
                } else {
                    this.Stage.canvas.width = this.originalWidth * window.innerHeight / this.originalHeight;
                    this.Stage.canvas.height = window.innerHeight;
                }
                this.rescaleElements();
                break;
                // FullScreen ajustando a pantalla. 
            case 2:
                this.Stage.canvas.width = window.innerWidth;
                this.Stage.canvas.height = window.innerHeight;
                this.rescaleElements();
                break;
        }
        document.body.style.width = this.Stage.canvas.width + 'px';
    };

    p.rescaleElements = function () {
        if (this.Stage != undefined) {
            var scaleX = this.Stage.canvas.width / this.originalWidth;
            var scaleY = this.Stage.canvas.height / this.originalHeight;
            globalScaleX = scaleX;
            globalScaleY = scaleY;
            for (var indexChild = 0; indexChild < this.Stage.children.length; indexChild++) {
                var element = this.Stage.children[indexChild];
                element.scaleX = scaleX;
                element.scaleY = scaleY;

                if (element.x != undefined) {
                    if (element.orgX == undefined) {
                        element.orgX = element.x;
                    }
                    element.x = element.orgX * scaleX;
                }
                if (element.y != undefined) {
                    if (element.orgY == undefined) {
                        element.orgY = element.y;
                    }
                    element.y = element.orgY * scaleY;
                }
            }
        }
    };

    p.getSingelton = function () {
        return p.singelton;
    };

    p.getActiveEngine = function() {
        return this;
    }

    p.onEndActivity = function () {
    };

    p.onRepeatActivity = function () {
    };

    p.onFinishAnimation = function () {
    };

    p.fadeIn = function (miliseconds, callbackOnEnd, target, obj) {
        var seconds = miliseconds / 1000;
        var objectToFade = obj != undefined ? obj : canvasElement;
        $(objectToFade).resetKeyframe();
        window.onEndFadeIn = callbackOnEnd;
        window.onEndFadeInTarget = target;
        $(objectToFade).playKeyframe('fadeIn ' + seconds + 's linear 0s normal 1', createjs.proxy(this.endFadeIn, target));
    };

    p.endFadeIn = function (a) {
        $(a.target).resetKeyframe();
        $(a.target).css("opacity", 1);
        var onEndFadeInCallback = window.onEndFadeIn;
        var onEndFadeInTarget = window.onEndFadeInTarget;
        if (onEndFadeInCallback) {
            window.onEndFadeIn = undefined;
            window.onEndFadeInTarget = undefined;
            onEndFadeInCallback(onEndFadeInTarget);
        }
    };

    p.fadeOut = function (miliseconds, callbackOnEnd, target, obj) {
        var seconds = miliseconds / 1000;
        var objectToFade = obj != undefined ? obj : canvasElement;
        $(objectToFade).resetKeyframe();
        objectToFade.onEndFadeOut = callbackOnEnd;
        objectToFade.onEndFadeOutTarget = target;
        $(objectToFade).playKeyframe('fadeOut ' + seconds + 's linear 0s normal 1', createjs.proxy(this.endFadeOut, target));
    };

    p.endFadeOut = function (a) {
        $(a.target).resetKeyframe();
        $(a.target).css("opacity", 0);
        if (a.target.onEndFadeOut) {
            a.target.onEndFadeOut(a.target.onEndFadeOutTarget);
            a.target.onEndFadeOut = undefined;
            a.target.onEndFadeOutTarget = undefined;
        }
    };

    p.playAudio = function (audioId, onEnded, scope) {
        if (!audioId) return;
        this.stopAudio();
        window.audioInstance = createjs.Sound.play(audioId, createjs.Sound.INTERRUPT_ANY, 0, 0, false);
        if (onEnded) {
            window.audioInstance.on("complete", createjs.proxy(onEnded, scope));
        }
    };

    p.stopAudio = function () {
        createjs.Sound.stop();
    };

    sm.BaseEngine = baseEngine;
}());

// ---------------------------------------------------------------------------------------------------------
// sm.BaseAnimationEnd -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var baseAnimationEnd = function (cfg) {
        this.initialize(cfg);
    };
    var p = baseAnimationEnd.prototype = new createjs.Container();

    p.running = false;

    p.Container_initialize = p.initialize;

    p.initialize = function (cfg) {
        if (cfg != undefined && cfg != null) {
            this.Container_initialize();
            this.cfg = cfg;
        }
    };

    p.run = function (callbackOnFinished) {
    };

    p.stop = function () {
    };

    sm.BaseAnimationEnd = baseAnimationEnd;
}());

// ---------------------------------------------------------------------------------------------------------
// sm.CheckBox ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var checkBox = function (x, y, fixedWidth, callbackOnChecked, tipoCheck, drawBackgroundShape) {
        this.initialize(x, y, fixedWidth, callbackOnChecked, tipoCheck, drawBackgroundShape);
    }; //TIP tipoCheck:  0 check normal, 1 checkOk, 2 checkKO

    var p = checkBox.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, fixedWidth, callbackOnChecked, tipoCheck, drawBackgroundShape) {
        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.x = x;
        this.y = y;
        this.fixedWidth = fixedWidth;
        this.checked = false;
        this.callbackOnChecked = callbackOnChecked;
        this.enabled = true;
        this.drawBackgroundShape = drawBackgroundShape != undefined ? drawBackgroundShape : true;

        //OBJETOS DEL CHECKBOX
        this.bkgShp = null;
        this.roundShp = null;
        this.title = null;
        this.tipoCheck = 0;
        if (tipoCheck != undefined && tipoCheck != null) {
            this.tipoCheck = tipoCheck;
        }
        this.shpCheck = null; //Imagen del interior del check (checknormal, ok, cancel)

        //Bkg Fondo
        this.crearBkgShp();
        //Circulo Check
        this.crearRoundShp();
        //Circulo Check Selected
        this.setTipoCheck(this.tipoCheck);
        this.shpCheck.visible = false;

        this.on("click", function (event) {
            if (!this.enabled) {
                return;
            }

            this.checked = !this.checked;
            this.shpCheck.visible = this.checked;
            if (callbackOnChecked != null && callbackOnChecked != undefined) {
                callbackOnChecked(this);
            }
        });

        this.on("mouseover", function (event) {
            if (!this.enabled) {
                return;
            }
            showHandCursor(true);
        });

        this.on("mouseout", function (event) {
            if (!this.enabled) {
                return;
            }
            showHandCursor(false);
        });

    };

    p.getChecked = function () {
        return this.checked;
    };

    p.setChecked = function (flag) {
        this.checked = flag;
        if (this.shpCheck != null) {
            this.shpCheck.visible = this.checked;
        }
    };

    p.setEnabled = function (value) {
        this.enabled = value;
    };

    p.crearBkgShp = function () {
        this.removeChild(this.bkgShp);
        this.bkgShp = new createjs.Shape();
        this.bkgShp.width = styles.checkBox.outterCircleSize + (2 * styles.checkBox.outterCircleDistanceBorder);
        if (this.fixedWidth != null && this.fixedWidth != undefined) {
            this.bkgShp.width = this.fixedWidth;
        }
        this.bkgShp.height = styles.checkBox.height;
        this.bkgShp.x = 0;
        this.bkgShp.y = 0;
        this.bkgShp.graphics.clear()
            .setStrokeStyle(styles.checkBox.outterCircleBorderSize)
            .beginStroke(styles.checkBox.borderColor)
            .beginFill(styles.checkBox.backgroundColor)
            .drawRoundRect(0, 0, this.bkgShp.width - styles.checkBox.outterCircleBorderSize, this.bkgShp.height - 0, styles.checkBox.roundBorder)
            .endStroke();

        if (this.drawBackgroundShape && styles.checkBox.drawBackgroundShape) {
            this.addChild(this.bkgShp);
        }
    };

    p.ocultarBkgShp = function () {
        if (this.bkgShp != null && this.bkgShp != undefined) {
            this.bkgShp.alpha = 0;
        }
    };

    p.igualColorBkgShpConBorderColor = function () {
        if (this.bkgShp != null && this.bkgShp != undefined) {
            this.bkgShp.graphics.clear()
                .beginFill(styles.checkBox.borderColor)
                .drawRoundRect(0, 0, this.bkgShp.width, this.bkgShp.height, styles.checkBox.roundBorder);
        }
    };

    p.setTextColor = function (color) {
        if (this.title != null && this.title != undefined) {
            this.title.color = color;
        }
    };

    p.crearRoundShp = function () {
        this.removeChild(this.roundShp);
        this.roundShp = new createjs.Shape();
        this.roundShp.width = styles.checkBox.outterCircleSize;
        this.roundShp.height = styles.checkBox.outterCircleSize;
        this.roundShp.x = styles.checkBox.outterCircleDistanceBorder + (styles.checkBox.outterCircleSize / 2);
        this.roundShp.y = ((styles.checkBox.height - this.roundShp.height) / 2) + (styles.checkBox.outterCircleSize / 2);
        this.roundShp.graphics
            .setStrokeStyle(styles.checkBox.outterCircleBorderSize)
            .beginStroke(styles.checkBox.borderColor)
            .beginFill(styles.checkBox.backgroundColor)
            .drawCircle(0 - styles.checkBox.outterCircleBorderSize / 2, 0, styles.checkBox.outterCircleSize / 2)
            .endStroke();
        this.addChild(this.roundShp);
    };

    //O CheckNormal, 1 CheckOK, 2 CheckCancel
    p.setTipoCheck = function (tipo) {
        this.removeChild(this.shpCheck);
        if (tipo == undefined) tipo = 0;

        if (tipo == 0) {
            this.crearShpCheckNormal();
        } else if (tipo == 1) {
            this.crearShpCheckOK();
        } else if (tipo == 2) {
            this.crearShpCheckKO();
        }

        this.addChild(this.shpCheck);
    };

    p.crearShpCheckNormal = function () {

        this.shpCheck = new createjs.Shape();
        this.shpCheck.x = this.roundShp.x - styles.checkBox.outterCircleBorderSize / 2;
        this.shpCheck.y = this.roundShp.y;
        this.shpCheck.graphics
            .beginRadialGradientFill(["#999999", "#333333"], [0, 1], 2, -2, 1, 2, -2, styles.checkBox.innerCircleSize / 2)
            .drawCircle(0, 0, styles.checkBox.innerCircleSize / 2)
            .ef();
    };

    p.crearShpCheckOK = function () {

        this.shpCheck = new createjs.Shape();
        this.shpCheck.x = this.roundShp.x - styles.checkBox.outterCircleBorderSize / 2;
        this.shpCheck.y = this.roundShp.y;
        this.shpCheck.graphics
            .beginRadialGradientFill(["#40D445", "#38AD89"], [0.15, 0.84], 0, 0, 1, 0, 0, styles.checkBox.innerCircleSize / 2)
            .drawCircle(0, 0, styles.checkBox.innerCircleSize / 2)
            .f("#FFFFFF")
            .p("AgxgTIAoAdIA7g7IAAAoIg7A7IgogoIAAgd").cp()
            .ef();
    };

    p.crearShpCheckKO = function () {

        this.shpCheck = new createjs.Shape();
        this.shpCheck.x = this.roundShp.x - styles.checkBox.outterCircleBorderSize / 2;
        this.shpCheck.y = this.roundShp.y;
        this.shpCheck.graphics
            .beginRadialGradientFill(["#FF9999", "#CC0000"], [0.15, 1], 0, 0, 1, 0, 0, styles.checkBox.innerCircleSize / 2)
            .drawCircle(0, 0, styles.checkBox.innerCircleSize / 2)
            .f("#FFFFFF")
            .p("AAegxIAUAAIAAAUIgoAdIAoAeIAAAUIgUAAIgegoIgdAoIgUAAIAAgUIAogeIgogdIAAgUIAUAAIAdAoIAego")
            .cp()
            .ef();
    };

    p.setText = function (txt) {
        this.removeChild(this.title);
        this.title = new createjs.Text(txt, styles.checkBox.fontSize + "px " + styles.fontFamilyBold, styles.checkBox.fontColor);
        this.title.x = this.roundShp.x + (this.roundShp.width / 2) + styles.checkBox.titleOffsetToCircle;
        this.title.y = (styles.checkBox.height / 2 - this.title.getMeasuredHeight() / 2) - (this.title.getMeasuredHeight() / 5);
        this.title.textBaseline = "top";
        this.title.lineHeight = 20.5;

        this.addChild(this.title);

        //recalculamos el bgkShp en funcion del texto si no nos han definido ancho fijo
        if (this.fixedWidth == null || this.fixedWidth == undefined) {
            this.bkgShp.width = this.title.x + this.title.getMeasuredWidth() + styles.checkBox.titleOffsetToCircle;
            this.bkgShp.height = styles.checkBox.height;
            this.bkgShp.x = 0;
            this.bkgShp.y = 0;
            this.bkgShp.graphics.clear()
                .setStrokeStyle(3)
                .beginStroke(styles.checkBox.borderColor)
                .beginFill(styles.checkBox.backgroundColor)
                .drawRoundRect(0, 0, this.bkgShp.width, this.bkgShp.height, styles.checkBox.roundBorder)
                .endStroke();
        }
    };

    sm.CheckBox = checkBox;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.ImageRoundButton -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var imageRoundButton = function (radius, x, y, imageType, callbackClick, fontSize) {
        this.states = {};

        this.initialize(radius, x, y, imageType, callbackClick, fontSize);
    };

    var p = imageRoundButton.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (radius, x, y, imageType, callbackClick, fontSize) {
        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.states = { up: null, over: null, disabled: null };
        this.lastState = "up";

        this.radius = radius;
        this.x = x;
        this.y = y;
        this.imageType = imageType;
        this.callbackClick = callbackClick;
        this.symbol = null;
        this.enabled = true;
        this.fontSize = styles.imageRoundButton.fontSize;
        if (fontSize != undefined) {
            this.fontSize = fontSize;
        }

        //Color Boton
        if (styles.imageRoundButton.backgroundColor != null && styles.imageRoundButton.backgroundColor != "") {
            var upShape = this.createShape(styles.imageRoundButton.backgroundColor);
            this.states.up = upShape;
            this.addChild(upShape);
        }

        //color Hover
        if (styles.imageRoundButton.backgroundColorHover != null && styles.imageRoundButton.backgroundColorHover != "") {
            var hoverShape = this.createShape(styles.imageRoundButton.backgroundColorHover);
            hoverShape.visible = false;
            this.states.hover = hoverShape;
            this.addChild(hoverShape);
        }

        //color Disabled
        if (styles.imageRoundButton.backgroundColorDisabled != null && styles.imageRoundButton.backgroundColorDisabled != "") {
            var disabledShape = this.createShape(styles.imageRoundButton.backgroundColorDisabled);
            disabledShape.visible = false;
            this.states.disabled = disabledShape;
            this.addChild(disabledShape);
        }

        //Simbolo
        if (imageType != null && imageType != "") {
            var symbol = this.createSymbol();
            this.addChild(symbol);
        }

        this.on("mouseover", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "hover");
                showHandCursor(true);
            }
        });

        this.on("click", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(true);
                if (this.callbackClick)
                    this.callbackClick(this);
            }
        });

        this.on("mouseout", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(false);
            }
        });
    };

    p.createShape = function (backgroundColor) {
        var shp = new createjs.Shape();
        shp.graphics
	        .setStrokeStyle(styles.imageRoundButton.borderSize)
            .beginStroke(styles.imageRoundButton.borderColor)
	        .beginFill(backgroundColor)
            .drawCircle(0, 0, this.radius)
            .endStroke();

        return shp;
    };


    p.swapStates = function (last, current) {
        if (this.enabled && (last != current) && this.states[last] && this.states[current]) {
            this.states[current].visible = true;
            this.states[last].visible = false;

            this.lastState = current;

            return true;
        }
        else if (!this.enabled && this.states["disabled"]) {
            this.states["disabled"].visible = true;
            this.lastState = "disabled";
            return true;
        }

        return false;
    };

    p.setEnabled = function (value) {
        this.enabled = value;

        if (this.enabled) {
            this.swapStates(this.lastState, "up");
        } else {
            this.swapStates(this.lastState, "disabled");
            showHandCursor(false);
        }

        if (this.text != null && this.text != undefined) {
            if (this.enabled) {
                this.text.color = styles.imageRoundButton.fontColor;
            } else {
                this.text.color = styles.imageRoundButton.fontColorDisabled;
            }
        }
    };

    p.createSymbol = function () {
        this.removeChild(this.symbol);
        var txt = "";

        switch (this.imageType) {
            case 'contents':
                txt = "a";
                break;
            case 'prev':
                txt = "b";
                break;
            case 'next':
                txt = "c";
                break;
            case 'down':
                txt = "d";
                break;
            case 'up':
                txt = "e";
                break;
            case 'left':
                txt = "f";
                break;
            case 'right':
                txt = "g";
                break;
            case 'audio':
                txt = "h";
                break;
            case 'cc':
                txt = "i";
                break;
            case 'ok':
                txt = "j";
                break;
            case 'cancel':
                txt = "k";
                break;
            case 'document':
                txt = "l";
                break;
            case 'link':
                txt = "m";
                break;
            case 'maximize':
                txt = "n";
                break;
            case 'help':
                txt = "o";
                break;
            case 'pause':
                txt = "p";
                break;
            case 'image':
                txt = "q";
                break;
            case 'add':
                txt = "s";
                break;
            case 'sm':
                txt = "t";
                break;
            case 'reset':
                txt = "u";
                break;
            case 'tickok':
                txt = "v";
                break;
        }

        this.symbol = new createjs.Text(txt, this.fontSize + "px " + styles.imageRoundButton.fontFamily, styles.imageRoundButton.fontColor);
        this.symbol.x = -(this.symbol.getMeasuredWidth() / 2);
        this.symbol.y = -(this.symbol.getMeasuredLineHeight() / 2);
        this.addChild(this.symbol);

        if (!this.enabled) {
            this.symbol.color = styles.imageRoundButton.fontColorDisabled;
        }
    };

    sm.ImageRoundButton = imageRoundButton;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.ImageButton -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var imageButton = function (x, y, imageUp, imageOver, imageDisabled, callbackClick) {
        this.states = {};
        this.initialize(x, y, imageUp, imageOver, imageDisabled, callbackClick);
    };

    var p = imageButton.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, imageUp, imageOver, imageDisabled, callbackClick) {
        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.states = { up: imageUp, hover: imageOver, disabled: imageDisabled };
        this.lastState = "up";

        this.x = x;
        this.y = y;
        if (imageUp) {
            this.width = imageUp.width;
            this.height = imageUp.height;
        }
        this.callbackClick = callbackClick;
        this.enabled = true;
        this.cursor = "pointer";

        this.bitmap = new createjs.Bitmap(imageUp);
        this.addChild(this.bitmap);

        this.on("mouseover", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "hover");
            }
        });

        this.on("click", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
                if (this.callbackClick)
                    this.callbackClick(this);
            }
        });

        this.on("mouseout", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
            }
        });
    };

    p.changeImages = function (imageUp, imageOver, imageDisabled) {
        this.states = { up: imageUp, hover: imageOver, disabled: imageDisabled }
        this.bitmap.image = this.states[this.lastState];
    };

    p.swapStates = function (last, current) {
        if (this.enabled && (last != current) && this.states[last] && this.states[current]) {
            this.bitmap.image = this.states[current];
            this.lastState = current;
            return true;
        }
        else if (!this.enabled && this.states["disabled"]) {
            this.bitmap.image = this.states["disabled"];
            this.lastState = "disabled";
            return true;
        }

        return false;
    };

    p.setEnabled = function (value) {
        this.enabled = value;

        if (this.enabled) {
            this.swapStates(this.lastState, "up");
            this.cursor = "pointer";
        } else {
            this.swapStates(this.lastState, "disabled");
            this.cursor = "default";
            //showHandCursor(false);
        }
    };

    sm.ImageButton = imageButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.Button -----------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var button = function (width, height, x, y, callbackClick, buttonStyle) {
        this.states = {};

        this.initialize(width, height, x, y, callbackClick, buttonStyle);
    };

    var p = button.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (width, height, x, y, callbackClick, buttonStyle) {
        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.states = { up: null, over: null, disabled: null };
        this.lastState = "up";

        this.buttonStyle = styles.button; //Estilo del boton por defecto a no se que se pase
        if (buttonStyle != null && buttonStyle != undefined) {
            this.buttonStyle = buttonStyle;
        }

        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.blinking = false;
        this.blinkingUp = false;
        this.blinkingDown = false;
        this.callbackClick = callbackClick;

        this.text = null;
        this.enabled = true;
        this.checked = false;

        //Color Boton
        if (this.buttonStyle.backgroundColor != null && this.buttonStyle.backgroundColor != "") {
            var upShape = this.createShape(this.buttonStyle.backgroundColor);
            this.states.up = upShape;
            this.addChild(upShape);
        }

        //color Hover
        if (this.buttonStyle.backgroundColorHover != null && this.buttonStyle.backgroundColorHover != "") {
            var hoverShape = this.createShape(this.buttonStyle.backgroundColorHover);
            hoverShape.visible = false;
            this.states.hover = hoverShape;
            this.addChild(hoverShape);
        }

        //color Disabled
        if (this.buttonStyle.backgroundColorDisabled != null && this.buttonStyle.backgroundColorDisabled != "") {
            var disabledShape = this.createShape(this.buttonStyle.backgroundColorDisabled);
            disabledShape.visible = false;
            this.states.disabled = disabledShape;
            this.addChild(disabledShape);
        }
        this.on("mouseover", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "hover");
                showHandCursor(true);
            }
        });

        this.on("click", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(true);
                if (this.callbackClick) {
                    this.callbackClick(this);
                }
            }
        });

        this.on("mouseout", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(false);
            }
        });
    };

    p.setChecked = function (flag) {
        if (this.enabled) {
            if (flag) {
                this.swapStates(this.lastState, "hover");
                this.checked = flag;
            } else {
                this.checked = flag;
                this.swapStates("hover", "up");
            }
        }
    };

    p.createShape = function (backgroundColor) {
        var shp = new createjs.Shape();
        shp.width = this.width;
        shp.height = this.height;
        if (this.buttonStyle.borderSize > 0) {
            shp.graphics.setStrokeStyle(this.buttonStyle.borderSize).beginStroke(this.buttonStyle.borderColor);
        }
        shp.graphics.beginFill(backgroundColor).drawRoundRectComplex(0, 0, shp.width, shp.height, this.buttonStyle.topLeftRoundBorder, this.buttonStyle.topRightRoundBorder, this.buttonStyle.bottomRightRoundBorder, this.buttonStyle.bottomLeftRoundBorder);

        return shp;
    };

    p.swapStates = function (last, current) {
        if (!this.checked) {
            if (this.enabled && (last != current) && this.states[last] && this.states[current]) {
                this.states[current].visible = true;
                this.states[last].visible = false;

                this.lastState = current;

                return true;
            } else if (!this.enabled && this.states["disabled"]) {
                this.states["disabled"].visible = true;
                this.lastState = "disabled";
                return true;
            }
        }
        return false;
    };

    p.setEnabled = function (value) {
        this.enabled = value;

        if (this.enabled) {
            this.swapStates(this.lastState, "up");
        } else {
            this.swapStates(this.lastState, "disabled");
            showHandCursor(false);
        }

        if (this.text != null && this.text != undefined) {
            if (this.enabled) {
                this.text.color = this.buttonStyle.fontColor;
            } else {
                this.text.color = this.buttonStyle.fontColorDisabled;
            }
        }
    };

    p.setText = function (txt) {
        this.removeChild(this.text);
        var font = this.buttonStyle.font != undefined ? this.buttonStyle.font : this.buttonStyle.fontSize + "px " + this.buttonStyle.fontFamily;
        this.text = new createjs.Text(txt, font, this.buttonStyle.fontColor);
        this.text.x = (this.width - this.text.getMeasuredWidth()) / 2;
        if (browserDetect.isFirefox) {
            this.text.y = (this.height - this.text.getMeasuredHeight()) / 2;
        } else {
            this.text.y = (this.height - this.text.getMeasuredHeight()) / 2 - (this.text.getMeasuredHeight() / 5);
        }

        this.addChild(this.text);

        if (!this.enabled) {
            this.text.color = this.buttonStyle.fontColorDisabled;
        }
    };

    p.blink = function (value) {
        if (value) {
            this.blinking = true;
            this.blinkingDown = true;
            this.blinkingUp = false;
        } else {
            this.blinking = false;
            this.blinkingDown = false;
            this.blinkingUp = false;
        }
        this.alpha = 1;
    };

    p.Container_draw = p.draw;
    p.draw = function (ctx, ignoreCache) {
        if (this.blinking) {
            if (this.blinkingDown) {
                this.alpha *= 0.85;
            }
            if (this.blinkingUp) {
                this.alpha /= 0.85;
            }
            if (this.alpha < 0.05) {
                this.blinkingDown = false;
                this.blinkingUp = true;
                this.alpha = 0.05;
            }
            if (this.alpha > 1) {
                this.blinkingDown = true;
                this.blinkingUp = false;
                this.alpha = 1;
            }
        }
        if (this.Container_draw(ctx, ignoreCache)) { return true; }
    };

    sm.Button = button;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.FooterTool -------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var footerTool = function (width, x, y) {
        this.initialize(width, x, y);
    };

    var p = footerTool.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (width, x, y) {
        this.Container_initialize();

        this.width = width;
        this.x = x;
        this.y = y;

        //OBJETOS DEL FOOTER
        this.footerShp = null;

        //Pastilla Fondo
        this.crearPastillaFooter();

    };

    p.crearPastillaFooter = function () {
        this.removeChild(this.footerShp);
        this.footerShp = new createjs.Shape();
        this.footerShp.width = this.width;
        this.footerShp.height = styles.footerSM.height;
        this.footerShp.graphics.beginFill(styles.footerSM.backgroundColor)
            .drawRect(0, 0, this.footerShp.width, this.footerShp.height);
        if (styles.footerSM.baseLineHeight && styles.footerSM.baseLineColor) {
            this.footerShp.graphics.beginFill(styles.footerSM.baseLineColor)
                .drawRect(0, this.footerShp.height - styles.footerSM.baseLineHeight, this.footerShp.width, styles.footerSM.baseLineHeight);
        }
        this.addChild(this.footerShp);
    };

    sm.FooterTool = footerTool;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.HeaderTool -------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var headerTool = function (width) {
        this.initialize(width);
    };

    var p = headerTool.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (width) {
        this.Container_initialize();

        this.x = 0;
        this.y = 0;
        this.width = width;

        //OBJETOS DEL HEADER
        this.headerShp = null;
        this.logo = null;
        this.icon = null;
        this.enunciado = null;

        //Pastilla Fondo
        this.crearPastillaHeader();
        //LOGO SM
        this.setLogo(styles.headerSM.logoSM);
        //ICONO ACTIVIDAD SI LO HUBIERA
        this.setIcon(styles.headerSM.icon);
    };

    p.crearPastillaHeader = function () {
        this.removeChild(this.headerShp);
        this.headerShp = new createjs.Shape();
        this.headerShp.width = this.width;
        this.headerShp.x = 0;
        this.headerShp.y = 0;
        this.headerShp.height = styles.headerSM.height;
        if (styles.headerSM.simple) {
            this.headerShp.height = styles.headerSM.minHeight;
        }
        this.headerShp.graphics.beginFill(styles.headerSM.backgroundColor)
            .drawRect(0, 0, this.headerShp.width, this.headerShp.height);
        this.addChild(this.headerShp);
        if (styles.headerSM.backgroundImage) {
            var image = document.createElement("img");
            image.src = styles.headerSM.backgroundImage.image.replace(/_/g, "/");
            image.height = styles.headerSM.backgroundImage.height;
            image.width = styles.headerSM.backgroundImage.width;
            var imageHeader = new createjs.Bitmap(image);
            imageHeader.x = this.headerShp.width - styles.headerSM.backgroundImage.offsetRight;
            imageHeader.y = styles.headerSM.backgroundImage.y;
            this.addChild(imageHeader);
        }
    };

    p.setLogo = function (idLogo) {
        this.removeChild(this.logo);
        if (!styles.headerSM.simple && idLogo != "") {
            var imgLogo = ImageManager.getImage(idLogo);
            if (imgLogo != null) {
                this.logo = new createjs.Bitmap(imgLogo);
                if (this.logo.image != null && this.logo.image != undefined) {
                    this.logo.x = this.width - this.logo.image.width - styles.headerSM.objectDistanceBorder;
                    this.logo.y = styles.headerSM.height / 2 - this.logo.image.height / 2;
                    this.logo.height = this.logo.image.height;
                    this.logo.width = this.logo.image.width;
                    this.addChild(this.logo);
                }
            }
        }
    };

    p.setIcon = function (idIcon) {
        this.removeChild(this.icon);
        if (!styles.headerSM.simple && idIcon != "") {
            var imgIcon = ImageManager.getImage(idIcon);
            if (imgIcon != null) {
                this.icon = new createjs.Bitmap(imgIcon);
                if (this.icon.image != null && this.icon.image != undefined) {
                    this.icon.x = styles.headerSM.objectDistanceBorder;
                    this.icon.y = styles.headerSM.height / 2 - this.icon.image.height / 2;
                    this.icon.height = this.icon.image.height;
                    this.icon.width = this.icon.image.width;
                    this.addChild(this.icon);
                }
            }
        }
    };

    p.setTituloEnunciado = function (text) {
        var enunciadoX = styles.headerSM.objectDistanceBorder;
        if (this.enunciado) {
            enunciadoX = this.enunciado.x;
        }
        this.removeChild(this.enunciado);
        if (!styles.headerSM.simple) {
            var font = "";
            if (styles.headerSM.font) {
                font = styles.headerSM.font;
            } else {
                font = styles.headerSM.fontSize + "px " + styles.headerSM.fontFamily;
            }
            this.enunciado = new createjs.Text(text, font, styles.headerSM.fontColor);
            this.enunciado.lineHeight = 20;
            this.enunciado.x = enunciadoX;
            if (this.icon != null && this.icon != undefined) {
                this.enunciado.x += this.icon.width + styles.headerSM.objectDistanceBorder;
            }
            this.enunciado.y = (styles.headerSM.height / 2) - (this.enunciado.getMeasuredHeight() / 2);
            this.addChild(this.enunciado);
        }
    };

    sm.HeaderTool = headerTool;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.BarraSeleccion ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var barraSeleccion = function (x, y, numSteps, callbackBtnClick) {
        this.initialize(x, y, numSteps, callbackBtnClick);
    };

    var p = barraSeleccion.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, numSteps, callbackBtnClick) {
        this.Container_initialize();

        this.x = x;
        this.y = y;
        this.numSteps = numSteps;
        this.callbackBtnClick = callbackBtnClick;
        this.activeButton = null;
        this.buttons = [];

        this.RecreateButtons();
    };

    p.RecreateButtons = function () {
        var offsetX = 0;
        for (var i = 0; i < this.numSteps; i++) {
            var button = new sm.Button(styles.selectionBar.buttonSize, styles.selectionBar.buttonSize, offsetX, 0, this.onClickBtnSelectionBar, styles.selectionBar.button);
            button.setText(i + 1, styles.selectionBar.button.fontSize + "px " + styles.selectionBar.button.fontFamilySymbol);
            button.text.y = (button.height - button.text.getMeasuredHeight()) / 2;
            button.step = i + 1;
            this.buttons.push(button);
            this.addChild(button);
            offsetX += styles.selectionBar.buttonSize + styles.selectionBar.offset;
            if (i == 0) {
                this.activeButton = button;
                this.setActive(button);
            }
        }
    };

    p.onClickBtnSelectionBar = function () {
        this.parent.setActive(this);
        if (this.parent.callbackBtnClick != undefined) {
            this.parent.callbackBtnClick(this, "none", this.step);
        }
    };

    p.setActive = function (button) {
        //Quitamos anterior como seleccionado
        this.activeButton.setChecked(false);
        //Fijamos el actual
        this.activeButton = button;
        this.activeButton.setChecked(true);
    };

    sm.BarraSeleccion = barraSeleccion;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.BarraSeleccionInfantil ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var barraSeleccionInfantil = function (x, y, numSteps, callbackBtnClick) {
        this.initialize(x, y, numSteps, callbackBtnClick);
    };

    var p = barraSeleccionInfantil.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, numSteps, callbackBtnClick) {
        this.Container_initialize();

        this.x = x;
        this.y = y;
        this.numSteps = numSteps;
        this.activeStepIndex = 0;
        this.callbackBtnClick = callbackBtnClick;
        this.activeButton = null;
        this.buttons = [];

        this.CreateSteps();
        if (this.numSteps > 0) {
            this.activateStep(1);
        }
        this.RecreateButtons();
        this.buttonAtras.setEnabled(this.activeStepIndex > 1);
        this.buttonAdelante.setEnabled(this.activeStepIndex < this.numSteps);
    };

    p.CreateSteps = function () {
        this.steps = [];
        var offsetX = styles.footerSM.marginLeft;
        for (var index = 0; index < this.numSteps; index++) {
            // Creamos la imagen no activa.
            var i = index <= styles.icons.Steps.length - 1 ? index : index - styles.icons.Steps.length;
            var stepDef = styles.icons.Steps[i];
            var stepImage = document.createElement("img");
            stepImage.src = stepDef.src.replace(/_/g, "/");
            stepImage.width = stepDef.width;
            stepImage.height = stepDef.height;
            // Creamos la imagen  activa.
            var stepActiveDef = styles.icons.StepsActive[i];
            var stepActiveImage = document.createElement("img");
            stepActiveImage.src = stepActiveDef.src.replace(/_/g, "/");
            stepActiveImage.width = stepActiveDef.width;
            stepActiveImage.height = stepActiveDef.height;
            // Creamos el objeto Bitmap.
            var stepBitmap = new createjs.Bitmap(stepImage);
            stepBitmap.NoActiveImage = stepImage;
            stepBitmap.ActiveImage = stepActiveImage;
            stepBitmap.x = offsetX + stepImage.width;
            stepBitmap.y = (styles.footerSM.height / 2);
            stepBitmap.regX = stepImage.width / 2;
            stepBitmap.regY = stepImage.height / 2;
            this.addChild(stepBitmap);
            this.steps.push(stepBitmap);
            offsetX += (stepImage.width + styles.selectionBar.offset);
        }
    };

    p.activateStep = function (index) {
        if (this.activeStepIndex - 1 >= 0) {
            this.steps[this.activeStepIndex - 1].image = this.steps[this.activeStepIndex - 1].NoActiveImage;
        }
        this.activeStepIndex = index;
        this.steps[this.activeStepIndex - 1].image = this.steps[this.activeStepIndex - 1].ActiveImage;
    };

    p.RecreateButtons = function () {
        var butonAtrasDef = styles.icons.Atras;
        var butonAtrasImage = document.createElement("img");
        butonAtrasImage.src = butonAtrasDef.src.replace(/_/g, "/");
        butonAtrasImage.width = butonAtrasDef.width;
        butonAtrasImage.height = butonAtrasDef.height;

        var butonAtrasRooloverDef = styles.icons.Atras_Rollover;
        var butonAtrasRooloverImage = document.createElement("img");
        butonAtrasRooloverImage.src = butonAtrasRooloverDef.src.replace(/_/g, "/");
        butonAtrasRooloverImage.width = butonAtrasRooloverDef.width;
        butonAtrasRooloverImage.height = butonAtrasRooloverDef.height;

        var butonAtrasDisabledDef = styles.icons.Atras_Desactivado;
        var butonAtrasDisabledImage = document.createElement("img");
        butonAtrasDisabledImage.src = butonAtrasDisabledDef.src.replace(/_/g, "/");
        butonAtrasDisabledImage.width = butonAtrasDisabledDef.width;
        butonAtrasDisabledImage.height = butonAtrasDisabledDef.height;

        var buttonAtrasX = (totalWidth / 2) - (butonAtrasImage.width * 1.2);
        var buttonAtrasY = styles.footerSM.height / 2;
        this.buttonAtras = new sm.ImageButton(buttonAtrasX, buttonAtrasY, butonAtrasImage, butonAtrasRooloverImage, butonAtrasDisabledImage, this.onClickBtnSelectionBar);
        this.buttonAtras.regX = butonAtrasImage.width / 2;
        this.buttonAtras.regY = butonAtrasImage.height / 2;
        this.buttonAtras.action = "back";
        this.addChild(this.buttonAtras);

        var butonAdelanteDef = styles.icons.Adelante;
        var butonAdelanteImage = document.createElement("img");
        butonAdelanteImage.src = butonAdelanteDef.src.replace(/_/g, "/");
        butonAdelanteImage.width = butonAdelanteDef.width;
        butonAdelanteImage.height = butonAdelanteDef.height;

        var butonAdelanteRooloverDef = styles.icons.Adelante_Rollover;
        var butonAdelanteRooloverImage = document.createElement("img");
        butonAdelanteRooloverImage.src = butonAdelanteRooloverDef.src.replace(/_/g, "/");
        butonAdelanteRooloverImage.width = butonAdelanteRooloverDef.width;
        butonAdelanteRooloverImage.height = butonAdelanteRooloverDef.height;

        var butonAdelanteDisabledDef = styles.icons.Adelante_Desactivado;
        var butonAdelanteDisabledImage = document.createElement("img");
        butonAdelanteDisabledImage.src = butonAdelanteDisabledDef.src.replace(/_/g, "/");
        butonAdelanteDisabledImage.width = butonAdelanteDisabledDef.width;
        butonAdelanteDisabledImage.height = butonAdelanteDisabledDef.height;

        var buttonAdelanteX = (totalWidth / 2) + (butonAdelanteImage.width * 1.2);
        var buttonAdelanteY = styles.footerSM.height / 2;
        this.buttonAdelante = new sm.ImageButton(buttonAdelanteX, buttonAdelanteY, butonAdelanteImage, butonAdelanteRooloverImage, butonAdelanteDisabledImage, this.onClickBtnSelectionBar);
        this.buttonAdelante.regX = butonAdelanteImage.width / 2;
        this.buttonAdelante.regY = butonAdelanteImage.height / 2;
        this.buttonAdelante.action = "next";
        this.addChild(this.buttonAdelante);
    };

    p.onClickBtnSelectionBar = function () {
        this.parent.setActive(this);
    };

    p.setActive = function (button) {
        if (button.action === "back" && this.activeStepIndex - 1 >= 1) {
            this.activateStep(this.activeStepIndex - 1);
        }
        if (button.action === "next" && this.activeStepIndex + 1 <= this.numSteps) {
            this.activateStep(this.activeStepIndex + 1);
        }

        this.buttonAtras.setEnabled(this.activeStepIndex > 1);
        this.buttonAdelante.setEnabled(this.activeStepIndex < this.numSteps);

        if (this.callbackBtnClick != undefined) {
            this.callbackBtnClick(this, "none", this.activeStepIndex);
        }
    };

    sm.BarraSeleccionInfantil = barraSeleccionInfantil;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.BarraNavegacion --------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var barraNavegacion = function (x, y, numSteps, callbackBtnClick) {
        this.initialize(x, y, numSteps, callbackBtnClick);
    };

    var p = barraNavegacion.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, numSteps, callbackBtnClick) {
        this.Container_initialize();

        this.x = x;
        this.y = y;
        this.numSteps = numSteps;
        this.callbackBtnClick = callbackBtnClick;
        this.stepActual = 1;

        this.autoEnabledButtons = true;

        this.tituloEpigrafe = null;

        //Btn Izquierdo de navegacion
        this.btnPrev = new sm.Button(styles.navigationBar.size, styles.navigationBar.size, 0, 0, this.navOnPrev, styles.navigationBar.buttonLeft);
        this.btnPrev.setEnabled(false);
        this.btnPrev._barraNavegacion = this;
        this.btnPrev.setText("b", styles.navigationBar.fontSize + "px " + styles.fontFamilySymbol);
        this.btnPrev.text.y = (this.btnPrev.height - this.btnPrev.text.getMeasuredHeight()) / 2;
        this.addChild(this.btnPrev);

        //Btn Central de navegacion
        this.btnCenter = new sm.Button(styles.navigationBar.size * 1.5, styles.navigationBar.size, this.btnPrev.x + this.btnPrev.width + styles.navigationBar.offset, 0, null, styles.navigationBar.buttonCenter);
        this.btnCenter.setEnabled(false);
        this.btnCenter._barraNavegacion = this;
        this.addChild(this.btnCenter);
        this.btnCenter.setText(this.stepActual + "/" + this.numSteps);
        this.btnCenter.text.y = (this.btnCenter.height - this.btnCenter.text.getMeasuredHeight()) / 2;

        //Btn Derecho de navegacion
        this.btnNext = new sm.Button(styles.navigationBar.size, styles.navigationBar.size, this.btnCenter.x + this.btnCenter.width + styles.navigationBar.offset, 0, this.navOnNext, styles.navigationBar.buttonRight);
        this.btnNext.setEnabled(false);
        this.btnNext._barraNavegacion = this;
        this.btnNext.setText("c", styles.navigationBar.fontSize + "px " + styles.fontFamilySymbol);
        this.btnNext.text.y = (this.btnNext.height - this.btnNext.text.getMeasuredHeight()) / 2;
        this.addChild(this.btnNext);
    };

    p.navOnNext = function () {
        //Aumentar step y actualizar botonCentral
        if (this._barraNavegacion.stepActual < this._barraNavegacion.numSteps) {
            this._barraNavegacion.stepActual++;
            this._barraNavegacion.btnCenter.setText(this._barraNavegacion.stepActual + "/" + this._barraNavegacion.numSteps);
        }

        if (this._barraNavegacion.callbackBtnClick)
            this._barraNavegacion.callbackBtnClick(this._barraNavegacion, "next", this._barraNavegacion.stepActual);

        //Habilitar/Deshabilitar avances
        if (this._barraNavegacion.autoEnabledButtons) {
            if (this._barraNavegacion.stepActual > 1) {
                this._barraNavegacion.btnPrev.setEnabled(true);
            }
            if (this._barraNavegacion.stepActual == this._barraNavegacion.numSteps) {
                this._barraNavegacion.btnNext.setEnabled(false);
            }
        }
    };

    p.navOnPrev = function () {

        //Aumentar step y actualizar botonCentral
        if (this._barraNavegacion.stepActual > 1) {
            this._barraNavegacion.stepActual--;
            this._barraNavegacion.btnCenter.setText(this._barraNavegacion.stepActual + "/" + this._barraNavegacion.numSteps);
        }

        if (this._barraNavegacion.callbackBtnClick)
            this._barraNavegacion.callbackBtnClick(this._barraNavegacion, "prev", this._barraNavegacion.stepActual);

        //Habilitar/Deshabilitar avances
        if (this._barraNavegacion.autoEnabledButtons) {
            if (this._barraNavegacion.stepActual >= 1 && this._barraNavegacion.numSteps > 1) {
                this._barraNavegacion.btnNext.setEnabled(true);
            }
            if (this._barraNavegacion.stepActual == 1) {
                this._barraNavegacion.btnPrev.setEnabled(false);
            }
        }
    };

    p.reset = function () {
        this.stepActual = 1;
        this.btnCenter.setText(this.stepActual + "/" + this.numSteps);
        this.btnCenter.text.y = (this.btnCenter.height - this.btnCenter.text.getMeasuredHeight()) / 2;
    };

    p.setTituloEnunciado = function (text) {

        this.removeChild(this.tituloEpigrafe);
        this.tituloEpigrafe = new createjs.Text(text, styles.navigationBar.fontSize + "px " + styles.fontFamilyBold, styles.navigationBar.titleFontColor);
        this.tituloEpigrafe.x = this.btnNext.x + this.btnNext.width + (3 * styles.navigationBar.offset);
        this.tituloEpigrafe.y = (this.btnNext.height - this.tituloEpigrafe.getMeasuredHeight()) / 2;
        this.addChild(this.tituloEpigrafe);
    };

    p.activateNext = function (blink) {
        this.btnNext.setEnabled(true);
        if (blink) {
            this.btnNext.blink(true);
        }
    };

    p.desactivateNext = function () {
        this.btnNext.setEnabled(false);
        this.btnNext.blink(false);
    };

    p.activatePrevious = function (blink) {
        this.btnPrev.setEnabled(true);
        if (blink) {
            this.btnPrev.blink(true);
        }
    };

    p.desactivatePrevious = function () {
        this.btnPrev.setEnabled(false);
        this.btnPrev.blink(false);
    };

    sm.BarraNavegacion = barraNavegacion;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.ProgressImageBar ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var progressImageBar = function (numSteps, separation, stepImagesDef, stepActiveImagesDef) {
        this.initialize(numSteps, separation, stepImagesDef, stepActiveImagesDef);
    };

    var p = progressImageBar.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (numSteps, separation, stepImagesDef, stepActiveImagesDef) {
        this.Container_initialize();

        this.numSteps = numSteps;
        this.separation = separation;
        this.activeStepIndex = 0;
        this.stepImagesDef = stepImagesDef;
        this.stepActiveImagesDef = stepActiveImagesDef;

        this.createSteps();
        if (this.numSteps > 0) {
            this.setProgress(1);
        }
    };

    p.createSteps = function () {
        this.steps = [];
        var offsetX = 0;
        for (var index = 0; index < this.numSteps; index++) {
            var i = index <= this.stepImagesDef.length - 1 ? index : index - this.stepImagesDef.length;
            // Creamos la imagen no activa.
            var stepDef = this.stepImagesDef[i];
            var stepImage = document.createElement("img");
            stepImage.src = stepDef.src.replace(/_/g, "/");
            stepImage.width = stepDef.width;
            stepImage.height = stepDef.height;
            // Creamos la imagen  activa.
            var stepActiveDef = this.stepActiveImagesDef[i];
            var stepActiveImage = document.createElement("img");
            stepActiveImage.src = stepActiveDef.src.replace(/_/g, "/");
            stepActiveImage.width = stepActiveDef.width;
            stepActiveImage.height = stepActiveDef.height;
            // Creamos el objeto Bitmap.
            var stepBitmap = new createjs.Bitmap(stepImage);
            stepBitmap.NoActiveImage = stepImage;
            stepBitmap.ActiveImage = stepActiveImage;
            stepBitmap.x = offsetX + stepImage.width / 2;
            stepBitmap.y = (styles.footerSM.height / 2);
            stepBitmap.regX = stepImage.width / 2;
            stepBitmap.regY = stepImage.height / 2;
            this.addChild(stepBitmap);
            this.steps.push(stepBitmap);
            offsetX += (stepImage.width + this.separation);
        }
    };

    p.setSteps = function (numSteps) {
        if (this.steps) {
            for (var index in this.steps) {
                var step = this.steps[index];
                this.removeChild(step);
            }
        }
        this.numSteps = numSteps;
        this.createSteps();
        if (this.numSteps > 0) {
            this.setProgress(1);
        }
    };

    p.setProgress = function (value) {
        if (value > this.steps.length) {
            value = this.steps.length;
        }
        else if (value < 0) {
            value = 0;
        }
        if (this.activeStepIndex - 1 >= 0) {
            this.steps[this.activeStepIndex - 1].image = this.steps[this.activeStepIndex - 1].NoActiveImage;
        }
        this.activeStepIndex = value;
        this.steps[this.activeStepIndex - 1].image = this.steps[this.activeStepIndex - 1].ActiveImage;
    };

    p.getProgress = function() {
        return this.activeStepIndex;
    };

    sm.ProgressImageBar = progressImageBar;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.InfoPopupBig -----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var infoPopupBig = function (width, height, x, y, callbackCloseClick, iconClose) {
        this.initialize(width, height, x, y, callbackCloseClick, iconClose);
    };

    var p = infoPopupBig.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (width, height, x, y, callbackCloseClick, iconClose) {
        this.Container_initialize();

        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.callbackCloseClick = callbackCloseClick;
        this.iconClose = iconClose;

        //OBJETOS DEL FOOTER
        this.lineUp = null;
        this.lineDown = null;
        this.popupBkgShape = null;
        this.closeSymbol = null;
        this.text = null;

        //Fondo
        this.crearPopupBkgShape();
        //Crear LineUp
        this.crearLineUp();
        //Crear LineDown
        this.crearLineDown();
        //Crear Close
        this.crearCloseSymbol();
    };

    p.crearCloseSymbol = function () {
        this.removeChild(this.closeSymbol);

        if (this.iconClose != undefined && this.iconClose != null && styles.icons) {
            var buttonDef = styles.icons[this.iconClose];
            image = document.createElement("img");
            image.src = buttonDef.src.replace(/_/g, "/");
            image.height = buttonDef.height;
            image.width = buttonDef.width;
            var button = new createjs.Bitmap(image);
            button.x = this.width - image.width - 7;
            button.y = 7;
            button.width = buttonDef.width;
            button.height = buttonDef.height;
            button.enabled = true;
            (function (target) {
                target.setEnabled = function (value) {
                    target.enabled = value;
                    target.alpha = target.enabled ? 1.0 : 0.5;
                };
            })(button);

            var buttonHitArea = new createjs.Shape();
            buttonHitArea.graphics.beginFill("#FFFFFF").drawEllipse(0, 0, button.width, button.height);
            button.hitArea = buttonHitArea;
            this.closeSymbol = button;
        } else {
            this.closeSymbol = new createjs.Container();
            this.closeSymbol.width = 32;
            this.closeSymbol.height = 32;
            this.closeSymbol.x = this.width - styles.infoPopupBig.offset - 32;
            this.closeSymbol.y = 2 + styles.infoPopupBig.borderSize;

            var bkg = new createjs.Shape();
            bkg.graphics.beginFill(styles.infoPopupBig.backgroundColor)
                .drawRect(0, 0, this.closeSymbol.width, this.closeSymbol.height);
            this.closeSymbol.addChild(bkg);

            //Simbolo X
            this.symbolText = new createjs.Text("w", styles.infoPopupBig.fontSize + "px " + styles.fontFamilySymbol, styles.infoPopupBig.fontColor);
            this.symbolText.x = this.closeSymbol.width - this.symbolText.getMeasuredWidth();
            this.symbolText.y = styles.infoPopupBig.borderSize + 2;
            this.closeSymbol.addChild(this.symbolText);
        }

        this.addChild(this.closeSymbol);

        if (this.closeSymbol.on == undefined) {
            createjs.EventDispatcher.initialize(this.closeSymbol);
        }

        this.closeSymbol.on("click", function (event) {
            this.parent.callbackCloseClick("Cancel");
        });

        this.closeSymbol.on("mouseover", function (event) {
            showHandCursor(true);
        });

        this.closeSymbol.on("mouseout", function (event) {
            showHandCursor(false);
        });
    };

    p.closeButtonVisible = function (visible) {
        this.closeSymbol.visible = visible;
    };

    p.crearLineDown = function () {
        if (!styles.infoPopupBig.borderComplete && styles.infoPopupBig.hasBottomBorder) {
            this.removeChild(this.lineDown);
            this.lineDown = new createjs.Shape();
            this.lineDown.width = this.width;
            this.lineDown.height = styles.infoPopupBig.borderSize;
            this.lineDown.x = 0;
            this.lineDown.y = this.height - 1;
            this.lineDown.graphics.beginFill(styles.infoPopupBig.borderColor)
                .drawRect(0, 0, this.lineDown.width, this.lineDown.height);

            this.addChild(this.lineDown);
        }
    };

    p.crearLineUp = function () {
        if (!styles.infoPopupBig.borderComplete && styles.infoPopupBig.hasTopBorder) {
            this.removeChild(this.lineUp);
            this.lineUp = new createjs.Shape();
            this.lineUp.width = this.width;
            this.lineUp.height = styles.infoPopupBig.borderSize;
            this.lineUp.x = 0;
            this.lineUp.y = 0;
            this.lineUp.graphics.beginFill(styles.infoPopupBig.borderColor)
                .drawRect(0, 0, this.lineUp.width, this.lineUp.height);

            this.addChild(this.lineUp);
        }
    };

    p.crearPopupBkgShape = function () {
        this.removeChild(this.popupBkgShape);
        this.popupBkgShape = new createjs.Shape();
        this.popupBkgShape.width = this.width;
        this.popupBkgShape.height = this.height;
        if (styles.infoPopupBig.borderComplete) {
            this.popupBkgShape.graphics
                .setStrokeStyle(styles.infoPopupBig.borderSize)
                .beginStroke(styles.infoPopupBig.borderColor)
                .beginFill(styles.infoPopupBig.backgroundColor)
                .drawRoundRect(0, 0, this.popupBkgShape.width, this.popupBkgShape.height, styles.infoPopupBig.roundBorder)
                .endStroke();
        } else {
            this.popupBkgShape.graphics.beginFill(styles.infoPopupBig.backgroundColor)
                .drawRoundRect(0, 0, this.popupBkgShape.width, this.popupBkgShape.height, styles.infoPopupBig.roundBorder);
        }

        this.addChild(this.popupBkgShape);
    };

    p.setText = function (text) {
        this.removeChild(this.text);

        this.text = this.GeneraTexto(text, this.width);
        this.text.lineHeight = styles.fontLineHeight;
        this.text.x = styles.infoPopupBig.offset;
        this.text.y = this.closeSymbol.y + this.closeSymbol.height + styles.infoPopupBig.offset;
        this.addChild(this.text);
    };

    p.GeneraTexto = function (texto, widthContenedor) {

        var textoResultado = new createjs.Text("", styles.infoPopupBig.fontSize + "px " + styles.fontFamily, styles.infoPopupBig.fontColor);

        var linea = new createjs.Text("", styles.infoPopupBig.fontSize + "px " + styles.fontFamily, styles.infoPopupBig.fontColor);
        var palabras = texto.split(" ");
        for (var i = 0; i < palabras.length; i++) {
            var txt = new createjs.Text(palabras[i] + " ", styles.infoPopupBig.fontSize + "px " + styles.fontFamily, styles.infoPopupBig.fontColor);
            var anchoPalabra = txt.getMeasuredWidth();

            if (linea.getMeasuredWidth() + anchoPalabra < widthContenedor - 25) {
                linea.text += txt.text;
            } else {
                textoResultado.text += linea.text + "\n";
                linea = new createjs.Text(txt.text, styles.infoPopupBig.fontSize + "px " + styles.fontFamily, styles.infoPopupBig.fontColor);
            }

            if (i == palabras.length - 1) {
                textoResultado.text += linea.text;
            }
        }

        return textoResultado;
    };

    sm.InfoPopupBig = infoPopupBig;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.InfoPopupBigOkCancel ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var infoPopupBigOkCancel = function (width, height, x, y, txtOK, txtCancel, callbackCloseClick) {
        this.initialize(width, height, x, y, txtOK, txtCancel, callbackCloseClick);
    };

    var p = infoPopupBigOkCancel.prototype = new sm.InfoPopupBig();
    p.InfoPopupBig_initialize = p.initialize;

    p.initialize = function (width, height, x, y, txtOK, txtCancel, callbackCloseClick) {

        this.InfoPopupBig_initialize(width, height, x, y, txtOK, txtCancel, callbackCloseClick);

        this.Container_initialize();

        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.callbackCloseClick = callbackCloseClick;
        this.btnOk = null;
        this.btnCancel = null;
        this.txtOK = txtOK;
        this.txtCancel = txtCancel;

        //Fondo
        this.crearPopupBkgShape();
        //Crear LineUp
        this.crearLineUp();
        //Crear LineDown
        this.crearLineDown();
        //Crear Close
        this.crearCloseSymbol();
        //Crear Boton Aceptar y Cancelar
        this.crearBotonesOkCancel();
    };

    p.crearBotonesOkCancel = function () {
        this.removeChild(this.btnOk);
        this.removeChild(this.btnCancel);

        this.btnOk = new sm.Button(100, 40, styles.infoPopupBig.offset, this.lineDown.y - 40 - styles.infoPopupBig.offset, createjs.proxy(this.callbackClickOK, this));
        this.btnOk.setText(this.txtOK);
        this.addChild(this.btnOk);

        this.btnCancel = new sm.Button(100, 40, 100 + this.btnOk.x + styles.infoPopupBig.offset, this.btnOk.y, createjs.proxy(this.callbackClickCancel, this));
        this.btnCancel.setText(this.txtCancel);
        this.addChild(this.btnCancel);
    };

    p.callbackClickOK = function (event) {
        this.callbackCloseClick("Ok");
    };

    p.callbackClickCancel = function (event) {
        this.callbackCloseClick("Cancel");
    };

    sm.InfoPopupBigOkCancel = infoPopupBigOkCancel;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.SpeechBubble -----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var speechBubble = function (x, y, width, height, trianglePosition) {
        this.initialize(x, y, width, height, trianglePosition);
    };

    var p = speechBubble.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, width, height, trianglePosition) {
        this.Container_initialize();

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.trianglePosition = trianglePosition;
        this.speechBubbleShp = null;

        this.crearSpeechBubbleShp();
    };

    p.crearSpeechBubbleShp = function () {
        this.removeChild(this.speechBubbleShp);
        this.speechBubbleShp = new createjs.Shape();
        var round = styles.speechBubble.roundBorder;
        var triangleSize = styles.speechBubble.triangleSize;

        if (this.trianglePosition == "left") {
            this.speechBubbleShp.graphics.clear()
                .setStrokeStyle(styles.speechBubble.borderSize)
                .beginStroke(styles.speechBubble.borderColor)
                .beginFill(styles.speechBubble.backgroundColor)
                .moveTo(round, 0)
                .lineTo(this.width - round, 0)
                .arcTo(this.width, 0, this.width, round, round)
                .lineTo(this.width, this.height - round)
                .arcTo(this.width, this.height, this.width - round, this.height, round)
                .lineTo(round, this.height)
                .arcTo(0, this.height, 0, this.height - round, round)
                .lineTo(0, (this.height / 4) + (triangleSize / 2))
                .lineTo(-10, this.height / 4)
                .lineTo(0, (this.height / 4) - (triangleSize / 2))
                .lineTo(0, round)
                .arcTo(0, 0, round, 0, round)
                .endStroke();
        } else if (this.trianglePosition == "right") {
            this.speechBubbleShp.graphics.clear()
                .setStrokeStyle(styles.speechBubble.borderSize)
                .beginStroke(styles.speechBubble.borderColor)
                .beginFill(styles.speechBubble.backgroundColor)
                .moveTo(round, 0)
                .lineTo(this.width - round, 0)
                .arcTo(this.width, 0, this.width, round, round)
                .lineTo(this.width, (this.height / 4) - (triangleSize / 2))
                .lineTo(this.width + 10, this.height / 4)
                .lineTo(this.width, (this.height / 4) + (triangleSize / 2))
                .lineTo(this.width, this.height - round)
                .arcTo(this.width, this.height, this.width - round, this.height, round)
                .lineTo(round, this.height)
                .arcTo(0, this.height, 0, this.height - round, round)
                .lineTo(0, round)
                .arcTo(0, 0, round, 0, round)
                .endStroke();
        } else if (this.trianglePosition == "top") {
            this.speechBubbleShp.graphics.clear()
                .setStrokeStyle(styles.speechBubble.borderSize)
                .beginStroke(styles.speechBubble.borderColor)
                .beginFill(styles.speechBubble.backgroundColor)
                .moveTo(round, 0)
                .lineTo((this.width / 2) - (triangleSize / 2), 0)
                .lineTo(this.width / 2, -10)
                .lineTo((this.width / 2) + (triangleSize / 2), 0)
                .lineTo(this.width - round, 0)
                .arcTo(this.width, 0, this.width, round, round)
                .lineTo(this.width, this.height - round)
                .arcTo(this.width, this.height, this.width - round, this.height, round)
                .lineTo(round, this.height)
                .arcTo(0, this.height, 0, this.height - round, round)
                .lineTo(0, round)
                .arcTo(0, 0, round, 0, round)
                .endStroke();
        } else if (this.trianglePosition == "down") {
            this.speechBubbleShp.graphics.clear()
                .setStrokeStyle(styles.speechBubble.borderSize)
                .beginStroke(styles.speechBubble.borderColor)
                .beginFill(styles.speechBubble.backgroundColor)
                .moveTo(round, 0)
                .lineTo(this.width - round, 0)
                .arcTo(this.width, 0, this.width, round, round)
                .lineTo(this.width, this.height - round)
                .arcTo(this.width, this.height, this.width - round, this.height, round)
                .lineTo((this.width / 2) + (triangleSize / 2), this.height)
                .lineTo(this.width / 2, this.height + 10)
                .lineTo((this.width / 2) - (triangleSize / 2), this.height)
                .lineTo(round, this.height)
                .arcTo(0, this.height, 0, this.height - round, round)
                .lineTo(0, round)
                .arcTo(0, 0, round, 0, round)
                .endStroke();
        }

        this.addChild(this.speechBubbleShp);
    };

    sm.SpeechBubble = speechBubble;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.ResizeableBitmap -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var resizeableBitmap = function (imageOrUri, handlesSize, handlesColor) {
        this.initialize(imageOrUri, handlesSize, handlesColor);
    };
    var p = resizeableBitmap.prototype = new createjs.Container();

    resizeableBitmap.selection = null;

    p.image = null;
    p.snapToPixel = true;
    p.sourceRect = null;

    p.moveHandle = null;
    p.resizeHandles = [];
    p.excludeObjects = [];
    p.isDrag = false;
    p.isResizeDrag = false;
    p.expectResize = -1; // New, will save the # of the selection handle if the mouse is over one.
    p.mx = 0;
    p.my = 0; // mouse coordinates
    p.handlesSize = 25;
    p.rotationIncrement = 1;
    p.selected = false;
    p.enabled = true;
    p.flipped = false;
    p.editable = false;
    p.canMove = true;
    p.canRemove = true;
    p.canResize = true;
    p.canRotate = true;
    p.clonable = false;
    p.draggable = true;
    p.owner = null;
    //p.stage = null;
    p.handlesColor = "#000000";
    p.initScale = 1.0;
    p.dropScale = 1.0;
    p.dragScale = 1.0;
    p.lastScale = 1.0;
    p.origin = {
        x: 0,
        y: 0
    };

    p.onClickObject = null;
    p.onDragDrop = null;
    p.onClone = null;
    p.inHandle = false;
    p.onRemove = null;
    p.cursor = "pointer";

    p.Container_initialize = p.initialize;

    p.initialize = function (imageOrUri, handlesSize, handlesColor) {
        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.iconresize = new Image();
        this.iconresize.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAACHDwAAjA8AAP1SAACBQAAAfXkAAOmLAAA85QAAGcxzPIV3AAAKOWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAEjHnZZ3VFTXFofPvXd6oc0w0hl6ky4wgPQuIB0EURhmBhjKAMMMTWyIqEBEEREBRZCggAGjoUisiGIhKKhgD0gQUGIwiqioZEbWSnx5ee/l5ffHvd/aZ+9z99l7n7UuACRPHy4vBZYCIJkn4Ad6ONNXhUfQsf0ABniAAaYAMFnpqb5B7sFAJC83F3q6yAn8i94MAUj8vmXo6U+ng/9P0qxUvgAAyF/E5mxOOkvE+SJOyhSkiu0zIqbGJIoZRomZL0pQxHJijlvkpZ99FtlRzOxkHlvE4pxT2clsMfeIeHuGkCNixEfEBRlcTqaIb4tYM0mYzBXxW3FsMoeZDgCKJLYLOKx4EZuImMQPDnQR8XIAcKS4LzjmCxZwsgTiQ7mkpGbzuXHxArouS49uam3NoHtyMpM4AoGhP5OVyOSz6S4pyalMXjYAi2f+LBlxbemiIluaWltaGpoZmX5RqP+6+Dcl7u0ivQr43DOI1veH7a/8UuoAYMyKarPrD1vMfgA6tgIgd/8Pm+YhACRFfWu/8cV5aOJ5iRcIUm2MjTMzM424HJaRuKC/6386/A198T0j8Xa/l4fuyollCpMEdHHdWClJKUI+PT2VyeLQDf88xP848K/zWBrIieXwOTxRRKhoyri8OFG7eWyugJvCo3N5/6mJ/zDsT1qca5Eo9Z8ANcoISN2gAuTnPoCiEAESeVDc9d/75oMPBeKbF6Y6sTj3nwX9+65wifiRzo37HOcSGExnCfkZi2viawnQgAAkARXIAxWgAXSBITADVsAWOAI3sAL4gWAQDtYCFogHyYAPMkEu2AwKQBHYBfaCSlAD6kEjaAEnQAc4DS6Ay+A6uAnugAdgBIyD52AGvAHzEARhITJEgeQhVUgLMoDMIAZkD7lBPlAgFA5FQ3EQDxJCudAWqAgqhSqhWqgR+hY6BV2ArkID0D1oFJqCfoXewwhMgqmwMqwNG8MM2An2hoPhNXAcnAbnwPnwTrgCroOPwe3wBfg6fAcegZ/DswhAiAgNUUMMEQbigvghEUgswkc2IIVIOVKHtCBdSC9yCxlBppF3KAyKgqKjDFG2KE9UCIqFSkNtQBWjKlFHUe2oHtQt1ChqBvUJTUYroQ3QNmgv9Cp0HDoTXYAuRzeg29CX0HfQ4+g3GAyGhtHBWGE8MeGYBMw6TDHmAKYVcx4zgBnDzGKxWHmsAdYO64dlYgXYAux+7DHsOewgdhz7FkfEqeLMcO64CBwPl4crxzXhzuIGcRO4ebwUXgtvg/fDs/HZ+BJ8Pb4LfwM/jp8nSBN0CHaEYEICYTOhgtBCuER4SHhFJBLVidbEACKXuIlYQTxOvEIcJb4jyZD0SS6kSJKQtJN0hHSedI/0ikwma5MdyRFkAXknuZF8kfyY/FaCImEk4SXBltgoUSXRLjEo8UISL6kl6SS5VjJHslzypOQNyWkpvJS2lIsUU2qDVJXUKalhqVlpirSptJ90snSxdJP0VelJGayMtoybDFsmX+awzEWZMQpC0aC4UFiULZR6yiXKOBVD1aF6UROoRdRvqP3UGVkZ2WWyobJZslWyZ2RHaAhNm+ZFS6KV0E7QhmjvlygvcVrCWbJjScuSwSVzcopyjnIcuUK5Vrk7cu/l6fJu8onyu+U75B8poBT0FQIUMhUOKlxSmFakKtoqshQLFU8o3leClfSVApXWKR1W6lOaVVZR9lBOVd6vfFF5WoWm4qiSoFKmclZlSpWiaq/KVS1TPaf6jC5Ld6In0SvoPfQZNSU1TzWhWq1av9q8uo56iHqeeqv6Iw2CBkMjVqNMo1tjRlNV01czV7NZ874WXouhFa+1T6tXa05bRztMe5t2h/akjpyOl06OTrPOQ12yroNumm6d7m09jB5DL1HvgN5NfVjfQj9ev0r/hgFsYGnANThgMLAUvdR6KW9p3dJhQ5Khk2GGYbPhqBHNyMcoz6jD6IWxpnGE8W7jXuNPJhYmSSb1Jg9MZUxXmOaZdpn+aqZvxjKrMrttTjZ3N99o3mn+cpnBMs6yg8vuWlAsfC22WXRbfLS0suRbtlhOWWlaRVtVWw0zqAx/RjHjijXa2tl6o/Vp63c2ljYCmxM2v9ga2ibaNtlOLtdZzllev3zMTt2OaVdrN2JPt4+2P2Q/4qDmwHSoc3jiqOHIdmxwnHDSc0pwOub0wtnEme/c5jznYuOy3uW8K+Lq4Vro2u8m4xbiVun22F3dPc692X3Gw8Jjncd5T7Snt+duz2EvZS+WV6PXzAqrFetX9HiTvIO8K72f+Oj78H26fGHfFb57fB+u1FrJW9nhB/y8/Pb4PfLX8U/z/z4AE+AfUBXwNNA0MDewN4gSFBXUFPQm2Dm4JPhBiG6IMKQ7VDI0MrQxdC7MNaw0bGSV8ar1q66HK4RzwzsjsBGhEQ0Rs6vdVu9dPR5pEVkQObRGZ03WmqtrFdYmrT0TJRnFjDoZjY4Oi26K/sD0Y9YxZ2O8YqpjZlgurH2s52xHdhl7imPHKeVMxNrFlsZOxtnF7YmbineIL4+f5rpwK7kvEzwTahLmEv0SjyQuJIUltSbjkqOTT/FkeIm8nhSVlKyUgVSD1ILUkTSbtL1pM3xvfkM6lL4mvVNAFf1M9Ql1hVuFoxn2GVUZbzNDM09mSWfxsvqy9bN3ZE/kuOd8vQ61jrWuO1ctd3Pu6Hqn9bUboA0xG7o3amzM3zi+yWPT0c2EzYmbf8gzySvNe70lbEtXvnL+pvyxrR5bmwskCvgFw9tst9VsR23nbu/fYb5j/45PhezCa0UmReVFH4pZxde+Mv2q4quFnbE7+0ssSw7uwuzi7Rra7bD7aKl0aU7p2B7fPe1l9LLCstd7o/ZeLV9WXrOPsE+4b6TCp6Jzv+b+Xfs/VMZX3qlyrmqtVqreUT13gH1g8KDjwZYa5ZqimveHuIfu1nrUttdp15UfxhzOOPy0PrS+92vG140NCg1FDR+P8I6MHA082tNo1djYpNRU0gw3C5unjkUeu/mN6zedLYYtta201qLj4Ljw+LNvo78dOuF9ovsk42TLd1rfVbdR2grbofbs9pmO+I6RzvDOgVMrTnV32Xa1fW/0/ZHTaqerzsieKTlLOJt/duFczrnZ86nnpy/EXRjrjup+cHHVxds9AT39l7wvXbnsfvlir1PvuSt2V05ftbl66hrjWsd1y+vtfRZ9bT9Y/NDWb9nffsPqRudN65tdA8sHzg46DF645Xrr8m2v29fvrLwzMBQydHc4cnjkLvvu5L2key/vZ9yff7DpIfph4SOpR+WPlR7X/aj3Y+uI5ciZUdfRvidBTx6Mscae/5T+04fx/Kfkp+UTqhONk2aTp6fcp24+W/1s/Hnq8/npgp+lf65+ofviu18cf+mbWTUz/pL/cuHX4lfyr468Xva6e9Z/9vGb5Dfzc4Vv5d8efcd41/s+7P3EfOYH7IeKj3ofuz55f3q4kLyw8Bv3hPP74uYdwgAAAAlwSFlzAAAuIgAALiIBquLdkgAAAURJREFUSEu1lk1KBDEQhceNiuBSj+MlBP9WejP/BdGFjnfyFNK+r6DhETpJhZl58C1eT1fV1CSTymqapp2z+HDbuDkT7+JVvIhn8SQexYO4F5/iXHhcFzd3oqdvcSI8roubG1HTn6CrfeExKdy0ivyKY+Hvp3FzLVr6EgfCY1K4uRI9rcVwITeZImi4kJsLMYtt3NJQITeXAr2JPfETri4KHQrPsYibW/Eh5kC+KYlaSnXk5lQcmQcKZgqVHZGHfOH9gxqjHVGQX4RfJnJ4shaZjlhD1pI1RaxxxJfJWmQ68l3Jbo3YMlGPTKFZ/O8irkySIVtooyJAIc6yljgL4/0yeAROZU7nmjjV490yMAtzhfnCnKlpoyJMRiZkT0zaiCkTZGDGM+uZ+cx+7gB0xZ2AuwHbmLsCd4aIKRPshMWH22Va/QO7UQW1Rg2lEwAAAABJRU5ErkJggg==";
        this.iconresize.height = 25;
        this.iconresize.width = 25;

        this.iconremove = new Image();
        this.iconremove.src = "data:image/png;base64,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";
        this.iconremove.height = 25;
        this.iconremove.width = 25;

        this.iconrotate = new Image();
        this.iconrotate.src = "data:image/png;base64,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";
        this.iconrotate.height = 25;
        this.iconrotate.width = 25;

        this.imageOrUri = imageOrUri;
        if (handlesSize) {
            this.handlesSize = handlesSize;
        }
        if (handlesColor) {
            this.handlesColor = handlesColor;
        }
        if (typeof imageOrUri == "string") {
            this.image = new Image();
            this.image.src = imageOrUri;
        } else {
            this.image = imageOrUri;
        }

        this.Container_initialize();

        this.sourceRect = new createjs.Rectangle(0, 0, this.image.width, this.image.height);
        this.orgRect = new createjs.Rectangle(0, 0, this.image.width, this.image.height);
        this.regX = this.image.width / 2;
        this.regY = this.image.height / 2;

        this.moveHandle = new createjs.Bitmap(imageOrUri);
        this.moveHandle.regX = this.image.width / 2;
        this.moveHandle.x = this.moveHandle.regX;
        this.addChild(this.moveHandle);

        //        this.on("rollover", function(evt) {
        //            if (this.enabled && this.draggable && this.children.length < 5) {
        //                //this.lastScale = this.scaleX;
        //                //this.scaleX = this.dragScale;
        //                //this.scaleY = this.dragScale;
        //            }
        //        });

        //        this.on("rollout", function(evt) {
        //             if (this.enabled && this.draggable && this.children.length < 5) {
        //                 this.scaleX = this.scaleY = this.lastScale;
        //             }

        //        });

        this.on("mousedown", function (evt) {
            this.origin = { x: this.x, y: this.y };
            this.lastScale = this.scaleX;
        });

        this.on("pressmove", function (evt) {
            if (this.inHandle == true) {
                return;
            }

            if (this.enabled) {
                this.parent.addChild(this);
                if (this.onActivate != undefined && this.onActivate != null) {
                    this.onActivate();
                }
                //Drag
                if (this.canMove) {
                    this.scaleX = this.dragScale;
                    this.scaleY = this.dragScale;
                    //this.x = evt.stageX;
                    //this.y = evt.stageY;
                    //var aux = this.parent.globalToLocal(evt.stageX, evt.stageY);
                    var aux = this.parent.globalToLocal(evt.stageX, evt.stageY);
                    this.x = aux.x;
                    this.y = aux.y;
                }
            }
        });

        this.on("pressup", function (evt) {
            if (this.enabled) {
                if (this.inHandle == true) {
                    this.inHandle = false;
                    return;
                }

                if (this.notCheckObjectArea == undefined || this.notCheckObjectArea == false) {
                    var comparisonValue = this.image.width > this.image.height ? this.image.height : this.image.width;
                    if ((this.x - this.origin.x) * (this.x - this.origin.x) + (this.y - this.origin.y) * (this.y - this.origin.y) < comparisonValue * comparisonValue * this.dropScale * this.dropScale && this.children.length < 3) {
                        this.x = this.origin.x;
                        this.y = this.origin.y;
                        this.scaleX = this.lastScale;
                        this.scaleY = this.lastScale;
                        return;
                    }
                }

                //var aux = this.parent.globalToLocal(evt.stageX, evt.stageY);
                if (this.onDragDrop && this.enabled) {
                    this.scaleX = this.lastScale;
                    this.scaleY = this.lastScale;
                    this.onDragDrop(this, this.x, this.y);
                }

                if (this.editable) {
                    this.activate();
                    this.desactivate();
                    this.activate();
                }

                if (this.clonable && this.enabled) {
                    var objCloned = this.clone();
                    if (this.objDef != undefined) {
                        objCloned.objDef = this.objDef;
                    }
                    objCloned.parent = this.parent;
                    this.x = this.origin.x;
                    this.y = this.origin.y;
                    if (this.onClone) {
                        var cloneX = evt.stageX * (this.parent.originalWidth / this.parent.stage.canvas.width);
                        var cloneY = evt.stageY * (this.parent.originalHeight / this.parent.stage.canvas.height);
                        this.onClone(objCloned, cloneX, cloneY);
                    }
                }
            }
            //            this.scaleX = this.lastScale;
            //            this.scaleY = this.lastScale;
        });
    };

    //        this.on("click", function(evt) {
    //            if (this.enabled) {
    //                this.parent.addChild(this);
    //                this.origin = { x: this.x, y: this.y };
    //                var offset = { x: this.x - evt.stageX, y: this.y - evt.stageY };

    //                if (this.canMove) {
    //                    // Drag
    //                    var valido = this.maxX ? evt.stageX < this.maxX : true;
    ////                    if (this.excludeObjects && this.excludeObjects.length > 0) {
    ////                        for (var n = 0; n < this.excludeObjects.length; n++) {
    ////                            if (this.excludeObjects[n].hitTest(evt.stageX, evt.stageY)) {
    ////                                valido = false;
    ////                                break;
    ////                            }
    ////                        }
    ////                    }
    //                    if (valido) {
    //                        this.scaleX = this.dragScale;
    //                        this.scaleY = this.dragScale;
    //                        this.x = evt.stageX + offset.x;
    //                        this.y = evt.stageY + offset.y;
    //                    }
    //                   
    //                    this.Stage.caller = this;
    //                    this.Stage.on("stagemouseup", function(ev) {
    //                        this.onMouseUp = null;
    //                        if (this.caller.
    //) {
    //                            this.caller.scaleX = this.caller.initScale;
    //                            this.caller.scaleY = this.caller.initScale;
    //                            this.caller.onDragDrop(this.caller, ev.stageX, ev.stageY);
    //                        }
    //                        if (this.caller.clonable) {
    //                            var objCloned = this.caller.clone();
    //                            if (this.caller.objDef != undefined) {
    //                                objCloned.objDef = this.caller.objDef;
    //                            }
    //                            this.caller.x = this.caller.origin.x;
    //                            this.caller.y = this.caller.origin.y;
    //                            if (this.caller.onClone) {
    //                                this.caller.onClone(objCloned, ev.stageX, ev.stageY);
    //                            }
    //                        }
    //                    }); // end onMouseUp
    //                }
    //            }
    //        });         
    //    };

    p.desactivate = function () {
        this.cursor = "default";
        this.selected = false;
        for (var i = 0; i < 8; i++) {
            this.removeChild(this.resizeHandles[i]);
        }
        this.resizeHandles = [];
    };

    p.activate = function () {
        this.cursor = "pointer";
        if (resizeableBitmap.selection) {
            for (var i = 0; i < 8; i++) {
                resizeableBitmap.selection.desactivate();
            }
            resizeableBitmap.selection.selected = false;
            resizeableBitmap.selection = null;
        }
        resizeableBitmap.selection = this;
        resizeableBitmap.selection.selected = true;
        this.parent.addChild(this);
        var half = this.handlesSize / 2;

        for (var i = 0; i < 6; i++) {
            var containerHandle = new createjs.Container();
            containerHandle.name = "handle" + i;
            containerHandle.regX = half;
            containerHandle.regY = half;
            containerHandle.direction = i;
            containerHandle.width = this.handlesSize;
            containerHandle.height = this.handlesSize;
            containerHandle.owner = this;

            var shp = new createjs.Shape();
            shp.alpha = 0.5;
            shp.graphics.beginFill(this.handlesColor).drawRect(0, 0, this.handlesSize, this.handlesSize);
            containerHandle.addChild(shp);

            var icon;
            switch (i) {
                case 0:
                    icon = new createjs.Bitmap(this.iconrotate);
                    break;
                case 5:
                    icon = new createjs.Bitmap(this.iconremove);
                    break;
                default:
                    icon = new createjs.Bitmap(this.iconresize);
                    break;
            }

            icon.x = half;
            icon.y = half;
            icon.regX = half;
            icon.regY = half;
            switch (i) {
                case 1:
                case 4:
                    icon.scaleX = +1;
                    icon.scaleY = +1;
                    break;
                case 2:
                case 3:
                    icon.scaleX = -1;
                    icon.scaleY = +1;
                    break;
            }
            containerHandle.addChild(icon);

            this.resizeHandles.push(containerHandle);
            this.addChild(containerHandle);

            containerHandle.visible = true;

            if (!this.canResize && i >= 1 && i <= 4) {
                containerHandle.visible = false;
                continue;
            }

            if (!this.canRotate && i == 0) {
                containerHandle.visible = false;
                continue;
            }

            if (!this.canRemove && i == 5) {
                containerHandle.visible = false;
                continue;
            }

            (function (target) {
                target.on("mousedown", function (evt) {
                    target.mx = evt.stageX;
                    target.my = evt.stageY;
                    target.parent.inHandle = true;
                    if (target.direction == 5) {
                        if (target.parent && target.parent.parent) {
                            if (target.parent.onRemove) {
                                target.parent.onRemove(target.parent);
                            }
                            target.parent.parent.removeChild(target.parent);
                        }
                    }
                });

                target.on("pressmove", function (evt) {
                    var flip = false;
                    valido = true;
                    target.parent.inHandle = true;
                    if (target.parent.excludeObjects && target.parent.excludeObjects.length > 0) {
                        for (n = 0; n < target.parent.excludeObjects.length; n++) {
                            if (target.parent.excludeObjects[n].hitTest(evt.stageX, evt.stageY)) {
                                valido = false;
                                break;
                            }
                        }
                    }
                    if (valido && !flip) {
                        // 1  5  2
                        //        
                        // 3  0  4
                        if (target.direction > 0) {
                            aux = target.owner.globalToLocal(evt.stageX, evt.stageY);
                        }
                        var rect = target.owner.sourceRect.clone();
                        switch (target.direction) {
                            case 0:
                                dx = (evt.stageX * target.parent.parent.originalWidth / target.parent.parent.stage.canvas.width - target.owner.x);
                                dy = (evt.stageY * target.parent.parent.originalWidth / target.parent.parent.stage.canvas.width - target.owner.y);
                                target.owner.rotation = (Math.atan2(dy, dx) * RAD_TO_DEG) - 90;
                                if (target.owner.rotation < 0) target.owner.rotation = 360 + target.owner.rotation;

                                //target.owner.rotation = Math.round(target.owner.rotation / target.owner.rotationIncrement) * target.owner.rotationIncrement;
                                break;
                            case 1:
                                target.x = aux.x - (target.owner.handlesSize / 2);
                                target.y = aux.y - (target.owner.handlesSize / 2);
                                target.owner.sourceRect.width += (target.owner.sourceRect.x - target.x);
                                target.owner.sourceRect.height += (target.owner.sourceRect.y - target.y);
                                break;
                            case 2:
                                target.x = aux.x + (target.owner.handlesSize / 2);
                                target.y = aux.y - (target.owner.handlesSize / 2);
                                target.owner.sourceRect.width = target.x - target.owner.sourceRect.x;
                                target.owner.sourceRect.height += (target.owner.sourceRect.y - target.y);
                                break;
                            case 3:
                                target.x = aux.x - (target.owner.handlesSize / 2);
                                target.y = aux.y + (target.owner.handlesSize / 2);
                                target.owner.sourceRect.width += (target.owner.sourceRect.x - target.x);
                                target.owner.sourceRect.height = target.y - target.owner.sourceRect.y;
                                break;
                            case 4:
                                target.x = aux.x + (target.owner.handlesSize / 2);
                                target.y = aux.y + (target.owner.handlesSize / 2);
                                target.owner.sourceRect.width = target.x - target.owner.sourceRect.x;
                                target.owner.sourceRect.height = target.y - target.owner.sourceRect.y;
                                break;
                        }
                        target.owner.setPositionHandles();
                        if (target.owner.sourceRect.width < (target.owner.handlesSize * 2)) {
                            target.owner.sourceRect.width = target.owner.handlesSize * 2;
                            target.owner.sourceRect.x = rect.x;
                            target.owner.flipped = !target.owner.flipped;
                            flip = true;
                        } else {

                            target.mx = evt.stageX;
                        }
                        if (target.owner.sourceRect.height < (target.owner.handlesSize * 1)) {
                            target.owner.sourceRect.height = target.owner.handlesSize * 1;
                            target.owner.sourceRect.y = rect.y;
                        } else {
                            target.my = evt.stageY;
                        }
                        target.owner.regX = (target.owner.sourceRect.width - target.owner.sourceRect.x) / 2;
                        target.owner.regY = (target.owner.sourceRect.height - target.owner.sourceRect.y) / 2;
                        target.owner.setPositionHandles();
                    }
                });
            })(containerHandle);
        } // end-for
        this.setPositionHandles();
        if (this.onActivate != undefined && this.onActivate != null) {
            this.onActivate();
        }
    };

    p.reset = function () {
        this.sourceRect = this.orgRect.clone();
        this.rotation = 0;
        this.flipped = false;
    };
    p.setPositionHandles = function () {
        // 1  5  2
        //        
        // 3  0  4
        for (var i = 0; i < 6; i++) {
            containerHandle = this.resizeHandles[i];
            switch (containerHandle.direction) {
                case 0:
                    containerHandle.x = this.sourceRect.x + this.sourceRect.width / 2;
                    containerHandle.y = this.sourceRect.y + this.sourceRect.height;
                    break;
                case 1:
                    containerHandle.x = this.sourceRect.x;
                    containerHandle.y = this.sourceRect.y;
                    break;
                case 2:
                    containerHandle.x = this.sourceRect.x + this.sourceRect.width;
                    containerHandle.y = this.sourceRect.y;
                    break;
                case 3:
                    containerHandle.x = this.sourceRect.x;
                    containerHandle.y = this.sourceRect.y + this.sourceRect.height;
                    break;
                case 4:
                    containerHandle.x = this.sourceRect.x + this.sourceRect.width;
                    containerHandle.y = this.sourceRect.y + this.sourceRect.height;
                    break;
                case 5:
                    containerHandle.x = this.sourceRect.x + this.sourceRect.width / 2;
                    containerHandle.y = this.sourceRect.y;
                    break;
            }
        }
    };
    p.isVisible = function () {
        return this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && this.image && (this.image.complete || this.image.getContext || this.image.readyState >= 2);
    };
    p.DisplayObject_draw = p.draw;

    p.draw = function (ctx, ignoreCache) {
        var rect = this.sourceRect;
        if (!rect) {
            rect = new createjs.Rectangle(0, 0, this.image.width, this.image.height);
        }

        ctx.save();
        scaleX = rect.width / this.orgRect.width;
        scaleY = rect.height / this.orgRect.height;
        if (this.flipped) {
            scaleX *= -1;
        }

        this.moveHandle.x = rect.width / 2;
        this.moveHandle.scaleX = scaleX;
        this.moveHandle.scaleY = scaleY;
        this.moveHandle.updateContext(ctx);
        this.moveHandle.draw(ctx);
        ctx.restore();

        if (this.selected) {
            for (var i = 0; i < 6; i++) {
                if (this.resizeHandles[i].visible) {
                    ctx.save();
                    this.resizeHandles[i].updateContext(ctx);
                    this.resizeHandles[i].draw(ctx);
                    ctx.restore();
                }
            }
        }

        return true;
    };
    p.clone = function () {
        var o = new resizeableBitmap(this.imageOrUri, this.handlesSize, this.handlesColor);
        o.hotAreas = this.hotAreas;
        o.origin = this.origin;
        o.initScale = this.initScale;
        o.dropScale = this.dropScale;
        //        o.canMove = this.canMove;
        //        o.canRemove = this.canRemove;
        //        o.canResize = this.canResize;
        o.regX = this.regX;
        o.regY = this.regY;
        o.x = this.x;
        o.y = this.y;
        //this.cloneProps(o);
        o.parent = this.parent;
        return o;
    };
    p.toString = function () {
        return "[ResizeableBitmap (name=" + this.name + ")]";
    };
    sm.ResizeableBitmap = resizeableBitmap;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.HotArea ----------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var HotArea = function (name, points, sizepos, imagepos, circle) {
        this.initialize(name, points, sizepos, imagepos, circle);
    };
    var p = HotArea.prototype = new createjs.Container();

    p.points = [];
    p.sizepos = null;
    p.imagepos = null;
    p.mouseIn = false;
    p.enabled = true;
    p.multidrop = false;
    p.name = null;

    p.Container_initialize = p.initialize;

    p.initialize = function (name, points, sizepos, imagepos, circle) {
        this.name = name;
        this.points = points;
        this.sizepos = sizepos;
        this.imagepos = imagepos;
        this.circle = circle;
        this.enabled = true;
        this.solutionText = "";
        this.esAreaValida = true;

        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        if (this.imagepos) {
            var image = ImageManager.getImage(this.imagepos.image);
            if (image != null) {
                this.dummy = new createjs.Bitmap(image);
                this.dummy.x = this.imagepos.x;
                this.dummy.y = this.imagepos.y;
            }
        } else {
            this.dummy = new createjs.Shape();
            this.dummy.graphics.beginFill("#000000");
            this.dummy.alpha = 0.5;
            if (this.points) {
                this.dummy.graphics.moveTo(this.points[0].x, this.points[0].y);
                for (var i = 1; i < this.points.length; i++) {
                    var point = this.points[i];
                    this.dummy.graphics.lineTo(point.x, point.y);
                }
                this.dummy.graphics.closePath();
            } else if (this.sizepos) {
                this.dummy.graphics.rect(this.sizepos.x, this.sizepos.y, this.sizepos.width, this.sizepos.height);
            } else if (this.circle) {
                this.dummy.graphics.drawCircle(this.circle.x, this.circle.y, this.circle.radius);
            }
        }

        this.on("click", function (event) {
            if (this.enabled && this.onClickArea) {
                this.onClickArea(this, event.stageX, event.stageY);
            }
        });

        this.addChild(this.dummy);
    };

    p.isVisible = function () {
        return this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0;
    };

    p.pointInHotArea = function (x, y) {
        var cn = 0;
        for (var i = 0; i < this.points.length; i++) {
            if (((this.points[i].y <= y) && (this.points[(i + 1) % this.points.length].y > y)) ||
                ((this.points[i].y > y) && (this.points[(i + 1) % this.points.length].y <= y))) {
                var vt = (y - this.points[i].y) / (this.points[(i + 1) % this.points.length].y - this.points[i].y);
                if (x < this.points[i].x + vt * (this.points[(i + 1) % this.points.length].x - this.points[i].x))
                    ++cn;
            }
        }
        return (cn % 2 == 1);
    };

    p.DisplayObject_draw = p.draw;

    p.draw = function (ctx, ignoreCache) {
        if (this.hotAreaVisible || this.imagepos) {
            ctx.save();
            this.dummy.updateContext(ctx);
            this.dummy.draw(ctx);
            ctx.restore();
        }
        if (this.dummyText != undefined && this.dummyText.visible) {
            ctx.save();
            this.dummyText.updateContext(ctx);
            this.dummyText.draw(ctx, ignoreCache);
            ctx.restore();
        }
    };

    p.setText = function (textDef) {
        var font = textDef.font != undefined ? textDef.font : textDef.fontSize + "px " + textDef.fontFamily;
        this.dummyText = new createjs.Text(textDef.text, font, textDef.fontColor);
        //var aux = this.localToGlobal(textDef.x, textDef.y);
        //this.dummyText.x = aux.x;
        //this.dummyText.y = aux.y;
        this.dummyText.x = textDef.x;
        this.dummyText.y = textDef.y;
        this.dummyText.visible = textDef.visible;
        this.solutionText = textDef.text;
        this.addChild(this.dummyText);

    };

    p.editText = function (text) {
        this.removeChild(this.dummyText);
        this.dummyText.text = text;
        this.dummyText.visible = true;
        this.addChild(this.dummyText);
    };

    p.clone = function () {
        var o = new HotArea(this.name, this.points);
        this.cloneProps(o);
        return o;
    };

    p.toString = function () {
        return "[HotArea (name=" + this.name + ")]";
    };

    sm.HotArea = HotArea;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.HotTextArea ------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var HotTextArea = function (sizepos, text) {
        this.initialize(sizepos, text);
    };
    var p = HotTextArea.prototype = new createjs.Container();

    p.sizepos = null;
    p.enabled = true;
    p.origin = {
        x: 0,
        y: 0
    };

    p.initScale = 1.0;
    p.dropScale = 1.0;
    p.dragScale = 1.0;
    p.lastScale = 1.0;

    p.onDragDrop = null;
    p.onClone = null;

    p.Container_initialize = p.initialize;

    p.initialize = function (sizepos, text) {
        this.sizepos = sizepos;
        this.text = text;
        this.enabled = true;

        this.Container_initialize();

        //this.sourceRect = new createjs.Rectangle(0, 0, this.sizepos.width, this.sizepos.height);
        //this.orgRect = new createjs.Rectangle(0, 0, this.sizepos.width, this.sizepos.height);
        this.x = this.sizepos.x;
        this.y = this.sizepos.y;
        this.regX = 0;
        this.regY = 0;

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.dummy = new createjs.Shape();
        this.dummy.graphics.beginFill("#FF0000");
        this.dummy.alpha = 0.5;
        this.dummy.graphics.rect(0, 0, this.sizepos.width, this.sizepos.height);
        this.addChild(this.dummy);
        this.setText(text);

        this.on("mousedown", function (evt) {
            this.origin = { x: this.x, y: this.y };
        });

        this.on("pressmove", function (evt) {
            if (this.enabled) {
                this.parent.addChild(this);
                if (this.onActivate != undefined && this.onActivate != null) {
                    this.onActivate();
                }

                var aux = this.parent.globalToLocal(evt.stageX, evt.stageY);
                this.x = aux.x - this.sizepos.width / 2;
                this.y = aux.y - this.sizepos.height / 2;
            }
        });

        this.on("pressup", function (evt) {
            if (this.onDragDrop && this.enabled) {
                this.onDragDrop(this, this.x + this.sizepos.width / 2, this.y + this.sizepos.height / 2);
            }

            if (this.clonable && this.enabled) {
                var objCloned = this.clone();
                objCloned.parent = this.parent;
                if (this.textDef != undefined) {
                    objCloned.textDef = this.textDef;
                }
                this.x = this.origin.x;
                this.y = this.origin.y;
                if (this.onClone) {
                    var cloneX = evt.stageX * (this.parent.originalWidth / this.parent.stage.canvas.width);
                    var cloneY = evt.stageY * (this.parent.originalHeight / this.parent.stage.canvas.height);
                    this.onClone(objCloned, cloneX, cloneY);
                }
            }
        });

        this.addChild(this.dummy);
    };

    p.DisplayObject_draw = p.draw;

    p.draw = function (ctx, ignoreCache) {
        if (this.hotAreaVisible || this.imagepos) {
            ctx.save();
            this.dummy.updateContext(ctx);
            this.dummy.draw(ctx);
            ctx.restore();
        }
        if (this.dummyText != undefined && this.dummyText.visible) {
            ctx.save();
            this.dummyText.updateContext(ctx);
            this.dummyText.draw(ctx, ignoreCache);
            ctx.restore();
        }
    };

    p.setText = function (textDef) {
        var font = textDef.font != undefined ? textDef.font : textDef.fontSize + "px " + textDef.fontFamily;
        this.dummyText = new createjs.Text(textDef.text, font, textDef.fontColor);
        //var aux = this.localToGlobal(textDef.x, textDef.y);
        this.dummyText.x = 0;
        this.dummyText.y = 0;
        //this.dummyText.x = textDef.x;
        //this.dummyText.y = textDef.y;
        this.addChild(this.dummyText);

    };

    p.clone = function () {
        var o = new HotTextArea(this.sizepos, this.text);
        o.hotAreas = this.hotAreas;
        o.origin = this.origin;
        o.initScale = this.initScale;
        o.dropScale = this.dropScale;
        o.regX = this.regX;
        o.regY = this.regY;
        o.x = this.x;
        o.y = this.y;
        return o;
    };

    p.toString = function () {
        return "[HotTextArea (namex=" + this.name + ")]";
    };

    sm.HotTextArea = HotTextArea;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.Keyboard ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    //x: posicion x
    //y: posicion y
    //ncolum: numero de columnas del teclado
    //sizekey: tamaño de la tecla
    //abc: boolean, teclado con letras.
    //numbers: boolean, teclado con numeros
    //operators: boolean, teclado con operadores
    var keyboard = function (x, y, ncolum, sizekey, abc, numbers, operators, deleteKey, okKey, koKey, callbackClick, alphaKeys, numericKeys, symbolKeys, keyFontSize, fontAlpha, fontNumeric, fontSymbol, fontSpecial) {
        this.states = {};

        this.initialize(x, y, ncolum, sizekey, abc, numbers, operators, deleteKey, okKey, koKey, callbackClick, alphaKeys, numericKeys, symbolKeys, keyFontSize, fontAlpha, fontNumeric, fontSymbol, fontSpecial);
    };

    var p = keyboard.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;
    p.owner = null;

    p.initialize = function (x, y, ncolum, sizekey, abc, numbers, operators, deleteKey, okKey, koKey, callbackClick, alphaKeys, numericKeys, symbolKeys, keyFontSize, fontAlpha, fontNumeric, fontSymbol, fontSpecial) {
        this.Container_initialize();

        this.x = x;
        this.y = y;
        this.ncolum = ncolum;
        this.sizekey = sizekey;
        this.abc = abc;
        this.numbers = numbers;
        this.operators = operators;
        this.deleteKey = deleteKey;
        this.okKey = okKey;
        this.koKey = koKey;
        this.callbackClick = callbackClick;
        this.enabled = false;
        this.alphaKeys = [];
        this.numericKeys = [];
        this.symbolKeys = [];
        this.enabled = true;
        this.keyFontSize = keyFontSize;
        this.fontAlpha = fontAlpha;
        this.fontNumeric = fontNumeric;
        this.fontSymbol = fontSymbol;
        this.fontSpecial = fontSpecial;

        if (alphaKeys != undefined && alphaKeys != null) {
            this.alphaKeys = alphaKeys;
        }
        if (numericKeys != undefined && numericKeys != null) {
            this.numericKeys = numericKeys;
        }
        if (symbolKeys != undefined && symbolKeys != null) {
            this.symbolKeys = symbolKeys;
        }

        var teclas = [];
        var tipos = [];

        if (this.abc) {
            if (this.alphaKeys.length > 0) {
                for (var iAlphaKey = 0 in this.alphaKeys) {
                    teclas.push(this.alphaKeys[iAlphaKey]);
                    tipos.push(0);
                }
            }
            else {
                teclas.push("A", "B", "C", "D", "E", "F", "G", "H", "I",
                            "J", "K", "L", "M", "N", "Ñ", "O", "P", "Q",
                            "R", "S", "T", "U", "V", "W", "X", "Y", "Z");
                tipos.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            }
        }

        if (this.numbers) {
            if (this.numericKeys.length > 0) {
                for (var iNumericKey = 0 in this.numericKeys) {
                    teclas.push(this.numericKeys[iNumericKey]);
                    tipos.push(1);
                }
            }
            else {
                teclas.push("1", "2", "3", "4", "5", "6", "7", "8", "9", "0");
                tipos.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
            }
        }

        if (this.operators) {
            if (this.symbolKeys.length > 0) {
                for (var iSymbolKey = 0 in this.symbolKeys) {
                    teclas.push(this.symbolKeys[iSymbolKey]);
                    tipos.push(2);
                }
            }
            else {
                teclas.push("+", "‒", ":", "x", "=");
                tipos.push(2, 2, 2, 2, 2);
            }
        }

        if (this.deleteKey) {
            teclas.push("delete");
            tipos.push(3);
        }

        if (this.okKey) {
            teclas.push("ok");
            tipos.push(3);
        }

        if (this.koKey) {
            teclas.push("ko");
            tipos.push(3);
        }

        this.width = (this.sizekey + 5) * this.ncolum;

        var vncolum = 0;
        var posY = 0;
        var posX = 0;
        var key = null;
        for (var i = 0; i < teclas.length; i++) {
            //Posiciono la tecla en el teclado
            if (this.ncolum == vncolum) {
                posY = posY + (this.sizekey + 5);
                posX = 0;
                vncolum = 0;
            }
            else {
                posX = (vncolum * (this.sizekey + 5));
            }
            vncolum = vncolum + 1;

            //Creo la tecla
            var tipo = tipos[i];
            var style = tipo == 0 ? styles.keyboard.buttonAlpha : tipo == 1 ? styles.keyboard.buttonNumeric : tipo == 2 ? styles.keyboard.buttonSymbol : styles.keyboard.buttonSpecial;
            var font = tipo == 0 ? this.fontAlpha : tipo == 1 ? this.fontNumeric : tipo == 2 ? this.fontSymbol : this.fontSpecial;
            key = new sm.KeyboardKey(posX, posY, this.OnClickKey, style, this.sizekey, font);
            key.code = teclas[i];
            var keyChar = teclas[i];
            if (tipo == 3) {
                if (keyChar == "delete") keyChar = "f";
                if (keyChar == "ok") keyChar = "v";
                if (keyChar == "ko") keyChar = "w";
            }

            key.setText(keyChar, this.keyFontSize);

            this.addChild(key);
        }

    };

    p.OnClickKey = function () {
        this.parent.callbackClick(this);
    };
    sm.Keyboard = keyboard;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.KeyboardKey ------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var keyboardKey = function (x, y, callbackClick, buttonStyle, sizekey, font) {
        this.states = {};

        this.initialize(x, y, callbackClick, buttonStyle, sizekey, font);
    };


    var p = keyboardKey.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, callbackClick, buttonStyle, sizekey, font) {
        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.states = { up: null, over: null, disabled: null };
        this.lastState = "up";
        this.sizekey = sizekey;
        this.font = font;

        this.width = this.sizekey;
        this.height = this.sizekey;
        this.x = x;
        this.y = y;
        this.callbackClick = callbackClick;
        this.buttonStyle = buttonStyle;

        this.text = null;
        this.enabled = true;

        //Color Boton
        if (this.buttonStyle.backgroundColor != null && this.buttonStyle.backgroundColor != "") {
            var upShape = this.createShape(buttonStyle.backgroundColor, buttonStyle.borderColor, buttonStyle.shadowSize, buttonStyle.shadowColor);
            this.states.up = upShape;
            this.addChild(upShape);
        }

        //color Hover
        if (this.buttonStyle.backgroundColorHover != null && this.buttonStyle.backgroundColorHover != "") {
            var hoverShape = this.createShape(buttonStyle.backgroundColorHover, buttonStyle.borderColor, buttonStyle.shadowSize, buttonStyle.shadowColor);
            hoverShape.visible = false;
            this.states.hover = hoverShape;
            this.addChild(hoverShape);
        }

        //color Disabled
        if (this.buttonStyle.backgroundColorDisabled != null && this.buttonStyle.backgroundColorDisabled != "") {
            var disabledShape = this.createShape(buttonStyle.backgroundColorDisabled, buttonStyle.borderColor, buttonStyle.shadowSize, buttonStyle.shadowColor);
            disabledShape.visible = false;
            this.states.disabled = disabledShape;
            this.addChild(disabledShape);
        }

        this.on("mouseover", function (event) {
            if (this.parent.enabled && this.enabled) {
                this.swapStates(this.lastState, "hover");
                showHandCursor(true);
            }
        });

        this.on("click", function (event) {
            if (this.parent.enabled && this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(true);
                if (this.callbackClick)
                    this.callbackClick();
            }
        });

        this.on("mouseout", function (event) {
            if (this.parent.enabled && this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(false);
            }
        });
    };

    p.createShape = function (backgroundColor, borderColor, shadowSize, shadowColor) {
        var shp = new createjs.Shape();
        shp.width = this.width;
        shp.height = this.height;
        var borderSize = this.buttonStyle.borderSize ? this.buttonStyle.borderSize : 1;
        shp.graphics.beginFill(backgroundColor).setStrokeStyle(borderSize).beginStroke(borderColor)
               .drawRoundRect(0, 0, this.sizekey, this.sizekey, styles.keyboard.buttonRoundBorder);
        shp.graphics.shadow = new createjs.Shadow(shadowColor, shadowSize, shadowSize, shadowSize);
        return shp;
    };


    p.swapStates = function (last, current) {
        if (this.enabled && (last != current) && this.states[last] && this.states[current]) {
            this.states[current].visible = true;
            this.states[last].visible = false;

            this.lastState = current;

            return true;
        }
        else if (!this.enabled && this.states["disabled"]) {
            this.states["disabled"].visible = true;
            this.lastState = "disabled";
            return true;
        }

        return false;
    };

    p.setEnabled = function (value) {
        this.enabled = value;

        if (this.enabled) {
            this.swapStates(this.lastState, "up");
        } else {
            this.swapStates(this.lastState, "disabled");
            showHandCursor(false);
        }

        if (this.text != null && this.text != undefined) {
            if (this.enabled) {
                this.text.color = this.buttonStyle.fontColor;
            } else {
                this.text.color = this.buttonStyle.fontColorDisabled;
            }
        }
    };

    p.setText = function (txt, keyFontSize) {
        this.removeChild(this.text);
        if (keyFontSize == undefined) {
            keyFontSize = this.buttonStyle.fontSize;
        }
        var textFont = this.font != undefined && this.font != null ? "bold " + this.font : "bold " + keyFontSize + "px " + this.buttonStyle.fontFamily;
        this.text = new createjs.Text(txt, textFont, this.buttonStyle.fontColor);
        //        this.text.x = (this.width - this.text.getMeasuredWidth()) / 2;
        //        this.text.y = (this.height - this.text.getMeasuredHeight() - this.text.getMeasuredHeight() / 3) / 2;
        this.text.x = this.width / 2;
        this.text.y = this.height / 2;
        this.text.textAlign = "center";
        this.text.textBaseline = "middle";

        this.addChild(this.text);

        if (!this.enabled) {
            this.text.color = this.buttonStyle.fontColorDisabled;
        }
    };

    sm.KeyboardKey = keyboardKey;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.ImageSquareButton ------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var imageSquareButton = function (x, y, width, height, imageType, callbackClick, fontSize, backGroundColor) {
        this.states = {};

        this.initialize(x, y, width, height, imageType, callbackClick, fontSize, backGroundColor);
    };

    var p = imageSquareButton.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (x, y, width, height, imageType, callbackClick, fontSize, backGroundColor) {
        this.Container_initialize();

        this.states = { up: null, over: null, disabled: null };
        this.lastState = "up";

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.imageType = imageType;
        this.callbackClick = callbackClick;
        this.symbol = null;
        this.enabled = true;
        if (fontSize != undefined) {
            this.fontSize = fontSize;
        }

        var upShape;

        //Color Boton
        if (backGroundColor != null && backGroundColor != "undefined") {
            upShape = this.createShape(backGroundColor);
            this.states.up = upShape;
            this.addChild(upShape);
        } else {
            if (styles.imageRoundButton.backgroundColor != null && styles.imageRoundButton.backgroundColor != "") {
                upShape = this.createShape(styles.imageRoundButton.backgroundColor);
                this.states.up = upShape;
                this.addChild(upShape);
            }
        }

        //color Hover
        if (styles.imageRoundButton.backgroundColorHover != null && styles.imageRoundButton.backgroundColorHover != "") {
            var hoverShape = this.createShape(styles.imageRoundButton.backgroundColorHover);
            hoverShape.visible = false;
            this.states.hover = hoverShape;
            this.addChild(hoverShape);
        }

        //color Disabled
        if (styles.imageRoundButton.backgroundColorDisabled != null && styles.imageRoundButton.backgroundColorDisabled != "") {
            var disabledShape = this.createShape(styles.imageRoundButton.backgroundColorDisabled);
            disabledShape.visible = false;
            this.states.disabled = disabledShape;
            this.addChild(disabledShape);
        }

        //Simbolo
        if (imageType != null && imageType != "") {
            var symbol = this.createSymbol();
            this.addChild(symbol);
        }

        this.on("mouseover", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "hover");
                showHandCursor(true);
            }
        });

        this.on("click", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(true);
                if (this.callbackClick)
                    this.callbackClick(this);
            }
        });

        this.on("mouseout", function (event) {
            if (this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(false);
            }
        });
    };

    p.createShape = function (backgroundColor) {
        var shp = new createjs.Shape();
        shp.graphics
	        .setStrokeStyle(styles.imageRoundButton.borderSize)
            .beginStroke(styles.imageRoundButton.borderColor)
	        .beginFill(backgroundColor)
            .drawRoundRect(0, 0, this.width, this.height, styles.keyboard.buttonRoundBorder)
            .endStroke();

        return shp;
    };


    p.swapStates = function (last, current) {
        if (this.enabled && (last != current) && this.states[last] && this.states[current]) {
            this.states[current].visible = true;
            this.states[last].visible = false;

            this.lastState = current;

            return true;
        }
        else if (!this.enabled && this.states["disabled"]) {
            this.states["disabled"].visible = true;
            this.lastState = "disabled";
            return true;
        }

        return false;
    };

    p.setEnabled = function (value) {
        this.enabled = value;

        if (this.enabled) {
            this.swapStates(this.lastState, "up");
        } else {
            this.swapStates(this.lastState, "disabled");
            showHandCursor(false);
        }

        if (this.text != null && this.text != undefined) {
            if (this.enabled) {
                this.text.color = styles.imageRoundButton.fontColor;
            } else {
                this.text.color = styles.imageRoundButton.fontColorDisabled;
            }
        }
    };

    p.createSymbol = function () {
        this.removeChild(this.symbol);
        var txt = "";

        switch (this.imageType) {
            case 'contents':
                txt = "a";
                break;
            case 'prev':
                txt = "b";
                break;
            case 'next':
                txt = "c";
                break;
            case 'down':
                txt = "d";
                break;
            case 'up':
                txt = "e";
                break;
            case 'left':
                txt = "f";
                break;
            case 'right':
                txt = "g";
                break;
            case 'audio':
                txt = "h";
                break;
            case 'cc':
                txt = "i";
                break;
            case 'ok':
                txt = "j";
                break;
            case 'cancel':
                txt = "k";
                break;
            case 'document':
                txt = "l";
                break;
            case 'link':
                txt = "m";
                break;
            case 'maximize':
                txt = "n";
                break;
            case 'help':
                txt = "o";
                break;
            case 'pause':
                txt = "p";
                break;
            case 'image':
                txt = "q";
                break;
            case 'add':
                txt = "s";
                break;
            case 'sm':
                txt = "t";
                break;
            case 'reset':
                txt = "u";
                break;
            case 'tickok':
                txt = "v";
                break;
        }

        this.symbol = new createjs.Text(txt, this.fontSize + "px " + styles.imageRoundButton.fontFamily, styles.imageRoundButton.fontColor);
        this.symbol.x = this.width / 2;
        this.symbol.y = this.height / 2;
        this.symbol.textAlign = "center";
        this.symbol.textBaseline = "middle";

        this.addChild(this.symbol);

        if (!this.enabled) {
            this.symbol.color = styles.imageRoundButton.fontColorDisabled;
        }
    };

    sm.ImageSquareButton = imageSquareButton;

}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.MediaControlBar --------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var mediaControlBar = function (name, width, style, callbackMediaUpdate, callbackMediaEnd, callbackTogglePlay, showTrackButton, callbackTrackButtonMove) {
        this.initialize(name, width, style, callbackMediaUpdate, callbackMediaEnd, callbackTogglePlay, showTrackButton, callbackTrackButtonMove);
    };
    var p = mediaControlBar.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (name, width, style, callbackMediaUpdate, callbackMediaEnd, callbackTogglePlay, showTrackButton, callbackTrackButtonMove) {
        this.Container_initialize();

        this.name = name;
        this.enabled = true;
        this.style = style;
        this.width = width;
        this.mediaFile = null;
        this.callbackMediaUpdate = callbackMediaUpdate;
        this.callbackMediaEnd = callbackMediaEnd;
        this.callbackTogglePlay = callbackTogglePlay;
        this.callbackTrackButtonMove = callbackTrackButtonMove;
        this.showTrackButton = showTrackButton != undefined ? showTrackButton : false;
        this.mediaType = -1;
        this.progress = 0;
        this.height = style != undefined ? style.height : 30;
        this.round = style != undefined ? style.roundCorners : 5;
        this.color1 = style != undefined ? style.color1 : "#999999";
        this.color2 = style != undefined ? style.color2 : "#000000";
        this.color3 = style != undefined ? style.color3 : "#FFFFFF";
        this.enabled = true;

        this.bkg = new createjs.Shape();
        if (!style.educamos) {
            this.bkg.graphics
                .beginFill(this.color1)
                .drawRoundRect(0, 0, this.width, this.height, this.round)
                .setStrokeStyle(2)
                .beginStroke(this.color2)
                .beginFill(this.color2)
                .moveTo(50, 0)
                .lineTo(50, this.height);
        }

        this.addChild(this.bkg);

        this.createTogglePlay();

        this.createProgressBar();
    };

    p.play = function () {
        this.togglePlay.playing = true;
        this.togglePlay.owner.drawTooglePlay();
        this.togglePlay.owner.doStatusChange("play");
        if (this.callbackTogglePlay != undefined && this.callbackTogglePlay != null) {
            this.callbackTogglePlay("play");
        }

        if (this.mediaType == 0) {
            if (this.media.isPaused()) {
                this.media.togglePlay();
            } else {
                this.media.play();
            }
        }
    };

    p.setEnabled = function (value) {
        this.enabled = value;
        this.togglePlay.setEnabled(value);
    };

    p.pause = function () {
        if (this.enabled) {
            this.togglePlay.playing = false;
            this.togglePlay.owner.drawTooglePlay();
            this.togglePlay.owner.doStatusChange("pause");
            if (this.callbackTogglePlay != undefined && this.callbackTogglePlay != null) {
                this.callbackTogglePlay("pause");
            }

            if (this.mediaType == 0) {
                this.media.togglePlay();
            }
        }
    };

    p.stop = function () {
        if (this.enabled) {
            this.togglePlay.playing = false;
            this.togglePlay.owner.drawTooglePlay();
            this.togglePlay.owner.doStatusChange("stop");

            if (this.mediaType == 0) {
                this.media.stop();
            }
        }
    };

    p.setMedia = function (mediaFile, mediaType) {
        this.mediaFile = mediaFile;
        this.mediaType = mediaType;

        if (this.mediaType == 0) {
            this.media = this.createSound(this.mediaFile);
            this.media.bind('timeupdate', this.soundTimeUpdate);
            this.media.bind('ended', this.soundEnd);
            this.media.owner = this;
        }
    };

    p.soundTimeUpdate = function () {
        this.owner.progress = this.sound.currentTime * 100 / this.sound.duration;
        this.owner.drawProgressTrackBar();
        if (this.owner.callbackMediaUpdate != undefined && this.owner.callbackMediaUpdate != null) {
            this.owner.callbackMediaUpdate(this.sound);
        }
    };

    p.soundEnd = function () {
        if (this.owner.callbackMediaEnd != undefined && this.owner.callbackMediaEnd != null) {
            this.owner.callbackMediaEnd(this.sound);
        }
    };

    p.createSound = function (source) {
        var sound = new buzz.sound(source, {
            formats: ["ogg", "mp3"],
            preload: true,
            autoload: true,
            loop: false
        });
        return sound;
    };

    p.createTogglePlay = function () {
        var button = new createjs.Container();

        if (!this.style.educamos) {
            button.background = new createjs.Shape();
            button.size = this.height / 2.8;
            button.pauseBarWidth = button.size / 4;
            button.x = 25;
            button.y = this.height / 2;
            button.playing = false;
            button.enabled = true;
            button.addChild(button.background);
            button.owner = this;
            this.togglePlay = button;
            this.drawTooglePlay();
            this.addChild(this.togglePlay);
        }
        else {
            var image = document.createElement("img");
            image.src = styles.icons.Comenzar.src.replace(/_/g, "/");
            image.height = styles.icons.Comenzar.height;
            image.width = styles.icons.Comenzar.width;
            button.iconButton = new createjs.Bitmap(image);
            button.iconButton.x = 0;
            button.iconButton.y = this.height / 2 - styles.icons.Comenzar.height / 2;
            button.iconButton.width = styles.icons.Comenzar.width;
            button.iconButton.height = styles.icons.Comenzar.height;
            var buttonNextHitArea = new createjs.Shape();
            buttonNextHitArea.graphics.beginFill("#FFFFFF").drawEllipse(0, 0, button.iconButton.width, button.iconButton.height);
            button.iconButton.hitArea = buttonNextHitArea;
            button.addChild(button.iconButton);
            button.enabled = true;
            button.owner = this;
            this.togglePlay = button;
            (function (target) {
                target.setEnabled = function (value) {
                    target.enabled = value;
                    target.iconButton.alpha = target.enabled ? 1.0 : 0.5;
                };
            })(button);
            // this.drawTooglePlay();
            this.addChild(this.togglePlay);
        }


        createjs.EventDispatcher.initialize(button);

        button.on("click", function (event) {
            if (button.enabled && button.owner.enabled) {
                if (button.playing) {
                    button.owner.pause();
                } else {
                    button.owner.play();
                }
            }
        });

        button.on("mouseover", function (event) {
            if (button.enabled && button.owner.enabled) {
                showHandCursor(true);
            } else {
                showHandCursor(false);
            }
        });

        button.on("mouseout", function (event) {
            showHandCursor(false);
        });
    };

    p.doStatusChange = function (state) {
        if (this.callbackStatusChange != undefined && this.callbackStatusChange != null) {
            this.callbackStatusChange(state);
        }
    };

    p.drawTooglePlay = function () {
        if (!this.togglePlay.playing) {
            if (!this.style.educamos) {
                this.togglePlay.background.graphics
                    .clear()
                    .setStrokeStyle(2)
                    .beginStroke(this.color2)
                    .beginFill(this.color3)
                    .drawCircle(0, 0, this.height / 2.8)
                    .endStroke();
                this.togglePlay.background.graphics
                    .beginFill(this.color2)
                    .moveTo(-this.togglePlay.size / 4, -this.togglePlay.size / 2)
                    .lineTo(this.togglePlay.size / 2, 0)
                    .lineTo(-this.togglePlay.size / 4, this.togglePlay.size / 2)
                    .lineTo(-this.togglePlay.size / 4, -this.togglePlay.size / 2);
            }
            else {
                image = document.createElement("img");
                image.src = styles.icons.Comenzar.src.replace(/_/g, "/");
                this.togglePlay.iconButton.image = image;
            }
        } else {
            if (!this.style.educamos) {
                this.togglePlay.background.graphics
                    .clear()
                    .setStrokeStyle(2)
                    .beginStroke(this.color2)
                    .beginFill(this.color3)
                    .drawCircle(0, 0, this.height / 2.8)
                    .endStroke();
                this.togglePlay.background.graphics
                    .beginFill(this.color2)
                    .rect(-this.togglePlay.size / 2.5, -this.togglePlay.size / 2, this.togglePlay.pauseBarWidth, this.togglePlay.size)
                    .rect(this.togglePlay.size / 2.5 - this.togglePlay.pauseBarWidth, -this.togglePlay.size / 2, this.togglePlay.pauseBarWidth, this.togglePlay.size);
            }
            else {
                image = document.createElement("img");
                image.src = styles.icons.Pausar.src.replace(/_/g, "/");
                this.togglePlay.iconButton.image = image;
            }
        }
    };

    p.createProgressBar = function () {
        var progressBar = new createjs.Container();

        progressBar.trackBar = new createjs.Shape();
        progressBar.trackBar.width = this.width - 65 - 20;
        progressBar.trackBar.height = styles.mediaControlBar.trackBarHeight ? styles.mediaControlBar.trackBarHeight : this.height / 10;
        progressBar.trackBar.x = styles.mediaControlBar.trackBarOffset ? styles.mediaControlBar.trackBarOffset : 65;
        progressBar.trackBar.y = this.height / 2 - progressBar.trackBar.height / 2;
        progressBar.addChild(progressBar.trackBar);

        if (this.showTrackButton) {
            progressBar.trackButton = new createjs.Shape();
            progressBar.trackButton.radius = 12;
            progressBar.trackButton.x = 80;
            progressBar.trackButton.y = this.height / 2;
            progressBar.addChild(progressBar.trackButton);

            createjs.EventDispatcher.initialize(this);

            if (progressBar.on == undefined) {
                createjs.EventDispatcher.initialize(progressBar);
            }

            (function (target) {
                progressBar.on("pressmove", function (evt) {
                    target.progress = (evt.stageX / globalScaleX - 80) * 100 / target.progressBar.trackBar.width;
                    if (target.progress < 0) target.progress = 0;
                    if (target.progress > 100) target.progress = 100;
                    if (target.mediaType == 0 && target.media != null) {
                        target.media.sound.currentTime = target.progress * target.media.sound.duration / 100;
                    }
                    target.drawProgressTrackBar();
                    if (target.callbackTrackButtonMove != undefined) {
                        target.callbackTrackButtonMove();
                    }
                });
            })(this);
            progressBar.on("mouseover", function (event) {
                showHandCursor(true);
            });

            progressBar.on("mouseout", function (event) {
                showHandCursor(false);
            });
        }

        this.progressBar = progressBar;
        this.drawProgressTrackBar();
        this.addChild(this.progressBar);
    };

    p.drawProgressTrackBar = function () {

        if (!this.style.educamos) {
            this.progressBar.trackBar.graphics
                .clear()
                .beginFill(this.color3)
                .rect(0, 0, this.progressBar.trackBar.width, this.progressBar.trackBar.height);
            if (this.progress > 0) {
                this.progressBar.trackBar.graphics
                    .beginFill("#999999")
                    .rect(0, 0, this.progressBar.trackBar.width * this.progress / 100, this.progressBar.trackBar.height);
            }
            if (this.showTrackButton) {
                this.progressBar.trackButton.x = this.progressBar.trackBar.x + this.progressBar.trackBar.width * this.progress / 100;
                this.progressBar.trackButton.graphics
                    .clear()
                    .beginFill(this.color2)
                    .drawCircle(0, 0, this.progressBar.trackButton.radius)
                    .beginStroke("#FFFFFF")
                    .moveTo(0, -this.progressBar.trackButton.radius).lineTo(0, this.progressBar.trackButton.radius);
            }
        }
        else {
            this.progressBar.trackBar.graphics
                .clear()
                .beginFill(this.color3)
                .drawRoundRect(0, 0, this.progressBar.trackBar.width + 1, this.progressBar.trackBar.height + 1, this.progressBar.trackBar.height / 2)
                .beginStroke(this.color2)
                .drawRoundRect(0, 0, this.progressBar.trackBar.width, this.progressBar.trackBar.height - 1, this.progressBar.trackBar.height / 2);
            if (this.progress > 0) {
                var widthProgress = (this.progressBar.trackBar.width * this.progress / 100) - 1;
                if (widthProgress < this.progressBar.trackBar.height / 2) {
                    widthProgress = this.progressBar.trackBar.height / 2;
                }
                this.progressBar.trackBar.graphics
                    .beginFill("#777777")
                    .drawRoundRect(0, 0, widthProgress, this.progressBar.trackBar.height - 1, this.progressBar.trackBar.height / 2);
            }
        }
    };

    p.isVisible = function () {
        return this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0;
    };

    p.toString = function () {
        return "[MediaControlBar (name=" + this.name + ")]";
    };

    sm.MediaControlBar = mediaControlBar;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.EducamosBarNav ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var educamosBarNav = function (cfg, navBar) {
        this.initialize(cfg, navBar);
    };
    var p = educamosBarNav.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (cfg, navBar) {
        this.Container_initialize();

        this.enabled = true;
        this.visible = true;
        this.cfg = cfg;
        this.buttons = [];
        this.buttonsRight = [];
        this.navBar = navBar;

        this.stepActual = this.navBar != undefined ? this.navBar.stepActual : 0;
        this.numSteps = this.navBar != undefined ? this.navBar.numSteps : 0;

        this.x = this.cfg.x;
        this.y = this.cfg.y;
        this.width = this.cfg.width;
        this.height = styles.educamosNavBar.height;

        this.createBackground();
        this.createLeftButtons();
        this.createCenterButtons();
        this.createRightButtons();
    };

    p.createBackground = function () {
        this.bkg = new createjs.Shape();
        this.bkg.graphics
            .beginFill(styles.educamosNavBar.backgroundColor)
            .drawRoundRectComplex(
                0,
                0,
                this.cfg.width,
                styles.educamosNavBar.height,
                styles.educamosNavBar.topLeftRoundBorder,
                styles.educamosNavBar.topRightRoundBorder,
                styles.educamosNavBar.bottomRightRoundBorder,
                styles.educamosNavBar.bottomLeftRoundBorder);
        this.addChild(this.bkg);
    };

    p.createLeftButtons = function () {
        var offset = 10;
        for (var i = 0; i < this.cfg.leftButtons.length; i++) {
            var buttonDef = this.cfg.leftButtons[i];
            var image = document.createElement("img");
            image.src = buttonDef.image.src.replace(/_/g, "/");
            image.height = buttonDef.image.height;
            image.width = buttonDef.image.width;
            var button = new createjs.Bitmap(image);
            button.x = offset;
            button.y = this.height / 2 - buttonDef.image.height / 2;
            button.width = buttonDef.image.width;
            button.height = buttonDef.image.height;
            button.id = buttonDef.id;
            button.action = buttonDef.action;
            button.enabled = true;
            (function (target) {
                target.setEnabled = function (value) {
                    target.enabled = value;
                    target.alpha = target.enabled ? 1.0 : 0.5;
                };
            })(button);

            var buttonHitArea = new createjs.Shape();
            buttonHitArea.graphics.beginFill("#FFFFFF").drawEllipse(0, 0, button.width, button.height);
            button.hitArea = buttonHitArea;

            this.buttons.push(button);
            this.addChild(button);

            button.on("mouseover", function () { if (this.enabled) jQuery('body').css('cursor', 'pointer'); }, button);
            button.on("mouseout", function () { jQuery('body').css('cursor', 'default'); });

            offset = offset + button.width + 10;
        }
    };

    p.createCenterButtons = function () {
        var buttonsWidth = 0;
        for (var j = 0; j < this.cfg.middleButtons.length; j++) {
            buttonsWidth += this.cfg.middleButtons[j].width;
        }
        var offset = (this.width / 2) - (buttonsWidth / 2);
        for (var i = 0; i < this.cfg.middleButtons.length; i++) {
            var buttonDef = this.cfg.middleButtons[i];
            var image = document.createElement("img");
            image.src = buttonDef.image.src.replace(/_/g, "/");
            image.height = buttonDef.image.height;
            image.width = buttonDef.image.width;
            var button = new createjs.Bitmap(image);
            button.x = offset;
            button.y = this.height / 2 - buttonDef.image.height / 2;
            button.width = buttonDef.image.width;
            button.height = buttonDef.image.height;
            button.id = buttonDef.id;
            button.action = buttonDef.action;
            button.enabled = true;
            (function (target) {
                target.setEnabled = function (value) {
                    target.enabled = value;
                    target.alpha = target.enabled ? 1.0 : 0.5;
                };
            })(button);

            var buttonHitArea = new createjs.Shape();
            buttonHitArea.graphics.beginFill("#FFFFFF").drawEllipse(0, 0, button.width, button.height);
            button.hitArea = buttonHitArea;

            this.buttons.push(button);
            this.addChild(button);

            button.on("mouseover", function () { if (this.enabled) jQuery('body').css('cursor', 'pointer'); }, button);
            button.on("mouseout", function () { jQuery('body').css('cursor', 'default'); });

            offset = offset + button.width + 10;
        }
    };

    p.createRightButtons = function () {
        var buttonsWidth = 0;
        for (var j = 0; j < this.cfg.rightButtons.length; j++) {
            buttonsWidth += this.cfg.rightButtons[j].width + 10;
        }
        var image = null;
        var offset = 0;
        var navBarLeft = this.width;
        if (this.navBar != undefined && this.navBar != null) {
            this.callbackNavBarBtnClick = this.navBar.callbackBtnClick;
            this.autoEnabledButtons = this.navBar.autoEnabledButtons;
            // Botón avanzar
            offset = this.width - styles.icons.Avanzar.width - 10;
            image = document.createElement("img");
            image.src = styles.icons.Avanzar.src.replace(/_/g, "/");
            image.height = styles.icons.Avanzar.height;
            image.width = styles.icons.Avanzar.width;
            var buttonNext = new createjs.Bitmap(image);
            buttonNext.owner = this;
            buttonNext.x = offset;
            buttonNext.y = this.height / 2 - styles.icons.Avanzar.height / 2;
            buttonNext.width = styles.icons.Avanzar.width;
            buttonNext.height = styles.icons.Avanzar.height;
            (function (target) {
                target.setEnabled = function (value) {
                    target.enabled = value;
                    target.alpha = target.enabled ? 1.0 : 0.5;
                    target.owner.navBar.btnNext.enabled = value;
                };
            })(buttonNext);
            var buttonNextHitArea = new createjs.Shape();
            buttonNextHitArea.graphics.beginFill("#FFFFFF").drawEllipse(0, 0, buttonNext.width, buttonNext.height);
            buttonNext.hitArea = buttonNextHitArea;
            buttonNext.setEnabled(this.navBar.btnNext.enabled);
            this.navBar.btnNext.setEnabled = buttonNext.setEnabled;
            this.buttonNext = buttonNext;
            this.addChild(this.buttonNext);
            buttonNext.on("mouseover", function () { if (this.enabled) jQuery('body').css('cursor', 'pointer'); }, buttonNext);
            buttonNext.on("mouseout", function () { jQuery('body').css('cursor', 'default'); });
            buttonNext.on("mousedown",
                function () {
                    if (this.enabled) {
                        if (this.owner.stepActual < this.owner.numSteps) {
                            this.owner.stepActual++;
                            this.owner.navBar.stepActual++;
                            this.owner.pagesIndicator.text = this.owner.stepActual + "/" + this.owner.numSteps;
                        }

                        if (this.owner.callbackNavBarBtnClick)
                            this.owner.callbackNavBarBtnClick(this.owner, "next", this.owner.stepActual);

                        //Habilitar/Deshabilitar avances
                        if (this.owner.autoEnabledButtons) {
                            if (this.owner.stepActual > 1) {
                                this.owner.buttonPrev.setEnabled(true);
                            }
                            if (this.owner.stepActual == this.owner.numSteps) {
                                this.owner.buttonNext.setEnabled(false);
                            }
                            this.owner.navBar.btnPrev.setEnabled(this.owner.buttonPrev.enabled);
                            this.owner.navBar.btnNext.setEnabled(this.owner.buttonNext.enabled);
                        }
                    }
                });

            // Paginación
            var textPages = this.stepActual + "/" + this.numSteps;
            var textToSized = this.numSteps >= 10 ? "00/00" : "0/0";
            var pagesIndicator = new createjs.Text(textToSized, styles.educamosNavBar.textFont, styles.educamosNavBar.textColor);
            var textWidth = pagesIndicator.getMeasuredWidth() + 10;
            offset -= textWidth;
            pagesIndicator.x = offset + textWidth / 2;
            pagesIndicator.y = this.height / 2;
            pagesIndicator.textAlign = "center";
            pagesIndicator.textBaseline = "middle";
            pagesIndicator.maxWidth = textWidth;
            pagesIndicator.text = textPages;
            this.pagesIndicator = pagesIndicator;
            this.addChild(this.pagesIndicator);

            // Botón retroceder
            offset -= styles.icons.Retroceder.width;
            image = document.createElement("img");
            image.src = styles.icons.Retroceder.src.replace(/_/g, "/");
            image.height = styles.icons.Retroceder.height;
            image.width = styles.icons.Retroceder.width;
            var buttonPrev = new createjs.Bitmap(image);
            buttonPrev.owner = this;
            buttonPrev.x = offset;
            buttonPrev.y = this.height / 2 - styles.icons.Retroceder.height / 2;
            buttonPrev.width = styles.icons.Retroceder.width;
            buttonPrev.height = styles.icons.Retroceder.height;
            buttonPrev.enabled = true;
            (function (target) {
                target.setEnabled = function (value) {
                    target.enabled = value;
                    target.alpha = target.enabled ? 1.0 : 0.5;
                    target.owner.navBar.btnPrev.enabled = value;
                };
            })(buttonPrev);
            var buttonPrevHitArea = new createjs.Shape();
            buttonPrevHitArea.graphics.beginFill("#FFFFFF").drawEllipse(0, 0, buttonPrev.width, buttonPrev.height);
            buttonPrev.hitArea = buttonPrevHitArea;
            buttonPrev.setEnabled(this.navBar.btnPrev.enabled);
            this.navBar.btnPrev.setEnabled = buttonPrev.setEnabled;
            this.buttonPrev = buttonPrev;
            this.addChild(this.buttonPrev);
            buttonPrev.on("mouseover", function () { if (this.enabled) jQuery('body').css('cursor', 'pointer'); }, buttonPrev);
            buttonPrev.on("mouseout", function () { jQuery('body').css('cursor', 'default'); });
            buttonPrev.on("mousedown",
                function () {
                    if (this.enabled) {
                        if (this.owner.stepActual > 1) {
                            this.owner.stepActual--;
                            this.owner.navBar.stepActual--;
                            this.owner.pagesIndicator.text = this.owner.stepActual + "/" + this.owner.numSteps;
                        }

                        if (this.owner.callbackNavBarBtnClick)
                            this.owner.callbackNavBarBtnClick(this.owner, "prev", this.owner.stepActual);

                        //Habilitar/Deshabilitar avances
                        if (this.owner.autoEnabledButtons) {
                            if (this.owner.stepActual >= 1 && this.owner.numSteps > 1) {
                                this.owner.buttonNext.setEnabled(true);
                            }
                            if (this.owner.stepActual == 1) {
                                this.owner.buttonPrev.setEnabled(false);
                            }
                            this.owner.navBar.btnPrev.setEnabled(this.owner.buttonPrev.enabled);
                            this.owner.navBar.btnNext.setEnabled(this.owner.buttonNext.enabled);
                        }
                    }
                });

            navBarLeft = offset - 20;
        }
        this.navBarLeft = navBarLeft + 20;

        offset = navBarLeft - buttonsWidth;
        for (var i = 0; i < this.cfg.rightButtons.length; i++) {
            var buttonDef = this.cfg.rightButtons[i];
            image = document.createElement("img");
            image.src = buttonDef.image.src.replace(/_/g, "/");
            image.height = buttonDef.image.height;
            image.width = buttonDef.image.width;
            var button = new createjs.Bitmap(image);
            button.x = offset;
            button.y = this.height / 2 - buttonDef.image.height / 2;
            button.width = buttonDef.image.width;
            button.height = buttonDef.image.height;
            button.id = buttonDef.id;
            button.action = buttonDef.action;
            button.enabled = true;
            (function (target) {
                target.setEnabled = function (value) {
                    target.enabled = value;
                    target.alpha = target.enabled ? 1.0 : 0.5;
                };
            })(button);

            var buttonHitArea = new createjs.Shape();
            buttonHitArea.graphics.beginFill("#FFFFFF").drawEllipse(0, 0, button.width, button.height);
            button.hitArea = buttonHitArea;

            this.buttons.push(button);
            this.buttonsRight.push(button);
            this.addChild(button);

            button.on("mouseover", function () { if (this.enabled) jQuery('body').css('cursor', 'pointer'); }, button);
            button.on("mouseout", function () { jQuery('body').css('cursor', 'default'); });

            offset = offset + button.width + 10;
        }
    };

    p.getButton = function (id) {
        var result = null;
        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].id == id) {
                result = this.buttons[i];
                break;
            }
        }
        return result;
    };

    p.reset = function () {
        this.stepActual = 1;
        this.pagesIndicator.text = this.stepActual + "/" + this.numSteps;
    };

    p.isVisible = function () {
        return this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0;
    };

    p.reorderVisibleButtons = function () {
        // Right Buttons
        var buttonsWidth = 0;
        for (var i = 0; i < this.buttonsRight.length; i++) {
            var buttonRight = this.buttonsRight[i];
            if (buttonRight.visible) {
                buttonsWidth += buttonRight.width + 10;
            }
        }
        var offset = (this.navBarLeft - 20) - buttonsWidth;
        for (var i = 0; i < this.buttonsRight.length; i++) {
            var buttonRight = this.buttonsRight[i];
            if (buttonRight.visible) {
                buttonRight.x = offset;
                offset = offset + buttonRight.width + 10;
            }
        }
    };

    p.toString = function () {
        return "[EducamosBarNav]";
    };

    sm.EducamosBarNav = educamosBarNav;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.keyboardClassic --------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    //x: posicion x
    //y: posicion y
    //ncolum: numero de columnas del teclado
    //sizekey: tamaño de la tecla
    //abc: boolean, teclado con letras.
    //numbers: boolean, teclado con numeros
    //operators: boolean, teclado con operadores
    var keyboardClassic = function (cfg, callbackClick) {
        this.states = {};
        this.initialize(cfg, callbackClick);
    };

    var p = keyboardClassic.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;
    p.owner = null;

    p.initialize = function (cfg, callbackClick) {
        this.Container_initialize();

        this.cfg = cfg;
        this.callbackClick = callbackClick;

        this.alphaKeys = [];
        this.numericKeys = [];
        this.symbolKeys = [];
        this.enabled = true;

        if (this.cfg.chars != undefined && this.cfg.chars != null) {
            this.alphaKeys = this.cfg.chars;
        }
        if (this.cfg.numbers != undefined && this.cfg.numbers != null) {
            this.numericKeys = this.cfg.numbers;
        }
        if (this.cfg.symbols != undefined && this.cfg.symbols != null) {
            this.symbolKeys = this.cfg.symbols;
        }

        var teclas = [];
        var tipos = [];

        if (this.cfg.withChars) {
            if (this.alphaKeys.length > 0) {
                for (var iAlphaKey = 0 in this.alphaKeys) {
                    teclas.push(this.alphaKeys[iAlphaKey]);
                    tipos.push(0);
                }
            }
            else {
                teclas.push("A", "B", "C", "D", "E", "F", "G", "H", "I",
                            "J", "K", "L", "M", "N", "Ñ", "O", "P", "Q",
                            "R", "S", "T", "U", "V", "W", "X", "Y", "Z");
                tipos.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            }
        }

        if (this.cfg.withNumbers) {
            if (this.numericKeys.length > 0) {
                for (var iNumericKey = 0 in this.numericKeys) {
                    teclas.push(this.numericKeys[iNumericKey]);
                    tipos.push(1);
                }
            }
            else {
                teclas.push("1", "2", "3", "4", "5", "6", "7", "8", "9", "0");
                tipos.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
            }
        }

        if (this.cfg.withSymbols) {
            if (this.symbolKeys.length > 0) {
                for (var iSymbolKey = 0 in this.symbolKeys) {
                    teclas.push(this.symbolKeys[iSymbolKey]);
                    tipos.push(2);
                }
            }
            else {
                teclas.push("+", "‒", ":", "x", "=");
                tipos.push(2, 2, 2, 2, 2);
            }
        }

        if (this.cfg.deleteKey) {
            teclas.push("delete");
            tipos.push(3);
        }

        if (this.cfg.okKey) {
            teclas.push("ok");
            tipos.push(3);
        }

        if (this.cfg.koKey) {
            teclas.push("ko");
            tipos.push(3);
        }

        this.width = (this.cfg.sizeKey + this.cfg.keyDistance) * this.cfg.ncolum;

        var vncolum = 0;
        var posY = 0;
        var posX = 0;
        var key = null;
        this.keys = [];
        for (var i = 0; i < teclas.length; i++) {
            //Posiciono la tecla en el teclado
            if (this.cfg.ncolum == vncolum) {
                posY = posY + (this.cfg.sizeKey + this.cfg.keyDistance);
                posX = 0;
                vncolum = 0;
            }
            else {
                posX = (vncolum * (this.cfg.sizeKey + this.cfg.keyDistance));
            }
            vncolum = vncolum + 1;

            //Creo la tecla
            var tipo = tipos[i];

            key = new sm.KeyboardClassicKey(this.cfg, tipo, this.OnClickKey);
            key.x = posX;
            key.y = posY;
            key.code = teclas[i];
            var keyChar = teclas[i];
            if (tipo == 3) {
                if (keyChar == "delete") keyChar = "f";
                if (keyChar == "ok") keyChar = "v";
                if (keyChar == "ko") keyChar = "w";
            }

            key.setText(keyChar);

            this.addChild(key);
            this.keys.push(key);
        }

    };

    p.OnClickKey = function () {
        this.parent.callbackClick(this);
    };

    p.getKey = function (textKey) {
        // TODO: faltaría evaluar teclas especiales.
        var result = null;
        for (var i = 0; i < this.keys.length; i++) {
            var key = this.keys[i];
            if (key.textoTecla.toUpperCase() == textKey.toUpperCase()) {
                result = key;
                break;
            }
        }
        return result;
    };

    sm.KeyboardClassic = keyboardClassic;

}());

// ---------------------------------------------------------------------------------------------------------
// sm.keyboardClassicKey -----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var keyboardClassicKey = function (cfg, tipo, callbackClick) {
        this.states = {};

        this.initialize(cfg, tipo, callbackClick);
    };

    var p = keyboardClassicKey.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (cfg, tipo, callbackClick) {
        this.Container_initialize();

        if (this.on == undefined) {
            createjs.EventDispatcher.initialize(this);
        }

        this.states = { up: null, over: null, disabled: null };
        this.lastState = "up";
        this.enabled = true;
        this.cfg = cfg;
        this.tipo = tipo;

        this.sizeKey = this.cfg.sizeKey;
        this.font = this.cfg.font;

        this.width = this.cfg.sizeKey;
        this.height = this.cfg.sizeKey;

        this.callbackClick = callbackClick;

        this.buttonStyle = {
            borderColor: this.cfg.keyBorderColor != undefined ? this.cfg.keyBorderColor : this.tipo == 0 ? styles.keyboard.buttonAlpha.borderColor : this.tipo == 1 ? styles.keyboard.buttonNumeric.borderColor : this.tipo == 2 ? styles.keyboard.buttonSymbol.borderColor : styles.keyboard.buttonSpecial.borderColor,
            backgroundColor: this.cfg.keyBackgroundColor != undefined ? this.cfg.keyBackgroundColor : this.tipo == 0 ? styles.keyboard.buttonAlpha.backgroundColor : this.tipo == 1 ? styles.keyboard.buttonNumeric.backgroundColor : this.tipo == 2 ? styles.keyboard.buttonSymbol.backgroundColor : styles.keyboard.buttonSpecial.backgroundColor,
            backgroundColorHover: this.cfg.keyBackgroundColorHover != undefined ? this.cfg.keyBackgroundColorHover : this.tipo == 0 ? styles.keyboard.buttonAlpha.backgroundColorHover : this.tipo == 1 ? styles.keyboard.buttonNumeric.backgroundColorHover : this.tipo == 2 ? styles.keyboard.buttonSymbol.backgroundColorHover : styles.keyboard.buttonSpecial.backgroundColorHover,
            backgroundColorDisabled: this.cfg.keyBackgroundColorDisabled != undefined ? this.cfg.keyBackgroundColorDisabled : this.tipo == 0 ? styles.keyboard.buttonAlpha.backgroundColorDisabled : this.tipo == 1 ? styles.keyboard.buttonNumeric.backgroundColorDisabled : this.tipo == 2 ? styles.keyboard.buttonSymbol.backgroundColorDisabled : styles.keyboard.buttonSpecial.backgroundColorDisabled,
            shadowSize: 1,
            shadowColor: "#BBBBBB",
        };

        this.text = null;
        this.enabled = true;

        //Color Boton
        if (this.buttonStyle.backgroundColor != null && this.buttonStyle.backgroundColor != "") {
            var shpShadow = new createjs.Shape();
            shpShadow.width = this.width;
            shpShadow.height = this.height;
            shpShadow.graphics.beginFill(this.buttonStyle.backgroundColor).setStrokeStyle(2).beginStroke(this.buttonStyle.borderColor).drawRoundRect(0, 0, this.sizeKey, this.sizeKey, this.cfg.keyRoundCorner);
            shpShadow.shadow = new createjs.Shadow(this.buttonStyle.shadowColor, this.buttonStyle.shadowSize, this.buttonStyle.shadowSize, this.buttonStyle.shadowSize * 5);
            this.addChild(shpShadow);

            var upShape = this.createShape(this.buttonStyle.backgroundColor, this.buttonStyle.borderColor, this.buttonStyle.shadowSize, this.buttonStyle.shadowColor);
            this.states.up = upShape;
            this.addChild(upShape);
            this.bkg = upShape;
        }

        //color Hover
        if (this.buttonStyle.backgroundColorHover != null && this.buttonStyle.backgroundColorHover != "") {
            var hoverShape = this.createShape(this.buttonStyle.backgroundColorHover, this.buttonStyle.borderColor, this.buttonStyle.shadowSize, this.buttonStyle.shadowColor);
            hoverShape.visible = false;
            this.states.hover = hoverShape;
            this.addChild(hoverShape);
        }

        //color Disabled
        if (this.buttonStyle.backgroundColorDisabled != null && this.buttonStyle.backgroundColorDisabled != "") {
            var disabledShape = this.createShape(this.buttonStyle.backgroundColorDisabled, this.buttonStyle.borderColor, this.buttonStyle.shadowSize, this.buttonStyle.shadowColor);
            disabledShape.visible = false;
            this.states.disabled = disabledShape;
            this.addChild(disabledShape);
        }

        this.on("mouseover", function (event) {
            if (this.parent.enabled && this.enabled) {
                this.swapStates(this.lastState, "hover");
                showHandCursor(true);
            }
        });

        this.on("click", function (event) {
            if (this.parent.enabled && this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(true);
                if (this.callbackClick)
                    this.callbackClick();
            }
        });

        this.on("mouseout", function (event) {
            if (this.parent.enabled && this.enabled) {
                this.swapStates(this.lastState, "up");
                showHandCursor(false);
            }
        });
    };

    p.createShape = function (backgroundColor, borderColor, shadowSize, shadowColor) {
        var shp = new createjs.Shape();
        shp.width = this.width;
        shp.height = this.height;
        shp.graphics.beginFill(backgroundColor)
               .drawRoundRect(0, 0, this.sizeKey, this.sizeKey, this.cfg.keyRoundCorner);
        return shp;
    };


    p.swapStates = function (last, current) {
        if (this.enabled && (last != current) && this.states[last] && this.states[current]) {
            this.states[current].visible = true;
            this.states[last].visible = false;

            this.lastState = current;

            return true;
        }
        else if (!this.enabled && this.states["disabled"]) {
            this.states["disabled"].visible = true;
            this.lastState = "disabled";
            return true;
        }

        return false;
    };

    p.setEnabled = function (value) {
        this.enabled = value;

        if (this.enabled) {
            this.swapStates(this.lastState, "up");
        } else {
            this.swapStates(this.lastState, "disabled");
            showHandCursor(false);
        }

        if (this.text != null && this.text != undefined) {
            if (this.enabled) {
                this.text.color = this.buttonStyle.fontColor;
            } else {
                this.text.color = this.buttonStyle.fontColorDisabled;
            }
        }
    };

    p.setText = function (txt) {
        this.removeChild(this.text);

        var stylesFontAlpha = "bold " + styles.keyboard.buttonAlpha.fontSize + "px " + styles.keyboard.buttonAlpha.fontFamily;
        var stylesFontNumeric = "bold " + styles.keyboard.buttonNumeric.fontSize + "px " + styles.keyboard.buttonNumeric.fontFamily;
        var stylesFontSymbol = "bold " + styles.keyboard.buttonSymbol.fontSize + "px " + styles.keyboard.buttonSymbol.fontFamily;
        var stylesFontSpecial = "bold " + styles.keyboard.buttonSpecial.fontSize + "px " + styles.keyboard.buttonSpecial.fontFamily;

        var font = this.cfg.font != undefined ? this.cfg.font : this.tipo == 0 ? stylesFontAlpha : this.tipo == 1 ? stylesFontNumeric : this.tipo == 2 ? stylesFontSymbol : stylesFontSpecial;
        var fontColor = this.cfg.fontColor != undefined ? this.cfg.fontColor : this.tipo == 0 ? styles.keyboard.buttonAlpha.fontColor : this.tipo == 1 ? styles.keyboard.buttonNumeric.fontColor : this.tipo == 2 ? styles.keyboard.buttonSymbol.fontColor : styles.keyboard.buttonSpecial.fontColor;

        this.text = new createjs.Text(txt, font, fontColor);
        this.text.x = this.width / 2;
        this.text.y = this.height / 2;
        this.text.textAlign = "center";
        this.text.textBaseline = "middle";
        this.textoTecla = txt;


        this.addChild(this.text);

        if (!this.enabled) {
            this.text.color = this.buttonStyle.fontColorDisabled;
        }
    };

    sm.KeyboardClassicKey = keyboardClassicKey;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.keyboardQwerty ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    //Parametros que usa:
    //        sizeKey: Tamaño tecla,
    //        keyBackgroundColor: Color tecla,
    //        keyNumericBackgroundColor: Color tecla numerico,
    //        keyRoundCorner: Redondeo tecla,
    //        Keys: teclado
    //        Keys2: 2º teclado
    //        font: Tamaño fuente tecla,
    //        fontcolorKey: Color fuente tecla,
    //        keyDistance : Espacio entre teclas

    var keyboardQwerty = function (cfg, callbackClick) {
        this.initialize(cfg, callbackClick);
    };

    var p = keyboardQwerty.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;
    p.owner = null;

    p.initialize = function (cfg, callbackClick) {
        this.Container_initialize();
        this.cfg = cfg;
        this.x = this.cfg.x;
        this.y = this.cfg.y;
        this.enabled = true;
        this.callbackClick = callbackClick;

        this.estado = 0; //0: mayusculas, 1: minusculas

        this.keys = [];

        var posY = 0;
        var posX = this.cfg.sizeKey / 3; //this.cfg.keyDistance * 4;
        for (var x = 0; x < this.cfg.keys.length; x++) {
            for (var i = 0; i < this.cfg.keys[x].length; i++) {
                var key;
                var keyWidth = this.cfg.sizeKey;
                if ((this.cfg.keys[x][i] >= 0) || (this.cfg.keys[x][i] <= 9)) {
                    key = new sm.KeyboardQwertyKey(this.cfg.keyNumericBackgroundColor,
                        this.cfg.sizeKey,
                        this.cfg.sizeKey,
                        this.cfg.keyRoundCorner,
                        this.cfg.keys[x][i],
                        this.cfg.font,
                        this.cfg.fontColor,
                        this.OnClickKey);
                } else if (this.cfg.keys[x][i].length > 1) {
                    keyWidth = (this.cfg.sizeKey * (this.cfg.keys[x][i].length / 2) + this.cfg.keyDistance * ((this.cfg.keys[x][i].length / 2) - 1));
                    key = new sm.KeyboardQwertyKey(this.cfg.keyBackgroundColor,
                        keyWidth,
                        this.cfg.sizeKey,
                        this.cfg.keyRoundCorner,
                        this.cfg.keys[x][i],
                        this.cfg.font,
                        this.cfg.fontColor,
                        this.OnClickKey);
                } else {
                    key = new sm.KeyboardQwertyKey(this.cfg.keyBackgroundColor,
                        this.cfg.sizeKey,
                        this.cfg.sizeKey,
                        this.cfg.keyRoundCorner,
                        this.cfg.keys[x][i],
                        this.cfg.font,
                        this.cfg.fontColor,
                        this.OnClickKey);
                }
                key.x = posX;
                key.y = posY;

                if (key.text.text == "←") {
                    key.code = "delete";
                }

                if (key.text.text == "¿") {
                    key.code = "intro";
                }

                if (key.text.text.indexOf("└") >= 0) {
                    key.code = "space";
                }

                this.addChild(key);
                posX = posX + keyWidth + this.cfg.keyDistance;
                this.keys.push(key);
            }

            if (x != this.cfg.keys.length - 1) {
                if ((x + 1) >= this.cfg.keys.length - 2)
                    posX = 0;
                else posX = ((this.cfg.sizeKey / 3) * (x + 2));

                posY = posY + this.cfg.sizeKey + this.cfg.keyDistance;
            }
        }

        //Segundo teclado
        posY = 0;
        if (this.cfg.keys2 != undefined && this.cfg.keys2 != null) {
            for (var x = 0; x < this.cfg.keys2.length; x++) {
                for (var i = 0; i < this.cfg.keys2[x].length; i++) {
                    var key;
                    if (this.cfg.keys2[x].length == 1)
                        key = new sm.KeyboardQwertyKey(this.cfg.keyBackgroundColor,
                            (this.cfg.sizeKey * 2 + this.cfg.keyDistance),
                            this.cfg.sizeKey,
                            this.cfg.keyRoundCorner,
                            this.cfg.keys2[x][i],
                            this.cfg.font,
                            this.cfg.fontColor,
                            this.OnClickKey);
                    else
                        key = new sm.KeyboardQwertyKey(this.cfg.keyBackgroundColor,
                            this.cfg.sizeKey,
                            this.cfg.sizeKey,
                            this.cfg.keyRoundCorner,
                            this.cfg.keys2[x][i],
                            this.cfg.font,
                            this.cfg.fontColor,
                            this.OnClickKey);

                    key.x = posX;
                    key.y = posY;

                    if (key.text.text == "←") {
                        key.code = "delete";
                    }

                    if (key.text.text == "¿") {
                        key.code = "intro";
                    }

                    if (key.text.text.indexOf("└") >= 0) {
                        key.code = "space";
                    }

                    this.addChild(key);
                    posX = posX + this.cfg.sizeKey + this.cfg.keyDistance;
                    this.keys.push(key);
                }

                posX = posX - (this.cfg.keyDistance * 2) - (this.cfg.sizeKey * 2);
                posY = posY + this.cfg.sizeKey + this.cfg.keyDistance;
            }
        }
    };

    p.OnClickKey = function () {
        this.parent.callbackClick(this);
    };

    p.getKey = function (textKey) {
        // TODO: faltaría evaluar teclas especiales.
        var result = null;
        for (var i = 0; i < this.keys.length; i++) {
            var key = this.keys[i];
            if (key.textoTecla.toUpperCase() == textKey.toUpperCase()) {
                result = key;
                break;
            }
        }
        return result;
    };

    sm.KeyboardQwerty = keyboardQwerty;

}());

// ---------------------------------------------------------------------------------------------------------
// sm.KeyboardQwertyKey ------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {

    var keyboardQwertyKey = function (keyBackgroundColor, widthKey, heigthKey, keyRoundCorner, text, font, fontColor, callbackClick) {
        this.states = {};

        this.initialize(keyBackgroundColor, widthKey, heigthKey, keyRoundCorner, text, font, fontColor, callbackClick)
    };

    var p = keyboardQwertyKey.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (keyBackgroundColor, widthKey, heigthKey, keyRoundCorner, text, font, fontColor, callbackClick) {
        this.Container_initialize();
        this.keyBackgroundColor = keyBackgroundColor;
        this.widthkey = widthKey,
        this.heightkey = heigthKey;
        this.keyRoundCorner = keyRoundCorner;
        this.enabled = true;

        this.textoTecla = text;
        this.font = font;
        this.fontColor = fontColor;

        this.callbackClick = callbackClick;
        this.text = null;

        if (this.textoTecla != null && this.textoTecla != "") {
            var shp = new createjs.Shape();
            shp.width = this.widthkey;
            shp.height = this.heightkey;
            shp.graphics.beginFill(this.keyBackgroundColor).drawRoundRect(0, 0, shp.width, shp.height, this.keyRoundCorner);
            this.addChild(shp);
            this.bkg = shp;

            var keyFont = this.textoTecla == "¿" ? replaceFont(this.font, "Symbol") : this.font;
            var texto = new createjs.Text(this.textoTecla, keyFont, this.fontColor);
            texto.x = (shp.width - texto.getMeasuredWidth()) / 2;
            texto.y = (shp.height - texto.getMeasuredHeight()) / 2;

            if (this.textoTecla == "¿") {
                var anchoIntro = texto.getMeasuredWidth(); // 16
                var anchoPunta = anchoIntro / 4;
                var shpIntro = new createjs.Shape();
                shpIntro.graphics.setStrokeStyle(1)
                    .beginStroke(this.fontColor)
                    .moveTo(anchoIntro, 0).lineTo(anchoIntro, anchoIntro).lineTo(0, anchoIntro)
                    .beginFill(this.fontColor)
                    .moveTo(0, anchoIntro).lineTo(anchoPunta, anchoIntro - anchoPunta).lineTo(anchoPunta, anchoIntro + anchoPunta).lineTo(0, anchoIntro);
                shpIntro.regX = anchoIntro / 2;
                shpIntro.regY = anchoIntro / 2;
                shpIntro.x = shp.width / 2;
                shpIntro.y = shp.height / 2;
                this.addChild(shpIntro);
            }
            else {
                this.addChild(texto);
            }

            this.text = texto;
        }

        this.on("mouseover", function (event) {
            if (this.parent.enabled && this.enabled)
                showHandCursor(true);
        });

        this.on("click", function (event) {
            if (this.textoTecla == "⇧")
                this.keyboardUppercase(this.parent);
            else {
                if (this.enabled && this.parent.enabled && this.callbackClick)
                    this.callbackClick();
            }
        });

        this.on("mouseout", function (event) {
            showHandCursor(false);
        });
    };

    p.keyboardUppercase = function (keyboard) {
        for (var i = 0; i < keyboard.keys.length; i++) {
            var key = keyboard.keys[i];
            if ((key.text.text >= "a" && key.text.text <= "z") || (key.text.text >= "A" && key.text.text <= "Z")) {
                if (keyboard.estado == 0) {
                    key.text.text = key.text.text.toUpperCase();
                } else {
                    key.text.text = key.text.text.toLowerCase();
                }
            }
        }

        keyboard.estado = (keyboard.estado == 0) ? 1 : 0;
    };

    p.writing = function (key, cadena) {
        switch (key.text) {
            case "└──┘":
                cadena = cadena + " ";
                return cadena;
            case "←":
                cadena = cadena.substring(0, cadena.length - 1);
                return cadena;
            case "¿": // Intro
                return cadena;
            default:
                return cadena + key.text;
        }
    };

    sm.KeyboardQwertyKey = keyboardQwertyKey;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.KeyboardNumeric --------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    //        sizeKey: Tamaño tecla,
    //        keyBackgroundColor: Color tecla,
    //        keyBorderBackgroundColor: Color tecla,
    //        keyRoundCorner: Redondeo tecla,
    //        Keys: teclado
    //        font: Tamaño fuente tecla,
    //        fontcolorKey: Color fuente tecla,
    //        keyDistance : Espacio entre teclas

    var keyboardNumeric = function (cfg, callbackClick) {
        this.initialize(cfg, callbackClick);
    };

    var p = keyboardNumeric.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;
    p.owner = null;

    p.initialize = function (cfg, callbackClick) {
        this.Container_initialize();
        this.cfg = cfg;
        this.x = this.cfg.x;
        this.y = this.cfg.y;
        this.enabled = true;
        this.callbackClick = callbackClick;

        var posY = 0;
        var posX = 0;
        this.keys = [];
        for (var x = 0; x < this.cfg.keys.length; x++) {
            for (var i = 0; i < this.cfg.keys[x].length; i++) {
                var key;
                var keyWidth = (this.cfg.sizeKey * this.cfg.keys[x][i].length) + (this.cfg.keyDistance * (this.cfg.keys[x][i].length - 1));
                key = new sm.KeyboardNumericKey(this.cfg.keyBackgroundColor,
                    this.cfg.keyBorderColor,
                    keyWidth,
                    this.cfg.sizeKey,
                    this.cfg.keyRoundCorner,
                    this.cfg.keys[x][i],
                    this.cfg.font,
                    this.cfg.fontColor,
                    this.OnClickKey);
                key.x = posX;
                key.y = posY;

                if (key.text.text.trim() == "←") {
                    key.code = "delete";
                }

                if (key.text.text == "¿") {
                    key.code = "intro";
                }

                if (key.text.text.indexOf("└") >= 0) {
                    key.code = "space";
                }

                this.addChild(key);
                posX = posX + (this.cfg.sizeKey * key.text.text.length) + (this.cfg.keyDistance * key.text.text.length);
                this.keys.push(key);
            }

            posX = (posX - posX);
            posY = posY + this.cfg.sizeKey + this.cfg.keyDistance;
        }
    };

    p.OnClickKey = function () {
        this.parent.callbackClick(this);
    };

    p.getKey = function (textKey) {
        // TODO: faltaría evaluar teclas especiales.
        var result = null;
        for (var i = 0; i < this.keys.length; i++) {
            var key = this.keys[i];
            if (key.textoTecla.toUpperCase() == textKey.toUpperCase()) {
                result = key;
                break;
            }
        }
        return result;
    };

    sm.KeyboardNumeric = keyboardNumeric;

}());

// ---------------------------------------------------------------------------------------------------------
// sm.KeyboardNumericKey -----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var keyboardNumericKey = function (keyBackgroundColor, keyBorderBackgroundColor, keyWidth, keyHeight, keyRoundCorner, text, font, fontColor, callbackClick) {
        this.states = {};

        this.initialize(keyBackgroundColor, keyBorderBackgroundColor, keyWidth, keyHeight, keyRoundCorner, text, font, fontColor, callbackClick);
    };

    var p = keyboardNumericKey.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (keyBackgroundColor, keyBorderBackgroundColor, keyWidth, keyHeight, keyRoundCorner, text, font, fontColor, callbackClick) {
        this.Container_initialize();

        this.keyBackgroundColor = keyBackgroundColor;
        this.keyBorderBackgroundColor = keyBorderBackgroundColor;
        this.keyWidth = keyWidth,
        this.keyHeight = keyHeight,
        this.keyRoundCorner = keyRoundCorner;
        this.textoTecla = text;
        this.font = font;
        this.enabled = true;
        this.fontColor = fontColor;
        this.callbackClick = callbackClick;
        this.text = null;
        if (this.textoTecla != null && this.textoTecla != "") {
            var shp = new createjs.Shape();
            shp.width = this.keyWidth;
            shp.height = this.keyHeight;
            shp.graphics.setStrokeStyle(1).beginStroke(this.keyBorderBackgroundColor).beginFill(this.keyBackgroundColor).drawRoundRect(0, 0, shp.width, shp.height, this.keyRoundCorner);
            this.addChild(shp);
            this.bkg = shp;

            var keyFont = this.textoTecla == "¿" ? replaceFont(this.font, "Symbol") : this.font;
            var texto = new createjs.Text(this.textoTecla, keyFont, this.fontColor);
            texto.x = (shp.width - texto.getMeasuredWidth()) / 2;
            texto.y = (shp.height - texto.getMeasuredHeight()) / 2;

            if (this.textoTecla == "¿") {
                var anchoIntro = texto.getMeasuredWidth(); // 16
                var anchoPunta = anchoIntro / 4;
                var shpIntro = new createjs.Shape();
                shpIntro.graphics.setStrokeStyle(1)
                    .beginStroke(this.fontColor)
                    .moveTo(anchoIntro, 0).lineTo(anchoIntro, anchoIntro).lineTo(0, anchoIntro)
                    .beginFill(this.fontColor)
                    .moveTo(0, anchoIntro).lineTo(anchoPunta, anchoIntro - anchoPunta).lineTo(anchoPunta, anchoIntro + anchoPunta).lineTo(0, anchoIntro);
                shpIntro.regX = anchoIntro / 2;
                shpIntro.regY = anchoIntro / 2;
                shpIntro.x = shp.width / 2;
                shpIntro.y = shp.height / 2;
                this.addChild(shpIntro);
            }
            else {
                this.addChild(texto);
            }

            this.text = texto;
        }


        this.on("mouseover", function (event) {
            if (this.parent.enabled && this.enabled)
                showHandCursor(true);
        });

        this.on("click", function (event) {
            if (this.enabled && this.parent.enabled && this.callbackClick)
                this.callbackClick();
        });

        this.on("mouseout", function (event) {
            showHandCursor(false);
        });
    };

    p.writing = function (key, cadena) {
        switch (key.text) {
            case "←":
                cadena = cadena.substring(0, cadena.length - 1);
                return cadena;
            case "¿": // Intro
                return cadena;
            default:
                return cadena + key.text;
        }
        return cadena;
    };

    sm.KeyboardNumericKey = keyboardNumericKey;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.HtmlText ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var htmlText = function (html, width, height, fontName, fontSize, foreColor, backColor) {
        this.initialize(html, width, height, fontName, fontSize, foreColor, backColor);
    };

    var p = htmlText.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (html, width, height, fontName, fontSize, foreColor, backColor) {
        this.Container_initialize();
        this.html = html;
        this.height = height;
        this.width = width;
        this.fontName = fontName;
        this.fontSize = fontSize;
        this.foreColor = foreColor;
        this.backColor = backColor;
        this.createDOMElement();
    };

    p.createDOMElement = function () {
        counterDynDomEids++;
        var elementId = "dynDomE" + counterDynDomEids + "_label";
        this.name = elementId;
        var element = document.createElement('div');
        element.id = elementId;
        element.innerHTML = this.html;
        element.style.visibility = 'hidden';
        element.style.zindex = 1;
        element.style.cursor = "default";
        element.style.position = 'absolute';
        element.style.overflow = "hidden";
        if (this.width) {
            element.style.width = this.width + "px";
        }
        if (this.height) {
            element.style.height = this.height + "px";
        }
        if (this.fontName) {
            element.style.fontFamily = this.fontName;
        }
        if (this.fontSize) {
            element.style.fontSize = this.fontSize;
        }
        if (this.foreColor) {
            element.style.color = this.foreColor;
        }
        if (this.backColor) {
            element.style.backgroundColor = this.backColor;
        }
        var dynDomE = document.getElementById("dynDomE");
        if (dynDomE != null) {
            dynDomE.appendChild(element);
            var content = new createjs.DOMElement(elementId);
            this.addChild(content);
        }
    };

    sm.HtmlText = htmlText;
}(window));

// ---------------------------------------------------------------------------------------------------------
// sm.HtmlTextBox ------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var htmlTextBox = function (width, height, borderColor, fontName, fontSize, foreColor, backColor, textAlign, maxLength, onlyNumbers, onChangeCallback, onInputChangeCallback) {
        this.initialize(width, height, borderColor, fontName, fontSize, foreColor, backColor, textAlign, maxLength, onlyNumbers, onChangeCallback, onInputChangeCallback);
    };

    var p = htmlTextBox.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (width, height, borderColor, font, foreColor, backColor, textAlign, maxLength, onlyNumbers, onChangeCallback, onInputChangeCallback) {
        this.Container_initialize();
        this.height = height;
        this.width = width;
        this.borderColor = borderColor;
        this.font = font;
        this.foreColor = foreColor;
        this.backColor = backColor;
        this.textAlign = textAlign;
        this.maxLength = maxLength;
        this.onlyNumbers = onlyNumbers;
        this.onChangeCallback = onChangeCallback;
        this.onInputChangeCallback = onInputChangeCallback;
        this.createDOMElement();

        if (globalStage &&
            touchEnabled &&
            !browserDetect.isIOS &&
            !browserDetect.isChrome &&
            !browserDetect.isFirefox) {
            if (createjs.Touch.isSupported()) {
                createjs.Touch.disable(globalStage);
            }
            touchEnabled = false;
        }
    };

    p.createDOMElement = function () {
        counterDynDomEids++;
        var elementId = "dynDomE" + counterDynDomEids + "_textBox";
        this.name = elementId;
        var element = document.createElement('div');
        element.id = elementId;
        var textBoxStyle = "";
        if (this.borderColor) {
            textBoxStyle += "background-color: transparent; border: solid 1px " + this.borderColor + "; width: " + (this.width - 2) + "px; height: " + (this.height - 4) + "px";
        } else {
            textBoxStyle += "background-color: transparent; border: none; width: " + this.width + "px; height: " + (this.height - 2) + "px";
        }
        if (this.font) {
            textBoxStyle += "; font: " + this.font;
        }
        if (this.foreColor) {
            textBoxStyle += "; color: " + this.foreColor;
        }
        if (this.textAlign) {
            textBoxStyle += "; text-align: " + this.textAlign;
        }
        var maxLength = "";
        if (this.maxLength) {
            maxLength = "maxlength='" + this.maxLength + "' size='" + this.maxLength + "'";
        }
        var numberValidation = "";
        if (this.onlyNumbers) {
            numberValidation = " onkeypress='validateNumericTextBox(event)'";
        }
        element.innerHTML = "<input id='" + elementId + "_input' onselectstart='return false' style='" + textBoxStyle + "' " + maxLength + numberValidation + "/>";
        element.style.visibility = 'hidden';
        element.style.zindex = 1;
        element.style.cursor = "default";
        element.style.position = 'absolute';
        element.style.overflow = "hidden";
        if (this.width) {
            element.style.width = this.width + "px";
        }
        if (this.height) {
            element.style.height = this.height + "px";
        }
        if (this.fontName) {
            element.style.fontFamily = this.fontName;
        }
        if (this.fontSize) {
            element.style.fontSize = this.fontSize;
        }
        if (this.foreColor) {
            element.style.color = this.foreColor;
        }
        if (this.backColor) {
            element.style.backgroundColor = this.backColor;
        }
        var dynDomE = document.getElementById("dynDomE");
        if (dynDomE != null) {
            dynDomE.appendChild(element);
            var content = new createjs.DOMElement(elementId);
            this.addChild(content);
        }
        this.htmlElement = element;
        var inputElement = this.htmlElement.children[0];
        inputElement.owner = this;
        inputElement.onchange = function (e) {
            if (e.currentTarget.owner.onChangeCallback != undefined && e.currentTarget.owner.onChangeCallback != null) {
                e.currentTarget.owner.onChangeCallback();
            }
        };
        inputElement.oninput = function (e) {
            if (this.afteroninput) {
                if (!this.afteroninput(e)) {
                    return;
                }
            }
            if (e.currentTarget.owner.onInputChangeCallback != undefined && e.currentTarget.owner.onInputChangeCallback != null) {
                e.currentTarget.owner.onInputChangeCallback();
            }
        };
        this.inputElement = inputElement;
        this.dummyText = new createjs.Text(" ", this.font, this.foreColor);
        this.dummyText.textAlign = this.textAlign;
        this.dummyText.textBaseline = "middle";
        this.addChild(this.dummyText);
        if (this.textAlign === "center") {
            this.dummyText.x = this.width / 2;
        }
        this.dummyText.y = this.height / 2;
        this.dummyText.visible = false;
    };

    p.getValue = function () {
        return this.htmlElement.children[0].value;
    };

    p.setValue = function (value) {
        this.htmlElement.children[0].value = value;
    };

    p.setEnabled = function (value) {
        var inputElement = this.htmlElement.children[0];
        //inputElement.disabled = !value;
        inputElement.readOnly = !value;
        //this.alpha = value ? 1 : 0.5;
        inputElement.selectionStart = 0;
        inputElement.selectionEnd = 0;
        inputElement.visible = value;
        this.dummyText.visible = !value;
        this.dummyText.text = inputElement.value;
        inputElement.style.visibility = value ? '' : 'hidden';
    };

    sm.HtmlTextBox = htmlTextBox;
}(window));

// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
