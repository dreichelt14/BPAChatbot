// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, terminDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!terminDialog) throw new Error('[MainDialog]: Missing parameter \'terminDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(terminDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects an apointment request, like "Termin machen mit Reichelt zum Thema BPA"
     * Note that the sample LUIS model will only recognize Rektorin, Professor and Sekretariat as available Person.
     */
    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Wie kann ich dir helfen?\nTippe z.B. sowas "Termin mit Prof. Reichelt zum Thema BPA am 22. Juli 2020"';
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the person, topic and appointment dates.
     * Then, it hands off to the TerminDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const terminDetails = {};

        if (!this.luisRecognizer.isConfigured) {
            // LUIS is not configured, we just run the TerminDialog path.
            return await stepContext.beginDialog('terminDialog', terminDetails);
        }

        // Call LUIS and gather any potential appointment details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'TerminMachen': {
            // Extract the values for the composite entities from the LUIS result.
            const topicEntities = this.luisRecognizer.getTopicEntities(luisResult);
            const personEntities = this.luisRecognizer.getPersonEntities(luisResult);
            // Show a warning for Topic and Destination if we can't resolve them.
            await this.showWarningForUnsupportedCities(stepContext.context, topicEntities, personEntities);

            // Initialize TerminDetails with any entities we may have found in the response.
            terminDetails.person = personEntities.Person;
            terminDetails.betreff = topicEntities.Thema;
            terminDetails.terminDate = this.luisRecognizer.getTerminDate(luisResult);
            console.log('LUIS hat mir geholfen folgende Terminanfrage zu verstehen:', JSON.stringify(terminDetails));

            // Run the TerminDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('terminDialog', terminDetails);
        }

        case 'GetWeather': {
            // We haven't implemented the GetWeatherDialog so we just display a TODO message.
            const getWeatherMessageText = 'TODO: get weather flow here';
            await stepContext.context.sendActivity(getWeatherMessageText, getWeatherMessageText, InputHints.IgnoringInput);
            break;
        }

        default: {
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, das habe ich nicht verstanden. Versuche deine Satz auf eine andere Weise zu formulieren (bei dir war ${ LuisRecognizer.topIntent(luisResult) })`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    /**
     * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
     * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
     * will be empty if those entity values can't be mapped to a canonical item in the Airport.
     */
    async showWarningForUnsupportedCities(context, topicEntities, personEntities) {
        const unsupportedPersonen = [];
        console.log("Tut");
        if (personEntities.mit && !personEntities.Person) {
            unsupportedPersonen.push(personEntities.mit);
        }

        if (unsupportedPersonen.length) {
            const messageText = `Sorry aber ich kenne diese Person nicht: ${ unsupportedPersonen.join(', ') }`;
            await context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
        }
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        // If the child dialog ("TerminDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;
            // Now we have all the booking details.

            // This is where calls to the booking AOU service or database would go.

            // If the call to the booking service was successful tell the user.
            const timeProperty = new TimexProperty(result.travelDate);
            const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
            const msg = `Ich habe einen Terminforschlag an ${ result.destination } zum Thema ${ result.origin } für den ${ travelDateMsg } erstellt.`;
            await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        }

        // Restart the main dialog with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'Was kann ich noch für dich tun?' });
    }
}

module.exports.MainDialog = MainDialog;
