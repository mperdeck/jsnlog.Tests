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

