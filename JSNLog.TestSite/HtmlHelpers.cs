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
            // Keep the cache buster the same when reloading the page.
            // If you don't, the browser will think the cache busted js files is different
            // every time you reload the page, making debugging very hard.

            string cacheBuster = HttpContext.Current.Request.QueryString["cachebuster"];
            return new MvcHtmlString($@"<script src=""{url}?cachebuster={cacheBuster}""></script>");
        }

        public static MvcHtmlString AnchorTag(this HtmlHelper helper, string url, string title)
        {
            string cacheBuster = Guid.NewGuid().ToString();
            return new MvcHtmlString($@"<a target=""_blank"" href=""{url}?cachebuster={cacheBuster}"">{title}</a>");
        }
    }
}
