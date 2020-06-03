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

    getTopicEntities(result) {
        let zumThemaValue;
        if (result.entities.$instance.zum) {
            zumThemaValue = result.entities.$instance.zum[0].text;
        }
        return { Thema: zumThemaValue };
    }

    getPersonEntities(result) {
        let mitPersonValue;
        if (result.entities.$instance.mit) {
            mitPersonValue = result.entities.$instance.mit[0].text;
        }
        return { Person: mitPersonValue };
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
