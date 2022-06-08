var Mae = {Com: {}};

/**
 * Librería de comunicación para interactivos
 *
 * @constructor
 */
Mae.Com.Interactivos = function () {

    var messenger = new Mae.Com.Messenger();

    /**
     * Notifica el comienzo de la ejecución
     */
    Mae.Com.Interactivos.prototype.IniciaEjecucion = function () {
        messenger.sendMessageToParent(
            Mae.Com.Messenger.MENSAJES_TIPOS.TRAZA,
            Mae.Com.Messenger.MENSAJES_TRAZAS.INICIO_EJECUCION,
            Mae.Com.Messenger.MENSAJES_METHOD.PETICION
        );
    };

    /**
     * Notifica el final de la ejecución.
     *
     * @param {Object} [data]                Datos a enviar con la petición
     * @param {Object} [data.total]          Puntuación total de la ejecución
     * @param {Object} [data.aciertos]       Respuestas acertadas
     * @param {Object} [data.intentos]       Intentos realizados para finalizar la ejecución
     */
    Mae.Com.Interactivos.prototype.FinEjecucion = function (data) {
        if (data != null && (data.total == null || data.aciertos == null || data.intentos == null)) {
            var error = 'Parámetros no válidos. El objeto debe que tener los siguientes parámetros: "total",';
            error += ' "aciertos", "intentos';
            throw new Error(error);
        }
        messenger.sendMessageToParent(
            Mae.Com.Messenger.MENSAJES_TIPOS.TRAZA,
            Mae.Com.Messenger.MENSAJES_TRAZAS.FIN_EJECUCION,
            Mae.Com.Messenger.MENSAJES_METHOD.PETICION,
            data
        );
    };

    /**
     * Notifica el final del evento ver solución.
     */
    Mae.Com.Interactivos.prototype.VerSolucion = function () {
        messenger.sendMessageToParent(
            Mae.Com.Messenger.MENSAJES_TIPOS.TRAZA,
            Mae.Com.Messenger.MENSAJES_TRAZAS.VER_SOLUCION,
            Mae.Com.Messenger.MENSAJES_METHOD.PETICION
        );
    };


    /**
     * Almacena el estado
     *
     * @param {Object} params.estado          Datos a guardar
     * @param {Object} [params.onSuccess]     Función que se lanzará al recibir los datos
     * @param {Object} [params.onError]       Función que se lanzará cuando se produzca un error durante la peticion
     * @param {Object} [params.onComplete]    Función que se lanzará al finalizar la petición
     */
    Mae.Com.Interactivos.prototype.AlmacenaEstado = function (params) {
        messenger.sendMessageToParent(
            Mae.Com.Messenger.MENSAJES_TIPOS.ESTADO,
            Mae.Com.Messenger.MENSAJES_ESTADOS.ALMACENA_ESTADO,
            Mae.Com.Messenger.MENSAJES_METHOD.PETICION,
            params.estado,
            { onSuccess: params.onSuccess, onError: params.onError, onComplete: params.onComplete}
        );
    };

    /**
     * Recupera el último estado almacenado
     *
     * @param {Object} [params]
     * @param {Object} [params.onSuccess]     Función que se lanzará al recibir los datos
     * @param {Object} [params.onError]       Función que se lanzará cuando se produzca un error durante la peticion
     * @param {Object} [params.onComplete]    Función que se lanzará al finalizar la petición
     */
    Mae.Com.Interactivos.prototype.RecuperaConfiguracion = function (params) {
        messenger.sendMessageToParent(
            Mae.Com.Messenger.MENSAJES_TIPOS.ESTADO,
            Mae.Com.Messenger.MENSAJES_ESTADOS.RECUPERA_CONFIGURACION,
            Mae.Com.Messenger.MENSAJES_METHOD.PETICION,
            null,
            { onSuccess: params.onSuccess, onError: params.onError, onComplete: params.onComplete}
        );
    };
};

Mae.Com.Messenger = function () {

    /**
     * Tiempo de espera despues del cual se cancelará un mensaje
     * @type {number}
     */
    var COMMUNICATION_TIMEOUT = 5000;

    /**
     * Id único de mensaje
     * @type {number}
     */
    var communicationMessageId = 0;

    /**
     * Array con los callbacks asociados con los mensajes que hay en la cola de mensajes
     */
    var communicationMessageCallbacks;

    /**
     * Cola de mensajes en espera de una respuesta
     */
    var communicationMessagesPool;

    /**
     * Manejador de mensajes recibidos
     */
    var requestHandler;

    /**
     * Objeto que recibira los mensajes destinados al contenedor
     */
    var parent;


    /**
     * Envía mensajes al contenedor y los añade a la cola de mensajes
     *
     * @param {string} type              Tipo de mensaje: trazas | estados
     * @param {string} subtype           Subtipo de mensaje dentro del tipo principal
     * @param {string} method            Marca si el mensaje es una petición o una respuesta
     * @param {JSON} [data]              Datos del mensaje
     * @param {function} callback        Función que se ejecutará al recibir la respuesta
     * @param {string} sourceId          Identificador del objeto que originó el mensaje
     */
    this.sendMessageToParent = function (type, subtype, method, data, callback, sourceId) {
        this.sendMessage(type,subtype,method,data, parent, callback, sourceId);
    };

    /**
     * Envía mensajes a un objeto y los añade a la cola de mensajes
     *
     * @param {string} type              Tipo de mensaje: trazas | estados
     * @param {string} subtype           Subtipo de mensaje dentro del tipo principal
     * @param {string} method            Marca si el mensaje es una petición o una respuesta
     * @param {JSON} [data]              Datos del mensaje
     * @param {object} target            Objeto destinatario del mensaje
     * @param {function} callback        Función que se ejecutará al recibir la respuesta
     * @param {string} sourceId          Identificador del objeto que originó el mensaje
     */
    this.sendMessage = function (type, subtype, method, data, target, callback, sourceId) {
        var currentMessageId = communicationMessageId++;
        var sourceContainerId = Mae.Utils.getFileFromUrl(window.location.href);

        var msg = {
            messageId: currentMessageId,
            method: method,
            type: type,
            subtype: subtype,
            time: Date.now(),
            data: data,
            sourceId: sourceId,
            sourceContainerId: sourceContainerId
        };

        if (callback != null) {
            communicationMessageCallbacks[currentMessageId] = callback;
        }

        communicationMessagesPool.push(msg);
        purgeMessages();

        target.postMessage(msg, '*');
    };

    /**
     * Envía una respuesta a un mensaje
     *
     * @param {object} messageEvent
     * @param {string} status
     */
    this.sendResponse = function(messageEvent, status) {
        var msg = {
            messageId: messageEvent.data.messageId,
            method: Mae.Com.Messenger.MENSAJES_METHOD.RESPUESTA,
            type: messageEvent.data.type,
            subtype: messageEvent.data.subtype,
            time: Date.now(),
            status: status,
            data: messageEvent.data.data
        };

        messageEvent.source.postMessage(msg, '*');
    };

    /**
     * Recibe los mensajes que llegan al contenedor tanto de nuevas peticiones como de respuestas
     *
     * @param {Object} event
     */
    var receiveMessage = function (event) {
        var message = event.data;

        if (message.method == Mae.Com.Messenger.MENSAJES_METHOD.PETICION) {
            requestHandler.call(undefined, event);
        } else if(Mae.Com.Messenger.MENSAJES_METHOD.RESPUESTA) {
            processResponseCallbacks(message);
        }
    };

    /**
     * Procesa los callback asociados a la respuesta del mensaje
     *
     * @param {Object} message
     */
    function processResponseCallbacks(message) {
        var callBacks = communicationMessageCallbacks[message.messageId];

        if (callBacks != null) {
            switch (message.status) {
                case Mae.Com.Messenger.MESSAGES_RESPONSE_STATUS.SUCCESS:
                    callBacks.onSuccess && callBacks.onSuccess.call(undefined, message.data);
                    break;
                case Mae.Com.Messenger.MESSAGES_RESPONSE_STATUS.ERROR:
                    callBacks.onError && callBacks.onError.call(undefined, message);
                    break;
            }
            callBacks.onComplete && callBacks.onComplete.call(undefined, message);
            communicationMessageCallbacks[message.messageId] = null;
        }
    }

    /**
     * Procesa los mensajes en los que ha expirado el tiempo de espera para recibir una respuesta
     *
     * Esta function creara llamadas recursivas en cada uno de los tiempos de expiracíon que tienen los
     * mensajes que aún quedan en la cola de mensajes esperando respuesta.
     */
    var purgeMessages = function() {
        if (communicationMessagesPool.length === 0) {
            return;
        }
        var nextMessageTime = communicationMessagesPool[0].time;
        if (Date.now() > nextMessageTime + COMMUNICATION_TIMEOUT) {
            // El mensaje ya está caducado. Se quita de la cola de mensajes, se llaman a los callbacks
            // necesarios y se limpian
            var message = communicationMessagesPool.shift();
            message.status = Mae.Com.Messenger.MESSAGES_RESPONSE_STATUS.ERROR;
            message.error = Mae.Com.Messenger.MESSAGES_RESPONSE_ERRORS.TIMEOUT;

            var messageCallbacks = communicationMessageCallbacks[message.messageId];
            if (messageCallbacks != null) {
                messageCallbacks.onError && messageCallbacks.onError.call(undefined, message);
                messageCallbacks.onComplete && messageCallbacks.onComplete.call(undefined, message);
                communicationMessageCallbacks[message.messageId] = null;
                purgeMessages();
            }
        } else {
            // Programa la siguiente ejecución en el momento en el que caduca el próximo mensaje
            setTimeout(purgeMessages, nextMessageTime + COMMUNICATION_TIMEOUT);
        }
    };

    /**
     * Almacena el manejador que se ocupara de manejar las respuestas de los mensajes
     *
     * @param {function} handler
     */
    this.setRequestHandler = function(handler) {
        requestHandler = handler;
    };

    /**
     * Añade el listener para procesar los mensajes recibidos conservando los listener anteriores
     *
     */
    var attachOnMessageListener = function () {
        var originalListner = window.onmessage;
        window.onmessage = function (e) {

            originalListner && originalListner(e);
            receiveMessage(e);
        };
    };

    var initialize = function () {
        parent = window.parent;
        communicationMessageCallbacks = [];
        communicationMessagesPool = [];

        requestHandler = function() {};
        attachOnMessageListener();
    };

    initialize();
};

Mae.Com.Messenger.MENSAJES_METHOD = (function () {
    return {
        PETICION: "peticion",
        RESPUESTA: "respuesta"
    };
})();

Mae.Com.Messenger.MENSAJES_TRAZAS = (function () {
    return {
        INICIO_EJECUCION: "inicioEjecucion",
        FIN_EJECUCION: "finEjecucion",
        VER_SOLUCION: "verSolucion"
    };
})();


Mae.Com.Messenger.MENSAJES_ESTADOS = (function () {
    return {
        ALMACENA_ESTADO: "almacenaEstado",
        RECUPERA_CONFIGURACION: "recuperaEstado"
    };
})();

Mae.Com.Messenger.MENSAJES_TIPOS = (function () {
    return {
        ESTADO: "estado",
        TRAZA: "traza"
    };
})();

Mae.Com.Messenger.MESSAGES_RESPONSE_STATUS = (function () {
    return {
        SUCCESS: "success",
        ERROR: "error"
    };
})();

Mae.Com.Messenger.MESSAGES_RESPONSE_ERRORS = (function () {
    return {
        TIMEOUT: "timeout"
    };
})();

Mae.Utils = {

    /**
     * Obtiene la parte correspondiente al fichero de una url
     *
     * @param url
     * @returns {string}
     */
    getFileFromUrl: function (url) {
        var cleanUrl = url.substr(0, url.lastIndexOf('.')) || url;
        return decodeURIComponent(cleanUrl.split('/').pop());
    },

    /**
     * Recursively merge properties of two objects
     */
    MergeArray: function (obj1, obj2) {
        for (var property in obj2) {
            if (obj2.hasOwnProperty(property)) {
                // Property in destination object set; update its value.
                if (obj2[property].constructor == Object) {
                    obj1[property] = Mae.Utils.MergeArray(obj1[property], obj2[property]);
                } else {
                    obj1[property] = obj2[property];
                }
            } else {
                // Property in destination object not set; create it and set its value.
                obj1[property] = obj2[property];
            }
        }
        return obj1;
    }
};