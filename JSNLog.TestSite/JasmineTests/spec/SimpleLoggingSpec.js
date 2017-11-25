describe("Simple Logging", function() {

    it("should log fatal event", function () {
        JL().fatal("Fatal event");

        var sendCalls = TestUtils.xMLHttpRequestMock.send.calls;
        var sentMessage = expect(sendCalls.count()).toEqual(1);
        var sentMessage = sendCalls.mostRecent().args[0];
        expect(sentMessage).toContain('"m":"Fatal event"');
    });
});

