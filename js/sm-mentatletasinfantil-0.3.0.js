window.sm = window.sm || {};

window.sm.mentatletasInfantil = window.sm.mentatletasInfantil || {
    gameType: {
        SUMAR6: 0,
        SUMAR9: 1,
        CONSTRUIR6: 2,
        CONSTRUIR9: 3
    },
    buildGameEndType: {
        SUCCESS: 0,
        NOTREACHED_OR_NOTPOSIBLE: 1,
        OVERMATCH: 2
    }
};

(function () {
    var mentatletasInfantil = function (htmlCanvasId, cfg, animationEnd) {
        this.initialize(htmlCanvasId, cfg, animationEnd);
    };
    var p = mentatletasInfantil.prototype = new sm.BaseEngine();
    p.singelton = null;
    p.BaseEngine_initialize = p.initialize;

    p.initialize = function (htmlCanvasId, cfg, animationEnd) {
        this.BaseEngine_initialize(htmlCanvasId, cfg, animationEnd, false);
        p.singelton = this;
        window.mainEngine = this;
        this.setupEnvironment();
        this.disableFade = this.cfg.disableFade;
        this.loaded = false;
        $("#preloadContent").css("background-color", styles.baseColor1);
        $("#preloadText").text(cadenas.cargando);
        ImageManager.loadImages("data/imgs/" + this.cfg.imageSectionKey + ".js", this.cfg.imageSectionKey, null, null);

        //Nos agregamos al stage.
        this.Stage.addChild(this);
    };

    p.stringToFunction = function (str) {
        var arr = str.split(".");
        var fn = (window || this);
        for (var i = 0, len = arr.length; i < len; i++) {
            fn = fn[arr[i]];
        }
        if (typeof fn !== "function") {
            throw new Error("function not found");
        }
        return fn;
    };

    p.BaseEngine_preload = p.preload;
    p.preload = function () {
        createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin]);

        if (!createjs.Sound.isReady()) {
            alert("error");
        }

        var audiosForRegister = [];
        var audioPath = "data/audios/";
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
    };

    p.BaseEngine_handleLoad = p.handleLoad;
    p.handleLoad = function () {
        createjs.Sound.removeAllEventListeners();
        $("#preloadContent").css("background-image", "url('data/imgs/loaded.png')");
        $("#preloadContent").css("cursor", "pointer");
        $("#preloadText").text("");
        window.onresize = p.singelton.onResizeWindow;
        if (p.singelton != null) {
            p.singelton.fadeOut(1000, createjs.proxy(p.singelton.runTimed, p.singelton), p.singelton, document.getElementById("preloadContent"));
        } else {
            this.setupObjects();
        }
        this.running = true;
    };

    p.BaseEngine_setupObjects = p.setupObjects;
    p.setupObjects = function () {
        // Creamos el fondo
        if (this.cfg.backgroundImageId) {
            var imageBkg = ImageManager.getImage(this.cfg.backgroundImageId);
            if (imageBkg != null) {
                this.backGroundImage = new createjs.Bitmap(imageBkg);
                if (this.backGroundImage.image != null && this.backGroundImage.image != undefined) {
                    this.backGroundImage.x = 0;
                    this.backGroundImage.y = 0;
                    this.backGroundImage.height = this.backGroundImage.image.height;
                    this.backGroundImage.width = this.backGroundImage.image.width;
                    this.addChild(this.backGroundImage);
                }
            }
        }

        // Creamos el logo
        var imageLogo = browserDetect.isExplorer ? ImageManager.getAlternativeImage(this.cfg.logo.imageId) : ImageManager.getImage(this.cfg.logo.imageId);
        if (imageLogo != null) {
            this.logo = new createjs.Bitmap(imageLogo);
            if (this.logo.image != null && this.logo.image != undefined) {
                this.logo.x = this.cfg.logo.x;
                this.logo.y = this.cfg.logo.y;
                this.logo.height = this.logo.image.height;
                this.logo.width = this.logo.image.width;
                this.addChild(this.logo);
            }
        }

        // Creamos el header
        this.createHeader();

        // Creamos el popup de ayuda.
        this.helpPopUp = new smInfantil.IFramePopup(this, this.originalWidth - 100, this.originalHeight - 100, this.cfg.header.helpfile, this.onHelpPopUpShow, this.onHelpPopUpHide);
        this.addChild(this.helpPopUp);
        this.helpPopUp.hide();

        // Creamos los men�s y los juegos
        this.mainMenu = new sm.mentatletasInfantil.MainMenu(this.cfg.mainMenu, this);
        this.addTo6Menu = new sm.mentatletasInfantil.AddToMenu(this.cfg.addTo6Menu, this);
        this.addTo9Menu = new sm.mentatletasInfantil.AddToMenu(this.cfg.addTo9Menu, this);
        this.buildTo6Menu = new sm.mentatletasInfantil.BuildToMenu(this.cfg.buildTo6Menu, this);
        this.buildTo9Menu = new sm.mentatletasInfantil.BuildToMenu(this.cfg.buildTo9Menu, this);
        this.waitScreen = new sm.mentatletasInfantil.WaitScreen(this.cfg.waitScreen, this);
        this.anzanGame = new sm.mentatletasInfantil.AnzanGame(this.cfg.anzanGame, this);
        this.buildGame = new sm.mentatletasInfantil.BuildGame(this.cfg.buildGame, this);

        // Animaci�n final
        if (this.animationEnd != null && this.animationEnd != undefined) {
            this.animationEnd.width = this.originalWidth;
            this.animationEnd.height = this.originalHeight;
        }

        this.BaseEngine_setupObjects();

        this.resizeCanvas();
    };

    p.createHeader = function() {
        this.header = new createjs.Container();

        this.helpButton = new smInfantil.AyudaButton(createjs.proxy(this.onHelpClick, this));

        this.title = new createjs.Text(this.cfg.header.title.text, this.cfg.header.title.font, this.cfg.header.title.mainColor);
        this.title.x = this.cfg.header.title.leftMargin;
        this.title.textBaseline = "middle";
        this.title.y = this.cfg.header.height / 2;
        var shapeWidth = this.cfg.header.width;

        this.helpButton.x = shapeWidth - (this.helpButton.width / 2);
        this.helpButton.y = 0;
        this.helpButton.helpFile = this.cfg.header.helpfile;

        this.header.shape = new createjs.Shape();
        this.header.shape.graphics.beginFill("#F18A01")
            .drawRect(0, 0, shapeWidth, this.helpButton.height)
            .drawCircle(shapeWidth, this.helpButton.height / 2, this.helpButton.width / 2);

        this.header.lengueta = new createjs.Container();
        this.header.lengueta.width = shapeWidth;
        this.header.lengueta.shape = new createjs.Shape();
        this.header.lengueta.shape.graphics.beginFill("#FBCC92")
            .drawRect(0, 0, shapeWidth, this.helpButton.height)
            .drawCircle(shapeWidth, this.helpButton.height / 2, this.helpButton.width / 2);
        this.header.lengueta.addChild(this.header.lengueta.shape);

        this.header.lengueta.title = new createjs.Text("", this.cfg.header.title.font, this.cfg.header.title.submenuColor);
        this.header.lengueta.title.x = this.cfg.header.title.leftMargin + this.helpButton.width / 2;
        this.header.lengueta.title.textBaseline = "middle";
        this.header.lengueta.title.y = this.cfg.header.height / 2;
        this.header.lengueta.addChild(this.header.lengueta.title);

        this.header.lengueta.icon = new createjs.Bitmap(null);
        this.header.lengueta.icon.x = shapeWidth - (this.helpButton.width / 2);
        this.header.lengueta.addChild(this.header.lengueta.icon);

        this.header.addChild(this.header.lengueta);
        this.header.addChild(this.header.shape);
        this.header.addChild(this.title);
        this.header.addChild(this.helpButton);

        this.header.openSlide = function (time, size) {
            createjs.Tween.removeTweens(this.lengueta);
            this.lengueta.x = 0;
            if (this.lengueta.x === 0) {
                createjs.Tween.get(this.lengueta).to({ x: size }, time);
            }
        }
        this.header.closeSlide = function (time) {
            if (this.lengueta.x > 0) {
                createjs.Tween.get(this.lengueta).to({ x: 0 }, time);
            }
        }
        this.addChild(this.header);
    };

    p.BaseEngine_onReset = p.onReset;
    p.onReset = function () {

    };

    p.BaseEngine_run = p.run;
    p.run = function () {
        this.resizePreload();
        window.onresize = createjs.proxy(this.resizePreload, this);
        this.Stage = this.getStage();
        this.preload();
    };

    p.showLoadingScreen = function() {
        $("#preloadContent").css("display", "block");
        $("#preloadContent").css("opacity", "1");
        $("#mainContent").css("display", "none");
    };

    p.hideLoadingScreen = function () {
        $("#preloadContent").css("display", "none");
        $("#preloadContent").css("opacity", "0");
        $("#mainContent").css("display", "block");
    };

    p.runTimed = function () {
        this.hideLoadingScreen();
        document.body.style.width = '960px';
        this.setupObjects();
        this.mainMenu.show(500);
        this.fadeIn(1000, createjs.proxy(this.start, this), this);
    };

    p.start = function () {
    };

    p.BaseEngine_stop = p.stop;
    p.stop = function () {
        this.running = false;
    };

    p.BaseEngine_tick = p.tick;
    p.tick = function () {
        p.singelton.Stage.update();
        p.singelton.BaseEngine_tick();
        if (p.singelton.helpPopUp) {
            p.singelton.helpPopUp.iframe.style.transform = "";
        }
    };

    p.resizePreload = function() {
        var factorW = window.innerWidth / this.originalWidth;
        var factorH = window.innerHeight / this.originalHeight;
        switch (this.cfg.sizeMode) {
            case 0:
                // Tama�o original. 
                break;
            case 1:
                // FullScreen manteniendo proporciones. 
                if (browserDetect.isFirefox) {
                    if (factorW <= factorH) {
                        document.getElementById("preloadContent").style.MozTransform = "scale(" + factorW + ")";
                        document.getElementById("preloadContent").style.MozTransformOrigin = "0 0";
                        document.body.style.width = window.innerWidth + "px";
                    } else {
                        document.getElementById("preloadContent").style.MozTransform = "scale(" + factorH + ")";
                        document.getElementById("preloadContent").style.MozTransformOrigin = "0 0";
                        document.body.style.width = (this.originalWidth * window.innerHeight / this.originalHeight) + "px";
                    }
                    //
                } else {
                    if (factorW <= factorH) {
                        $("#preloadContent").css("zoom", factorW);
                        document.body.style.width = window.innerWidth + "px";
                    } else {
                        $("#preloadContent").css("zoom", factorH);
                        document.body.style.width = (this.originalWidth * window.innerHeight / this.originalHeight) + "px";
                    }
                }
                break;
            case 2:
                // FullScreen ajustando a pantalla. 
                if (browserDetect.isFirefox) {
                    document.getElementById('preloadContent').style.MozTransform = "scale(" + factorW + ")";
                } else {
                    $("#preloadContent").css("zoom", factorW);
                    $("#preloadContent").css("zoom", factorH);
                }
                document.body.style.width = window.innerWidth + "px";
                document.body.style.height = window.innerHeight + "px";
                break;
        }
    };

    p.BaseEngine_onResizeWindow = p.onResizeWindow;
    p.onResizeWindow = function () {
        if (p.singelton != null) {
            p.singelton.resizeCanvas();
            p.singelton.resizeiframe();
        }
    };

    p.resizeiframe = function () {
        if (this.helpPopUp) {
            var iframe = this.helpPopUp.iframe;
            var shapeBkg = this.helpPopUp.popupBkgShape;
            iframe.style.transform = "";
            iframe.style.left = (this.Stage.canvas.offsetLeft + (shapeBkg.x * globalScaleX + 50 * globalScaleX)) + "px";
            iframe.style.top = (this.Stage.canvas.offsetTop + (shapeBkg.y * globalScaleY + 70 * globalScaleY)) + "px";
            iframe.style.width = (shapeBkg.width * globalScaleX - 100 * globalScaleX) + "px";
            iframe.style.height = (shapeBkg.height * globalScaleY - 100 * globalScaleX) + "px";
        }
    };

    p.BaseEngine_rescaleElements = p.rescaleElements;
    p.rescaleElements = function () {
        this.BaseEngine_rescaleElements();
        this.resizeiframe();
    };

    p.BaseEngine_getSingelton = p.getSingelton;
    p.getSingelton = function () {
        return p.singelton;
    };

    p.samePositions = function(arrayTest) {
        if (arrayTest.length < 2) return false;
        for (var i = 0; i < arrayTest.length - 1; i++) {
            for (var j = i + 1; j < arrayTest.length; j++) {
                if (this.elementInSamePosition(arrayTest[i], arrayTest[j])) {
                    return true;
                }
            }
        }
        return false;
    };

    p.elementInSamePosition = function(array1, array2) {
        // Asumimos que las longitudes de ambos arrays son iguales.
        for (var i = 0; i < array1.length; i++) {
            if (array1[i] === array2[i]) {
                return true;
            }
        }
        return false;
    };
    
    p.onHelpClick = function () {
        this.addChild(this.helpPopUp);
        this.helpPopUp.show();
    };

    p.onHelpPopUpShow = function() {
        if (this.mainMenu) {
            this.mainMenu.mouseEnabled = false;
        }
        if (this.menuGame) {
            this.menuGame.mouseEnabled = false;
        }
    };

    p.onHelpPopUpHide = function () {
        if (this.mainMenu) {
            this.mainMenu.mouseEnabled = true;
        }
        if (this.menuGame) {
            this.menuGame.mouseEnabled = true;
        }
    };

    p.doMainMenuOption = function (gameType) {
        this.menuGame = null;
        switch (gameType) {
            case sm.mentatletasInfantil.gameType.SUMAR6:
                this.menuGame = this.addTo6Menu;
                break;
            case sm.mentatletasInfantil.gameType.SUMAR9:
                this.menuGame = this.addTo9Menu;
                break;
            case sm.mentatletasInfantil.gameType.CONSTRUIR6:
                this.menuGame = this.buildTo6Menu;
                break;
            case sm.mentatletasInfantil.gameType.CONSTRUIR9:
                this.menuGame = this.buildTo9Menu;
                break;
        }
        this.header.lengueta.title.text = this.menuGame.cfg.title.text.replaceAll("\n", " ");
        this.header.lengueta.title.x = this.menuGame.cfg.title.x;
        this.header.lengueta.icon.image = ImageManager.getImage(this.menuGame.cfg.title.iconImageId);
        this.mainMenu.hide(250);
        this.menuGame.show(1000);
        this.addChild(this.header);
        this.header.openSlide(500, this.menuGame.cfg.title.width);
    };

    p.BaseEngine_onRepeatScene = p.onRepeatScene;
    p.onRepeatScene = function () {
        var engine = this.engines[this.activeIndex];
        if (this.animationEnd != null) {
            this.animationEnd.stop();
            this.removeChild(this.animationEnd);
        }
        this.removeChild(engine.getRepeatButton());
        this.reset();
    };

    sm.MentatletasInfantil = mentatletasInfantil;
}(window));

(function () {
    var mainMenu = function (cfg, owner) {
        this.initialize(cfg, owner);
    };

    var p = mainMenu.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (cfg, owner) {
        this.Container_initialize();
        this.name = "menuNumPlayers";
        this.owner = owner;
        this.cfg = cfg;
        this.setupObjects();
    };

    p.setupObjects = function () {
        if (this.cfg.backgroundImageId) {
            var imageBkg = ImageManager.getImage(this.cfg.backgroundImageId);
            if (imageBkg != null) {
                this.backGroundImage = new createjs.Bitmap(imageBkg);
                if (this.backGroundImage.image != null && this.backGroundImage.image != undefined) {
                    this.backGroundImage.x = 0;
                    this.backGroundImage.y = 0;
                    this.backGroundImage.height = this.backGroundImage.image.height;
                    this.backGroundImage.width = this.backGroundImage.image.width;
                    this.addChild(this.backGroundImage);
                }
            }
        }

        this.buttons = [];
        for (var indexButton in this.cfg.buttons) {
            var buttonDef = this.cfg.buttons[indexButton];
            var imageBtn = ImageManager.getImage(buttonDef.imageId);
            var button = new createjs.Container();
            button.x = buttonDef.x;
            button.y = buttonDef.y;
            button.enabled = true;
            button.cursor = "pointer";
            button.on("click", createjs.proxy(this.onButtonClick, this));

            button.image = new createjs.Bitmap(imageBtn);
            button.addChild(button.image);

            button.label = new createjs.Text(buttonDef.label.text, buttonDef.label.font, buttonDef.label.color);
            button.label.x = buttonDef.label.offsetX;
            button.label.y = buttonDef.label.offsetY;
            button.label.textAlign = buttonDef.label.align;
            button.label.lineHeight = buttonDef.label.lineHeight;
            button.image.gameType = buttonDef.gameType;
            button.label.gameType = buttonDef.gameType;
            button.gameType = buttonDef.gameType;
            button.addChild(button.label);

            this.addChild(button);
            this.buttons.push(button);
        }
    };

    p.onButtonClick = function(e) {
        createjs.proxy(this.owner.doMainMenuOption, this.owner, e.currentTarget.gameType).call();
    };

    p.show = function (time) {
        this.alpha = 0;
        this.owner.helpButton.setEnabled(true);
        this.owner.helpButton.visible = true;
        this.owner.addChild(this);
        createjs.Tween.get(this).to({ alpha: 1 }, time);
    };

    p.hide = function (time) {
        createjs.Tween.get(this).to({ alpha: 0 }, time).call(this.removeThis);
    };

    p.removeThis = function() {
        this.owner.removeChild(this);
    };

    sm.mentatletasInfantil.MainMenu = mainMenu;
}(window));

(function () {
    var addToMenu = function (cfg, owner) {
        this.initialize(cfg, owner);
    };

    var p = addToMenu.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (cfg, owner) {
        this.Container_initialize();
        this.owner = owner;
        this.cfg = cfg;
        this.maxNumber = this.cfg.maxNumber;
        this.setupObjects();
    };

    p.setupObjects = function () {
        if (this.cfg.setNumbers) {
            var setNumbersDef = this.cfg.setNumbers;
            this.setNumbersObject = new createjs.Container();
            this.setNumbersObject.x = setNumbersDef.x;
            this.setNumbersObject.y = setNumbersDef.y;
            this.setNumbersObject.enabled = true;
            this.setNumbersObject.cursor = "pointer";
            // Imagen
            var imageSetNumbers = ImageManager.getImage(setNumbersDef.imageId);
            this.setNumbersObject.image = new createjs.Bitmap(imageSetNumbers);
            this.setNumbersObject.addChild(this.setNumbersObject.image);
            // Label
            this.setNumbersObject.label = new createjs.Text(setNumbersDef.label.text, setNumbersDef.label.font, setNumbersDef.label.color);
            this.setNumbersObject.label.x = setNumbersDef.label.offsetX;
            this.setNumbersObject.label.y = setNumbersDef.label.offsetY;
            this.setNumbersObject.label.textAlign = setNumbersDef.label.align;
            this.setNumbersObject.addChild(this.setNumbersObject.label);
            // Value
            this.setNumbersObject.value = new createjs.Text(setNumbersDef.value.initialValue, setNumbersDef.value.font, setNumbersDef.value.color);
            this.setNumbersObject.value.x = setNumbersDef.value.offsetX;
            this.setNumbersObject.value.y = setNumbersDef.value.offsetY;
            this.setNumbersObject.value.textAlign = "center";
            this.setNumbersObject.addChild(this.setNumbersObject.value);
            // Bot�n
            //this.setNumbersObject.button = new smInfantil.TecladoButton(createjs.proxy(this.onButtonSetNumbersClick, this));
            //this.setNumbersObject.button.x = setNumbersDef.button.offsetX;
            //this.setNumbersObject.button.y = setNumbersDef.button.offsetY;
            //this.setNumbersObject.addChild(this.setNumbersObject.button);
            this.setNumbersObject.on("click", createjs.proxy(this.onButtonSetNumbersClick, this));
            this.addChild(this.setNumbersObject);
        }
        if (this.cfg.setTime) {
            var setTimeDef = this.cfg.setTime;
            this.setTimeObject = new createjs.Container();
            this.setTimeObject.x = setTimeDef.x;
            this.setTimeObject.y = setTimeDef.y;
            this.setTimeObject.enabled = true;
            this.setTimeObject.cursor = "pointer";
            // Imagen
            var imageSetTime = ImageManager.getImage(setTimeDef.imageId);
            this.setTimeObject.image = new createjs.Bitmap(imageSetTime);
            this.setTimeObject.addChild(this.setTimeObject.image);
            // Label
            this.setTimeObject.label = new createjs.Text(setTimeDef.label.text, setTimeDef.label.font, setTimeDef.label.color);
            this.setTimeObject.label.x = setTimeDef.label.offsetX;
            this.setTimeObject.label.y = setTimeDef.label.offsetY;
            this.setTimeObject.label.textAlign = setTimeDef.label.align;
            this.setTimeObject.addChild(this.setTimeObject.label);
            // Value
            this.setTimeObject.value = new createjs.Text(setTimeDef.value.initialValue /*+ "s"*/, setTimeDef.value.font, setTimeDef.value.color);
            this.setTimeObject.value.x = setTimeDef.value.offsetX;
            this.setTimeObject.value.y = setTimeDef.value.offsetY;
            this.setTimeObject.value.textAlign = "center";
            this.setTimeObject.addChild(this.setTimeObject.value);
            // Bot�n
            //this.setTimeObject.button = new smInfantil.TecladoButton(createjs.proxy(this.onButtonSetTimeClick, this));
            //this.setTimeObject.button.x = setTimeDef.button.offsetX;
            //this.setTimeObject.button.y = setTimeDef.button.offsetY;
            //this.setTimeObject.addChild(this.setTimeObject.button);
            this.setTimeObject.on("click", createjs.proxy(this.onButtonSetTimeClick, this));
            this.addChild(this.setTimeObject);
        }

        this.avatarImage = ImageManager.getImage(this.cfg.avatarImageId);
        
        this.winChangeValue1 = this.createWinValues(cadenas.sumarCantidadNumeros, ["2", "3", "4"], 450, this.closeWinChangeNumbersValue);
        this.addChild(this.winChangeValue1);
        this.winChangeValue1.hide();
        this.numNumbers = 2;

        this.winChangeValue2 = this.createWinValues(cadenas.sumarTiempoExposicion, ["3", "2", "1", "0,5"], 500, this.closeWinChangeTimeValue);
        this.addChild(this.winChangeValue2);
        this.winChangeValue2.hide();
        this.timeInterval = 3000;

        this.footer = new sm.FooterTool(this.owner.originalWidth, 0, this.owner.originalHeight - styles.footerSM.height);
        // Bot�n atr�s
        this.backButton = new smInfantil.BackButton(createjs.proxy(this.onButtonBackClick, this));
        this.backButton.x = this.owner.originalWidth / 2 - this.backButton.width - this.backButton.width / 2;
        this.backButton.y = 0;
        this.footer.addChild(this.backButton);
        // Bot�n atr�s
        this.nextButton = new smInfantil.NextButton(createjs.proxy(this.onButtonNextClick, this));
        this.nextButton.x = this.owner.originalWidth / 2 + this.nextButton.width / 2;
        this.nextButton.y = 0;
        this.footer.addChild(this.nextButton);
        this.addChild(this.footer);
    };

    p.onButtonSetNumbersClick = function () {
        if (this.setNumbersObject.enabled === false) return;
        this.owner.helpButton.setEnabled(false);
        this.backButton.setEnabled(false);
        this.nextButton.setEnabled(false);
        this.winChangeValue1.show();
    };

    p.onButtonSetTimeClick = function () {
        if (this.setTimeObject.enabled === false) return;
        this.owner.helpButton.setEnabled(false);
        this.backButton.setEnabled(false);
        this.nextButton.setEnabled(false);
        this.winChangeValue2.show();
    };

    p.closeWinChangeNumbersValue = function (value) {
        this.owner.helpButton.setEnabled(true);
        this.backButton.setEnabled(true);
        this.nextButton.setEnabled(true);
        this.setNumbersObject.value.text = value;
        this.numNumbers = parseInt(value, 10);
    };

    p.closeWinChangeTimeValue = function (value) {
        this.owner.helpButton.setEnabled(true);
        this.backButton.setEnabled(true);
        this.nextButton.setEnabled(true);
        this.setTimeObject.value.text = value;// + "s";
        this.timeInterval = parseFloat(value.replace(",", ".")) * 1000;
    };

    p.onButtonBackClick = function () {
        this.hide(250);
        this.owner.mainMenu.show(250);
        this.owner.header.closeSlide(500);
    };

    p.onButtonNextClick = function () {
        this.owner.helpButton.setEnabled(false);
        this.owner.helpButton.visible = false;
        this.hide(250);
        this.owner.waitScreen.show(100, createjs.proxy(this.startGame, this));
        this.addChild(this.header);
    };

    p.startGame = function () {
        this.owner.waitScreen.hide(250);
        this.owner.anzanGame.show(250, this.cfg.avatar, this.maxNumber, this.numNumbers, this.timeInterval);
    };

    p.show = function (time) {
        this.alpha = 0;
        this.owner.playAudio(this.cfg.introSound);
        this.owner.helpButton.setEnabled(true);
        this.owner.helpButton.visible = true;
        this.owner.addChild(this);
        createjs.Tween.get(this).to({ alpha: 1 }, time);
    };

    p.hide = function (time) {
        createjs.Tween.get(this).to({ alpha: 0 }, time).call(this.removeThis);
    };

    p.removeThis = function () {
        this.owner.removeChild(this);
    };

    p.createWinValues = function (titleText, values, winWidth, callbackOnClose) {
        var title = new createjs.Text(titleText, "bold 40px Arial", "#000080");
        title.x = winWidth / 2;
        title.y = 20;
        title.textAlign = "center";
        title.lineWidth = winWidth - 50;

        var winHeight = 60 * (values.length + 1) + title.getMeasuredHeight() + 80;

        var callbackShow = function() {
            if (this.setNumbersObject) {
                this.setNumbersObject.enabled = false;
                this.setNumbersObject.cursor = "default";
                //this.setNumbersObject.button.setEnabled(false);
            }
            if (this.setTimeObject) {
                this.setTimeObject.enabled = false;
                this.setTimeObject.cursor = "default";
                //this.setTimeObject.button.setEnabled(false);
            }
        }

        var callbackHide = function (win, result, e) {
            if (this.setNumbersObject) {
                this.setNumbersObject.enabled = true;
                this.setNumbersObject.cursor = "pointer";
                //this.setNumbersObject.button.setEnabled(true);
            }
            if (this.setTimeObject) {
                this.setTimeObject.enabled = true;
                this.setTimeObject.cursor = "pointer";
                //this.setTimeObject.button.setEnabled(true);
            }
            if (result === true) {
                var selectedValue = win.getSelectedValue();
                createjs.proxy(e, this, selectedValue).call();
            }
        };

        var winValues = new smInfantil.PopupWindow(this.owner, winWidth, winHeight, true, false, createjs.proxy(callbackShow, this), createjs.proxy(callbackHide, this, callbackOnClose));

        winValues.addElement(title);

        (function (target) {
            target.onChechedItem = function (chkbox) {
                for (var indexChk = 0; indexChk < target.chkValues.length; indexChk++) {
                    target.chkValues[indexChk].setChecked(target.chkValues[indexChk] == chkbox);
                }
            };

            target.getSelectedValue = function () {
                for (var indexChk = 0; indexChk < target.chkValues.length; indexChk++) {
                    if (target.chkValues[indexChk].checked) {
                        return target.chkValues[indexChk].title.text;
                    }
                }
                return 0;
            };

            target.setSelectedValue = function (val) {
                for (var indexChk = 0; indexChk < target.chkValues.length; indexChk++) {
                    var textoCheck = target.chkValues[indexChk].title.text.toString().replace(new RegExp("[ ]", "g"), "").toLowerCase();
                    target.chkValues[indexChk].setChecked(textoCheck == val.toString().toLowerCase());
                }
                return 0;
            };
        })(winValues);

        winValues.chkValues = [];
        var offsetY = 90;
        var maxWidthChk = 0;
        var i;
        for (i = 0; i < values.length; i++) {
            var chk = new sm.CheckBox(10, offsetY, 0, winValues.onChechedItem, 0, false);
            chk.setText(values[i]);
            chk.title.font = "bold 40px Arial";
            chk.title.y = 5;
            winValues.addElement(chk);
            winValues.chkValues.push(chk);
            offsetY += 60;
            maxWidthChk = Math.max(maxWidthChk, chk.title.getMeasuredWidth());
        }
        for (i = 0; i < values.length; i++) {
            winValues.chkValues[i].x = winValues.width / 2 - maxWidthChk / 2 - 16;
        }
        winValues.chkValues[0].setChecked(true);

        return winValues;
    };

    sm.mentatletasInfantil.AddToMenu = addToMenu;
}(window));

(function () {
    var buildToMenu = function (cfg, owner) {
        this.initialize(cfg, owner);
    };

    var p = buildToMenu.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (cfg, owner) {
        this.Container_initialize();
        this.owner = owner;
        this.cfg = cfg;
        this.minNumber = this.cfg.minNumber;
        this.maxNumber = this.cfg.maxNumber;
        this.setupObjects();
    };

    p.setupObjects = function () {
    };

    p.onButtonBackClick = function () {
        this.hide(250);
        this.owner.mainMenu.show(250);
        this.owner.header.closeSlide(500);
    };

    p.onButtonNextClick = function () {
    };

    p.show = function (time) {
        // Este men� es ficticio ya que no existe como tal, pero se mantiene por futuro.. ahora lanza directamente el juego.
        this.owner.playAudio(this.cfg.introSound);
        this.owner.helpButton.setEnabled(false);
        this.owner.helpButton.visible = false;
        this.owner.buildGame.show(time, this.cfg.avatar, this.minNumber, this.maxNumber);
    };

    p.hide = function (time) {
        this.owner.buildGame.hide(time);
    };

    p.removeThis = function () {
        this.owner.removeChild(this);
    };

    sm.mentatletasInfantil.BuildToMenu = buildToMenu;
}(window));

(function () {
    var waitScreen = function (cfg, owner) {
        this.initialize(cfg, owner);
    };

    var p = waitScreen.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (cfg, owner) {
        this.Container_initialize();
        this.owner = owner;
        this.cfg = cfg;
        this.onEndWait = null;
        this.setupObjects();
    };

    p.setupObjects = function () {
        this.cronometro = this.paintCronometro();
        this.cronometro.x = this.owner.originalWidth / 2;
        this.cronometro.y = this.owner.originalHeight / 2;
        this.addChild(this.cronometro);
    };

    p.paintCronometro = function () {
        var cronometro = new createjs.Container();
        cronometro.name = "Cronometro";
        var fondo = new createjs.Shape();
        fondo.graphics.setStrokeStyle(4).beginStroke("#C0C0C0").beginFill("#EBEBEB").drawCircle(0, 0, 120);
        fondo.shadow = new createjs.Shadow("#434141", 0, 0, 20);
        cronometro.addChild(fondo);

        var fondo2 = new createjs.Shape();
        fondo2.graphics.setStrokeStyle(3).beginStroke("#C2C2C2").drawCircle(0, 0, 110); //"#C2C2C2"
        fondo2.shadow = new createjs.Shadow("#FFFFFF", 0, 0, 5);
        cronometro.addChild(fondo2);

        //DEGRADADO
        var fondo3 = new createjs.Shape();
        fondo3.graphics.setStrokeStyle(8).beginLinearGradientStroke(["#DCDCDC", "#C2C2C2"], [0, 1, 4, 4], 0, -45, 0, 45).drawCircle(0, 0, 108);
        cronometro.addChild(fondo3);
        cronometro.horas = [];
        //HORAS
        for (var i = 1; i <= 60; i++) {
            var shpHora = new createjs.Shape();
            shpHora.graphics.beginFill("#000000").drawCircle(0, 0, 4); //"#C2C2C2"
            var ang = Math.PI / 30 * i;
            var sang = Math.sin(ang);
            var cang = Math.cos(ang);
            //If modulus of divide by 5 is zero then draw an hour marker/numeral
            if (i % 15 == 0) {
                var sx = sang * 95;
                var sy = cang * -95;
                shpHora.x = sx;
                shpHora.y = sy;
                cronometro.horas.push(shpHora);
                //cronometro.addChild(shpHora);
                cronometro.addChild(cronometro.horas[cronometro.horas.length - 1]);
            }
        }

        //Agujas
        cronometro.Aguja = new createjs.Shape();
        cronometro.Aguja.graphics.beginFill("#000000").drawCircle(0, 0, 8); //"#C2C2C2"
        cronometro.Aguja.x = 0;
        cronometro.Aguja.y = 0;
        cronometro.addChild(cronometro.Aguja);

        cronometro.Aguja2 = new createjs.Shape();
        cronometro.Aguja2.graphics.beginFill("#000000").drawRect(0, 0, 4, -80); //"#C2C2C2"
        cronometro.Aguja2.x = -2;
        cronometro.Aguja2.y = 0;
        cronometro.addChild(cronometro.Aguja2);

        return (cronometro);
    };

    p.show = function (time, onEndWait) {
        this.onEndWait = onEndWait;
        this.alpha = 0;
        this.waitSeconds = 40;
        this.waitAng = 0;
        this.cronometro.removeChild(this.tiempoShp);
        this.owner.addChild(this);
        createjs.Tween.get(this).to({ alpha: 1 }, time).call(this.startCronometro);
    };

    p.hide = function (time) {
        createjs.Tween.get(this).to({ alpha: 0 }, time).call(this.removeThis);
    };

    p.startCronometro = function () {
        this.timerId = setInterval(createjs.proxy(this.tickCronometro, this), 100);
    };

    p.tickCronometro = function() {
        if (this.waitSeconds > 5) {
            if (this.waitAng <= 360) {
                this.updateCronometro(this.waitAng);
                this.waitAng = this.waitAng + 12;
            }
            this.visible = true;
            this.waitSeconds--;
            if ((this.waitSeconds == 33) || (this.waitSeconds == 26) || (this.waitSeconds == 17) || (this.waitSeconds == 10)) {
                this.owner.playAudio(this.cfg.clockAudio);
            }
        }
        else {
            clearInterval(this.timerId);
            this.waitSeconds = 40;
            this.waitAng = 0;
            this.removeChild(this.waitScreen);
            if (this.onEndWait) {
                this.onEndWait();
            }
        }
    };

    p.updateCronometro = function (ang) {
        var cronometro = this.cronometro;
        if (cronometro.getChildByName("tiempo") != undefined) {
            cronometro.removeChild(cronometro.getChildByName("tiempo"));
        }
        cronometro.removeChild(this.tiempoShp);
        this.tiempoShp = new createjs.Shape(this.drawtiempo(0, 0, 0, ang, 100, 0));
        this.tiempoShp.name = "tiempo";
        this.tiempoShp.alpha = 0.8;
        cronometro.addChild(this.tiempoShp);
        cronometro.addChild(cronometro.Aguja);
        cronometro.addChild(cronometro.Aguja2);
        cronometro.Aguja2.rotation = ang;
        for (var i = 0; i <= 12; i++) {
            cronometro.addChild(cronometro.horas[i]);
        }
    };

    p.drawtiempo = function (quesitox, quesitoy, startAngle, endAngle, radius1, radius2) {
        var g = new createjs.Graphics();
        if (endAngle < 120)
            g.beginFill("#FADF9E").arc(quesitox, quesitoy, radius1, toRad(startAngle), toRad(endAngle));
        else {
            if (endAngle < 240)
                g.beginFill("#FEB301").arc(quesitox, quesitoy, radius1, toRad(startAngle), toRad(endAngle));
            else
                if (endAngle < 360)
                    g.beginFill("#FD8606").arc(quesitox, quesitoy, radius1, toRad(startAngle), toRad(endAngle));
                else
                    g.beginFill("#FD5206").arc(quesitox, quesitoy, radius1, toRad(startAngle), toRad(endAngle));
        }
        g.lineTo(quesitox + Math.cos(toRad(endAngle)) * radius2, quesitoy + Math.sin(toRad(endAngle)) * radius2);
        g.arc(quesitox, quesitoy, radius2, toRad(endAngle), toRad(startAngle), true);
        g.closePath();
        g.endFill();

        return g;

        function toRad(angle) {
            return (angle - 90) * Math.PI / 180;
        }
    };

    p.removeThis = function () {
        this.owner.removeChild(this);
    };

    sm.mentatletasInfantil.WaitScreen = waitScreen;
}(window));

(function () {
    var anzanGame = function (cfg, owner) {
        this.initialize(cfg, owner);
    };

    var p = anzanGame.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (cfg, owner) {
        this.Container_initialize();
        this.owner = owner;
        this.cfg = cfg;
        this.setupObjects();
    };

    p.setupObjects = function () {
        this.areaNumbers = new createjs.Container();
        this.areaNumbers.width = this.cfg.areaNumbers.width;
        this.areaNumbers.height = this.cfg.areaNumbers.height;
        this.areaNumbers.x = this.owner.originalWidth / 2 - this.areaNumbers.width / 2;
        this.areaNumbers.y = this.owner.originalHeight / 2 - this.areaNumbers.height / 2;

        this.areaNumbers.areaBkg = new createjs.Shape();
        this.areaNumbers.areaBkg.graphics.beginFill(this.cfg.areaNumbers.backColor).drawRoundRect(0, 0, this.cfg.areaNumbers.width, this.cfg.areaNumbers.height, this.cfg.areaNumbers.round);
        this.areaNumbers.addChild(this.areaNumbers.areaBkg);

        this.areaNumbers.number = new createjs.Text("", this.cfg.areaNumbers.font, this.cfg.areaNumbers.foreColor);
        this.areaNumbers.number.x = this.areaNumbers.width / 2;
        this.areaNumbers.number.y = this.areaNumbers.height / 2;
        this.areaNumbers.number.textAlign = "center";
        this.areaNumbers.number.textBaseline = "middle";
        this.areaNumbers.addChild(this.areaNumbers.number);

        this.generateKeyboard(this.cfg.keyboard);

        this.avatar = new createjs.Bitmap();

        // �rea de intoducir resultado.
        this.boxIntroResult = new createjs.Container();
        this.boxIntroResult.box = new createjs.Bitmap(ImageManager.getImage(this.cfg.introResult.box.imageId));
        this.boxIntroResult.box.x = this.cfg.introResult.box.x;
        this.boxIntroResult.box.y = this.cfg.introResult.box.y;

        this.boxIntroResult.title = new createjs.Text(this.cfg.introResult.title.text, this.cfg.introResult.title.font, this.cfg.introResult.title.color);
        this.boxIntroResult.title.x = this.cfg.introResult.title.x;
        this.boxIntroResult.title.y = this.cfg.introResult.title.y;
        this.boxIntroResult.title.textAlign = this.cfg.introResult.title.align;

        this.boxIntroResult.result = new createjs.Text("", this.cfg.introResult.result.font, this.cfg.introResult.result.color);
        this.boxIntroResult.result.x = this.cfg.introResult.result.x;
        this.boxIntroResult.result.y = this.cfg.introResult.result.y;
        this.boxIntroResult.result.textAlign = this.cfg.introResult.result.align;

        this.boxIntroResult.addChild(this.boxIntroResult.box);
        this.boxIntroResult.addChild(this.boxIntroResult.title);
        this.boxIntroResult.addChild(this.boxIntroResult.result);

        // �rea de resultado correcto.
        this.boxCorrectResult = new createjs.Container();
        this.boxCorrectResult.box = new createjs.Bitmap(ImageManager.getImage(this.cfg.correctResult.box.imageId));
        this.boxCorrectResult.box.x = this.cfg.correctResult.box.x;
        this.boxCorrectResult.box.y = this.cfg.correctResult.box.y;

        this.boxCorrectResult.title = new createjs.Text(this.cfg.correctResult.title.text, this.cfg.correctResult.title.font, this.cfg.correctResult.title.color);
        this.boxCorrectResult.title.x = this.cfg.correctResult.title.x;
        this.boxCorrectResult.title.y = this.cfg.correctResult.title.y;
        this.boxCorrectResult.title.textAlign = this.cfg.correctResult.title.align;

        this.boxCorrectResult.result = new createjs.Text("", this.cfg.correctResult.result.font, this.cfg.correctResult.result.color);
        this.boxCorrectResult.result.x = this.cfg.correctResult.result.x;
        this.boxCorrectResult.result.y = this.cfg.correctResult.result.y;
        this.boxCorrectResult.result.textAlign = this.cfg.correctResult.result.align;

        this.boxCorrectResult.addChild(this.boxCorrectResult.box);
        this.boxCorrectResult.addChild(this.boxCorrectResult.title);
        this.boxCorrectResult.addChild(this.boxCorrectResult.result);

        // Ventana de verificaci�n de operaci�n.
        this.winNumbers = new smInfantil.PopupWindow(this.owner, this.cfg.winNumbers.width, this.cfg.winNumbers.height, false, true, createjs.proxy(this.onShowWinNumbers, this), createjs.proxy(this.onHideWinNumbers, this));
        this.winNumbers.operation = new createjs.Text("", this.cfg.winNumbers.numbers.font, this.cfg.winNumbers.numbers.color);
        this.winNumbers.operation.x = this.cfg.winNumbers.width / 2;
        this.winNumbers.operation.y = (this.cfg.winNumbers.height) / 2;
        this.winNumbers.operation.textAlign = "center";
        this.winNumbers.operation.textBaseline = "middle";
        this.winNumbers.addElement(this.winNumbers.operation);

        this.footer = new sm.FooterTool(this.owner.originalWidth, 0, this.owner.originalHeight - styles.footerSM.height);
        // Bot�n home
        this.homeButton = new smInfantil.HomeButton(createjs.proxy(this.onHomeButtonClick, this));
        this.homeButton.x = this.owner.originalWidth / 2 - this.homeButton.width / 2;
        this.homeButton.y = 2;
        this.homeButton.setEnabled(false);
        this.footer.addChild(this.homeButton);
        // Bot�n repetir
        this.repeatButton = new smInfantil.RepeatButton(createjs.proxy(this.onRepeatButtonClick, this));
        this.repeatButton.x = this.owner.originalWidth - this.repeatButton.width - 5;
        this.repeatButton.y = 2;
        this.repeatButton.setEnabled(false);
        this.footer.addChild(this.repeatButton);
        // Bot�n mostrar
        this.showNumbersButton = new smInfantil.MostrarButton(createjs.proxy(this.onShowNumbersButtonClick, this));
        this.showNumbersButton.x = this.owner.originalWidth - (this.showNumbersButton.width * 2) - 10;
        this.showNumbersButton.y = 2;
        this.showNumbersButton.setEnabled(false);
        this.footer.addChild(this.showNumbersButton);
    };

    p.generateKeyboard = function(keyboardDef) {
        if (keyboardDef) {
            this.keyboardContainer = new createjs.Container();
            this.keyboardContainer.x = keyboardDef.x;
            this.keyboardContainer.y = keyboardDef.y;
            var keyBoardMargin = 10;

            var keyboardBox = new createjs.Shape();
            var boxWidth = keyboardDef.ncolum * (keyboardDef.sizeKey + 5) + (keyBoardMargin * 2) - 5;
            var boxHeight = 4 * (keyboardDef.sizeKey + 5) + (keyBoardMargin * 2) - 5;
            keyboardBox.graphics.beginFill(this.cfg.keyboard.box.backgroundColor).drawRoundRect(0, 0, boxWidth, boxHeight, this.cfg.keyboard.box.round);

            styles.keyboard.buttonNumeric = this.cfg.keyboard.key;
            styles.keyboard.buttonRoundBorder = this.cfg.keyboard.sizeKey / 2;
            styles.imageRoundButton.borderSize = 2;
            styles.imageRoundButton.backgroundColorHover = this.cfg.keyboard.key.backgroundColorHover;
            var keyboardKeyFontSize = this.cfg.keyboard.sizeKey / 2;
            this.keyboard = new sm.Keyboard(
                keyBoardMargin,
                keyBoardMargin,
                keyboardDef.ncolum,
                keyboardDef.sizeKey,
                keyboardDef.withChars,
                keyboardDef.withNumbers,
                keyboardDef.withSymbols,
                false, false, false,
                createjs.proxy(this.onKeyboardKeyClick, this),
                keyboardDef.chars,
                keyboardDef.numbers,
                keyboardDef.symbols,
                keyboardKeyFontSize);
            
            this.deleteButton = new sm.ImageSquareButton(
                keyBoardMargin + keyboardDef.sizeKey + 5,
                keyBoardMargin + 3 * keyboardDef.sizeKey + 15,
                keyboardDef.sizeKey,
                keyboardDef.sizeKey,
                "left",
                createjs.proxy(this.onDeleteClick, this),
                35,
                this.cfg.keyboard.key.backgroundColor);

            this.correctButton = new smInfantil.OkButton(createjs.proxy(this.onCorrectClick, this));
            this.correctButton.x = keyBoardMargin + (keyboardDef.sizeKey * 2) + 10;
            this.correctButton.y = keyBoardMargin + 3 * keyboardDef.sizeKey + 15;
            this.correctButton.setEnabled(false);

            this.keyboardContainer.addChild(keyboardBox);
            this.keyboardContainer.addChild(this.keyboard);
            this.keyboardContainer.addChild(this.deleteButton);
            this.keyboardContainer.addChild(this.correctButton);
        }
    };

    p.show = function (time, avatar, maxNumber, numNumbers, interval) {
        this.alpha = 0;
        this.avatar.image = ImageManager.getImage(avatar.imageId);
        this.avatar.x = avatar.x;
        this.avatar.y = avatar.y;
        this.maxNumber = maxNumber;
        this.numNumbers = numNumbers;
        this.interval = interval;

        this.homeButton.setEnabled(false);
        this.repeatButton.setEnabled(false);
        this.showNumbersButton.setEnabled(false);
        this.boxIntroResult.result.text = "";
        this.boxIntroResult.result.color = this.cfg.introResult.result.color;
        this.correctButton.setEnabled(false);
        this.removeAllChildren();
        this.boxCorrectResult.removeChild(this.failTick);
        this.addChild(this.areaNumbers);

        this.owner.addChild(this);
        createjs.Tween.get(this).to({ alpha: 1 }, time).call(this.run);
    };

    p.hide = function (time) {
        createjs.Tween.get(this).to({ alpha: 0 }, time).call(this.removeThis);
    };

    p.removeThis = function () {
        this.owner.removeChild(this);
    };

    p.run = function () {
        this.counterNumbers = 0;
        this.numbers = [];
        this.randomMaxNumber = this.maxNumber;
        this.areaNumbers.alpha = 1;
        this.process();
    };

    p.process = function () {
        var number = this.randomInt(0, this.randomMaxNumber / (this.numNumbers / 2));
        // Miramos si el n�mero est� repetido, y si lo est� lo generamos una vez m�s.
        for (var indexNumber in this.numbers) {
            if (number == this.numbers[indexNumber]) {
                number = this.randomInt(0, this.randomMaxNumber);
                break;
            }
        }
        this.numbers.push(number);
        // Calculamos el nuevo m�ximo.
        this.randomMaxNumber = this.randomMaxNumber - number;

        // Establecemos el n�mero obtenido en pantalla.
        this.areaNumbers.number.text = number;
        this.areaNumbers.number.alpha = 0;
        createjs.Tween.get(this.areaNumbers.number).to({ alpha: 1 }, 250);
        // Reproducimos el sonido de bip.
        this.owner.playAudio(this.cfg.numberSound);
        // Incrementamos el contador de n�meros extraidos y comprobamos si hemos mostrado todos los n�meros solicitados.
        this.counterNumbers++;
        if (this.counterNumbers >= this.numNumbers) {
            // Finalizamos el proceso y llamamos a introducir resultado.
            createjs.Tween.get(this.areaNumbers).wait(this.interval).to({ alpha: 0 }, 250).call(createjs.proxy(this.getResponse, this));
        } else {
            // Ejecutamos el proceso en el tiempo de intervalo indicado.
            setTimeout(createjs.proxy(this.process, this), this.interval);
        }
    };

    p.randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    p.getResponse = function() {
        // Realizamos la suma de los n�meros obtenidos.
        this.correctResult = 0;
        for (var indexNumber in this.numbers) {
            var number = this.numbers[indexNumber];
            this.correctResult += number;
        }
        this.addChild(this.footer);

        this.avatar.alpha = 0;
        this.keyboardContainer.alpha = 0;
        this.boxIntroResult.alpha = 0;
        this.addChild(this.avatar);
        this.addChild(this.keyboardContainer);
        this.addChild(this.boxIntroResult);
        createjs.Tween.get(this.avatar).to({ alpha: 1 }, 250)
            .call(createjs.proxy(function() {
                createjs.Tween.get(this.keyboardContainer).to({ alpha: 1 }, 500);
                createjs.Tween.get(this.boxIntroResult).to({ alpha: 1 }, 500);
            }, this));

    };

    p.onKeyboardKeyClick = function (key) {
        this.boxIntroResult.result.text = key.code;
        this.correctButton.setEnabled(true);
    };

    p.onDeleteClick = function () {
        this.boxIntroResult.result.text = "";
        this.correctButton.setEnabled(false);
    };

    p.onCorrectClick = function () {
        this.boxCorrectResult.alpha = 0;
        this.boxCorrectResult.result.text = this.correctResult;
        this.addChild(this.boxCorrectResult);
        createjs.Tween.get(this.keyboardContainer).to({ alpha: 0 }, 250)
            .call(createjs.proxy(function () {
                createjs.Tween.get(this.boxCorrectResult).to({ alpha: 1 }, 500).call(createjs.proxy(this.doEnd, this));
            }, this));
    };

    p.doEnd = function() {
        var responseValue = parseInt(this.boxIntroResult.result.text, 10);
        if (responseValue === this.correctResult) {
            this.boxIntroResult.result.color = "#008000";
            this.owner.playAudio(audios.muyBien, function () { this.owner.playAudio(this.cfg.susscessSound); }, this);
            this.removeChild(this.owner.animationEnd);
            this.addChild(this.owner.animationEnd);
            this.addChild(this.footer);
            this.showNumbersButton.setEnabled(true);
            this.owner.animationEnd.run(this.onFinishAnimation);
        } else {
            this.boxIntroResult.result.color = "#800000";
            this.owner.playAudio(this.cfg.failSound);
            if (this.cfg.introResult.failTick.imageId) {
                this.failTick = new createjs.Bitmap(ImageManager.getImage(this.cfg.introResult.failTick.imageId));
                this.failTick.x = this.cfg.introResult.failTick.x;
                this.failTick.y = this.cfg.introResult.failTick.y;
                this.boxCorrectResult.addChild(this.failTick);
            } else {
                this.failTick = new createjs.Shape();
                var x1 = this.cfg.introResult.failTick.x;
                var y1 = this.cfg.introResult.failTick.y;
                var x2 = this.cfg.introResult.failTick.x + this.cfg.introResult.failTick.width;
                var y2 = this.cfg.introResult.failTick.y + this.cfg.introResult.failTick.height;
                this.failTick.graphics.setStrokeStyle(this.cfg.introResult.failTick.size).beginStroke("#FF0000").moveTo(x1, y1).lineTo(x2, y2).moveTo(x1, y2).lineTo(x2, y1);
                this.boxCorrectResult.addChild(this.failTick);
            }
            this.showNumbersButton.setEnabled(true);
        }
        this.homeButton.setEnabled(true);
        this.repeatButton.setEnabled(true);
    };

    p.onHomeButtonClick = function() {
        this.hide(250);
        this.owner.mainMenu.show(250);
        this.owner.header.closeSlide(500);
        this.owner.stopAudio();
    };

    p.onRepeatButtonClick = function () {
        this.hide(250);
        this.owner.menuGame.show(1000);
        this.owner.stopAudio();
    };

    p.onShowNumbersButtonClick = function () {
        var operation = "";
        for (var indexNumber in this.numbers) {
            var number = this.numbers[indexNumber];
            operation += number + (indexNumber < this.numbers.length - 1 ? " + " : " = ");
        }
        operation += this.correctResult;
        this.winNumbers.operation.text = operation;
        this.winNumbers.visible = false;
        this.addChild(this.winNumbers);
        this.winNumbers.show();
    };

    p.onShowWinNumbers = function () {
        this.homeButton.setEnabled(false);
        this.repeatButton.setEnabled(false);
        this.showNumbersButton.setEnabled(false);
    };

    p.onHideWinNumbers = function () {
        this.homeButton.setEnabled(true);
        this.repeatButton.setEnabled(true);
        this.showNumbersButton.setEnabled(true);
    };

    sm.mentatletasInfantil.AnzanGame = anzanGame;
}(window));

(function () {
    var buildGame = function (cfg, owner) {
        this.initialize(cfg, owner);
    };

    var p = buildGame.prototype = new createjs.Container();

    p.lastNumberRandom = 0;

    p.Container_initialize = p.initialize;
    p.initialize = function (cfg, owner) {
        this.Container_initialize();
        this.owner = owner;
        this.cfg = cfg;
        this.setupObjects();
    };

    p.setupObjects = function () {
        // Creamos el avatar.
        this.avatar = new createjs.Bitmap();
        this.addChild(this.avatar);

        // Caja de n�mero a construir.
        this.numberBox = new createjs.Container();
        this.numberBox.x = this.cfg.numberBox.x;
        this.numberBox.y = this.cfg.numberBox.y;

        this.numberBox.bkgImage = new createjs.Bitmap(ImageManager.getImage(this.cfg.numberBox.imageId));

        this.numberBox.width = this.numberBox.bkgImage.image.width;
        this.numberBox.height = this.numberBox.bkgImage.image.height;

        this.numberBox.number = new createjs.Text("", this.cfg.numberBox.number.font, this.cfg.numberBox.number.numberColor);
        this.numberBox.number.x = this.cfg.numberBox.number.x;
        this.numberBox.number.y = this.cfg.numberBox.number.y;
        this.numberBox.number.textAlign = "center";
        this.numberBox.number.textBaseline = "middle";

        this.numberBox.addChild(this.numberBox.bkgImage);
        this.numberBox.addChild(this.numberBox.number);
        this.addChild(this.numberBox);

        // Caja de n�meros seleccionados.
        this.selectionBox = new createjs.Container();
        this.selectionBox.x = this.cfg.selectionBox.x;
        this.selectionBox.y = this.cfg.selectionBox.y;
        this.selectionBox.width = this.cfg.selectionBox.width;
        this.selectionBox.height = this.cfg.selectionBox.height;

        this.selectionBox.bkgShp = new createjs.Shape();
        this.selectionBox.bkgShp.graphics.beginFill(this.cfg.selectionBox.backgroundColor).drawRoundRect(0, 0, this.cfg.selectionBox.width, this.cfg.selectionBox.height, this.cfg.selectionBox.round);

        this.correctButton = new smInfantil.OkButton(createjs.proxy(this.onCorrectClick, this));
        this.correctButton.x = this.cfg.selectionBox.width - this.correctButton.width - this.cfg.numbersButtons.numbers.padding;
        this.correctButton.y = this.cfg.selectionBox.height / 2 - this.correctButton.height / 2;

        this.selectionBox.containerNumbers = new createjs.Container();

        this.selectionBox.addChild(this.selectionBox.bkgShp);
        this.selectionBox.addChild(this.correctButton);
        this.selectionBox.addChild(this.selectionBox.containerNumbers);
        this.selectionBox.plus = new createjs.Shape();
        this.addChild(this.selectionBox);

        // Ventana de verificaci�n de operaci�n.
        this.failPopup = new smInfantil.PopupWindow(this.owner, this.cfg.failPopup.width, this.cfg.failPopup.height, false, true, createjs.proxy(this.onShowFailPopup, this), createjs.proxy(this.onHideFailPopup, this));
        this.failPopup.message = new createjs.Text("", this.cfg.failPopup.font, this.cfg.failPopup.foreColor);
        this.failPopup.message.x = this.cfg.failPopup.width / 2;
        this.failPopup.message.y = (this.cfg.failPopup.height) / 2;
        this.failPopup.message.textAlign = "center";
        this.failPopup.message.textBaseline = "middle";
        this.failPopup.addElement(this.failPopup.message);

        this.footer = new sm.FooterTool(this.owner.originalWidth, 0, this.owner.originalHeight - styles.footerSM.height);
        // Bot�n home
        this.homeButton = new smInfantil.HomeButton(createjs.proxy(this.onHomeButtonClick, this));
        this.homeButton.x = this.owner.originalWidth / 2 - this.homeButton.width / 2;
        this.homeButton.y = 2;
        this.homeButton.setEnabled(false);
        this.footer.addChild(this.homeButton);
        // Bot�n repetir
        this.repeatButton = new smInfantil.RepeatButton(createjs.proxy(this.onRepeatButtonClick, this));
        this.repeatButton.x = this.owner.originalWidth - this.repeatButton.width - 5;
        this.repeatButton.y = 2;
        this.repeatButton.setEnabled(false);
        this.footer.addChild(this.repeatButton);
    };

    p.show = function (time, avatar, minNumber, maxNumber) {
        this.alpha = 0;
        this.minNumber = minNumber;
        this.maxNumber = maxNumber;
        this.avatar.image = ImageManager.getImage(avatar.imageId);
        this.avatar.x = avatar.x;
        this.avatar.y = avatar.y;

        this.run();
        this.owner.addChild(this);
        createjs.Tween.get(this).to({ alpha: 1 }, time);
    };

    p.hide = function (time) {
        createjs.Tween.get(this).to({ alpha: 0 }, time).call(this.removeThis);
    };

    p.removeThis = function () {
        this.owner.removeChild(this);
    };

    p.run = function () {
        this.removeChild(this.owner.animationEnd);
        this.homeButton.setEnabled(true);
        this.repeatButton.setEnabled(false);
        this.correctButton.setEnabled(false);

        this.selectionBox.containerNumbers.removeAllChildren();
        this.selectionBox.plus.graphics.clear();

        do {
            this.buildNumber = this.randomInt(this.minNumber, this.maxNumber);
        } while (this.lastNumberRandom == this.buildNumber);
        this.lastNumberRandom = this.buildNumber;

        this.numberBox.number.text = this.buildNumber;

        this.generateNumberButtons();
        this.addChild(this.footer);
    };

    p.generateNumberButtons = function() {
        this.removeChild(this.numberButtonsBox);
        this.numberButtonsBox = new createjs.Container();

        this.numbersButtons = [];
        this.auxNumbersButtons = [];
        for (var i = 1; i <= this.maxNumber; i++) {
            var button1 = new sm.mentatletasInfantil.BuildGameNumberButton(
                i,
                this.cfg.numbersButtons.numbers.size,
                this.cfg.numbersButtons.numbers.borderSize,
                this.cfg.numbersButtons.numbers.borderColor,
                this.cfg.numberColors[i - 1],
                this.cfg.numbersButtons.numbers.borderColorSize,
                this.cfg.numbersButtons.numbers.backgroundColor,
                this.cfg.numbersButtons.numbers.font,
                this.cfg.numbersButtons.numbers.foreColor,
                this.cfg.numbersButtons.numbers.strikeColor,
                this.cfg.numbersButtons.numbers.strikeLineSize,
                createjs.proxy(this.onNumberButtonClick, this),
                this
            );
            button1.value = i;
            var button2 = new sm.mentatletasInfantil.BuildGameNumberButton(
                i,
                this.cfg.numbersButtons.numbers.size,
                this.cfg.numbersButtons.numbers.borderSize,
                this.cfg.numbersButtons.numbers.borderColor,
                this.cfg.numberColors[i - 1],
                this.cfg.numbersButtons.numbers.borderColorSize,
                this.cfg.numbersButtons.numbers.backgroundColor,
                this.cfg.numbersButtons.numbers.font,
                this.cfg.numbersButtons.numbers.foreColor,
                this.cfg.numbersButtons.numbers.strikeColor,
                this.cfg.numbersButtons.numbers.strikeLineSize,
                createjs.proxy(this.onNumberButtonClick, this),
                this
            );
            button2.value = i;
            this.numbersButtons.push(button1);
            this.numbersButtons.push(button2);
            this.auxNumbersButtons.push(button1);
            this.auxNumbersButtons.push(button2);
        }

        for (var indexStrikeNumbers in this.cfg.strikeNumbers) {
            var strikeNumbers = this.cfg.strikeNumbers[indexStrikeNumbers];
            if (strikeNumbers.number == this.buildNumber) {
                for (var strikeIndex in strikeNumbers.strike) {
                    var strikeNumber = strikeNumbers.strike[strikeIndex];
                    for (var indexNumber in this.numbersButtons) {
                        var numberButton = this.numbersButtons[indexNumber];
                        if (!numberButton.strike && numberButton.value == strikeNumber) {
                            numberButton.setStrike(true);
                            break;
                        }
                    }
                }
                break;
            }
        }

        var offsetX = 10;
        var offsetY = 10;
        var posX = 0;
        var posY = 0;
        this.numberButtonsBox.width = 0;
        this.numberButtonsBox.height = 0;
        do {
            var indexRandom = this.randomInt(0, this.auxNumbersButtons.length - 1);
            var button = this.auxNumbersButtons[indexRandom];
            this.auxNumbersButtons.splice(indexRandom, 1);

            button.x = offsetX + (posX * (this.cfg.numbersButtons.numbers.size +this.cfg.numbersButtons.numbers.padding));
            button.y = offsetY + (posY * (this.cfg.numbersButtons.numbers.size +this.cfg.numbersButtons.numbers.padding));
            this.numberButtonsBox.addChild(button);

            if (this.numberButtonsBox.width < button.x + button.size) {
                this.numberButtonsBox.width = button.x + button.size;
            }
            posX++;
            if (posX >= this.maxNumber) {
                posX = 0;
                posY++;
            }
        } while (this.auxNumbersButtons.length > 0);

        this.numberButtonsBox.x = this.owner.originalWidth / 2 - this.numberButtonsBox.width / 2;
        this.numberButtonsBox.y = this.cfg.numbersButtons.y;

        this.addChild(this.numberButtonsBox);
    };

    p.onNumberButtonClick = function (buttonNumber) {
        var newButton = jQuery.extend(true, {}, buttonNumber);
        newButton.cursor = "pointer";
        newButton.off("click", newButton.clickListener);
        newButton.clickListener = null;
        this.correctButton.setEnabled(true);
        this.homeButton.setEnabled(false);
        buttonNumber.setEnabled(false);
        newButton.orgButton = buttonNumber;
        newButton.on("click", createjs.proxy(function(e, b, button) {
            this.selectionBox.containerNumbers.removeChild(button);
            button.orgButton.setEnabled(true);
            this.reorderButtons();
            if (this.selectionBox.containerNumbers.children.length == 0) {
                this.correctButton.setEnabled(false);
                this.homeButton.setEnabled(true);
            }

        }, this, newButton));

        this.selectionBox.containerNumbers.addChild(newButton);
        this.selectionBox.addChild(this.selectionBox.plus);

        // Recolocamos los n�meros seleccionados.
        this.reorderButtons();

        // Verificamos si se han introducido m�s n�meros de los que pueden entrar.
        if (this.selectionBox.containerNumbers.children.length >= this.cfg.selectionBox.maxButtons) {
            this.checkEnd(sm.mentatletasInfantil.buildGameEndType.OVERMATCH);
        }
    };

    p.reorderButtons = function () {
        this.selectionBox.plus.graphics.clear().setStrokeStyle(2).beginStroke("#008000");
        var selectedNumbersWidth = (this.selectionBox.containerNumbers.children.length * (this.cfg.numbersButtons.numbers.size + this.cfg.numbersButtons.numbers.padding) - this.cfg.numbersButtons.numbers.padding);
        var offsetX = ((this.selectionBox.width - this.correctButton.width) / 2) - (selectedNumbersWidth / 2);
        var posX = 0;
        var padding = this.cfg.numbersButtons.numbers.padding * 3;
        for (var indexChild in this.selectionBox.containerNumbers.children) {
            var childButton = this.selectionBox.containerNumbers.children[indexChild];
            childButton.x = offsetX + (posX * (this.cfg.numbersButtons.numbers.size + padding));
            childButton.x -= this.cfg.numbersButtons.numbers.size / 2;
            childButton.y = (this.selectionBox.height / 2) - (this.cfg.numbersButtons.numbers.size / 2);
            posX++;
            if (indexChild >= 1) {
                var plusLength = this.cfg.numbersButtons.numbers.padding * 1.6;

                var x1 = -(padding / 2);
                var y1 = this.cfg.numbersButtons.numbers.size / 2 - plusLength / 2;
                var x2 = x1;
                var y2 = y1 + plusLength;

                var x3 = -(padding / 2 + plusLength / 2);
                var y3 = this.cfg.numbersButtons.numbers.size / 2;
                var x4 = x3 + plusLength;
                var y4 = this.cfg.numbersButtons.numbers.size / 2;

                x1 = x1 + childButton.x;
                y1 = y1 + childButton.y;
                x2 = x2 + childButton.x;
                y2 = y2 + childButton.y;
                x3 = x3 + childButton.x;
                y3 = y3 + childButton.y;
                x4 = x4 + childButton.x;
                y4 = y4 + childButton.y;
                this.selectionBox.plus.graphics
                    .moveTo(x1, y1).lineTo(x2, y2)
                    .moveTo(x3, y3).lineTo(x4, y4).closePath()
                ;
            }
        }
    };

    p.onCorrectClick = function() {
        var correctResult = 0;
        for (var indexChild in this.selectionBox.containerNumbers.children) {
            var childButton = this.selectionBox.containerNumbers.children[indexChild];
            correctResult += childButton.value;
        }
        if (correctResult == this.buildNumber) {
            this.checkEnd(sm.mentatletasInfantil.buildGameEndType.SUCCESS);
        }
        else if (correctResult > this.buildNumber) {
            this.checkEnd(sm.mentatletasInfantil.buildGameEndType.OVERMATCH);
        }
        else if (correctResult < this.buildNumber) {
            this.checkEnd(sm.mentatletasInfantil.buildGameEndType.NOTREACHED_OR_NOTPOSIBLE);
        }
    };

    p.checkEnd = function (endType) {
        switch (endType) {
            case sm.mentatletasInfantil.buildGameEndType.SUCCESS:
                this.correctButton.setEnabled(false);
                this.homeButton.setEnabled(true);
                this.repeatButton.setEnabled(true);
                this.numberButtonsBox.mouseEnabled = false;

                this.owner.playAudio(audios.muyBien, function () { this.owner.playAudio(this.cfg.susscessSound); }, this);
                this.removeChild(this.owner.animationEnd);
                this.addChild(this.owner.animationEnd);
                this.addChild(this.footer);
                this.owner.animationEnd.run(this.onFinishAnimation);

                break;
            case sm.mentatletasInfantil.buildGameEndType.NOTREACHED_OR_NOTPOSIBLE:
                this.owner.playAudio(this.cfg.failPopup.notReachedOrNotPosibleAudio);
                this.failPopup.message.text = this.cfg.failPopup.notReachedOrNotPosibleText;
                this.failPopup.message.y = (this.cfg.failPopup.height / 2) - (this.failPopup.message.getMeasuredHeight() / 2);
                this.failPopup.visible = false;
                this.addChild(this.failPopup);
                this.failPopup.show();
                break;
            case sm.mentatletasInfantil.buildGameEndType.OVERMATCH:
                this.owner.playAudio(this.cfg.failPopup.overmatchAudio);
                this.failPopup.message.text = this.cfg.failPopup.overmatchText;
                this.failPopup.message.y = (this.cfg.failPopup.height / 2) -(this.failPopup.message.getMeasuredHeight() / 2);
                this.failPopup.visible = false;
                this.addChild(this.failPopup);
                this.failPopup.show();
                break;
        }
    };

    p.onShowFailPopup = function() {
        this.homeButton.setEnabled(false);
        this.correctButton.setEnabled(false);
    };

    p.onHideFailPopup = function() {
        this.retryGame();
    };

    p.randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    p.onHomeButtonClick = function() {
        this.hide(250);
        this.owner.mainMenu.show(250);
        this.owner.header.closeSlide(500);
        this.owner.stopAudio();
    };

    p.retryGame = function() {
        this.owner.stopAudio();

        this.removeChild(this.owner.animationEnd);
        this.homeButton.setEnabled(true);
        this.repeatButton.setEnabled(false);
        this.correctButton.setEnabled(false);

        this.selectionBox.containerNumbers.removeAllChildren();
        this.selectionBox.plus.graphics.clear();

        for (var indexNumber in this.numbersButtons) {
            var numberButton = this.numbersButtons[indexNumber];
            numberButton.setEnabled(true);
        }

    }

    p.onRepeatButtonClick = function () {
        this.owner.stopAudio();
        this.run();
    };

    sm.mentatletasInfantil.BuildGame = buildGame;
}(window));

(function () {
    var buildGameNumberButton = function (number, size, borderSize, borderColor, color, borderColorSize, backgroundColor, font, foreColor, strikeColor, strikeLineSize, callbackClick, owner) {
        this.initialize(number, size, borderSize, borderColor, color, borderColorSize, backgroundColor, font, foreColor, strikeColor, strikeLineSize, callbackClick, owner);
    };

    var p = buildGameNumberButton.prototype = new createjs.Container();

    p.Container_initialize = p.initialize;
    p.initialize = function (number, size, borderSize, borderColor, color, borderColorSize, backgroundColor, font, foreColor, strikeColor, strikeLineSize, callbackClick, owner) {
        this.Container_initialize();
        this.owner = owner;
        this.number = number;
        this.size = size;
        this.borderSize = borderSize;
        this.borderColor = borderColor;
        this.color = color;
        this.borderColorSize = borderColorSize;
        this.backgroundColor = backgroundColor;
        this.font = font;
        this.foreColor = foreColor;
        this.strikeColor = strikeColor;
        this.strikeLineSize = strikeLineSize;
        this.callbackClick = callbackClick;
        this.width = size;
        this.height = size;
        this.enabled = true;
        this.strike = false;
        this.cursor = "pointer";
        this.setupObjects();
    };

    p.setupObjects = function () {
        this.bkgShp = new createjs.Shape();
        this.bkgShp.graphics.setStrokeStyle(this.borderSize).beginStroke(this.borderColor)
            .beginFill(this.color)
            .drawCircle(this.size / 2, this.size / 2, this.size / 2)
            .beginFill(this.backgroundColor)
            .drawCircle(this.size / 2, this.size / 2, (this.size / 2) - this.borderColorSize);
        this.addChild(this.bkgShp);
        this.textNumber = new createjs.Text(this.number, this.font, this.foreColor);
        this.textNumber.x = this.size / 2;
        this.textNumber.y = this.size / 2;
        this.textNumber.textAlign = "center";
        this.textNumber.textBaseline = "middle";
        this.addChild(this.textNumber);
        this.disableShp = new createjs.Shape();
        this.disableShp.graphics.beginFill("#FFFFFF").drawCircle(this.size / 2, this.size / 2, this.size / 2 + 1);
        this.disableShp.alpha = 0.7;
        this.strikeShp = new createjs.Shape();
        this.strikeShp.graphics.setStrokeStyle(this.strikeLineSize).beginStroke(this.strikeColor).moveTo(4, 4).lineTo(this.width - 4, this.height - 4).moveTo(this.width - 4, 4).lineTo(4, this.height - 4);
        this.clickListener = this.on("click", function () {
            if (this.enabled && !this.strike) {
                if (this.callbackClick) {
                    this.callbackClick(this);
                }
            }
        });
    };

    p.setEnabled = function (value) {
        this.enabled = value;
        if (this.enabled) {
            this.removeChild(this.disableShp);
            this.cursor = "pointer";
        } else {
            this.addChild(this.disableShp);
            this.cursor = "default";
        }
    }

    p.setStrike = function(value) {
        this.strike = value;
        if (this.strike) {
            this.addChild(this.strikeShp);
            this.addChild(this.textNumber);
            this.cursor = "default";
        } else {
            this.removeChild(this.strikeShp);
            this.cursor = "pointer";
        }
    };

    sm.mentatletasInfantil.BuildGameNumberButton = buildGameNumberButton;
}(window));