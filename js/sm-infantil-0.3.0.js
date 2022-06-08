this.smInfantil = this.smInfantil || {};

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Button ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var button = function (imageUpDef, imageOverDef, imageDisabledDef, callbackClick) {
        this.initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    var p = button.prototype = new sm.ImageButton();

    p.ImageButton_initialize = p.initialize;
    p.initialize = function (imageUpDef, imageOverDef, imageDisabledDef, callbackClick) {
        if (imageUpDef) {
            var imageUp = document.createElement("img");
            imageUp.src = imageUpDef.src.replace(/_/g, "/");
            imageUp.width = imageUpDef.width;
            imageUp.height = imageUpDef.height;

            var imageOver = document.createElement("img");
            imageOver.src = imageOverDef.src.replace(/_/g, "/");
            imageOver.width = imageOverDef.width;
            imageOver.height = imageOverDef.height;

            var imageDisabled = document.createElement("img");
            imageDisabled.src = imageDisabledDef.src.replace(/_/g, "/");
            imageDisabled.width = imageDisabledDef.width;
            imageDisabled.height = imageDisabledDef.height;

            this.ImageButton_initialize(0, 0, imageUp, imageOver, imageDisabled, callbackClick);
            this.width = imageUp.width;
            this.height = imageUp.height;
        }
    };

    p.blink = function () {

    };

    smInfantil.Button = button;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.StartButton ----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var startButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = startButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Entra;
        var imageOverDef = styles.icons.Entra_Rollover;
        var imageDisabledDef = styles.icons.Entra_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.StartButton = startButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.HomeButton -----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var homeButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = homeButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Inicio;
        var imageOverDef = styles.icons.Inicio_Rollover;
        var imageDisabledDef = styles.icons.Inicio_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.HomeButton = homeButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Back -----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var backButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = backButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Atras;
        var imageOverDef = styles.icons.Atras_Rollover;
        var imageDisabledDef = styles.icons.Atras_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.BackButton = backButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Next -----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var nextButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = nextButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Adelante;
        var imageOverDef = styles.icons.Adelante_Rollover;
        var imageDisabledDef = styles.icons.Adelante_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.NextButton = nextButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Mostrar --------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var mostrarButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = mostrarButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Mostrar;
        var imageOverDef = styles.icons.Mostrar_Rollover;
        var imageDisabledDef = styles.icons.Mostrar_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.MostrarButton = mostrarButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Ocultar --------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var ocultarButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = ocultarButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Ocultar;
        var imageOverDef = styles.icons.Ocultar_Rollover;
        var imageDisabledDef = styles.icons.Ocultar_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.OcultarButton = ocultarButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Audio ----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var audioButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = audioButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Audio;
        var imageOverDef = styles.icons.Audio_Rollover;
        var imageDisabledDef = styles.icons.Audio_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.AudioButton = audioButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Ayuda ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var ayudaButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = ayudaButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Ayuda;
        var imageOverDef = styles.icons.Ayuda_Rollover;
        var imageDisabledDef = styles.icons.Ayuda_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.AyudaButton = ayudaButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Cerrar ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var cerrarButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = cerrarButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Cerrar;
        var imageOverDef = styles.icons.Cerrar_Rollover;
        var imageDisabledDef = styles.icons.Cerrar_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.CerrarButton = cerrarButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Teclado --------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var tecladoButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = tecladoButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Teclado;
        var imageOverDef = styles.icons.Teclado_Rollover;
        var imageDisabledDef = styles.icons.Teclado_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.TecladoButton = tecladoButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Ok -------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var okButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = okButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.Ok;
        var imageOverDef = styles.icons.Ok_Rollover;
        var imageDisabledDef = styles.icons.Ok_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.OkButton = okButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.Repeat -------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var repeatButton = function (callbackClick) {
        this.initialize(callbackClick);
    };

    var p = repeatButton.prototype = new smInfantil.Button();

    p.Button_initialize = p.initialize;
    p.initialize = function (callbackClick) {
        var imageUpDef = styles.icons.VolverComenzar;
        var imageOverDef = styles.icons.VolverComenzar_Rollover;
        var imageDisabledDef = styles.icons.VolverComenzar_Desactivado;
        this.Button_initialize(imageUpDef, imageOverDef, imageDisabledDef, callbackClick);
    };

    smInfantil.RepeatButton = repeatButton;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.NavigationBar --------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var navigationBar = function (x, y, numSteps, callbackBtnClick) {
        this.initialize(x, y, numSteps, callbackBtnClick);
    };

    var p = navigationBar.prototype = new sm.BarraNavegacion();

    p.BarraNavegacion_initialize = p.initialize;
    p.initialize = function (x, y, numSteps, callbackBtnClick) {
        this.BarraNavegacion_initialize(x, y, numSteps, callbackBtnClick);
        this.removeAllChildren();
        this.numSteps = numSteps;
        this.progressBar = new sm.ProgressImageBar(this.numSteps, 2, styles.icons.Steps, styles.icons.StepsActive);
        this.progressBar.x = 5;
        this.progressBar.y = 0;
        this.addChild(this.progressBar);

        this.btnPrev = new smInfantil.BackButton(this.navOnPrev);
        this.btnPrev._barraNavegacion = this;
        this.btnPrev.x = totalWidth / 2 - (this.btnPrev.width * 1.5);
        this.btnPrev.y = 0;
        this.addChild(this.btnPrev);

        this.btnNext = new smInfantil.NextButton(this.navOnNext);
        this.btnNext._barraNavegacion = this;
        this.btnNext.x = totalWidth / 2 + (this.btnPrev.width * 0.5);
        this.btnNext.y = 0;
        this.addChild(this.btnNext);
    };

    p.BarraNavegacion_navOnNext = p.navOnNext;
    p.navOnNext = function () {
        createjs.proxy(this._barraNavegacion.BarraNavegacion_navOnNext, this)();
        this._barraNavegacion.progressBar.setProgress(this._barraNavegacion.stepActual);
    };

    p.BarraNavegacion_navOnPrev = p.navOnPrev;
    p.navOnPrev = function () {
        createjs.proxy(this._barraNavegacion.BarraNavegacion_navOnPrev, this)();
        this._barraNavegacion.progressBar.setProgress(this._barraNavegacion.stepActual);
    };

    p.BarraNavegacion_reset = p.reset;
    p.reset = function () {
        this.stepActual = 1;
        this.progressBar.setProgress(this.stepActual);
    };

    smInfantil.NavigationBar = navigationBar;
}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.PopupWindow ----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var popupWindow = function (owner, width, height, showOkBotton, showCloseBotton, callbackShow, callbackHide) {
        this.initialize(owner, width, height, showOkBotton, showCloseBotton, callbackShow, callbackHide);
    };

    var p = popupWindow.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (owner, width, height, showOkBotton, showCloseBotton, callbackShow, callbackHide) {
        this.Container_initialize();

        this.owner = owner;
        this.width = width;
        this.height = height;
        this.showOkBotton = showOkBotton;
        this.showCloseBotton = showCloseBotton;
        this.callbackHide = callbackHide;
        this.callbackShow = callbackShow;

        this.crearPopupBkgShape();

        if (this.showOkBotton == true) {
            this.createOkButton();
        }
        if (this.showCloseBotton == true) {
            this.createCloseButton();
        }
    };

    p.crearPopupBkgShape = function () {
        this.shadow = new createjs.Shape();
        this.shadow.graphics.beginFill("#000000").drawRect(0, 0, this.owner.originalWidth, this.owner.originalHeight);
        this.shadow.alpha = 0.5;
        this.addChild(this.shadow);

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
        this.popupBkgShape.x = this.owner.originalWidth / 2 - this.width / 2;
        this.popupBkgShape.y = this.owner.originalHeight / 2 - this.height / 2;
        this.addChild(this.popupBkgShape);

        this.elementContainer = new createjs.Container();
        this.elementContainer.x = this.popupBkgShape.x;
        this.elementContainer.y = this.popupBkgShape.y;
        this.addChild(this.elementContainer);
    };

    p.createOkButton = function () {
        this.okButton = new smInfantil.OkButton(createjs.proxy(this.onOkClick, this));
        this.okButton.x = this.popupBkgShape.x + (this.width / 2) - (this.okButton.width / 2);
        this.okButton.y = this.popupBkgShape.y + this.height - this.okButton.height - 5;
        this.addChild(this.okButton);
    };

    p.createCloseButton = function () {
        this.closeButton = new smInfantil.CerrarButton(createjs.proxy(this.onCloseClick, this));
        this.closeButton.x = this.popupBkgShape.x + this.width - this.closeButton.width - 5;
        this.closeButton.y = this.popupBkgShape.y + 5;
        this.addChild(this.closeButton);
    };

    p.onOkClick = function () {
        this.visible = false;
        if (this.callbackHide) {
            createjs.proxy(this.callbackHide, this.owner, this, true).call();
        }
    };

    p.onCloseClick = function () {
        this.visible = false;
        if (this.callbackHide) {
            createjs.proxy(this.callbackHide, this.owner, this, false).call();
        }
    };

    p.show = function () {
        this.visible = true;
        if (this.callbackShow) {
            createjs.proxy(this.callbackShow, this.owner).call();
        }
    };

    p.hide = function () {
        this.visible = false;
        if (this.callbackHide) {
            createjs.proxy(this.callbackHide, this.owner, this, false).call();
        }
    };

    p.addElement = function (obj) {
        this.elementContainer.addChild(obj);
    };

    smInfantil.PopupWindow = popupWindow;

}(window));

// ---------------------------------------------------------------------------------------------------------
// smInfantil.IFramePopup ----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------
(function () {
    var iFramePopup = function (owner, width, height, src, callbackShow, callbackHide) {
        this.initialize(owner, width, height, src, callbackShow, callbackHide);
    };

    var p = iFramePopup.prototype = new createjs.Container();
    p.Container_initialize = p.initialize;

    p.initialize = function (owner, width, height, src, callbackShow, callbackHide) {
        this.Container_initialize();

        this.owner = owner;
        this.width = width;
        this.height = height;
        this.src = src;
        this.callbackHide = callbackHide;
        this.callbackShow = callbackShow;

        this.crearPopupBkgShape();
        this.createCloseButton();
        this.createDOMElement();
    };

    p.crearPopupBkgShape = function () {
        this.shadow = new createjs.Shape();
        this.shadow.graphics.beginFill("#000000").drawRect(0, 0, this.owner.originalWidth, this.owner.originalHeight);
        this.shadow.alpha = 0.5;
        this.addChild(this.shadow);

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
        this.popupBkgShape.x = this.owner.originalWidth / 2 - this.width / 2;
        this.popupBkgShape.y = this.owner.originalHeight / 2 - this.height / 2;
        this.addChild(this.popupBkgShape);
    };

    p.createCloseButton = function () {
        this.closeButton = new smInfantil.CerrarButton(createjs.proxy(this.onCloseClick, this));
        this.closeButton.x = this.popupBkgShape.x + this.width - this.closeButton.width - 5;
        this.closeButton.y = this.popupBkgShape.y + 5;
        this.addChild(this.closeButton);
    };

    p.onCloseClick = function() {
        this.visible = false;
        if (this.callbackHide) {
            createjs.proxy(this.callbackHide, this.owner).call();
        }
    };

    p.createDOMElement = function () {
        this.iframeContainer = new createjs.Container();
        counterDynDomEids++;
        var elementId = "dynDomE" + counterDynDomEids + "_iframe";
        this.name = elementId;
        var iframeWidth = this.width - 50;
        var iframeHeight = this.height - 100;

        var element = document.createElement('div');
        element.id = elementId;
        element.innerHTML = "<iframe src='" + this.src + "' style='overflow: auto; border: 0px none; padding: 0px; height: 100%; width: 100%; display: block; background-color: transparent;'></iframe>";
        element.style.visibility = 'hidden';
        element.style.display = 'none';
        element.style.zIndex = 100;
        element.style.cursor = "default";
        element.style.position = 'absolute';
        element.style.overflow = "auto";

        if (this.width) {
            element.style.width = iframeWidth + "px";
        }
        if (this.height) {
            element.style.height = iframeHeight + "px";
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
            this.iframe = element;
            dynDomE.appendChild(element);
            var content = new createjs.DOMElement(elementId);
            this.iframeContainer.addChild(content);
        }
        this.iframeContainer.x = this.popupBkgShape.x + (this.popupBkgShape.width / 2 - iframeWidth / 2);
        this.iframeContainer.y = this.closeButton.height+ this.closeButton.y+ 10;
        this.addChild(this.iframeContainer);
    };

    p.show = function () {
        this.visible = true;
        this.iframe.style.display = "block";
        if (this.callbackShow) {
            createjs.proxy(this.callbackShow, this.owner).call();
        }
    };

    p.hide = function () {
        this.visible = false;
        this.iframe.style.display = "none";
        if (this.callbackHide) {
            createjs.proxy(this.callbackHide, this.owner).call();
        }
    };

    smInfantil.IFramePopup = iFramePopup;

}(window));
