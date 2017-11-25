/// <reference path="../scripts/JLTestUtils.ts"/>
/// <reference path="../../../jsnlog.js/jsnlog.ts"/>

describe("Simple Logging", function () {

    it("should log fatal event", function () {
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {
            logger.fatal("Fatal event");

            var sentMessage = expect(callsToSend.count()).toEqual(1);
            var sentMessage = callsToSend.mostRecent().args[0];
            expect(sentMessage).toContain('"m":"Fatal event"');
        });
    });
});

