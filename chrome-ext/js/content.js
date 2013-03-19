var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4423__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4423 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4423__delegate.call(this, array, i, idxs)
    };
    G__4423.cljs$lang$maxFixedArity = 2;
    G__4423.cljs$lang$applyTo = function(arglist__4424) {
      var array = cljs.core.first(arglist__4424);
      var i = cljs.core.first(cljs.core.next(arglist__4424));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4424));
      return G__4423__delegate(array, i, idxs)
    };
    G__4423.cljs$lang$arity$variadic = G__4423__delegate;
    return G__4423
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3546__auto____4425 = this$;
      if(and__3546__auto____4425) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____4425
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____4426 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4426) {
          return or__3548__auto____4426
        }else {
          var or__3548__auto____4427 = cljs.core._invoke["_"];
          if(or__3548__auto____4427) {
            return or__3548__auto____4427
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____4428 = this$;
      if(and__3546__auto____4428) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____4428
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____4429 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4429) {
          return or__3548__auto____4429
        }else {
          var or__3548__auto____4430 = cljs.core._invoke["_"];
          if(or__3548__auto____4430) {
            return or__3548__auto____4430
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____4431 = this$;
      if(and__3546__auto____4431) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____4431
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____4432 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4432) {
          return or__3548__auto____4432
        }else {
          var or__3548__auto____4433 = cljs.core._invoke["_"];
          if(or__3548__auto____4433) {
            return or__3548__auto____4433
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____4434 = this$;
      if(and__3546__auto____4434) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____4434
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____4435 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4435) {
          return or__3548__auto____4435
        }else {
          var or__3548__auto____4436 = cljs.core._invoke["_"];
          if(or__3548__auto____4436) {
            return or__3548__auto____4436
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____4437 = this$;
      if(and__3546__auto____4437) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____4437
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____4438 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4438) {
          return or__3548__auto____4438
        }else {
          var or__3548__auto____4439 = cljs.core._invoke["_"];
          if(or__3548__auto____4439) {
            return or__3548__auto____4439
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____4440 = this$;
      if(and__3546__auto____4440) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____4440
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____4441 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4441) {
          return or__3548__auto____4441
        }else {
          var or__3548__auto____4442 = cljs.core._invoke["_"];
          if(or__3548__auto____4442) {
            return or__3548__auto____4442
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____4443 = this$;
      if(and__3546__auto____4443) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____4443
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____4444 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4444) {
          return or__3548__auto____4444
        }else {
          var or__3548__auto____4445 = cljs.core._invoke["_"];
          if(or__3548__auto____4445) {
            return or__3548__auto____4445
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____4446 = this$;
      if(and__3546__auto____4446) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____4446
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____4447 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4447) {
          return or__3548__auto____4447
        }else {
          var or__3548__auto____4448 = cljs.core._invoke["_"];
          if(or__3548__auto____4448) {
            return or__3548__auto____4448
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____4449 = this$;
      if(and__3546__auto____4449) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____4449
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____4450 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4450) {
          return or__3548__auto____4450
        }else {
          var or__3548__auto____4451 = cljs.core._invoke["_"];
          if(or__3548__auto____4451) {
            return or__3548__auto____4451
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____4452 = this$;
      if(and__3546__auto____4452) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____4452
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____4453 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4453) {
          return or__3548__auto____4453
        }else {
          var or__3548__auto____4454 = cljs.core._invoke["_"];
          if(or__3548__auto____4454) {
            return or__3548__auto____4454
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____4455 = this$;
      if(and__3546__auto____4455) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____4455
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____4456 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4456) {
          return or__3548__auto____4456
        }else {
          var or__3548__auto____4457 = cljs.core._invoke["_"];
          if(or__3548__auto____4457) {
            return or__3548__auto____4457
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____4458 = this$;
      if(and__3546__auto____4458) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____4458
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____4459 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4459) {
          return or__3548__auto____4459
        }else {
          var or__3548__auto____4460 = cljs.core._invoke["_"];
          if(or__3548__auto____4460) {
            return or__3548__auto____4460
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____4461 = this$;
      if(and__3546__auto____4461) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____4461
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____4462 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4462) {
          return or__3548__auto____4462
        }else {
          var or__3548__auto____4463 = cljs.core._invoke["_"];
          if(or__3548__auto____4463) {
            return or__3548__auto____4463
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____4464 = this$;
      if(and__3546__auto____4464) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____4464
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____4465 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4465) {
          return or__3548__auto____4465
        }else {
          var or__3548__auto____4466 = cljs.core._invoke["_"];
          if(or__3548__auto____4466) {
            return or__3548__auto____4466
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____4467 = this$;
      if(and__3546__auto____4467) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____4467
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____4468 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4468) {
          return or__3548__auto____4468
        }else {
          var or__3548__auto____4469 = cljs.core._invoke["_"];
          if(or__3548__auto____4469) {
            return or__3548__auto____4469
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____4470 = this$;
      if(and__3546__auto____4470) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____4470
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____4471 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4471) {
          return or__3548__auto____4471
        }else {
          var or__3548__auto____4472 = cljs.core._invoke["_"];
          if(or__3548__auto____4472) {
            return or__3548__auto____4472
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____4473 = this$;
      if(and__3546__auto____4473) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____4473
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____4474 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4474) {
          return or__3548__auto____4474
        }else {
          var or__3548__auto____4475 = cljs.core._invoke["_"];
          if(or__3548__auto____4475) {
            return or__3548__auto____4475
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____4476 = this$;
      if(and__3546__auto____4476) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____4476
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____4477 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4477) {
          return or__3548__auto____4477
        }else {
          var or__3548__auto____4478 = cljs.core._invoke["_"];
          if(or__3548__auto____4478) {
            return or__3548__auto____4478
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____4479 = this$;
      if(and__3546__auto____4479) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____4479
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____4480 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4480) {
          return or__3548__auto____4480
        }else {
          var or__3548__auto____4481 = cljs.core._invoke["_"];
          if(or__3548__auto____4481) {
            return or__3548__auto____4481
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____4482 = this$;
      if(and__3546__auto____4482) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____4482
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____4483 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4483) {
          return or__3548__auto____4483
        }else {
          var or__3548__auto____4484 = cljs.core._invoke["_"];
          if(or__3548__auto____4484) {
            return or__3548__auto____4484
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____4485 = this$;
      if(and__3546__auto____4485) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____4485
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____4486 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4486) {
          return or__3548__auto____4486
        }else {
          var or__3548__auto____4487 = cljs.core._invoke["_"];
          if(or__3548__auto____4487) {
            return or__3548__auto____4487
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3546__auto____4488 = coll;
    if(and__3546__auto____4488) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____4488
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4489 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4489) {
        return or__3548__auto____4489
      }else {
        var or__3548__auto____4490 = cljs.core._count["_"];
        if(or__3548__auto____4490) {
          return or__3548__auto____4490
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3546__auto____4491 = coll;
    if(and__3546__auto____4491) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____4491
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4492 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4492) {
        return or__3548__auto____4492
      }else {
        var or__3548__auto____4493 = cljs.core._empty["_"];
        if(or__3548__auto____4493) {
          return or__3548__auto____4493
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3546__auto____4494 = coll;
    if(and__3546__auto____4494) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____4494
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____4495 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4495) {
        return or__3548__auto____4495
      }else {
        var or__3548__auto____4496 = cljs.core._conj["_"];
        if(or__3548__auto____4496) {
          return or__3548__auto____4496
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3546__auto____4497 = coll;
      if(and__3546__auto____4497) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____4497
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____4498 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4498) {
          return or__3548__auto____4498
        }else {
          var or__3548__auto____4499 = cljs.core._nth["_"];
          if(or__3548__auto____4499) {
            return or__3548__auto____4499
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____4500 = coll;
      if(and__3546__auto____4500) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____4500
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____4501 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4501) {
          return or__3548__auto____4501
        }else {
          var or__3548__auto____4502 = cljs.core._nth["_"];
          if(or__3548__auto____4502) {
            return or__3548__auto____4502
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3546__auto____4503 = coll;
    if(and__3546__auto____4503) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____4503
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4504 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4504) {
        return or__3548__auto____4504
      }else {
        var or__3548__auto____4505 = cljs.core._first["_"];
        if(or__3548__auto____4505) {
          return or__3548__auto____4505
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____4506 = coll;
    if(and__3546__auto____4506) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____4506
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4507 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4507) {
        return or__3548__auto____4507
      }else {
        var or__3548__auto____4508 = cljs.core._rest["_"];
        if(or__3548__auto____4508) {
          return or__3548__auto____4508
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3546__auto____4509 = o;
      if(and__3546__auto____4509) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____4509
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____4510 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4510) {
          return or__3548__auto____4510
        }else {
          var or__3548__auto____4511 = cljs.core._lookup["_"];
          if(or__3548__auto____4511) {
            return or__3548__auto____4511
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____4512 = o;
      if(and__3546__auto____4512) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____4512
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____4513 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4513) {
          return or__3548__auto____4513
        }else {
          var or__3548__auto____4514 = cljs.core._lookup["_"];
          if(or__3548__auto____4514) {
            return or__3548__auto____4514
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3546__auto____4515 = coll;
    if(and__3546__auto____4515) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____4515
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4516 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4516) {
        return or__3548__auto____4516
      }else {
        var or__3548__auto____4517 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____4517) {
          return or__3548__auto____4517
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____4518 = coll;
    if(and__3546__auto____4518) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____4518
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____4519 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4519) {
        return or__3548__auto____4519
      }else {
        var or__3548__auto____4520 = cljs.core._assoc["_"];
        if(or__3548__auto____4520) {
          return or__3548__auto____4520
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3546__auto____4521 = coll;
    if(and__3546__auto____4521) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____4521
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4522 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4522) {
        return or__3548__auto____4522
      }else {
        var or__3548__auto____4523 = cljs.core._dissoc["_"];
        if(or__3548__auto____4523) {
          return or__3548__auto____4523
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3546__auto____4524 = coll;
    if(and__3546__auto____4524) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____4524
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4525 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4525) {
        return or__3548__auto____4525
      }else {
        var or__3548__auto____4526 = cljs.core._key["_"];
        if(or__3548__auto____4526) {
          return or__3548__auto____4526
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____4527 = coll;
    if(and__3546__auto____4527) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____4527
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4528 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4528) {
        return or__3548__auto____4528
      }else {
        var or__3548__auto____4529 = cljs.core._val["_"];
        if(or__3548__auto____4529) {
          return or__3548__auto____4529
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3546__auto____4530 = coll;
    if(and__3546__auto____4530) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____4530
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____4531 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4531) {
        return or__3548__auto____4531
      }else {
        var or__3548__auto____4532 = cljs.core._disjoin["_"];
        if(or__3548__auto____4532) {
          return or__3548__auto____4532
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3546__auto____4533 = coll;
    if(and__3546__auto____4533) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____4533
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4534 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4534) {
        return or__3548__auto____4534
      }else {
        var or__3548__auto____4535 = cljs.core._peek["_"];
        if(or__3548__auto____4535) {
          return or__3548__auto____4535
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____4536 = coll;
    if(and__3546__auto____4536) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____4536
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4537 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4537) {
        return or__3548__auto____4537
      }else {
        var or__3548__auto____4538 = cljs.core._pop["_"];
        if(or__3548__auto____4538) {
          return or__3548__auto____4538
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3546__auto____4539 = coll;
    if(and__3546__auto____4539) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____4539
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____4540 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4540) {
        return or__3548__auto____4540
      }else {
        var or__3548__auto____4541 = cljs.core._assoc_n["_"];
        if(or__3548__auto____4541) {
          return or__3548__auto____4541
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3546__auto____4542 = o;
    if(and__3546__auto____4542) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____4542
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4543 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____4543) {
        return or__3548__auto____4543
      }else {
        var or__3548__auto____4544 = cljs.core._deref["_"];
        if(or__3548__auto____4544) {
          return or__3548__auto____4544
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3546__auto____4545 = o;
    if(and__3546__auto____4545) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____4545
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____4546 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____4546) {
        return or__3548__auto____4546
      }else {
        var or__3548__auto____4547 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____4547) {
          return or__3548__auto____4547
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3546__auto____4548 = o;
    if(and__3546__auto____4548) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____4548
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4549 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4549) {
        return or__3548__auto____4549
      }else {
        var or__3548__auto____4550 = cljs.core._meta["_"];
        if(or__3548__auto____4550) {
          return or__3548__auto____4550
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3546__auto____4551 = o;
    if(and__3546__auto____4551) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____4551
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____4552 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4552) {
        return or__3548__auto____4552
      }else {
        var or__3548__auto____4553 = cljs.core._with_meta["_"];
        if(or__3548__auto____4553) {
          return or__3548__auto____4553
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3546__auto____4554 = coll;
      if(and__3546__auto____4554) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____4554
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____4555 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4555) {
          return or__3548__auto____4555
        }else {
          var or__3548__auto____4556 = cljs.core._reduce["_"];
          if(or__3548__auto____4556) {
            return or__3548__auto____4556
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____4557 = coll;
      if(and__3546__auto____4557) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____4557
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____4558 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4558) {
          return or__3548__auto____4558
        }else {
          var or__3548__auto____4559 = cljs.core._reduce["_"];
          if(or__3548__auto____4559) {
            return or__3548__auto____4559
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3546__auto____4560 = coll;
    if(and__3546__auto____4560) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____4560
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____4561 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4561) {
        return or__3548__auto____4561
      }else {
        var or__3548__auto____4562 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____4562) {
          return or__3548__auto____4562
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3546__auto____4563 = o;
    if(and__3546__auto____4563) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____4563
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____4564 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____4564) {
        return or__3548__auto____4564
      }else {
        var or__3548__auto____4565 = cljs.core._equiv["_"];
        if(or__3548__auto____4565) {
          return or__3548__auto____4565
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3546__auto____4566 = o;
    if(and__3546__auto____4566) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____4566
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4567 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____4567) {
        return or__3548__auto____4567
      }else {
        var or__3548__auto____4568 = cljs.core._hash["_"];
        if(or__3548__auto____4568) {
          return or__3548__auto____4568
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3546__auto____4569 = o;
    if(and__3546__auto____4569) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____4569
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4570 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4570) {
        return or__3548__auto____4570
      }else {
        var or__3548__auto____4571 = cljs.core._seq["_"];
        if(or__3548__auto____4571) {
          return or__3548__auto____4571
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3546__auto____4572 = coll;
    if(and__3546__auto____4572) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____4572
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4573 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4573) {
        return or__3548__auto____4573
      }else {
        var or__3548__auto____4574 = cljs.core._rseq["_"];
        if(or__3548__auto____4574) {
          return or__3548__auto____4574
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4575 = coll;
    if(and__3546__auto____4575) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____4575
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4576 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4576) {
        return or__3548__auto____4576
      }else {
        var or__3548__auto____4577 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____4577) {
          return or__3548__auto____4577
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4578 = coll;
    if(and__3546__auto____4578) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____4578
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4579 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4579) {
        return or__3548__auto____4579
      }else {
        var or__3548__auto____4580 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____4580) {
          return or__3548__auto____4580
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____4581 = coll;
    if(and__3546__auto____4581) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____4581
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____4582 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4582) {
        return or__3548__auto____4582
      }else {
        var or__3548__auto____4583 = cljs.core._entry_key["_"];
        if(or__3548__auto____4583) {
          return or__3548__auto____4583
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____4584 = coll;
    if(and__3546__auto____4584) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____4584
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4585 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4585) {
        return or__3548__auto____4585
      }else {
        var or__3548__auto____4586 = cljs.core._comparator["_"];
        if(or__3548__auto____4586) {
          return or__3548__auto____4586
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3546__auto____4587 = o;
    if(and__3546__auto____4587) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____4587
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____4588 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4588) {
        return or__3548__auto____4588
      }else {
        var or__3548__auto____4589 = cljs.core._pr_seq["_"];
        if(or__3548__auto____4589) {
          return or__3548__auto____4589
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3546__auto____4590 = d;
    if(and__3546__auto____4590) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____4590
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____4591 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____4591) {
        return or__3548__auto____4591
      }else {
        var or__3548__auto____4592 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____4592) {
          return or__3548__auto____4592
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3546__auto____4593 = this$;
    if(and__3546__auto____4593) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____4593
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____4594 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4594) {
        return or__3548__auto____4594
      }else {
        var or__3548__auto____4595 = cljs.core._notify_watches["_"];
        if(or__3548__auto____4595) {
          return or__3548__auto____4595
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____4596 = this$;
    if(and__3546__auto____4596) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____4596
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____4597 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4597) {
        return or__3548__auto____4597
      }else {
        var or__3548__auto____4598 = cljs.core._add_watch["_"];
        if(or__3548__auto____4598) {
          return or__3548__auto____4598
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____4599 = this$;
    if(and__3546__auto____4599) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____4599
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____4600 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4600) {
        return or__3548__auto____4600
      }else {
        var or__3548__auto____4601 = cljs.core._remove_watch["_"];
        if(or__3548__auto____4601) {
          return or__3548__auto____4601
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3546__auto____4602 = coll;
    if(and__3546__auto____4602) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____4602
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4603 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4603) {
        return or__3548__auto____4603
      }else {
        var or__3548__auto____4604 = cljs.core._as_transient["_"];
        if(or__3548__auto____4604) {
          return or__3548__auto____4604
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3546__auto____4605 = tcoll;
    if(and__3546__auto____4605) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____4605
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____4606 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4606) {
        return or__3548__auto____4606
      }else {
        var or__3548__auto____4607 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____4607) {
          return or__3548__auto____4607
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4608 = tcoll;
    if(and__3546__auto____4608) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____4608
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4609 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4609) {
        return or__3548__auto____4609
      }else {
        var or__3548__auto____4610 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____4610) {
          return or__3548__auto____4610
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3546__auto____4611 = tcoll;
    if(and__3546__auto____4611) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____4611
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____4612 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4612) {
        return or__3548__auto____4612
      }else {
        var or__3548__auto____4613 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____4613) {
          return or__3548__auto____4613
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3546__auto____4614 = tcoll;
    if(and__3546__auto____4614) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____4614
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____4615 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4615) {
        return or__3548__auto____4615
      }else {
        var or__3548__auto____4616 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____4616) {
          return or__3548__auto____4616
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3546__auto____4617 = tcoll;
    if(and__3546__auto____4617) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____4617
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____4618 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4618) {
        return or__3548__auto____4618
      }else {
        var or__3548__auto____4619 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____4619) {
          return or__3548__auto____4619
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4620 = tcoll;
    if(and__3546__auto____4620) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____4620
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4621 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4621) {
        return or__3548__auto____4621
      }else {
        var or__3548__auto____4622 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____4622) {
          return or__3548__auto____4622
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3546__auto____4623 = tcoll;
    if(and__3546__auto____4623) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____4623
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____4624 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4624) {
        return or__3548__auto____4624
      }else {
        var or__3548__auto____4625 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____4625) {
          return or__3548__auto____4625
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3548__auto____4626 = x === y;
    if(or__3548__auto____4626) {
      return or__3548__auto____4626
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4627__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4628 = y;
            var G__4629 = cljs.core.first.call(null, more);
            var G__4630 = cljs.core.next.call(null, more);
            x = G__4628;
            y = G__4629;
            more = G__4630;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4627 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4627__delegate.call(this, x, y, more)
    };
    G__4627.cljs$lang$maxFixedArity = 2;
    G__4627.cljs$lang$applyTo = function(arglist__4631) {
      var x = cljs.core.first(arglist__4631);
      var y = cljs.core.first(cljs.core.next(arglist__4631));
      var more = cljs.core.rest(cljs.core.next(arglist__4631));
      return G__4627__delegate(x, y, more)
    };
    G__4627.cljs$lang$arity$variadic = G__4627__delegate;
    return G__4627
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3548__auto____4632 = x == null;
    if(or__3548__auto____4632) {
      return or__3548__auto____4632
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4633 = null;
  var G__4633__2 = function(o, k) {
    return null
  };
  var G__4633__3 = function(o, k, not_found) {
    return not_found
  };
  G__4633 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4633__2.call(this, o, k);
      case 3:
        return G__4633__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4633
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4634 = null;
  var G__4634__2 = function(_, f) {
    return f.call(null)
  };
  var G__4634__3 = function(_, f, start) {
    return start
  };
  G__4634 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4634__2.call(this, _, f);
      case 3:
        return G__4634__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4634
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__4635 = null;
  var G__4635__2 = function(_, n) {
    return null
  };
  var G__4635__3 = function(_, n, not_found) {
    return not_found
  };
  G__4635 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4635__2.call(this, _, n);
      case 3:
        return G__4635__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4635
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4636 = cljs.core._nth.call(null, cicoll, 0);
      var n__4637 = 1;
      while(true) {
        if(n__4637 < cljs.core._count.call(null, cicoll)) {
          var nval__4638 = f.call(null, val__4636, cljs.core._nth.call(null, cicoll, n__4637));
          if(cljs.core.reduced_QMARK_.call(null, nval__4638)) {
            return cljs.core.deref.call(null, nval__4638)
          }else {
            var G__4645 = nval__4638;
            var G__4646 = n__4637 + 1;
            val__4636 = G__4645;
            n__4637 = G__4646;
            continue
          }
        }else {
          return val__4636
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4639 = val;
    var n__4640 = 0;
    while(true) {
      if(n__4640 < cljs.core._count.call(null, cicoll)) {
        var nval__4641 = f.call(null, val__4639, cljs.core._nth.call(null, cicoll, n__4640));
        if(cljs.core.reduced_QMARK_.call(null, nval__4641)) {
          return cljs.core.deref.call(null, nval__4641)
        }else {
          var G__4647 = nval__4641;
          var G__4648 = n__4640 + 1;
          val__4639 = G__4647;
          n__4640 = G__4648;
          continue
        }
      }else {
        return val__4639
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4642 = val;
    var n__4643 = idx;
    while(true) {
      if(n__4643 < cljs.core._count.call(null, cicoll)) {
        var nval__4644 = f.call(null, val__4642, cljs.core._nth.call(null, cicoll, n__4643));
        if(cljs.core.reduced_QMARK_.call(null, nval__4644)) {
          return cljs.core.deref.call(null, nval__4644)
        }else {
          var G__4649 = nval__4644;
          var G__4650 = n__4643 + 1;
          val__4642 = G__4649;
          n__4643 = G__4650;
          continue
        }
      }else {
        return val__4642
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4651 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4652 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4653 = this;
  var this$__4654 = this;
  return cljs.core.pr_str.call(null, this$__4654)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4655 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4655.a)) {
    return cljs.core.ci_reduce.call(null, this__4655.a, f, this__4655.a[this__4655.i], this__4655.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4655.a[this__4655.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4656 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4656.a)) {
    return cljs.core.ci_reduce.call(null, this__4656.a, f, start, this__4656.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4657 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4658 = this;
  return this__4658.a.length - this__4658.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4659 = this;
  return this__4659.a[this__4659.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4660 = this;
  if(this__4660.i + 1 < this__4660.a.length) {
    return new cljs.core.IndexedSeq(this__4660.a, this__4660.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4661 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4662 = this;
  var i__4663 = n + this__4662.i;
  if(i__4663 < this__4662.a.length) {
    return this__4662.a[i__4663]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4664 = this;
  var i__4665 = n + this__4664.i;
  if(i__4665 < this__4664.a.length) {
    return this__4664.a[i__4665]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__4666 = null;
  var G__4666__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4666__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4666 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4666__2.call(this, array, f);
      case 3:
        return G__4666__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4666
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4667 = null;
  var G__4667__2 = function(array, k) {
    return array[k]
  };
  var G__4667__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4667 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4667__2.call(this, array, k);
      case 3:
        return G__4667__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4667
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4668 = null;
  var G__4668__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4668__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4668 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4668__2.call(this, array, n);
      case 3:
        return G__4668__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4668
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__4669__4670 = coll;
      if(G__4669__4670 != null) {
        if(function() {
          var or__3548__auto____4671 = G__4669__4670.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____4671) {
            return or__3548__auto____4671
          }else {
            return G__4669__4670.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4669__4670.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4669__4670)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4669__4670)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4672__4673 = coll;
      if(G__4672__4673 != null) {
        if(function() {
          var or__3548__auto____4674 = G__4672__4673.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4674) {
            return or__3548__auto____4674
          }else {
            return G__4672__4673.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4672__4673.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4672__4673)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4672__4673)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4675 = cljs.core.seq.call(null, coll);
      if(s__4675 != null) {
        return cljs.core._first.call(null, s__4675)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4676__4677 = coll;
      if(G__4676__4677 != null) {
        if(function() {
          var or__3548__auto____4678 = G__4676__4677.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4678) {
            return or__3548__auto____4678
          }else {
            return G__4676__4677.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4676__4677.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4676__4677)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4676__4677)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4679 = cljs.core.seq.call(null, coll);
      if(s__4679 != null) {
        return cljs.core._rest.call(null, s__4679)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4680__4681 = coll;
      if(G__4680__4681 != null) {
        if(function() {
          var or__3548__auto____4682 = G__4680__4681.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4682) {
            return or__3548__auto____4682
          }else {
            return G__4680__4681.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4680__4681.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4680__4681)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4680__4681)
      }
    }()) {
      var coll__4683 = cljs.core._rest.call(null, coll);
      if(coll__4683 != null) {
        if(function() {
          var G__4684__4685 = coll__4683;
          if(G__4684__4685 != null) {
            if(function() {
              var or__3548__auto____4686 = G__4684__4685.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____4686) {
                return or__3548__auto____4686
              }else {
                return G__4684__4685.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4684__4685.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4684__4685)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4684__4685)
          }
        }()) {
          return coll__4683
        }else {
          return cljs.core._seq.call(null, coll__4683)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4687 = cljs.core.next.call(null, s);
      s = G__4687;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4688__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4689 = conj.call(null, coll, x);
          var G__4690 = cljs.core.first.call(null, xs);
          var G__4691 = cljs.core.next.call(null, xs);
          coll = G__4689;
          x = G__4690;
          xs = G__4691;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4688 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4688__delegate.call(this, coll, x, xs)
    };
    G__4688.cljs$lang$maxFixedArity = 2;
    G__4688.cljs$lang$applyTo = function(arglist__4692) {
      var coll = cljs.core.first(arglist__4692);
      var x = cljs.core.first(cljs.core.next(arglist__4692));
      var xs = cljs.core.rest(cljs.core.next(arglist__4692));
      return G__4688__delegate(coll, x, xs)
    };
    G__4688.cljs$lang$arity$variadic = G__4688__delegate;
    return G__4688
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__4693 = cljs.core.seq.call(null, coll);
  var acc__4694 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__4693)) {
      return acc__4694 + cljs.core._count.call(null, s__4693)
    }else {
      var G__4695 = cljs.core.next.call(null, s__4693);
      var G__4696 = acc__4694 + 1;
      s__4693 = G__4695;
      acc__4694 = G__4696;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__4697__4698 = coll;
        if(G__4697__4698 != null) {
          if(function() {
            var or__3548__auto____4699 = G__4697__4698.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____4699) {
              return or__3548__auto____4699
            }else {
              return G__4697__4698.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4697__4698.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4697__4698)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4697__4698)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__4700__4701 = coll;
        if(G__4700__4701 != null) {
          if(function() {
            var or__3548__auto____4702 = G__4700__4701.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____4702) {
              return or__3548__auto____4702
            }else {
              return G__4700__4701.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4700__4701.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4700__4701)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4700__4701)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4704__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4703 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4705 = ret__4703;
          var G__4706 = cljs.core.first.call(null, kvs);
          var G__4707 = cljs.core.second.call(null, kvs);
          var G__4708 = cljs.core.nnext.call(null, kvs);
          coll = G__4705;
          k = G__4706;
          v = G__4707;
          kvs = G__4708;
          continue
        }else {
          return ret__4703
        }
        break
      }
    };
    var G__4704 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4704__delegate.call(this, coll, k, v, kvs)
    };
    G__4704.cljs$lang$maxFixedArity = 3;
    G__4704.cljs$lang$applyTo = function(arglist__4709) {
      var coll = cljs.core.first(arglist__4709);
      var k = cljs.core.first(cljs.core.next(arglist__4709));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4709)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4709)));
      return G__4704__delegate(coll, k, v, kvs)
    };
    G__4704.cljs$lang$arity$variadic = G__4704__delegate;
    return G__4704
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4711__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4710 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4712 = ret__4710;
          var G__4713 = cljs.core.first.call(null, ks);
          var G__4714 = cljs.core.next.call(null, ks);
          coll = G__4712;
          k = G__4713;
          ks = G__4714;
          continue
        }else {
          return ret__4710
        }
        break
      }
    };
    var G__4711 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4711__delegate.call(this, coll, k, ks)
    };
    G__4711.cljs$lang$maxFixedArity = 2;
    G__4711.cljs$lang$applyTo = function(arglist__4715) {
      var coll = cljs.core.first(arglist__4715);
      var k = cljs.core.first(cljs.core.next(arglist__4715));
      var ks = cljs.core.rest(cljs.core.next(arglist__4715));
      return G__4711__delegate(coll, k, ks)
    };
    G__4711.cljs$lang$arity$variadic = G__4711__delegate;
    return G__4711
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4716__4717 = o;
    if(G__4716__4717 != null) {
      if(function() {
        var or__3548__auto____4718 = G__4716__4717.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____4718) {
          return or__3548__auto____4718
        }else {
          return G__4716__4717.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4716__4717.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4716__4717)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4716__4717)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4720__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4719 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4721 = ret__4719;
          var G__4722 = cljs.core.first.call(null, ks);
          var G__4723 = cljs.core.next.call(null, ks);
          coll = G__4721;
          k = G__4722;
          ks = G__4723;
          continue
        }else {
          return ret__4719
        }
        break
      }
    };
    var G__4720 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4720__delegate.call(this, coll, k, ks)
    };
    G__4720.cljs$lang$maxFixedArity = 2;
    G__4720.cljs$lang$applyTo = function(arglist__4724) {
      var coll = cljs.core.first(arglist__4724);
      var k = cljs.core.first(cljs.core.next(arglist__4724));
      var ks = cljs.core.rest(cljs.core.next(arglist__4724));
      return G__4720__delegate(coll, k, ks)
    };
    G__4720.cljs$lang$arity$variadic = G__4720__delegate;
    return G__4720
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4725__4726 = x;
    if(G__4725__4726 != null) {
      if(function() {
        var or__3548__auto____4727 = G__4725__4726.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____4727) {
          return or__3548__auto____4727
        }else {
          return G__4725__4726.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4725__4726.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4725__4726)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4725__4726)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4728__4729 = x;
    if(G__4728__4729 != null) {
      if(function() {
        var or__3548__auto____4730 = G__4728__4729.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____4730) {
          return or__3548__auto____4730
        }else {
          return G__4728__4729.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4728__4729.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4728__4729)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4728__4729)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4731__4732 = x;
  if(G__4731__4732 != null) {
    if(function() {
      var or__3548__auto____4733 = G__4731__4732.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____4733) {
        return or__3548__auto____4733
      }else {
        return G__4731__4732.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4731__4732.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4731__4732)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4731__4732)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4734__4735 = x;
  if(G__4734__4735 != null) {
    if(function() {
      var or__3548__auto____4736 = G__4734__4735.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____4736) {
        return or__3548__auto____4736
      }else {
        return G__4734__4735.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4734__4735.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4734__4735)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4734__4735)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4737__4738 = x;
  if(G__4737__4738 != null) {
    if(function() {
      var or__3548__auto____4739 = G__4737__4738.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____4739) {
        return or__3548__auto____4739
      }else {
        return G__4737__4738.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4737__4738.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4737__4738)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4737__4738)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4740__4741 = x;
  if(G__4740__4741 != null) {
    if(function() {
      var or__3548__auto____4742 = G__4740__4741.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____4742) {
        return or__3548__auto____4742
      }else {
        return G__4740__4741.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4740__4741.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4740__4741)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4740__4741)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4743__4744 = x;
  if(G__4743__4744 != null) {
    if(function() {
      var or__3548__auto____4745 = G__4743__4744.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____4745) {
        return or__3548__auto____4745
      }else {
        return G__4743__4744.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4743__4744.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4743__4744)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4743__4744)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4746__4747 = x;
    if(G__4746__4747 != null) {
      if(function() {
        var or__3548__auto____4748 = G__4746__4747.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____4748) {
          return or__3548__auto____4748
        }else {
          return G__4746__4747.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4746__4747.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4746__4747)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4746__4747)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4749__4750 = x;
  if(G__4749__4750 != null) {
    if(function() {
      var or__3548__auto____4751 = G__4749__4750.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____4751) {
        return or__3548__auto____4751
      }else {
        return G__4749__4750.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4749__4750.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4749__4750)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4749__4750)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4752__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4752 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4752__delegate.call(this, keyvals)
    };
    G__4752.cljs$lang$maxFixedArity = 0;
    G__4752.cljs$lang$applyTo = function(arglist__4753) {
      var keyvals = cljs.core.seq(arglist__4753);
      return G__4752__delegate(keyvals)
    };
    G__4752.cljs$lang$arity$variadic = G__4752__delegate;
    return G__4752
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4754 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4754.push(key)
  });
  return keys__4754
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4755 = i;
  var j__4756 = j;
  var len__4757 = len;
  while(true) {
    if(len__4757 === 0) {
      return to
    }else {
      to[j__4756] = from[i__4755];
      var G__4758 = i__4755 + 1;
      var G__4759 = j__4756 + 1;
      var G__4760 = len__4757 - 1;
      i__4755 = G__4758;
      j__4756 = G__4759;
      len__4757 = G__4760;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4761 = i + (len - 1);
  var j__4762 = j + (len - 1);
  var len__4763 = len;
  while(true) {
    if(len__4763 === 0) {
      return to
    }else {
      to[j__4762] = from[i__4761];
      var G__4764 = i__4761 - 1;
      var G__4765 = j__4762 - 1;
      var G__4766 = len__4763 - 1;
      i__4761 = G__4764;
      j__4762 = G__4765;
      len__4763 = G__4766;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4767__4768 = s;
    if(G__4767__4768 != null) {
      if(function() {
        var or__3548__auto____4769 = G__4767__4768.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____4769) {
          return or__3548__auto____4769
        }else {
          return G__4767__4768.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4767__4768.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4767__4768)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4767__4768)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4770__4771 = s;
  if(G__4770__4771 != null) {
    if(function() {
      var or__3548__auto____4772 = G__4770__4771.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____4772) {
        return or__3548__auto____4772
      }else {
        return G__4770__4771.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4770__4771.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4770__4771)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4770__4771)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____4773 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4773)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____4774 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____4774) {
        return or__3548__auto____4774
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____4773
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____4775 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4775)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____4775
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____4776 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4776)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____4776
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____4777 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____4777) {
    return or__3548__auto____4777
  }else {
    var G__4778__4779 = f;
    if(G__4778__4779 != null) {
      if(function() {
        var or__3548__auto____4780 = G__4778__4779.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____4780) {
          return or__3548__auto____4780
        }else {
          return G__4778__4779.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4778__4779.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4778__4779)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4778__4779)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____4781 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____4781) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____4781
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4782 = coll;
    if(cljs.core.truth_(and__3546__auto____4782)) {
      var and__3546__auto____4783 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____4783) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____4783
      }
    }else {
      return and__3546__auto____4782
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4788__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4784 = cljs.core.set([y, x]);
        var xs__4785 = more;
        while(true) {
          var x__4786 = cljs.core.first.call(null, xs__4785);
          var etc__4787 = cljs.core.next.call(null, xs__4785);
          if(cljs.core.truth_(xs__4785)) {
            if(cljs.core.contains_QMARK_.call(null, s__4784, x__4786)) {
              return false
            }else {
              var G__4789 = cljs.core.conj.call(null, s__4784, x__4786);
              var G__4790 = etc__4787;
              s__4784 = G__4789;
              xs__4785 = G__4790;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4788 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4788__delegate.call(this, x, y, more)
    };
    G__4788.cljs$lang$maxFixedArity = 2;
    G__4788.cljs$lang$applyTo = function(arglist__4791) {
      var x = cljs.core.first(arglist__4791);
      var y = cljs.core.first(cljs.core.next(arglist__4791));
      var more = cljs.core.rest(cljs.core.next(arglist__4791));
      return G__4788__delegate(x, y, more)
    };
    G__4788.cljs$lang$arity$variadic = G__4788__delegate;
    return G__4788
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4792 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4792)) {
        return r__4792
      }else {
        if(cljs.core.truth_(r__4792)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4793 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4793, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4793)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3695__auto____4794 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____4794)) {
      var s__4795 = temp__3695__auto____4794;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4795), cljs.core.next.call(null, s__4795))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4796 = val;
    var coll__4797 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4797)) {
        var nval__4798 = f.call(null, val__4796, cljs.core.first.call(null, coll__4797));
        if(cljs.core.reduced_QMARK_.call(null, nval__4798)) {
          return cljs.core.deref.call(null, nval__4798)
        }else {
          var G__4799 = nval__4798;
          var G__4800 = cljs.core.next.call(null, coll__4797);
          val__4796 = G__4799;
          coll__4797 = G__4800;
          continue
        }
      }else {
        return val__4796
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4801__4802 = coll;
      if(G__4801__4802 != null) {
        if(function() {
          var or__3548__auto____4803 = G__4801__4802.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4803) {
            return or__3548__auto____4803
          }else {
            return G__4801__4802.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4801__4802.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4801__4802)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4801__4802)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4804__4805 = coll;
      if(G__4804__4805 != null) {
        if(function() {
          var or__3548__auto____4806 = G__4804__4805.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4806) {
            return or__3548__auto____4806
          }else {
            return G__4804__4805.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4804__4805.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4804__4805)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4804__4805)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4807 = this;
  return this__4807.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4808__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4808 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4808__delegate.call(this, x, y, more)
    };
    G__4808.cljs$lang$maxFixedArity = 2;
    G__4808.cljs$lang$applyTo = function(arglist__4809) {
      var x = cljs.core.first(arglist__4809);
      var y = cljs.core.first(cljs.core.next(arglist__4809));
      var more = cljs.core.rest(cljs.core.next(arglist__4809));
      return G__4808__delegate(x, y, more)
    };
    G__4808.cljs$lang$arity$variadic = G__4808__delegate;
    return G__4808
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4810__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4810 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4810__delegate.call(this, x, y, more)
    };
    G__4810.cljs$lang$maxFixedArity = 2;
    G__4810.cljs$lang$applyTo = function(arglist__4811) {
      var x = cljs.core.first(arglist__4811);
      var y = cljs.core.first(cljs.core.next(arglist__4811));
      var more = cljs.core.rest(cljs.core.next(arglist__4811));
      return G__4810__delegate(x, y, more)
    };
    G__4810.cljs$lang$arity$variadic = G__4810__delegate;
    return G__4810
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4812__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4812 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4812__delegate.call(this, x, y, more)
    };
    G__4812.cljs$lang$maxFixedArity = 2;
    G__4812.cljs$lang$applyTo = function(arglist__4813) {
      var x = cljs.core.first(arglist__4813);
      var y = cljs.core.first(cljs.core.next(arglist__4813));
      var more = cljs.core.rest(cljs.core.next(arglist__4813));
      return G__4812__delegate(x, y, more)
    };
    G__4812.cljs$lang$arity$variadic = G__4812__delegate;
    return G__4812
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4814__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4814 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4814__delegate.call(this, x, y, more)
    };
    G__4814.cljs$lang$maxFixedArity = 2;
    G__4814.cljs$lang$applyTo = function(arglist__4815) {
      var x = cljs.core.first(arglist__4815);
      var y = cljs.core.first(cljs.core.next(arglist__4815));
      var more = cljs.core.rest(cljs.core.next(arglist__4815));
      return G__4814__delegate(x, y, more)
    };
    G__4814.cljs$lang$arity$variadic = G__4814__delegate;
    return G__4814
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4816__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4817 = y;
            var G__4818 = cljs.core.first.call(null, more);
            var G__4819 = cljs.core.next.call(null, more);
            x = G__4817;
            y = G__4818;
            more = G__4819;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4816 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4816__delegate.call(this, x, y, more)
    };
    G__4816.cljs$lang$maxFixedArity = 2;
    G__4816.cljs$lang$applyTo = function(arglist__4820) {
      var x = cljs.core.first(arglist__4820);
      var y = cljs.core.first(cljs.core.next(arglist__4820));
      var more = cljs.core.rest(cljs.core.next(arglist__4820));
      return G__4816__delegate(x, y, more)
    };
    G__4816.cljs$lang$arity$variadic = G__4816__delegate;
    return G__4816
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4821__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4822 = y;
            var G__4823 = cljs.core.first.call(null, more);
            var G__4824 = cljs.core.next.call(null, more);
            x = G__4822;
            y = G__4823;
            more = G__4824;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4821 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4821__delegate.call(this, x, y, more)
    };
    G__4821.cljs$lang$maxFixedArity = 2;
    G__4821.cljs$lang$applyTo = function(arglist__4825) {
      var x = cljs.core.first(arglist__4825);
      var y = cljs.core.first(cljs.core.next(arglist__4825));
      var more = cljs.core.rest(cljs.core.next(arglist__4825));
      return G__4821__delegate(x, y, more)
    };
    G__4821.cljs$lang$arity$variadic = G__4821__delegate;
    return G__4821
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4826__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4827 = y;
            var G__4828 = cljs.core.first.call(null, more);
            var G__4829 = cljs.core.next.call(null, more);
            x = G__4827;
            y = G__4828;
            more = G__4829;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4826 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4826__delegate.call(this, x, y, more)
    };
    G__4826.cljs$lang$maxFixedArity = 2;
    G__4826.cljs$lang$applyTo = function(arglist__4830) {
      var x = cljs.core.first(arglist__4830);
      var y = cljs.core.first(cljs.core.next(arglist__4830));
      var more = cljs.core.rest(cljs.core.next(arglist__4830));
      return G__4826__delegate(x, y, more)
    };
    G__4826.cljs$lang$arity$variadic = G__4826__delegate;
    return G__4826
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4831__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4832 = y;
            var G__4833 = cljs.core.first.call(null, more);
            var G__4834 = cljs.core.next.call(null, more);
            x = G__4832;
            y = G__4833;
            more = G__4834;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4831 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4831__delegate.call(this, x, y, more)
    };
    G__4831.cljs$lang$maxFixedArity = 2;
    G__4831.cljs$lang$applyTo = function(arglist__4835) {
      var x = cljs.core.first(arglist__4835);
      var y = cljs.core.first(cljs.core.next(arglist__4835));
      var more = cljs.core.rest(cljs.core.next(arglist__4835));
      return G__4831__delegate(x, y, more)
    };
    G__4831.cljs$lang$arity$variadic = G__4831__delegate;
    return G__4831
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4836__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4836 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4836__delegate.call(this, x, y, more)
    };
    G__4836.cljs$lang$maxFixedArity = 2;
    G__4836.cljs$lang$applyTo = function(arglist__4837) {
      var x = cljs.core.first(arglist__4837);
      var y = cljs.core.first(cljs.core.next(arglist__4837));
      var more = cljs.core.rest(cljs.core.next(arglist__4837));
      return G__4836__delegate(x, y, more)
    };
    G__4836.cljs$lang$arity$variadic = G__4836__delegate;
    return G__4836
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4838__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4838 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4838__delegate.call(this, x, y, more)
    };
    G__4838.cljs$lang$maxFixedArity = 2;
    G__4838.cljs$lang$applyTo = function(arglist__4839) {
      var x = cljs.core.first(arglist__4839);
      var y = cljs.core.first(cljs.core.next(arglist__4839));
      var more = cljs.core.rest(cljs.core.next(arglist__4839));
      return G__4838__delegate(x, y, more)
    };
    G__4838.cljs$lang$arity$variadic = G__4838__delegate;
    return G__4838
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__4840 = n % d;
  return cljs.core.fix.call(null, (n - rem__4840) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__4841 = cljs.core.quot.call(null, n, d);
  return n - d * q__4841
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__4842 = 0;
  var n__4843 = n;
  while(true) {
    if(n__4843 === 0) {
      return c__4842
    }else {
      var G__4844 = c__4842 + 1;
      var G__4845 = n__4843 & n__4843 - 1;
      c__4842 = G__4844;
      n__4843 = G__4845;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4846__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4847 = y;
            var G__4848 = cljs.core.first.call(null, more);
            var G__4849 = cljs.core.next.call(null, more);
            x = G__4847;
            y = G__4848;
            more = G__4849;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4846 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4846__delegate.call(this, x, y, more)
    };
    G__4846.cljs$lang$maxFixedArity = 2;
    G__4846.cljs$lang$applyTo = function(arglist__4850) {
      var x = cljs.core.first(arglist__4850);
      var y = cljs.core.first(cljs.core.next(arglist__4850));
      var more = cljs.core.rest(cljs.core.next(arglist__4850));
      return G__4846__delegate(x, y, more)
    };
    G__4846.cljs$lang$arity$variadic = G__4846__delegate;
    return G__4846
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__4851 = n;
  var xs__4852 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4853 = xs__4852;
      if(cljs.core.truth_(and__3546__auto____4853)) {
        return n__4851 > 0
      }else {
        return and__3546__auto____4853
      }
    }())) {
      var G__4854 = n__4851 - 1;
      var G__4855 = cljs.core.next.call(null, xs__4852);
      n__4851 = G__4854;
      xs__4852 = G__4855;
      continue
    }else {
      return xs__4852
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4856__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4857 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4858 = cljs.core.next.call(null, more);
            sb = G__4857;
            more = G__4858;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4856 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4856__delegate.call(this, x, ys)
    };
    G__4856.cljs$lang$maxFixedArity = 1;
    G__4856.cljs$lang$applyTo = function(arglist__4859) {
      var x = cljs.core.first(arglist__4859);
      var ys = cljs.core.rest(arglist__4859);
      return G__4856__delegate(x, ys)
    };
    G__4856.cljs$lang$arity$variadic = G__4856__delegate;
    return G__4856
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__4860__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4861 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4862 = cljs.core.next.call(null, more);
            sb = G__4861;
            more = G__4862;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4860 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4860__delegate.call(this, x, ys)
    };
    G__4860.cljs$lang$maxFixedArity = 1;
    G__4860.cljs$lang$applyTo = function(arglist__4863) {
      var x = cljs.core.first(arglist__4863);
      var ys = cljs.core.rest(arglist__4863);
      return G__4860__delegate(x, ys)
    };
    G__4860.cljs$lang$arity$variadic = G__4860__delegate;
    return G__4860
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__4864 = cljs.core.seq.call(null, x);
    var ys__4865 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__4864 == null) {
        return ys__4865 == null
      }else {
        if(ys__4865 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__4864), cljs.core.first.call(null, ys__4865))) {
            var G__4866 = cljs.core.next.call(null, xs__4864);
            var G__4867 = cljs.core.next.call(null, ys__4865);
            xs__4864 = G__4866;
            ys__4865 = G__4867;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__4868_SHARP_, p2__4869_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4868_SHARP_, cljs.core.hash.call(null, p2__4869_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__4870 = 0;
  var s__4871 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__4871)) {
      var e__4872 = cljs.core.first.call(null, s__4871);
      var G__4873 = (h__4870 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__4872)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__4872)))) % 4503599627370496;
      var G__4874 = cljs.core.next.call(null, s__4871);
      h__4870 = G__4873;
      s__4871 = G__4874;
      continue
    }else {
      return h__4870
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__4875 = 0;
  var s__4876 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__4876)) {
      var e__4877 = cljs.core.first.call(null, s__4876);
      var G__4878 = (h__4875 + cljs.core.hash.call(null, e__4877)) % 4503599627370496;
      var G__4879 = cljs.core.next.call(null, s__4876);
      h__4875 = G__4878;
      s__4876 = G__4879;
      continue
    }else {
      return h__4875
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__4880__4881 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__4880__4881)) {
    var G__4883__4885 = cljs.core.first.call(null, G__4880__4881);
    var vec__4884__4886 = G__4883__4885;
    var key_name__4887 = cljs.core.nth.call(null, vec__4884__4886, 0, null);
    var f__4888 = cljs.core.nth.call(null, vec__4884__4886, 1, null);
    var G__4880__4889 = G__4880__4881;
    var G__4883__4890 = G__4883__4885;
    var G__4880__4891 = G__4880__4889;
    while(true) {
      var vec__4892__4893 = G__4883__4890;
      var key_name__4894 = cljs.core.nth.call(null, vec__4892__4893, 0, null);
      var f__4895 = cljs.core.nth.call(null, vec__4892__4893, 1, null);
      var G__4880__4896 = G__4880__4891;
      var str_name__4897 = cljs.core.name.call(null, key_name__4894);
      obj[str_name__4897] = f__4895;
      var temp__3698__auto____4898 = cljs.core.next.call(null, G__4880__4896);
      if(cljs.core.truth_(temp__3698__auto____4898)) {
        var G__4880__4899 = temp__3698__auto____4898;
        var G__4900 = cljs.core.first.call(null, G__4880__4899);
        var G__4901 = G__4880__4899;
        G__4883__4890 = G__4900;
        G__4880__4891 = G__4901;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4902 = this;
  var h__364__auto____4903 = this__4902.__hash;
  if(h__364__auto____4903 != null) {
    return h__364__auto____4903
  }else {
    var h__364__auto____4904 = cljs.core.hash_coll.call(null, coll);
    this__4902.__hash = h__364__auto____4904;
    return h__364__auto____4904
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4905 = this;
  return new cljs.core.List(this__4905.meta, o, coll, this__4905.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__4906 = this;
  var this$__4907 = this;
  return cljs.core.pr_str.call(null, this$__4907)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4908 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4909 = this;
  return this__4909.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4910 = this;
  return this__4910.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4911 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4912 = this;
  return this__4912.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4913 = this;
  return this__4913.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4914 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4915 = this;
  return new cljs.core.List(meta, this__4915.first, this__4915.rest, this__4915.count, this__4915.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4916 = this;
  return this__4916.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4917 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4918 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4919 = this;
  return new cljs.core.List(this__4919.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__4920 = this;
  var this$__4921 = this;
  return cljs.core.pr_str.call(null, this$__4921)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4922 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4923 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4924 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4925 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4926 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4927 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4928 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4929 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4930 = this;
  return this__4930.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4931 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4932__4933 = coll;
  if(G__4932__4933 != null) {
    if(function() {
      var or__3548__auto____4934 = G__4932__4933.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____4934) {
        return or__3548__auto____4934
      }else {
        return G__4932__4933.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4932__4933.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4932__4933)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4932__4933)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4935) {
    var items = cljs.core.seq(arglist__4935);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4936 = this;
  var h__364__auto____4937 = this__4936.__hash;
  if(h__364__auto____4937 != null) {
    return h__364__auto____4937
  }else {
    var h__364__auto____4938 = cljs.core.hash_coll.call(null, coll);
    this__4936.__hash = h__364__auto____4938;
    return h__364__auto____4938
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4939 = this;
  return new cljs.core.Cons(null, o, coll, this__4939.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__4940 = this;
  var this$__4941 = this;
  return cljs.core.pr_str.call(null, this$__4941)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4942 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4943 = this;
  return this__4943.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4944 = this;
  if(this__4944.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__4944.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4945 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4946 = this;
  return new cljs.core.Cons(meta, this__4946.first, this__4946.rest, this__4946.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4947 = this;
  return this__4947.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4948 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4948.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____4949 = coll == null;
    if(or__3548__auto____4949) {
      return or__3548__auto____4949
    }else {
      var G__4950__4951 = coll;
      if(G__4950__4951 != null) {
        if(function() {
          var or__3548__auto____4952 = G__4950__4951.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4952) {
            return or__3548__auto____4952
          }else {
            return G__4950__4951.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4950__4951.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4950__4951)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4950__4951)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4953__4954 = x;
  if(G__4953__4954 != null) {
    if(function() {
      var or__3548__auto____4955 = G__4953__4954.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____4955) {
        return or__3548__auto____4955
      }else {
        return G__4953__4954.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4953__4954.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4953__4954)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4953__4954)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__4956 = null;
  var G__4956__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__4956__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__4956 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4956__2.call(this, string, f);
      case 3:
        return G__4956__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4956
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__4957 = null;
  var G__4957__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__4957__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__4957 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4957__2.call(this, string, k);
      case 3:
        return G__4957__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4957
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__4958 = null;
  var G__4958__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__4958__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__4958 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4958__2.call(this, string, n);
      case 3:
        return G__4958__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4958
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4967 = null;
  var G__4967__2 = function(tsym4961, coll) {
    var tsym4961__4963 = this;
    var this$__4964 = tsym4961__4963;
    return cljs.core.get.call(null, coll, this$__4964.toString())
  };
  var G__4967__3 = function(tsym4962, coll, not_found) {
    var tsym4962__4965 = this;
    var this$__4966 = tsym4962__4965;
    return cljs.core.get.call(null, coll, this$__4966.toString(), not_found)
  };
  G__4967 = function(tsym4962, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4967__2.call(this, tsym4962, coll);
      case 3:
        return G__4967__3.call(this, tsym4962, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4967
}();
String.prototype.apply = function(tsym4959, args4960) {
  return tsym4959.call.apply(tsym4959, [tsym4959].concat(cljs.core.aclone.call(null, args4960)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__4968 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__4968
  }else {
    lazy_seq.x = x__4968.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4969 = this;
  var h__364__auto____4970 = this__4969.__hash;
  if(h__364__auto____4970 != null) {
    return h__364__auto____4970
  }else {
    var h__364__auto____4971 = cljs.core.hash_coll.call(null, coll);
    this__4969.__hash = h__364__auto____4971;
    return h__364__auto____4971
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4972 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__4973 = this;
  var this$__4974 = this;
  return cljs.core.pr_str.call(null, this$__4974)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4975 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4976 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4977 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4978 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4979 = this;
  return new cljs.core.LazySeq(meta, this__4979.realized, this__4979.x, this__4979.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4980 = this;
  return this__4980.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4981 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4981.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__4982 = [];
  var s__4983 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__4983))) {
      ary__4982.push(cljs.core.first.call(null, s__4983));
      var G__4984 = cljs.core.next.call(null, s__4983);
      s__4983 = G__4984;
      continue
    }else {
      return ary__4982
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__4985 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__4986 = 0;
  var xs__4987 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__4987)) {
      ret__4985[i__4986] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__4987));
      var G__4988 = i__4986 + 1;
      var G__4989 = cljs.core.next.call(null, xs__4987);
      i__4986 = G__4988;
      xs__4987 = G__4989;
      continue
    }else {
    }
    break
  }
  return ret__4985
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__4990 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__4991 = cljs.core.seq.call(null, init_val_or_seq);
      var i__4992 = 0;
      var s__4993 = s__4991;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____4994 = s__4993;
          if(cljs.core.truth_(and__3546__auto____4994)) {
            return i__4992 < size
          }else {
            return and__3546__auto____4994
          }
        }())) {
          a__4990[i__4992] = cljs.core.first.call(null, s__4993);
          var G__4997 = i__4992 + 1;
          var G__4998 = cljs.core.next.call(null, s__4993);
          i__4992 = G__4997;
          s__4993 = G__4998;
          continue
        }else {
          return a__4990
        }
        break
      }
    }else {
      var n__685__auto____4995 = size;
      var i__4996 = 0;
      while(true) {
        if(i__4996 < n__685__auto____4995) {
          a__4990[i__4996] = init_val_or_seq;
          var G__4999 = i__4996 + 1;
          i__4996 = G__4999;
          continue
        }else {
        }
        break
      }
      return a__4990
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__5000 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5001 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5002 = 0;
      var s__5003 = s__5001;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5004 = s__5003;
          if(cljs.core.truth_(and__3546__auto____5004)) {
            return i__5002 < size
          }else {
            return and__3546__auto____5004
          }
        }())) {
          a__5000[i__5002] = cljs.core.first.call(null, s__5003);
          var G__5007 = i__5002 + 1;
          var G__5008 = cljs.core.next.call(null, s__5003);
          i__5002 = G__5007;
          s__5003 = G__5008;
          continue
        }else {
          return a__5000
        }
        break
      }
    }else {
      var n__685__auto____5005 = size;
      var i__5006 = 0;
      while(true) {
        if(i__5006 < n__685__auto____5005) {
          a__5000[i__5006] = init_val_or_seq;
          var G__5009 = i__5006 + 1;
          i__5006 = G__5009;
          continue
        }else {
        }
        break
      }
      return a__5000
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__5010 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5011 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5012 = 0;
      var s__5013 = s__5011;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5014 = s__5013;
          if(cljs.core.truth_(and__3546__auto____5014)) {
            return i__5012 < size
          }else {
            return and__3546__auto____5014
          }
        }())) {
          a__5010[i__5012] = cljs.core.first.call(null, s__5013);
          var G__5017 = i__5012 + 1;
          var G__5018 = cljs.core.next.call(null, s__5013);
          i__5012 = G__5017;
          s__5013 = G__5018;
          continue
        }else {
          return a__5010
        }
        break
      }
    }else {
      var n__685__auto____5015 = size;
      var i__5016 = 0;
      while(true) {
        if(i__5016 < n__685__auto____5015) {
          a__5010[i__5016] = init_val_or_seq;
          var G__5019 = i__5016 + 1;
          i__5016 = G__5019;
          continue
        }else {
        }
        break
      }
      return a__5010
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__5020 = s;
    var i__5021 = n;
    var sum__5022 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____5023 = i__5021 > 0;
        if(and__3546__auto____5023) {
          return cljs.core.seq.call(null, s__5020)
        }else {
          return and__3546__auto____5023
        }
      }())) {
        var G__5024 = cljs.core.next.call(null, s__5020);
        var G__5025 = i__5021 - 1;
        var G__5026 = sum__5022 + 1;
        s__5020 = G__5024;
        i__5021 = G__5025;
        sum__5022 = G__5026;
        continue
      }else {
        return sum__5022
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5027 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5027)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5027), concat.call(null, cljs.core.rest.call(null, s__5027), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5030__delegate = function(x, y, zs) {
      var cat__5029 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5028 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5028)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5028), cat.call(null, cljs.core.rest.call(null, xys__5028), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5029.call(null, concat.call(null, x, y), zs)
    };
    var G__5030 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5030__delegate.call(this, x, y, zs)
    };
    G__5030.cljs$lang$maxFixedArity = 2;
    G__5030.cljs$lang$applyTo = function(arglist__5031) {
      var x = cljs.core.first(arglist__5031);
      var y = cljs.core.first(cljs.core.next(arglist__5031));
      var zs = cljs.core.rest(cljs.core.next(arglist__5031));
      return G__5030__delegate(x, y, zs)
    };
    G__5030.cljs$lang$arity$variadic = G__5030__delegate;
    return G__5030
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__5032__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5032 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5032__delegate.call(this, a, b, c, d, more)
    };
    G__5032.cljs$lang$maxFixedArity = 4;
    G__5032.cljs$lang$applyTo = function(arglist__5033) {
      var a = cljs.core.first(arglist__5033);
      var b = cljs.core.first(cljs.core.next(arglist__5033));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5033)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5033))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5033))));
      return G__5032__delegate(a, b, c, d, more)
    };
    G__5032.cljs$lang$arity$variadic = G__5032__delegate;
    return G__5032
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5034 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5035 = cljs.core._first.call(null, args__5034);
    var args__5036 = cljs.core._rest.call(null, args__5034);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5035)
      }else {
        return f.call(null, a__5035)
      }
    }else {
      var b__5037 = cljs.core._first.call(null, args__5036);
      var args__5038 = cljs.core._rest.call(null, args__5036);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5035, b__5037)
        }else {
          return f.call(null, a__5035, b__5037)
        }
      }else {
        var c__5039 = cljs.core._first.call(null, args__5038);
        var args__5040 = cljs.core._rest.call(null, args__5038);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5035, b__5037, c__5039)
          }else {
            return f.call(null, a__5035, b__5037, c__5039)
          }
        }else {
          var d__5041 = cljs.core._first.call(null, args__5040);
          var args__5042 = cljs.core._rest.call(null, args__5040);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5035, b__5037, c__5039, d__5041)
            }else {
              return f.call(null, a__5035, b__5037, c__5039, d__5041)
            }
          }else {
            var e__5043 = cljs.core._first.call(null, args__5042);
            var args__5044 = cljs.core._rest.call(null, args__5042);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5035, b__5037, c__5039, d__5041, e__5043)
              }else {
                return f.call(null, a__5035, b__5037, c__5039, d__5041, e__5043)
              }
            }else {
              var f__5045 = cljs.core._first.call(null, args__5044);
              var args__5046 = cljs.core._rest.call(null, args__5044);
              if(argc === 6) {
                if(f__5045.cljs$lang$arity$6) {
                  return f__5045.cljs$lang$arity$6(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045)
                }else {
                  return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045)
                }
              }else {
                var g__5047 = cljs.core._first.call(null, args__5046);
                var args__5048 = cljs.core._rest.call(null, args__5046);
                if(argc === 7) {
                  if(f__5045.cljs$lang$arity$7) {
                    return f__5045.cljs$lang$arity$7(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047)
                  }else {
                    return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047)
                  }
                }else {
                  var h__5049 = cljs.core._first.call(null, args__5048);
                  var args__5050 = cljs.core._rest.call(null, args__5048);
                  if(argc === 8) {
                    if(f__5045.cljs$lang$arity$8) {
                      return f__5045.cljs$lang$arity$8(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049)
                    }else {
                      return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049)
                    }
                  }else {
                    var i__5051 = cljs.core._first.call(null, args__5050);
                    var args__5052 = cljs.core._rest.call(null, args__5050);
                    if(argc === 9) {
                      if(f__5045.cljs$lang$arity$9) {
                        return f__5045.cljs$lang$arity$9(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051)
                      }else {
                        return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051)
                      }
                    }else {
                      var j__5053 = cljs.core._first.call(null, args__5052);
                      var args__5054 = cljs.core._rest.call(null, args__5052);
                      if(argc === 10) {
                        if(f__5045.cljs$lang$arity$10) {
                          return f__5045.cljs$lang$arity$10(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053)
                        }else {
                          return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053)
                        }
                      }else {
                        var k__5055 = cljs.core._first.call(null, args__5054);
                        var args__5056 = cljs.core._rest.call(null, args__5054);
                        if(argc === 11) {
                          if(f__5045.cljs$lang$arity$11) {
                            return f__5045.cljs$lang$arity$11(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055)
                          }else {
                            return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055)
                          }
                        }else {
                          var l__5057 = cljs.core._first.call(null, args__5056);
                          var args__5058 = cljs.core._rest.call(null, args__5056);
                          if(argc === 12) {
                            if(f__5045.cljs$lang$arity$12) {
                              return f__5045.cljs$lang$arity$12(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057)
                            }else {
                              return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057)
                            }
                          }else {
                            var m__5059 = cljs.core._first.call(null, args__5058);
                            var args__5060 = cljs.core._rest.call(null, args__5058);
                            if(argc === 13) {
                              if(f__5045.cljs$lang$arity$13) {
                                return f__5045.cljs$lang$arity$13(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059)
                              }else {
                                return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059)
                              }
                            }else {
                              var n__5061 = cljs.core._first.call(null, args__5060);
                              var args__5062 = cljs.core._rest.call(null, args__5060);
                              if(argc === 14) {
                                if(f__5045.cljs$lang$arity$14) {
                                  return f__5045.cljs$lang$arity$14(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061)
                                }else {
                                  return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061)
                                }
                              }else {
                                var o__5063 = cljs.core._first.call(null, args__5062);
                                var args__5064 = cljs.core._rest.call(null, args__5062);
                                if(argc === 15) {
                                  if(f__5045.cljs$lang$arity$15) {
                                    return f__5045.cljs$lang$arity$15(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063)
                                  }else {
                                    return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063)
                                  }
                                }else {
                                  var p__5065 = cljs.core._first.call(null, args__5064);
                                  var args__5066 = cljs.core._rest.call(null, args__5064);
                                  if(argc === 16) {
                                    if(f__5045.cljs$lang$arity$16) {
                                      return f__5045.cljs$lang$arity$16(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065)
                                    }else {
                                      return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065)
                                    }
                                  }else {
                                    var q__5067 = cljs.core._first.call(null, args__5066);
                                    var args__5068 = cljs.core._rest.call(null, args__5066);
                                    if(argc === 17) {
                                      if(f__5045.cljs$lang$arity$17) {
                                        return f__5045.cljs$lang$arity$17(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067)
                                      }else {
                                        return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067)
                                      }
                                    }else {
                                      var r__5069 = cljs.core._first.call(null, args__5068);
                                      var args__5070 = cljs.core._rest.call(null, args__5068);
                                      if(argc === 18) {
                                        if(f__5045.cljs$lang$arity$18) {
                                          return f__5045.cljs$lang$arity$18(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067, r__5069)
                                        }else {
                                          return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067, r__5069)
                                        }
                                      }else {
                                        var s__5071 = cljs.core._first.call(null, args__5070);
                                        var args__5072 = cljs.core._rest.call(null, args__5070);
                                        if(argc === 19) {
                                          if(f__5045.cljs$lang$arity$19) {
                                            return f__5045.cljs$lang$arity$19(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067, r__5069, s__5071)
                                          }else {
                                            return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067, r__5069, s__5071)
                                          }
                                        }else {
                                          var t__5073 = cljs.core._first.call(null, args__5072);
                                          var args__5074 = cljs.core._rest.call(null, args__5072);
                                          if(argc === 20) {
                                            if(f__5045.cljs$lang$arity$20) {
                                              return f__5045.cljs$lang$arity$20(a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067, r__5069, s__5071, t__5073)
                                            }else {
                                              return f__5045.call(null, a__5035, b__5037, c__5039, d__5041, e__5043, f__5045, g__5047, h__5049, i__5051, j__5053, k__5055, l__5057, m__5059, n__5061, o__5063, p__5065, q__5067, r__5069, s__5071, t__5073)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5075 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5076 = cljs.core.bounded_count.call(null, args, fixed_arity__5075 + 1);
      if(bc__5076 <= fixed_arity__5075) {
        return cljs.core.apply_to.call(null, f, bc__5076, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5077 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5078 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5079 = cljs.core.bounded_count.call(null, arglist__5077, fixed_arity__5078 + 1);
      if(bc__5079 <= fixed_arity__5078) {
        return cljs.core.apply_to.call(null, f, bc__5079, arglist__5077)
      }else {
        return f.cljs$lang$applyTo(arglist__5077)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5077))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5080 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5081 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5082 = cljs.core.bounded_count.call(null, arglist__5080, fixed_arity__5081 + 1);
      if(bc__5082 <= fixed_arity__5081) {
        return cljs.core.apply_to.call(null, f, bc__5082, arglist__5080)
      }else {
        return f.cljs$lang$applyTo(arglist__5080)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5080))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5083 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5084 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5085 = cljs.core.bounded_count.call(null, arglist__5083, fixed_arity__5084 + 1);
      if(bc__5085 <= fixed_arity__5084) {
        return cljs.core.apply_to.call(null, f, bc__5085, arglist__5083)
      }else {
        return f.cljs$lang$applyTo(arglist__5083)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5083))
    }
  };
  var apply__6 = function() {
    var G__5089__delegate = function(f, a, b, c, d, args) {
      var arglist__5086 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5087 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5088 = cljs.core.bounded_count.call(null, arglist__5086, fixed_arity__5087 + 1);
        if(bc__5088 <= fixed_arity__5087) {
          return cljs.core.apply_to.call(null, f, bc__5088, arglist__5086)
        }else {
          return f.cljs$lang$applyTo(arglist__5086)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5086))
      }
    };
    var G__5089 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5089__delegate.call(this, f, a, b, c, d, args)
    };
    G__5089.cljs$lang$maxFixedArity = 5;
    G__5089.cljs$lang$applyTo = function(arglist__5090) {
      var f = cljs.core.first(arglist__5090);
      var a = cljs.core.first(cljs.core.next(arglist__5090));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5090)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5090))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5090)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5090)))));
      return G__5089__delegate(f, a, b, c, d, args)
    };
    G__5089.cljs$lang$arity$variadic = G__5089__delegate;
    return G__5089
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__5091) {
    var obj = cljs.core.first(arglist__5091);
    var f = cljs.core.first(cljs.core.next(arglist__5091));
    var args = cljs.core.rest(cljs.core.next(arglist__5091));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5092__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5092 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5092__delegate.call(this, x, y, more)
    };
    G__5092.cljs$lang$maxFixedArity = 2;
    G__5092.cljs$lang$applyTo = function(arglist__5093) {
      var x = cljs.core.first(arglist__5093);
      var y = cljs.core.first(cljs.core.next(arglist__5093));
      var more = cljs.core.rest(cljs.core.next(arglist__5093));
      return G__5092__delegate(x, y, more)
    };
    G__5092.cljs$lang$arity$variadic = G__5092__delegate;
    return G__5092
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5094 = pred;
        var G__5095 = cljs.core.next.call(null, coll);
        pred = G__5094;
        coll = G__5095;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____5096 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____5096)) {
        return or__3548__auto____5096
      }else {
        var G__5097 = pred;
        var G__5098 = cljs.core.next.call(null, coll);
        pred = G__5097;
        coll = G__5098;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5099 = null;
    var G__5099__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5099__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5099__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5099__3 = function() {
      var G__5100__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5100 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5100__delegate.call(this, x, y, zs)
      };
      G__5100.cljs$lang$maxFixedArity = 2;
      G__5100.cljs$lang$applyTo = function(arglist__5101) {
        var x = cljs.core.first(arglist__5101);
        var y = cljs.core.first(cljs.core.next(arglist__5101));
        var zs = cljs.core.rest(cljs.core.next(arglist__5101));
        return G__5100__delegate(x, y, zs)
      };
      G__5100.cljs$lang$arity$variadic = G__5100__delegate;
      return G__5100
    }();
    G__5099 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5099__0.call(this);
        case 1:
          return G__5099__1.call(this, x);
        case 2:
          return G__5099__2.call(this, x, y);
        default:
          return G__5099__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5099.cljs$lang$maxFixedArity = 2;
    G__5099.cljs$lang$applyTo = G__5099__3.cljs$lang$applyTo;
    return G__5099
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5102__delegate = function(args) {
      return x
    };
    var G__5102 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5102__delegate.call(this, args)
    };
    G__5102.cljs$lang$maxFixedArity = 0;
    G__5102.cljs$lang$applyTo = function(arglist__5103) {
      var args = cljs.core.seq(arglist__5103);
      return G__5102__delegate(args)
    };
    G__5102.cljs$lang$arity$variadic = G__5102__delegate;
    return G__5102
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5107 = null;
      var G__5107__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5107__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5107__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5107__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5107__4 = function() {
        var G__5108__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5108 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5108__delegate.call(this, x, y, z, args)
        };
        G__5108.cljs$lang$maxFixedArity = 3;
        G__5108.cljs$lang$applyTo = function(arglist__5109) {
          var x = cljs.core.first(arglist__5109);
          var y = cljs.core.first(cljs.core.next(arglist__5109));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5109)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5109)));
          return G__5108__delegate(x, y, z, args)
        };
        G__5108.cljs$lang$arity$variadic = G__5108__delegate;
        return G__5108
      }();
      G__5107 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5107__0.call(this);
          case 1:
            return G__5107__1.call(this, x);
          case 2:
            return G__5107__2.call(this, x, y);
          case 3:
            return G__5107__3.call(this, x, y, z);
          default:
            return G__5107__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5107.cljs$lang$maxFixedArity = 3;
      G__5107.cljs$lang$applyTo = G__5107__4.cljs$lang$applyTo;
      return G__5107
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5110 = null;
      var G__5110__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5110__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5110__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5110__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5110__4 = function() {
        var G__5111__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5111 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5111__delegate.call(this, x, y, z, args)
        };
        G__5111.cljs$lang$maxFixedArity = 3;
        G__5111.cljs$lang$applyTo = function(arglist__5112) {
          var x = cljs.core.first(arglist__5112);
          var y = cljs.core.first(cljs.core.next(arglist__5112));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5112)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5112)));
          return G__5111__delegate(x, y, z, args)
        };
        G__5111.cljs$lang$arity$variadic = G__5111__delegate;
        return G__5111
      }();
      G__5110 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5110__0.call(this);
          case 1:
            return G__5110__1.call(this, x);
          case 2:
            return G__5110__2.call(this, x, y);
          case 3:
            return G__5110__3.call(this, x, y, z);
          default:
            return G__5110__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5110.cljs$lang$maxFixedArity = 3;
      G__5110.cljs$lang$applyTo = G__5110__4.cljs$lang$applyTo;
      return G__5110
    }()
  };
  var comp__4 = function() {
    var G__5113__delegate = function(f1, f2, f3, fs) {
      var fs__5104 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5114__delegate = function(args) {
          var ret__5105 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5104), args);
          var fs__5106 = cljs.core.next.call(null, fs__5104);
          while(true) {
            if(cljs.core.truth_(fs__5106)) {
              var G__5115 = cljs.core.first.call(null, fs__5106).call(null, ret__5105);
              var G__5116 = cljs.core.next.call(null, fs__5106);
              ret__5105 = G__5115;
              fs__5106 = G__5116;
              continue
            }else {
              return ret__5105
            }
            break
          }
        };
        var G__5114 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5114__delegate.call(this, args)
        };
        G__5114.cljs$lang$maxFixedArity = 0;
        G__5114.cljs$lang$applyTo = function(arglist__5117) {
          var args = cljs.core.seq(arglist__5117);
          return G__5114__delegate(args)
        };
        G__5114.cljs$lang$arity$variadic = G__5114__delegate;
        return G__5114
      }()
    };
    var G__5113 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5113__delegate.call(this, f1, f2, f3, fs)
    };
    G__5113.cljs$lang$maxFixedArity = 3;
    G__5113.cljs$lang$applyTo = function(arglist__5118) {
      var f1 = cljs.core.first(arglist__5118);
      var f2 = cljs.core.first(cljs.core.next(arglist__5118));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5118)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5118)));
      return G__5113__delegate(f1, f2, f3, fs)
    };
    G__5113.cljs$lang$arity$variadic = G__5113__delegate;
    return G__5113
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5119__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5119 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5119__delegate.call(this, args)
      };
      G__5119.cljs$lang$maxFixedArity = 0;
      G__5119.cljs$lang$applyTo = function(arglist__5120) {
        var args = cljs.core.seq(arglist__5120);
        return G__5119__delegate(args)
      };
      G__5119.cljs$lang$arity$variadic = G__5119__delegate;
      return G__5119
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5121__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5121 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5121__delegate.call(this, args)
      };
      G__5121.cljs$lang$maxFixedArity = 0;
      G__5121.cljs$lang$applyTo = function(arglist__5122) {
        var args = cljs.core.seq(arglist__5122);
        return G__5121__delegate(args)
      };
      G__5121.cljs$lang$arity$variadic = G__5121__delegate;
      return G__5121
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5123__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5123 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5123__delegate.call(this, args)
      };
      G__5123.cljs$lang$maxFixedArity = 0;
      G__5123.cljs$lang$applyTo = function(arglist__5124) {
        var args = cljs.core.seq(arglist__5124);
        return G__5123__delegate(args)
      };
      G__5123.cljs$lang$arity$variadic = G__5123__delegate;
      return G__5123
    }()
  };
  var partial__5 = function() {
    var G__5125__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5126__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5126 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5126__delegate.call(this, args)
        };
        G__5126.cljs$lang$maxFixedArity = 0;
        G__5126.cljs$lang$applyTo = function(arglist__5127) {
          var args = cljs.core.seq(arglist__5127);
          return G__5126__delegate(args)
        };
        G__5126.cljs$lang$arity$variadic = G__5126__delegate;
        return G__5126
      }()
    };
    var G__5125 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5125__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5125.cljs$lang$maxFixedArity = 4;
    G__5125.cljs$lang$applyTo = function(arglist__5128) {
      var f = cljs.core.first(arglist__5128);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5128));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5128)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5128))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5128))));
      return G__5125__delegate(f, arg1, arg2, arg3, more)
    };
    G__5125.cljs$lang$arity$variadic = G__5125__delegate;
    return G__5125
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5129 = null;
      var G__5129__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5129__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5129__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5129__4 = function() {
        var G__5130__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5130 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5130__delegate.call(this, a, b, c, ds)
        };
        G__5130.cljs$lang$maxFixedArity = 3;
        G__5130.cljs$lang$applyTo = function(arglist__5131) {
          var a = cljs.core.first(arglist__5131);
          var b = cljs.core.first(cljs.core.next(arglist__5131));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5131)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5131)));
          return G__5130__delegate(a, b, c, ds)
        };
        G__5130.cljs$lang$arity$variadic = G__5130__delegate;
        return G__5130
      }();
      G__5129 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5129__1.call(this, a);
          case 2:
            return G__5129__2.call(this, a, b);
          case 3:
            return G__5129__3.call(this, a, b, c);
          default:
            return G__5129__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5129.cljs$lang$maxFixedArity = 3;
      G__5129.cljs$lang$applyTo = G__5129__4.cljs$lang$applyTo;
      return G__5129
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5132 = null;
      var G__5132__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5132__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5132__4 = function() {
        var G__5133__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5133 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5133__delegate.call(this, a, b, c, ds)
        };
        G__5133.cljs$lang$maxFixedArity = 3;
        G__5133.cljs$lang$applyTo = function(arglist__5134) {
          var a = cljs.core.first(arglist__5134);
          var b = cljs.core.first(cljs.core.next(arglist__5134));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5134)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5134)));
          return G__5133__delegate(a, b, c, ds)
        };
        G__5133.cljs$lang$arity$variadic = G__5133__delegate;
        return G__5133
      }();
      G__5132 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5132__2.call(this, a, b);
          case 3:
            return G__5132__3.call(this, a, b, c);
          default:
            return G__5132__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5132.cljs$lang$maxFixedArity = 3;
      G__5132.cljs$lang$applyTo = G__5132__4.cljs$lang$applyTo;
      return G__5132
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5135 = null;
      var G__5135__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5135__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5135__4 = function() {
        var G__5136__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5136 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5136__delegate.call(this, a, b, c, ds)
        };
        G__5136.cljs$lang$maxFixedArity = 3;
        G__5136.cljs$lang$applyTo = function(arglist__5137) {
          var a = cljs.core.first(arglist__5137);
          var b = cljs.core.first(cljs.core.next(arglist__5137));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5137)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5137)));
          return G__5136__delegate(a, b, c, ds)
        };
        G__5136.cljs$lang$arity$variadic = G__5136__delegate;
        return G__5136
      }();
      G__5135 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5135__2.call(this, a, b);
          case 3:
            return G__5135__3.call(this, a, b, c);
          default:
            return G__5135__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5135.cljs$lang$maxFixedArity = 3;
      G__5135.cljs$lang$applyTo = G__5135__4.cljs$lang$applyTo;
      return G__5135
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5140 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5138 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5138)) {
        var s__5139 = temp__3698__auto____5138;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5139)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5139)))
      }else {
        return null
      }
    })
  };
  return mapi__5140.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5141 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5141)) {
      var s__5142 = temp__3698__auto____5141;
      var x__5143 = f.call(null, cljs.core.first.call(null, s__5142));
      if(x__5143 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5142))
      }else {
        return cljs.core.cons.call(null, x__5143, keep.call(null, f, cljs.core.rest.call(null, s__5142)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5153 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5150 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5150)) {
        var s__5151 = temp__3698__auto____5150;
        var x__5152 = f.call(null, idx, cljs.core.first.call(null, s__5151));
        if(x__5152 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5151))
        }else {
          return cljs.core.cons.call(null, x__5152, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5151)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5153.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5160 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5160)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____5160
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5161 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5161)) {
            var and__3546__auto____5162 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5162)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____5162
            }
          }else {
            return and__3546__auto____5161
          }
        }())
      };
      var ep1__4 = function() {
        var G__5198__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5163 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5163)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____5163
            }
          }())
        };
        var G__5198 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5198__delegate.call(this, x, y, z, args)
        };
        G__5198.cljs$lang$maxFixedArity = 3;
        G__5198.cljs$lang$applyTo = function(arglist__5199) {
          var x = cljs.core.first(arglist__5199);
          var y = cljs.core.first(cljs.core.next(arglist__5199));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5199)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5199)));
          return G__5198__delegate(x, y, z, args)
        };
        G__5198.cljs$lang$arity$variadic = G__5198__delegate;
        return G__5198
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5164 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5164)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____5164
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5165 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5165)) {
            var and__3546__auto____5166 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5166)) {
              var and__3546__auto____5167 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5167)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____5167
              }
            }else {
              return and__3546__auto____5166
            }
          }else {
            return and__3546__auto____5165
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5168 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5168)) {
            var and__3546__auto____5169 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5169)) {
              var and__3546__auto____5170 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____5170)) {
                var and__3546__auto____5171 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____5171)) {
                  var and__3546__auto____5172 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5172)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____5172
                  }
                }else {
                  return and__3546__auto____5171
                }
              }else {
                return and__3546__auto____5170
              }
            }else {
              return and__3546__auto____5169
            }
          }else {
            return and__3546__auto____5168
          }
        }())
      };
      var ep2__4 = function() {
        var G__5200__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5173 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5173)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5144_SHARP_) {
                var and__3546__auto____5174 = p1.call(null, p1__5144_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5174)) {
                  return p2.call(null, p1__5144_SHARP_)
                }else {
                  return and__3546__auto____5174
                }
              }, args)
            }else {
              return and__3546__auto____5173
            }
          }())
        };
        var G__5200 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5200__delegate.call(this, x, y, z, args)
        };
        G__5200.cljs$lang$maxFixedArity = 3;
        G__5200.cljs$lang$applyTo = function(arglist__5201) {
          var x = cljs.core.first(arglist__5201);
          var y = cljs.core.first(cljs.core.next(arglist__5201));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5201)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5201)));
          return G__5200__delegate(x, y, z, args)
        };
        G__5200.cljs$lang$arity$variadic = G__5200__delegate;
        return G__5200
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5175 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5175)) {
            var and__3546__auto____5176 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5176)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____5176
            }
          }else {
            return and__3546__auto____5175
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5177 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5177)) {
            var and__3546__auto____5178 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5178)) {
              var and__3546__auto____5179 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5179)) {
                var and__3546__auto____5180 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5180)) {
                  var and__3546__auto____5181 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5181)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____5181
                  }
                }else {
                  return and__3546__auto____5180
                }
              }else {
                return and__3546__auto____5179
              }
            }else {
              return and__3546__auto____5178
            }
          }else {
            return and__3546__auto____5177
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5182 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5182)) {
            var and__3546__auto____5183 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5183)) {
              var and__3546__auto____5184 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5184)) {
                var and__3546__auto____5185 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5185)) {
                  var and__3546__auto____5186 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5186)) {
                    var and__3546__auto____5187 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____5187)) {
                      var and__3546__auto____5188 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____5188)) {
                        var and__3546__auto____5189 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____5189)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____5189
                        }
                      }else {
                        return and__3546__auto____5188
                      }
                    }else {
                      return and__3546__auto____5187
                    }
                  }else {
                    return and__3546__auto____5186
                  }
                }else {
                  return and__3546__auto____5185
                }
              }else {
                return and__3546__auto____5184
              }
            }else {
              return and__3546__auto____5183
            }
          }else {
            return and__3546__auto____5182
          }
        }())
      };
      var ep3__4 = function() {
        var G__5202__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5190 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5190)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5145_SHARP_) {
                var and__3546__auto____5191 = p1.call(null, p1__5145_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5191)) {
                  var and__3546__auto____5192 = p2.call(null, p1__5145_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____5192)) {
                    return p3.call(null, p1__5145_SHARP_)
                  }else {
                    return and__3546__auto____5192
                  }
                }else {
                  return and__3546__auto____5191
                }
              }, args)
            }else {
              return and__3546__auto____5190
            }
          }())
        };
        var G__5202 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5202__delegate.call(this, x, y, z, args)
        };
        G__5202.cljs$lang$maxFixedArity = 3;
        G__5202.cljs$lang$applyTo = function(arglist__5203) {
          var x = cljs.core.first(arglist__5203);
          var y = cljs.core.first(cljs.core.next(arglist__5203));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5203)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5203)));
          return G__5202__delegate(x, y, z, args)
        };
        G__5202.cljs$lang$arity$variadic = G__5202__delegate;
        return G__5202
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5204__delegate = function(p1, p2, p3, ps) {
      var ps__5193 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5146_SHARP_) {
            return p1__5146_SHARP_.call(null, x)
          }, ps__5193)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5147_SHARP_) {
            var and__3546__auto____5194 = p1__5147_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5194)) {
              return p1__5147_SHARP_.call(null, y)
            }else {
              return and__3546__auto____5194
            }
          }, ps__5193)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5148_SHARP_) {
            var and__3546__auto____5195 = p1__5148_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5195)) {
              var and__3546__auto____5196 = p1__5148_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____5196)) {
                return p1__5148_SHARP_.call(null, z)
              }else {
                return and__3546__auto____5196
              }
            }else {
              return and__3546__auto____5195
            }
          }, ps__5193)
        };
        var epn__4 = function() {
          var G__5205__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____5197 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____5197)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5149_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5149_SHARP_, args)
                }, ps__5193)
              }else {
                return and__3546__auto____5197
              }
            }())
          };
          var G__5205 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5205__delegate.call(this, x, y, z, args)
          };
          G__5205.cljs$lang$maxFixedArity = 3;
          G__5205.cljs$lang$applyTo = function(arglist__5206) {
            var x = cljs.core.first(arglist__5206);
            var y = cljs.core.first(cljs.core.next(arglist__5206));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5206)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5206)));
            return G__5205__delegate(x, y, z, args)
          };
          G__5205.cljs$lang$arity$variadic = G__5205__delegate;
          return G__5205
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__5204 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5204__delegate.call(this, p1, p2, p3, ps)
    };
    G__5204.cljs$lang$maxFixedArity = 3;
    G__5204.cljs$lang$applyTo = function(arglist__5207) {
      var p1 = cljs.core.first(arglist__5207);
      var p2 = cljs.core.first(cljs.core.next(arglist__5207));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5207)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5207)));
      return G__5204__delegate(p1, p2, p3, ps)
    };
    G__5204.cljs$lang$arity$variadic = G__5204__delegate;
    return G__5204
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3548__auto____5209 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5209)) {
          return or__3548__auto____5209
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____5210 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5210)) {
          return or__3548__auto____5210
        }else {
          var or__3548__auto____5211 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5211)) {
            return or__3548__auto____5211
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5247__delegate = function(x, y, z, args) {
          var or__3548__auto____5212 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5212)) {
            return or__3548__auto____5212
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5247 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5247__delegate.call(this, x, y, z, args)
        };
        G__5247.cljs$lang$maxFixedArity = 3;
        G__5247.cljs$lang$applyTo = function(arglist__5248) {
          var x = cljs.core.first(arglist__5248);
          var y = cljs.core.first(cljs.core.next(arglist__5248));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5248)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5248)));
          return G__5247__delegate(x, y, z, args)
        };
        G__5247.cljs$lang$arity$variadic = G__5247__delegate;
        return G__5247
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3548__auto____5213 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5213)) {
          return or__3548__auto____5213
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____5214 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5214)) {
          return or__3548__auto____5214
        }else {
          var or__3548__auto____5215 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5215)) {
            return or__3548__auto____5215
          }else {
            var or__3548__auto____5216 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5216)) {
              return or__3548__auto____5216
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____5217 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5217)) {
          return or__3548__auto____5217
        }else {
          var or__3548__auto____5218 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5218)) {
            return or__3548__auto____5218
          }else {
            var or__3548__auto____5219 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____5219)) {
              return or__3548__auto____5219
            }else {
              var or__3548__auto____5220 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____5220)) {
                return or__3548__auto____5220
              }else {
                var or__3548__auto____5221 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5221)) {
                  return or__3548__auto____5221
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5249__delegate = function(x, y, z, args) {
          var or__3548__auto____5222 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5222)) {
            return or__3548__auto____5222
          }else {
            return cljs.core.some.call(null, function(p1__5154_SHARP_) {
              var or__3548__auto____5223 = p1.call(null, p1__5154_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5223)) {
                return or__3548__auto____5223
              }else {
                return p2.call(null, p1__5154_SHARP_)
              }
            }, args)
          }
        };
        var G__5249 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5249__delegate.call(this, x, y, z, args)
        };
        G__5249.cljs$lang$maxFixedArity = 3;
        G__5249.cljs$lang$applyTo = function(arglist__5250) {
          var x = cljs.core.first(arglist__5250);
          var y = cljs.core.first(cljs.core.next(arglist__5250));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5250)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5250)));
          return G__5249__delegate(x, y, z, args)
        };
        G__5249.cljs$lang$arity$variadic = G__5249__delegate;
        return G__5249
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3548__auto____5224 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5224)) {
          return or__3548__auto____5224
        }else {
          var or__3548__auto____5225 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5225)) {
            return or__3548__auto____5225
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____5226 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5226)) {
          return or__3548__auto____5226
        }else {
          var or__3548__auto____5227 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5227)) {
            return or__3548__auto____5227
          }else {
            var or__3548__auto____5228 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5228)) {
              return or__3548__auto____5228
            }else {
              var or__3548__auto____5229 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5229)) {
                return or__3548__auto____5229
              }else {
                var or__3548__auto____5230 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5230)) {
                  return or__3548__auto____5230
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____5231 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5231)) {
          return or__3548__auto____5231
        }else {
          var or__3548__auto____5232 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5232)) {
            return or__3548__auto____5232
          }else {
            var or__3548__auto____5233 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5233)) {
              return or__3548__auto____5233
            }else {
              var or__3548__auto____5234 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5234)) {
                return or__3548__auto____5234
              }else {
                var or__3548__auto____5235 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5235)) {
                  return or__3548__auto____5235
                }else {
                  var or__3548__auto____5236 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____5236)) {
                    return or__3548__auto____5236
                  }else {
                    var or__3548__auto____5237 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____5237)) {
                      return or__3548__auto____5237
                    }else {
                      var or__3548__auto____5238 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____5238)) {
                        return or__3548__auto____5238
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__5251__delegate = function(x, y, z, args) {
          var or__3548__auto____5239 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5239)) {
            return or__3548__auto____5239
          }else {
            return cljs.core.some.call(null, function(p1__5155_SHARP_) {
              var or__3548__auto____5240 = p1.call(null, p1__5155_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5240)) {
                return or__3548__auto____5240
              }else {
                var or__3548__auto____5241 = p2.call(null, p1__5155_SHARP_);
                if(cljs.core.truth_(or__3548__auto____5241)) {
                  return or__3548__auto____5241
                }else {
                  return p3.call(null, p1__5155_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5251 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5251__delegate.call(this, x, y, z, args)
        };
        G__5251.cljs$lang$maxFixedArity = 3;
        G__5251.cljs$lang$applyTo = function(arglist__5252) {
          var x = cljs.core.first(arglist__5252);
          var y = cljs.core.first(cljs.core.next(arglist__5252));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5252)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5252)));
          return G__5251__delegate(x, y, z, args)
        };
        G__5251.cljs$lang$arity$variadic = G__5251__delegate;
        return G__5251
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5253__delegate = function(p1, p2, p3, ps) {
      var ps__5242 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5156_SHARP_) {
            return p1__5156_SHARP_.call(null, x)
          }, ps__5242)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5157_SHARP_) {
            var or__3548__auto____5243 = p1__5157_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5243)) {
              return or__3548__auto____5243
            }else {
              return p1__5157_SHARP_.call(null, y)
            }
          }, ps__5242)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5158_SHARP_) {
            var or__3548__auto____5244 = p1__5158_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5244)) {
              return or__3548__auto____5244
            }else {
              var or__3548__auto____5245 = p1__5158_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5245)) {
                return or__3548__auto____5245
              }else {
                return p1__5158_SHARP_.call(null, z)
              }
            }
          }, ps__5242)
        };
        var spn__4 = function() {
          var G__5254__delegate = function(x, y, z, args) {
            var or__3548__auto____5246 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____5246)) {
              return or__3548__auto____5246
            }else {
              return cljs.core.some.call(null, function(p1__5159_SHARP_) {
                return cljs.core.some.call(null, p1__5159_SHARP_, args)
              }, ps__5242)
            }
          };
          var G__5254 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5254__delegate.call(this, x, y, z, args)
          };
          G__5254.cljs$lang$maxFixedArity = 3;
          G__5254.cljs$lang$applyTo = function(arglist__5255) {
            var x = cljs.core.first(arglist__5255);
            var y = cljs.core.first(cljs.core.next(arglist__5255));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5255)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5255)));
            return G__5254__delegate(x, y, z, args)
          };
          G__5254.cljs$lang$arity$variadic = G__5254__delegate;
          return G__5254
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__5253 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5253__delegate.call(this, p1, p2, p3, ps)
    };
    G__5253.cljs$lang$maxFixedArity = 3;
    G__5253.cljs$lang$applyTo = function(arglist__5256) {
      var p1 = cljs.core.first(arglist__5256);
      var p2 = cljs.core.first(cljs.core.next(arglist__5256));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5256)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5256)));
      return G__5253__delegate(p1, p2, p3, ps)
    };
    G__5253.cljs$lang$arity$variadic = G__5253__delegate;
    return G__5253
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5257 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5257)) {
        var s__5258 = temp__3698__auto____5257;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5258)), map.call(null, f, cljs.core.rest.call(null, s__5258)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5259 = cljs.core.seq.call(null, c1);
      var s2__5260 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5261 = s1__5259;
        if(cljs.core.truth_(and__3546__auto____5261)) {
          return s2__5260
        }else {
          return and__3546__auto____5261
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5259), cljs.core.first.call(null, s2__5260)), map.call(null, f, cljs.core.rest.call(null, s1__5259), cljs.core.rest.call(null, s2__5260)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5262 = cljs.core.seq.call(null, c1);
      var s2__5263 = cljs.core.seq.call(null, c2);
      var s3__5264 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5265 = s1__5262;
        if(cljs.core.truth_(and__3546__auto____5265)) {
          var and__3546__auto____5266 = s2__5263;
          if(cljs.core.truth_(and__3546__auto____5266)) {
            return s3__5264
          }else {
            return and__3546__auto____5266
          }
        }else {
          return and__3546__auto____5265
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5262), cljs.core.first.call(null, s2__5263), cljs.core.first.call(null, s3__5264)), map.call(null, f, cljs.core.rest.call(null, s1__5262), cljs.core.rest.call(null, s2__5263), cljs.core.rest.call(null, s3__5264)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5269__delegate = function(f, c1, c2, c3, colls) {
      var step__5268 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5267 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5267)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5267), step.call(null, map.call(null, cljs.core.rest, ss__5267)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5208_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5208_SHARP_)
      }, step__5268.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5269 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5269__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5269.cljs$lang$maxFixedArity = 4;
    G__5269.cljs$lang$applyTo = function(arglist__5270) {
      var f = cljs.core.first(arglist__5270);
      var c1 = cljs.core.first(cljs.core.next(arglist__5270));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5270)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5270))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5270))));
      return G__5269__delegate(f, c1, c2, c3, colls)
    };
    G__5269.cljs$lang$arity$variadic = G__5269__delegate;
    return G__5269
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3698__auto____5271 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5271)) {
        var s__5272 = temp__3698__auto____5271;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5272), take.call(null, n - 1, cljs.core.rest.call(null, s__5272)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5275 = function(n, coll) {
    while(true) {
      var s__5273 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5274 = n > 0;
        if(and__3546__auto____5274) {
          return s__5273
        }else {
          return and__3546__auto____5274
        }
      }())) {
        var G__5276 = n - 1;
        var G__5277 = cljs.core.rest.call(null, s__5273);
        n = G__5276;
        coll = G__5277;
        continue
      }else {
        return s__5273
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5275.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5278 = cljs.core.seq.call(null, coll);
  var lead__5279 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5279)) {
      var G__5280 = cljs.core.next.call(null, s__5278);
      var G__5281 = cljs.core.next.call(null, lead__5279);
      s__5278 = G__5280;
      lead__5279 = G__5281;
      continue
    }else {
      return s__5278
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5284 = function(pred, coll) {
    while(true) {
      var s__5282 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5283 = s__5282;
        if(cljs.core.truth_(and__3546__auto____5283)) {
          return pred.call(null, cljs.core.first.call(null, s__5282))
        }else {
          return and__3546__auto____5283
        }
      }())) {
        var G__5285 = pred;
        var G__5286 = cljs.core.rest.call(null, s__5282);
        pred = G__5285;
        coll = G__5286;
        continue
      }else {
        return s__5282
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5284.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5287 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5287)) {
      var s__5288 = temp__3698__auto____5287;
      return cljs.core.concat.call(null, s__5288, cycle.call(null, s__5288))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5289 = cljs.core.seq.call(null, c1);
      var s2__5290 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5291 = s1__5289;
        if(cljs.core.truth_(and__3546__auto____5291)) {
          return s2__5290
        }else {
          return and__3546__auto____5291
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5289), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5290), interleave.call(null, cljs.core.rest.call(null, s1__5289), cljs.core.rest.call(null, s2__5290))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5293__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5292 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5292)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5292), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5292)))
        }else {
          return null
        }
      })
    };
    var G__5293 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5293__delegate.call(this, c1, c2, colls)
    };
    G__5293.cljs$lang$maxFixedArity = 2;
    G__5293.cljs$lang$applyTo = function(arglist__5294) {
      var c1 = cljs.core.first(arglist__5294);
      var c2 = cljs.core.first(cljs.core.next(arglist__5294));
      var colls = cljs.core.rest(cljs.core.next(arglist__5294));
      return G__5293__delegate(c1, c2, colls)
    };
    G__5293.cljs$lang$arity$variadic = G__5293__delegate;
    return G__5293
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5297 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____5295 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____5295)) {
        var coll__5296 = temp__3695__auto____5295;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5296), cat.call(null, cljs.core.rest.call(null, coll__5296), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5297.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5298__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5298 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5298__delegate.call(this, f, coll, colls)
    };
    G__5298.cljs$lang$maxFixedArity = 2;
    G__5298.cljs$lang$applyTo = function(arglist__5299) {
      var f = cljs.core.first(arglist__5299);
      var coll = cljs.core.first(cljs.core.next(arglist__5299));
      var colls = cljs.core.rest(cljs.core.next(arglist__5299));
      return G__5298__delegate(f, coll, colls)
    };
    G__5298.cljs$lang$arity$variadic = G__5298__delegate;
    return G__5298
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5300 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5300)) {
      var s__5301 = temp__3698__auto____5300;
      var f__5302 = cljs.core.first.call(null, s__5301);
      var r__5303 = cljs.core.rest.call(null, s__5301);
      if(cljs.core.truth_(pred.call(null, f__5302))) {
        return cljs.core.cons.call(null, f__5302, filter.call(null, pred, r__5303))
      }else {
        return filter.call(null, pred, r__5303)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5305 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5305.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5304_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5304_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5306__5307 = to;
    if(G__5306__5307 != null) {
      if(function() {
        var or__3548__auto____5308 = G__5306__5307.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____5308) {
          return or__3548__auto____5308
        }else {
          return G__5306__5307.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5306__5307.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5306__5307)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5306__5307)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5309__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5309 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5309__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5309.cljs$lang$maxFixedArity = 4;
    G__5309.cljs$lang$applyTo = function(arglist__5310) {
      var f = cljs.core.first(arglist__5310);
      var c1 = cljs.core.first(cljs.core.next(arglist__5310));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5310)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5310))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5310))));
      return G__5309__delegate(f, c1, c2, c3, colls)
    };
    G__5309.cljs$lang$arity$variadic = G__5309__delegate;
    return G__5309
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5311 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5311)) {
        var s__5312 = temp__3698__auto____5311;
        var p__5313 = cljs.core.take.call(null, n, s__5312);
        if(n === cljs.core.count.call(null, p__5313)) {
          return cljs.core.cons.call(null, p__5313, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5312)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5314 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5314)) {
        var s__5315 = temp__3698__auto____5314;
        var p__5316 = cljs.core.take.call(null, n, s__5315);
        if(n === cljs.core.count.call(null, p__5316)) {
          return cljs.core.cons.call(null, p__5316, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5315)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5316, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5317 = cljs.core.lookup_sentinel;
    var m__5318 = m;
    var ks__5319 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5319)) {
        var m__5320 = cljs.core.get.call(null, m__5318, cljs.core.first.call(null, ks__5319), sentinel__5317);
        if(sentinel__5317 === m__5320) {
          return not_found
        }else {
          var G__5321 = sentinel__5317;
          var G__5322 = m__5320;
          var G__5323 = cljs.core.next.call(null, ks__5319);
          sentinel__5317 = G__5321;
          m__5318 = G__5322;
          ks__5319 = G__5323;
          continue
        }
      }else {
        return m__5318
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5324, v) {
  var vec__5325__5326 = p__5324;
  var k__5327 = cljs.core.nth.call(null, vec__5325__5326, 0, null);
  var ks__5328 = cljs.core.nthnext.call(null, vec__5325__5326, 1);
  if(cljs.core.truth_(ks__5328)) {
    return cljs.core.assoc.call(null, m, k__5327, assoc_in.call(null, cljs.core.get.call(null, m, k__5327), ks__5328, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5327, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5329, f, args) {
    var vec__5330__5331 = p__5329;
    var k__5332 = cljs.core.nth.call(null, vec__5330__5331, 0, null);
    var ks__5333 = cljs.core.nthnext.call(null, vec__5330__5331, 1);
    if(cljs.core.truth_(ks__5333)) {
      return cljs.core.assoc.call(null, m, k__5332, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5332), ks__5333, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5332, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5332), args))
    }
  };
  var update_in = function(m, p__5329, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5329, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5334) {
    var m = cljs.core.first(arglist__5334);
    var p__5329 = cljs.core.first(cljs.core.next(arglist__5334));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5334)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5334)));
    return update_in__delegate(m, p__5329, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5339 = this;
  var h__364__auto____5340 = this__5339.__hash;
  if(h__364__auto____5340 != null) {
    return h__364__auto____5340
  }else {
    var h__364__auto____5341 = cljs.core.hash_coll.call(null, coll);
    this__5339.__hash = h__364__auto____5341;
    return h__364__auto____5341
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5342 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5343 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5344 = this;
  var new_array__5345 = cljs.core.aclone.call(null, this__5344.array);
  new_array__5345[k] = v;
  return new cljs.core.Vector(this__5344.meta, new_array__5345, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5374 = null;
  var G__5374__2 = function(tsym5337, k) {
    var this__5346 = this;
    var tsym5337__5347 = this;
    var coll__5348 = tsym5337__5347;
    return cljs.core._lookup.call(null, coll__5348, k)
  };
  var G__5374__3 = function(tsym5338, k, not_found) {
    var this__5349 = this;
    var tsym5338__5350 = this;
    var coll__5351 = tsym5338__5350;
    return cljs.core._lookup.call(null, coll__5351, k, not_found)
  };
  G__5374 = function(tsym5338, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5374__2.call(this, tsym5338, k);
      case 3:
        return G__5374__3.call(this, tsym5338, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5374
}();
cljs.core.Vector.prototype.apply = function(tsym5335, args5336) {
  return tsym5335.call.apply(tsym5335, [tsym5335].concat(cljs.core.aclone.call(null, args5336)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5352 = this;
  var new_array__5353 = cljs.core.aclone.call(null, this__5352.array);
  new_array__5353.push(o);
  return new cljs.core.Vector(this__5352.meta, new_array__5353, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5354 = this;
  var this$__5355 = this;
  return cljs.core.pr_str.call(null, this$__5355)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5356 = this;
  return cljs.core.ci_reduce.call(null, this__5356.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5357 = this;
  return cljs.core.ci_reduce.call(null, this__5357.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5358 = this;
  if(this__5358.array.length > 0) {
    var vector_seq__5359 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5358.array.length) {
          return cljs.core.cons.call(null, this__5358.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5359.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5360 = this;
  return this__5360.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5361 = this;
  var count__5362 = this__5361.array.length;
  if(count__5362 > 0) {
    return this__5361.array[count__5362 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5363 = this;
  if(this__5363.array.length > 0) {
    var new_array__5364 = cljs.core.aclone.call(null, this__5363.array);
    new_array__5364.pop();
    return new cljs.core.Vector(this__5363.meta, new_array__5364, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5365 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5366 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5367 = this;
  return new cljs.core.Vector(meta, this__5367.array, this__5367.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5368 = this;
  return this__5368.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5370 = this;
  if(function() {
    var and__3546__auto____5371 = 0 <= n;
    if(and__3546__auto____5371) {
      return n < this__5370.array.length
    }else {
      return and__3546__auto____5371
    }
  }()) {
    return this__5370.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5372 = this;
  if(function() {
    var and__3546__auto____5373 = 0 <= n;
    if(and__3546__auto____5373) {
      return n < this__5372.array.length
    }else {
      return and__3546__auto____5373
    }
  }()) {
    return this__5372.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5369 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5369.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5375 = pv.cnt;
  if(cnt__5375 < 32) {
    return 0
  }else {
    return cnt__5375 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5376 = level;
  var ret__5377 = node;
  while(true) {
    if(ll__5376 === 0) {
      return ret__5377
    }else {
      var embed__5378 = ret__5377;
      var r__5379 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5380 = cljs.core.pv_aset.call(null, r__5379, 0, embed__5378);
      var G__5381 = ll__5376 - 5;
      var G__5382 = r__5379;
      ll__5376 = G__5381;
      ret__5377 = G__5382;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5383 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5384 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5383, subidx__5384, tailnode);
    return ret__5383
  }else {
    var temp__3695__auto____5385 = cljs.core.pv_aget.call(null, parent, subidx__5384);
    if(cljs.core.truth_(temp__3695__auto____5385)) {
      var child__5386 = temp__3695__auto____5385;
      var node_to_insert__5387 = push_tail.call(null, pv, level - 5, child__5386, tailnode);
      cljs.core.pv_aset.call(null, ret__5383, subidx__5384, node_to_insert__5387);
      return ret__5383
    }else {
      var node_to_insert__5388 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5383, subidx__5384, node_to_insert__5388);
      return ret__5383
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____5389 = 0 <= i;
    if(and__3546__auto____5389) {
      return i < pv.cnt
    }else {
      return and__3546__auto____5389
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5390 = pv.root;
      var level__5391 = pv.shift;
      while(true) {
        if(level__5391 > 0) {
          var G__5392 = cljs.core.pv_aget.call(null, node__5390, i >>> level__5391 & 31);
          var G__5393 = level__5391 - 5;
          node__5390 = G__5392;
          level__5391 = G__5393;
          continue
        }else {
          return node__5390.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5394 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5394, i & 31, val);
    return ret__5394
  }else {
    var subidx__5395 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5394, subidx__5395, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5395), i, val));
    return ret__5394
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5396 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5397 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5396));
    if(function() {
      var and__3546__auto____5398 = new_child__5397 == null;
      if(and__3546__auto____5398) {
        return subidx__5396 === 0
      }else {
        return and__3546__auto____5398
      }
    }()) {
      return null
    }else {
      var ret__5399 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5399, subidx__5396, new_child__5397);
      return ret__5399
    }
  }else {
    if(subidx__5396 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5400 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5400, subidx__5396, null);
        return ret__5400
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5401 = cljs.core._count.call(null, v);
  if(c__5401 > 0) {
    if(void 0 === cljs.core.t5402) {
      cljs.core.t5402 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5402.cljs$lang$type = true;
      cljs.core.t5402.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5402")
      };
      cljs.core.t5402.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5402.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5403 = this;
        return vseq
      };
      cljs.core.t5402.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5402.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5404 = this;
        return cljs.core._nth.call(null, this__5404.v, this__5404.offset)
      };
      cljs.core.t5402.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5405 = this;
        var offset__5406 = this__5405.offset + 1;
        if(offset__5406 < this__5405.c) {
          return this__5405.vector_seq.call(null, this__5405.v, offset__5406)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5402.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5402.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5402.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5407 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5402.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5402.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5402.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5408 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5402.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5402.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5409 = this;
        return this__5409.__meta__389__auto__
      };
      cljs.core.t5402.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5402.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5410 = this;
        return new cljs.core.t5402(this__5410.c, this__5410.offset, this__5410.v, this__5410.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5402
    }else {
    }
    return new cljs.core.t5402(c__5401, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5415 = this;
  return new cljs.core.TransientVector(this__5415.cnt, this__5415.shift, cljs.core.tv_editable_root.call(null, this__5415.root), cljs.core.tv_editable_tail.call(null, this__5415.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5416 = this;
  var h__364__auto____5417 = this__5416.__hash;
  if(h__364__auto____5417 != null) {
    return h__364__auto____5417
  }else {
    var h__364__auto____5418 = cljs.core.hash_coll.call(null, coll);
    this__5416.__hash = h__364__auto____5418;
    return h__364__auto____5418
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5419 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5420 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5421 = this;
  if(function() {
    var and__3546__auto____5422 = 0 <= k;
    if(and__3546__auto____5422) {
      return k < this__5421.cnt
    }else {
      return and__3546__auto____5422
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5423 = cljs.core.aclone.call(null, this__5421.tail);
      new_tail__5423[k & 31] = v;
      return new cljs.core.PersistentVector(this__5421.meta, this__5421.cnt, this__5421.shift, this__5421.root, new_tail__5423, null)
    }else {
      return new cljs.core.PersistentVector(this__5421.meta, this__5421.cnt, this__5421.shift, cljs.core.do_assoc.call(null, coll, this__5421.shift, this__5421.root, k, v), this__5421.tail, null)
    }
  }else {
    if(k === this__5421.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5421.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5468 = null;
  var G__5468__2 = function(tsym5413, k) {
    var this__5424 = this;
    var tsym5413__5425 = this;
    var coll__5426 = tsym5413__5425;
    return cljs.core._lookup.call(null, coll__5426, k)
  };
  var G__5468__3 = function(tsym5414, k, not_found) {
    var this__5427 = this;
    var tsym5414__5428 = this;
    var coll__5429 = tsym5414__5428;
    return cljs.core._lookup.call(null, coll__5429, k, not_found)
  };
  G__5468 = function(tsym5414, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5468__2.call(this, tsym5414, k);
      case 3:
        return G__5468__3.call(this, tsym5414, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5468
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5411, args5412) {
  return tsym5411.call.apply(tsym5411, [tsym5411].concat(cljs.core.aclone.call(null, args5412)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5430 = this;
  var step_init__5431 = [0, init];
  var i__5432 = 0;
  while(true) {
    if(i__5432 < this__5430.cnt) {
      var arr__5433 = cljs.core.array_for.call(null, v, i__5432);
      var len__5434 = arr__5433.length;
      var init__5438 = function() {
        var j__5435 = 0;
        var init__5436 = step_init__5431[1];
        while(true) {
          if(j__5435 < len__5434) {
            var init__5437 = f.call(null, init__5436, j__5435 + i__5432, arr__5433[j__5435]);
            if(cljs.core.reduced_QMARK_.call(null, init__5437)) {
              return init__5437
            }else {
              var G__5469 = j__5435 + 1;
              var G__5470 = init__5437;
              j__5435 = G__5469;
              init__5436 = G__5470;
              continue
            }
          }else {
            step_init__5431[0] = len__5434;
            step_init__5431[1] = init__5436;
            return init__5436
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5438)) {
        return cljs.core.deref.call(null, init__5438)
      }else {
        var G__5471 = i__5432 + step_init__5431[0];
        i__5432 = G__5471;
        continue
      }
    }else {
      return step_init__5431[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5439 = this;
  if(this__5439.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5440 = cljs.core.aclone.call(null, this__5439.tail);
    new_tail__5440.push(o);
    return new cljs.core.PersistentVector(this__5439.meta, this__5439.cnt + 1, this__5439.shift, this__5439.root, new_tail__5440, null)
  }else {
    var root_overflow_QMARK___5441 = this__5439.cnt >>> 5 > 1 << this__5439.shift;
    var new_shift__5442 = root_overflow_QMARK___5441 ? this__5439.shift + 5 : this__5439.shift;
    var new_root__5444 = root_overflow_QMARK___5441 ? function() {
      var n_r__5443 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5443, 0, this__5439.root);
      cljs.core.pv_aset.call(null, n_r__5443, 1, cljs.core.new_path.call(null, null, this__5439.shift, new cljs.core.VectorNode(null, this__5439.tail)));
      return n_r__5443
    }() : cljs.core.push_tail.call(null, coll, this__5439.shift, this__5439.root, new cljs.core.VectorNode(null, this__5439.tail));
    return new cljs.core.PersistentVector(this__5439.meta, this__5439.cnt + 1, new_shift__5442, new_root__5444, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5445 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5446 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5447 = this;
  var this$__5448 = this;
  return cljs.core.pr_str.call(null, this$__5448)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5449 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5450 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5451 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5452 = this;
  return this__5452.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5453 = this;
  if(this__5453.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5453.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5454 = this;
  if(this__5454.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5454.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5454.meta)
    }else {
      if(1 < this__5454.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5454.meta, this__5454.cnt - 1, this__5454.shift, this__5454.root, this__5454.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5455 = cljs.core.array_for.call(null, coll, this__5454.cnt - 2);
          var nr__5456 = cljs.core.pop_tail.call(null, coll, this__5454.shift, this__5454.root);
          var new_root__5457 = nr__5456 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5456;
          var cnt_1__5458 = this__5454.cnt - 1;
          if(function() {
            var and__3546__auto____5459 = 5 < this__5454.shift;
            if(and__3546__auto____5459) {
              return cljs.core.pv_aget.call(null, new_root__5457, 1) == null
            }else {
              return and__3546__auto____5459
            }
          }()) {
            return new cljs.core.PersistentVector(this__5454.meta, cnt_1__5458, this__5454.shift - 5, cljs.core.pv_aget.call(null, new_root__5457, 0), new_tail__5455, null)
          }else {
            return new cljs.core.PersistentVector(this__5454.meta, cnt_1__5458, this__5454.shift, new_root__5457, new_tail__5455, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5461 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5462 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5463 = this;
  return new cljs.core.PersistentVector(meta, this__5463.cnt, this__5463.shift, this__5463.root, this__5463.tail, this__5463.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5464 = this;
  return this__5464.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5465 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5466 = this;
  if(function() {
    var and__3546__auto____5467 = 0 <= n;
    if(and__3546__auto____5467) {
      return n < this__5466.cnt
    }else {
      return and__3546__auto____5467
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5460 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5460.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5472 = cljs.core.seq.call(null, xs);
  var out__5473 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5472)) {
      var G__5474 = cljs.core.next.call(null, xs__5472);
      var G__5475 = cljs.core.conj_BANG_.call(null, out__5473, cljs.core.first.call(null, xs__5472));
      xs__5472 = G__5474;
      out__5473 = G__5475;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5473)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__5476) {
    var args = cljs.core.seq(arglist__5476);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5481 = this;
  var h__364__auto____5482 = this__5481.__hash;
  if(h__364__auto____5482 != null) {
    return h__364__auto____5482
  }else {
    var h__364__auto____5483 = cljs.core.hash_coll.call(null, coll);
    this__5481.__hash = h__364__auto____5483;
    return h__364__auto____5483
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5484 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5485 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5486 = this;
  var v_pos__5487 = this__5486.start + key;
  return new cljs.core.Subvec(this__5486.meta, cljs.core._assoc.call(null, this__5486.v, v_pos__5487, val), this__5486.start, this__5486.end > v_pos__5487 + 1 ? this__5486.end : v_pos__5487 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5511 = null;
  var G__5511__2 = function(tsym5479, k) {
    var this__5488 = this;
    var tsym5479__5489 = this;
    var coll__5490 = tsym5479__5489;
    return cljs.core._lookup.call(null, coll__5490, k)
  };
  var G__5511__3 = function(tsym5480, k, not_found) {
    var this__5491 = this;
    var tsym5480__5492 = this;
    var coll__5493 = tsym5480__5492;
    return cljs.core._lookup.call(null, coll__5493, k, not_found)
  };
  G__5511 = function(tsym5480, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5511__2.call(this, tsym5480, k);
      case 3:
        return G__5511__3.call(this, tsym5480, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5511
}();
cljs.core.Subvec.prototype.apply = function(tsym5477, args5478) {
  return tsym5477.call.apply(tsym5477, [tsym5477].concat(cljs.core.aclone.call(null, args5478)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5494 = this;
  return new cljs.core.Subvec(this__5494.meta, cljs.core._assoc_n.call(null, this__5494.v, this__5494.end, o), this__5494.start, this__5494.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5495 = this;
  var this$__5496 = this;
  return cljs.core.pr_str.call(null, this$__5496)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5497 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5498 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5499 = this;
  var subvec_seq__5500 = function subvec_seq(i) {
    if(i === this__5499.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5499.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5500.call(null, this__5499.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5501 = this;
  return this__5501.end - this__5501.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5502 = this;
  return cljs.core._nth.call(null, this__5502.v, this__5502.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5503 = this;
  if(this__5503.start === this__5503.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5503.meta, this__5503.v, this__5503.start, this__5503.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5504 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5505 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5506 = this;
  return new cljs.core.Subvec(meta, this__5506.v, this__5506.start, this__5506.end, this__5506.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5507 = this;
  return this__5507.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5509 = this;
  return cljs.core._nth.call(null, this__5509.v, this__5509.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5510 = this;
  return cljs.core._nth.call(null, this__5510.v, this__5510.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5508 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5508.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5512 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5512, 0, tl.length);
  return ret__5512
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5513 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5514 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5513, subidx__5514, level === 5 ? tail_node : function() {
    var child__5515 = cljs.core.pv_aget.call(null, ret__5513, subidx__5514);
    if(child__5515 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5515, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5513
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5516 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5517 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5518 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5516, subidx__5517));
    if(function() {
      var and__3546__auto____5519 = new_child__5518 == null;
      if(and__3546__auto____5519) {
        return subidx__5517 === 0
      }else {
        return and__3546__auto____5519
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5516, subidx__5517, new_child__5518);
      return node__5516
    }
  }else {
    if(subidx__5517 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5516, subidx__5517, null);
        return node__5516
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____5520 = 0 <= i;
    if(and__3546__auto____5520) {
      return i < tv.cnt
    }else {
      return and__3546__auto____5520
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5521 = tv.root;
      var node__5522 = root__5521;
      var level__5523 = tv.shift;
      while(true) {
        if(level__5523 > 0) {
          var G__5524 = cljs.core.tv_ensure_editable.call(null, root__5521.edit, cljs.core.pv_aget.call(null, node__5522, i >>> level__5523 & 31));
          var G__5525 = level__5523 - 5;
          node__5522 = G__5524;
          level__5523 = G__5525;
          continue
        }else {
          return node__5522.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5563 = null;
  var G__5563__2 = function(tsym5528, k) {
    var this__5530 = this;
    var tsym5528__5531 = this;
    var coll__5532 = tsym5528__5531;
    return cljs.core._lookup.call(null, coll__5532, k)
  };
  var G__5563__3 = function(tsym5529, k, not_found) {
    var this__5533 = this;
    var tsym5529__5534 = this;
    var coll__5535 = tsym5529__5534;
    return cljs.core._lookup.call(null, coll__5535, k, not_found)
  };
  G__5563 = function(tsym5529, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5563__2.call(this, tsym5529, k);
      case 3:
        return G__5563__3.call(this, tsym5529, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5563
}();
cljs.core.TransientVector.prototype.apply = function(tsym5526, args5527) {
  return tsym5526.call.apply(tsym5526, [tsym5526].concat(cljs.core.aclone.call(null, args5527)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5536 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5537 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5538 = this;
  if(cljs.core.truth_(this__5538.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5539 = this;
  if(function() {
    var and__3546__auto____5540 = 0 <= n;
    if(and__3546__auto____5540) {
      return n < this__5539.cnt
    }else {
      return and__3546__auto____5540
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5541 = this;
  if(cljs.core.truth_(this__5541.root.edit)) {
    return this__5541.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5542 = this;
  if(cljs.core.truth_(this__5542.root.edit)) {
    if(function() {
      var and__3546__auto____5543 = 0 <= n;
      if(and__3546__auto____5543) {
        return n < this__5542.cnt
      }else {
        return and__3546__auto____5543
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5542.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5546 = function go(level, node) {
          var node__5544 = cljs.core.tv_ensure_editable.call(null, this__5542.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5544, n & 31, val);
            return node__5544
          }else {
            var subidx__5545 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5544, subidx__5545, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5544, subidx__5545)));
            return node__5544
          }
        }.call(null, this__5542.shift, this__5542.root);
        this__5542.root = new_root__5546;
        return tcoll
      }
    }else {
      if(n === this__5542.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5542.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5547 = this;
  if(cljs.core.truth_(this__5547.root.edit)) {
    if(this__5547.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5547.cnt) {
        this__5547.cnt = 0;
        return tcoll
      }else {
        if((this__5547.cnt - 1 & 31) > 0) {
          this__5547.cnt = this__5547.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5548 = cljs.core.editable_array_for.call(null, tcoll, this__5547.cnt - 2);
            var new_root__5550 = function() {
              var nr__5549 = cljs.core.tv_pop_tail.call(null, tcoll, this__5547.shift, this__5547.root);
              if(nr__5549 != null) {
                return nr__5549
              }else {
                return new cljs.core.VectorNode(this__5547.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____5551 = 5 < this__5547.shift;
              if(and__3546__auto____5551) {
                return cljs.core.pv_aget.call(null, new_root__5550, 1) == null
              }else {
                return and__3546__auto____5551
              }
            }()) {
              var new_root__5552 = cljs.core.tv_ensure_editable.call(null, this__5547.root.edit, cljs.core.pv_aget.call(null, new_root__5550, 0));
              this__5547.root = new_root__5552;
              this__5547.shift = this__5547.shift - 5;
              this__5547.cnt = this__5547.cnt - 1;
              this__5547.tail = new_tail__5548;
              return tcoll
            }else {
              this__5547.root = new_root__5550;
              this__5547.cnt = this__5547.cnt - 1;
              this__5547.tail = new_tail__5548;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5553 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5554 = this;
  if(cljs.core.truth_(this__5554.root.edit)) {
    if(this__5554.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5554.tail[this__5554.cnt & 31] = o;
      this__5554.cnt = this__5554.cnt + 1;
      return tcoll
    }else {
      var tail_node__5555 = new cljs.core.VectorNode(this__5554.root.edit, this__5554.tail);
      var new_tail__5556 = cljs.core.make_array.call(null, 32);
      new_tail__5556[0] = o;
      this__5554.tail = new_tail__5556;
      if(this__5554.cnt >>> 5 > 1 << this__5554.shift) {
        var new_root_array__5557 = cljs.core.make_array.call(null, 32);
        var new_shift__5558 = this__5554.shift + 5;
        new_root_array__5557[0] = this__5554.root;
        new_root_array__5557[1] = cljs.core.new_path.call(null, this__5554.root.edit, this__5554.shift, tail_node__5555);
        this__5554.root = new cljs.core.VectorNode(this__5554.root.edit, new_root_array__5557);
        this__5554.shift = new_shift__5558;
        this__5554.cnt = this__5554.cnt + 1;
        return tcoll
      }else {
        var new_root__5559 = cljs.core.tv_push_tail.call(null, tcoll, this__5554.shift, this__5554.root, tail_node__5555);
        this__5554.root = new_root__5559;
        this__5554.cnt = this__5554.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5560 = this;
  if(cljs.core.truth_(this__5560.root.edit)) {
    this__5560.root.edit = null;
    var len__5561 = this__5560.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5562 = cljs.core.make_array.call(null, len__5561);
    cljs.core.array_copy.call(null, this__5560.tail, 0, trimmed_tail__5562, 0, len__5561);
    return new cljs.core.PersistentVector(null, this__5560.cnt, this__5560.shift, this__5560.root, trimmed_tail__5562, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5564 = this;
  var h__364__auto____5565 = this__5564.__hash;
  if(h__364__auto____5565 != null) {
    return h__364__auto____5565
  }else {
    var h__364__auto____5566 = cljs.core.hash_coll.call(null, coll);
    this__5564.__hash = h__364__auto____5566;
    return h__364__auto____5566
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5567 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5568 = this;
  var this$__5569 = this;
  return cljs.core.pr_str.call(null, this$__5569)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5570 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5571 = this;
  return cljs.core._first.call(null, this__5571.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5572 = this;
  var temp__3695__auto____5573 = cljs.core.next.call(null, this__5572.front);
  if(cljs.core.truth_(temp__3695__auto____5573)) {
    var f1__5574 = temp__3695__auto____5573;
    return new cljs.core.PersistentQueueSeq(this__5572.meta, f1__5574, this__5572.rear, null)
  }else {
    if(this__5572.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5572.meta, this__5572.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5575 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5576 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5576.front, this__5576.rear, this__5576.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5577 = this;
  return this__5577.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5578 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5578.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5579 = this;
  var h__364__auto____5580 = this__5579.__hash;
  if(h__364__auto____5580 != null) {
    return h__364__auto____5580
  }else {
    var h__364__auto____5581 = cljs.core.hash_coll.call(null, coll);
    this__5579.__hash = h__364__auto____5581;
    return h__364__auto____5581
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5582 = this;
  if(cljs.core.truth_(this__5582.front)) {
    return new cljs.core.PersistentQueue(this__5582.meta, this__5582.count + 1, this__5582.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____5583 = this__5582.rear;
      if(cljs.core.truth_(or__3548__auto____5583)) {
        return or__3548__auto____5583
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5582.meta, this__5582.count + 1, cljs.core.conj.call(null, this__5582.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5584 = this;
  var this$__5585 = this;
  return cljs.core.pr_str.call(null, this$__5585)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5586 = this;
  var rear__5587 = cljs.core.seq.call(null, this__5586.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5588 = this__5586.front;
    if(cljs.core.truth_(or__3548__auto____5588)) {
      return or__3548__auto____5588
    }else {
      return rear__5587
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5586.front, cljs.core.seq.call(null, rear__5587), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5589 = this;
  return this__5589.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5590 = this;
  return cljs.core._first.call(null, this__5590.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5591 = this;
  if(cljs.core.truth_(this__5591.front)) {
    var temp__3695__auto____5592 = cljs.core.next.call(null, this__5591.front);
    if(cljs.core.truth_(temp__3695__auto____5592)) {
      var f1__5593 = temp__3695__auto____5592;
      return new cljs.core.PersistentQueue(this__5591.meta, this__5591.count - 1, f1__5593, this__5591.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5591.meta, this__5591.count - 1, cljs.core.seq.call(null, this__5591.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5594 = this;
  return cljs.core.first.call(null, this__5594.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5595 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5596 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5597 = this;
  return new cljs.core.PersistentQueue(meta, this__5597.count, this__5597.front, this__5597.rear, this__5597.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5598 = this;
  return this__5598.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5599 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5600 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5601 = array.length;
  var i__5602 = 0;
  while(true) {
    if(i__5602 < len__5601) {
      if(cljs.core._EQ_.call(null, k, array[i__5602])) {
        return i__5602
      }else {
        var G__5603 = i__5602 + incr;
        i__5602 = G__5603;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5604 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____5604)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____5604
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5605 = cljs.core.hash.call(null, a);
  var b__5606 = cljs.core.hash.call(null, b);
  if(a__5605 < b__5606) {
    return-1
  }else {
    if(a__5605 > b__5606) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5608 = m.keys;
  var len__5609 = ks__5608.length;
  var so__5610 = m.strobj;
  var out__5611 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5612 = 0;
  var out__5613 = cljs.core.transient$.call(null, out__5611);
  while(true) {
    if(i__5612 < len__5609) {
      var k__5614 = ks__5608[i__5612];
      var G__5615 = i__5612 + 1;
      var G__5616 = cljs.core.assoc_BANG_.call(null, out__5613, k__5614, so__5610[k__5614]);
      i__5612 = G__5615;
      out__5613 = G__5616;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5613, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5621 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5622 = this;
  var h__364__auto____5623 = this__5622.__hash;
  if(h__364__auto____5623 != null) {
    return h__364__auto____5623
  }else {
    var h__364__auto____5624 = cljs.core.hash_imap.call(null, coll);
    this__5622.__hash = h__364__auto____5624;
    return h__364__auto____5624
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5625 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5626 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5626.strobj, this__5626.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5627 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5628 = this__5627.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5628)) {
      var new_strobj__5629 = goog.object.clone.call(null, this__5627.strobj);
      new_strobj__5629[k] = v;
      return new cljs.core.ObjMap(this__5627.meta, this__5627.keys, new_strobj__5629, this__5627.update_count + 1, null)
    }else {
      if(this__5627.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5630 = goog.object.clone.call(null, this__5627.strobj);
        var new_keys__5631 = cljs.core.aclone.call(null, this__5627.keys);
        new_strobj__5630[k] = v;
        new_keys__5631.push(k);
        return new cljs.core.ObjMap(this__5627.meta, new_keys__5631, new_strobj__5630, this__5627.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5632 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5632.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5652 = null;
  var G__5652__2 = function(tsym5619, k) {
    var this__5633 = this;
    var tsym5619__5634 = this;
    var coll__5635 = tsym5619__5634;
    return cljs.core._lookup.call(null, coll__5635, k)
  };
  var G__5652__3 = function(tsym5620, k, not_found) {
    var this__5636 = this;
    var tsym5620__5637 = this;
    var coll__5638 = tsym5620__5637;
    return cljs.core._lookup.call(null, coll__5638, k, not_found)
  };
  G__5652 = function(tsym5620, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5652__2.call(this, tsym5620, k);
      case 3:
        return G__5652__3.call(this, tsym5620, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5652
}();
cljs.core.ObjMap.prototype.apply = function(tsym5617, args5618) {
  return tsym5617.call.apply(tsym5617, [tsym5617].concat(cljs.core.aclone.call(null, args5618)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5639 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5640 = this;
  var this$__5641 = this;
  return cljs.core.pr_str.call(null, this$__5641)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5642 = this;
  if(this__5642.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5607_SHARP_) {
      return cljs.core.vector.call(null, p1__5607_SHARP_, this__5642.strobj[p1__5607_SHARP_])
    }, this__5642.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5643 = this;
  return this__5643.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5644 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5645 = this;
  return new cljs.core.ObjMap(meta, this__5645.keys, this__5645.strobj, this__5645.update_count, this__5645.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5646 = this;
  return this__5646.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5647 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5647.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5648 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____5649 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____5649)) {
      return this__5648.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____5649
    }
  }())) {
    var new_keys__5650 = cljs.core.aclone.call(null, this__5648.keys);
    var new_strobj__5651 = goog.object.clone.call(null, this__5648.strobj);
    new_keys__5650.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5650), 1);
    cljs.core.js_delete.call(null, new_strobj__5651, k);
    return new cljs.core.ObjMap(this__5648.meta, new_keys__5650, new_strobj__5651, this__5648.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5658 = this;
  var h__364__auto____5659 = this__5658.__hash;
  if(h__364__auto____5659 != null) {
    return h__364__auto____5659
  }else {
    var h__364__auto____5660 = cljs.core.hash_imap.call(null, coll);
    this__5658.__hash = h__364__auto____5660;
    return h__364__auto____5660
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5661 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5662 = this;
  var bucket__5663 = this__5662.hashobj[cljs.core.hash.call(null, k)];
  var i__5664 = cljs.core.truth_(bucket__5663) ? cljs.core.scan_array.call(null, 2, k, bucket__5663) : null;
  if(cljs.core.truth_(i__5664)) {
    return bucket__5663[i__5664 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5665 = this;
  var h__5666 = cljs.core.hash.call(null, k);
  var bucket__5667 = this__5665.hashobj[h__5666];
  if(cljs.core.truth_(bucket__5667)) {
    var new_bucket__5668 = cljs.core.aclone.call(null, bucket__5667);
    var new_hashobj__5669 = goog.object.clone.call(null, this__5665.hashobj);
    new_hashobj__5669[h__5666] = new_bucket__5668;
    var temp__3695__auto____5670 = cljs.core.scan_array.call(null, 2, k, new_bucket__5668);
    if(cljs.core.truth_(temp__3695__auto____5670)) {
      var i__5671 = temp__3695__auto____5670;
      new_bucket__5668[i__5671 + 1] = v;
      return new cljs.core.HashMap(this__5665.meta, this__5665.count, new_hashobj__5669, null)
    }else {
      new_bucket__5668.push(k, v);
      return new cljs.core.HashMap(this__5665.meta, this__5665.count + 1, new_hashobj__5669, null)
    }
  }else {
    var new_hashobj__5672 = goog.object.clone.call(null, this__5665.hashobj);
    new_hashobj__5672[h__5666] = [k, v];
    return new cljs.core.HashMap(this__5665.meta, this__5665.count + 1, new_hashobj__5672, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5673 = this;
  var bucket__5674 = this__5673.hashobj[cljs.core.hash.call(null, k)];
  var i__5675 = cljs.core.truth_(bucket__5674) ? cljs.core.scan_array.call(null, 2, k, bucket__5674) : null;
  if(cljs.core.truth_(i__5675)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5698 = null;
  var G__5698__2 = function(tsym5656, k) {
    var this__5676 = this;
    var tsym5656__5677 = this;
    var coll__5678 = tsym5656__5677;
    return cljs.core._lookup.call(null, coll__5678, k)
  };
  var G__5698__3 = function(tsym5657, k, not_found) {
    var this__5679 = this;
    var tsym5657__5680 = this;
    var coll__5681 = tsym5657__5680;
    return cljs.core._lookup.call(null, coll__5681, k, not_found)
  };
  G__5698 = function(tsym5657, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5698__2.call(this, tsym5657, k);
      case 3:
        return G__5698__3.call(this, tsym5657, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5698
}();
cljs.core.HashMap.prototype.apply = function(tsym5654, args5655) {
  return tsym5654.call.apply(tsym5654, [tsym5654].concat(cljs.core.aclone.call(null, args5655)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5682 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5683 = this;
  var this$__5684 = this;
  return cljs.core.pr_str.call(null, this$__5684)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5685 = this;
  if(this__5685.count > 0) {
    var hashes__5686 = cljs.core.js_keys.call(null, this__5685.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5653_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5685.hashobj[p1__5653_SHARP_]))
    }, hashes__5686)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5687 = this;
  return this__5687.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5688 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5689 = this;
  return new cljs.core.HashMap(meta, this__5689.count, this__5689.hashobj, this__5689.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5690 = this;
  return this__5690.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5691 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5691.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5692 = this;
  var h__5693 = cljs.core.hash.call(null, k);
  var bucket__5694 = this__5692.hashobj[h__5693];
  var i__5695 = cljs.core.truth_(bucket__5694) ? cljs.core.scan_array.call(null, 2, k, bucket__5694) : null;
  if(cljs.core.not.call(null, i__5695)) {
    return coll
  }else {
    var new_hashobj__5696 = goog.object.clone.call(null, this__5692.hashobj);
    if(3 > bucket__5694.length) {
      cljs.core.js_delete.call(null, new_hashobj__5696, h__5693)
    }else {
      var new_bucket__5697 = cljs.core.aclone.call(null, bucket__5694);
      new_bucket__5697.splice(i__5695, 2);
      new_hashobj__5696[h__5693] = new_bucket__5697
    }
    return new cljs.core.HashMap(this__5692.meta, this__5692.count - 1, new_hashobj__5696, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5699 = ks.length;
  var i__5700 = 0;
  var out__5701 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5700 < len__5699) {
      var G__5702 = i__5700 + 1;
      var G__5703 = cljs.core.assoc.call(null, out__5701, ks[i__5700], vs[i__5700]);
      i__5700 = G__5702;
      out__5701 = G__5703;
      continue
    }else {
      return out__5701
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5704 = m.arr;
  var len__5705 = arr__5704.length;
  var i__5706 = 0;
  while(true) {
    if(len__5705 <= i__5706) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5704[i__5706], k)) {
        return i__5706
      }else {
        if("\ufdd0'else") {
          var G__5707 = i__5706 + 2;
          i__5706 = G__5707;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5712 = this;
  return new cljs.core.TransientArrayMap({}, this__5712.arr.length, cljs.core.aclone.call(null, this__5712.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5713 = this;
  var h__364__auto____5714 = this__5713.__hash;
  if(h__364__auto____5714 != null) {
    return h__364__auto____5714
  }else {
    var h__364__auto____5715 = cljs.core.hash_imap.call(null, coll);
    this__5713.__hash = h__364__auto____5715;
    return h__364__auto____5715
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5716 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5717 = this;
  var idx__5718 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5718 === -1) {
    return not_found
  }else {
    return this__5717.arr[idx__5718 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5719 = this;
  var idx__5720 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5720 === -1) {
    if(this__5719.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5719.meta, this__5719.cnt + 1, function() {
        var G__5721__5722 = cljs.core.aclone.call(null, this__5719.arr);
        G__5721__5722.push(k);
        G__5721__5722.push(v);
        return G__5721__5722
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5719.arr[idx__5720 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5719.meta, this__5719.cnt, function() {
          var G__5723__5724 = cljs.core.aclone.call(null, this__5719.arr);
          G__5723__5724[idx__5720 + 1] = v;
          return G__5723__5724
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5725 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5755 = null;
  var G__5755__2 = function(tsym5710, k) {
    var this__5726 = this;
    var tsym5710__5727 = this;
    var coll__5728 = tsym5710__5727;
    return cljs.core._lookup.call(null, coll__5728, k)
  };
  var G__5755__3 = function(tsym5711, k, not_found) {
    var this__5729 = this;
    var tsym5711__5730 = this;
    var coll__5731 = tsym5711__5730;
    return cljs.core._lookup.call(null, coll__5731, k, not_found)
  };
  G__5755 = function(tsym5711, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5755__2.call(this, tsym5711, k);
      case 3:
        return G__5755__3.call(this, tsym5711, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5755
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5708, args5709) {
  return tsym5708.call.apply(tsym5708, [tsym5708].concat(cljs.core.aclone.call(null, args5709)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5732 = this;
  var len__5733 = this__5732.arr.length;
  var i__5734 = 0;
  var init__5735 = init;
  while(true) {
    if(i__5734 < len__5733) {
      var init__5736 = f.call(null, init__5735, this__5732.arr[i__5734], this__5732.arr[i__5734 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5736)) {
        return cljs.core.deref.call(null, init__5736)
      }else {
        var G__5756 = i__5734 + 2;
        var G__5757 = init__5736;
        i__5734 = G__5756;
        init__5735 = G__5757;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5737 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5738 = this;
  var this$__5739 = this;
  return cljs.core.pr_str.call(null, this$__5739)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5740 = this;
  if(this__5740.cnt > 0) {
    var len__5741 = this__5740.arr.length;
    var array_map_seq__5742 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5741) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5740.arr[i], this__5740.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5742.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5743 = this;
  return this__5743.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5744 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5745 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5745.cnt, this__5745.arr, this__5745.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5746 = this;
  return this__5746.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5747 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5747.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5748 = this;
  var idx__5749 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5749 >= 0) {
    var len__5750 = this__5748.arr.length;
    var new_len__5751 = len__5750 - 2;
    if(new_len__5751 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5752 = cljs.core.make_array.call(null, new_len__5751);
      var s__5753 = 0;
      var d__5754 = 0;
      while(true) {
        if(s__5753 >= len__5750) {
          return new cljs.core.PersistentArrayMap(this__5748.meta, this__5748.cnt - 1, new_arr__5752, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5748.arr[s__5753])) {
            var G__5758 = s__5753 + 2;
            var G__5759 = d__5754;
            s__5753 = G__5758;
            d__5754 = G__5759;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5752[d__5754] = this__5748.arr[s__5753];
              new_arr__5752[d__5754 + 1] = this__5748.arr[s__5753 + 1];
              var G__5760 = s__5753 + 2;
              var G__5761 = d__5754 + 2;
              s__5753 = G__5760;
              d__5754 = G__5761;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5762 = cljs.core.count.call(null, ks);
  var i__5763 = 0;
  var out__5764 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5763 < len__5762) {
      var G__5765 = i__5763 + 1;
      var G__5766 = cljs.core.assoc_BANG_.call(null, out__5764, ks[i__5763], vs[i__5763]);
      i__5763 = G__5765;
      out__5764 = G__5766;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5764)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5767 = this;
  if(cljs.core.truth_(this__5767.editable_QMARK_)) {
    var idx__5768 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5768 >= 0) {
      this__5767.arr[idx__5768] = this__5767.arr[this__5767.len - 2];
      this__5767.arr[idx__5768 + 1] = this__5767.arr[this__5767.len - 1];
      var G__5769__5770 = this__5767.arr;
      G__5769__5770.pop();
      G__5769__5770.pop();
      G__5769__5770;
      this__5767.len = this__5767.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5771 = this;
  if(cljs.core.truth_(this__5771.editable_QMARK_)) {
    var idx__5772 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5772 === -1) {
      if(this__5771.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5771.len = this__5771.len + 2;
        this__5771.arr.push(key);
        this__5771.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5771.len, this__5771.arr), key, val)
      }
    }else {
      if(val === this__5771.arr[idx__5772 + 1]) {
        return tcoll
      }else {
        this__5771.arr[idx__5772 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5773 = this;
  if(cljs.core.truth_(this__5773.editable_QMARK_)) {
    if(function() {
      var G__5774__5775 = o;
      if(G__5774__5775 != null) {
        if(function() {
          var or__3548__auto____5776 = G__5774__5775.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____5776) {
            return or__3548__auto____5776
          }else {
            return G__5774__5775.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5774__5775.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5774__5775)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5774__5775)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5777 = cljs.core.seq.call(null, o);
      var tcoll__5778 = tcoll;
      while(true) {
        var temp__3695__auto____5779 = cljs.core.first.call(null, es__5777);
        if(cljs.core.truth_(temp__3695__auto____5779)) {
          var e__5780 = temp__3695__auto____5779;
          var G__5786 = cljs.core.next.call(null, es__5777);
          var G__5787 = cljs.core._assoc_BANG_.call(null, tcoll__5778, cljs.core.key.call(null, e__5780), cljs.core.val.call(null, e__5780));
          es__5777 = G__5786;
          tcoll__5778 = G__5787;
          continue
        }else {
          return tcoll__5778
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5781 = this;
  if(cljs.core.truth_(this__5781.editable_QMARK_)) {
    this__5781.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5781.len, 2), this__5781.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5782 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5783 = this;
  if(cljs.core.truth_(this__5783.editable_QMARK_)) {
    var idx__5784 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5784 === -1) {
      return not_found
    }else {
      return this__5783.arr[idx__5784 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5785 = this;
  if(cljs.core.truth_(this__5785.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5785.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5788 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5789 = 0;
  while(true) {
    if(i__5789 < len) {
      var G__5790 = cljs.core.assoc_BANG_.call(null, out__5788, arr[i__5789], arr[i__5789 + 1]);
      var G__5791 = i__5789 + 2;
      out__5788 = G__5790;
      i__5789 = G__5791;
      continue
    }else {
      return out__5788
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5792__5793 = cljs.core.aclone.call(null, arr);
    G__5792__5793[i] = a;
    return G__5792__5793
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5794__5795 = cljs.core.aclone.call(null, arr);
    G__5794__5795[i] = a;
    G__5794__5795[j] = b;
    return G__5794__5795
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5796 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5796, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5796, 2 * i, new_arr__5796.length - 2 * i);
  return new_arr__5796
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5797 = inode.ensure_editable(edit);
    editable__5797.arr[i] = a;
    return editable__5797
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5798 = inode.ensure_editable(edit);
    editable__5798.arr[i] = a;
    editable__5798.arr[j] = b;
    return editable__5798
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5799 = arr.length;
  var i__5800 = 0;
  var init__5801 = init;
  while(true) {
    if(i__5800 < len__5799) {
      var init__5804 = function() {
        var k__5802 = arr[i__5800];
        if(k__5802 != null) {
          return f.call(null, init__5801, k__5802, arr[i__5800 + 1])
        }else {
          var node__5803 = arr[i__5800 + 1];
          if(node__5803 != null) {
            return node__5803.kv_reduce(f, init__5801)
          }else {
            return init__5801
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5804)) {
        return cljs.core.deref.call(null, init__5804)
      }else {
        var G__5805 = i__5800 + 2;
        var G__5806 = init__5804;
        i__5800 = G__5805;
        init__5801 = G__5806;
        continue
      }
    }else {
      return init__5801
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5807 = this;
  var inode__5808 = this;
  if(this__5807.bitmap === bit) {
    return null
  }else {
    var editable__5809 = inode__5808.ensure_editable(e);
    var earr__5810 = editable__5809.arr;
    var len__5811 = earr__5810.length;
    editable__5809.bitmap = bit ^ editable__5809.bitmap;
    cljs.core.array_copy.call(null, earr__5810, 2 * (i + 1), earr__5810, 2 * i, len__5811 - 2 * (i + 1));
    earr__5810[len__5811 - 2] = null;
    earr__5810[len__5811 - 1] = null;
    return editable__5809
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5812 = this;
  var inode__5813 = this;
  var bit__5814 = 1 << (hash >>> shift & 31);
  var idx__5815 = cljs.core.bitmap_indexed_node_index.call(null, this__5812.bitmap, bit__5814);
  if((this__5812.bitmap & bit__5814) === 0) {
    var n__5816 = cljs.core.bit_count.call(null, this__5812.bitmap);
    if(2 * n__5816 < this__5812.arr.length) {
      var editable__5817 = inode__5813.ensure_editable(edit);
      var earr__5818 = editable__5817.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5818, 2 * idx__5815, earr__5818, 2 * (idx__5815 + 1), 2 * (n__5816 - idx__5815));
      earr__5818[2 * idx__5815] = key;
      earr__5818[2 * idx__5815 + 1] = val;
      editable__5817.bitmap = editable__5817.bitmap | bit__5814;
      return editable__5817
    }else {
      if(n__5816 >= 16) {
        var nodes__5819 = cljs.core.make_array.call(null, 32);
        var jdx__5820 = hash >>> shift & 31;
        nodes__5819[jdx__5820] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5821 = 0;
        var j__5822 = 0;
        while(true) {
          if(i__5821 < 32) {
            if((this__5812.bitmap >>> i__5821 & 1) === 0) {
              var G__5875 = i__5821 + 1;
              var G__5876 = j__5822;
              i__5821 = G__5875;
              j__5822 = G__5876;
              continue
            }else {
              nodes__5819[i__5821] = null != this__5812.arr[j__5822] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5812.arr[j__5822]), this__5812.arr[j__5822], this__5812.arr[j__5822 + 1], added_leaf_QMARK_) : this__5812.arr[j__5822 + 1];
              var G__5877 = i__5821 + 1;
              var G__5878 = j__5822 + 2;
              i__5821 = G__5877;
              j__5822 = G__5878;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5816 + 1, nodes__5819)
      }else {
        if("\ufdd0'else") {
          var new_arr__5823 = cljs.core.make_array.call(null, 2 * (n__5816 + 4));
          cljs.core.array_copy.call(null, this__5812.arr, 0, new_arr__5823, 0, 2 * idx__5815);
          new_arr__5823[2 * idx__5815] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5823[2 * idx__5815 + 1] = val;
          cljs.core.array_copy.call(null, this__5812.arr, 2 * idx__5815, new_arr__5823, 2 * (idx__5815 + 1), 2 * (n__5816 - idx__5815));
          var editable__5824 = inode__5813.ensure_editable(edit);
          editable__5824.arr = new_arr__5823;
          editable__5824.bitmap = editable__5824.bitmap | bit__5814;
          return editable__5824
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5825 = this__5812.arr[2 * idx__5815];
    var val_or_node__5826 = this__5812.arr[2 * idx__5815 + 1];
    if(null == key_or_nil__5825) {
      var n__5827 = val_or_node__5826.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5827 === val_or_node__5826) {
        return inode__5813
      }else {
        return cljs.core.edit_and_set.call(null, inode__5813, edit, 2 * idx__5815 + 1, n__5827)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5825)) {
        if(val === val_or_node__5826) {
          return inode__5813
        }else {
          return cljs.core.edit_and_set.call(null, inode__5813, edit, 2 * idx__5815 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5813, edit, 2 * idx__5815, null, 2 * idx__5815 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5825, val_or_node__5826, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5828 = this;
  var inode__5829 = this;
  return cljs.core.create_inode_seq.call(null, this__5828.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5830 = this;
  var inode__5831 = this;
  var bit__5832 = 1 << (hash >>> shift & 31);
  if((this__5830.bitmap & bit__5832) === 0) {
    return inode__5831
  }else {
    var idx__5833 = cljs.core.bitmap_indexed_node_index.call(null, this__5830.bitmap, bit__5832);
    var key_or_nil__5834 = this__5830.arr[2 * idx__5833];
    var val_or_node__5835 = this__5830.arr[2 * idx__5833 + 1];
    if(null == key_or_nil__5834) {
      var n__5836 = val_or_node__5835.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5836 === val_or_node__5835) {
        return inode__5831
      }else {
        if(null != n__5836) {
          return cljs.core.edit_and_set.call(null, inode__5831, edit, 2 * idx__5833 + 1, n__5836)
        }else {
          if(this__5830.bitmap === bit__5832) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5831.edit_and_remove_pair(edit, bit__5832, idx__5833)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5834)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5831.edit_and_remove_pair(edit, bit__5832, idx__5833)
      }else {
        if("\ufdd0'else") {
          return inode__5831
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5837 = this;
  var inode__5838 = this;
  if(e === this__5837.edit) {
    return inode__5838
  }else {
    var n__5839 = cljs.core.bit_count.call(null, this__5837.bitmap);
    var new_arr__5840 = cljs.core.make_array.call(null, n__5839 < 0 ? 4 : 2 * (n__5839 + 1));
    cljs.core.array_copy.call(null, this__5837.arr, 0, new_arr__5840, 0, 2 * n__5839);
    return new cljs.core.BitmapIndexedNode(e, this__5837.bitmap, new_arr__5840)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__5841 = this;
  var inode__5842 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5841.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__5879 = null;
  var G__5879__3 = function(shift, hash, key) {
    var this__5843 = this;
    var inode__5844 = this;
    var bit__5845 = 1 << (hash >>> shift & 31);
    if((this__5843.bitmap & bit__5845) === 0) {
      return null
    }else {
      var idx__5846 = cljs.core.bitmap_indexed_node_index.call(null, this__5843.bitmap, bit__5845);
      var key_or_nil__5847 = this__5843.arr[2 * idx__5846];
      var val_or_node__5848 = this__5843.arr[2 * idx__5846 + 1];
      if(null == key_or_nil__5847) {
        return val_or_node__5848.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5847)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5847, val_or_node__5848])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__5879__4 = function(shift, hash, key, not_found) {
    var this__5849 = this;
    var inode__5850 = this;
    var bit__5851 = 1 << (hash >>> shift & 31);
    if((this__5849.bitmap & bit__5851) === 0) {
      return not_found
    }else {
      var idx__5852 = cljs.core.bitmap_indexed_node_index.call(null, this__5849.bitmap, bit__5851);
      var key_or_nil__5853 = this__5849.arr[2 * idx__5852];
      var val_or_node__5854 = this__5849.arr[2 * idx__5852 + 1];
      if(null == key_or_nil__5853) {
        return val_or_node__5854.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5853)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5853, val_or_node__5854])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__5879 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5879__3.call(this, shift, hash, key);
      case 4:
        return G__5879__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5879
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__5855 = this;
  var inode__5856 = this;
  var bit__5857 = 1 << (hash >>> shift & 31);
  if((this__5855.bitmap & bit__5857) === 0) {
    return inode__5856
  }else {
    var idx__5858 = cljs.core.bitmap_indexed_node_index.call(null, this__5855.bitmap, bit__5857);
    var key_or_nil__5859 = this__5855.arr[2 * idx__5858];
    var val_or_node__5860 = this__5855.arr[2 * idx__5858 + 1];
    if(null == key_or_nil__5859) {
      var n__5861 = val_or_node__5860.inode_without(shift + 5, hash, key);
      if(n__5861 === val_or_node__5860) {
        return inode__5856
      }else {
        if(null != n__5861) {
          return new cljs.core.BitmapIndexedNode(null, this__5855.bitmap, cljs.core.clone_and_set.call(null, this__5855.arr, 2 * idx__5858 + 1, n__5861))
        }else {
          if(this__5855.bitmap === bit__5857) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__5855.bitmap ^ bit__5857, cljs.core.remove_pair.call(null, this__5855.arr, idx__5858))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5859)) {
        return new cljs.core.BitmapIndexedNode(null, this__5855.bitmap ^ bit__5857, cljs.core.remove_pair.call(null, this__5855.arr, idx__5858))
      }else {
        if("\ufdd0'else") {
          return inode__5856
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5862 = this;
  var inode__5863 = this;
  var bit__5864 = 1 << (hash >>> shift & 31);
  var idx__5865 = cljs.core.bitmap_indexed_node_index.call(null, this__5862.bitmap, bit__5864);
  if((this__5862.bitmap & bit__5864) === 0) {
    var n__5866 = cljs.core.bit_count.call(null, this__5862.bitmap);
    if(n__5866 >= 16) {
      var nodes__5867 = cljs.core.make_array.call(null, 32);
      var jdx__5868 = hash >>> shift & 31;
      nodes__5867[jdx__5868] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__5869 = 0;
      var j__5870 = 0;
      while(true) {
        if(i__5869 < 32) {
          if((this__5862.bitmap >>> i__5869 & 1) === 0) {
            var G__5880 = i__5869 + 1;
            var G__5881 = j__5870;
            i__5869 = G__5880;
            j__5870 = G__5881;
            continue
          }else {
            nodes__5867[i__5869] = null != this__5862.arr[j__5870] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__5862.arr[j__5870]), this__5862.arr[j__5870], this__5862.arr[j__5870 + 1], added_leaf_QMARK_) : this__5862.arr[j__5870 + 1];
            var G__5882 = i__5869 + 1;
            var G__5883 = j__5870 + 2;
            i__5869 = G__5882;
            j__5870 = G__5883;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__5866 + 1, nodes__5867)
    }else {
      var new_arr__5871 = cljs.core.make_array.call(null, 2 * (n__5866 + 1));
      cljs.core.array_copy.call(null, this__5862.arr, 0, new_arr__5871, 0, 2 * idx__5865);
      new_arr__5871[2 * idx__5865] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__5871[2 * idx__5865 + 1] = val;
      cljs.core.array_copy.call(null, this__5862.arr, 2 * idx__5865, new_arr__5871, 2 * (idx__5865 + 1), 2 * (n__5866 - idx__5865));
      return new cljs.core.BitmapIndexedNode(null, this__5862.bitmap | bit__5864, new_arr__5871)
    }
  }else {
    var key_or_nil__5872 = this__5862.arr[2 * idx__5865];
    var val_or_node__5873 = this__5862.arr[2 * idx__5865 + 1];
    if(null == key_or_nil__5872) {
      var n__5874 = val_or_node__5873.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5874 === val_or_node__5873) {
        return inode__5863
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__5862.bitmap, cljs.core.clone_and_set.call(null, this__5862.arr, 2 * idx__5865 + 1, n__5874))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5872)) {
        if(val === val_or_node__5873) {
          return inode__5863
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__5862.bitmap, cljs.core.clone_and_set.call(null, this__5862.arr, 2 * idx__5865 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__5862.bitmap, cljs.core.clone_and_set.call(null, this__5862.arr, 2 * idx__5865, null, 2 * idx__5865 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__5872, val_or_node__5873, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__5884 = array_node.arr;
  var len__5885 = 2 * (array_node.cnt - 1);
  var new_arr__5886 = cljs.core.make_array.call(null, len__5885);
  var i__5887 = 0;
  var j__5888 = 1;
  var bitmap__5889 = 0;
  while(true) {
    if(i__5887 < len__5885) {
      if(function() {
        var and__3546__auto____5890 = i__5887 != idx;
        if(and__3546__auto____5890) {
          return null != arr__5884[i__5887]
        }else {
          return and__3546__auto____5890
        }
      }()) {
        new_arr__5886[j__5888] = arr__5884[i__5887];
        var G__5891 = i__5887 + 1;
        var G__5892 = j__5888 + 2;
        var G__5893 = bitmap__5889 | 1 << i__5887;
        i__5887 = G__5891;
        j__5888 = G__5892;
        bitmap__5889 = G__5893;
        continue
      }else {
        var G__5894 = i__5887 + 1;
        var G__5895 = j__5888;
        var G__5896 = bitmap__5889;
        i__5887 = G__5894;
        j__5888 = G__5895;
        bitmap__5889 = G__5896;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__5889, new_arr__5886)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5897 = this;
  var inode__5898 = this;
  var idx__5899 = hash >>> shift & 31;
  var node__5900 = this__5897.arr[idx__5899];
  if(null == node__5900) {
    return new cljs.core.ArrayNode(null, this__5897.cnt + 1, cljs.core.clone_and_set.call(null, this__5897.arr, idx__5899, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__5901 = node__5900.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5901 === node__5900) {
      return inode__5898
    }else {
      return new cljs.core.ArrayNode(null, this__5897.cnt, cljs.core.clone_and_set.call(null, this__5897.arr, idx__5899, n__5901))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__5902 = this;
  var inode__5903 = this;
  var idx__5904 = hash >>> shift & 31;
  var node__5905 = this__5902.arr[idx__5904];
  if(null != node__5905) {
    var n__5906 = node__5905.inode_without(shift + 5, hash, key);
    if(n__5906 === node__5905) {
      return inode__5903
    }else {
      if(n__5906 == null) {
        if(this__5902.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5903, null, idx__5904)
        }else {
          return new cljs.core.ArrayNode(null, this__5902.cnt - 1, cljs.core.clone_and_set.call(null, this__5902.arr, idx__5904, n__5906))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__5902.cnt, cljs.core.clone_and_set.call(null, this__5902.arr, idx__5904, n__5906))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__5903
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__5938 = null;
  var G__5938__3 = function(shift, hash, key) {
    var this__5907 = this;
    var inode__5908 = this;
    var idx__5909 = hash >>> shift & 31;
    var node__5910 = this__5907.arr[idx__5909];
    if(null != node__5910) {
      return node__5910.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__5938__4 = function(shift, hash, key, not_found) {
    var this__5911 = this;
    var inode__5912 = this;
    var idx__5913 = hash >>> shift & 31;
    var node__5914 = this__5911.arr[idx__5913];
    if(null != node__5914) {
      return node__5914.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__5938 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5938__3.call(this, shift, hash, key);
      case 4:
        return G__5938__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5938
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__5915 = this;
  var inode__5916 = this;
  return cljs.core.create_array_node_seq.call(null, this__5915.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__5917 = this;
  var inode__5918 = this;
  if(e === this__5917.edit) {
    return inode__5918
  }else {
    return new cljs.core.ArrayNode(e, this__5917.cnt, cljs.core.aclone.call(null, this__5917.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5919 = this;
  var inode__5920 = this;
  var idx__5921 = hash >>> shift & 31;
  var node__5922 = this__5919.arr[idx__5921];
  if(null == node__5922) {
    var editable__5923 = cljs.core.edit_and_set.call(null, inode__5920, edit, idx__5921, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__5923.cnt = editable__5923.cnt + 1;
    return editable__5923
  }else {
    var n__5924 = node__5922.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5924 === node__5922) {
      return inode__5920
    }else {
      return cljs.core.edit_and_set.call(null, inode__5920, edit, idx__5921, n__5924)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5925 = this;
  var inode__5926 = this;
  var idx__5927 = hash >>> shift & 31;
  var node__5928 = this__5925.arr[idx__5927];
  if(null == node__5928) {
    return inode__5926
  }else {
    var n__5929 = node__5928.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__5929 === node__5928) {
      return inode__5926
    }else {
      if(null == n__5929) {
        if(this__5925.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5926, edit, idx__5927)
        }else {
          var editable__5930 = cljs.core.edit_and_set.call(null, inode__5926, edit, idx__5927, n__5929);
          editable__5930.cnt = editable__5930.cnt - 1;
          return editable__5930
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__5926, edit, idx__5927, n__5929)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__5931 = this;
  var inode__5932 = this;
  var len__5933 = this__5931.arr.length;
  var i__5934 = 0;
  var init__5935 = init;
  while(true) {
    if(i__5934 < len__5933) {
      var node__5936 = this__5931.arr[i__5934];
      if(node__5936 != null) {
        var init__5937 = node__5936.kv_reduce(f, init__5935);
        if(cljs.core.reduced_QMARK_.call(null, init__5937)) {
          return cljs.core.deref.call(null, init__5937)
        }else {
          var G__5939 = i__5934 + 1;
          var G__5940 = init__5937;
          i__5934 = G__5939;
          init__5935 = G__5940;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__5935
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__5941 = 2 * cnt;
  var i__5942 = 0;
  while(true) {
    if(i__5942 < lim__5941) {
      if(cljs.core._EQ_.call(null, key, arr[i__5942])) {
        return i__5942
      }else {
        var G__5943 = i__5942 + 2;
        i__5942 = G__5943;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5944 = this;
  var inode__5945 = this;
  if(hash === this__5944.collision_hash) {
    var idx__5946 = cljs.core.hash_collision_node_find_index.call(null, this__5944.arr, this__5944.cnt, key);
    if(idx__5946 === -1) {
      var len__5947 = this__5944.arr.length;
      var new_arr__5948 = cljs.core.make_array.call(null, len__5947 + 2);
      cljs.core.array_copy.call(null, this__5944.arr, 0, new_arr__5948, 0, len__5947);
      new_arr__5948[len__5947] = key;
      new_arr__5948[len__5947 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__5944.collision_hash, this__5944.cnt + 1, new_arr__5948)
    }else {
      if(cljs.core._EQ_.call(null, this__5944.arr[idx__5946], val)) {
        return inode__5945
      }else {
        return new cljs.core.HashCollisionNode(null, this__5944.collision_hash, this__5944.cnt, cljs.core.clone_and_set.call(null, this__5944.arr, idx__5946 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__5944.collision_hash >>> shift & 31), [null, inode__5945])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__5949 = this;
  var inode__5950 = this;
  var idx__5951 = cljs.core.hash_collision_node_find_index.call(null, this__5949.arr, this__5949.cnt, key);
  if(idx__5951 === -1) {
    return inode__5950
  }else {
    if(this__5949.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__5949.collision_hash, this__5949.cnt - 1, cljs.core.remove_pair.call(null, this__5949.arr, cljs.core.quot.call(null, idx__5951, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__5978 = null;
  var G__5978__3 = function(shift, hash, key) {
    var this__5952 = this;
    var inode__5953 = this;
    var idx__5954 = cljs.core.hash_collision_node_find_index.call(null, this__5952.arr, this__5952.cnt, key);
    if(idx__5954 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__5952.arr[idx__5954])) {
        return cljs.core.PersistentVector.fromArray([this__5952.arr[idx__5954], this__5952.arr[idx__5954 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__5978__4 = function(shift, hash, key, not_found) {
    var this__5955 = this;
    var inode__5956 = this;
    var idx__5957 = cljs.core.hash_collision_node_find_index.call(null, this__5955.arr, this__5955.cnt, key);
    if(idx__5957 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__5955.arr[idx__5957])) {
        return cljs.core.PersistentVector.fromArray([this__5955.arr[idx__5957], this__5955.arr[idx__5957 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__5978 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5978__3.call(this, shift, hash, key);
      case 4:
        return G__5978__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5978
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__5958 = this;
  var inode__5959 = this;
  return cljs.core.create_inode_seq.call(null, this__5958.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__5979 = null;
  var G__5979__1 = function(e) {
    var this__5960 = this;
    var inode__5961 = this;
    if(e === this__5960.edit) {
      return inode__5961
    }else {
      var new_arr__5962 = cljs.core.make_array.call(null, 2 * (this__5960.cnt + 1));
      cljs.core.array_copy.call(null, this__5960.arr, 0, new_arr__5962, 0, 2 * this__5960.cnt);
      return new cljs.core.HashCollisionNode(e, this__5960.collision_hash, this__5960.cnt, new_arr__5962)
    }
  };
  var G__5979__3 = function(e, count, array) {
    var this__5963 = this;
    var inode__5964 = this;
    if(e === this__5963.edit) {
      this__5963.arr = array;
      this__5963.cnt = count;
      return inode__5964
    }else {
      return new cljs.core.HashCollisionNode(this__5963.edit, this__5963.collision_hash, count, array)
    }
  };
  G__5979 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__5979__1.call(this, e);
      case 3:
        return G__5979__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5979
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5965 = this;
  var inode__5966 = this;
  if(hash === this__5965.collision_hash) {
    var idx__5967 = cljs.core.hash_collision_node_find_index.call(null, this__5965.arr, this__5965.cnt, key);
    if(idx__5967 === -1) {
      if(this__5965.arr.length > 2 * this__5965.cnt) {
        var editable__5968 = cljs.core.edit_and_set.call(null, inode__5966, edit, 2 * this__5965.cnt, key, 2 * this__5965.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__5968.cnt = editable__5968.cnt + 1;
        return editable__5968
      }else {
        var len__5969 = this__5965.arr.length;
        var new_arr__5970 = cljs.core.make_array.call(null, len__5969 + 2);
        cljs.core.array_copy.call(null, this__5965.arr, 0, new_arr__5970, 0, len__5969);
        new_arr__5970[len__5969] = key;
        new_arr__5970[len__5969 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__5966.ensure_editable(edit, this__5965.cnt + 1, new_arr__5970)
      }
    }else {
      if(this__5965.arr[idx__5967 + 1] === val) {
        return inode__5966
      }else {
        return cljs.core.edit_and_set.call(null, inode__5966, edit, idx__5967 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__5965.collision_hash >>> shift & 31), [null, inode__5966, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5971 = this;
  var inode__5972 = this;
  var idx__5973 = cljs.core.hash_collision_node_find_index.call(null, this__5971.arr, this__5971.cnt, key);
  if(idx__5973 === -1) {
    return inode__5972
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__5971.cnt === 1) {
      return null
    }else {
      var editable__5974 = inode__5972.ensure_editable(edit);
      var earr__5975 = editable__5974.arr;
      earr__5975[idx__5973] = earr__5975[2 * this__5971.cnt - 2];
      earr__5975[idx__5973 + 1] = earr__5975[2 * this__5971.cnt - 1];
      earr__5975[2 * this__5971.cnt - 1] = null;
      earr__5975[2 * this__5971.cnt - 2] = null;
      editable__5974.cnt = editable__5974.cnt - 1;
      return editable__5974
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__5976 = this;
  var inode__5977 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5976.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__5980 = cljs.core.hash.call(null, key1);
    if(key1hash__5980 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__5980, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___5981 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__5980, key1, val1, added_leaf_QMARK___5981).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___5981)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__5982 = cljs.core.hash.call(null, key1);
    if(key1hash__5982 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__5982, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___5983 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__5982, key1, val1, added_leaf_QMARK___5983).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___5983)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5984 = this;
  var h__364__auto____5985 = this__5984.__hash;
  if(h__364__auto____5985 != null) {
    return h__364__auto____5985
  }else {
    var h__364__auto____5986 = cljs.core.hash_coll.call(null, coll);
    this__5984.__hash = h__364__auto____5986;
    return h__364__auto____5986
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5987 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__5988 = this;
  var this$__5989 = this;
  return cljs.core.pr_str.call(null, this$__5989)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__5990 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5991 = this;
  if(this__5991.s == null) {
    return cljs.core.PersistentVector.fromArray([this__5991.nodes[this__5991.i], this__5991.nodes[this__5991.i + 1]])
  }else {
    return cljs.core.first.call(null, this__5991.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5992 = this;
  if(this__5992.s == null) {
    return cljs.core.create_inode_seq.call(null, this__5992.nodes, this__5992.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__5992.nodes, this__5992.i, cljs.core.next.call(null, this__5992.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5993 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5994 = this;
  return new cljs.core.NodeSeq(meta, this__5994.nodes, this__5994.i, this__5994.s, this__5994.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5995 = this;
  return this__5995.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5996 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5996.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__5997 = nodes.length;
      var j__5998 = i;
      while(true) {
        if(j__5998 < len__5997) {
          if(null != nodes[j__5998]) {
            return new cljs.core.NodeSeq(null, nodes, j__5998, null, null)
          }else {
            var temp__3695__auto____5999 = nodes[j__5998 + 1];
            if(cljs.core.truth_(temp__3695__auto____5999)) {
              var node__6000 = temp__3695__auto____5999;
              var temp__3695__auto____6001 = node__6000.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____6001)) {
                var node_seq__6002 = temp__3695__auto____6001;
                return new cljs.core.NodeSeq(null, nodes, j__5998 + 2, node_seq__6002, null)
              }else {
                var G__6003 = j__5998 + 2;
                j__5998 = G__6003;
                continue
              }
            }else {
              var G__6004 = j__5998 + 2;
              j__5998 = G__6004;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6005 = this;
  var h__364__auto____6006 = this__6005.__hash;
  if(h__364__auto____6006 != null) {
    return h__364__auto____6006
  }else {
    var h__364__auto____6007 = cljs.core.hash_coll.call(null, coll);
    this__6005.__hash = h__364__auto____6007;
    return h__364__auto____6007
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6008 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6009 = this;
  var this$__6010 = this;
  return cljs.core.pr_str.call(null, this$__6010)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6011 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6012 = this;
  return cljs.core.first.call(null, this__6012.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6013 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6013.nodes, this__6013.i, cljs.core.next.call(null, this__6013.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6014 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6015 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6015.nodes, this__6015.i, this__6015.s, this__6015.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6016 = this;
  return this__6016.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6017 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6017.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6018 = nodes.length;
      var j__6019 = i;
      while(true) {
        if(j__6019 < len__6018) {
          var temp__3695__auto____6020 = nodes[j__6019];
          if(cljs.core.truth_(temp__3695__auto____6020)) {
            var nj__6021 = temp__3695__auto____6020;
            var temp__3695__auto____6022 = nj__6021.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____6022)) {
              var ns__6023 = temp__3695__auto____6022;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6019 + 1, ns__6023, null)
            }else {
              var G__6024 = j__6019 + 1;
              j__6019 = G__6024;
              continue
            }
          }else {
            var G__6025 = j__6019 + 1;
            j__6019 = G__6025;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6030 = this;
  return new cljs.core.TransientHashMap({}, this__6030.root, this__6030.cnt, this__6030.has_nil_QMARK_, this__6030.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6031 = this;
  var h__364__auto____6032 = this__6031.__hash;
  if(h__364__auto____6032 != null) {
    return h__364__auto____6032
  }else {
    var h__364__auto____6033 = cljs.core.hash_imap.call(null, coll);
    this__6031.__hash = h__364__auto____6033;
    return h__364__auto____6033
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6034 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6035 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6035.has_nil_QMARK_)) {
      return this__6035.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6035.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6035.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6036 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6037 = this__6036.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____6037)) {
        return v === this__6036.nil_val
      }else {
        return and__3546__auto____6037
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6036.meta, cljs.core.truth_(this__6036.has_nil_QMARK_) ? this__6036.cnt : this__6036.cnt + 1, this__6036.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6038 = [false];
    var new_root__6039 = (this__6036.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6036.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6038);
    if(new_root__6039 === this__6036.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6036.meta, cljs.core.truth_(added_leaf_QMARK___6038[0]) ? this__6036.cnt + 1 : this__6036.cnt, new_root__6039, this__6036.has_nil_QMARK_, this__6036.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6040 = this;
  if(k == null) {
    return this__6040.has_nil_QMARK_
  }else {
    if(this__6040.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6040.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6061 = null;
  var G__6061__2 = function(tsym6028, k) {
    var this__6041 = this;
    var tsym6028__6042 = this;
    var coll__6043 = tsym6028__6042;
    return cljs.core._lookup.call(null, coll__6043, k)
  };
  var G__6061__3 = function(tsym6029, k, not_found) {
    var this__6044 = this;
    var tsym6029__6045 = this;
    var coll__6046 = tsym6029__6045;
    return cljs.core._lookup.call(null, coll__6046, k, not_found)
  };
  G__6061 = function(tsym6029, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6061__2.call(this, tsym6029, k);
      case 3:
        return G__6061__3.call(this, tsym6029, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6061
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6026, args6027) {
  return tsym6026.call.apply(tsym6026, [tsym6026].concat(cljs.core.aclone.call(null, args6027)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6047 = this;
  var init__6048 = cljs.core.truth_(this__6047.has_nil_QMARK_) ? f.call(null, init, null, this__6047.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6048)) {
    return cljs.core.deref.call(null, init__6048)
  }else {
    if(null != this__6047.root) {
      return this__6047.root.kv_reduce(f, init__6048)
    }else {
      if("\ufdd0'else") {
        return init__6048
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6049 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6050 = this;
  var this$__6051 = this;
  return cljs.core.pr_str.call(null, this$__6051)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6052 = this;
  if(this__6052.cnt > 0) {
    var s__6053 = null != this__6052.root ? this__6052.root.inode_seq() : null;
    if(cljs.core.truth_(this__6052.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6052.nil_val]), s__6053)
    }else {
      return s__6053
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6054 = this;
  return this__6054.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6055 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6056 = this;
  return new cljs.core.PersistentHashMap(meta, this__6056.cnt, this__6056.root, this__6056.has_nil_QMARK_, this__6056.nil_val, this__6056.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6057 = this;
  return this__6057.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6058 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6058.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6059 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6059.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6059.meta, this__6059.cnt - 1, this__6059.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6059.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6060 = this__6059.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6060 === this__6059.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6059.meta, this__6059.cnt - 1, new_root__6060, this__6059.has_nil_QMARK_, this__6059.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__6062 = ks.length;
  var i__6063 = 0;
  var out__6064 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6063 < len__6062) {
      var G__6065 = i__6063 + 1;
      var G__6066 = cljs.core.assoc_BANG_.call(null, out__6064, ks[i__6063], vs[i__6063]);
      i__6063 = G__6065;
      out__6064 = G__6066;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6064)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6067 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6068 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6069 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6070 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6071 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6071.has_nil_QMARK_)) {
      return this__6071.nil_val
    }else {
      return null
    }
  }else {
    if(this__6071.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6071.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6072 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6072.has_nil_QMARK_)) {
      return this__6072.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6072.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6072.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6073 = this;
  if(cljs.core.truth_(this__6073.edit)) {
    return this__6073.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6074 = this;
  var tcoll__6075 = this;
  if(cljs.core.truth_(this__6074.edit)) {
    if(function() {
      var G__6076__6077 = o;
      if(G__6076__6077 != null) {
        if(function() {
          var or__3548__auto____6078 = G__6076__6077.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6078) {
            return or__3548__auto____6078
          }else {
            return G__6076__6077.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6076__6077.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6076__6077)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6076__6077)
      }
    }()) {
      return tcoll__6075.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6079 = cljs.core.seq.call(null, o);
      var tcoll__6080 = tcoll__6075;
      while(true) {
        var temp__3695__auto____6081 = cljs.core.first.call(null, es__6079);
        if(cljs.core.truth_(temp__3695__auto____6081)) {
          var e__6082 = temp__3695__auto____6081;
          var G__6093 = cljs.core.next.call(null, es__6079);
          var G__6094 = tcoll__6080.assoc_BANG_(cljs.core.key.call(null, e__6082), cljs.core.val.call(null, e__6082));
          es__6079 = G__6093;
          tcoll__6080 = G__6094;
          continue
        }else {
          return tcoll__6080
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6083 = this;
  var tcoll__6084 = this;
  if(cljs.core.truth_(this__6083.edit)) {
    if(k == null) {
      if(this__6083.nil_val === v) {
      }else {
        this__6083.nil_val = v
      }
      if(cljs.core.truth_(this__6083.has_nil_QMARK_)) {
      }else {
        this__6083.count = this__6083.count + 1;
        this__6083.has_nil_QMARK_ = true
      }
      return tcoll__6084
    }else {
      var added_leaf_QMARK___6085 = [false];
      var node__6086 = (this__6083.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6083.root).inode_assoc_BANG_(this__6083.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6085);
      if(node__6086 === this__6083.root) {
      }else {
        this__6083.root = node__6086
      }
      if(cljs.core.truth_(added_leaf_QMARK___6085[0])) {
        this__6083.count = this__6083.count + 1
      }else {
      }
      return tcoll__6084
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6087 = this;
  var tcoll__6088 = this;
  if(cljs.core.truth_(this__6087.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6087.has_nil_QMARK_)) {
        this__6087.has_nil_QMARK_ = false;
        this__6087.nil_val = null;
        this__6087.count = this__6087.count - 1;
        return tcoll__6088
      }else {
        return tcoll__6088
      }
    }else {
      if(this__6087.root == null) {
        return tcoll__6088
      }else {
        var removed_leaf_QMARK___6089 = [false];
        var node__6090 = this__6087.root.inode_without_BANG_(this__6087.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6089);
        if(node__6090 === this__6087.root) {
        }else {
          this__6087.root = node__6090
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6089[0])) {
          this__6087.count = this__6087.count - 1
        }else {
        }
        return tcoll__6088
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6091 = this;
  var tcoll__6092 = this;
  if(cljs.core.truth_(this__6091.edit)) {
    this__6091.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6091.count, this__6091.root, this__6091.has_nil_QMARK_, this__6091.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6095 = node;
  var stack__6096 = stack;
  while(true) {
    if(t__6095 != null) {
      var G__6097 = cljs.core.truth_(ascending_QMARK_) ? t__6095.left : t__6095.right;
      var G__6098 = cljs.core.conj.call(null, stack__6096, t__6095);
      t__6095 = G__6097;
      stack__6096 = G__6098;
      continue
    }else {
      return stack__6096
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6099 = this;
  var h__364__auto____6100 = this__6099.__hash;
  if(h__364__auto____6100 != null) {
    return h__364__auto____6100
  }else {
    var h__364__auto____6101 = cljs.core.hash_coll.call(null, coll);
    this__6099.__hash = h__364__auto____6101;
    return h__364__auto____6101
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6102 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6103 = this;
  var this$__6104 = this;
  return cljs.core.pr_str.call(null, this$__6104)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6105 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6106 = this;
  if(this__6106.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6106.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6107 = this;
  return cljs.core.peek.call(null, this__6107.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6108 = this;
  var t__6109 = cljs.core.peek.call(null, this__6108.stack);
  var next_stack__6110 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6108.ascending_QMARK_) ? t__6109.right : t__6109.left, cljs.core.pop.call(null, this__6108.stack), this__6108.ascending_QMARK_);
  if(next_stack__6110 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6110, this__6108.ascending_QMARK_, this__6108.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6111 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6112 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6112.stack, this__6112.ascending_QMARK_, this__6112.cnt, this__6112.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6113 = this;
  return this__6113.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3546__auto____6114 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____6114) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____6114
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3546__auto____6115 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____6115) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____6115
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6116 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6116)) {
    return cljs.core.deref.call(null, init__6116)
  }else {
    var init__6117 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6116) : init__6116;
    if(cljs.core.reduced_QMARK_.call(null, init__6117)) {
      return cljs.core.deref.call(null, init__6117)
    }else {
      var init__6118 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6117) : init__6117;
      if(cljs.core.reduced_QMARK_.call(null, init__6118)) {
        return cljs.core.deref.call(null, init__6118)
      }else {
        return init__6118
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6123 = this;
  var h__364__auto____6124 = this__6123.__hash;
  if(h__364__auto____6124 != null) {
    return h__364__auto____6124
  }else {
    var h__364__auto____6125 = cljs.core.hash_coll.call(null, coll);
    this__6123.__hash = h__364__auto____6125;
    return h__364__auto____6125
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6126 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6127 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6128 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6128.key, this__6128.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6175 = null;
  var G__6175__2 = function(tsym6121, k) {
    var this__6129 = this;
    var tsym6121__6130 = this;
    var node__6131 = tsym6121__6130;
    return cljs.core._lookup.call(null, node__6131, k)
  };
  var G__6175__3 = function(tsym6122, k, not_found) {
    var this__6132 = this;
    var tsym6122__6133 = this;
    var node__6134 = tsym6122__6133;
    return cljs.core._lookup.call(null, node__6134, k, not_found)
  };
  G__6175 = function(tsym6122, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6175__2.call(this, tsym6122, k);
      case 3:
        return G__6175__3.call(this, tsym6122, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6175
}();
cljs.core.BlackNode.prototype.apply = function(tsym6119, args6120) {
  return tsym6119.call.apply(tsym6119, [tsym6119].concat(cljs.core.aclone.call(null, args6120)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6135 = this;
  return cljs.core.PersistentVector.fromArray([this__6135.key, this__6135.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6136 = this;
  return this__6136.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6137 = this;
  return this__6137.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6138 = this;
  var node__6139 = this;
  return ins.balance_right(node__6139)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6140 = this;
  var node__6141 = this;
  return new cljs.core.RedNode(this__6140.key, this__6140.val, this__6140.left, this__6140.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6142 = this;
  var node__6143 = this;
  return cljs.core.balance_right_del.call(null, this__6142.key, this__6142.val, this__6142.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6144 = this;
  var node__6145 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6146 = this;
  var node__6147 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6147, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6148 = this;
  var node__6149 = this;
  return cljs.core.balance_left_del.call(null, this__6148.key, this__6148.val, del, this__6148.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6150 = this;
  var node__6151 = this;
  return ins.balance_left(node__6151)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6152 = this;
  var node__6153 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6153, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6176 = null;
  var G__6176__0 = function() {
    var this__6156 = this;
    var this$__6157 = this;
    return cljs.core.pr_str.call(null, this$__6157)
  };
  G__6176 = function() {
    switch(arguments.length) {
      case 0:
        return G__6176__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6176
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6158 = this;
  var node__6159 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6159, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6160 = this;
  var node__6161 = this;
  return node__6161
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6162 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6163 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6164 = this;
  return cljs.core.list.call(null, this__6164.key, this__6164.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6166 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6167 = this;
  return this__6167.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6168 = this;
  return cljs.core.PersistentVector.fromArray([this__6168.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6169 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6169.key, this__6169.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6170 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6171 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6171.key, this__6171.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6172 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6173 = this;
  if(n === 0) {
    return this__6173.key
  }else {
    if(n === 1) {
      return this__6173.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6174 = this;
  if(n === 0) {
    return this__6174.key
  }else {
    if(n === 1) {
      return this__6174.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6165 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6181 = this;
  var h__364__auto____6182 = this__6181.__hash;
  if(h__364__auto____6182 != null) {
    return h__364__auto____6182
  }else {
    var h__364__auto____6183 = cljs.core.hash_coll.call(null, coll);
    this__6181.__hash = h__364__auto____6183;
    return h__364__auto____6183
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6184 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6185 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6186 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6186.key, this__6186.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6233 = null;
  var G__6233__2 = function(tsym6179, k) {
    var this__6187 = this;
    var tsym6179__6188 = this;
    var node__6189 = tsym6179__6188;
    return cljs.core._lookup.call(null, node__6189, k)
  };
  var G__6233__3 = function(tsym6180, k, not_found) {
    var this__6190 = this;
    var tsym6180__6191 = this;
    var node__6192 = tsym6180__6191;
    return cljs.core._lookup.call(null, node__6192, k, not_found)
  };
  G__6233 = function(tsym6180, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6233__2.call(this, tsym6180, k);
      case 3:
        return G__6233__3.call(this, tsym6180, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6233
}();
cljs.core.RedNode.prototype.apply = function(tsym6177, args6178) {
  return tsym6177.call.apply(tsym6177, [tsym6177].concat(cljs.core.aclone.call(null, args6178)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6193 = this;
  return cljs.core.PersistentVector.fromArray([this__6193.key, this__6193.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6194 = this;
  return this__6194.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6195 = this;
  return this__6195.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6196 = this;
  var node__6197 = this;
  return new cljs.core.RedNode(this__6196.key, this__6196.val, this__6196.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6198 = this;
  var node__6199 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6200 = this;
  var node__6201 = this;
  return new cljs.core.RedNode(this__6200.key, this__6200.val, this__6200.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6202 = this;
  var node__6203 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6204 = this;
  var node__6205 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6205, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6206 = this;
  var node__6207 = this;
  return new cljs.core.RedNode(this__6206.key, this__6206.val, del, this__6206.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6208 = this;
  var node__6209 = this;
  return new cljs.core.RedNode(this__6208.key, this__6208.val, ins, this__6208.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6210 = this;
  var node__6211 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6210.left)) {
    return new cljs.core.RedNode(this__6210.key, this__6210.val, this__6210.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6210.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6210.right)) {
      return new cljs.core.RedNode(this__6210.right.key, this__6210.right.val, new cljs.core.BlackNode(this__6210.key, this__6210.val, this__6210.left, this__6210.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6210.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6211, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6234 = null;
  var G__6234__0 = function() {
    var this__6214 = this;
    var this$__6215 = this;
    return cljs.core.pr_str.call(null, this$__6215)
  };
  G__6234 = function() {
    switch(arguments.length) {
      case 0:
        return G__6234__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6234
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6216 = this;
  var node__6217 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6216.right)) {
    return new cljs.core.RedNode(this__6216.key, this__6216.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6216.left, null), this__6216.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6216.left)) {
      return new cljs.core.RedNode(this__6216.left.key, this__6216.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6216.left.left, null), new cljs.core.BlackNode(this__6216.key, this__6216.val, this__6216.left.right, this__6216.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6217, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6218 = this;
  var node__6219 = this;
  return new cljs.core.BlackNode(this__6218.key, this__6218.val, this__6218.left, this__6218.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6220 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6221 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6222 = this;
  return cljs.core.list.call(null, this__6222.key, this__6222.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6224 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6225 = this;
  return this__6225.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6226 = this;
  return cljs.core.PersistentVector.fromArray([this__6226.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6227 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6227.key, this__6227.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6228 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6229 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6229.key, this__6229.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6230 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6231 = this;
  if(n === 0) {
    return this__6231.key
  }else {
    if(n === 1) {
      return this__6231.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6232 = this;
  if(n === 0) {
    return this__6232.key
  }else {
    if(n === 1) {
      return this__6232.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6223 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6235 = comp.call(null, k, tree.key);
    if(c__6235 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6235 < 0) {
        var ins__6236 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6236 != null) {
          return tree.add_left(ins__6236)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6237 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6237 != null) {
            return tree.add_right(ins__6237)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6238 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6238)) {
            return new cljs.core.RedNode(app__6238.key, app__6238.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6238.left), new cljs.core.RedNode(right.key, right.val, app__6238.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6238, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6239 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6239)) {
              return new cljs.core.RedNode(app__6239.key, app__6239.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6239.left, null), new cljs.core.BlackNode(right.key, right.val, app__6239.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6239, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6240 = comp.call(null, k, tree.key);
    if(c__6240 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6240 < 0) {
        var del__6241 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____6242 = del__6241 != null;
          if(or__3548__auto____6242) {
            return or__3548__auto____6242
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6241, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6241, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6243 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____6244 = del__6243 != null;
            if(or__3548__auto____6244) {
              return or__3548__auto____6244
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6243)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6243, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6245 = tree.key;
  var c__6246 = comp.call(null, k, tk__6245);
  if(c__6246 === 0) {
    return tree.replace(tk__6245, v, tree.left, tree.right)
  }else {
    if(c__6246 < 0) {
      return tree.replace(tk__6245, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6245, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6251 = this;
  var h__364__auto____6252 = this__6251.__hash;
  if(h__364__auto____6252 != null) {
    return h__364__auto____6252
  }else {
    var h__364__auto____6253 = cljs.core.hash_imap.call(null, coll);
    this__6251.__hash = h__364__auto____6253;
    return h__364__auto____6253
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6254 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6255 = this;
  var n__6256 = coll.entry_at(k);
  if(n__6256 != null) {
    return n__6256.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6257 = this;
  var found__6258 = [null];
  var t__6259 = cljs.core.tree_map_add.call(null, this__6257.comp, this__6257.tree, k, v, found__6258);
  if(t__6259 == null) {
    var found_node__6260 = cljs.core.nth.call(null, found__6258, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6260.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6257.comp, cljs.core.tree_map_replace.call(null, this__6257.comp, this__6257.tree, k, v), this__6257.cnt, this__6257.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6257.comp, t__6259.blacken(), this__6257.cnt + 1, this__6257.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6261 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6293 = null;
  var G__6293__2 = function(tsym6249, k) {
    var this__6262 = this;
    var tsym6249__6263 = this;
    var coll__6264 = tsym6249__6263;
    return cljs.core._lookup.call(null, coll__6264, k)
  };
  var G__6293__3 = function(tsym6250, k, not_found) {
    var this__6265 = this;
    var tsym6250__6266 = this;
    var coll__6267 = tsym6250__6266;
    return cljs.core._lookup.call(null, coll__6267, k, not_found)
  };
  G__6293 = function(tsym6250, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6293__2.call(this, tsym6250, k);
      case 3:
        return G__6293__3.call(this, tsym6250, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6293
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6247, args6248) {
  return tsym6247.call.apply(tsym6247, [tsym6247].concat(cljs.core.aclone.call(null, args6248)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6268 = this;
  if(this__6268.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6268.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6269 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6270 = this;
  if(this__6270.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6270.tree, false, this__6270.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6271 = this;
  var this$__6272 = this;
  return cljs.core.pr_str.call(null, this$__6272)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6273 = this;
  var coll__6274 = this;
  var t__6275 = this__6273.tree;
  while(true) {
    if(t__6275 != null) {
      var c__6276 = this__6273.comp.call(null, k, t__6275.key);
      if(c__6276 === 0) {
        return t__6275
      }else {
        if(c__6276 < 0) {
          var G__6294 = t__6275.left;
          t__6275 = G__6294;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6295 = t__6275.right;
            t__6275 = G__6295;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6277 = this;
  if(this__6277.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6277.tree, ascending_QMARK_, this__6277.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6278 = this;
  if(this__6278.cnt > 0) {
    var stack__6279 = null;
    var t__6280 = this__6278.tree;
    while(true) {
      if(t__6280 != null) {
        var c__6281 = this__6278.comp.call(null, k, t__6280.key);
        if(c__6281 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6279, t__6280), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6281 < 0) {
              var G__6296 = cljs.core.conj.call(null, stack__6279, t__6280);
              var G__6297 = t__6280.left;
              stack__6279 = G__6296;
              t__6280 = G__6297;
              continue
            }else {
              var G__6298 = stack__6279;
              var G__6299 = t__6280.right;
              stack__6279 = G__6298;
              t__6280 = G__6299;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6281 > 0) {
                var G__6300 = cljs.core.conj.call(null, stack__6279, t__6280);
                var G__6301 = t__6280.right;
                stack__6279 = G__6300;
                t__6280 = G__6301;
                continue
              }else {
                var G__6302 = stack__6279;
                var G__6303 = t__6280.left;
                stack__6279 = G__6302;
                t__6280 = G__6303;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6279 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6279, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6282 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6283 = this;
  return this__6283.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6284 = this;
  if(this__6284.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6284.tree, true, this__6284.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6285 = this;
  return this__6285.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6286 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6287 = this;
  return new cljs.core.PersistentTreeMap(this__6287.comp, this__6287.tree, this__6287.cnt, meta, this__6287.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6291 = this;
  return this__6291.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6292 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6292.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6288 = this;
  var found__6289 = [null];
  var t__6290 = cljs.core.tree_map_remove.call(null, this__6288.comp, this__6288.tree, k, found__6289);
  if(t__6290 == null) {
    if(cljs.core.nth.call(null, found__6289, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6288.comp, null, 0, this__6288.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6288.comp, t__6290.blacken(), this__6288.cnt - 1, this__6288.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6304 = cljs.core.seq.call(null, keyvals);
    var out__6305 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6304)) {
        var G__6306 = cljs.core.nnext.call(null, in$__6304);
        var G__6307 = cljs.core.assoc_BANG_.call(null, out__6305, cljs.core.first.call(null, in$__6304), cljs.core.second.call(null, in$__6304));
        in$__6304 = G__6306;
        out__6305 = G__6307;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6305)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6308) {
    var keyvals = cljs.core.seq(arglist__6308);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6309) {
    var keyvals = cljs.core.seq(arglist__6309);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6310 = cljs.core.seq.call(null, keyvals);
    var out__6311 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6310)) {
        var G__6312 = cljs.core.nnext.call(null, in$__6310);
        var G__6313 = cljs.core.assoc.call(null, out__6311, cljs.core.first.call(null, in$__6310), cljs.core.second.call(null, in$__6310));
        in$__6310 = G__6312;
        out__6311 = G__6313;
        continue
      }else {
        return out__6311
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6314) {
    var keyvals = cljs.core.seq(arglist__6314);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6315 = cljs.core.seq.call(null, keyvals);
    var out__6316 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6315)) {
        var G__6317 = cljs.core.nnext.call(null, in$__6315);
        var G__6318 = cljs.core.assoc.call(null, out__6316, cljs.core.first.call(null, in$__6315), cljs.core.second.call(null, in$__6315));
        in$__6315 = G__6317;
        out__6316 = G__6318;
        continue
      }else {
        return out__6316
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6319) {
    var comparator = cljs.core.first(arglist__6319);
    var keyvals = cljs.core.rest(arglist__6319);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6320_SHARP_, p2__6321_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____6322 = p1__6320_SHARP_;
          if(cljs.core.truth_(or__3548__auto____6322)) {
            return or__3548__auto____6322
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6321_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6323) {
    var maps = cljs.core.seq(arglist__6323);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6326 = function(m, e) {
        var k__6324 = cljs.core.first.call(null, e);
        var v__6325 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6324)) {
          return cljs.core.assoc.call(null, m, k__6324, f.call(null, cljs.core.get.call(null, m, k__6324), v__6325))
        }else {
          return cljs.core.assoc.call(null, m, k__6324, v__6325)
        }
      };
      var merge2__6328 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6326, function() {
          var or__3548__auto____6327 = m1;
          if(cljs.core.truth_(or__3548__auto____6327)) {
            return or__3548__auto____6327
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6328, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6329) {
    var f = cljs.core.first(arglist__6329);
    var maps = cljs.core.rest(arglist__6329);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6330 = cljs.core.ObjMap.fromObject([], {});
  var keys__6331 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6331)) {
      var key__6332 = cljs.core.first.call(null, keys__6331);
      var entry__6333 = cljs.core.get.call(null, map, key__6332, "\ufdd0'user/not-found");
      var G__6334 = cljs.core.not_EQ_.call(null, entry__6333, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6330, key__6332, entry__6333) : ret__6330;
      var G__6335 = cljs.core.next.call(null, keys__6331);
      ret__6330 = G__6334;
      keys__6331 = G__6335;
      continue
    }else {
      return ret__6330
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6341 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6341.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6342 = this;
  var h__364__auto____6343 = this__6342.__hash;
  if(h__364__auto____6343 != null) {
    return h__364__auto____6343
  }else {
    var h__364__auto____6344 = cljs.core.hash_iset.call(null, coll);
    this__6342.__hash = h__364__auto____6344;
    return h__364__auto____6344
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6345 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6346 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6346.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6365 = null;
  var G__6365__2 = function(tsym6339, k) {
    var this__6347 = this;
    var tsym6339__6348 = this;
    var coll__6349 = tsym6339__6348;
    return cljs.core._lookup.call(null, coll__6349, k)
  };
  var G__6365__3 = function(tsym6340, k, not_found) {
    var this__6350 = this;
    var tsym6340__6351 = this;
    var coll__6352 = tsym6340__6351;
    return cljs.core._lookup.call(null, coll__6352, k, not_found)
  };
  G__6365 = function(tsym6340, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6365__2.call(this, tsym6340, k);
      case 3:
        return G__6365__3.call(this, tsym6340, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6365
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6337, args6338) {
  return tsym6337.call.apply(tsym6337, [tsym6337].concat(cljs.core.aclone.call(null, args6338)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6353 = this;
  return new cljs.core.PersistentHashSet(this__6353.meta, cljs.core.assoc.call(null, this__6353.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6354 = this;
  var this$__6355 = this;
  return cljs.core.pr_str.call(null, this$__6355)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6356 = this;
  return cljs.core.keys.call(null, this__6356.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6357 = this;
  return new cljs.core.PersistentHashSet(this__6357.meta, cljs.core.dissoc.call(null, this__6357.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6358 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6359 = this;
  var and__3546__auto____6360 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6360) {
    var and__3546__auto____6361 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6361) {
      return cljs.core.every_QMARK_.call(null, function(p1__6336_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6336_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6361
    }
  }else {
    return and__3546__auto____6360
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6362 = this;
  return new cljs.core.PersistentHashSet(meta, this__6362.hash_map, this__6362.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6363 = this;
  return this__6363.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6364 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6364.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6383 = null;
  var G__6383__2 = function(tsym6369, k) {
    var this__6371 = this;
    var tsym6369__6372 = this;
    var tcoll__6373 = tsym6369__6372;
    if(cljs.core._lookup.call(null, this__6371.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6383__3 = function(tsym6370, k, not_found) {
    var this__6374 = this;
    var tsym6370__6375 = this;
    var tcoll__6376 = tsym6370__6375;
    if(cljs.core._lookup.call(null, this__6374.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6383 = function(tsym6370, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6383__2.call(this, tsym6370, k);
      case 3:
        return G__6383__3.call(this, tsym6370, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6383
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6367, args6368) {
  return tsym6367.call.apply(tsym6367, [tsym6367].concat(cljs.core.aclone.call(null, args6368)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6377 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6378 = this;
  if(cljs.core._lookup.call(null, this__6378.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6379 = this;
  return cljs.core.count.call(null, this__6379.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6380 = this;
  this__6380.transient_map = cljs.core.dissoc_BANG_.call(null, this__6380.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6381 = this;
  this__6381.transient_map = cljs.core.assoc_BANG_.call(null, this__6381.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6382 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6382.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6388 = this;
  var h__364__auto____6389 = this__6388.__hash;
  if(h__364__auto____6389 != null) {
    return h__364__auto____6389
  }else {
    var h__364__auto____6390 = cljs.core.hash_iset.call(null, coll);
    this__6388.__hash = h__364__auto____6390;
    return h__364__auto____6390
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6391 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6392 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6392.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6416 = null;
  var G__6416__2 = function(tsym6386, k) {
    var this__6393 = this;
    var tsym6386__6394 = this;
    var coll__6395 = tsym6386__6394;
    return cljs.core._lookup.call(null, coll__6395, k)
  };
  var G__6416__3 = function(tsym6387, k, not_found) {
    var this__6396 = this;
    var tsym6387__6397 = this;
    var coll__6398 = tsym6387__6397;
    return cljs.core._lookup.call(null, coll__6398, k, not_found)
  };
  G__6416 = function(tsym6387, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6416__2.call(this, tsym6387, k);
      case 3:
        return G__6416__3.call(this, tsym6387, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6416
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6384, args6385) {
  return tsym6384.call.apply(tsym6384, [tsym6384].concat(cljs.core.aclone.call(null, args6385)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6399 = this;
  return new cljs.core.PersistentTreeSet(this__6399.meta, cljs.core.assoc.call(null, this__6399.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6400 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6400.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6401 = this;
  var this$__6402 = this;
  return cljs.core.pr_str.call(null, this$__6402)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6403 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6403.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6404 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6404.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6405 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6406 = this;
  return cljs.core._comparator.call(null, this__6406.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6407 = this;
  return cljs.core.keys.call(null, this__6407.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6408 = this;
  return new cljs.core.PersistentTreeSet(this__6408.meta, cljs.core.dissoc.call(null, this__6408.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6409 = this;
  return cljs.core.count.call(null, this__6409.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6410 = this;
  var and__3546__auto____6411 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6411) {
    var and__3546__auto____6412 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6412) {
      return cljs.core.every_QMARK_.call(null, function(p1__6366_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6366_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6412
    }
  }else {
    return and__3546__auto____6411
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6413 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6413.tree_map, this__6413.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6414 = this;
  return this__6414.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6415 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6415.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6417 = cljs.core.seq.call(null, coll);
  var out__6418 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6417))) {
      var G__6419 = cljs.core.next.call(null, in$__6417);
      var G__6420 = cljs.core.conj_BANG_.call(null, out__6418, cljs.core.first.call(null, in$__6417));
      in$__6417 = G__6419;
      out__6418 = G__6420;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6418)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6421) {
    var keys = cljs.core.seq(arglist__6421);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6423) {
    var comparator = cljs.core.first(arglist__6423);
    var keys = cljs.core.rest(arglist__6423);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6424 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____6425 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____6425)) {
        var e__6426 = temp__3695__auto____6425;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6426))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6424, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6422_SHARP_) {
      var temp__3695__auto____6427 = cljs.core.find.call(null, smap, p1__6422_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____6427)) {
        var e__6428 = temp__3695__auto____6427;
        return cljs.core.second.call(null, e__6428)
      }else {
        return p1__6422_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6436 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6429, seen) {
        while(true) {
          var vec__6430__6431 = p__6429;
          var f__6432 = cljs.core.nth.call(null, vec__6430__6431, 0, null);
          var xs__6433 = vec__6430__6431;
          var temp__3698__auto____6434 = cljs.core.seq.call(null, xs__6433);
          if(cljs.core.truth_(temp__3698__auto____6434)) {
            var s__6435 = temp__3698__auto____6434;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6432)) {
              var G__6437 = cljs.core.rest.call(null, s__6435);
              var G__6438 = seen;
              p__6429 = G__6437;
              seen = G__6438;
              continue
            }else {
              return cljs.core.cons.call(null, f__6432, step.call(null, cljs.core.rest.call(null, s__6435), cljs.core.conj.call(null, seen, f__6432)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6436.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6439 = cljs.core.PersistentVector.fromArray([]);
  var s__6440 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6440))) {
      var G__6441 = cljs.core.conj.call(null, ret__6439, cljs.core.first.call(null, s__6440));
      var G__6442 = cljs.core.next.call(null, s__6440);
      ret__6439 = G__6441;
      s__6440 = G__6442;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6439)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____6443 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____6443) {
        return or__3548__auto____6443
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6444 = x.lastIndexOf("/");
      if(i__6444 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6444 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3548__auto____6445 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____6445) {
      return or__3548__auto____6445
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6446 = x.lastIndexOf("/");
    if(i__6446 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6446)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6449 = cljs.core.ObjMap.fromObject([], {});
  var ks__6450 = cljs.core.seq.call(null, keys);
  var vs__6451 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6452 = ks__6450;
      if(cljs.core.truth_(and__3546__auto____6452)) {
        return vs__6451
      }else {
        return and__3546__auto____6452
      }
    }())) {
      var G__6453 = cljs.core.assoc.call(null, map__6449, cljs.core.first.call(null, ks__6450), cljs.core.first.call(null, vs__6451));
      var G__6454 = cljs.core.next.call(null, ks__6450);
      var G__6455 = cljs.core.next.call(null, vs__6451);
      map__6449 = G__6453;
      ks__6450 = G__6454;
      vs__6451 = G__6455;
      continue
    }else {
      return map__6449
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6458__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6447_SHARP_, p2__6448_SHARP_) {
        return max_key.call(null, k, p1__6447_SHARP_, p2__6448_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6458 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6458__delegate.call(this, k, x, y, more)
    };
    G__6458.cljs$lang$maxFixedArity = 3;
    G__6458.cljs$lang$applyTo = function(arglist__6459) {
      var k = cljs.core.first(arglist__6459);
      var x = cljs.core.first(cljs.core.next(arglist__6459));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6459)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6459)));
      return G__6458__delegate(k, x, y, more)
    };
    G__6458.cljs$lang$arity$variadic = G__6458__delegate;
    return G__6458
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6460__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6456_SHARP_, p2__6457_SHARP_) {
        return min_key.call(null, k, p1__6456_SHARP_, p2__6457_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6460 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6460__delegate.call(this, k, x, y, more)
    };
    G__6460.cljs$lang$maxFixedArity = 3;
    G__6460.cljs$lang$applyTo = function(arglist__6461) {
      var k = cljs.core.first(arglist__6461);
      var x = cljs.core.first(cljs.core.next(arglist__6461));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6461)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6461)));
      return G__6460__delegate(k, x, y, more)
    };
    G__6460.cljs$lang$arity$variadic = G__6460__delegate;
    return G__6460
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6462 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6462)) {
        var s__6463 = temp__3698__auto____6462;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6463), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6463)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6464 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6464)) {
      var s__6465 = temp__3698__auto____6464;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6465)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6465), take_while.call(null, pred, cljs.core.rest.call(null, s__6465)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6466 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6466.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6467 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____6468 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____6468)) {
        var vec__6469__6470 = temp__3698__auto____6468;
        var e__6471 = cljs.core.nth.call(null, vec__6469__6470, 0, null);
        var s__6472 = vec__6469__6470;
        if(cljs.core.truth_(include__6467.call(null, e__6471))) {
          return s__6472
        }else {
          return cljs.core.next.call(null, s__6472)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6467, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6473 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____6473)) {
      var vec__6474__6475 = temp__3698__auto____6473;
      var e__6476 = cljs.core.nth.call(null, vec__6474__6475, 0, null);
      var s__6477 = vec__6474__6475;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6476)) ? s__6477 : cljs.core.next.call(null, s__6477))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6478 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____6479 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____6479)) {
        var vec__6480__6481 = temp__3698__auto____6479;
        var e__6482 = cljs.core.nth.call(null, vec__6480__6481, 0, null);
        var s__6483 = vec__6480__6481;
        if(cljs.core.truth_(include__6478.call(null, e__6482))) {
          return s__6483
        }else {
          return cljs.core.next.call(null, s__6483)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6478, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6484 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____6484)) {
      var vec__6485__6486 = temp__3698__auto____6484;
      var e__6487 = cljs.core.nth.call(null, vec__6485__6486, 0, null);
      var s__6488 = vec__6485__6486;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6487)) ? s__6488 : cljs.core.next.call(null, s__6488))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6489 = this;
  var h__364__auto____6490 = this__6489.__hash;
  if(h__364__auto____6490 != null) {
    return h__364__auto____6490
  }else {
    var h__364__auto____6491 = cljs.core.hash_coll.call(null, rng);
    this__6489.__hash = h__364__auto____6491;
    return h__364__auto____6491
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6492 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6493 = this;
  var this$__6494 = this;
  return cljs.core.pr_str.call(null, this$__6494)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6495 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6496 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6497 = this;
  var comp__6498 = this__6497.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6498.call(null, this__6497.start, this__6497.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6499 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6499.end - this__6499.start) / this__6499.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6500 = this;
  return this__6500.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6501 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6501.meta, this__6501.start + this__6501.step, this__6501.end, this__6501.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6502 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6503 = this;
  return new cljs.core.Range(meta, this__6503.start, this__6503.end, this__6503.step, this__6503.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6504 = this;
  return this__6504.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6505 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6505.start + n * this__6505.step
  }else {
    if(function() {
      var and__3546__auto____6506 = this__6505.start > this__6505.end;
      if(and__3546__auto____6506) {
        return this__6505.step === 0
      }else {
        return and__3546__auto____6506
      }
    }()) {
      return this__6505.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6507 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6507.start + n * this__6507.step
  }else {
    if(function() {
      var and__3546__auto____6508 = this__6507.start > this__6507.end;
      if(and__3546__auto____6508) {
        return this__6507.step === 0
      }else {
        return and__3546__auto____6508
      }
    }()) {
      return this__6507.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6509 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6509.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6510 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6510)) {
      var s__6511 = temp__3698__auto____6510;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6511), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6511)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6513 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6513)) {
      var s__6514 = temp__3698__auto____6513;
      var fst__6515 = cljs.core.first.call(null, s__6514);
      var fv__6516 = f.call(null, fst__6515);
      var run__6517 = cljs.core.cons.call(null, fst__6515, cljs.core.take_while.call(null, function(p1__6512_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6516, f.call(null, p1__6512_SHARP_))
      }, cljs.core.next.call(null, s__6514)));
      return cljs.core.cons.call(null, run__6517, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6517), s__6514))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____6528 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____6528)) {
        var s__6529 = temp__3695__auto____6528;
        return reductions.call(null, f, cljs.core.first.call(null, s__6529), cljs.core.rest.call(null, s__6529))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6530 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6530)) {
        var s__6531 = temp__3698__auto____6530;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6531)), cljs.core.rest.call(null, s__6531))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6533 = null;
      var G__6533__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6533__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6533__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6533__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6533__4 = function() {
        var G__6534__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6534 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6534__delegate.call(this, x, y, z, args)
        };
        G__6534.cljs$lang$maxFixedArity = 3;
        G__6534.cljs$lang$applyTo = function(arglist__6535) {
          var x = cljs.core.first(arglist__6535);
          var y = cljs.core.first(cljs.core.next(arglist__6535));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6535)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6535)));
          return G__6534__delegate(x, y, z, args)
        };
        G__6534.cljs$lang$arity$variadic = G__6534__delegate;
        return G__6534
      }();
      G__6533 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6533__0.call(this);
          case 1:
            return G__6533__1.call(this, x);
          case 2:
            return G__6533__2.call(this, x, y);
          case 3:
            return G__6533__3.call(this, x, y, z);
          default:
            return G__6533__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6533.cljs$lang$maxFixedArity = 3;
      G__6533.cljs$lang$applyTo = G__6533__4.cljs$lang$applyTo;
      return G__6533
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6536 = null;
      var G__6536__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6536__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6536__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6536__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6536__4 = function() {
        var G__6537__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6537 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6537__delegate.call(this, x, y, z, args)
        };
        G__6537.cljs$lang$maxFixedArity = 3;
        G__6537.cljs$lang$applyTo = function(arglist__6538) {
          var x = cljs.core.first(arglist__6538);
          var y = cljs.core.first(cljs.core.next(arglist__6538));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6538)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6538)));
          return G__6537__delegate(x, y, z, args)
        };
        G__6537.cljs$lang$arity$variadic = G__6537__delegate;
        return G__6537
      }();
      G__6536 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6536__0.call(this);
          case 1:
            return G__6536__1.call(this, x);
          case 2:
            return G__6536__2.call(this, x, y);
          case 3:
            return G__6536__3.call(this, x, y, z);
          default:
            return G__6536__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6536.cljs$lang$maxFixedArity = 3;
      G__6536.cljs$lang$applyTo = G__6536__4.cljs$lang$applyTo;
      return G__6536
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6539 = null;
      var G__6539__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6539__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6539__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6539__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6539__4 = function() {
        var G__6540__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6540 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6540__delegate.call(this, x, y, z, args)
        };
        G__6540.cljs$lang$maxFixedArity = 3;
        G__6540.cljs$lang$applyTo = function(arglist__6541) {
          var x = cljs.core.first(arglist__6541);
          var y = cljs.core.first(cljs.core.next(arglist__6541));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6541)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6541)));
          return G__6540__delegate(x, y, z, args)
        };
        G__6540.cljs$lang$arity$variadic = G__6540__delegate;
        return G__6540
      }();
      G__6539 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6539__0.call(this);
          case 1:
            return G__6539__1.call(this, x);
          case 2:
            return G__6539__2.call(this, x, y);
          case 3:
            return G__6539__3.call(this, x, y, z);
          default:
            return G__6539__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6539.cljs$lang$maxFixedArity = 3;
      G__6539.cljs$lang$applyTo = G__6539__4.cljs$lang$applyTo;
      return G__6539
    }()
  };
  var juxt__4 = function() {
    var G__6542__delegate = function(f, g, h, fs) {
      var fs__6532 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6543 = null;
        var G__6543__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6518_SHARP_, p2__6519_SHARP_) {
            return cljs.core.conj.call(null, p1__6518_SHARP_, p2__6519_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6532)
        };
        var G__6543__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6520_SHARP_, p2__6521_SHARP_) {
            return cljs.core.conj.call(null, p1__6520_SHARP_, p2__6521_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6532)
        };
        var G__6543__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6522_SHARP_, p2__6523_SHARP_) {
            return cljs.core.conj.call(null, p1__6522_SHARP_, p2__6523_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6532)
        };
        var G__6543__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6524_SHARP_, p2__6525_SHARP_) {
            return cljs.core.conj.call(null, p1__6524_SHARP_, p2__6525_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6532)
        };
        var G__6543__4 = function() {
          var G__6544__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6526_SHARP_, p2__6527_SHARP_) {
              return cljs.core.conj.call(null, p1__6526_SHARP_, cljs.core.apply.call(null, p2__6527_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6532)
          };
          var G__6544 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6544__delegate.call(this, x, y, z, args)
          };
          G__6544.cljs$lang$maxFixedArity = 3;
          G__6544.cljs$lang$applyTo = function(arglist__6545) {
            var x = cljs.core.first(arglist__6545);
            var y = cljs.core.first(cljs.core.next(arglist__6545));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6545)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6545)));
            return G__6544__delegate(x, y, z, args)
          };
          G__6544.cljs$lang$arity$variadic = G__6544__delegate;
          return G__6544
        }();
        G__6543 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6543__0.call(this);
            case 1:
              return G__6543__1.call(this, x);
            case 2:
              return G__6543__2.call(this, x, y);
            case 3:
              return G__6543__3.call(this, x, y, z);
            default:
              return G__6543__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6543.cljs$lang$maxFixedArity = 3;
        G__6543.cljs$lang$applyTo = G__6543__4.cljs$lang$applyTo;
        return G__6543
      }()
    };
    var G__6542 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6542__delegate.call(this, f, g, h, fs)
    };
    G__6542.cljs$lang$maxFixedArity = 3;
    G__6542.cljs$lang$applyTo = function(arglist__6546) {
      var f = cljs.core.first(arglist__6546);
      var g = cljs.core.first(cljs.core.next(arglist__6546));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6546)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6546)));
      return G__6542__delegate(f, g, h, fs)
    };
    G__6542.cljs$lang$arity$variadic = G__6542__delegate;
    return G__6542
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6548 = cljs.core.next.call(null, coll);
        coll = G__6548;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____6547 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____6547)) {
          return n > 0
        }else {
          return and__3546__auto____6547
        }
      }())) {
        var G__6549 = n - 1;
        var G__6550 = cljs.core.next.call(null, coll);
        n = G__6549;
        coll = G__6550;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6551 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6551), s)) {
    if(cljs.core.count.call(null, matches__6551) === 1) {
      return cljs.core.first.call(null, matches__6551)
    }else {
      return cljs.core.vec.call(null, matches__6551)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6552 = re.exec(s);
  if(matches__6552 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6552) === 1) {
      return cljs.core.first.call(null, matches__6552)
    }else {
      return cljs.core.vec.call(null, matches__6552)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6553 = cljs.core.re_find.call(null, re, s);
  var match_idx__6554 = s.search(re);
  var match_str__6555 = cljs.core.coll_QMARK_.call(null, match_data__6553) ? cljs.core.first.call(null, match_data__6553) : match_data__6553;
  var post_match__6556 = cljs.core.subs.call(null, s, match_idx__6554 + cljs.core.count.call(null, match_str__6555));
  if(cljs.core.truth_(match_data__6553)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6553, re_seq.call(null, re, post_match__6556))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6558__6559 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6560 = cljs.core.nth.call(null, vec__6558__6559, 0, null);
  var flags__6561 = cljs.core.nth.call(null, vec__6558__6559, 1, null);
  var pattern__6562 = cljs.core.nth.call(null, vec__6558__6559, 2, null);
  return new RegExp(pattern__6562, flags__6561)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6557_SHARP_) {
    return print_one.call(null, p1__6557_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____6563 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____6563)) {
            var and__3546__auto____6567 = function() {
              var G__6564__6565 = obj;
              if(G__6564__6565 != null) {
                if(function() {
                  var or__3548__auto____6566 = G__6564__6565.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____6566) {
                    return or__3548__auto____6566
                  }else {
                    return G__6564__6565.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6564__6565.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6564__6565)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6564__6565)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____6567)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____6567
            }
          }else {
            return and__3546__auto____6563
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____6568 = obj != null;
          if(and__3546__auto____6568) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____6568
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6569__6570 = obj;
          if(G__6569__6570 != null) {
            if(function() {
              var or__3548__auto____6571 = G__6569__6570.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____6571) {
                return or__3548__auto____6571
              }else {
                return G__6569__6570.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6569__6570.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6569__6570)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6569__6570)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6572 = cljs.core.first.call(null, objs);
  var sb__6573 = new goog.string.StringBuffer;
  var G__6574__6575 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6574__6575)) {
    var obj__6576 = cljs.core.first.call(null, G__6574__6575);
    var G__6574__6577 = G__6574__6575;
    while(true) {
      if(obj__6576 === first_obj__6572) {
      }else {
        sb__6573.append(" ")
      }
      var G__6578__6579 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6576, opts));
      if(cljs.core.truth_(G__6578__6579)) {
        var string__6580 = cljs.core.first.call(null, G__6578__6579);
        var G__6578__6581 = G__6578__6579;
        while(true) {
          sb__6573.append(string__6580);
          var temp__3698__auto____6582 = cljs.core.next.call(null, G__6578__6581);
          if(cljs.core.truth_(temp__3698__auto____6582)) {
            var G__6578__6583 = temp__3698__auto____6582;
            var G__6586 = cljs.core.first.call(null, G__6578__6583);
            var G__6587 = G__6578__6583;
            string__6580 = G__6586;
            G__6578__6581 = G__6587;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6584 = cljs.core.next.call(null, G__6574__6577);
      if(cljs.core.truth_(temp__3698__auto____6584)) {
        var G__6574__6585 = temp__3698__auto____6584;
        var G__6588 = cljs.core.first.call(null, G__6574__6585);
        var G__6589 = G__6574__6585;
        obj__6576 = G__6588;
        G__6574__6577 = G__6589;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6573
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6590 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6590.append("\n");
  return[cljs.core.str(sb__6590)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6591 = cljs.core.first.call(null, objs);
  var G__6592__6593 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6592__6593)) {
    var obj__6594 = cljs.core.first.call(null, G__6592__6593);
    var G__6592__6595 = G__6592__6593;
    while(true) {
      if(obj__6594 === first_obj__6591) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6596__6597 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6594, opts));
      if(cljs.core.truth_(G__6596__6597)) {
        var string__6598 = cljs.core.first.call(null, G__6596__6597);
        var G__6596__6599 = G__6596__6597;
        while(true) {
          cljs.core.string_print.call(null, string__6598);
          var temp__3698__auto____6600 = cljs.core.next.call(null, G__6596__6599);
          if(cljs.core.truth_(temp__3698__auto____6600)) {
            var G__6596__6601 = temp__3698__auto____6600;
            var G__6604 = cljs.core.first.call(null, G__6596__6601);
            var G__6605 = G__6596__6601;
            string__6598 = G__6604;
            G__6596__6599 = G__6605;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6602 = cljs.core.next.call(null, G__6592__6595);
      if(cljs.core.truth_(temp__3698__auto____6602)) {
        var G__6592__6603 = temp__3698__auto____6602;
        var G__6606 = cljs.core.first.call(null, G__6592__6603);
        var G__6607 = G__6592__6603;
        obj__6594 = G__6606;
        G__6592__6595 = G__6607;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6608) {
    var objs = cljs.core.seq(arglist__6608);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6609) {
    var objs = cljs.core.seq(arglist__6609);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6610) {
    var objs = cljs.core.seq(arglist__6610);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6611) {
    var objs = cljs.core.seq(arglist__6611);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6612) {
    var objs = cljs.core.seq(arglist__6612);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6613) {
    var objs = cljs.core.seq(arglist__6613);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6614) {
    var objs = cljs.core.seq(arglist__6614);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6615) {
    var objs = cljs.core.seq(arglist__6615);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6616 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6616, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6617 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6617, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6618 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6618, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3698__auto____6619 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____6619)) {
        var nspc__6620 = temp__3698__auto____6619;
        return[cljs.core.str(nspc__6620), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____6621 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____6621)) {
          var nspc__6622 = temp__3698__auto____6621;
          return[cljs.core.str(nspc__6622), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6623 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6623, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6624 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6624, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6625 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6626 = this;
  var G__6627__6628 = cljs.core.seq.call(null, this__6626.watches);
  if(cljs.core.truth_(G__6627__6628)) {
    var G__6630__6632 = cljs.core.first.call(null, G__6627__6628);
    var vec__6631__6633 = G__6630__6632;
    var key__6634 = cljs.core.nth.call(null, vec__6631__6633, 0, null);
    var f__6635 = cljs.core.nth.call(null, vec__6631__6633, 1, null);
    var G__6627__6636 = G__6627__6628;
    var G__6630__6637 = G__6630__6632;
    var G__6627__6638 = G__6627__6636;
    while(true) {
      var vec__6639__6640 = G__6630__6637;
      var key__6641 = cljs.core.nth.call(null, vec__6639__6640, 0, null);
      var f__6642 = cljs.core.nth.call(null, vec__6639__6640, 1, null);
      var G__6627__6643 = G__6627__6638;
      f__6642.call(null, key__6641, this$, oldval, newval);
      var temp__3698__auto____6644 = cljs.core.next.call(null, G__6627__6643);
      if(cljs.core.truth_(temp__3698__auto____6644)) {
        var G__6627__6645 = temp__3698__auto____6644;
        var G__6652 = cljs.core.first.call(null, G__6627__6645);
        var G__6653 = G__6627__6645;
        G__6630__6637 = G__6652;
        G__6627__6638 = G__6653;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6646 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6646.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6647 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6647.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6648 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6648.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6649 = this;
  return this__6649.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6650 = this;
  return this__6650.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6651 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6660__delegate = function(x, p__6654) {
      var map__6655__6656 = p__6654;
      var map__6655__6657 = cljs.core.seq_QMARK_.call(null, map__6655__6656) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6655__6656) : map__6655__6656;
      var validator__6658 = cljs.core.get.call(null, map__6655__6657, "\ufdd0'validator");
      var meta__6659 = cljs.core.get.call(null, map__6655__6657, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6659, validator__6658, null)
    };
    var G__6660 = function(x, var_args) {
      var p__6654 = null;
      if(goog.isDef(var_args)) {
        p__6654 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6660__delegate.call(this, x, p__6654)
    };
    G__6660.cljs$lang$maxFixedArity = 1;
    G__6660.cljs$lang$applyTo = function(arglist__6661) {
      var x = cljs.core.first(arglist__6661);
      var p__6654 = cljs.core.rest(arglist__6661);
      return G__6660__delegate(x, p__6654)
    };
    G__6660.cljs$lang$arity$variadic = G__6660__delegate;
    return G__6660
  }();
  atom = function(x, var_args) {
    var p__6654 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____6662 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____6662)) {
    var validate__6663 = temp__3698__auto____6662;
    if(cljs.core.truth_(validate__6663.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6664 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6664, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6665__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6665 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6665__delegate.call(this, a, f, x, y, z, more)
    };
    G__6665.cljs$lang$maxFixedArity = 5;
    G__6665.cljs$lang$applyTo = function(arglist__6666) {
      var a = cljs.core.first(arglist__6666);
      var f = cljs.core.first(cljs.core.next(arglist__6666));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6666)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6666))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6666)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6666)))));
      return G__6665__delegate(a, f, x, y, z, more)
    };
    G__6665.cljs$lang$arity$variadic = G__6665__delegate;
    return G__6665
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6667) {
    var iref = cljs.core.first(arglist__6667);
    var f = cljs.core.first(cljs.core.next(arglist__6667));
    var args = cljs.core.rest(cljs.core.next(arglist__6667));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6668 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6668.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6669 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6669.state, function(p__6670) {
    var curr_state__6671 = p__6670;
    var curr_state__6672 = cljs.core.seq_QMARK_.call(null, curr_state__6671) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6671) : curr_state__6671;
    var done__6673 = cljs.core.get.call(null, curr_state__6672, "\ufdd0'done");
    if(cljs.core.truth_(done__6673)) {
      return curr_state__6672
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6669.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__6674__6675 = options;
    var map__6674__6676 = cljs.core.seq_QMARK_.call(null, map__6674__6675) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6674__6675) : map__6674__6675;
    var keywordize_keys__6677 = cljs.core.get.call(null, map__6674__6676, "\ufdd0'keywordize-keys");
    var keyfn__6678 = cljs.core.truth_(keywordize_keys__6677) ? cljs.core.keyword : cljs.core.str;
    var f__6684 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____6683 = function iter__6679(s__6680) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6680__6681 = s__6680;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6680__6681))) {
                        var k__6682 = cljs.core.first.call(null, s__6680__6681);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6678.call(null, k__6682), thisfn.call(null, x[k__6682])]), iter__6679.call(null, cljs.core.rest.call(null, s__6680__6681)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____6683.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6684.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6685) {
    var x = cljs.core.first(arglist__6685);
    var options = cljs.core.rest(arglist__6685);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6686 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6690__delegate = function(args) {
      var temp__3695__auto____6687 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6686), args);
      if(cljs.core.truth_(temp__3695__auto____6687)) {
        var v__6688 = temp__3695__auto____6687;
        return v__6688
      }else {
        var ret__6689 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6686, cljs.core.assoc, args, ret__6689);
        return ret__6689
      }
    };
    var G__6690 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6690__delegate.call(this, args)
    };
    G__6690.cljs$lang$maxFixedArity = 0;
    G__6690.cljs$lang$applyTo = function(arglist__6691) {
      var args = cljs.core.seq(arglist__6691);
      return G__6690__delegate(args)
    };
    G__6690.cljs$lang$arity$variadic = G__6690__delegate;
    return G__6690
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6692 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6692)) {
        var G__6693 = ret__6692;
        f = G__6693;
        continue
      }else {
        return ret__6692
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6694__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6694 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6694__delegate.call(this, f, args)
    };
    G__6694.cljs$lang$maxFixedArity = 1;
    G__6694.cljs$lang$applyTo = function(arglist__6695) {
      var f = cljs.core.first(arglist__6695);
      var args = cljs.core.rest(arglist__6695);
      return G__6694__delegate(f, args)
    };
    G__6694.cljs$lang$arity$variadic = G__6694__delegate;
    return G__6694
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6696 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6696, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6696, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3548__auto____6697 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____6697) {
      return or__3548__auto____6697
    }else {
      var or__3548__auto____6698 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____6698) {
        return or__3548__auto____6698
      }else {
        var and__3546__auto____6699 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____6699) {
          var and__3546__auto____6700 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____6700) {
            var and__3546__auto____6701 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____6701) {
              var ret__6702 = true;
              var i__6703 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____6704 = cljs.core.not.call(null, ret__6702);
                  if(or__3548__auto____6704) {
                    return or__3548__auto____6704
                  }else {
                    return i__6703 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6702
                }else {
                  var G__6705 = isa_QMARK_.call(null, h, child.call(null, i__6703), parent.call(null, i__6703));
                  var G__6706 = i__6703 + 1;
                  ret__6702 = G__6705;
                  i__6703 = G__6706;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____6701
            }
          }else {
            return and__3546__auto____6700
          }
        }else {
          return and__3546__auto____6699
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__6710 = "\ufdd0'parents".call(null, h);
    var td__6711 = "\ufdd0'descendants".call(null, h);
    var ta__6712 = "\ufdd0'ancestors".call(null, h);
    var tf__6713 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____6714 = cljs.core.contains_QMARK_.call(null, tp__6710.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6712.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6712.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6710, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6713.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6711, parent, ta__6712), "\ufdd0'descendants":tf__6713.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6712, tag, td__6711)})
    }();
    if(cljs.core.truth_(or__3548__auto____6714)) {
      return or__3548__auto____6714
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6715 = "\ufdd0'parents".call(null, h);
    var childsParents__6716 = cljs.core.truth_(parentMap__6715.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6715.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6717 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6716)) ? cljs.core.assoc.call(null, parentMap__6715, tag, childsParents__6716) : cljs.core.dissoc.call(null, parentMap__6715, tag);
    var deriv_seq__6718 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6707_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6707_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6707_SHARP_), cljs.core.second.call(null, p1__6707_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6717)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6715.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6708_SHARP_, p2__6709_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6708_SHARP_, p2__6709_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6718))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__6719 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____6721 = cljs.core.truth_(function() {
    var and__3546__auto____6720 = xprefs__6719;
    if(cljs.core.truth_(and__3546__auto____6720)) {
      return xprefs__6719.call(null, y)
    }else {
      return and__3546__auto____6720
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____6721)) {
    return or__3548__auto____6721
  }else {
    var or__3548__auto____6723 = function() {
      var ps__6722 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6722) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6722), prefer_table))) {
          }else {
          }
          var G__6726 = cljs.core.rest.call(null, ps__6722);
          ps__6722 = G__6726;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____6723)) {
      return or__3548__auto____6723
    }else {
      var or__3548__auto____6725 = function() {
        var ps__6724 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6724) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6724), y, prefer_table))) {
            }else {
            }
            var G__6727 = cljs.core.rest.call(null, ps__6724);
            ps__6724 = G__6727;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____6725)) {
        return or__3548__auto____6725
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____6728 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____6728)) {
    return or__3548__auto____6728
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6737 = cljs.core.reduce.call(null, function(be, p__6729) {
    var vec__6730__6731 = p__6729;
    var k__6732 = cljs.core.nth.call(null, vec__6730__6731, 0, null);
    var ___6733 = cljs.core.nth.call(null, vec__6730__6731, 1, null);
    var e__6734 = vec__6730__6731;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6732)) {
      var be2__6736 = cljs.core.truth_(function() {
        var or__3548__auto____6735 = be == null;
        if(or__3548__auto____6735) {
          return or__3548__auto____6735
        }else {
          return cljs.core.dominates.call(null, k__6732, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6734 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6736), k__6732, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6732), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6736)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6736
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6737)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6737));
      return cljs.core.second.call(null, best_entry__6737)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3546__auto____6738 = mf;
    if(and__3546__auto____6738) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____6738
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6739 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6739) {
        return or__3548__auto____6739
      }else {
        var or__3548__auto____6740 = cljs.core._reset["_"];
        if(or__3548__auto____6740) {
          return or__3548__auto____6740
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____6741 = mf;
    if(and__3546__auto____6741) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____6741
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____6742 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6742) {
        return or__3548__auto____6742
      }else {
        var or__3548__auto____6743 = cljs.core._add_method["_"];
        if(or__3548__auto____6743) {
          return or__3548__auto____6743
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6744 = mf;
    if(and__3546__auto____6744) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____6744
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6745 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6745) {
        return or__3548__auto____6745
      }else {
        var or__3548__auto____6746 = cljs.core._remove_method["_"];
        if(or__3548__auto____6746) {
          return or__3548__auto____6746
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____6747 = mf;
    if(and__3546__auto____6747) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____6747
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____6748 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6748) {
        return or__3548__auto____6748
      }else {
        var or__3548__auto____6749 = cljs.core._prefer_method["_"];
        if(or__3548__auto____6749) {
          return or__3548__auto____6749
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6750 = mf;
    if(and__3546__auto____6750) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____6750
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6751 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6751) {
        return or__3548__auto____6751
      }else {
        var or__3548__auto____6752 = cljs.core._get_method["_"];
        if(or__3548__auto____6752) {
          return or__3548__auto____6752
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____6753 = mf;
    if(and__3546__auto____6753) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____6753
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6754 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6754) {
        return or__3548__auto____6754
      }else {
        var or__3548__auto____6755 = cljs.core._methods["_"];
        if(or__3548__auto____6755) {
          return or__3548__auto____6755
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____6756 = mf;
    if(and__3546__auto____6756) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____6756
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6757 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6757) {
        return or__3548__auto____6757
      }else {
        var or__3548__auto____6758 = cljs.core._prefers["_"];
        if(or__3548__auto____6758) {
          return or__3548__auto____6758
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____6759 = mf;
    if(and__3546__auto____6759) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____6759
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____6760 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6760) {
        return or__3548__auto____6760
      }else {
        var or__3548__auto____6761 = cljs.core._dispatch["_"];
        if(or__3548__auto____6761) {
          return or__3548__auto____6761
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6762 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6763 = cljs.core._get_method.call(null, mf, dispatch_val__6762);
  if(cljs.core.truth_(target_fn__6763)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6762)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6763, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6764 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6765 = this;
  cljs.core.swap_BANG_.call(null, this__6765.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6765.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6765.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6765.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6766 = this;
  cljs.core.swap_BANG_.call(null, this__6766.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6766.method_cache, this__6766.method_table, this__6766.cached_hierarchy, this__6766.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6767 = this;
  cljs.core.swap_BANG_.call(null, this__6767.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6767.method_cache, this__6767.method_table, this__6767.cached_hierarchy, this__6767.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6768 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6768.cached_hierarchy), cljs.core.deref.call(null, this__6768.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6768.method_cache, this__6768.method_table, this__6768.cached_hierarchy, this__6768.hierarchy)
  }
  var temp__3695__auto____6769 = cljs.core.deref.call(null, this__6768.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____6769)) {
    var target_fn__6770 = temp__3695__auto____6769;
    return target_fn__6770
  }else {
    var temp__3695__auto____6771 = cljs.core.find_and_cache_best_method.call(null, this__6768.name, dispatch_val, this__6768.hierarchy, this__6768.method_table, this__6768.prefer_table, this__6768.method_cache, this__6768.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____6771)) {
      var target_fn__6772 = temp__3695__auto____6771;
      return target_fn__6772
    }else {
      return cljs.core.deref.call(null, this__6768.method_table).call(null, this__6768.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6773 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6773.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6773.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6773.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6773.method_cache, this__6773.method_table, this__6773.cached_hierarchy, this__6773.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6774 = this;
  return cljs.core.deref.call(null, this__6774.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6775 = this;
  return cljs.core.deref.call(null, this__6775.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6776 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6776.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6777__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6777 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6777__delegate.call(this, _, args)
  };
  G__6777.cljs$lang$maxFixedArity = 1;
  G__6777.cljs$lang$applyTo = function(arglist__6778) {
    var _ = cljs.core.first(arglist__6778);
    var args = cljs.core.rest(arglist__6778);
    return G__6777__delegate(_, args)
  };
  G__6777.cljs$lang$arity$variadic = G__6777__delegate;
  return G__6777
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("popup");
goog.require("cljs.core");
popup.foo = function foo() {
  return popup.log.call(null, "Hello world")
};
goog.exportSymbol("popup.foo", popup.foo);
goog.provide("content");
goog.require("cljs.core");
content.foo = function foo() {
  return content.log.call(null, "Hello world")
};
goog.exportSymbol("content.foo", content.foo);
