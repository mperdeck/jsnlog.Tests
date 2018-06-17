using System;
using System.Collections.Generic;
using System.Linq;
using JSNLog;
using System.Web.Mvc;
using System.Web;
using JSNLog.Infrastructure;

namespace JSNLog.TestSite.Controllers
{
    public class JasmineTestsController : Controller
    {
        public ActionResult SpecRunner()
        {
            return View();
        }

    }
}
