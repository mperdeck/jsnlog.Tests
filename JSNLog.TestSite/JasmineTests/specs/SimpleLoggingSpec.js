/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>

describe("Simple Logging", function () {

    it("should log fatal event", function () {
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {
            logger.fatal("Fatal event");

            expect(callsToSend.count()).toEqual(1);
            var sentMessage = callsToSend.mostRecent().args[0];
            expect(sentMessage).toContain('"m":"Fatal event"');
        });
    });

    it("should log multiple fatal events", function () {
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {
            logger.fatal("Fatal event 0");
            logger.fatal("Fatal event 1");
            logger.fatal("Fatal event 2");

            expect(callsToSend.count()).toEqual(3);

            expect(callsToSend.argsFor(0)[0]).toContain('"m":"Fatal event 0"');
            expect(callsToSend.argsFor(1)[0]).toContain('"m":"Fatal event 1"');
            expect(callsToSend.argsFor(2)[0]).toContain('"m":"Fatal event 2"');
        });
    });
});

