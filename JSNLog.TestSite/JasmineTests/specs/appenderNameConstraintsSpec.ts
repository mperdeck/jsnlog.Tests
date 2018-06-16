/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>
/// <reference types="jquery"/>
/// <reference types="jasmine"/>

var describeTitle: string = "appenderNameConstraints | ";
describe(describeTitle, function () {
    var title: string = "should be unique";
    var mySpec1: any = it(title, function () {
        JLTestUtils.logItTitle(mySpec1.getFullName());

            expect(function() {
                JL.createAjaxAppender('same-name');
                JL.createAjaxAppender('same-name');
            }).toThrow();

        });

    // name should not be '', because that clashes with the default appender
    var title2: string = "should be not empty";
    var mySpec2: any = it(title2, function () {
        JLTestUtils.logItTitle(mySpec2.getFullName());

            expect(function() {
                JL.createAjaxAppender('');
            }).toThrow();

        });

    var title3: string = "should be not undefined";
    var mySpec3: any = it(title3, function () {
        JLTestUtils.logItTitle(mySpec3.getFullName());

            expect(function() {
                (<any>JL).createAjaxAppender();
            }).toThrow();

        });
});

