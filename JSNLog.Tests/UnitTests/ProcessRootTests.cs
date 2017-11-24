using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Xunit;
using JSNLog.LogHandling;
using System.Xml;
using JSNLog.Infrastructure;
using System.Text;
using JSNLog.Exceptions;
using JSNLog.Tests.Common;

namespace JSNLog.Tests.UnitTests
{
    /// <summary>
    /// Tests of the translation from web.config to JavaScript
    /// </summary>

    [Collection("JSNLog")]
    public class ProcessRootTests
    {
        [Fact]
        public void SetBatchTimeout()
        {
            // Arrange

            string configXml = @"
                <jsnlog>
    <ajaxAppender name=""da11"" batchTimeout=""500"" />
</jsnlog>
";

            string Js = ToJavaScript(configXml);

            // Assert

            Assert.Matches(@"\""batchTimeout\"": 500", Js);
        }

        [Fact]
        public void MaxBatchSizeEqualToBatchSize()
        {
            // Arrange

            string configXml = @"
                <jsnlog>
    <ajaxAppender name=""aa"" batchSize=""10"" maxBatchSize=""10"" level=""2300"" />
</jsnlog>
";
            string Js = ToJavaScript(configXml);

            // Act and Assert
            Assert.Matches(@"\""batchSize\"": 10", Js);
            Assert.Matches(@"\""maxBatchSize\"": 10", Js);
        }

        [Fact]
        public void MaxBatchSizeGreaterThanBatchSize()
        {
            // Arrange

            string configXml = @"
                <jsnlog>
    <ajaxAppender name=""aa"" batchSize=""10"" maxBatchSize=""11"" level=""2300"" />
</jsnlog>
";
            string Js = ToJavaScript(configXml);

            // Act and Assert
            Assert.Matches(@"\""batchSize\"": 10", Js);
            Assert.Matches(@"\""maxBatchSize\"": 11", Js);
        }

        private string ToJavaScript(string configXml)
        {
            var sb = new StringBuilder();

            CommonTestHelpers.SetConfigCache(configXml);

            var configProcessor = new ConfigProcessor();
            configProcessor.ProcessRootExec(sb, s => s, "23.89.450.1", "req", false);

            return sb.ToString();
        }
    }
}

