// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');

class TerminErstelungsRecognizer {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            // Set the recognizer options depending on which endpoint version you want to use e.g v2 or v3.
            // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
            const recognizerOptions = {
                apiVersion: 'v3'
            };

            this.recognizer = new LuisRecognizer(config, recognizerOptions);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    //Die von LUIS bekommenen Ergebnisse sind in result gespeichert.
    //Die vereinfachte Beispielstruktur von result ist im Hilfsverzeichnis/LuisStruktur zu finden. 
    //Bitte beachten, dass Person und Betreff sich auf verschiedenen Ebenen der result befinden.
    //Solche Strucktur war notwendig, um in Teams zu funktionieren.
    /**
    * @todo  Person und Betreff Entitäten im Variablen ThemaValue und PersonValue speichern.
    *  
    */
    getTopicEntities(result) {
        let ThemaValue;
        if (result.entities.$instance.zum) {
            ThemaValue = "";
        }
        return { Thema: ThemaValue };
    }

    getPersonEntities(result) {
        let PersonValue;
        if (result.entities.$instance.mit) {
            PersonValue = "";
        }
        return { Person: PersonValue };
    }

    /**
     * This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
     * TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
     */
    getTerminDate(result) {
        const datetimeEntity = result.entities.datetime;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.TerminErstelungsRecognizer = TerminErstelungsRecognizer;
