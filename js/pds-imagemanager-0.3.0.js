// ----------------------------------------------------------------------------------------------------------------------------------
// Name:    pds.ImageManager
// Version: 2.0.160129
// ----------------------------------------------------------------------------------------------------------------------------------

this.pds = this.pds || {};

(function () {
    var imageManager = function () {
        this.defaultSectionKey = "imagenes";
    };

    var p = imageManager.prototype;

    p.getImage = function (key, sectionKey) {
        if (!sectionKey) {
            sectionKey = this.defaultSectionKey;
        }
        var imgElement = null;
        var section = this[sectionKey];

        if (section) {
            for (var i = 0; i < section.length; i++) {
                if (section[i].id === key) {
                    imgElement = document.createElement("img");
                    if (section[i].url != undefined) {
                        imgElement.src = section[i].url;
                    } else {
                        imgElement.src = section[i].src;
                    }
                    imgElement.height = section[i].height;
                    imgElement.width = section[i].width;
                    break;
                }
            }
        }
        return imgElement;
    };

    p.getAlternativeImage = function (key, sectionKey) {
        if (!sectionKey) {
            sectionKey = this.defaultSectionKey;
        }
        var imgElement = null;
        var section = this[sectionKey];

        if (section) {
            for (var i = 0; i < section.length; i++) {
                if (section[i].id === key) {
                    imgElement = document.createElement("img");
                    if (section[i].urlAlt != undefined) {
                        imgElement.src = section[i].urlAlt;
                    } else {
                        imgElement.src = section[i].srcAlt;
                    }
                    imgElement.height = section[i].height;
                    imgElement.width = section[i].width;
                    break;
                }
            }
        }
        return imgElement;
    };

    p.loadImages = function (src, sectionKey, onloadCallback, scope) {
        var fileref = document.createElement('script');
        fileref.setAttribute("type", "text/javascript");
        fileref.setAttribute("src", src);
        fileref.onloadCallback = onloadCallback;
        fileref.scope = scope;
        fileref.owner = this;
        fileref.onload = function () {
            this.owner[sectionKey] = imageData;
            if (this.onloadCallback) {
                createjs.proxy(this.onloadCallback, this.scope)();
            }
        };
        document.getElementsByTagName("head")[0].appendChild(fileref);
    };

    pds.ImageManager = imageManager;
}(window));

$(document).ready(function () {
    window.ImageManager = new pds.ImageManager();
});