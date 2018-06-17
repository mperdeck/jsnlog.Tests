using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace JSNLog.TestSite
{
    public static class HtmlHelpers
    {
        public static MvcHtmlString ScriptTag(this HtmlHelper helper, string url)
        {
            string cacheBuster = Guid.NewGuid().ToString();
            return new MvcHtmlString($@"<script src=""{url}?{cacheBuster}""></script>");
        }
    }
}
