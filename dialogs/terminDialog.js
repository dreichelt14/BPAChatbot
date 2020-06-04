// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class TerminDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'terminVereinbarungDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.personStep.bind(this),
                this.topicStep.bind(this),
                this.terminDateStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a person has been not provided, prompt for one.
     */
    async personStep(stepContext) {
        const terminDetails = stepContext.options;

        if (!terminDetails.person) {
            const messageText = 'Mit wem möchtest du einen Termin haben?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(terminDetails.person);
    }

    /**
     * If a topic has not been provided, prompt for one.
     */
    async topicStep(stepContext) {
        const terminDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        terminDetails.person = stepContext.result;
        if (!terminDetails.betreff) {
            const messageText = 'Was ist der Betreff?';
            const msg = MessageFactory.text(messageText, 'Was ist der Betreff?', InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(terminDetails.betreff);
    }

    /**
     * If an apointment date has not been provided, prompt for one.
     * This will use the DATE_RESOLVER_DIALOG.
     */
    async terminDateStep(stepContext) {
        const terminDetails = stepContext.options;

        // Capture the results of the previous step
        terminDetails.betreff = stepContext.result;
        if (!terminDetails.terminDate || this.isAmbiguous(terminDetails.terminDate)) {
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: terminDetails.terminDate });
        }
        return await stepContext.next(terminDetails.terminDate);
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const terminDetails = stepContext.options;

        // Capture the results of the previous step
        terminDetails.terminDate = stepContext.result;
        const messageText = `Ich habe einen Terminvorschlag für ${ terminDetails.person } zum Thema ${ terminDetails.betreff } am ${ terminDetails.terminDate }. Ist das Richtig?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg }, "Ja|Nein");
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const terminDetails = stepContext.options;
            return await stepContext.endDialog(terminDetails);
        }
        return await stepContext.endDialog();
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.TerminDialog = TerminDialog;
