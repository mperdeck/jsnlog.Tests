/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>

describe("maxMessages", function () {
    describe("Simple", function () {

        beforeEach(function () {
            JL.setOptions({ maxMessages: 10 });
        });

        afterEach(function () {
            JL.setOptions({ maxMessages: null });
        });

        // nbrLoggers, nbrAppenders, nbr of messages that should have been sent, array with nbr messages through each logger
        var scenarios = [
            // Log below the limit
            { nbrLoggers: 1, nbrAppenders: 1, nbrOfMessagesExpected: 2, nbrMessagesEachLogger: 2 },
            { nbrLoggers: 1, nbrAppenders: 2, nbrOfMessagesExpected: 8, nbrMessagesEachLogger: 4 },
            { nbrLoggers: 3, nbrAppenders: 1, nbrOfMessagesExpected: 6, nbrMessagesEachLogger: 2 },
            // Log to the limit
            { nbrLoggers: 1, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 10 },
            { nbrLoggers: 1, nbrAppenders: 2, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 5 },
            { nbrLoggers: 2, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 5 },
            // Log over the limit
            { nbrLoggers: 1, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 11 },
            { nbrLoggers: 1, nbrAppenders: 2, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 6 },
            { nbrLoggers: 3, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 5 }
        ];

        // test each scenario
        for (let s = 0; s < scenarios.length; s++) {
            var title =
                "Simple case: " +
                scenarios[s].nbrAppenders.toString() + " appenders, " +
                scenarios[s].nbrLoggers.toString() + " loggers, " +
                scenarios[s].nbrOfMessagesExpected.toString() + " messages expected to be sent";

            it(title, function () {

                JLTestUtils.runTestMultiple(
                    scenarios[s].nbrLoggers, scenarios[s].nbrAppenders, function (loggers, appenders, xhr, callsToSend) {
                        let messageIdxRef = { messageIdx: 0 };
                        for (let lg = 0; lg < scenarios[s].nbrLoggers; lg++) {
                            JLTestUtils.logMessages(loggers[lg], JL.getFatalLevel(), scenarios[s].nbrMessagesEachLogger, messageIdxRef);
                        }

                        JLTestUtils.checkMessages(scenarios[s].nbrOfMessagesExpected, callsToSend);
                    });
            }); // it
        } // for
    });

    describe("Used with trace buffer", function () {
        var bufferScenarios = [
            // Log below the limit
            { nbrNormalMessages: 1, nbrTraceMessages: 1, nbrFatalMessages: 2, nbrOfMessagesExpected: 2 },
        ];

        // test each scenario
        for (let s = 0; s < bufferScenarios.length; s++) {
            var title =
                "Using trace messages buffer: " +
                bufferScenarios[s].nbrNormalMessages.toString() + " normal messages, " +
                bufferScenarios[s].nbrTraceMessages.toString() + " trace messages, " +
                bufferScenarios[s].nbrFatalMessages.toString() + " fatal messages, " +
                bufferScenarios[s].nbrOfMessagesExpected.toString() + " messages expected to be sent";

            it(title, function () {

                JLTestUtils.runTest(
                    function (logger, appender, xhr, callsToSend) {

                        appender.setOptions({
                            level: JL.getInfoLevel(),
                            storeInBufferLevel: JL.getTraceLevel(),
                            sendWithBufferLevel: JL.getFatalLevel(),
                            bufferSize: 10
                        })

                        let messageIdxRef = { messageIdx: 0 };
                        JLTestUtils.logMessages(logger, JL.getTraceLevel(), bufferScenarios[s].nbrTraceMessages, messageIdxRef);
                        JLTestUtils.logMessages(logger, JL.getWarnLevel(), bufferScenarios[s].nbrNormalMessages, messageIdxRef);
                        JLTestUtils.logMessages(logger, JL.getFatalLevel(), bufferScenarios[s].nbrFatalMessages, messageIdxRef);

                        JLTestUtils.checkMessages(bufferScenarios[s].nbrOfMessagesExpected, callsToSend);
                    });
            }); // it
        } // for
    });
});

