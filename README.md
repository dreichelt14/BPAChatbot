# Chatbot für BPA

Praktikumsbeispiel Chatbots

## Aufgabenstellung
- Auf der letzten Etappe des Hauptdialogs (finalStep) müsste unser Chatbot  über MS Teams eine Terminanfrage an den Empfänger senden. In der lokalen Variante des Chatbots bitte stattdessen eine Bestätigung eines erfolgreichen Absendens des Terminvorschlags im Chat darstellen. Die Bestätigung sollte den Empfänger, das Datum und Betreff beinhalten.
- Recogniser bekommt von LUIS mittels Methoden “getTopicEntities” und “getPersonEntities” erkannte Personen und Themen. Ergänzen Sie diese zwei Methoden, um die gewünschte Funktionalität zu gewährleisten. 

## Beschreibung

- Dieser Bot basiert auf einem Beispiel von [Microsoft](https://github.com/Microsoft/BotBuilder-Samples/tree/master/generators/generator-botbuilder#templates)
- Dieser Bot ist mithilfe von [Bot Framework](https://dev.botframework.com) erstellt worden
- Dieser Bot verwendet [LUIS](https://www.luis.ai). Das Luis Model für dieses Beispiel ist unter `cognitiveModels/Terminerstellungjson` zu finden


## Installation

- Module installieren

    ```bash
    npm install
    ```
- Datei `.env` ins Rootverzeichnis kopieren
- Projekt starten mit
    ```bash
    npm start
    ```

### Verbindung mit dem Chatbot

- Bot Framework Emulator öffnen
- File -> Open Bot
- URL eingeben `http://localhost:3978/api/messages`



